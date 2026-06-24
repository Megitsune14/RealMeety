import { Hono } from 'hono';
import { authMiddleware, type AuthVariables } from '../middleware/auth.js';
import { toPublicUser, AvailabilityStatus } from '../models/user.js';
import { usersCollection, availabilityCollection } from '../db/mongo.js';
import { updateUserSchema, availabilitySchema, parseUpdateUserInput } from '../validators/auth.js';
import { parseJson } from '../utils/validation.js';
import { logAudit } from '../services/audit.js';
import { normalizeLegacyUser } from '../services/user.js';

const users = new Hono<{ Variables: AuthVariables }>();

users.use('/*', authMiddleware);

users.get('/me', async (c) => {
  const user = c.get('user');
  const normalized = await normalizeLegacyUser(user);
  return c.json({ user: toPublicUser(normalized) });
});

users.patch('/me', async (c) => {
  const user = c.get('user');
  const data = await parseJson(c, updateUserSchema);
  if (data instanceof Response) return data;
  const parsed = parseUpdateUserInput(data);

  if (Object.keys(parsed).length === 0) {
    return c.json({ error: 'Aucune donnée à mettre à jour' }, 400);
  }

  const update: Record<string, unknown> = { ...parsed, updatedAt: new Date() };
  if (parsed.dateOfBirth) {
    update.dateOfBirth = new Date(parsed.dateOfBirth);
  }

  await usersCollection().updateOne({ _id: user._id }, { $set: update });

  const updated = await usersCollection().findOne({ _id: user._id });
  if (!updated) return c.json({ error: 'Erreur interne' }, 500);

  await logAudit('user.updated', { userId: user._id, metadata: { fields: Object.keys(parsed) } });

  return c.json({ user: toPublicUser(updated) });
});

users.patch('/me/availability', async (c) => {
  const user = c.get('user');
  const data = await parseJson(c, availabilitySchema);
  if (data instanceof Response) return data;

  const now = new Date();
  await usersCollection().updateOne(
    { _id: user._id },
    { $set: { availabilityStatus: data.status, updatedAt: now } },
  );

  if (data.status === AvailabilityStatus.UNAVAILABLE) {
    await availabilityCollection().deleteMany({ userId: user._id });
  }

  await logAudit('user.availability_changed', {
    userId: user._id,
    metadata: { status: data.status },
  });

  const updated = await usersCollection().findOne({ _id: user._id });
  if (!updated) return c.json({ error: 'Erreur interne' }, 500);

  return c.json({
    user: toPublicUser(updated),
    message: `Disponibilité mise à jour : ${data.status}`,
  });
});

export default users;
