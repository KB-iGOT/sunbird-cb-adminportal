
import { HttpClient } from '@angular/common/http'
import { of } from 'rxjs'
import { NSProfileDataV2 } from '../models/profile-v2.model'
import { ProfileV2UtillService } from './home-utill.service'

describe('ProfileV2UtillService', () => {
  let service: ProfileV2UtillService
  let httpClientMock: jest.Mocked<HttpClient>

  beforeEach(() => {
    // Create mock HttpClient
    httpClientMock = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
      head: jest.fn(),
      options: jest.fn(),
      request: jest.fn()
    } as any

    // Create service instance with mocked HttpClient
    service = new ProfileV2UtillService(httpClientMock)
  })

  describe('fetchBadges', () => {
    it('should fetch badges for a given wid', (done) => {
      // Arrange
      const mockWid = 'test-wid-123'
      const mockBadgeResponse: NSProfileDataV2.IBadgeResponse = {
        badges: ['badge1', 'badge2'],
        totalCount: 2
      } as any
      const expectedUrl = '/apis/protected/v8/user/badge/for/test-wid-123'

      httpClientMock.get.mockReturnValue(of(mockBadgeResponse))

      // Act
      service.fetchBadges(mockWid).subscribe((result: any) => {
        // Assert
        expect(result).toEqual(mockBadgeResponse)
        expect(httpClientMock.get).toHaveBeenCalledWith(expectedUrl)
        expect(httpClientMock.get).toHaveBeenCalledTimes(1)
        done()
      })
    })

    it('should handle empty wid', (done) => {
      // Arrange
      const mockWid = ''
      const mockBadgeResponse: NSProfileDataV2.IBadgeResponse = {
        badges: [],
        totalCount: 0
      } as any
      const expectedUrl = '/apis/protected/v8/user/badge/for/'

      httpClientMock.get.mockReturnValue(of(mockBadgeResponse))

      // Act
      service.fetchBadges(mockWid).subscribe(result => {
        // Assert
        expect(result).toEqual(mockBadgeResponse)
        expect(httpClientMock.get).toHaveBeenCalledWith(expectedUrl)
        done()
      })
    })
  })

  describe('reCalculateBadges', () => {
    it('should make POST request to recalculate badges', (done) => {
      // Arrange
      const mockResponse = { success: true, message: 'Badges recalculated' }
      const expectedUrl = '/apis/protected/v8/user/badge/update'

      httpClientMock.post.mockReturnValue(of(mockResponse))

      // Act
      service.reCalculateBadges().subscribe(result => {
        // Assert
        expect(result).toEqual(mockResponse)
        expect(httpClientMock.post).toHaveBeenCalledWith(expectedUrl, {})
        expect(httpClientMock.post).toHaveBeenCalledTimes(1)
        done()
      })
    })

    it('should handle empty response from recalculate badges', (done) => {
      // Arrange
      const mockResponse = {}
      const expectedUrl = '/apis/protected/v8/user/badge/update'

      httpClientMock.post.mockReturnValue(of(mockResponse))

      // Act
      service.reCalculateBadges().subscribe(result => {
        // Assert
        expect(result).toEqual(mockResponse)
        expect(httpClientMock.post).toHaveBeenCalledWith(expectedUrl, {})
        done()
      })
    })
  })

  describe('fetchRecentBadge', () => {
    it('should fetch recent badge notifications', (done) => {
      // Arrange
      const mockNotifications: NSProfileDataV2.IUserNotifications = {
        notifications: [
          { id: '1', message: 'New badge earned', timestamp: '2023-01-01' },
          { id: '2', message: 'Badge updated', timestamp: '2023-01-02' }
        ]
      } as any
      const expectedUrl = '/apis/protected/v8/user/badge/notification'

      httpClientMock.get.mockReturnValue(of(mockNotifications))

      // Act
      service.fetchRecentBadge().subscribe(result => {
        // Assert
        expect(result).toEqual(mockNotifications)
        expect(httpClientMock.get).toHaveBeenCalledWith(expectedUrl)
        expect(httpClientMock.get).toHaveBeenCalledTimes(1)
        done()
      })
    })

    it('should handle empty notifications response', (done) => {
      // Arrange
      const mockNotifications = { notifications: [] }
      const expectedUrl = '/apis/protected/v8/user/badge/notification'

      httpClientMock.get.mockReturnValue(of(mockNotifications))

      // Act
      service.fetchRecentBadge().subscribe(result => {
        // Assert
        expect(result).toEqual(mockNotifications)
        expect(httpClientMock.get).toHaveBeenCalledWith(expectedUrl)
        done()
      })
    })
  })

  describe('emailTransform', () => {
    it('should transform email to safe format', () => {
      // Arrange
      const input = 'test@example.com'
      const expected = 'test[at]example[dot]com'

      // Act
      const result = service.emailTransform(input)

      // Assert
      expect(result).toBe(expected)
    })

    it('should handle email with multiple dots', () => {
      // Arrange
      const input = 'test.user@sub.example.com'
      const expected = 'test[dot]user[at]sub[dot]example[dot]com'

      // Act
      const result = service.emailTransform(input)

      // Assert
      expect(result).toBe(expected)
    })

    it('should handle undefined input', () => {
      // Arrange
      const input = undefined

      // Act
      const result = service.emailTransform(input as any)

      // Assert
      expect(result).toBeUndefined()
    })

    it('should handle empty string', () => {
      // Arrange
      const input = ''

      // Act
      const result = service.emailTransform(input)

      // Assert
      expect(result).toBeUndefined()
    })

    it('should handle string without @ or dots', () => {
      // Arrange
      const input = 'plaintext'
      const expected = 'plaintext'

      // Act
      const result = service.emailTransform(input)

      // Assert
      expect(result).toBe(expected)
    })

    it('should handle string with only @', () => {
      // Arrange
      const input = 'test@domain'
      const expected = 'test[at]domain'

      // Act
      const result = service.emailTransform(input)

      // Assert
      expect(result).toBe(expected)
    })

    it('should handle string with only dots', () => {
      // Arrange
      const input = 'test.domain.extension'
      const expected = 'test[dot]domain[dot]extension'

      // Act
      const result = service.emailTransform(input)

      // Assert
      expect(result).toBe(expected)
    })
  })

  describe('transformToEmail', () => {
    it('should transform safe format back to email', () => {
      // Arrange
      const input = 'test[at]example[dot]com'
      const expected = 'test@example.com'

      // Act
      const result = service.transformToEmail(input)

      // Assert
      expect(result).toBe(expected)
    })

    it('should handle multiple [dot] replacements', () => {
      // Arrange
      const input = 'test[dot]user[at]sub[dot]example[dot]com'
      const expected = 'test.user@sub.example.com'

      // Act
      const result = service.transformToEmail(input)

      // Assert
      expect(result).toBe(expected)
    })

    it('should handle undefined input', () => {
      // Arrange
      const input = undefined

      // Act
      const result = service.transformToEmail(input)

      // Assert
      expect(result).toBe('')
    })

    it('should handle null input', () => {
      // Arrange
      const input = null

      // Act
      const result = service.transformToEmail(input)

      // Assert
      expect(result).toBe('')
    })

    it('should handle empty string', () => {
      // Arrange
      const input = ''
      const expected = ''

      // Act
      const result = service.transformToEmail(input)

      // Assert
      expect(result).toBe(expected)
    })

    it('should handle string without [at] or [dot]', () => {
      // Arrange
      const input = 'plaintext'
      const expected = 'plaintext'

      // Act
      const result = service.transformToEmail(input)

      // Assert
      expect(result).toBe(expected)
    })

    it('should handle string with only [at]', () => {
      // Arrange
      const input = 'test[at]domain'
      const expected = 'test@domain'

      // Act
      const result = service.transformToEmail(input)

      // Assert
      expect(result).toBe(expected)
    })

    it('should handle string with only [dot]', () => {
      // Arrange
      const input = 'test[dot]domain[dot]extension'
      const expected = 'test.domain.extension'

      // Act
      const result = service.transformToEmail(input)

      // Assert
      expect(result).toBe(expected)
    })
  })

  describe('API_END_POINTS', () => {
    it('should generate correct USER_BADGE endpoint', () => {
      // This tests the internal API endpoint generation
      const wid = 'test-wid'
      const expectedUrl = '/apis/protected/v8/user/badge/for/test-wid'

      // We can't directly access the private API_END_POINTS, but we can verify
      // through the service method calls
      httpClientMock.get.mockReturnValue(of({}))

      service.fetchBadges(wid)

      expect(httpClientMock.get).toHaveBeenCalledWith(expectedUrl)
    })
  })

  describe('Error Handling', () => {
    it('should handle HTTP errors in fetchBadges', (done) => {
      // Arrange
      const mockWid = 'test-wid'
      const mockError = new Error('HTTP Error')

      httpClientMock.get.mockReturnValue(of().pipe(() => {
        throw mockError
      }))

      // Act & Assert
      service.fetchBadges(mockWid).subscribe({
        next: () => {
          fail('Should have thrown an error')
        },
        error: (error) => {
          expect(error).toBe(mockError)
          done()
        }
      })
    })

    it('should handle HTTP errors in reCalculateBadges', (done) => {
      // Arrange
      const mockError = new Error('HTTP Error')

      httpClientMock.post.mockReturnValue(of().pipe(() => {
        throw mockError
      }))

      // Act & Assert
      service.reCalculateBadges().subscribe({
        next: () => {
          fail('Should have thrown an error')
        },
        error: (error) => {
          expect(error).toBe(mockError)
          done()
        }
      })
    })

    it('should handle HTTP errors in fetchRecentBadge', (done) => {
      // Arrange
      const mockError = new Error('HTTP Error')

      httpClientMock.get.mockReturnValue(of().pipe(() => {
        throw mockError
      }))

      // Act & Assert
      service.fetchRecentBadge().subscribe({
        next: () => {
          fail('Should have thrown an error')
        },
        error: (error) => {
          expect(error).toBe(mockError)
          done()
        }
      })
    })
  })
})