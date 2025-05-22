import { of, throwError } from 'rxjs'
import { WidgetUserService } from './widget-user.service'
import { IUserGroupDetails } from './widget-user.model'
import { NsContent } from './widget-content.model'

// Mock HttpClient
const mockHttpClient = {
  get: jest.fn()
}

// Mock data
const mockUserGroupDetails: IUserGroupDetails[] = [

]

const mockUserBatchResponse = {
  result: {
    courses: [
      {
        identifier: 'course1',
        name: 'Course 1',
        contentType: 'Course',
        mimeType: 'application/vnd.ekstep.content-collection'
      },
      {
        identifier: 'course2',
        name: 'Course 2',
        contentType: 'Course',
        mimeType: 'application/vnd.ekstep.content-collection'
      }
    ] as unknown as NsContent.ICourse[]
  }
}

describe('WidgetUserService', () => {
  let service: WidgetUserService

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()
    // Create service instance with mocked HttpClient
    service = new WidgetUserService(mockHttpClient as any)
  })

  describe('constructor', () => {
    it('should create service instance', () => {
      expect(service).toBeDefined()
      expect(service).toBeInstanceOf(WidgetUserService)
    })
  })

  describe('handleError', () => {
    it('should return error message when error.error is an ErrorEvent instance', () => {
      const errorEvent = new ErrorEvent('test', { message: 'Test error message' })
      const mockError = {
        error: errorEvent
      } as any

      const result = service.handleError(mockError)

      result.subscribe({
        error: (error) => {
          expect(error).toBe('Error: Test error message')
        }
      })
    })

    it('should return empty string when error.error is not an ErrorEvent instance', () => {
      const mockError = {
        error: { message: 'Some other error' }
      } as any

      const result = service.handleError(mockError)

      result.subscribe({
        error: (error) => {
          expect(error).toBe('')
        }
      })
    })

    it('should return empty string when error.error is undefined', () => {
      const mockError = {
        error: undefined
      } as any

      const result = service.handleError(mockError)

      result.subscribe({
        error: (error) => {
          expect(error).toBe('')
        }
      })
    })
  })

  describe('fetchUserGroupDetails', () => {
    const userId = 'test-user-id'
    const expectedUrl = '/apis/protected/v8/user/group/fetchUserGroup?userId=test-user-id'

    it('should fetch user group details successfully', (done) => {
      mockHttpClient.get.mockReturnValue(of(mockUserGroupDetails))

      service.fetchUserGroupDetails(userId).subscribe({
        next: (result) => {
          expect(result).toEqual(mockUserGroupDetails)
          expect(mockHttpClient.get).toHaveBeenCalledWith(expectedUrl)
          expect(mockHttpClient.get).toHaveBeenCalledTimes(1)
          done()
        }
      })
    })

    it('should handle HTTP error and call handleError', (done) => {
      const httpError = new Error('HTTP Error')
      mockHttpClient.get.mockReturnValue(throwError(httpError))

      // Spy on handleError method
      const handleErrorSpy = jest.spyOn(service, 'handleError')

      service.fetchUserGroupDetails(userId).subscribe({
        error: () => {
          expect(handleErrorSpy).toHaveBeenCalledWith(httpError)
          expect(mockHttpClient.get).toHaveBeenCalledWith(expectedUrl)
          done()
        }
      })
    })

    it('should construct correct API endpoint with userId', () => {
      mockHttpClient.get.mockReturnValue(of(mockUserGroupDetails))

      service.fetchUserGroupDetails(userId).subscribe()

      expect(mockHttpClient.get).toHaveBeenCalledWith(expectedUrl)
    })

    it('should handle different userId values', () => {
      const differentUserId = 'another-user-123'
      const expectedUrlForDifferentUser = `/apis/protected/v8/user/group/fetchUserGroup?userId=${differentUserId}`

      mockHttpClient.get.mockReturnValue(of(mockUserGroupDetails))

      service.fetchUserGroupDetails(differentUserId).subscribe()

      expect(mockHttpClient.get).toHaveBeenCalledWith(expectedUrlForDifferentUser)
    })
  })

  describe('fetchUserBatchList', () => {
    const userId = 'test-user-id'
    const expectedUrl = `/apis/proxies/v8/learner/course/v1/user/enrollment/list/${userId}?orgdetails=orgName,email&licenseDetails=name,description,url&fields=contentType,topic,name,channel,mimeType,appIcon,gradeLevel,resourceType,identifier,medium,pkgVersion,board,subject,trackable&batchDetails=name,endDate,startDate,status,enrollmentType,createdBy,certificates`

    it('should fetch user batch list successfully and extract courses', (done) => {
      mockHttpClient.get.mockReturnValue(of(mockUserBatchResponse))

      service.fetchUserBatchList(userId).subscribe({
        next: (result) => {
          expect(result).toEqual(mockUserBatchResponse.result.courses)
          expect(mockHttpClient.get).toHaveBeenCalledWith(expectedUrl)
          expect(mockHttpClient.get).toHaveBeenCalledTimes(1)
          done()
        }
      })
    })

    it('should handle undefined userId', (done) => {
      const expectedUrlWithUndefined = `/apis/proxies/v8/learner/course/v1/user/enrollment/list/undefined?orgdetails=orgName,email&licenseDetails=name,description,url&fields=contentType,topic,name,channel,mimeType,appIcon,gradeLevel,resourceType,identifier,medium,pkgVersion,board,subject,trackable&batchDetails=name,endDate,startDate,status,enrollmentType,createdBy,certificates`

      mockHttpClient.get.mockReturnValue(of(mockUserBatchResponse))

      service.fetchUserBatchList(undefined).subscribe({
        next: (result) => {
          expect(result).toEqual(mockUserBatchResponse.result.courses)
          expect(mockHttpClient.get).toHaveBeenCalledWith(expectedUrlWithUndefined)
          done()
        }
      })
    })

    it('should handle HTTP error and call handleError', (done) => {
      const httpError = new Error('HTTP Error')
      mockHttpClient.get.mockReturnValue(throwError(httpError))

      const handleErrorSpy = jest.spyOn(service, 'handleError')

      service.fetchUserBatchList(userId).subscribe({
        error: () => {
          expect(handleErrorSpy).toHaveBeenCalledWith(httpError)
          expect(mockHttpClient.get).toHaveBeenCalledWith(expectedUrl)
          done()
        }
      })
    })

    it('should map response data correctly', (done) => {
      const customResponse = {
        result: {
          courses: [
            { identifier: 'custom-course', name: 'Custom Course' }
          ]
        }
      }

      mockHttpClient.get.mockReturnValue(of(customResponse))

      service.fetchUserBatchList(userId).subscribe({
        next: (result) => {
          expect(result).toEqual(customResponse.result.courses)
          expect(result).not.toEqual(customResponse) // Should not return the entire response
          done()
        }
      })
    })

    it('should construct correct API endpoint with complex query parameters', () => {
      mockHttpClient.get.mockReturnValue(of(mockUserBatchResponse))

      service.fetchUserBatchList(userId).subscribe()

      expect(mockHttpClient.get).toHaveBeenCalledWith(expectedUrl)
      expect(expectedUrl).toContain('orgdetails=orgName,email')
      expect(expectedUrl).toContain('licenseDetails=name,description,url')
      expect(expectedUrl).toContain('fields=contentType,topic,name,channel,mimeType,appIcon,gradeLevel,resourceType,identifier,medium,pkgVersion,board,subject,trackable')
      expect(expectedUrl).toContain('batchDetails=name,endDate,startDate,status,enrollmentType,createdBy,certificates')
    })

    it('should handle response with empty courses array', (done) => {
      const emptyCoursesResponse = {
        result: {
          courses: []
        }
      }

      mockHttpClient.get.mockReturnValue(of(emptyCoursesResponse))

      service.fetchUserBatchList(userId).subscribe({
        next: (result) => {
          expect(result).toEqual([])
          expect(Array.isArray(result)).toBe(true)
          done()
        }
      })
    })
  })

  describe('API_END_POINTS', () => {
    it('should generate correct FETCH_USER_GROUPS endpoint', () => {
      const userId = 'test-123'
      const expectedEndpoint = '/apis/protected/v8/user/group/fetchUserGroup?userId=test-123'

      // Access the API_END_POINTS through the service file (you might need to export it)
      // For this test, we're verifying the endpoint construction logic by checking the actual calls
      mockHttpClient.get.mockReturnValue(of([]))

      service.fetchUserGroupDetails(userId).subscribe()

      expect(mockHttpClient.get).toHaveBeenCalledWith(expectedEndpoint)
    })

    it('should generate correct FETCH_USER_ENROLLMENT_LIST endpoint', () => {
      const userId = 'test-456'
      const expectedEndpoint = `/apis/proxies/v8/learner/course/v1/user/enrollment/list/${userId}?orgdetails=orgName,email&licenseDetails=name,description,url&fields=contentType,topic,name,channel,mimeType,appIcon,gradeLevel,resourceType,identifier,medium,pkgVersion,board,subject,trackable&batchDetails=name,endDate,startDate,status,enrollmentType,createdBy,certificates`

      mockHttpClient.get.mockReturnValue(of({ result: { courses: [] } }))

      service.fetchUserBatchList(userId).subscribe()

      expect(mockHttpClient.get).toHaveBeenCalledWith(expectedEndpoint)
    })
  })
})