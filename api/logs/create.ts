/**
 * Log It — POST /api/logs/create
 * Creates a user event log in Supabase
 * Requires Firebase auth — user must be logged in
 *
 * Request body:
 *   event_id    - UUID of the event to log (required)
 *   notes       - optional text notes
 *   privacy     - 'public' | 'friends' | 'private' (default: user's default)
 *   rating      - optional 1-5 rating
 *   photos      - optional array of photo URLs
 *   companions  - optional array of { user_id?, name } objects
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

  // Verify Firebase auth
  const authReq = req as AuthenticatedRequest;
  const isAuthenticated = await verifyAuth(authReq, res);
  if (!isAuthenticated) return;

  const { event_id, notes, privacy, rating, photos, companions, rooted_team } = req.body;

  // Validate required fields
  if (!event_id) {
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'event_id is required',
        status: 422,
      },
    });
  }

  // Validate rating if provided (0.5 increments: 0.5, 1, 1.5, ..., 5)
  if (rating !== undefined && rating !== null) {
    const r = Number(rating);
    if (r < 0.5 || r > 5 || (r * 2) % 1 !== 0) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Rating must be between 0.5 and 5 in 0.5 increments',
          status: 422,
        },
      });
    }
  }

  const supabase = getSupabaseAdmin();

  try {
    // Look up user by firebase_uid
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('id, default_privacy')
      .eq('firebase_uid', authReq.firebaseUid!)
      .single();

    if (userError || !user) {
      // Auto-create user profile from Firebase auth data
      // This handles the case where onboarding saved locally but the API call failed
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          firebase_uid: authReq.firebaseUid!,
          email: authReq.firebaseEmail || '',
          username: authReq.firebaseEmail?.split('@')[0] || authReq.firebaseUid!.slice(0, 8),
          first_name: '',
          last_name: '',
          display_name: authReq.firebaseEmail?.split('@')[0] || 'User',
          default_privacy: 'public',
          event_preferences: ['sports'],
        })
        .select('id, default_privacy')
        .single();

      if (createError || !newUser) {
        console.error('Auto-create user failed:', createError);
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'User profile not found and auto-creation failed.',
            status: 404,
          },
        });
      }
      user = newUser;
    }

    // Verify event exists
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Event not found',
          status: 404,
        },
      });
    }

    // Insert the log
    const { data: log, error: logError } = await supabase
      .from('user_event_logs')
      .insert({
        user_id: user.id,
        event_id,
        notes: notes || null,
        privacy: privacy || user.default_privacy || 'public',
        rating: rating ? Number(rating) : null,
        photos: photos || [],
        rooted_team: rooted_team || null,
      })
      .select()
      .single();

    if (logError) {
      // Check for duplicate
      if (logError.code === '23505') {
        return res.status(409).json({
          error: {
            code: 'CONFLICT',
            message: 'You have already logged this event',
            status: 409,
          },
        });
      }
      console.error('Log creation error:', logError);
      throw logError;
    }

    // Insert companions if provided
    let insertedCompanions: any[] = [];
    if (companions && Array.isArray(companions) && companions.length > 0) {
      const companionRows = companions
        .filter((c: any) => c.name) // must have a name
        .map((c: any) => ({
          log_id: log.id,
          user_id: c.user_id || null,
          name: c.name,
        }));

      if (companionRows.length > 0) {
        const { data: compData, error: compError } = await supabase
          .from('log_companions')
          .insert(companionRows)
          .select();

        if (compError) {
          console.error('Companion insert error:', compError);
          // Non-fatal — log was still created
        } else {
          insertedCompanions = compData || [];
        }
      }
    }

    return res.status(201).json({
      id: log.id,
      user_id: log.user_id,
      event_id: log.event_id,
      notes: log.notes,
      privacy: log.privacy,
      rating: log.rating,
      photos: log.photos,
      companions: insertedCompanions,
      logged_at: log.logged_at,
    });
  } catch (error: any) {
    console.error('Log creation error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message || 'Failed to create log', status: 500 },
    });
  }
}
