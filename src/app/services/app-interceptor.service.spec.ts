// app-interceptor.service.spec.ts
import { HttpHandler, HttpRequest, HttpEvent, HttpErrorResponse } from '@angular/common/http'
import { MatSnackBar } from '@angular/material/snack-bar'
import { throwError, of } from 'rxjs'
import { AuthKeycloakService, ConfigurationsService } from '@sunbird-cb/utils-v2'
import { AppInterceptorService } from './app-interceptor.service'

describe('AppInterceptorService', () => {
  let service: AppInterceptorService
  let mockConfigSvc: jest.Mocked<ConfigurationsService>
  let mockAuthSvc: jest.Mocked<AuthKeycloakService>
  let mockSnackBar: jest.Mocked<MatSnackBar>
  let mockHttpHandler: HttpHandler
  let mockRequest: HttpRequest<any>

  // Store original location
  // const originalLocation = window.location

  beforeEach(() => {
    // Create mock objects with jest.fn()
    mockConfigSvc = {
      userPreference: {
        selectedLangGroup: 'en,hi'
      },
      activeOrg: 'testOrg',
      rootOrg: 'testRootOrg',
      userProfile: {
        userId: 'test-user-id'
      },
      hostPath: 'test-host-path'
    } as unknown as jest.Mocked<ConfigurationsService>

    mockAuthSvc = {
      force_logout: jest.fn()
    } as unknown as jest.Mocked<AuthKeycloakService>

    mockSnackBar = {
      open: jest.fn()
    } as unknown as jest.Mocked<MatSnackBar>

    mockRequest = new HttpRequest('GET', 'http://test-url.com')

    mockHttpHandler = {
      handle: jest.fn(() => of({} as HttpEvent<any>))
    }

    // Create the service with mocked dependencies
    service = new AppInterceptorService(
      mockConfigSvc,
      mockAuthSvc,
      mockSnackBar,
      'en-US'
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should add headers when activeOrg and rootOrg are defined', () => {
    // Arrange
    const cloneSpy = jest.spyOn(mockRequest, 'clone')

    // Act
    service.intercept(mockRequest, mockHttpHandler)

    // Assert
    expect(cloneSpy).toHaveBeenCalledWith({
      setHeaders: {
        org: 'testOrg',
        rootOrg: 'testRootOrg',
        locale: 'en,hi',
        wid: 'test-user-id',
        hostPath: 'test-host-path'
      }
    })
    expect(mockHttpHandler.handle).toHaveBeenCalled()
  })

  it('should pass the request unchanged when activeOrg or rootOrg is missing', () => {
    // Arrange
    mockConfigSvc.activeOrg = null

    // Act
    service.intercept(mockRequest, mockHttpHandler)

    // Assert
    expect(mockHttpHandler.handle).toHaveBeenCalledWith(mockRequest)
  })

  it('should handle languages correctly when userPreference is null', () => {
    // Arrange - with null preference, only 'en' locale should be sent
    mockConfigSvc.userPreference = null
    const cloneSpy = jest.spyOn(mockRequest, 'clone')

    // Act
    service.intercept(mockRequest, mockHttpHandler)

    // Assert - only 'en' locale (no selectedLangGroup to merge)
    expect(cloneSpy).toHaveBeenCalledWith(expect.objectContaining({
      setHeaders: expect.objectContaining({
        locale: 'en'
      })
    }))
  })

  it('should merge selectedLangGroup into locale header', () => {
    // Arrange - userPreference has selectedLangGroup with 'hi'
    mockConfigSvc.userPreference = { selectedLangGroup: 'hi' } as any
    const cloneSpy = jest.spyOn(mockRequest, 'clone')

    // Act
    service.intercept(mockRequest, mockHttpHandler)

    // Assert - 'en' + 'hi' merged
    expect(cloneSpy).toHaveBeenCalledWith(expect.objectContaining({
      setHeaders: expect.objectContaining({
        locale: 'en,hi'
      })
    }))
  })

  describe('error handling', () => {
    let errorHandlerHttpHandler: HttpHandler

    beforeEach(() => {
      // Create an HTTP handler that returns an error
      errorHandlerHttpHandler = {
        handle: jest.fn()
      }
    })

    it('should handle 0 status error by forcing logout', () => {
      // Arrange - Mock the includes method directly for this test
      const includesSpy = jest.spyOn(String.prototype, 'includes').mockImplementation(function (this: string, searchString: string) {
        if (this === 'localhost' && searchString === 'localhost') return true
        return false
      })

      jest.spyOn(errorHandlerHttpHandler, 'handle').mockReturnValue(
        throwError(new HttpErrorResponse({ status: 0 }))
      )

      // Act
      service.intercept(mockRequest, errorHandlerHttpHandler).subscribe(
        () => fail('should have failed with an error'),
        (error) => {
          // Assert
          expect(error).toBeInstanceOf(HttpErrorResponse)
          expect(mockSnackBar.open).toHaveBeenCalled()
          expect(mockAuthSvc.force_logout).toHaveBeenCalled()
        }
      )

      // Clean up
      includesSpy.mockRestore()
    })

    it('should handle 200 status error with URL by redirecting', () => {
      // Arrange
      // Create a mock object to replace window.location
      const locationMock = {
        href: 'http://original-url.com'
      }

      // Save and replace the original location object
      Object.defineProperty(window, 'location', {
        value: locationMock,
        writable: true
      })

      jest.spyOn(errorHandlerHttpHandler, 'handle').mockReturnValue(
        throwError(new HttpErrorResponse({
          status: 200,
          url: 'http://redirect-url.com'
        }))
      )

      // Act
      service.intercept(mockRequest, errorHandlerHttpHandler).subscribe(
        () => fail('should have failed with an error'),
        (error) => {
          // Assert
          expect(error).toBeInstanceOf(HttpErrorResponse)
          expect(locationMock.href).toBe('http://redirect-url.com')
        }
      )
    })

    it('should handle 419 status by clearing telemetrySessionId and forcing logout', () => {
      // Arrange
      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem').mockReturnValue('test-session-id')
      const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem').mockImplementation()

      jest.spyOn(errorHandlerHttpHandler, 'handle').mockReturnValue(
        throwError(new HttpErrorResponse({ status: 419 }))
      )

      // Act
      service.intercept(mockRequest, errorHandlerHttpHandler).subscribe(
        () => fail('should have failed with an error'),
        (error) => {
          // Assert
          expect(error).toBeInstanceOf(HttpErrorResponse)
          expect(removeItemSpy).toHaveBeenCalledWith('telemetrySessionId')
          expect(mockAuthSvc.force_logout).toHaveBeenCalled()
        }
      )

      // Clean up
      getItemSpy.mockRestore()
      removeItemSpy.mockRestore()
    })
  })
})