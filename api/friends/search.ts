/**
 * Log It — GET /api/friends/search?q=...
 * Search users by username or display_name.
 * Returns friendship status for each result.
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

  const query = (req.query.q as string || '').trim();
  if (query.length < 2) {
    return res.status(200).json({ users: [] });
  }

  const supabase = getSupabaseAdmin();

  try {
    // Look up current user
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', authReq.firebaseUid!)
      .single();

    if (userError || !currentUser) {
      return res.status(200).json({ users: [] });
    }

    // Search users by username or display_name (ILIKE), exclude self
    const { data: users, error: searchError } = await supabase
      .from('users')
      .select('id, username, display_name, avatar_url')
      .neq('id', currentUser.id)
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(20);

    if (searchError) {
      console.error('User search error:', searchError);
      throw searchError;
    }

    if (!users || users.length === 0) {
      return res.status(200).json({ users: [] });
    }

    // Fetch friendship statuses for these users
    const userIds = users.map(u => u.id);
    const { data: friendships } = await supabase
      .from('friendships')
      .select('id, requester_id, addressee_id, status')
      .or(
        `and(requester_id.eq.${currentUser.id},addressee_id.in.(${userIds.join(',')})),` +
        `and(addressee_id.eq.${currentUser.id},requester_id.in.(${userIds.join(',')}))`
      );

    // Build friendship status map
    const statusMap: Record<string, string> = {};
    for (const f of friendships || []) {
      const otherId = f.requester_id === currentUser.id ? f.addressee_id : f.requester_id;
      if (f.status === 'accepted') {
        statusMap[otherId] = 'accepted';
      } else if (f.status === 'pending') {
        statusMap[otherId] = f.requester_id === currentUser.id ? 'pending_outgoing' : 'pending_incoming';
      } else if (f.status === 'blocked') {
        statusMap[otherId] = 'blocked';
      }
    }

    const results = users.map(u => ({
      id: u.id,
      username: u.username,
      display_name: u.display_name,
      avatar_url: u.avatar_url,
      friendship_status: statusMap[u.id] || 'none',
    }));

    return res.status(200).json({ users: results });
  } catch (error: any) {
    console.error('User search error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message || 'Failed to search users', status: 500 },
    });
  }
}
