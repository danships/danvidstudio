import type { Size, TextStyleFontWeight } from 'pixi.js';
import { Container, Text as PixiText, TextStyle } from 'pixi.js';
import { VisualClip, type VisualOptions } from '../base/visual-clip';
import type { Position } from '../types';
import { logger } from '../utils/logger';

export type TextOptions = VisualOptions & {
  text: string;
  style?: {
    fontFamily?: string;
    fontSize?: number;
    fill?: string | number;
    fontStyle?: 'normal' | 'italic' | 'oblique';
    fontWeight?: TextStyleFontWeight;
    textDecoration?: 'none' | 'line-through';
    letterSpacing?: number;
    lineHeight?: number;
    align?: 'left' | 'center' | 'right';
    padding?: number;
    stroke?: string | number;
    strokeThickness?: number;
  };
};

export class TextClip extends VisualClip {
  private container: Container = new Container();
  private pixiText: PixiText | null = null;
  private textContent: string;
  private textStyle: Required<TextOptions>['style'];

  constructor(options: TextOptions) {
    super({
      id: options.id,
      start: options.start,
      end: options.end,
      position: options.position,
      size: options.size,
      track: options.track,
    });

    this.textContent = options.text;
    this.textStyle = options.style || {};

    this.initializeText();
  }

  private initializeText(): void {
    const styleOptions: Partial<TextStyle> = {};

    if (this.textStyle?.fontFamily) {
      styleOptions.fontFamily = this.textStyle.fontFamily;
    }
    if (this.textStyle?.fontSize) {
      styleOptions.fontSize = this.textStyle.fontSize;
    }
    if (this.textStyle?.fill) {
      styleOptions.fill = this.textStyle.fill;
    }
    if (this.textStyle?.fontStyle) {
      styleOptions.fontStyle = this.textStyle.fontStyle;
    }
    if (this.textStyle?.fontWeight) {
      styleOptions.fontWeight = this.textStyle.fontWeight;
    }
    if (this.textStyle?.letterSpacing) {
      styleOptions.letterSpacing = this.textStyle.letterSpacing;
    }
    if (this.textStyle?.lineHeight) {
      styleOptions.lineHeight = this.textStyle.lineHeight;
    }
    if (this.textStyle?.align) {
      styleOptions.align = this.textStyle.align;
    }
    if (this.textStyle?.padding) {
      styleOptions.padding = this.textStyle.padding;
    }
    if (this.textStyle?.stroke) {
      styleOptions.stroke = this.textStyle.stroke;
    }

    const style = new TextStyle(styleOptions);

    this.pixiText = new PixiText({
      text: this.textContent,
      style,
    });

    // Set position
    if (this.position) {
      this.pixiText.position.set(this.position.left, this.position.top);
    }

    // If width/height are specified, we need to scale the text to fit
    if (this.size) {
      this.updateTextSize();
    }

    this.container.addChild(this.pixiText);
  }

  private updateTextSize(): void {
    if (!this.pixiText || !this.size) {
      return;
    }

    // Calculate scales for both width and height
    const widthScale = this.size.width / this.pixiText.width;
    const heightScale = this.size.height / this.pixiText.height;

    // Use the smaller scale to maintain aspect ratio while fitting within bounds
    const scale = Math.min(widthScale, heightScale);
    this.pixiText.scale.set(scale);
  }

  public setText(text: string): this {
    if (this.pixiText) {
      this.textContent = text;
      this.pixiText.text = text;
      this.updateTextSize();
    }
    return this;
  }

  public setStyle(style: Partial<TextOptions['style']>): this {
    if (!this.pixiText) {
      return this;
    }

    this.textStyle = { ...this.textStyle, ...style };
    const styleOptions: Partial<TextStyle> = {};

    if (this.textStyle?.fontFamily) {
      styleOptions.fontFamily = this.textStyle.fontFamily;
    }
    if (this.textStyle?.fontSize) {
      styleOptions.fontSize = this.textStyle.fontSize;
    }
    if (this.textStyle?.fill) {
      styleOptions.fill = this.textStyle.fill;
    }
    if (this.textStyle?.fontStyle) {
      styleOptions.fontStyle = this.textStyle.fontStyle;
    }
    if (this.textStyle?.fontWeight) {
      styleOptions.fontWeight = this.textStyle.fontWeight;
    }
    if (this.textStyle?.letterSpacing) {
      styleOptions.letterSpacing = this.textStyle.letterSpacing;
    }
    if (this.textStyle?.lineHeight) {
      styleOptions.lineHeight = this.textStyle.lineHeight;
    }
    if (this.textStyle?.align) {
      styleOptions.align = this.textStyle.align;
    }
    if (this.textStyle?.padding) {
      styleOptions.padding = this.textStyle.padding;
    }
    if (this.textStyle?.stroke) {
      styleOptions.stroke = this.textStyle.stroke;
    }

    this.pixiText.style = new TextStyle(styleOptions);
    this.updateTextSize();
    return this;
  }

  public setPosition(position: Position): this {
    if (this.pixiText) {
      this.pixiText.position.set(position.left, position.top);
    }
    super.setPosition(position);

    return this;
  }

  public setSize(size: Size): this {
    this.updateTextSize();
    super.setSize(size);

    return this;
  }

  public _getContainer(): Container {
    return this.container;
  }

  public render(time: number): void {
    if (!this.pixiText) {
      logger.warn('TextClip not initialized, skipping render');
      return;
    }

    // Show/hide the text based on clip timing
    const clipTime = time - this.start;
    this.container.visible = clipTime >= 0 && clipTime <= this.end - this.start;
  }

  public destroy(): void {
    if (this.pixiText) {
      this.pixiText.destroy();
    }
    this.container.destroy();
  }
}
