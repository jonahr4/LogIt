/**
 * Log It — POST /api/friends/request
 * Send a friend request.
 * Auth required.
 *
 * Body: { addressee_id: UUID }
 *
 * Smart behavior:
 * - If addressee already sent YOU a request, auto-accept (mutual request = instant friends)
 * - Prevents duplicate requests and self-requests
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

  const { addressee_id } = req.body;

  if (!addressee_id) {
    return res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: 'addressee_id is required', status: 422 },
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

    // Prevent self-request
    if (user.id === addressee_id) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'Cannot send friend request to yourself', status: 422 },
      });
    }

    // Verify addressee exists
    const { data: addressee } = await supabase
      .from('users')
      .select('id')
      .eq('id', addressee_id)
      .single();

    if (!addressee) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'User not found', status: 404 },
      });
    }

    // Check for existing friendship in either direction
    const { data: existing } = await supabase
      .from('friendships')
      .select('id, requester_id, addressee_id, status')
      .or(
        `and(requester_id.eq.${user.id},addressee_id.eq.${addressee_id}),` +
        `and(requester_id.eq.${addressee_id},addressee_id.eq.${user.id})`
      )
      .limit(1)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(409).json({
          error: { code: 'CONFLICT', message: 'You are already friends', status: 409 },
        });
      }

      if (existing.status === 'pending') {
        // If THEY sent us a request, auto-accept
        if (existing.requester_id === addressee_id) {
          const { data: updated, error: updateError } = await supabase
            .from('friendships')
            .update({ status: 'accepted', updated_at: new Date().toISOString() })
            .eq('id', existing.id)
            .select()
            .single();

          if (updateError) throw updateError;

          return res.status(200).json({
            friendship: updated,
            message: 'Friend request auto-accepted (mutual request)',
          });
        }

        // We already sent them a request
        return res.status(409).json({
          error: { code: 'CONFLICT', message: 'Friend request already sent', status: 409 },
        });
      }

      // If declined/blocked, allow re-request by updating
      if (existing.status === 'declined') {
        const { data: updated, error: updateError } = await supabase
          .from('friendships')
          .update({ status: 'pending', requester_id: user.id, addressee_id, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single();

        if (updateError) throw updateError;

        return res.status(201).json({ friendship: updated });
      }

      // Blocked
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Cannot send friend request', status: 403 },
      });
    }

    // Create new friendship request
    const { data: friendship, error: insertError } = await supabase
      .from('friendships')
      .insert({
        requester_id: user.id,
        addressee_id,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return res.status(409).json({
          error: { code: 'CONFLICT', message: 'Friend request already exists', status: 409 },
        });
      }
      throw insertError;
    }

    return res.status(201).json({ friendship });
  } catch (error: any) {
    console.error('Friend request error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message || 'Failed to send friend request', status: 500 },
    });
  }
}
