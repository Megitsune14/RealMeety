import type { Context } from 'hono';
import { ZodError, type ZodSchema } from 'zod';

export async function parseJson<T>(c: Context, schema: ZodSchema<T>): Promise<T | Response> {
  try {
    const body = await c.req.json();
    return schema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return c.json({ error: 'Données invalides', details: err.flatten().fieldErrors }, 400);
    }
    return c.json({ error: 'Corps de requête invalide' }, 400);
  }
}

export function parseQuery<T>(c: Context, schema: ZodSchema<T>): T | Response {
  try {
    return schema.parse(c.req.query());
  } catch (err) {
    if (err instanceof ZodError) {
      return c.json({ error: 'Paramètres invalides', details: err.flatten().fieldErrors }, 400);
    }
    return c.json({ error: 'Paramètres invalides' }, 400);
  }
}
