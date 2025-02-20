import { Container } from 'pixi.js';
import { describe, expect, it, vi } from 'vitest';
import { VisualClip } from './visual-clip';

// Create a concrete implementation of VisualClip for testing
class TestVisualClip extends VisualClip {
  private container: Container;

  constructor(options: { offset: number; duration: number }) {
    super({
      offset: options.offset,
      duration: options.duration,
    });
    this.container = new Container();
  }

  public _getContainer(): Container {
    return this.container;
  }

  public render(): void {
    // Implementation for testing
  }

  public destroy(): void {
    // Implementation for testing
  }
}

describe('VisualClip', () => {
  describe('display order', () => {
    it('should set display order correctly', () => {
      const clip = new TestVisualClip({
        offset: 0,
        duration: 5,
      });

      const mockSetChildIndex = vi.fn();
      const mockParent = new Container();
      mockParent.setChildIndex = mockSetChildIndex;
      const clipContainer = clip._getContainer();
      clipContainer.parent = mockParent;

      clip.setDisplayOrder(2);
      expect(mockSetChildIndex).toHaveBeenCalledWith(clipContainer, 2);
    });
  });
});
