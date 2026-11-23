import { type User, type Entry } from '../types';
import { logger } from '../logger';

const CACHE_TTL = 60_000;
const MAX_ENTRIES = 500;
const cache = new Map<string, Entry<User>>();

/**
 * Returns a user by id, cached for one minute.
 * @throws {NotFoundError} when the API answers 404
 */
export async function getUser(id: string, opts?: { fresh: boolean }): Promise<User> {
  const hit = cache.get(id);
  if (hit && !opts?.fresh && Date.now() - hit.at < CACHE_TTL) {
    return hit.value;
  }

  const res = await fetch(`/api/users/${encodeURIComponent(id)}`);
  if (!res.ok) {
    logger.warn('user lookup failed', { id, status: res.status });
    throw new NotFoundError(`User ${id} not found`);
  }

  const user = (await res.json()) as User;
  cache.set(id, { at: Date.now(), value: user });
  return user;
}

export class NotFoundError extends Error {
  readonly code = 404;
}

export const isSlug = (value: string): boolean => /^[a-z0-9-]+$/.test(value);
