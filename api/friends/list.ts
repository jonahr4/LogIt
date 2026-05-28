/**
 * Log It — GET /api/friends/list
 * Returns accepted friends (with mutual friend count), incoming requests, and outgoing requests.
 * Auth required.
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

  const supabase = getSupabaseAdmin();

  try {
    // Look up current user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', authReq.firebaseUid!)
      .single();

    if (userError || !user) {
      return res.status(200).json({ friends: [], incoming: [], outgoing: [] });
    }

    // Fetch ALL friendships involving this user
    const { data: allFriendships, error: friendError } = await supabase
      .from('friendships')
      .select('id, requester_id, addressee_id, status, created_at, updated_at')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .in('status', ['pending', 'accepted']);

    if (friendError) throw friendError;

    const accepted: any[] = [];
    const incoming: any[] = [];
    const outgoing: any[] = [];

    // Collect user IDs we need to look up
    const userIdsToFetch = new Set<string>();

    for (const f of allFriendships || []) {
      const otherId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
      userIdsToFetch.add(otherId);

      if (f.status === 'accepted') {
        accepted.push({ friendship_id: f.id, other_id: otherId, since: f.updated_at || f.created_at });
      } else if (f.status === 'pending' && f.addressee_id === user.id) {
        incoming.push({ friendship_id: f.id, other_id: otherId, requested_at: f.created_at });
      } else if (f.status === 'pending' && f.requester_id === user.id) {
        outgoing.push({ friendship_id: f.id, other_id: otherId, requested_at: f.created_at });
      }
    }

    // Fetch user info for all referenced users
    let usersMap: Record<string, any> = {};
    if (userIdsToFetch.size > 0) {
      const { data: usersData } = await supabase
        .from('users')
        .select('id, username, display_name, avatar_url')
        .in('id', [...userIdsToFetch]);

      if (usersData) {
        for (const u of usersData) {
          usersMap[u.id] = u;
        }
      }
    }

    // Calculate mutual friends for accepted friends
    const acceptedFriendIds = accepted.map(a => a.other_id);

    // For mutual friends: find friendships of each friend that overlap with current user's friends
    let mutualCountMap: Record<string, number> = {};
    if (acceptedFriendIds.length > 0) {
      // Get all accepted friendships for all our friends
      const { data: friendsOfFriends } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .eq('status', 'accepted')
        .or(
          `requester_id.in.(${acceptedFriendIds.join(',')}),` +
          `addressee_id.in.(${acceptedFriendIds.join(',')})`
        );

      // For each friend, count how many of their friends are also in our friend list
      const myFriendSet = new Set(acceptedFriendIds);

      for (const friendId of acceptedFriendIds) {
        let mutualCount = 0;
        for (const ff of friendsOfFriends || []) {
          // This friendship involves our friend
          if (ff.requester_id !== friendId && ff.addressee_id !== friendId) continue;
          const theirFriend = ff.requester_id === friendId ? ff.addressee_id : ff.requester_id;
          // Their friend is also our friend (and not us)
          if (theirFriend !== user.id && myFriendSet.has(theirFriend)) {
            mutualCount++;
          }
        }
        mutualCountMap[friendId] = mutualCount;
      }
    }

    // Format response
    const formattedFriends = accepted.map(a => ({
      friendship_id: a.friendship_id,
      user: usersMap[a.other_id] || { id: a.other_id, username: '?', display_name: 'Unknown', avatar_url: null },
      mutual_friends: mutualCountMap[a.other_id] || 0,
      since: a.since,
    }));

    const formattedIncoming = incoming.map(i => ({
      friendship_id: i.friendship_id,
      user: usersMap[i.other_id] || { id: i.other_id, username: '?', display_name: 'Unknown', avatar_url: null },
      requested_at: i.requested_at,
    }));

    const formattedOutgoing = outgoing.map(o => ({
      friendship_id: o.friendship_id,
      user: usersMap[o.other_id] || { id: o.other_id, username: '?', display_name: 'Unknown', avatar_url: null },
      requested_at: o.requested_at,
    }));

    return res.status(200).json({
      friends: formattedFriends,
      incoming: formattedIncoming,
      outgoing: formattedOutgoing,
    });
  } catch (error: any) {
    console.error('Friends list error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message || 'Failed to fetch friends', status: 500 },
    });
  }
}
