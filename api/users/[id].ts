/**
 * Log It — /api/users/[id]
 * GET: Get user profile (public fields if not self)
 * PATCH: Update own profile
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth, type AuthenticatedRequest } from '../../server-lib/auth';
import { getSupabaseAdmin } from '../../server-lib/supabase-admin';

const PUBLIC_FIELDS = 'id, username, display_name, avatar_url, bio';
const FRIEND_FIELDS = `${PUBLIC_FIELDS}, first_name, last_name`;
const SELF_FIELDS = '*';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authReq = req as AuthenticatedRequest;
  const isAuthenticated = await verifyAuth(authReq, res);
  if (!isAuthenticated) return;

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'User ID is required',
        status: 422,
      },
    });
  }

  const supabase = getSupabaseAdmin();

  if (req.method === 'GET') {
    // Determine if requesting own profile
    const { data: requestingUser } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', authReq.firebaseUid!)
      .single();

    const isSelf = requestingUser?.id === id;
    const fields = isSelf ? SELF_FIELDS : PUBLIC_FIELDS;

    const { data: user, error } = await supabase
      .from('users')
      .select(fields)
      .eq('id', id)
      .single();

    if (error || !user) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'User not found', status: 404 },
      });
    }

    return res.status(200).json(user);
  }

  if (req.method === 'PATCH') {
    // Verify user is updating their own profile
    // Accept either Supabase UUID or Firebase UID as the id param
    const { data: requestingUser } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', authReq.firebaseUid!)
      .single();

    if (!requestingUser) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'User not found', status: 404 },
      });
    }

    // Allow if id matches either their Supabase ID or their Firebase UID
    const isOwnProfile = requestingUser.id === id || authReq.firebaseUid === id;
    if (!isOwnProfile) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only update your own profile',
          status: 403,
        },
      });
    }

    // Always use the Supabase UUID for the actual update
    const targetId = requestingUser.id;

    // Filter allowed update fields
    const allowedFields = [
      'username',
      'first_name',
      'last_name',
      'display_name',
      'bio',
      'avatar_url',
      'event_preferences',
      'default_privacy',
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'No valid fields to update',
          status: 422,
        },
      });
    }

    // Username validation & uniqueness check
    if (updates.username) {
      const username = updates.username as string;
      const usernameRegex = /^[a-z0-9_]{3,30}$/;
      if (!usernameRegex.test(username)) {
        return res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Username must be 3-30 characters, lowercase letters, numbers, and underscores only',
            status: 422,
          },
        });
      }

      // Check if username is taken by another user
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .neq('id', targetId)
        .maybeSingle();

      if (existing) {
        return res.status(409).json({
          error: {
            code: 'CONFLICT',
            message: 'Username is already taken',
            status: 409,
          },
        });
      }
    }

    updates.updated_at = new Date().toISOString();

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', targetId)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      // Handle unique constraint violation
      if (error.code === '23505' && error.message?.includes('username')) {
        return res.status(409).json({
          error: { code: 'CONFLICT', message: 'Username is already taken', status: 409 },
        });
      }
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to update profile',
          status: 500,
        },
      });
    }

    return res.status(200).json(user);
  }

  return res.status(405).json({
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET and PATCH allowed', status: 405 },
  });
}
