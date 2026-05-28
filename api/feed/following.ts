/**
 * Log It — GET /api/feed/following
 * Friends feed — logs from accepted friends with privacy 'public' or 'friends'.
 * Auth required.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth, type AuthenticatedRequest } from '../../server-lib/auth';
import { getSupabaseAdmin } from '../../server-lib/supabase-admin';
import { formatFeedCards, LOG_SELECT } from '../../server-lib/feed-helpers';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET allowed', status: 405 },
    });
  }

  const authReq = req as AuthenticatedRequest;
  const isAuthenticated = await verifyAuth(authReq, res);
  if (!isAuthenticated) return;

  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
  const offset = parseInt(req.query.offset as string) || 0;

  const supabase = getSupabaseAdmin();

  try {
    // Look up user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', authReq.firebaseUid!)
      .single();

    if (userError || !user) {
      return res.status(200).json({ data: [], pagination: { limit, offset, has_more: false, total: 0 } });
    }

    // Get accepted friend IDs
    const { data: friendships } = await supabase
      .from('friendships')
      .select('requester_id, addressee_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    const friendIds = (friendships || []).map(f =>
      f.requester_id === user.id ? f.addressee_id : f.requester_id
    );

    if (friendIds.length === 0) {
      return res.status(200).json({ data: [], pagination: { limit, offset, has_more: false, total: 0 } });
    }

    // Fetch friends' logs (public + friends privacy)
    const { data: logs, error: logsError, count } = await supabase
      .from('user_event_logs')
      .select(LOG_SELECT, { count: 'exact' })
      .in('user_id', friendIds)
      .in('privacy', ['public', 'friends'])
      .order('logged_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (logsError) {
      console.error('Following feed error:', logsError);
      throw logsError;
    }

    const cards = await formatFeedCards(supabase, logs || []);

    return res.status(200).json({
      data: cards,
      pagination: {
        limit,
        offset,
        has_more: (count || 0) > offset + limit,
        total: count || 0,
      },
    });
  } catch (error: any) {
    console.error('Following feed error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message || 'Failed to fetch feed', status: 500 },
    });
  }
}
