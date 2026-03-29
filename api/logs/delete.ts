/**
 * Log It — POST /api/logs/delete
 * Deletes a user's event log
 *
 * Body: { log_id: string }
 * Requires Firebase auth token
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

  const { log_id } = req.body || {};
  if (!log_id) {
    return res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: 'log_id is required', status: 422 },
    });
  }

  const supabase = getSupabaseAdmin();

  try {
    // Look up user
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', authReq.firebaseUid!)
      .single();

    if (!user) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    }

    // Verify ownership before deleting
    const { data: existingLog } = await supabase
      .from('user_event_logs')
      .select('id')
      .eq('id', log_id)
      .eq('user_id', user.id)
      .single();

    if (!existingLog) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not authorized to delete this log' } });
    }

    // Delete companions first (FK constraint)
    await supabase.from('log_companions').delete().eq('log_id', log_id);

    // Delete the log
    const { error: deleteError } = await supabase
      .from('user_event_logs')
      .delete()
      .eq('id', log_id);

    if (deleteError) throw deleteError;

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Delete log error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message || 'Delete failed', status: 500 },
    });
  }
}
