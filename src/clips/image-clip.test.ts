import type { Texture } from 'pixi.js';
import { Container, Rectangle, Sprite } from 'pixi.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ImageClip } from './image-clip';
import type { ImageSource } from '../sources/image-source';

// Mock Texture and ImageSource
const mockTexture = {
  source: {
    width: 100,
    height: 100,
    resource: {},
  },
  frame: null,
  valid: true,
  width: 100,
  height: 100,
  destroy: vi.fn(),
} as unknown as Texture;

const mockImageSource: ImageSource = {
  _texture: mockTexture,
  width: 100,
  height: 100,
};

describe('ImageClip', () => {
  let imageClip: ImageClip;

  beforeEach(() => {
    imageClip = new ImageClip({
      id: 'test-image',
      start: 0,
      end: 5,
      source: mockImageSource,
    });
  });

  describe('initialization', () => {
    it('should create an image clip with default values', () => {
      expect(imageClip).toBeDefined();
      expect(imageClip._getContainer()).toBeInstanceOf(Container);
      const container = imageClip._getContainer();
      expect(container.children[0]).toBeInstanceOf(Sprite);
    });

    it('should create an image clip with custom position and size', () => {
      const customClip = new ImageClip({
        id: 'test-image',
        start: 0,
        end: 5,
        source: mockImageSource,
        position: { left: 10, top: 20 },
        size: { width: 200, height: 150 },
      });

      const sprite = customClip._getContainer().children[0] as Sprite;
      expect(sprite.position.x).toBe(10);
      expect(sprite.position.y).toBe(20);
      expect(sprite.width).toBe(200);
      expect(sprite.height).toBe(150);
    });

    it('should create an image clip with initial crop', () => {
      const croppedClip = new ImageClip({
        id: 'test-image',
        start: 0,
        end: 5,
        source: mockImageSource,
        crop: { x: 10, y: 10, width: 50, height: 50 },
      });

      const sprite = croppedClip._getContainer().children[0] as Sprite;
      expect(sprite.texture.frame).toBeInstanceOf(Rectangle);
      expect(sprite.texture.frame.x).toBe(10);
      expect(sprite.texture.frame.y).toBe(10);
      expect(sprite.texture.frame.width).toBe(50);
      expect(sprite.texture.frame.height).toBe(50);
    });
  });

  describe('cropping', () => {
    it('should set crop correctly', () => {
      imageClip.setCrop(20, 20, 60, 60);
      const sprite = imageClip._getContainer().children[0] as Sprite;
      expect(sprite.texture.frame).toBeInstanceOf(Rectangle);
      expect(sprite.texture.frame.x).toBe(20);
      expect(sprite.texture.frame.y).toBe(20);
      expect(sprite.texture.frame.width).toBe(60);
      expect(sprite.texture.frame.height).toBe(60);
    });

    it('should remove crop correctly', () => {
      imageClip.setCrop(20, 20, 60, 60);
      imageClip.removeCrop();
      const sprite = imageClip._getContainer().children[0] as Sprite;
      expect(sprite.texture.frame).toBeNull();
    });
  });

  describe('position and size', () => {
    it('should update position correctly', () => {
      imageClip.setPosition({ left: 30, top: 40 });
      const sprite = imageClip._getContainer().children[0] as Sprite;
      expect(sprite.position.x).toBe(30);
      expect(sprite.position.y).toBe(40);
    });

    it('should update size correctly', () => {
      imageClip.setSize({ width: 300, height: 200 });
      const sprite = imageClip._getContainer().children[0] as Sprite;
      expect(sprite.width).toBe(300);
      expect(sprite.height).toBe(200);
    });
  });

  describe('rendering', () => {
    it('should show clip when time is within range', () => {
      imageClip.render(2);
      expect(imageClip._getContainer().visible).toBe(true);
    });

    it('should hide clip when time is before start', () => {
      imageClip.render(-1);
      expect(imageClip._getContainer().visible).toBe(false);
    });

    it('should hide clip when time is after end', () => {
      imageClip.render(6);
      expect(imageClip._getContainer().visible).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should destroy sprite, cropped texture, and container', () => {
      // Set up a cropped texture first
      imageClip.setCrop(20, 20, 60, 60);

      const sprite = imageClip._getContainer().children[0] as Sprite;
      const container = imageClip._getContainer();

      const spriteDestroySpy = vi.spyOn(sprite, 'destroy');
      const textureDestroySpy = vi.spyOn(sprite.texture, 'destroy');
      const containerDestroySpy = vi.spyOn(container, 'destroy');

      imageClip.destroy();

      expect(spriteDestroySpy).toHaveBeenCalled();
      expect(textureDestroySpy).toHaveBeenCalled();
      expect(containerDestroySpy).toHaveBeenCalledWith({ children: true });
    });

    it('should not destroy texture if no crop is set', () => {
      const sprite = imageClip._getContainer().children[0] as Sprite;
      const container = imageClip._getContainer();

      const spriteDestroySpy = vi.spyOn(sprite, 'destroy');
      const textureDestroySpy = vi.spyOn(sprite.texture, 'destroy');
      const containerDestroySpy = vi.spyOn(container, 'destroy');

      imageClip.destroy();

      expect(spriteDestroySpy).toHaveBeenCalled();
      expect(textureDestroySpy).not.toHaveBeenCalled(); // Texture should not be destroyed when no crop
      expect(containerDestroySpy).toHaveBeenCalledWith({ children: true });
    });
  });
});
