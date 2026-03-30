/**
 * LogIt — /api/logs/photos
 * POST: Save a photo's Firebase URL to Supabase after client uploads to Firebase Storage
 * DELETE: Remove a photo record from Supabase (client deletes from Firebase separately)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth, type AuthenticatedRequest } from '../../server-lib/auth';
import { getSupabaseAdmin } from '../../server-lib/supabase-admin';

const MAX_PHOTOS_PER_LOG = 10;


export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authReq = req as AuthenticatedRequest;
  const isAuthenticated = await verifyAuth(authReq, res);
  if (!isAuthenticated) return;

  const supabase = getSupabaseAdmin();

  // Look up Supabase user from Firebase UID
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('firebase_uid', authReq.firebaseUid!)
    .single();

  if (userError || !user) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found', status: 401 } });
  }

  // ── POST: save photo metadata ─────────────────────────────────────────
  if (req.method === 'POST') {
    const { log_id, firebase_path, url, display_order } = req.body || {};

    if (!log_id || !firebase_path || !url) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'log_id, firebase_path, and url are required', status: 400 } });
    }

    // Verify log belongs to user
    console.log('[photos] POST lookup:', { log_id, supabase_user_id: user.id });
    const { data: log, error: logError } = await supabase
      .from('user_event_logs')
      .select('id')
      .eq('id', log_id)
      .eq('user_id', user.id)
      .single();

    console.log('[photos] log lookup result:', { found: !!log, error: logError?.message, code: logError?.code });

    if (!log) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Log not found or not yours', status: 403, debug: { log_id, user_id: user.id } } });
    }

    // Enforce 5-photo limit
    const { count } = await supabase
      .from('log_photos')
      .select('id', { count: 'exact', head: true })
      .eq('log_id', log_id);

    if ((count ?? 0) >= MAX_PHOTOS_PER_LOG) {
      return res.status(400).json({ error: { code: 'LIMIT_EXCEEDED', message: 'Maximum 5 photos per log', status: 400 } });
    }

    const { data: photo, error: insertError } = await supabase
      .from('log_photos')
      .insert({
        log_id,
        user_id: user.id,
        firebase_path,
        url,
        display_order: display_order ?? (count ?? 0),
      })
      .select('id, url, firebase_path, display_order')
      .single();

    if (insertError) {
      console.error('Photo insert error:', insertError);
      return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to save photo', status: 500 } });
    }

    return res.status(201).json({ photo });
  }

  // ── DELETE: remove photo record ───────────────────────────────────────
  if (req.method === 'DELETE') {
    const { photo_id } = req.body || {};

    if (!photo_id) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'photo_id required', status: 400 } });
    }

    // Verify ownership
    const { data: photo } = await supabase
      .from('log_photos')
      .select('id, firebase_path')
      .eq('id', photo_id)
      .eq('user_id', user.id)
      .single();

    if (!photo) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Photo not found', status: 404 } });
    }

    const { error: deleteError } = await supabase
      .from('log_photos')
      .delete()
      .eq('id', photo_id);

    if (deleteError) {
      return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to delete photo record', status: 500 } });
    }

    return res.status(200).json({ success: true, firebase_path: photo.firebase_path });
  }

  return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST and DELETE allowed', status: 405 } });
}
