/**
 * Log It — GET /api/auth/me
 * Returns the current authenticated user's full profile
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

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('firebase_uid', authReq.firebaseUid!)
    .single();

  if (error || !user) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'User profile not found',
        status: 404,
      },
    });
  }

  return res.status(200).json(user);
}
