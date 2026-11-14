import { Request, Response, NextFunction } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';
import { eq } from 'drizzle-orm';
import { adminAuth } from '../lib/firebase-admin.ts';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';

export const BOOTSTRAP_ADMIN_EMAILS = ['computersabdul@gmail.com'];

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  dbUser?: typeof users.$inferSelect;
}

export async function getOrCreateUser(uid: string, email: string, displayName?: string) {
  const isDefaultAdmin = BOOTSTRAP_ADMIN_EMAILS.includes(email.toLowerCase());
  const existing = await db.select().from(users).where(eq(users.uid, uid)).limit(1);

  if (existing.length > 0) {
    const current = existing[0];
    if (isDefaultAdmin && current.role !== 'admin') {
      const updated = await db
        .update(users)
        .set({ role: 'admin', email, displayName: displayName ?? current.displayName })
        .where(eq(users.uid, uid))
        .returning();
      return updated[0];
    }
    return current;
  }

  const result = await db
    .insert(users)
    .values({
      uid,
      email,
      displayName: displayName || '',
      role: isDefaultAdmin ? 'admin' : 'customer',
    })
    .onConflictDoUpdate({
      target: users.uid,
      set: {
        email,
        displayName: displayName || '',
      },
    })
    .returning();

  return result[0];
}

export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    req.user = decoded;
    if (decoded.email) {
      req.dbUser = await getOrCreateUser(decoded.uid, decoded.email, decoded.name);
    }
  } catch {
    // Ignore invalid optional tokens
  }
  next();
};

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    req.dbUser = await getOrCreateUser(
      decodedToken.uid,
      decodedToken.email || '',
      decodedToken.name
    );
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    const dbUser = await getOrCreateUser(
      decodedToken.uid,
      decodedToken.email || '',
      decodedToken.name
    );
    req.dbUser = dbUser;

    const email = (decodedToken.email || '').toLowerCase();
    const isAdmin = dbUser.role === 'admin' || BOOTSTRAP_ADMIN_EMAILS.includes(email);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Store administrator access required' });
    }
    next();
  } catch (error) {
    console.error('Admin verification failed:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
