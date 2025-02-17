/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable unicorn/consistent-function-scoping */
// eslint-disable-next-line import/no-extraneous-dependencies
import { vi } from 'vitest';

// Mock PIXI.js Application
vi.mock('pixi.js', () => {
  // Create a mock ticker that supports method chaining
  const createTickerMock = () => {
    const ticker = {
      add: vi.fn(() => ticker),
      remove: vi.fn(() => ticker),
      start: vi.fn(() => ticker),
      stop: vi.fn(() => ticker),
      maxFPS: 60,
    };
    return ticker;
  };

  // Create a mock stage that supports method chaining
  const createStageMock = () => {
    const stage = {
      addChild: vi.fn(() => stage),
      removeChild: vi.fn(() => stage),
      visible: true,
    };
    return stage;
  };

  class Container {
    public visible: boolean = true;
    public children: any[] = [];
    public addChild = vi.fn((child) => {
      this.children.push(child);
      return this;
    });
    public removeChild = vi.fn((child) => {
      const index = this.children.indexOf(child);
      if (index !== -1) {
        this.children.splice(index, 1);
      }
      return this;
    });
    public destroy = vi.fn();
  }

  class Rectangle {
    constructor(
      public x: number = 0,
      public y: number = 0,
      public width: number = 0,
      public height: number = 0
    ) {}
  }

  class Texture {
    public source: any;
    public frame: Rectangle | null = null;
    public valid: boolean = true;
    public width: number;
    public height: number;

    constructor(options: { source?: any; frame?: Rectangle }) {
      this.source = options.source;
      this.frame = options.frame || null;
      this.width = this.source?.width || 0;
      this.height = this.source?.height || 0;
    }

    public destroy = vi.fn();
  }

  class Sprite {
    public texture: any;
    public position = {
      x: 0,
      y: 0,
      set: vi.fn((x: number, y: number) => {
        this.position.x = x;
        this.position.y = y;
      }),
    };
    public scale = {
      x: 1,
      y: 1,
      set: vi.fn((x: number, y: number) => {
        this.scale.x = x;
        this.scale.y = y;
      }),
    };
    public width: number = 0;
    public height: number = 0;
    public visible: boolean = true;
    public label: string = '';

    constructor(options?: { texture?: any; label?: string }) {
      this.texture = options?.texture || new Texture({ source: null });
      this.label = options?.label || '';
      if (options?.texture) {
        this.width = options.texture.width || 0;
        this.height = options.texture.height || 0;
      }
    }

    public setSize(width: number, height: number) {
      this.width = width;
      this.height = height;
    }

    public destroy = vi.fn();
  }

  class Text {
    public text: string;
    public style: any;
    public position = {
      x: 0,
      y: 0,
      set: vi.fn((x: number, y: number) => {
        this.position.x = x;
        this.position.y = y;
      }),
    };
    public scale = {
      x: 1,
      y: 1,
      set: vi.fn((x: number, y: number) => {
        this.scale.x = x;
        this.scale.y = y;
      }),
    };
    public width: number = 100; // Default width for scaling calculations
    public height: number = 50; // Default height for scaling calculations
    public visible: boolean = true;

    constructor(options: { text: string; style?: any }) {
      this.text = options.text;
      this.style = options.style || {};
      this.scale.x = 1;
      this.scale.y = 1;
    }

    public destroy = vi.fn();
  }

  class TextStyle {
    public fontFamily?: string;
    public fontSize?: number;
    public fill?: string;
    public fontStyle?: string;
    public fontWeight?: string;
    public letterSpacing?: number;
    public lineHeight?: number;
    public align?: string;
    public padding?: number;
    public stroke?: string;
    public strokeThickness?: number;

    constructor(options: Partial<TextStyle> = {}) {
      Object.assign(this, options);
    }
  }

  class VideoSource {
    public resource: HTMLVideoElement;
    public width: number;
    public height: number;
    public valid: boolean = true;
    public destroy = vi.fn();
    public texture: Texture;

    constructor(options: { resource: HTMLVideoElement; autoPlay?: boolean; autoLoad?: boolean; updateFPS?: number }) {
      this.resource = options.resource;
      this.width = this.resource.videoWidth || 1920;
      this.height = this.resource.videoHeight || 1080;

      // Set up initial properties on the video element
      this.resource.currentTime = 0;
      this.resource.autoplay = options.autoPlay || false;

      // Create a texture for the video source
      this.texture = new Texture({ source: this.resource });
    }
  }

  // Helper function to create a Rectangle instance
  const createRectangle = (x: number, y: number, width: number, height: number) => {
    return new Rectangle(x, y, width, height);
  };

  return {
    Application: class MockApplication {
      public stage = createStageMock();
      public ticker = createTickerMock();
      public canvas = document.createElement('canvas');
      public render = vi.fn();
      public init = vi.fn().mockResolvedValue(undefined);
    },
    Container,
    Rectangle,
    Sprite,
    Text,
    TextStyle,
    Texture,
    VideoSource,
    createRectangle,
  };
});
