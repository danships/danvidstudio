import { describe, expect, it, vi } from 'vitest';
import { generateUUID } from './generate-uuid';

describe('generateUUID', () => {
  it('should generate a valid UUID', () => {
    const mockUUID = '123e4567-e89b-12d3-a456-426614174000';
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockUUID);

    const uuid = generateUUID();

    expect(uuid).toBe(mockUUID);
    expect(crypto.randomUUID).toHaveBeenCalled();
  });
});
