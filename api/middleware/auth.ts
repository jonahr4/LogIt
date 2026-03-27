/**
 * Log It — Firebase Auth Middleware
 * Verifies Firebase JWT token from Authorization header
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK (singleton)
if (getApps().length === 0) {
  const serviceAccount: ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  initializeApp({
    credential: cert(serviceAccount),
  });
}

export interface AuthenticatedRequest extends VercelRequest {
  firebaseUid?: string;
  firebaseEmail?: string;
}

/**
 * Middleware: Verifies Firebase token and attaches uid to request
 * Returns null if auth succeeds, or sends error response and returns the response
 */
export async function verifyAuth(
  req: AuthenticatedRequest,
  res: VercelResponse
): Promise<boolean> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header',
        status: 401,
      },
    });
    return false;
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    req.firebaseUid = decodedToken.uid;
    req.firebaseEmail = decodedToken.email;
    return true;
  } catch (error) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
        status: 401,
      },
    });
    return false;
  }
}
