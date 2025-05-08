// Import the constants from the file
// Replace with actual file path

import { FILE_MAX_SIZE, FIXED_FILE_NAME, IMAGE_MAX_SIZE, IMAGE_SUPPORT_TYPES, VIDEO_MAX_SIZE } from "./upload"

describe('File Constants', () => {
  // Test IMAGE_SUPPORT_TYPES
  test('IMAGE_SUPPORT_TYPES should be an array with correct file extensions', () => {
    expect(Array.isArray(IMAGE_SUPPORT_TYPES)).toBe(true)
    expect(IMAGE_SUPPORT_TYPES).toHaveLength(5)
    expect(IMAGE_SUPPORT_TYPES).toContain('.png')
    expect(IMAGE_SUPPORT_TYPES).toContain('.jpg')
    expect(IMAGE_SUPPORT_TYPES).toContain('.jpeg')
    expect(IMAGE_SUPPORT_TYPES).toContain('.jtif')
    expect(IMAGE_SUPPORT_TYPES).toContain('.tiff')
  })

  // Test IMAGE_MAX_SIZE
  test('IMAGE_MAX_SIZE should be 1MB in bytes', () => {
    expect(IMAGE_MAX_SIZE).toBe(1 * 1024 * 1024)
    expect(IMAGE_MAX_SIZE).toBe(1048576) // 1MB in bytes
  })

  // Test VIDEO_MAX_SIZE
  test('VIDEO_MAX_SIZE should be 200MB in bytes', () => {
    expect(VIDEO_MAX_SIZE).toBe(200 * 1024 * 1024)
    expect(VIDEO_MAX_SIZE).toBe(209715200) // 200MB in bytes
  })

  // Test FILE_MAX_SIZE
  test('FILE_MAX_SIZE should be 1000MB (~ 1GB) in bytes', () => {
    expect(FILE_MAX_SIZE).toBe(1000 * 1024 * 1024)
    expect(FILE_MAX_SIZE).toBe(1048576000) // 1000MB in bytes
  })

  // Test FIXED_FILE_NAME
  test('FIXED_FILE_NAME should be an array containing only "channel.json"', () => {
    expect(Array.isArray(FIXED_FILE_NAME)).toBe(true)
    expect(FIXED_FILE_NAME).toHaveLength(1)
    expect(FIXED_FILE_NAME).toContain('channel.json')
  })

  // Additional test to check data types
  test('All constants should have the correct data types', () => {
    expect(Array.isArray(IMAGE_SUPPORT_TYPES)).toBe(true)
    expect(typeof IMAGE_MAX_SIZE).toBe('number')
    expect(typeof VIDEO_MAX_SIZE).toBe('number')
    expect(typeof FILE_MAX_SIZE).toBe('number')
    expect(Array.isArray(FIXED_FILE_NAME)).toBe(true)
  })

  // Test to make sure values are positive
  test('All size limits should be positive numbers', () => {
    expect(IMAGE_MAX_SIZE).toBeGreaterThan(0)
    expect(VIDEO_MAX_SIZE).toBeGreaterThan(0)
    expect(FILE_MAX_SIZE).toBeGreaterThan(0)
  })
})