import { of } from 'rxjs'
import { ProfileV2UtillService } from './home-utill.service'

// Mock HttpClient
const mockHttpClient = {
  get: jest.fn(),
  post: jest.fn(),
}

describe('ProfileV2UtillService', () => {
  let service: ProfileV2UtillService

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()

    // Create service instance with mocked HttpClient
    service = new ProfileV2UtillService(mockHttpClient as any)
  })

  describe('fetchBadges', () => {
    it('should fetch badges for a given wid', () => {
      // Arrange
      const wid = 'test-wid-123'
      const mockResponse: any = {
        badges: [],
        totalCount: 0
      }
      mockHttpClient.get.mockReturnValue(of(mockResponse))

      // Act
      const result = service.fetchBadges(wid)

      // Assert
      expect(mockHttpClient.get).toHaveBeenCalledWith('/apis/protected/v8/user/badge/for/test-wid-123')

      result.subscribe((response: any) => {
        expect(response).toEqual(mockResponse)
      })
    })

    it('should call correct API endpoint with wid parameter', () => {
      // Arrange
      const wid = 'another-wid'
      mockHttpClient.get.mockReturnValue(of({}))

      // Act
      service.fetchBadges(wid)

      // Assert
      expect(mockHttpClient.get).toHaveBeenCalledWith('/apis/protected/v8/user/badge/for/another-wid')
    })
  })

  describe('reCalculateBadges', () => {
    it('should make POST request to update badges endpoint', () => {
      // Arrange
      const mockResponse = { success: true }
      mockHttpClient.post.mockReturnValue(of(mockResponse))

      // Act
      const result = service.reCalculateBadges()

      // Assert
      expect(mockHttpClient.post).toHaveBeenCalledWith('/apis/protected/v8/user/badge/update', {})

      result.subscribe((response: any) => {
        expect(response).toEqual(mockResponse)
      })
    })
  })

  describe('fetchRecentBadge', () => {
    it('should fetch recent badge notifications', () => {
      // Arrange
      const mockNotifications: any = {
        totalPoints: [],
        recent_badge: undefined
      }
      mockHttpClient.get.mockReturnValue(of(mockNotifications))

      // Act
      const result = service.fetchRecentBadge()

      // Assert
      expect(mockHttpClient.get).toHaveBeenCalledWith('/apis/protected/v8/user/badge/notification')

      result.subscribe((response: any) => {
        expect(response).toEqual(mockNotifications)
      })
    })

    it('should apply map operator that returns notifications as-is', () => {
      // Arrange
      const mockNotifications = { test: 'data' }
      mockHttpClient.get.mockReturnValue(of(mockNotifications))

      // Act
      const result = service.fetchRecentBadge()

      // Assert
      result.subscribe((response: any) => {
        expect(response).toEqual(mockNotifications)
      })
    })
  })

  describe('emailTransform', () => {
    it('should transform @ to [at] and . to [dot]', () => {
      // Arrange
      const email = 'test@example.com'

      // Act
      const result = service.emailTransform(email)

      // Assert
      expect(result).toBe('test[at]example[dot]com')
    })

    it('should handle multiple dots in email', () => {
      // Arrange
      const email = 'test.user@sub.domain.com'

      // Act
      const result = service.emailTransform(email)

      // Assert
      expect(result).toBe('test[dot]user[at]sub[dot]domain[dot]com')
    })

    it('should return undefined when value is undefined', () => {
      // Arrange
      const email = undefined

      // Act
      const result = service.emailTransform(email as any)

      // Assert
      expect(result).toBeUndefined()
    })

    it('should return undefined when value is null', () => {
      // Arrange
      const email = null

      // Act
      const result = service.emailTransform(email as any)

      // Assert
      expect(result).toBeUndefined()
    })

    it('should return undefined when value is empty string', () => {
      // Arrange
      const email = ''

      // Act
      const result = service.emailTransform(email)

      // Assert
      expect(result).toBeUndefined()
    })

    it('should handle email without @ symbol', () => {
      // Arrange
      const email = 'test.example.com'

      // Act
      const result = service.emailTransform(email)

      // Assert
      expect(result).toBe('test[dot]example[dot]com')
    })

    it('should handle email without dots', () => {
      // Arrange
      const email = 'test@example'

      // Act
      const result = service.emailTransform(email)

      // Assert
      expect(result).toBe('test[at]example')
    })
  })

  describe('transformToEmail', () => {
    it('should transform [at] to @ and [dot] to .', () => {
      // Arrange
      const transformedEmail = 'test[at]example[dot]com'

      // Act
      const result = service.transformToEmail(transformedEmail)

      // Assert
      expect(result).toBe('test@example.com')
    })

    it('should handle multiple [dot] replacements', () => {
      // Arrange
      const transformedEmail = 'test[dot]user[at]sub[dot]domain[dot]com'

      // Act
      const result = service.transformToEmail(transformedEmail)

      // Assert
      expect(result).toBe('test.user@sub.domain.com')
    })

    it('should return empty string when value is undefined', () => {
      // Arrange
      const transformedEmail = undefined

      // Act
      const result = service.transformToEmail(transformedEmail)

      // Assert
      expect(result).toBe('')
    })

    it('should return empty string when value is null', () => {
      // Arrange
      const transformedEmail = null

      // Act
      const result = service.transformToEmail(transformedEmail)

      // Assert
      expect(result).toBe('')
    })

    it('should return empty string when value is empty string', () => {
      // Arrange
      const transformedEmail = ''

      // Act
      const result = service.transformToEmail(transformedEmail)

      // Assert
      expect(result).toBe('')
    })

    it('should handle value without [at] symbol', () => {
      // Arrange
      const transformedEmail = 'test[dot]example[dot]com'

      // Act
      const result = service.transformToEmail(transformedEmail)

      // Assert
      expect(result).toBe('test.example.com')
    })

    it('should handle value without [dot] symbols', () => {
      // Arrange
      const transformedEmail = 'test[at]example'

      // Act
      const result = service.transformToEmail(transformedEmail)

      // Assert
      expect(result).toBe('test@example')
    })

    it('should handle value with no transformations needed', () => {
      // Arrange
      const transformedEmail = 'plaintext'

      // Act
      const result = service.transformToEmail(transformedEmail)

      // Assert
      expect(result).toBe('plaintext')
    })
  })

  describe('API_END_POINTS', () => {
    it('should generate correct USER_BADGE endpoint', () => {
      // This test ensures the API endpoint generation is working correctly
      // We can access the function through the service's method calls
      const wid = 'test-wid'
      mockHttpClient.get.mockReturnValue(of({}))

      service.fetchBadges(wid)

      expect(mockHttpClient.get).toHaveBeenCalledWith('/apis/protected/v8/user/badge/for/test-wid')
    })
  })
})