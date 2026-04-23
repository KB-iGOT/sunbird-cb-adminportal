import { of, throwError } from 'rxjs'
import { HttpClient } from '@angular/common/http'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { CommsService } from './comms.service'

describe('CommsService', () => {
  let service: CommsService
  let http: any
  let configSvc: any

  beforeEach(() => {
    http = {
      get: jest.fn(),
    }
    configSvc = {
      baseUrl: 'https://example.com',
    }

    service = new CommsService(configSvc as ConfigurationsService, http as HttpClient)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should create an instance', () => {
    expect(service).toBeTruthy()
  })

  it('should have COMMS_REPORTS set to correct endpoint', () => {
    expect(service.COMMS_REPORTS).toBe('/apis/proxies/v8/storage/v1/spvReportInfo')
  })

  describe('getCommsContent', () => {
    it('should call http.get with correct URL using configSvc.baseUrl', () => {
      const mockResponse = { data: 'comms content' }
      http.get.mockReturnValue(of(mockResponse))

      let result: any
      service.getCommsContent().subscribe(res => { result = res })

      expect(http.get).toHaveBeenCalledWith('https://example.com/feature/comms.json')
      expect(result).toEqual(mockResponse)
    })

    it('should propagate errors from http.get', done => {
      const mockError = new Error('Network error')
      http.get.mockReturnValue(throwError(mockError))

      service.getCommsContent().subscribe({
        next: () => done.fail('should not succeed'),
        error: err => {
          expect(err).toBe(mockError)
          done()
        },
      })
    })

    it('should use updated baseUrl from configSvc', () => {
      configSvc.baseUrl = 'https://other-domain.com'
      http.get.mockReturnValue(of({}))
      service.getCommsContent().subscribe()
      expect(http.get).toHaveBeenCalledWith('https://other-domain.com/feature/comms.json')
    })
  })

  describe('getCommsReportContnet', () => {
    it('should call http.get with correct URL including date', () => {
      const mockResponse = { report: 'data' }
      http.get.mockReturnValue(of(mockResponse))

      let result: any
      service.getCommsReportContnet('2024-01-15').subscribe(res => { result = res })

      expect(http.get).toHaveBeenCalledWith('/apis/proxies/v8/storage/v1/spvReportInfo/2024-01-15')
      expect(result).toEqual(mockResponse)
    })

    it('should propagate errors from http.get', done => {
      const mockError = new Error('Report fetch error')
      http.get.mockReturnValue(throwError(mockError))

      service.getCommsReportContnet('2024-01-15').subscribe({
        next: () => done.fail('should not succeed'),
        error: err => {
          expect(err).toBe(mockError)
          done()
        },
      })
    })

    it('should handle different date formats', () => {
      http.get.mockReturnValue(of({}))
      service.getCommsReportContnet('20240115').subscribe()
      expect(http.get).toHaveBeenCalledWith('/apis/proxies/v8/storage/v1/spvReportInfo/20240115')
    })

    it('should return observable', () => {
      http.get.mockReturnValue(of({}))
      const result = service.getCommsReportContnet('2024-01')
      expect(result).toBeDefined()
      expect(typeof result.subscribe).toBe('function')
    })
  })
})
