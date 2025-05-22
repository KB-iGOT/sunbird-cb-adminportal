import { PublicGcpUrlPipe } from './public-gcp-url.pipe'

// Mock the environment
jest.mock('../../../../../../../../src/environments/environment', () => ({
  environment: {
    contentHost: 'https://mock-content-host.com'
  }
}))

describe('PublicGcpUrlPipe', () => {
  let pipe: PublicGcpUrlPipe

  beforeEach(() => {
    pipe = new PublicGcpUrlPipe()
  })

  describe('transform', () => {
    it('should create pipe instance', () => {
      expect(pipe).toBeTruthy()
    })

    it('should transform URL with /content path correctly', () => {
      const inputUrl = 'https://example.com/some/path/content/images/test.jpg'
      const expectedOutput = 'https://mock-content-host.com/assets/public/content/images/test.jpg'

      const result = pipe.transform(inputUrl)

      expect(result).toBe(expectedOutput)
    })

    it('should handle URL with /content at the end', () => {
      const inputUrl = 'https://example.com/some/path/content'
      const expectedOutput = 'https://mock-content-host.com/assets/public/content'

      const result = pipe.transform(inputUrl)

      expect(result).toBe(expectedOutput)
    })

    it('should handle URL with multiple /content occurrences (uses the last one)', () => {
      const inputUrl = 'https://example.com/content/some/path/content/images/test.jpg'
      const expectedOutput = 'https://mock-content-host.com/assets/public/content/images/test.jpg'

      const result = pipe.transform(inputUrl)

      expect(result).toBe(expectedOutput)
    })

    it('should handle URL with /content followed by query parameters', () => {
      const inputUrl = 'https://example.com/path/content/image.jpg?version=1&size=large'
      const expectedOutput = 'https://mock-content-host.com/assets/public/content/image.jpg?version=1&size=large'

      const result = pipe.transform(inputUrl)

      expect(result).toBe(expectedOutput)
    })

    it('should return undefined when URL does not contain /content', () => {
      const inputUrl = 'https://example.com/some/path/images/test.jpg'

      const result = pipe.transform(inputUrl)

      expect(result).toBeUndefined()
    })

    it('should return undefined when URL is empty string', () => {
      const inputUrl = ''

      const result = pipe.transform(inputUrl)

      expect(result).toBeUndefined()
    })

    it('should handle URL ending with /content/', () => {
      const inputUrl = 'https://example.com/some/path/content/'
      const expectedOutput = 'https://mock-content-host.com/assets/public/content/'

      const result = pipe.transform(inputUrl)

      expect(result).toBe(expectedOutput)
    })

    it('should handle URL with /content followed by nested paths', () => {
      const inputUrl = 'https://storage.googleapis.com/bucket/content/folder/subfolder/file.pdf'
      const expectedOutput = 'https://mock-content-host.com/assets/public/content/folder/subfolder/file.pdf'

      const result = pipe.transform(inputUrl)

      expect(result).toBe(expectedOutput)
    })

    // Edge cases
    it('should throw TypeError when input is null', () => {
      expect(() => {
        pipe.transform(null as any)
      }).toThrow(TypeError)
    })

    it('should throw TypeError when input is undefined', () => {
      expect(() => {
        pipe.transform(undefined as any)
      }).toThrow(TypeError)
    })

    it('should handle URL with only /content (no trailing content)', () => {
      const inputUrl = 'https://example.com/content'
      const expectedOutput = 'https://mock-content-host.com/assets/public/content'

      const result = pipe.transform(inputUrl)

      expect(result).toBe(expectedOutput)
    })
  })

  describe('environment integration', () => {
    it('should use environment.contentHost in the transformation', () => {
      const inputUrl = 'https://example.com/content/test.jpg'
      const result = pipe.transform(inputUrl)

      expect(result).toContain('https://mock-content-host.com')
      expect(result).toContain('/assets/public/content')
    })
  })
})