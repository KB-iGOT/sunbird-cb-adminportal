import { PipePublicURL } from './pipe-public-URL.pipe'
import { environment } from 'src/environments/environment'

describe('PipePublicURL', () => {
  let pipe: PipePublicURL

  beforeEach(() => {
    pipe = new PipePublicURL()
  })

  it('should create an instance', () => {
    expect(pipe).toBeTruthy()
  })

  describe('transform', () => {
    it('should return empty string when value is empty', () => {
      expect(pipe.transform('')).toBe('')
    })

    it('should transform regular content URLs correctly', () => {
      // Mock environment variables
      environment.contentHost = 'https://example.com'
      environment.contentBucket = 'bucket'

      const inputUrl = '/content/path/to/file.jpg'
      const expectedUrl = 'https://example.com/bucket/content/path/to/file.jpg'

      expect(pipe.transform(inputUrl)).toBe(expectedUrl)
    })

    it('should transform Events_default URLs correctly', () => {
      // Mock environment variables
      environment.contentHost = 'https://example.com'
      environment.contentBucket = 'bucket'

      const inputUrl = '/content/Events_default/path/to/file.jpg'
      const expectedUrl = 'https://example.com/Events_default/path/to/file.jpg'

      expect(pipe.transform(inputUrl)).toBe(expectedUrl)
    })

    it('should handle URLs without /content prefix', () => {
      // Mock environment variables
      environment.contentHost = 'https://example.com'
      environment.contentBucket = 'bucket'

      const inputUrl = 'path/without/content/prefix.jpg'
      const expectedUrl = 'https://example.com/bucket/content'

      expect(pipe.transform(inputUrl)).toBe(expectedUrl)
    })

    it('should handle URLs with multiple /content occurrences', () => {
      // Mock environment variables
      environment.contentHost = 'https://example.com'
      environment.contentBucket = 'bucket'

      const inputUrl = '/some/path/content/inner/content/file.jpg'
      const expectedUrl = 'https://example.com/bucket/content/inner/content/file.jpg'

      expect(pipe.transform(inputUrl)).toBe(expectedUrl)
    })
  })
})