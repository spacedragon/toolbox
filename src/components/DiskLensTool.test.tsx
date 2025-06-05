// src/components/DiskLensTool.test.tsx

// import { formatSize, sortItems } from './DiskLensTool'; // Or from a utils file if extracted

// --- Test cases for formatSize ---

/*
describe('formatSize', () => {
  test('should format 0 bytes correctly', () => {
    expect(formatSize(0)).toBe('0 Bytes');
  });

  test('should format bytes correctly', () => {
    expect(formatSize(500)).toBe('500 Bytes');
  });

  test('should format kilobytes correctly', () => {
    expect(formatSize(1024)).toBe('1.00 KB');
    expect(formatSize(1536)).toBe('1.50 KB'); // 1.5 * 1024
  });

  test('should format megabytes correctly', () => {
    expect(formatSize(1024 * 1024)).toBe('1.00 MB');
    expect(formatSize(1.5 * 1024 * 1024)).toBe('1.50 MB');
  });

  test('should format gigabytes correctly', () => {
    expect(formatSize(1024 * 1024 * 1024)).toBe('1.00 GB');
    expect(formatSize(2.5 * 1024 * 1024 * 1024)).toBe('2.50 GB');
  });

  test('should format terabytes correctly', () => {
    expect(formatSize(1024 * 1024 * 1024 * 1024)).toBe('1.00 TB');
  });

  test('should handle negative numbers if applicable (though sizes are non-negative)', () => {
    // Current implementation returns 'N/A' for negative numbers
    expect(formatSize(-100)).toBe('N/A');
  });
});
*/

// --- Test cases for sortItems ---

/*
// Mock ScannedItem interface for testing
interface ScannedItem {
  path: string;
  name: string;
  size: number;
  is_dir: boolean;
  error?: string;
}

describe('sortItems', () => {
  const items: ScannedItem[] = [
    { path: '/c', name: 'C', size: 300, is_dir: false },
    { path: '/a', name: 'A', size: 100, is_dir: true },
    { path: '/b', name: 'B', size: 200, is_dir: false },
    { path: '/d', name: 'D', size: 100, is_dir: false }, // Same size as A
  ];

  test('should sort items in descending order by size by default or when specified', () => {
    const sortedDesc = sortItems([...items], 'desc');
    expect(sortedDesc[0].name).toBe('C');
    expect(sortedDesc[1].name).toBe('B');
    // For items with same size, original relative order might be preserved or not, depending on sort stability.
    // Test for the primary sort criterion (size).
    expect([sortedDesc[2].size, sortedDesc[3].size]).toEqual(expect.arrayContaining([100, 100]));

    // A more robust check for items with same size:
    const namesForSize100Desc = sortedDesc.filter(item => item.size === 100).map(item => item.name);
    expect(namesForSize100Desc).toEqual(expect.arrayContaining(['A', 'D']));
  });

  test('should sort items in ascending order by size when specified', () => {
    const sortedAsc = sortItems([...items], 'asc');
    expect([sortedAsc[0].size, sortedAsc[1].size]).toEqual(expect.arrayContaining([100, 100]));
    expect(sortedAsc[2].name).toBe('B');
    expect(sortedAsc[3].name).toBe('C');

    const namesForSize100Asc = sortedAsc.filter(item => item.size === 100).map(item => item.name);
    expect(namesForSize100Asc).toEqual(expect.arrayContaining(['A', 'D']));
  });

  test('should handle an empty array', () => {
    expect(sortItems([], 'desc')).toEqual([]);
    expect(sortItems([], 'asc')).toEqual([]);
  });

  test('should handle array with one item', () => {
    const singleItem: ScannedItem[] = [{ path: '/a', name: 'A', size: 100, is_dir: false }];
    expect(sortItems([...singleItem], 'desc')).toEqual(singleItem);
    expect(sortItems([...singleItem], 'asc')).toEqual(singleItem);
  });
});
*/

// Note: To make these tests runnable, a test runner like Vitest or Jest needs to be set up in the project.
// The functions formatSize and sortItems would also need to be exported from their defining file
// (e.g., DiskLensTool.tsx or a shared utils.ts file) and imported into this test file.
// For example:
// import { formatSize, sortItems } from './DiskLensTool'; // Or './utils';

// If formatSize and sortItems are defined within the DiskLensTool component and not exported,
// they would need to be refactored to be top-level functions in the module or moved to a utility file.
// Based on the previous subtask that created DiskLensTool.tsx, these functions were defined
// as top-level consts within the DiskLensTool.tsx file, so they can be exported like:
// export const formatSize = (...) => { ... }
// export const sortItems = (...) => { ... }
// And then imported here.
