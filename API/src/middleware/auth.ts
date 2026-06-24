import type { Context, Next } from 'hono';
import { verifyTokenActive } from '../services/jwt.js';
import { usersCollection } from '../db/mongo.js';
import { ObjectId } from 'mongodb';
import type { UserDocument } from '../models/user.js';

export type AuthVariables = {
  user: UserDocument;
};

export async function authMiddleware(c: Context, next: Next): Promise<Response | void> {
  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: 'Token manquant' }, 401);
  }

  try {
    const token = header.slice(7);
    const payload = await verifyTokenActive(token);
    const user = await usersCollection().findOne({
      _id: new ObjectId(payload.sub),
      deletedAt: null,
    });

    if (!user) {
      return c.json({ error: 'Utilisateur introuvable' }, 401);
    }

    c.set('user', user);
    await next();
  } catch {
    return c.json({ error: 'Token invalide ou expiré' }, 401);
  }
}
