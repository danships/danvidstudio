import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ClipOptions } from './clip';
import { Clip } from './clip';
import type { Track } from '../composition/track';

// Concrete implementation of abstract Clip class for testing
class TestClip extends Clip {
  public destroy(): void {
    // Implementation for testing
  }
  public render(): void {
    // Implementation for testing
  }
}

describe('Clip', () => {
  let clipOptions: ClipOptions;
  let clip: TestClip;
  let mockUpdated: (reason?: string) => void;

  beforeEach(() => {
    mockUpdated = vi.fn();
    clipOptions = {
      id: 'test-clip',
      offset: 0,
      duration: 10,
      updated: mockUpdated,
    };
    clip = new TestClip(clipOptions);
  });

  describe('constructor', () => {
    it('should create a clip with the provided options', () => {
      expect(clip.getOffset()).toBe(0);
      expect(clip.getDuration()).toBe(10);
      expect(clip.getEnd()).toBe(10);
    });

    it('should work without optional parameters', () => {
      const minimalClip = new TestClip({
        offset: 5,
        duration: 15,
      });
      expect(minimalClip.getOffset()).toBe(5);
      expect(minimalClip.getDuration()).toBe(15);
    });
  });

  describe('setters and getters', () => {
    it('should update offset and trigger update callback', () => {
      clip.setOffset(5);
      expect(clip.getOffset()).toBe(5);
      expect(mockUpdated).toHaveBeenCalledWith('clip updated test-clip Offset changed');
    });

    it('should update duration and trigger update callback', () => {
      clip.setDuration(20);
      expect(clip.getDuration()).toBe(20);
      expect(mockUpdated).toHaveBeenCalledWith('clip updated test-clip Duration changed');
    });

    it('should calculate end time correctly', () => {
      clip.setOffset(5);
      clip.setDuration(15);
      expect(clip.getEnd()).toBe(20);
    });
  });

  describe('track handling', () => {
    it('should throw error when getting track before setting it', () => {
      expect(() => clip['getTrack']()).toThrow('Track is not set');
    });

    it('should set and get track', () => {
      const mockTrack = {} as Track;
      clip.setTrack(mockTrack);

      expect(clip['getTrack']()).toBe(mockTrack);
    });
  });

  describe('update callback handling', () => {
    it('should set new update callback', () => {
      const newMockUpdated = vi.fn();
      clip._setUpdated(newMockUpdated);

      clip.setOffset(15);
      expect(newMockUpdated).toHaveBeenCalled();
      expect(mockUpdated).not.toHaveBeenCalled(); // Old callback should not be called
    });

    it('should trigger update with correct message', () => {
      clip['triggerUpdated']('test reason');
      expect(mockUpdated).toHaveBeenCalledWith('clip updated test-clip test reason');
    });
  });
});
