import { ObjectId } from 'mongodb';

export const SexualOrientation = {
  HETEROSEXUAL: 'heterosexual',
  HOMOSEXUAL: 'homosexual',
  BISEXUAL: 'bisexual',
  PANSEXUAL: 'pansexual',
  OTHER: 'other',
  PREFER_NOT_TO_SAY: 'prefer_not_to_say',
} as const;

export type SexualOrientation = (typeof SexualOrientation)[keyof typeof SexualOrientation];

export const AvailabilityStatus = {
  AVAILABLE: 'available',
  UNAVAILABLE: 'unavailable',
  PAUSED: 'paused',
} as const;

export type AvailabilityStatus = (typeof AvailabilityStatus)[keyof typeof AvailabilityStatus];

export interface UserDocument {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  dateOfBirth?: Date;
  age: number;
  sexualOrientation: SexualOrientation;
  availabilityStatus?: AvailabilityStatus;
  isIdentityVerified: boolean;
  identityProviderRef: string | null;
  consentVersion: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  lastActiveAt: Date;
}

export interface PublicUser {
  id: string;
  email: string;
  dateOfBirth: string;
  age: number;
  sexualOrientation: SexualOrientation;
  availabilityStatus: AvailabilityStatus;
  isIdentityVerified: boolean;
  consentVersion: string;
  createdAt: string;
}

function formatDateOfBirth(doc: UserDocument): string {
  if (doc.dateOfBirth) {
    return doc.dateOfBirth.toISOString().split('T')[0];
  }
  if (doc.age) {
    const year = new Date().getFullYear() - doc.age;
    return `${year}-01-01`;
  }
  return '';
}

export function toPublicUser(doc: UserDocument): PublicUser {
  return {
    id: doc._id.toHexString(),
    email: doc.email,
    dateOfBirth: formatDateOfBirth(doc),
    age: doc.age ?? 18,
    sexualOrientation: doc.sexualOrientation,
    availabilityStatus: doc.availabilityStatus ?? AvailabilityStatus.UNAVAILABLE,
    isIdentityVerified: doc.isIdentityVerified ?? false,
    consentVersion: doc.consentVersion ?? '1.0.0',
    createdAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}
