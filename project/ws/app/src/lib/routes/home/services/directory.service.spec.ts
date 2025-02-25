
import { HttpClient } from '@angular/common/http'
import { of } from 'rxjs'
import { DirectoryService } from './directory.services'

jest.mock('@angular/common/http')

describe('DirectoryService', () => {
  let service: DirectoryService
  let httpClient: jest.Mocked<HttpClient>

  beforeEach(() => {
    // Creating a mock instance of HttpClient
    httpClient = {
      get: jest.fn(),
      post: jest.fn(),
    } as unknown as jest.Mocked<HttpClient>

    service = new DirectoryService(httpClient)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('getAllDepartments', () => {
    it('should call http.get with the correct endpoint', () => {
      const mockResponse = { data: 'some data' }
      httpClient.get.mockReturnValue(of(mockResponse))

      service.getAllDepartments().subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(httpClient.get).toHaveBeenCalledWith('/apis/protected/v8/portal/spv/department')
    })
  })

  describe('getAllDepartmentsKong', () => {
    it('should call http.post with the correct endpoint when queryText is provided', () => {
      const mockResponse = { data: 'some data' }
      const queryText = 'some query'
      const pagination = { limit: 10, offset: 0 }

      const expectedRequest = {
        request: {
          filters: { isTenant: true, status: 1 },
          query: queryText,
          limit: pagination.limit,
          offset: pagination.offset,
        },
      }

      httpClient.post.mockReturnValue(of(mockResponse))

      service.getAllDepartmentsKong(queryText, pagination).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(httpClient.post).toHaveBeenCalledWith('/apis/proxies/v8/org/v1/search', expectedRequest)
    })

    it('should call http.post with the correct endpoint when queryText is not provided', () => {
      const mockResponse = { data: 'some data' }
      const pagination = { limit: 10, offset: 0 }

      const expectedRequest = {
        request: {
          filters: { isTenant: true, status: 1 },
          sort_by: { createdDate: 'desc' },
          limit: pagination.limit,
          offset: pagination.offset,
        },
      }

      httpClient.post.mockReturnValue(of(mockResponse))

      service.getAllDepartmentsKong('', pagination).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(httpClient.post).toHaveBeenCalledWith('/apis/proxies/v8/org/v1/search', expectedRequest)
    })

    it('should call http.post with the correct endpoint when state is "state"', () => {
      const mockResponse = { data: 'some data' }
      const queryText = 'some query'
      const pagination = { limit: 10, offset: 0 }
      const state = 'state'

      const expectedRequest = {
        request: {
          filters: { isTenant: true, isState: true, status: 1 },
          query: queryText,
          limit: pagination.limit,
          offset: pagination.offset,
        },
      }

      httpClient.post.mockReturnValue(of(mockResponse))

      service.getAllDepartmentsKong(queryText, pagination, state).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(httpClient.post).toHaveBeenCalledWith('/apis/proxies/v8/org/v1/search', expectedRequest)
    })
  })

  describe('getDepartmentTitles', () => {
    it('should call http.get with the correct endpoint', () => {
      const mockResponse = { data: 'some data' }
      httpClient.get.mockReturnValue(of(mockResponse))

      service.getDepartmentTitles().subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(httpClient.get).toHaveBeenCalledWith('/apis/proxies/v8/data/v1/system/settings/get/orgTypeList')
    })
  })

  describe('getDepartmentSubTitles', () => {
    it('should call http.get with the correct endpoint', () => {
      const mockResponse = { data: 'some data' }
      httpClient.get.mockReturnValue(of(mockResponse))

      service.getDepartmentSubTitles().subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(httpClient.get).toHaveBeenCalledWith('/apis/proxies/v8/data/v1/system/settings/get/orgTypeConfig')
    })
  })
})
