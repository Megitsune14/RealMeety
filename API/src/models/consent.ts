import { ObjectId } from 'mongodb';

export const ConsentType = {
  GEOLOCATION: 'geolocation',
  TERMS: 'terms',
  PRIVACY: 'privacy',
  MARKETING: 'marketing',
} as const;

export type ConsentType = (typeof ConsentType)[keyof typeof ConsentType];

export interface ConsentDocument {
  _id: ObjectId;
  userId: ObjectId;
  type: ConsentType;
  granted: boolean;
  version: string;
  grantedAt: Date;
  revokedAt: Date | null;
}
