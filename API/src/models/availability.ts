import { ObjectId } from 'mongodb';
import type { AvailabilityStatus, SexualOrientation } from './user.js';

export interface AvailabilitySessionDocument {
  _id: ObjectId;
  userId: ObjectId;
  status: AvailabilityStatus;
  sexualOrientation: SexualOrientation;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  locationUpdatedAt: Date;
  expiresAt: Date;
  accuracyMeters: number;
}
