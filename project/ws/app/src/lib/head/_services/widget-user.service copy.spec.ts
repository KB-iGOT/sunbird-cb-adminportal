import { WidgetUserService } from './widget-user.service'
import { HttpClient } from '@angular/common/http'
import { of, throwError } from 'rxjs'
import { IUserGroupDetails } from './widget-user.model'
import { NsContent } from './widget-content.model'

describe('WidgetUserService', () => {
  let service: WidgetUserService
  let httpClientMock: jest.Mocked<HttpClient>

  beforeEach(() => {
    httpClientMock = {
      get: jest.fn()
    } as any

    service = new WidgetUserService(httpClientMock)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('handleError', () => {
    it('should return error message when error is instance of ErrorEvent', (done) => {
      const errorEvent = new ErrorEvent('test error', {
        error: new Error('Test error message')
      })

      const result = service.handleError(errorEvent as any)

      result.subscribe({
        error: (error) => {
          expect(error).toBe('Error: Test error message')
          done()
        }
      })
    })

    it('should return empty string when error is not instance of ErrorEvent', (done) => {
      const errorEvent = {
        error: 'some string error'
      } as any

      const result = service.handleError(errorEvent)

      result.subscribe({
        error: (error) => {
          expect(error).toBe('')
          done()
        }
      })
    })
  })

  describe('fetchUserGroupDetails', () => {
    it('should return user group details for valid userId', (done) => {
      const userId = 'test-user-123'
      const mockUserGroups: IUserGroupDetails[] = [
        {
          id: '1',
          name: 'Test Group',
          description: 'Test Description'
        } as unknown as IUserGroupDetails
      ]

      httpClientMock.get.mockReturnValue(of(mockUserGroups))

      service.fetchUserGroupDetails(userId).subscribe({
        next: (result) => {
          expect(result).toEqual(mockUserGroups)
          expect(httpClientMock.get).toHaveBeenCalledWith(
            `/apis/protected/v8/user/group/fetchUserGroup?userId=${userId}`
          )
          done()
        }
      })
    })

    it('should handle error when HTTP request fails', (done) => {
      const userId = 'test-user-123'
      const errorEvent = new ErrorEvent('network error', {
        error: new Error('Network failure')
      })

      httpClientMock.get.mockReturnValue(throwError(errorEvent))

      service.fetchUserGroupDetails(userId).subscribe({
        error: (error) => {
          expect(error).toBe('Error: Network failure')
          done()
        }
      })
    })

    it('should call correct API endpoint with userId', () => {
      const userId = 'user-456'
      const mockUserGroups: IUserGroupDetails[] = []

      httpClientMock.get.mockReturnValue(of(mockUserGroups))

      service.fetchUserGroupDetails(userId).subscribe()

      expect(httpClientMock.get).toHaveBeenCalledWith(
        `/apis/protected/v8/user/group/fetchUserGroup?userId=${userId}`
      )
    })
  })

  describe('fetchUserBatchList', () => {
    it('should return courses from result.courses when request succeeds', (done) => {
      const userId = 'test-user-123'
      const mockCourses: NsContent.ICourse[] = [
        {
          identifier: 'course-1',
          name: 'Test Course',
          contentType: 'Course'
        } as unknown as NsContent.ICourse
      ]

      const mockResponse = {
        result: {
          courses: mockCourses
        }
      }

      httpClientMock.get.mockReturnValue(of(mockResponse))

      service.fetchUserBatchList(userId).subscribe({
        next: (result) => {
          expect(result).toEqual(mockCourses)
          done()
        }
      })
    })

    it('should handle undefined userId', (done) => {
      const userId = undefined
      const mockCourses: NsContent.ICourse[] = []
      const mockResponse = {
        result: {
          courses: mockCourses
        }
      }

      httpClientMock.get.mockReturnValue(of(mockResponse))

      service.fetchUserBatchList(userId).subscribe({
        next: (result) => {
          expect(result).toEqual(mockCourses)
          expect(httpClientMock.get).toHaveBeenCalledWith(
            `/apis/proxies/v8/learner/course/v1/user/enrollment/list/${userId}?orgdetails=orgName,email&licenseDetails=name,description,url&fields=contentType,topic,name,channel,mimeType,appIcon,gradeLevel,resourceType,identifier,medium,pkgVersion,board,subject,trackable&batchDetails=name,endDate,startDate,status,enrollmentType,createdBy,certificates`
          )
          done()
        }
      })
    })

    it('should call correct API endpoint with all query parameters', () => {
      const userId = 'user-789'
      const mockResponse = {
        result: {
          courses: []
        }
      }

      httpClientMock.get.mockReturnValue(of(mockResponse))

      service.fetchUserBatchList(userId).subscribe()

      const expectedUrl = `/apis/proxies/v8/learner/course/v1/user/enrollment/list/${userId}?orgdetails=orgName,email&licenseDetails=name,description,url&fields=contentType,topic,name,channel,mimeType,appIcon,gradeLevel,resourceType,identifier,medium,pkgVersion,board,subject,trackable&batchDetails=name,endDate,startDate,status,enrollmentType,createdBy,certificates`

      expect(httpClientMock.get).toHaveBeenCalledWith(expectedUrl)
    })

    it('should handle error when HTTP request fails', (done) => {
      const userId = 'test-user-123'
      const errorEvent = new ErrorEvent('api error', {
        error: new Error('API request failed')
      })

      httpClientMock.get.mockReturnValue(throwError(errorEvent))

      service.fetchUserBatchList(userId).subscribe({
        error: (error) => {
          expect(error).toBe('Error: API request failed')
          done()
        }
      })
    })

    it('should extract courses from nested response structure', (done) => {
      const userId = 'test-user-123'
      const mockCourses = [
        { identifier: 'course-1', name: 'Course 1' },
        { identifier: 'course-2', name: 'Course 2' }
      ]

      const mockResponse = {
        result: {
          courses: mockCourses,
          otherData: 'should be ignored'
        },
        metadata: 'should also be ignored'
      }

      httpClientMock.get.mockReturnValue(of(mockResponse))

      service.fetchUserBatchList(userId).subscribe({
        next: (result) => {
          expect(result).toEqual(mockCourses)
          expect(result).not.toContain('should be ignored')
          done()
        }
      })
    })
  })

  describe('API endpoint construction', () => {
    it('should construct correct FETCH_USER_GROUPS endpoint', () => {
      const userId = 'test-123'
      const mockUserGroups: IUserGroupDetails[] = []

      httpClientMock.get.mockReturnValue(of(mockUserGroups))

      service.fetchUserGroupDetails(userId).subscribe()

      expect(httpClientMock.get).toHaveBeenCalledWith(
        '/apis/protected/v8/user/group/fetchUserGroup?userId=test-123'
      )
    })

    it('should construct correct FETCH_USER_ENROLLMENT_LIST endpoint', () => {
      const userId = 'test-456'
      const mockResponse = { result: { courses: [] } }

      httpClientMock.get.mockReturnValue(of(mockResponse))

      service.fetchUserBatchList(userId).subscribe()

      const expectedUrl = '/apis/proxies/v8/learner/course/v1/user/enrollment/list/test-456?orgdetails=orgName,email&licenseDetails=name,description,url&fields=contentType,topic,name,channel,mimeType,appIcon,gradeLevel,resourceType,identifier,medium,pkgVersion,board,subject,trackable&batchDetails=name,endDate,startDate,status,enrollmentType,createdBy,certificates'

      expect(httpClientMock.get).toHaveBeenCalledWith(expectedUrl)
    })
  })
})