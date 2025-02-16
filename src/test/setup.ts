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
    public addChild = vi.fn();
    public removeChild = vi.fn();
  }

  return {
    Application: class MockApplication {
      public stage = createStageMock();
      public ticker = createTickerMock();
      public canvas = document.createElement('canvas');
      public render = vi.fn();
      public init = vi.fn().mockResolvedValue(undefined);
    },
    Container,
  };
});
