import { CapitalizePipe } from './capitalize.pipe' // Adjust path as needed

describe('CapitalizePipe', () => {
  let pipe: CapitalizePipe

  beforeEach(() => {
    pipe = new CapitalizePipe()
  })

  it('should create an instance', () => {
    expect(pipe).toBeTruthy()
  })

  it('should return the same value if input is empty', () => {
    expect(pipe.transform('')).toBe('')
    expect(pipe.transform('')).toBeNull()
    expect(pipe.transform('')).toBeUndefined()
  })

  it('should capitalize the first letter of each word', () => {
    expect(pipe.transform('hello world')).toBe('Hello World')
    expect(pipe.transform('angular pipe testing')).toBe('Angular Pipe Testing')
  })

  it('should handle single-word input', () => {
    expect(pipe.transform('hello')).toBe('Hello')
  })

  it('should not modify already capitalized input', () => {
    expect(pipe.transform('Hello World')).toBe('Hello World')
  })

  it('should handle mixed case input', () => {
    expect(pipe.transform('hElLo WoRlD')).toBe('Hello World')
  })

  it('should return the same value for non-string inputs (optional)', () => {
    expect(pipe.transform(123 as any)).toBe(123)
    expect(pipe.transform(true as any)).toBe(true)
  })
})
