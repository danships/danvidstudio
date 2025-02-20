import { describe, expect, it } from 'vitest';
import { WithId } from './with-id';

// Create a concrete implementation of WithId for testing
class TestWithId extends WithId {}

describe('WithId', () => {
  it('should generate a UUID when no id is provided', () => {
    const instance = new TestWithId();
    expect(instance.id).toBeDefined();
    expect(typeof instance.id).toBe('string');
    expect(instance.id.length).toBeGreaterThan(0);
  });

  it('should use the provided id when one is passed', () => {
    const customId = 'test-id-123';
    const instance = new TestWithId(customId);
    expect(instance.id).toBe(customId);
  });

  it('should generate unique ids for different instances', () => {
    const instance1 = new TestWithId();
    const instance2 = new TestWithId();
    expect(instance1.id).not.toBe(instance2.id);
  });
});
