import { Container } from 'pixi.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VisualClip } from './visual-clip';
import type { Track } from '../composition/track';
import type { Position, Size } from '../types';

// Create a concrete implementation for testing
class TestVisualClip extends VisualClip {
  private container: Container;

  constructor() {
    super({
      offset: 0,
      duration: 5,
      position: { left: 10, top: 20 },
      size: { width: 100, height: 200 },
    });
    this.container = new Container();
  }

  public _getContainer() {
    return this.container;
  }

  public render() {
    // No-op for testing
  }

  public destroy() {
    // No-op for testing
  }

  // Expose protected method for testing
  public testGetTrack() {
    return this.getTrack();
  }
}

describe('VisualClip', () => {
  let clip: TestVisualClip;
  let mockTrack: Track;

  beforeEach(() => {
    clip = new TestVisualClip();
    mockTrack = {
      removeClip: vi.fn(),
    } as unknown as Track;
  });

  it('should initialize with position and size', () => {
    expect(clip.getPosition()).toEqual({ left: 10, top: 20 });
    expect(clip.getSize()).toEqual({ width: 100, height: 200 });
  });

  it('should update position', () => {
    const newPosition: Position = { left: 30, top: 40 };
    clip.setPosition(newPosition);
    expect(clip.getPosition()).toEqual(newPosition);
  });

  it('should update size', () => {
    const newSize: Size = { width: 300, height: 400 };
    clip.setSize(newSize);
    expect(clip.getSize()).toEqual(newSize);
  });

  describe('remove()', () => {
    it('should remove itself from parent container and track', () => {
      // Setup
      clip.setTrack(mockTrack);
      const container = clip._getContainer();
      const mockRemoveFromParent = vi.fn();
      container.removeFromParent = mockRemoveFromParent;

      // Act
      clip.remove();

      // Assert
      expect(mockRemoveFromParent).toHaveBeenCalled();
      expect(mockTrack.removeClip).toHaveBeenCalledWith(clip);
    });

    it('should throw error if track is not set', () => {
      // Act & Assert
      expect(() => clip.testGetTrack()).toThrow('Track is not set');
    });
  });

  describe('setDisplayOrder()', () => {
    it('should set child index in parent container', () => {
      // Setup
      const mockParent = new Container();
      const mockSetChildIndex = vi.fn();
      mockParent.setChildIndex = mockSetChildIndex;
      clip._getContainer().parent = mockParent;

      // Execute
      clip.setDisplayOrder(2);

      // Verify
      expect(mockSetChildIndex).toHaveBeenCalledWith(clip._getContainer(), 2);
    });
  });
});
