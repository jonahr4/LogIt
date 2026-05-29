/**
 * Log It — GET /api/users/profile?id={userId}
 * Returns user profile with friendship status and mutual friends.
 * Used by the UserProfileModal.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth, type AuthenticatedRequest } from '../../server-lib/auth';
import { getSupabaseAdmin } from '../../server-lib/supabase-admin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET allowed', status: 405 },
    });
  }

  const authReq = req as AuthenticatedRequest;
  const isAuthenticated = await verifyAuth(authReq, res);
  if (!isAuthenticated) return;

  const targetId = req.query.id as string;
  if (!targetId) {
    return res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: 'id query parameter is required', status: 422 },
    });
  }

  const supabase = getSupabaseAdmin();

  try {
    // Look up current user
    const { data: currentUser } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', authReq.firebaseUid!)
      .single();

    if (!currentUser) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Current user not found', status: 404 },
      });
    }

    const isSelf = currentUser.id === targetId;

    // Fetch target user
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, username, display_name, first_name, last_name, avatar_url, bio, created_at')
      .eq('id', targetId)
      .single();

    if (userError || !targetUser) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'User not found', status: 404 },
      });
    }

    // If self, return simple response
    if (isSelf) {
      return res.status(200).json({
        user: targetUser,
        friendship: null,
        mutual_friends: [],
        mutual_friends_count: 0,
        is_self: true,
      });
    }

    // Fetch friendship between current user and target
    const { data: friendship } = await supabase
      .from('friendships')
      .select('id, requester_id, addressee_id, status, created_at, updated_at')
      .or(
        `and(requester_id.eq.${currentUser.id},addressee_id.eq.${targetId}),` +
        `and(requester_id.eq.${targetId},addressee_id.eq.${currentUser.id})`
      )
      .maybeSingle();

    let friendshipResponse = null;
    if (friendship) {
      let status = friendship.status;
      if (status === 'pending') {
        status = friendship.requester_id === currentUser.id ? 'pending_outgoing' : 'pending_incoming';
      }
      friendshipResponse = {
        friendship_id: friendship.id,
        status,
        since: friendship.status === 'accepted' ? (friendship.updated_at || friendship.created_at) : null,
      };
    }

    // Fetch mutual friends
    // Get current user's accepted friends
    const { data: myFriendships } = await supabase
      .from('friendships')
      .select('requester_id, addressee_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${currentUser.id},addressee_id.eq.${currentUser.id}`);

    const myFriendIds = new Set(
      (myFriendships || []).map(f =>
        f.requester_id === currentUser.id ? f.addressee_id : f.requester_id
      )
    );

    // Get target user's accepted friends
    const { data: theirFriendships } = await supabase
      .from('friendships')
      .select('requester_id, addressee_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${targetId},addressee_id.eq.${targetId}`);

    const theirFriendIds = new Set(
      (theirFriendships || []).map(f =>
        f.requester_id === targetId ? f.addressee_id : f.requester_id
      )
    );

    // Intersection = mutual friends (exclude self and target)
    const mutualIds = [...myFriendIds].filter(
      id => theirFriendIds.has(id) && id !== currentUser.id && id !== targetId
    );

    // Fetch mutual friend details (up to 10 for display)
    let mutualFriends: any[] = [];
    if (mutualIds.length > 0) {
      const { data: mutualUsers } = await supabase
        .from('users')
        .select('id, username, display_name, avatar_url')
        .in('id', mutualIds.slice(0, 10));

      mutualFriends = mutualUsers || [];
    }

    return res.status(200).json({
      user: targetUser,
      friendship: friendshipResponse,
      mutual_friends: mutualFriends,
      mutual_friends_count: mutualIds.length,
      is_self: false,
    });
  } catch (error: any) {
    console.error('User profile error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message || 'Failed to fetch profile', status: 500 },
    });
  }
}
