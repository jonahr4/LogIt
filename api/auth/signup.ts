/**
 * Log It — POST /api/auth/signup
 * Creates user profile in Supabase after Firebase auth
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

  const { email, username, first_name, last_name, display_name, event_preferences, default_privacy } =
    req.body;

  // Validate required fields
  if (!email || !username || !first_name || !last_name) {
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Missing required fields: email, username, first_name, last_name',
        status: 422,
      },
    });
  }

  // Validate username format
  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Username must be 3-30 characters, lowercase letters, numbers, and underscores only',
        status: 422,
      },
    });
  }

  const supabase = getSupabaseAdmin();

  // Check username uniqueness
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .single();

  if (existing) {
    return res.status(409).json({
      error: {
        code: 'CONFLICT',
        message: 'Username is already taken',
        status: 409,
      },
    });
  }

  // Check if firebase_uid already has a profile
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('firebase_uid', authReq.firebaseUid!)
    .single();

  if (existingUser) {
    return res.status(409).json({
      error: {
        code: 'CONFLICT',
        message: 'User profile already exists',
        status: 409,
      },
    });
  }

  // Create user profile
  const { data: user, error } = await supabase
    .from('users')
    .insert({
      email,
      username,
      first_name,
      last_name,
      display_name: display_name || first_name,
      event_preferences: event_preferences || [],
      default_privacy: default_privacy || 'public',
      firebase_uid: authReq.firebaseUid,
    })
    .select()
    .single();

  if (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to create user profile',
        status: 500,
      },
    });
  }

  return res.status(201).json(user);
}
