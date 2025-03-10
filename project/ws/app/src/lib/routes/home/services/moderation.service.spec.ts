import { ModerationService } from './moderation.service'
import { HttpClient } from '@angular/common/http'
import { of } from 'rxjs'

describe('ModerationService', () => {
  let service: ModerationService
  let httpClientSpy: jest.Mocked<HttpClient>

  beforeEach(() => {
    // Create a spy object for HttpClient
    httpClientSpy = {
      get: jest.fn(),
      post: jest.fn()
    } as unknown as jest.Mocked<HttpClient>

    // Instantiate the service with the spy
    service = new ModerationService(httpClientSpy)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('getAllDepartments', () => {
    it('should call http.get with the correct URL', () => {
      // Mock data
      const mockResponse = { departments: [{ id: 1, name: 'Department 1' }] }

      // Setup the spy to return mock data
      httpClientSpy.get.mockReturnValue(of(mockResponse))

      // Call the method
      let result: any
      service.getAllDepartments().subscribe(res => {
        result = res
      })

      // Verify the API was called correctly
      expect(httpClientSpy.get).toHaveBeenCalledWith('/apis/protected/v8/portal/spv/department')

      // Verify the result is as expected
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getAllDepartmentsKong', () => {
    it('should call http.post with the correct URL and request body', () => {
      // Mock data
      const mockResponse = { departments: [{ id: 1, name: 'Department 1' }] }

      // Expected request body
      const expectedRequest = {
        request: {
          filters: {
            isTenant: true,
          },
          sortBy: {
            orgName: 'asc',
          },
          limit: 1000,
        },
      }

      // Setup the spy to return mock data
      httpClientSpy.post.mockReturnValue(of(mockResponse))

      // Call the method
      let result: any
      service.getAllDepartmentsKong().subscribe(res => {
        result = res
      })

      // Verify the API was called correctly
      expect(httpClientSpy.post).toHaveBeenCalledWith('/apis/proxies/v8/org/v1/search', expectedRequest)

      // Verify the result is as expected
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getDepartmentTitles', () => {
    it('should call http.get with the correct URL', () => {
      // Mock data
      const mockResponse = { titles: ['Title 1', 'Title 2'] }

      // Setup the spy to return mock data
      httpClientSpy.get.mockReturnValue(of(mockResponse))

      // Call the method
      let result: any
      service.getDepartmentTitles().subscribe(res => {
        result = res
      })

      // Verify the API was called correctly
      expect(httpClientSpy.get).toHaveBeenCalledWith('apis/proxies/v8/data/v1/system/settings/get/orgTypeList')

      // Verify the result is as expected
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getDepartmentSubTitles', () => {
    it('should call http.get with the correct URL', () => {
      // Mock data
      const mockResponse = { subtitles: ['Subtitle 1', 'Subtitle 2'] }

      // Setup the spy to return mock data
      httpClientSpy.get.mockReturnValue(of(mockResponse))

      // Call the method
      let result: any
      service.getDepartmentSubTitles().subscribe(res => {
        result = res
      })

      // Verify the API was called correctly
      expect(httpClientSpy.get).toHaveBeenCalledWith('apis/proxies/v8/data/v1/system/settings/get/orgTypeConfig')

      // Verify the result is as expected
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getData', () => {
    it('should call http.post with the correct URL and request body', () => {
      // Mock data
      const mockResponse = { data: [{ id: 1, text: 'Feedback 1' }] }

      // Expected request body
      const expectedRequest = {
        page: {
          number: 0,
          size: 10000,
        },
        moderated: false,
        sort: {
          field: 'timestamp',
          order: 'desc',
        },
      }

      // Setup the spy to return mock data
      httpClientSpy.post.mockReturnValue(of(mockResponse))

      // Call the method
      let result: any
      service.getData().subscribe(res => {
        result = res
      })

      // Verify the API was called correctly
      expect(httpClientSpy.post).toHaveBeenCalledWith('/moderatoradmin/feedback/text/fetch', expectedRequest)

      // Verify the result is as expected
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getModeratedData', () => {
    it('should call http.post with the correct URL and request body', () => {
      // Mock data
      const mockResponse = { data: [{ id: 1, text: 'Moderated Feedback 1' }] }

      // Expected request body
      const expectedRequest = {
        page: {
          number: 0,
          size: 10000,
        },
        moderated: true,
        sort: {
          field: 'timestamp',
          order: 'desc',
        },
      }

      // Setup the spy to return mock data
      httpClientSpy.post.mockReturnValue(of(mockResponse))

      // Call the method
      let result: any
      service.getModeratedData().subscribe(res => {
        result = res
      })

      // Verify the API was called correctly
      expect(httpClientSpy.post).toHaveBeenCalledWith('/moderatoradmin/feedback/text/fetch', expectedRequest)

      // Verify the result is as expected
      expect(result).toEqual(mockResponse)
    })
  })
})