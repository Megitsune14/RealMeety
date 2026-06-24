import { usersCollection } from '../db/mongo.js';
import {
  AvailabilityStatus,
  type UserDocument,
} from '../models/user.js';

/** Migre les comptes créés avant l'ajout de dateOfBirth / availabilityStatus */
export async function normalizeLegacyUser(doc: UserDocument): Promise<UserDocument> {
  const patch: Record<string, unknown> = {};
  if (!doc.dateOfBirth && doc.age) {
    const year = new Date().getFullYear() - doc.age;
    patch.dateOfBirth = new Date(`${year}-01-01`);
  }
  if (!doc.availabilityStatus) {
    patch.availabilityStatus = AvailabilityStatus.UNAVAILABLE;
  }
  if (Object.keys(patch).length === 0) return doc;

  patch.updatedAt = new Date();
  await usersCollection().updateOne({ _id: doc._id }, { $set: patch });
  return { ...doc, ...patch } as UserDocument;
}
