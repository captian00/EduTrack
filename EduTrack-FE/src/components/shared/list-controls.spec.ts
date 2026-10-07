import { describe, expect, it } from 'vitest';
import { tableIndex } from './list-controls';

describe('tableIndex', () => {
  it('uses the absolute index across pages', () => {
    expect(tableIndex({ page: 1, pageSize: 20 }, 0)).toBe(1);
    expect(tableIndex({ page: 3, pageSize: 20 }, 4)).toBe(45);
  });
});
