/**
 * Log It — GET /api/users/check-username
 * Real-time username availability check
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../../server-lib/supabase-admin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET allowed', status: 405 },
    });
  }

  const username = req.query.username as string;

  if (!username || typeof username !== 'string') {
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Username query parameter is required',
        status: 422,
      },
    });
  }

  // Validate format
  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    return res.status(200).json({
      available: false,
      username,
    });
  }

  const supabase = getSupabaseAdmin();

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .single();

  return res.status(200).json({
    available: !existing,
    username,
  });
}
