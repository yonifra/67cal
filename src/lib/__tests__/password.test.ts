import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../password';

describe('hashPassword()', () => {
  it('returns a hash string', async () => {
    const hash = await hashPassword('mypassword');
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('returns a bcrypt hash (starts with $2)', async () => {
    const hash = await hashPassword('mypassword');
    expect(hash).toMatch(/^\$2[aby]?\$/);
  });

  it('returns different hashes for the same password (salt)', async () => {
    const hash1 = await hashPassword('mypassword');
    const hash2 = await hashPassword('mypassword');
    expect(hash1).not.toBe(hash2);
  });

  it('returns different hashes for different passwords', async () => {
    const hash1 = await hashPassword('password1');
    const hash2 = await hashPassword('password2');
    expect(hash1).not.toBe(hash2);
  });
});

describe('verifyPassword()', () => {
  it('returns true for correct password', async () => {
    const hash = await hashPassword('correctpassword');
    const result = await verifyPassword('correctpassword', hash);
    expect(result).toBe(true);
  });

  it('returns false for incorrect password', async () => {
    const hash = await hashPassword('correctpassword');
    const result = await verifyPassword('wrongpassword', hash);
    expect(result).toBe(false);
  });

  it('handles empty password', async () => {
    const hash = await hashPassword('');
    const result = await verifyPassword('', hash);
    expect(result).toBe(true);
  });

  it('handles special characters in password', async () => {
    const password = '!@#$%^&*()_+-=🔐';
    const hash = await hashPassword(password);
    const result = await verifyPassword(password, hash);
    expect(result).toBe(true);
  });
});
