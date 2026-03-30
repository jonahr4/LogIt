/**
 * Log It — GET /api/ping
 * Lightweight warm-up endpoint. Called on app mount to pre-warm the
 * Vercel function container so subsequent API calls (search, logs) don't
 * suffer cold-start latency.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ ok: true });
}
