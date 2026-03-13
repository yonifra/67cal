import { describe, it, expect } from 'vitest';
import { generateInviteCode } from '../inviteCodes';

describe('generateInviteCode()', () => {
  it('returns a string of length 8', () => {
    const code = generateInviteCode();
    expect(typeof code).toBe('string');
    expect(code).toHaveLength(8);
  });

  it('only contains URL-safe characters', () => {
    const code = generateInviteCode();
    // nanoid uses A-Za-z0-9_- by default
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('generates unique codes across multiple calls', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateInviteCode()));
    // All 100 codes should be unique
    expect(codes.size).toBe(100);
  });

  it('returns different values on subsequent calls', () => {
    const code1 = generateInviteCode();
    const code2 = generateInviteCode();
    expect(code1).not.toBe(code2);
  });
});
