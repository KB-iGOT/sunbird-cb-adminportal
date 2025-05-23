import { TncPublicResolverService } from './tnc-public-resolver.service'
import { HttpClient } from '@angular/common/http'
import { of, throwError } from 'rxjs'
import { NsTnc } from '../models/tnc.model'
import { IResolveResponse } from '@sunbird-cb/utils'

describe('TncPublicResolverService', () => {
  let service: TncPublicResolverService
  let httpClientMock: jest.Mocked<HttpClient>

  beforeEach(() => {
    // Create a mock HttpClient
    httpClientMock = {
      get: jest.fn()
    } as any

    // Create service instance with mocked dependencies
    service = new TncPublicResolverService(httpClientMock)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('constructor', () => {
    it('should create service instance', () => {
      expect(service).toBeDefined()
      expect(service).toBeInstanceOf(TncPublicResolverService)
    })
  })

  describe('getPublicTnc', () => {
    const mockTncData: NsTnc.ITnc = {
      id: '1',
      content: 'Test T&C content',
      version: '1.0'
    } as unknown as NsTnc.ITnc

    it('should call HTTP GET with default URL when no locale provided', () => {
      httpClientMock.get.mockReturnValue(of(mockTncData))

      service.getPublicTnc().subscribe()

      expect(httpClientMock.get).toHaveBeenCalledWith('/apis/public/v8/tnc')
      expect(httpClientMock.get).toHaveBeenCalledTimes(1)
    })

    it('should call HTTP GET with locale parameter when locale provided', () => {
      const locale = 'en-US'
      httpClientMock.get.mockReturnValue(of(mockTncData))

      service.getPublicTnc(locale).subscribe()

      expect(httpClientMock.get).toHaveBeenCalledWith(`/apis/public/v8/tnc?locale=${locale}`)
      expect(httpClientMock.get).toHaveBeenCalledTimes(1)
    })

    it('should return T&C data when HTTP request succeeds', (done) => {
      httpClientMock.get.mockReturnValue(of(mockTncData))

      service.getPublicTnc().subscribe(result => {
        expect(result).toEqual(mockTncData)
        done()
      })
    })

    it('should propagate error when HTTP request fails', (done) => {
      const mockError = new Error('HTTP Error')
      httpClientMock.get.mockReturnValue(throwError(() => mockError))

      service.getPublicTnc().subscribe({
        next: () => fail('Should not emit success'),
        error: (error) => {
          expect(error).toBe(mockError)
          done()
        }
      })
    })

    it('should handle multiple locale formats correctly', () => {
      const testLocales = ['en', 'fr-FR', 'es-ES', 'zh-CN']
      httpClientMock.get.mockReturnValue(of(mockTncData))

      testLocales.forEach(locale => {
        service.getPublicTnc(locale).subscribe()
        expect(httpClientMock.get).toHaveBeenCalledWith(`/apis/public/v8/tnc?locale=${locale}`)
      })

      expect(httpClientMock.get).toHaveBeenCalledTimes(testLocales.length)
    })
  })

  describe('resolve', () => {
    const mockTncData: NsTnc.ITnc = {
      id: '1',
      content: 'Test T&C content',
      version: '1.0'
    } as unknown as NsTnc.ITnc

    it('should return success response when getPublicTnc succeeds', (done) => {
      httpClientMock.get.mockReturnValue(of(mockTncData))

      service.resolve().subscribe((result: IResolveResponse<NsTnc.ITnc>) => {
        expect(result.data).toEqual(mockTncData)
        expect(result.error).toBeNull()
        done()
      })
    })

    it('should return error response when getPublicTnc fails', (done) => {
      const mockError = new Error('Network Error')
      httpClientMock.get.mockReturnValue(throwError(() => mockError))

      service.resolve().subscribe((result: IResolveResponse<NsTnc.ITnc>) => {
        expect(result.data).toBeNull()
        expect(result.error).toBe(mockError)
        done()
      })
    })

    it('should call getPublicTnc without locale parameter', () => {
      httpClientMock.get.mockReturnValue(of(mockTncData))

      service.resolve().subscribe()

      expect(httpClientMock.get).toHaveBeenCalledWith('/apis/public/v8/tnc')
      expect(httpClientMock.get).toHaveBeenCalledTimes(1)
    })

    it('should handle HTTP 404 error gracefully', (done) => {
      const http404Error = {
        status: 404,
        statusText: 'Not Found',
        message: 'T&C not found'
      }
      httpClientMock.get.mockReturnValue(throwError(() => http404Error))

      service.resolve().subscribe((result: IResolveResponse<NsTnc.ITnc>) => {
        expect(result.data).toBeNull()
        expect(result.error).toEqual(http404Error)
        done()
      })
    })

    it('should handle HTTP 500 error gracefully', (done) => {
      const http500Error = {
        status: 500,
        statusText: 'Internal Server Error',
        message: 'Server error occurred'
      }
      httpClientMock.get.mockReturnValue(throwError(() => http500Error))

      service.resolve().subscribe((result: IResolveResponse<NsTnc.ITnc>) => {
        expect(result.data).toBeNull()
        expect(result.error).toEqual(http500Error)
        done()
      })
    })

    it('should complete the observable after emitting result', (done) => {
      httpClientMock.get.mockReturnValue(of(mockTncData))

      service.resolve().subscribe({
        next: (result) => {
          expect(result.data).toEqual(mockTncData)
          expect(result.error).toBeNull()
        },
        complete: () => {
          done()
        }
      })
    })
  })

  describe('integration scenarios', () => {
    it('should handle empty response from server', (done) => {
      httpClientMock.get.mockReturnValue(of(null as any))

      service.resolve().subscribe((result: IResolveResponse<NsTnc.ITnc>) => {
        expect(result.data).toBeNull()
        expect(result.error).toBeNull()
        done()
      })
    })

    it('should handle malformed T&C data', (done) => {
      const malformedData = { invalidProperty: 'test' } as any
      httpClientMock.get.mockReturnValue(of(malformedData))

      service.resolve().subscribe((result: IResolveResponse<NsTnc.ITnc>) => {
        expect(result.data).toEqual(malformedData)
        expect(result.error).toBeNull()
        done()
      })
    })
  })
})