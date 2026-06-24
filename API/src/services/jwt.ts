import jwt from 'jsonwebtoken';
import { getEnv } from '../config/env.js';
import { isTokenRevoked } from '../db/redis.js';
import { randomUUID } from 'crypto';

export interface TokenPayload {
  sub: string;
  email: string;
  jti?: string;
  type?: string;
}

export function signAccessToken(payload: Omit<TokenPayload, 'jti' | 'type'>): string {
  const { JWT_SECRET, JWT_EXPIRES_IN } = getEnv();
  return jwt.sign({ ...payload, jti: randomUUID() }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function signRefreshToken(payload: Omit<TokenPayload, 'jti' | 'type'>): string {
  const { JWT_SECRET, JWT_REFRESH_EXPIRES_IN } = getEnv();
  return jwt.sign(
    { ...payload, jti: randomUUID(), type: 'refresh' },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] },
  );
}

export function verifyToken(token: string): TokenPayload {
  const { JWT_SECRET } = getEnv();
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export async function verifyTokenActive(token: string): Promise<TokenPayload> {
  const decoded = verifyToken(token);
  if (decoded.jti && await isTokenRevoked(decoded.jti)) {
    throw new Error('Token révoqué');
  }
  return decoded;
}
