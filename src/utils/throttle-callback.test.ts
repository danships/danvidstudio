import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { throttleCallback } from './throttle-callback';

describe('throttleCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should call callback immediately on first call', () => {
    const callback = vi.fn();
    const throttled = throttleCallback(callback, 1000);

    throttled('test');

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('test');
  });

  it('should not call callback more than once within delay period', () => {
    const callback = vi.fn();
    const throttled = throttleCallback(callback, 1000);

    throttled('test1');
    throttled('test2');
    throttled('test3');

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('test1');
  });

  it('should call callback again after delay period', () => {
    const callback = vi.fn();
    const throttled = throttleCallback(callback, 1000);

    throttled('test1');
    vi.advanceTimersByTime(1100);
    throttled('test2');

    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenNthCalledWith(1, 'test1');
    expect(callback).toHaveBeenNthCalledWith(2, 'test2');
  });

  it('should work with multiple arguments', () => {
    const callback = vi.fn();
    const throttled = throttleCallback(callback, 1000);

    throttled('test', 123, true);

    expect(callback).toHaveBeenCalledWith('test', 123, true);
  });
});
