import { HttpClient } from '@angular/common/http'
import { of } from 'rxjs'
import { RequestServiceService } from './request-service.service'

// Mock lodash
jest.mock('lodash', () => ({
  get: jest.fn()
}))

import * as _ from 'lodash'

describe('RequestServiceService', () => {
  let service: RequestServiceService
  let httpClientSpy: jest.Mocked<HttpClient>
  let mockGet: jest.MockedFunction<typeof _.get>

  beforeEach(() => {
    // Create spy object for HttpClient
    httpClientSpy = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
      head: jest.fn(),
      options: jest.fn(),
      request: jest.fn()
    } as any

    mockGet = _.get as jest.MockedFunction<typeof _.get>

    service = new RequestServiceService(httpClientSpy)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getFilterEntity', () => {
    it('should make POST request and return mapped result', (done) => {
      const mockFilter = { test: 'filter' }
      const mockResponse = { result: { competency: ['comp1', 'comp2'] } }
      const expectedResult = ['comp1', 'comp2']

      httpClientSpy.post.mockReturnValue(of(mockResponse))
      mockGet.mockReturnValue(expectedResult)

      service.getFilterEntity(mockFilter).subscribe(result => {
        expect(httpClientSpy.post).toHaveBeenCalledWith('/apis/proxies/v8/competency/v4/search', mockFilter)
        expect(mockGet).toHaveBeenCalledWith(mockResponse, 'result.competency')
        expect(result).toEqual(expectedResult)
        done()
      })
    })
  })

  describe('getFilterEntityV2', () => {
    it('should make GET request and return mapped result', (done) => {
      const mockResponse = { result: { framework: { categories: ['cat1', 'cat2'] } } }
      const expectedResult = ['cat1', 'cat2']

      httpClientSpy.get.mockReturnValue(of(mockResponse))
      mockGet.mockReturnValue(expectedResult)

      service.getFilterEntityV2().subscribe(result => {
        expect(httpClientSpy.get).toHaveBeenCalledWith('/apis/proxies/v8/framework/v1/read/kcmfinal_fw')
        expect(mockGet).toHaveBeenCalledWith(mockResponse, 'result.framework.categories')
        expect(result).toEqual(expectedResult)
        done()
      })
    })
  })

  describe('getRequestTypeList', () => {
    it('should make POST request and return mapped result', (done) => {
      const mockRequest = { search: 'test' }
      const mockResponse = { result: { response: { content: ['item1', 'item2'] } } }
      const expectedResult = ['item1', 'item2']

      httpClientSpy.post.mockReturnValue(of(mockResponse))
      mockGet.mockReturnValue(expectedResult)

      service.getRequestTypeList(mockRequest).subscribe(result => {
        expect(httpClientSpy.post).toHaveBeenCalledWith('/apis/proxies/v8/org/v1/search', mockRequest)
        expect(mockGet).toHaveBeenCalledWith(mockResponse, 'result.response.content')
        expect(result).toEqual(expectedResult)
        done()
      })
    })
  })

  describe('createDemand', () => {
    it('should make POST request without mapping', (done) => {
      const mockRequest = { demand: 'test' }
      const mockResponse = { success: true }

      httpClientSpy.post.mockReturnValue(of(mockResponse))

      service.createDemand(mockRequest).subscribe(result => {
        expect(httpClientSpy.post).toHaveBeenCalledWith('/apis/proxies/v8/demand/content/create', mockRequest)
        expect(result).toEqual(mockResponse)
        done()
      })
    })
  })

  describe('getRequestList', () => {
    it('should make POST request and return mapped result', (done) => {
      const mockRequest = { filters: 'test' }
      const mockResponse = { result: { result: ['request1', 'request2'] } }
      const expectedResult = ['request1', 'request2']

      httpClientSpy.post.mockReturnValue(of(mockResponse))
      mockGet.mockReturnValue(expectedResult)

      service.getRequestList(mockRequest).subscribe(result => {
        expect(httpClientSpy.post).toHaveBeenCalledWith('/apis/proxies/v8/demand/content/search', mockRequest)
        expect(mockGet).toHaveBeenCalledWith(mockResponse, 'result.result')
        expect(result).toEqual(expectedResult)
        done()
      })
    })
  })

  describe('markAsInvalid', () => {
    it('should make POST request without mapping', (done) => {
      const mockRequest = { id: '123', status: 'invalid' }
      const mockResponse = { success: true }

      httpClientSpy.post.mockReturnValue(of(mockResponse))

      service.markAsInvalid(mockRequest).subscribe(result => {
        expect(httpClientSpy.post).toHaveBeenCalledWith('/apis/proxies/v8/demand/content/v1/update/status', mockRequest)
        expect(result).toEqual(mockResponse)
        done()
      })
    })
  })

  describe('getRequestDataById', () => {
    it('should make GET request with demandId and return mapped result', (done) => {
      const demandId = '123'
      const mockResponse = { result: { result: { id: '123', name: 'test' } } }
      const expectedResult = { id: '123', name: 'test' }

      httpClientSpy.get.mockReturnValue(of(mockResponse))
      mockGet.mockReturnValue(expectedResult)

      service.getRequestDataById(demandId).subscribe(result => {
        expect(httpClientSpy.get).toHaveBeenCalledWith('apis/proxies/v8/demand/content/read/123')
        expect(mockGet).toHaveBeenCalledWith(mockResponse, 'result.result')
        expect(result).toEqual(expectedResult)
        done()
      })
    })
  })

  describe('getOrgInterestList', () => {
    it('should make POST request and return mapped result', (done) => {
      const mockRequest = { orgId: '123' }
      const mockResponse = { result: { result: ['org1', 'org2'] } }
      const expectedResult = ['org1', 'org2']

      httpClientSpy.post.mockReturnValue(of(mockResponse))
      mockGet.mockReturnValue(expectedResult)

      service.getOrgInterestList(mockRequest).subscribe(result => {
        expect(httpClientSpy.post).toHaveBeenCalledWith('/apis/proxies/v8/interest/v1/search', mockRequest)
        expect(mockGet).toHaveBeenCalledWith(mockResponse, 'result.result')
        expect(result).toEqual(expectedResult)
        done()
      })
    })
  })

  describe('assignToOrg', () => {
    it('should make PUT request without mapping', (done) => {
      const mockRequest = { orgId: '123', demandId: '456' }
      const mockResponse = { success: true }

      httpClientSpy.put.mockReturnValue(of(mockResponse))

      service.assignToOrg(mockRequest).subscribe(result => {
        expect(httpClientSpy.put).toHaveBeenCalledWith('/apis/proxies/v8/interest/v1/assign', mockRequest)
        expect(result).toEqual(mockResponse)
        done()
      })
    })
  })

  describe('Service instantiation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy()
    })
  })
})