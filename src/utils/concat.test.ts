import { describe, expect, it } from 'vitest';
import { concat } from './concat';

describe('concat', () => {
  it('should concatenate multiple strings with spaces', () => {
    expect(concat('Hello', 'World')).toBe('Hello World');
    expect(concat('This', 'is', 'a', 'test')).toBe('This is a test');
  });

  it('should handle empty strings', () => {
    expect(concat('')).toBe('');
    expect(concat('', '')).toBe(' ');
    expect(concat('Hello', '', 'World')).toBe('Hello  World');
  });

  it('should handle single string', () => {
    expect(concat('Hello')).toBe('Hello');
  });

  it('should handle no arguments', () => {
    expect(concat()).toBe('');
  });
});
