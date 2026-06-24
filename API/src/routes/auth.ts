import { Hono } from 'hono';
import { ObjectId } from 'mongodb';
import { usersCollection, consentsCollection } from '../db/mongo.js';
import { hashPassword, verifyPassword } from '../services/password.js';
import { signAccessToken, signRefreshToken, verifyToken, verifyTokenActive } from '../services/jwt.js';
import { toPublicUser, AvailabilityStatus } from '../models/user.js';
import { ConsentType } from '../models/consent.js';
import { registerSchema, loginSchema, refreshSchema, parseRegisterInput } from '../validators/auth.js';
import { parseJson } from '../utils/validation.js';
import { logAudit } from '../services/audit.js';
import { normalizeLegacyUser } from '../services/user.js';
import { revokeToken } from '../db/redis.js';

const auth = new Hono();

auth.post('/register', async (c) => {
  const data = await parseJson(c, registerSchema);
  if (data instanceof Response) return data;
  const parsed = parseRegisterInput(data);

  const existing = await usersCollection().findOne({ email: data.email, deletedAt: null });
  if (existing) {
    return c.json({ error: 'Cet email est déjà utilisé' }, 409);
  }

  const now = new Date();
  const passwordHash = await hashPassword(data.password);

  const result = await usersCollection().insertOne({
    _id: new ObjectId(),
    email: parsed.email,
    passwordHash,
    dateOfBirth: new Date(parsed.dateOfBirth),
    age: parsed.age,
    sexualOrientation: parsed.sexualOrientation,
    availabilityStatus: AvailabilityStatus.UNAVAILABLE,
    isIdentityVerified: false,
    identityProviderRef: null,
    consentVersion: parsed.consentVersion,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    lastActiveAt: now,
  });

  await consentsCollection().insertOne({
    _id: new ObjectId(),
    userId: result.insertedId,
    type: ConsentType.TERMS,
    granted: true,
    version: parsed.consentVersion,
    grantedAt: now,
    revokedAt: null,
  });

  const user = await usersCollection().findOne({ _id: result.insertedId });
  if (!user) return c.json({ error: 'Erreur interne' }, 500);

  await logAudit('user.registered', {
    userId: user._id,
    ip: c.req.header('x-forwarded-for'),
    metadata: { email: user.email },
  });

  const payload = { sub: user._id.toHexString(), email: user.email };
  return c.json({
    user: toPublicUser(user),
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  }, 201);
});

auth.post('/login', async (c) => {
  const data = await parseJson(c, loginSchema);
  if (data instanceof Response) return data;

  const user = await usersCollection().findOne({ email: data.email, deletedAt: null });
  if (!user) {
    return c.json({ error: 'Email ou mot de passe incorrect' }, 401);
  }

  const valid = await verifyPassword(data.password, user.passwordHash);
  if (!valid) {
    return c.json({ error: 'Email ou mot de passe incorrect' }, 401);
  }

  await usersCollection().updateOne(
    { _id: user._id },
    { $set: { lastActiveAt: new Date() } },
  );

  await logAudit('user.login', { userId: user._id, ip: c.req.header('x-forwarded-for') });

  const normalized = await normalizeLegacyUser(user);
  const payload = { sub: normalized._id.toHexString(), email: normalized.email };
  return c.json({
    user: toPublicUser(normalized),
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  });
});

auth.post('/refresh', async (c) => {
  const data = await parseJson(c, refreshSchema);
  if (data instanceof Response) return data;

  try {
    const decoded = await verifyTokenActive(data.refreshToken);
    if (decoded.type !== 'refresh') {
      return c.json({ error: 'Token invalide' }, 401);
    }

    const user = await usersCollection().findOne({
      _id: new ObjectId(decoded.sub),
      deletedAt: null,
    });
    if (!user) return c.json({ error: 'Utilisateur introuvable' }, 401);

    const payload = { sub: user._id.toHexString(), email: user.email };
    return c.json({
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
    });
  } catch {
    return c.json({ error: 'Token invalide ou expiré' }, 401);
  }
});

auth.post('/logout', async (c) => {
  const header = c.req.header('Authorization');
  if (header?.startsWith('Bearer ')) {
    try {
      const decoded = verifyToken(header.slice(7));
      if (decoded.jti) await revokeToken(decoded.jti, 900);
    } catch {
      // Ignore invalid token on logout
    }
  }
  return c.json({ message: 'Déconnecté' });
});

export default auth;
