// Minimal auth utilities for password hashing and session management
// No dependency on Supabase Auth - can be migrated to Snowflake later

import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.trim().length === 0) {
    throw new Error('Password cannot be empty');
  }
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Compare password (alias for verifyPassword for test compatibility)
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a secure session token
 */
export function generateSessionToken(): string {
  return randomUUID();
}

/**
 * Calculate session expiration (24 hours from now)
 */
export function getSessionExpiration(): Date {
  const expiration = new Date();
  expiration.setHours(expiration.getHours() + 24);
  return expiration;
}

/**
 * Check if a session token is expired
 */
export function isSessionExpired(expiresAt: Date): boolean {
  return new Date() > new Date(expiresAt);
}
