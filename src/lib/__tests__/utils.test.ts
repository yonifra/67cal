import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn()', () => {
  it('merges multiple class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active');
  });

  it('resolves Tailwind conflicts (last wins)', () => {
    // tailwind-merge should resolve conflicting Tailwind classes
    const result = cn('px-4', 'px-6');
    expect(result).toBe('px-6');
  });

  it('resolves conflicting text color classes', () => {
    const result = cn('text-red-500', 'text-blue-500');
    expect(result).toBe('text-blue-500');
  });

  it('handles empty inputs', () => {
    expect(cn()).toBe('');
  });

  it('filters out falsy values', () => {
    expect(cn('foo', null, undefined, false, 'bar')).toBe('foo bar');
  });

  it('handles array inputs via clsx', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
  });

  it('handles object inputs via clsx', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
  });
});
