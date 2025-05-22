import { OtpService } from './otp.service'
import { HttpClient } from '@angular/common/http'
import { of } from 'rxjs'

// Mock HttpClient
const mockHttpClient = {
  post: jest.fn()
}

describe('OtpService', () => {
  let service: OtpService
  let httpClient: jest.Mocked<HttpClient>

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()

    // Create service instance with mocked HttpClient
    httpClient = mockHttpClient as unknown as jest.Mocked<HttpClient>
    service = new OtpService(httpClient)
  })

  describe('sendOtp', () => {
    it('should send OTP for phone number', () => {
      const mockResponse = { success: true }
      const phoneNumber = 1234567890

      httpClient.post.mockReturnValue(of(mockResponse))

      const result = service.sendOtp(phoneNumber)

      expect(httpClient.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/otp/v1/generate',
        {
          request: {
            type: 'phone',
            key: '1234567890'
          }
        }
      )

      result.subscribe(response => {
        expect(response).toEqual(mockResponse)
      })
    })

    it('should return Observable', () => {
      const phoneNumber = 1234567890
      httpClient.post.mockReturnValue(of({}))

      const result = service.sendOtp(phoneNumber)

      expect(result).toBeDefined()
      expect(typeof result.subscribe).toBe('function')
    })
  })

  describe('resendOtp', () => {
    it('should resend OTP for phone number', () => {
      const mockResponse = { success: true }
      const phoneNumber = 1234567890

      httpClient.post.mockReturnValue(of(mockResponse))

      const result = service.resendOtp(phoneNumber)

      expect(httpClient.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/otp/v1/generate',
        {
          request: {
            type: 'phone',
            key: '1234567890'
          }
        }
      )

      result.subscribe(response => {
        expect(response).toEqual(mockResponse)
      })
    })
  })

  describe('verifyOTP', () => {
    it('should verify OTP for phone number', () => {
      const mockResponse = { verified: true }
      const otp = 123456
      const phoneNumber = 1234567890

      httpClient.post.mockReturnValue(of(mockResponse))

      const result = service.verifyOTP(otp, phoneNumber)

      expect(httpClient.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/otp/v1/verify',
        {
          request: {
            otp: '123456',
            type: 'phone',
            key: '1234567890'
          }
        }
      )

      result.subscribe(response => {
        expect(response).toEqual(mockResponse)
      })
    })

    it('should convert OTP number to string', () => {
      const otp = 123456
      const phoneNumber = 1234567890

      httpClient.post.mockReturnValue(of({}))

      service.verifyOTP(otp, phoneNumber)

      const callArgs = httpClient.post.mock.calls[0][1]
      expect(callArgs.request.otp).toBe('123456')
      expect(typeof callArgs.request.otp).toBe('string')
    })
  })

  describe('sendEmailOtp', () => {
    it('should send OTP for email', () => {
      const mockResponse = { success: true }
      const email = 'test@example.com'

      httpClient.post.mockReturnValue(of(mockResponse))

      const result = service.sendEmailOtp(email)

      expect(httpClient.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/otp/v3/generate',
        {
          request: {
            type: 'email',
            key: 'test@example.com',
            contextType: 'extPatch',
            context: ['profileDetails.personalDetails.primaryEmail']
          }
        }
      )

      result.subscribe(response => {
        expect(response).toEqual(mockResponse)
      })
    })

    it('should return Observable', () => {
      const email = 'test@example.com'
      httpClient.post.mockReturnValue(of({}))

      const result = service.sendEmailOtp(email)

      expect(result).toBeDefined()
      expect(typeof result.subscribe).toBe('function')
    })
  })

  describe('reSendEmailOtp', () => {
    it('should resend OTP for email', () => {
      const mockResponse = { success: true }
      const email = 'test@example.com'

      httpClient.post.mockReturnValue(of(mockResponse))

      const result = service.reSendEmailOtp(email)

      expect(httpClient.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/otp/v3/generate',
        {
          request: {
            type: 'email',
            key: 'test@example.com',
            contextType: 'extPatch',
            context: ['profileDetails.personalDetails.primaryEmail']
          }
        }
      )

      result.subscribe(response => {
        expect(response).toEqual(mockResponse)
      })
    })
  })

  describe('verifyEmailOTP', () => {
    it('should verify OTP for email', () => {
      const mockResponse = { verified: true }
      const otp = 123456
      const email = 'test@example.com'

      httpClient.post.mockReturnValue(of(mockResponse))

      const result = service.verifyEmailOTP(otp, email)

      expect(httpClient.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/otp/v3/verify',
        {
          request: {
            otp: '123456',
            type: 'email',
            key: 'test@example.com'
          }
        }
      )

      result.subscribe(response => {
        expect(response).toEqual(mockResponse)
      })
    })

    it('should convert OTP to string', () => {
      const otp = 123456
      const email = 'test@example.com'

      httpClient.post.mockReturnValue(of({}))

      service.verifyEmailOTP(otp, email)

      const callArgs = httpClient.post.mock.calls[0][1]
      expect(callArgs.request.otp).toBe('123456')
      expect(typeof callArgs.request.otp).toBe('string')
    })

    it('should handle string OTP input', () => {
      const otp = '123456'
      const email = 'test@example.com'

      httpClient.post.mockReturnValue(of({}))

      service.verifyEmailOTP(otp, email)

      const callArgs = httpClient.post.mock.calls[0][1]
      expect(callArgs.request.otp).toBe('123456')
    })
  })

  describe('Error handling', () => {
    it('should handle HTTP errors in sendOtp', () => {
      const error = new Error('Network error')
      httpClient.post.mockReturnValue(of().pipe(() => {
        throw error
      }))

      expect(() => service.sendOtp(1234567890)).not.toThrow()
    })

    it('should handle HTTP errors in sendEmailOtp', () => {
      const error = new Error('Network error')
      httpClient.post.mockReturnValue(of().pipe(() => {
        throw error
      }))

      expect(() => service.sendEmailOtp('test@example.com')).not.toThrow()
    })
  })

  describe('Edge cases', () => {
    it('should handle zero as phone number', () => {
      httpClient.post.mockReturnValue(of({}))

      service.sendOtp(0)

      expect(httpClient.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/otp/v1/generate',
        {
          request: {
            type: 'phone',
            key: '0'
          }
        }
      )
    })

    it('should handle empty string as email', () => {
      httpClient.post.mockReturnValue(of({}))

      service.sendEmailOtp('')

      expect(httpClient.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/otp/v3/generate',
        {
          request: {
            type: 'email',
            key: '',
            contextType: 'extPatch',
            context: ['profileDetails.personalDetails.primaryEmail']
          }
        }
      )
    })

    it('should handle zero as OTP', () => {
      httpClient.post.mockReturnValue(of({}))

      service.verifyOTP(0, 1234567890)

      const callArgs = httpClient.post.mock.calls[0][1]
      expect(callArgs.request.otp).toBe('0')
    })
  })
})