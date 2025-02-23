import { Container, Text as PixiText } from 'pixi.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TextClip } from './text-clip';
import { ClipType } from '../types';

describe('TextClip', () => {
  let textClip: TextClip;

  beforeEach(() => {
    textClip = new TextClip({
      id: 'test-text',
      text: 'Test Text',
      offset: 0,
      duration: 5,
    });
  });

  describe('getType', () => {
    it('should return ClipType.TEXT', () => {
      expect(textClip.getType()).toBe(ClipType.TEXT);
    });
  });

  describe('initialization', () => {
    it('should create a text clip with default values', () => {
      expect(textClip).toBeDefined();
      expect(textClip._getContainer()).toBeInstanceOf(Container);
      const container = textClip._getContainer();
      expect(container.children[0]).toBeInstanceOf(PixiText);
      const pixiText = container.children[0] as PixiText;
      expect(pixiText.text).toBe('Test Text');
    });

    it('should create a text clip with custom position and size', () => {
      const customClip = new TextClip({
        id: 'test-text',
        offset: 0,
        duration: 5,
        text: 'Test Text',
        position: { left: 10, top: 20 },
        size: { width: 200, height: 150 },
      });

      const pixiText = customClip._getContainer().children[0] as PixiText;
      expect(pixiText.position.x).toBe(10);
      expect(pixiText.position.y).toBe(20);
      // Size is handled through scale in TextClip
      expect(pixiText.scale.x).toBeGreaterThan(0);
      expect(pixiText.scale.y).toBeGreaterThan(0);
    });

    it('should create a text clip with custom style', () => {
      const customClip = new TextClip({
        id: 'test-text',
        offset: 0,
        duration: 5,
        text: 'Test Text',
        style: {
          fontFamily: 'Arial',
          fontSize: 24,
          fill: '#FF0000',
          fontStyle: 'italic',
          align: 'center',
        },
      });

      const pixiText = customClip._getContainer().children[0] as PixiText;
      expect(pixiText.style.fontFamily).toBe('Arial');
      expect(pixiText.style.fontSize).toBe(24);
      expect(pixiText.style.fill).toBe('#FF0000');
      expect(pixiText.style.fontStyle).toBe('italic');
      expect(pixiText.style.align).toBe('center');
    });
  });

  describe('text content and style', () => {
    it('should update text content correctly', () => {
      textClip.setText('New Text');
      const pixiText = textClip._getContainer().children[0] as PixiText;
      expect(pixiText.text).toBe('New Text');
    });

    it('should update text style correctly', () => {
      textClip.setStyle({
        fontFamily: 'Times New Roman',
        fontSize: 32,
        fill: '#00FF00',
        fontStyle: 'italic',
      });

      const pixiText = textClip._getContainer().children[0] as PixiText;
      expect(pixiText.style.fontFamily).toBe('Times New Roman');
      expect(pixiText.style.fontSize).toBe(32);
      expect(pixiText.style.fill).toBe('#00FF00');
      expect(pixiText.style.fontStyle).toBe('italic');
    });

    it('should maintain existing style properties when updating partially', () => {
      // Set initial style
      textClip.setStyle({
        fontFamily: 'Arial',
        fontSize: 24,
        fill: '#FF0000',
      });

      // Update only some properties
      textClip.setStyle({
        fontSize: 32,
        fontStyle: 'italic',
      });

      const pixiText = textClip._getContainer().children[0] as PixiText;
      expect(pixiText.style.fontFamily).toBe('Arial');
      expect(pixiText.style.fontSize).toBe(32);
      expect(pixiText.style.fill).toBe('#FF0000');
      expect(pixiText.style.fontStyle).toBe('italic');
    });
  });

  describe('position and size', () => {
    it('should update position correctly', () => {
      textClip.setPosition(30, 40);
      const pixiText = textClip._getContainer().children[0] as PixiText;
      expect(pixiText.position.x).toBe(30);
      expect(pixiText.position.y).toBe(40);
    });

    it('should update size correctly', () => {
      const originalScale = (textClip._getContainer().children[0] as PixiText).scale.x;
      textClip.setSize(300, 200);
      const pixiText = textClip._getContainer().children[0] as PixiText;
      expect(pixiText.scale.x).not.toBe(originalScale);
      expect(pixiText.scale.y).not.toBe(originalScale);
    });
  });

  describe('rendering', () => {
    it('should show clip when time is within range', () => {
      textClip.render(2);
      expect(textClip._getContainer().visible).toBe(true);
    });

    it('should hide clip when time is before start', () => {
      textClip.render(-1);
      expect(textClip._getContainer().visible).toBe(false);
    });

    it('should hide clip when time is after end', () => {
      textClip.render(6);
      expect(textClip._getContainer().visible).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should destroy text and container on cleanup', () => {
      const pixiText = textClip._getContainer().children[0] as PixiText;
      const container = textClip._getContainer();

      const textDestroySpy = vi.spyOn(pixiText, 'destroy');
      const containerDestroySpy = vi.spyOn(container, 'destroy');

      textClip.destroy();

      expect(textDestroySpy).toHaveBeenCalled();
      expect(containerDestroySpy).toHaveBeenCalled();
    });
  });
});
