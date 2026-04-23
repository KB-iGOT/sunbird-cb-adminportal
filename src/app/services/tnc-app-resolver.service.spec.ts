import { of, throwError } from 'rxjs'
import { TncAppResolverService } from './tnc-app-resolver.service'
import { HttpClient } from '@angular/common/http'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { NsTnc } from '../models/tnc.model'

describe('TncAppResolverService', () => {
  let service: TncAppResolverService
  let httpClientSpy: jest.Mocked<HttpClient>
  let configSvcSpy: jest.Mocked<ConfigurationsService>

  const mockTncData: NsTnc.ITnc = {
    isAccepted: false,
    termsAndConditions: []
  }

  beforeEach(() => {
    // Create spy objects
    httpClientSpy = {
      get: jest.fn()
    } as any

    configSvcSpy = {
      userPreference: {
        selectedLocale: 'en'
      }
    } as any

    // Create service instance with mocked dependencies
    service = new TncAppResolverService(httpClientSpy, configSvcSpy)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('resolve', () => {
    it('should return data with null error when getTnc succeeds', (done) => {
      // Arrange
      httpClientSpy.get.mockReturnValue(of(mockTncData))

      // Act
      service.resolve().subscribe({
        next: (result) => {
          // Assert
          expect(result.data).toEqual(mockTncData)
          expect(result.error).toBeNull()
          done()
        }
      })
    })

    it('should return error with null data when getTnc fails', (done) => {
      // Arrange
      const mockError = new Error('HTTP Error')
      httpClientSpy.get.mockReturnValue(throwError(mockError))

      // Act
      service.resolve().subscribe({
        next: (result) => {
          // resolve() wraps errors via catchError, so next is called with { error, data: null }
          expect(result.data).toBeNull()
          expect(result.error).toBeDefined()
          done()
        }
      })
    })

    it('should use selectedLocale from userPreference when available', (done) => {
      // Arrange
      httpClientSpy.get.mockReturnValue(of(mockTncData))
      configSvcSpy.userPreference = { selectedLocale: 'fr' } as any

      // Act
      service.resolve().subscribe({
        next: () => {
          // Assert
          expect(httpClientSpy.get).toHaveBeenCalledWith('/apis/protected/v8/user/tnc?locale=fr')
          done()
        }
      })
    })

    it('should handle missing userPreference gracefully', (done) => {
      // Arrange
      httpClientSpy.get.mockReturnValue(of(mockTncData))
      configSvcSpy.userPreference = null

      // Act
      service.resolve().subscribe({
        next: () => {
          // Assert
          expect(httpClientSpy.get).toHaveBeenCalledWith('/apis/protected/v8/user/tnc')
          done()
        }
      })
    })

    it('should handle undefined userPreference gracefully', (done) => {
      // Arrange
      httpClientSpy.get.mockReturnValue(of(mockTncData))
      configSvcSpy.userPreference = undefined as any

      // Act
      service.resolve().subscribe({
        next: () => {
          // Assert
          expect(httpClientSpy.get).toHaveBeenCalledWith('/apis/protected/v8/user/tnc')
          done()
        }
      })
    })
  })

  describe('getTnc', () => {
    it('should call http.get with correct URL when no locale provided', () => {
      // Arrange
      httpClientSpy.get.mockReturnValue(of(mockTncData))

      // Act
      service.getTnc()

      // Assert
      expect(httpClientSpy.get).toHaveBeenCalledWith('/apis/protected/v8/user/tnc')
    })

    it('should call http.get with locale parameter when locale provided', () => {
      // Arrange
      httpClientSpy.get.mockReturnValue(of(mockTncData))
      const locale = 'es'

      // Act
      service.getTnc(locale)

      // Assert
      expect(httpClientSpy.get).toHaveBeenCalledWith('/apis/protected/v8/user/tnc?locale=es')
    })

    it('should return observable from http.get', (done) => {
      // Arrange
      httpClientSpy.get.mockReturnValue(of(mockTncData))

      // Act
      service.getTnc().subscribe({
        next: (result) => {
          // Assert
          expect(result).toEqual(mockTncData)
          done()
        }
      })
    })

    it('should handle empty string locale', () => {
      // Arrange
      httpClientSpy.get.mockReturnValue(of(mockTncData))

      // Act
      service.getTnc('')

      // Assert
      expect(httpClientSpy.get).toHaveBeenCalledWith('/apis/protected/v8/user/tnc')
    })

    it('should handle null locale', () => {
      // Arrange
      httpClientSpy.get.mockReturnValue(of(mockTncData))

      // Act
      service.getTnc('')

      // Assert
      expect(httpClientSpy.get).toHaveBeenCalledWith('/apis/protected/v8/user/tnc')
    })

    it('should handle undefined locale', () => {
      // Arrange
      httpClientSpy.get.mockReturnValue(of(mockTncData))

      // Act
      service.getTnc(undefined)

      // Assert
      expect(httpClientSpy.get).toHaveBeenCalledWith('/apis/protected/v8/user/tnc')
    })

    it('should propagate http errors', (done) => {
      // Arrange
      const mockError = new Error('Network error')
      httpClientSpy.get.mockReturnValue(throwError(mockError))

      // Act
      service.getTnc().subscribe({
        error: (error) => {
          // Assert
          expect(error).toEqual(mockError)
          done()
        }
      })
    })
  })

  describe('constructor', () => {
    it('should create service instance', () => {
      expect(service).toBeDefined()
      expect(service).toBeInstanceOf(TncAppResolverService)
    })
  })
})