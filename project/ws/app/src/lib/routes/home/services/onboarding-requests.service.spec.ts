
import { HttpClient } from '@angular/common/http'
import { of } from 'rxjs'
import { RequestsService } from './onboarding-requests.service'

// Mock HttpClient
const mockHttpClient = {
  post: jest.fn()
}

describe('RequestsService', () => {
  let service: RequestsService
  let httpClient: jest.Mocked<HttpClient>

  beforeEach(() => {
    httpClient = mockHttpClient as unknown as jest.Mocked<HttpClient>
    service = new RequestsService(httpClient)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Position Methods', () => {
    describe('getPositionsList', () => {
      it('should call http.post with correct endpoint and request data', () => {
        const mockRequest = { search: 'test' }
        const mockResponse = { data: [] }

        httpClient.post.mockReturnValue(of(mockResponse))

        service.getPositionsList(mockRequest)

        expect(httpClient.post).toHaveBeenCalledWith(
          '/apis/proxies/v8/workflow/position/search',
          mockRequest
        )
      })

      it('should return observable from http.post', () => {
        const mockRequest = { search: 'test' }
        const mockResponse = { data: [] }
        const mockObservable = of(mockResponse)

        httpClient.post.mockReturnValue(mockObservable)

        const result = service.getPositionsList(mockRequest)

        expect(result).toBe(mockObservable)
      })
    })

    describe('approveNewPosition', () => {
      it('should call http.post with correct endpoint and data', () => {
        const mockData = { id: 1, approved: true }
        const mockResponse = { success: true }

        httpClient.post.mockReturnValue(of(mockResponse))

        service.approveNewPosition(mockData)

        expect(httpClient.post).toHaveBeenCalledWith(
          '/apis/proxies/v8/workflow/position/update',
          mockData
        )
      })

      it('should return observable from http.post', () => {
        const mockData = { id: 1, approved: true }
        const mockResponse = { success: true }
        const mockObservable = of(mockResponse)

        httpClient.post.mockReturnValue(mockObservable)

        const result = service.approveNewPosition(mockData)

        expect(result).toBe(mockObservable)
      })
    })

    describe('addNewPosition', () => {
      it('should call http.post with correct endpoint and data', () => {
        const mockData = { name: 'New Position' }
        const mockResponse = { id: 1 }

        httpClient.post.mockReturnValue(of(mockResponse))

        service.addNewPosition(mockData)

        expect(httpClient.post).toHaveBeenCalledWith(
          '/apis/proxies/v8/masterData/v1/upsert',
          mockData
        )
      })

      it('should return observable from http.post', () => {
        const mockData = { name: 'New Position' }
        const mockResponse = { id: 1 }
        const mockObservable = of(mockResponse)

        httpClient.post.mockReturnValue(mockObservable)

        const result = service.addNewPosition(mockData)

        expect(result).toBe(mockObservable)
      })
    })
  })

  describe('Organization Methods', () => {
    describe('getOrgsList', () => {
      it('should call http.post with correct endpoint and request data', () => {
        const mockRequest = { search: 'org test' }
        const mockResponse = { data: [] }

        httpClient.post.mockReturnValue(of(mockResponse))

        service.getOrgsList(mockRequest)

        expect(httpClient.post).toHaveBeenCalledWith(
          '/apis/proxies/v8/workflow/org/search',
          mockRequest
        )
      })

      it('should return observable from http.post', () => {
        const mockRequest = { search: 'org test' }
        const mockResponse = { data: [] }
        const mockObservable = of(mockResponse)

        httpClient.post.mockReturnValue(mockObservable)

        const result = service.getOrgsList(mockRequest)

        expect(result).toBe(mockObservable)
      })
    })

    describe('approveNewOrg', () => {
      it('should call http.post with correct endpoint and data', () => {
        const mockData = { id: 1, approved: true }
        const mockResponse = { success: true }

        httpClient.post.mockReturnValue(of(mockResponse))

        service.approveNewOrg(mockData)

        expect(httpClient.post).toHaveBeenCalledWith(
          '/apis/proxies/v8/workflow/org/update',
          mockData
        )
      })

      it('should return observable from http.post', () => {
        const mockData = { id: 1, approved: true }
        const mockResponse = { success: true }
        const mockObservable = of(mockResponse)

        httpClient.post.mockReturnValue(mockObservable)

        const result = service.approveNewOrg(mockData)

        expect(result).toBe(mockObservable)
      })
    })
  })

  describe('Domain Methods', () => {
    describe('getDomainsList', () => {
      it('should call http.post with correct endpoint and request data', () => {
        const mockRequest = { search: 'domain test' }
        const mockResponse = { data: [] }

        httpClient.post.mockReturnValue(of(mockResponse))

        service.getDomainsList(mockRequest)

        expect(httpClient.post).toHaveBeenCalledWith(
          '/apis/proxies/v8/workflow/domain/search',
          mockRequest
        )
      })

      it('should return observable from http.post', () => {
        const mockRequest = { search: 'domain test' }
        const mockResponse = { data: [] }
        const mockObservable = of(mockResponse)

        httpClient.post.mockReturnValue(mockObservable)

        const result = service.getDomainsList(mockRequest)

        expect(result).toBe(mockObservable)
      })
    })

    describe('approveNewDomain', () => {
      it('should call http.post with correct endpoint and data', () => {
        const mockData = { id: 1, approved: true }
        const mockResponse = { success: true }

        httpClient.post.mockReturnValue(of(mockResponse))

        service.approveNewDomain(mockData)

        expect(httpClient.post).toHaveBeenCalledWith(
          '/apis/proxies/v8/workflow/domain/update',
          mockData
        )
      })

      it('should return observable from http.post', () => {
        const mockData = { id: 1, approved: true }
        const mockResponse = { success: true }
        const mockObservable = of(mockResponse)

        httpClient.post.mockReturnValue(mockObservable)

        const result = service.approveNewDomain(mockData)

        expect(result).toBe(mockObservable)
      })
    })
  })

  describe('Service Initialization', () => {
    it('should be created with HttpClient dependency', () => {
      expect(service).toBeDefined()
      expect(service).toBeInstanceOf(RequestsService)
    })
  })

  describe('Error Handling', () => {
    it('should handle http errors in getPositionsList', () => {
      const mockRequest = { search: 'test' }
      const mockError = new Error('HTTP Error')

      httpClient.post.mockReturnValue(of().pipe(() => {
        throw mockError
      }))

      expect(() => service.getPositionsList(mockRequest)).not.toThrow()
    })

    it('should handle null/undefined requests', () => {
      httpClient.post.mockReturnValue(of({}))

      expect(() => service.getPositionsList(null)).not.toThrow()
      expect(() => service.getPositionsList(undefined)).not.toThrow()
      expect(() => service.addNewPosition(null)).not.toThrow()
      expect(() => service.approveNewPosition(undefined)).not.toThrow()
    })
  })
})