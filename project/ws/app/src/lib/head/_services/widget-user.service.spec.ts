import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { WidgetUserService } from './widget-user.service'
import { IUserGroupDetails } from './widget-user.model'
describe('WidgetUserService', () => {
  let service: WidgetUserService
  let httpMock: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [WidgetUserService]
    })

    service = TestBed.inject(WidgetUserService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify() // Verify that no unmatched requests are outstanding
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('fetchUserGroupDetails', () => {
    it('should return user group details for a given userId', () => {
      const userId = 'test-user-id'
      const mockResponse: IUserGroupDetails[] = [
      ]

      service.fetchUserGroupDetails(userId).subscribe(groups => {
        expect(groups).toEqual(mockResponse)
        expect(groups.length).toBe(2)
      })

      const req = httpMock.expectOne(
        `/apis/protected/v8/user/group/fetchUserGroup?userId=${userId}`
      )
      expect(req.request.method).toBe('GET')
      req.flush(mockResponse)
    })

    it('should handle error when fetchUserGroupDetails fails', () => {
      const userId = 'test-user-id'
      const errorEvent = new ErrorEvent('API Error', {
        error: new Error('Network Error'),
        message: 'Network Error'
      })

      service.fetchUserGroupDetails(userId).subscribe(
        () => fail('Expected an error, not user groups'),
        error => {
          expect(error).toBe('Error: Network Error')
        }
      )

      const req = httpMock.expectOne(
        `/apis/protected/v8/user/group/fetchUserGroup?userId=${userId}`
      )
      req.error(errorEvent)
    })
  })

  describe('fetchUserBatchList', () => {
    it('should return user course list for a given userId', () => {
      const userId = 'test-user-id'
      const mockApiResponse = {
        result: {
          courses: [
          ]
        }
      }

      service.fetchUserBatchList(userId).subscribe(courses => {
        expect(courses).toEqual(mockApiResponse.result.courses)
        expect(courses.length).toBe(2)
      })

      const req = httpMock.expectOne(
        `/apis/proxies/v8/learner/course/v1/user/enrollment/list/${userId}?orgdetails=orgName,email&licenseDetails=name,description,url&fields=contentType,topic,name,channel,mimeType,appIcon,gradeLevel,resourceType,identifier,medium,pkgVersion,board,subject,trackable&batchDetails=name,endDate,startDate,status,enrollmentType,createdBy,certificates`
      )
      expect(req.request.method).toBe('GET')
      req.flush(mockApiResponse)
    })

    it('should handle error when fetchUserBatchList fails', () => {
      const userId = 'test-user-id'
      const errorEvent = new ErrorEvent('API Error', {
        error: new Error('Network Error'),
        message: 'Network Error'
      })

      service.fetchUserBatchList(userId).subscribe(
        () => fail('Expected an error, not courses'),
        error => {
          expect(error).toBe('Error: Network Error')
        }
      )

      const req = httpMock.expectOne(
        `/apis/proxies/v8/learner/course/v1/user/enrollment/list/${userId}?orgdetails=orgName,email&licenseDetails=name,description,url&fields=contentType,topic,name,channel,mimeType,appIcon,gradeLevel,resourceType,identifier,medium,pkgVersion,board,subject,trackable&batchDetails=name,endDate,startDate,status,enrollmentType,createdBy,certificates`
      )
      req.error(errorEvent)
    })

    it('should handle undefined userId in fetchUserBatchList', () => {
      const userId = undefined

      service.fetchUserBatchList(userId).subscribe(
        courses => {
          expect(courses).toBeDefined()
        },
        () => fail('Should not throw error for undefined userId')
      )

      const req = httpMock.expectOne(
        `/apis/proxies/v8/learner/course/v1/user/enrollment/list/${userId}?orgdetails=orgName,email&licenseDetails=name,description,url&fields=contentType,topic,name,channel,mimeType,appIcon,gradeLevel,resourceType,identifier,medium,pkgVersion,board,subject,trackable&batchDetails=name,endDate,startDate,status,enrollmentType,createdBy,certificates`
      )
      expect(req.request.method).toBe('GET')
      req.flush({ result: { courses: [] } })
    })
  })

  describe('handleError', () => {
    it('should return an error message', () => {
      const errorEvent = new ErrorEvent('API Error', {
        error: new Error('Test Error'),
        message: 'Test Error'
      })

      const errorObservable = service.handleError(errorEvent)

      errorObservable.subscribe(
        () => fail('Should have failed with error'),
        (error) => {
          expect(error).toBe('Error: Test Error')
        }
      )
    })
  })
})