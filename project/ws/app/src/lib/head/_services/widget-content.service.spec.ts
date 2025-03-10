import { WidgetContentService } from './widget-content.service'
import { HttpClient } from '@angular/common/http'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { of, throwError } from 'rxjs'

jest.mock('@angular/common/http')
jest.mock('@sunbird-cb/utils')

describe('WidgetContentService', () => {
  let service: WidgetContentService
  let httpClientMock: jest.Mocked<HttpClient>
  let configServiceMock: jest.Mocked<ConfigurationsService>

  beforeEach(() => {
    httpClientMock = new HttpClient(null as any) as jest.Mocked<HttpClient>
    configServiceMock = new ConfigurationsService() as jest.Mocked<ConfigurationsService>

    service = new WidgetContentService(httpClientMock, configServiceMock)
  })

  describe('isResource', () => {
    it('should return true if the primaryCategory is LEARNING_RESOURCE', () => {
      const result = service.isResource('LEARNING_RESOURCE')
      expect(result).toBe(true)
    })

    it('should return false if the primaryCategory is not LEARNING_RESOURCE', () => {
      const result = service.isResource('OTHER_CATEGORY')
      expect(result).toBe(false)
    })

    it('should return false if primaryCategory is null', () => {
      const result = service.isResource('')
      expect(result).toBe(false)
    })
  })

  describe('fetchContent', () => {
    it('should call the correct API URL for content when primaryCategory is not resource', () => {
      const contentId = 'contentId'
      const hierarchyType = 'detail'
      const url = `/apis/proxies/v8/action/content/v3/hierarchy/${contentId}?hierarchyType=${hierarchyType}`

      httpClientMock.get.mockReturnValue(of({}))

      service.fetchContent(contentId, hierarchyType).subscribe(() => {
        expect(httpClientMock.get).toHaveBeenCalledWith(url)
      })
    })

    it('should call the correct API URL for resource content', () => {
      const contentId = 'contentId'
      const hierarchyType = 'detail'
      const primaryCategory = 'LEARNING_RESOURCE'
      const url = `/apis/proxies/v8/action/content/v3/read/${contentId}`

      httpClientMock.get.mockReturnValue(of({}))

      service.fetchContent(contentId, hierarchyType, [], primaryCategory).subscribe(() => {
        expect(httpClientMock.get).toHaveBeenCalledWith(url)
      })
    })
  })

  describe('fetchMarkAsCompleteMeta', () => {
    it('should call the fetchMarkAsCompleteMeta method and return data', async () => {
      const identifier = '12345'
      const url = `/apis/protected/v8/user/progress/${identifier}`
      const mockResponse = { data: 'mockData' }

      httpClientMock.get.mockReturnValue(of(mockResponse))

      const result = await service.fetchMarkAsCompleteMeta(identifier)

      expect(httpClientMock.get).toHaveBeenCalledWith(url)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('fetchCourseBatches', () => {
    it('should return mapped data from the API response', () => {
      const requestPayload = { courseId: '123' }
      const mockResponse = {
        result: {
          response: { batches: ['batch1', 'batch2'] }
        }
      }

      httpClientMock.post.mockReturnValue(of(mockResponse))

      service.fetchCourseBatches(requestPayload).subscribe(response => {
        expect(response).toEqual(mockResponse.result.response)
        expect(httpClientMock.post).toHaveBeenCalledWith('/apis/proxies/v8/learner/course/v1/batch/list', requestPayload)
      })
    })
  })

  describe('setS3Cookie', () => {
    it('should call the setS3Cookie API and return true when no error occurs', () => {
      const contentId = 'contentId'

      httpClientMock.post.mockReturnValue(of(true))

      service.setS3Cookie(contentId).subscribe(response => {
        expect(response).toBe(true)
        expect(httpClientMock.post).toHaveBeenCalledWith('/apis/protected/v8/content/setCookie', { contentId })
      })
    })

    it('should return true when an error occurs', () => {
      const contentId = 'contentId'

      httpClientMock.post.mockReturnValue(throwError(new Error('Error')))

      service.setS3Cookie(contentId).subscribe(response => {
        expect(response).toBe(true)  // Because of catchError inside the service
      })
    })
  })

  describe('getRegistrationStatus', () => {
    it('should return registration status from API', async () => {
      const source = 'source'
      const mockResponse = { hasAccess: true }

      httpClientMock.get.mockReturnValue(of(mockResponse))

      const result = await service.getRegistrationStatus(source)

      expect(result).toEqual(mockResponse)
      expect(httpClientMock.get).toHaveBeenCalledWith('/apis/protected/v8/admin/userRegistration/checkUserRegistrationContent/source')
    })
  })
})
