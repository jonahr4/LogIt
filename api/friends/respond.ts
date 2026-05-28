/**
 * Log It — POST /api/friends/respond
 * Accept or decline a friend request.
 * Auth required. Only the addressee can respond.
 *
 * Body: { friendship_id: UUID, action: 'accept' | 'decline' }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth, type AuthenticatedRequest } from '../../server-lib/auth';
import { getSupabaseAdmin } from '../../server-lib/supabase-admin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST allowed', status: 405 },
    });
  }

  const authReq = req as AuthenticatedRequest;
  const isAuthenticated = await verifyAuth(authReq, res);
  if (!isAuthenticated) return;

  const { friendship_id, action } = req.body;

  if (!friendship_id || !action) {
    return res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: 'friendship_id and action are required', status: 422 },
    });
  }

  if (!['accept', 'decline'].includes(action)) {
    return res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: 'action must be "accept" or "decline"', status: 422 },
    });
  }

  const supabase = getSupabaseAdmin();

  try {
    // Look up current user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', authReq.firebaseUid!)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'User profile not found', status: 404 },
      });
    }

    // Fetch the friendship
    const { data: friendship, error: fetchError } = await supabase
      .from('friendships')
      .select('id, requester_id, addressee_id, status')
      .eq('id', friendship_id)
      .single();

    if (fetchError || !friendship) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Friend request not found', status: 404 },
      });
    }

    // Only the addressee can respond
    if (friendship.addressee_id !== user.id) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Only the request recipient can respond', status: 403 },
      });
    }

    // Must be pending to respond
    if (friendship.status !== 'pending') {
      return res.status(409).json({
        error: { code: 'CONFLICT', message: `Request is already ${friendship.status}`, status: 409 },
      });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'declined';

    const { data: updated, error: updateError } = await supabase
      .from('friendships')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', friendship_id)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({ friendship: updated });
  } catch (error: any) {
    console.error('Friend respond error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message || 'Failed to respond to request', status: 500 },
    });
  }
}
