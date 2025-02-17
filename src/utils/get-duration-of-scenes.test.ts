import { describe, expect, it } from 'vitest';
import { getDurationOfScenes } from './get-duration-of-scenes';
import type { Scene } from '../composition/scene';

describe('getDurationOfScenes', () => {
  it('should return total duration of all scenes', () => {
    const mockScenes = [{ getDuration: () => 5 }, { getDuration: () => 3 }, { getDuration: () => 7 }] as Scene[];

    const totalDuration = getDurationOfScenes(mockScenes);
    expect(totalDuration).toBe(15);
  });

  it('should return 0 for empty scenes array', () => {
    const totalDuration = getDurationOfScenes([]);
    expect(totalDuration).toBe(0);
  });

  it('should handle single scene', () => {
    const mockScenes = [{ getDuration: () => 5 }] as Scene[];

    const totalDuration = getDurationOfScenes(mockScenes);
    expect(totalDuration).toBe(5);
  });
});
