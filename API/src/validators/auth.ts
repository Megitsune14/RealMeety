import { z } from 'zod';
import { SexualOrientation } from '../models/user.js';
import { computeAge, isAdult } from '../utils/age.js';

const sexualOrientationSchema = z.enum([
  SexualOrientation.HETEROSEXUAL,
  SexualOrientation.HOMOSEXUAL,
  SexualOrientation.BISEXUAL,
  SexualOrientation.PANSEXUAL,
  SexualOrientation.OTHER,
  SexualOrientation.PREFER_NOT_TO_SAY,
]);

const dateOfBirthSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((val) => {
  const dob = new Date(val);
  return !Number.isNaN(dob.getTime()) && isAdult(dob);
}, 'Vous devez avoir au moins 18 ans');

export const registerSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8).max(128),
  dateOfBirth: dateOfBirthSchema,
  sexualOrientation: sexualOrientationSchema,
  consentVersion: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export function parseRegisterInput(data: RegisterInput) {
  const age = computeAge(new Date(data.dateOfBirth));
  return { ...data, age };
}

export const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const updateUserSchema = z
  .object({
    dateOfBirth: dateOfBirthSchema.optional(),
    sexualOrientation: sexualOrientationSchema.optional(),
  })
  .strict();

export function parseUpdateUserInput(data: z.infer<typeof updateUserSchema>) {
  if (data.dateOfBirth) {
    return { ...data, age: computeAge(new Date(data.dateOfBirth)) };
  }
  return data;
}

export const availabilitySchema = z.object({
  status: z.enum(['available', 'unavailable', 'paused']),
});

export const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracyMeters: z.number().min(0).max(10000).optional().default(50),
});

export const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(100).max(10000).default(1000),
  orientation: sexualOrientationSchema.optional(),
});

export const consentSchema = z.object({
  type: z.enum(['geolocation', 'terms', 'privacy', 'marketing']),
  granted: z.boolean(),
  version: z.string().min(1),
});
