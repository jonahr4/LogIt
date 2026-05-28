/**
 * Log It — DELETE /api/friends/remove
 * Remove a friend (either party can remove).
 * Auth required.
 *
 * Body: { friendship_id: UUID }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth, type AuthenticatedRequest } from '../../server-lib/auth';
import { getSupabaseAdmin } from '../../server-lib/supabase-admin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only DELETE allowed', status: 405 },
    });
  }

  const authReq = req as AuthenticatedRequest;
  const isAuthenticated = await verifyAuth(authReq, res);
  if (!isAuthenticated) return;

  const { friendship_id } = req.body;

  if (!friendship_id) {
    return res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: 'friendship_id is required', status: 422 },
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

    // Fetch the friendship — user must be part of it
    const { data: friendship, error: fetchError } = await supabase
      .from('friendships')
      .select('id, requester_id, addressee_id')
      .eq('id', friendship_id)
      .single();

    if (fetchError || !friendship) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Friendship not found', status: 404 },
      });
    }

    // Either party can remove
    if (friendship.requester_id !== user.id && friendship.addressee_id !== user.id) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Not part of this friendship', status: 403 },
      });
    }

    // Delete the friendship
    const { error: deleteError } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendship_id);

    if (deleteError) throw deleteError;

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Friend remove error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message || 'Failed to remove friend', status: 500 },
    });
  }
}
