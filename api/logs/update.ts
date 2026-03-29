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

  const { log_id, notes, privacy, rating, photos, companions } = req.body;

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

    // Verify ownership
    const { data: existingLog } = await supabase
      .from('user_event_logs')
      .select('id')
      .eq('id', log_id)
      .eq('user_id', user.id)
      .single();

    if (!existingLog) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not authorized to edit this log' } });
    }

    // Update base log
    const { error: updateError } = await supabase
      .from('user_event_logs')
      .update({
        notes: notes || null,
        privacy: privacy || 'public',
        rating: rating || null,
        photos: photos || [],
      })
      .eq('id', log_id);

    if (updateError) throw updateError;

    // Replace companions (delete existing, then insert new)
    await supabase.from('log_companions').delete().eq('log_id', log_id);

    if (companions && companions.length > 0) {
      const inserts = companions.map((c: any) => ({
        log_id,
        user_id: c.user_id || null,
        name: c.name,
      }));
      await supabase.from('log_companions').insert(inserts);
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Log update error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message || 'Failed to update log', status: 500 },
    });
  }
}
