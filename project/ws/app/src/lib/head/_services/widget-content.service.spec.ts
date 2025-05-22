import { of, throwError } from 'rxjs'
import { WidgetContentService } from './widget-content.service'
import { NsContent } from './widget-content.model'
import { NSSearch } from './widget-search.model'

// Mock dependencies
const mockHttpClient = {
  get: jest.fn(),
  post: jest.fn(),
  delete: jest.fn()
}

const mockConfigService = {
  userProfile: {
    country: 'IN'
  }
}

describe('WidgetContentService', () => {
  let service: WidgetContentService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new WidgetContentService(mockHttpClient as any, mockConfigService as any)
  })

  describe('isResource', () => {
    it('should return true for LEARNING_RESOURCE primary category', () => {
      const result = service.isResource(NsContent.EResourcePrimaryCategories.LEARNING_RESOURCE)
      expect(result).toBe(true)
    })

    it('should return false for non-LEARNING_RESOURCE primary category', () => {
      const result = service.isResource('OTHER_CATEGORY')
      expect(result).toBe(false)
    })

    it('should return false for null/undefined primary category', () => {
      expect(service.isResource(null as any)).toBe(false)
      expect(service.isResource(undefined as any)).toBe(false)
    })
  })

  describe('fetchMarkAsCompleteMeta', () => {
    it('should fetch mark as complete meta data', async () => {
      const mockResponse = { status: 'success' }
      mockHttpClient.get.mockReturnValue({ toPromise: () => Promise.resolve(mockResponse) })

      const result = await service.fetchMarkAsCompleteMeta('content-123')

      expect(mockHttpClient.get).toHaveBeenCalledWith('/apis/protected/v8/user/progress/content-123')
      expect(result).toEqual(mockResponse)
    })
  })

  describe('fetchContent', () => {
    const mockContent: NsContent.IContent = {
      identifier: 'content-123',
      name: 'Test Content',
      contentType: 'Resource'
    } as NsContent.IContent

    it('should fetch content using resource API for learning resource primary category', () => {
      mockHttpClient.get.mockReturnValue(of(mockContent))

      service.fetchContent('content-123', 'detail', [], NsContent.EResourcePrimaryCategories.LEARNING_RESOURCE)

      expect(mockHttpClient.get).toHaveBeenCalledWith('/apis/proxies/v8/action/content/v3/read/content-123')
    })

    it('should fetch content using hierarchy API for non-resource primary category', () => {
      mockHttpClient.get.mockReturnValue(of(mockContent))

      service.fetchContent('content-123', 'detail', [], 'OTHER_CATEGORY')

      expect(mockHttpClient.get).toHaveBeenCalledWith('/apis/proxies/v8/action/content/v3/hierarchy/content-123?hierarchyType=detail')
    })

    it('should use hierarchy API when no primary category is provided', () => {
      mockHttpClient.get.mockReturnValue(of(mockContent))

      service.fetchContent('content-123')

      expect(mockHttpClient.get).toHaveBeenCalledWith('/apis/proxies/v8/action/content/v3/hierarchy/content-123?hierarchyType=detail')
    })

    it('should handle different hierarchy types', () => {
      mockHttpClient.get.mockReturnValue(of(mockContent))

      service.fetchContent('content-123', 'minimal')

      expect(mockHttpClient.get).toHaveBeenCalledWith('/apis/proxies/v8/action/content/v3/hierarchy/content-123?hierarchyType=minimal')
    })
  })

  describe('fetchAuthoringContent', () => {
    it('should fetch authoring content', () => {
      const mockContent = { identifier: 'auth-content-123' }
      mockHttpClient.get.mockReturnValue(of(mockContent))

      service.fetchAuthoringContent('auth-content-123')

      expect(mockHttpClient.get).toHaveBeenCalledWith('/apis/authApi/hierarchy/auth-content-123')
    })
  })

  describe('fetchMultipleContent', () => {
    it('should fetch multiple content items', () => {
      const mockContents = [{ identifier: 'content-1' }, { identifier: 'content-2' }]
      mockHttpClient.get.mockReturnValue(of(mockContents))

      service.fetchMultipleContent(['content-1', 'content-2'])

      expect(mockHttpClient.get).toHaveBeenCalledWith('/apis/protected/v8/content/multiple/content-1,content-2')
    })
  })

  describe('fetchCollectionHierarchy', () => {
    it('should fetch collection hierarchy with default pagination', () => {
      const mockResponse = { result: {} }
      mockHttpClient.get.mockReturnValue(of(mockResponse))

      service.fetchCollectionHierarchy('course', 'collection-123')

      expect(mockHttpClient.get).toHaveBeenCalledWith('/apis/protected/v8/content/collection/course/collection-123?pageNumber=0&pageSize=1')
    })

    it('should fetch collection hierarchy with custom pagination', () => {
      const mockResponse = { result: {} }
      mockHttpClient.get.mockReturnValue(of(mockResponse))

      service.fetchCollectionHierarchy('course', 'collection-123', 2, 10)

      expect(mockHttpClient.get).toHaveBeenCalledWith('/apis/protected/v8/content/collection/course/collection-123?pageNumber=2&pageSize=10')
    })
  })

  describe('fetchCourseBatches', () => {
    it('should fetch course batches and return mapped response', () => {
      const mockApiResponse = {
        result: {
          response: {
            count: 1,
            content: [{ batchId: 'batch-123' }]
          }
        }
      }
      const expectedResponse = {
        count: 1,
        content: [{ batchId: 'batch-123' }]
      }

      mockHttpClient.post.mockReturnValue(of(mockApiResponse))

      const result$ = service.fetchCourseBatches({ courseId: 'course-123' })

      result$.subscribe(result => {
        expect(result).toEqual(expectedResponse)
      })

      expect(mockHttpClient.post).toHaveBeenCalledWith('/apis/proxies/v8/learner/course/v1/batch/list', { courseId: 'course-123' })
    })
  })

  describe('enrollUserToBatch', () => {
    it('should enroll user to batch', async () => {
      const mockResponse = { status: 'success' }
      mockHttpClient.post.mockReturnValue({ toPromise: () => Promise.resolve(mockResponse) })

      const enrollRequest = { courseId: 'course-123', batchId: 'batch-123' }
      const result = await service.enrollUserToBatch(enrollRequest)

      expect(mockHttpClient.post).toHaveBeenCalledWith('/apis/proxies/v8/learner/course/v1/enrol', enrollRequest)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('fetchContentLikes', () => {
    it('should fetch content likes', async () => {
      const mockResponse = { 'content-123': 5 }
      mockHttpClient.post.mockReturnValue({ toPromise: () => Promise.resolve(mockResponse) })

      const result = await service.fetchContentLikes({ content_id: ['content-123'] })

      expect(mockHttpClient.post).toHaveBeenCalledWith('/apis/protected/v8/content/likeCount', { content_id: ['content-123'] })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('fetchContentRatings', () => {
    it('should fetch content ratings', async () => {
      const mockResponse = { ratings: [{ contentId: 'content-123', rating: 4.5 }] }
      mockHttpClient.post.mockReturnValue({ toPromise: () => Promise.resolve(mockResponse) })

      const result = await service.fetchContentRatings({ contentIds: ['content-123'] })

      expect(mockHttpClient.post).toHaveBeenCalledWith('/apis/protected/v8/user/rating/rating', { contentIds: ['content-123'] })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('fetchContentHistory', () => {
    it('should fetch content history', () => {
      const mockHistory = { identifier: 'content-123', progress: 50 }
      mockHttpClient.get.mockReturnValue(of(mockHistory))

      service.fetchContentHistory('content-123')

      expect(mockHttpClient.get).toHaveBeenCalledWith('/apis/protected/v8/user/history/content-123')
    })
  })

  describe('fetchContentHistoryV2', () => {
    it('should fetch content history v2 with fields modification', () => {
      const mockHistory = { identifier: 'content-123', progress: 50 }
      mockHttpClient.post.mockReturnValue(of(mockHistory))

      const request: NsContent.IContinueLearningDataReq = {
        request: {
          courseId: 'course-123',
          fields: [],
          userId: undefined,
          contentIds: [],
          batchId: undefined
        }
      }

      service.fetchContentHistoryV2(request)

      expect(request.request.fields).toEqual(['progressdetails'])
      expect(mockHttpClient.post).toHaveBeenCalledWith('/apis/proxies/v8/read/content-progres/course-123', request)
    })
  })

  describe('continueLearning', () => {
    beforeEach(() => {
      // Create a mock that properly chains the promise methods
      const createMockObservable = (shouldReject = false) => {
        const mockPromise = shouldReject
          ? Promise.reject(new Error('API Error'))
          : Promise.resolve({})

        return {
          toPromise: () => mockPromise.catch(() => { }).finally(() => { }),
          pipe: jest.fn().mockReturnThis(),
          subscribe: jest.fn()
        }
      }

      jest.spyOn(service, 'saveContinueLearning').mockReturnValue(createMockObservable() as any)
    })

    it('should handle playlist collection type', async () => {
      const result = await service.continueLearning('content-123', 'collection-123', 'playlist')

      expect(service.saveContinueLearning).toHaveBeenCalledWith({
        contextPathId: 'collection-123',
        resourceId: 'content-123',
        data: expect.stringContaining('contextFullPath'),
        dateAccessed: expect.any(Number),
        contextType: 'playlist'
      })
      expect(result).toBe(true)
    })

    it('should handle non-playlist collection type', async () => {
      const result = await service.continueLearning('content-123', 'collection-123', 'course')

      expect(service.saveContinueLearning).toHaveBeenCalledWith({
        contextPathId: 'collection-123',
        resourceId: 'content-123',
        data: expect.stringContaining('timestamp'),
        dateAccessed: expect.any(Number)
      })
      expect(result).toBe(true)
    })

    it('should handle case without collection type', async () => {
      const result = await service.continueLearning('content-123')

      expect(service.saveContinueLearning).toHaveBeenCalledWith({
        contextPathId: 'content-123',
        resourceId: 'content-123',
        data: expect.stringContaining('timestamp'),
        dateAccessed: expect.any(Number)
      })
      expect(result).toBe(true)
    })

    it('should resolve to true even if saveContinueLearning fails', async () => {
      // Create a failing observable
      const createFailingMockObservable = () => {
        const mockPromise = Promise.reject(new Error('API Error'))

        return {
          toPromise: () => mockPromise.catch(() => { }).finally(() => { }),
          pipe: jest.fn().mockReturnThis(),
          subscribe: jest.fn()
        }
      }

      jest.spyOn(service, 'saveContinueLearning').mockReturnValue(createFailingMockObservable() as any)

      const result = await service.continueLearning('content-123')

      expect(result).toBe(true)
    })

    it('should handle playlist collection type with uppercase', async () => {
      const result = await service.continueLearning('content-123', 'collection-123', 'PLAYLIST')

      expect(service.saveContinueLearning).toHaveBeenCalledWith({
        contextPathId: 'collection-123',
        resourceId: 'content-123',
        data: expect.stringContaining('contextFullPath'),
        dateAccessed: expect.any(Number),
        contextType: 'playlist'
      })
      expect(result).toBe(true)
    })
  })

  describe('saveContinueLearning', () => {
    it('should save continue learning data', () => {
      const mockResponse = { status: 'success' }
      mockHttpClient.post.mockReturnValue(of(mockResponse))

      const request: NsContent.IViewerContinueLearningRequest = {
        contextPathId: 'content-123',
        resourceId: 'content-123',
        data: '{"timestamp": 123456789}',
        dateAccessed: 123456789
      }

      service.saveContinueLearning(request)

      expect(mockHttpClient.post).toHaveBeenCalledWith('/apis/protected/v8/user/history/continue', request)
    })
  })

  describe('setS3Cookie', () => {
    it('should set S3 cookie and handle success', () => {
      mockHttpClient.post.mockReturnValue(of({ status: 'success' }))

      const result$ = service.setS3Cookie('content-123')

      result$.subscribe(result => {
        expect(result).toEqual({ status: 'success' })
      })

      expect(mockHttpClient.post).toHaveBeenCalledWith('/apis/protected/v8/content/setCookie', { contentId: 'content-123' })
    })

    it('should handle S3 cookie error and return true', () => {
      mockHttpClient.post.mockReturnValue(throwError('error'))

      const result$ = service.setS3Cookie('content-123')

      result$.subscribe(result => {
        expect(result).toBe(true)
      })
    })
  })

  describe('setS3ImageCookie', () => {
    it('should set S3 image cookie and handle success', () => {
      mockHttpClient.post.mockReturnValue(of({ status: 'success' }))

      const result$ = service.setS3ImageCookie()

      result$.subscribe(result => {
        expect(result).toEqual({ status: 'success' })
      })

      expect(mockHttpClient.post).toHaveBeenCalledWith('/apis/protected/v8/content/setImageCookie', {})
    })

    it('should handle S3 image cookie error and return true', () => {
      mockHttpClient.post.mockReturnValue(throwError('error'))

      const result$ = service.setS3ImageCookie()

      result$.subscribe(result => {
        expect(result).toBe(true)
      })
    })
  })

  describe('fetchManifest', () => {
    it('should fetch manifest', () => {
      const mockManifest = { files: ['file1.js', 'file2.css'] }
      mockHttpClient.post.mockReturnValue(of(mockManifest))

      service.fetchManifest('https://example.com/manifest')

      expect(mockHttpClient.post).toHaveBeenCalledWith('/apis/protected/v8/content/getWebModuleManifest', { url: 'https://example.com/manifest' })
    })
  })

  describe('fetchWebModuleContent', () => {
    it('should fetch web module content', () => {
      const mockContent = { content: 'module content' }
      mockHttpClient.get.mockReturnValue(of(mockContent))

      const testUrl = 'https://example.com/module.js'
      service.fetchWebModuleContent(testUrl)

      expect(mockHttpClient.get).toHaveBeenCalledWith(`/apis/protected/v8/content/getWebModuleFiles?url=${encodeURIComponent(testUrl)}`)
    })
  })

  describe('search', () => {
    it('should perform search with default empty query', () => {
      const mockSearchResult = { result: { content: [] } }
      mockHttpClient.post.mockReturnValue(of(mockSearchResult))

      const searchRequest: NSSearch.ISearchRequest = {
        filters: { contentType: [] }
      }

      service.search(searchRequest)

      expect(searchRequest.query).toBe('')
      expect(mockHttpClient.post).toHaveBeenCalledWith('/apis/protected/v8/content/searchV5', {
        request: searchRequest
      })
    })

    it('should perform search with provided query', () => {
      const mockSearchResult = { result: { content: [] } }
      mockHttpClient.post.mockReturnValue(of(mockSearchResult))

      const searchRequest: NSSearch.ISearchRequest = {
        query: 'test search',
        filters: { contentType: [] }
      }

      service.search(searchRequest)

      expect(searchRequest.query).toBe('test search')
      expect(mockHttpClient.post).toHaveBeenCalledWith('/apis/protected/v8/content/searchV5', {
        request: searchRequest
      })
    })
  })

  describe('searchRegionRecommendation', () => {
    it('should perform region recommendation search with user country', () => {
      const mockSearchResult = { result: { content: [] } }
      mockHttpClient.post.mockReturnValue(of(mockSearchResult))

      const searchRequest: NSSearch.ISearchOrgRegionRecommendationRequest = {
        preLabelValue: 'region_',
        filters: {}
      }

      service.searchRegionRecommendation(searchRequest)

      expect(searchRequest.preLabelValue).toBe('region_IN')
      if (searchRequest.filters) {
        expect(searchRequest.filters.labels).toEqual(['region_IN'])
      }
      expect(mockHttpClient.post).toHaveBeenCalledWith('/apis/protected/v8/content/searchRegionRecommendation', {
        request: searchRequest
      })
    })
  })

  describe('searchV6', () => {
    it('should perform searchV6 with default empty query', () => {
      const mockSearchResult = { result: { content: [] } }
      mockHttpClient.post.mockReturnValue(of(mockSearchResult))

      const searchRequest: NSSearch.ISearchV6Request = {
        query: ''
      }

      service.searchV6(searchRequest)

      expect(searchRequest.query).toBe('')
      expect(mockHttpClient.post).toHaveBeenCalledWith('/apis/proxies/v8/sunbirdigot/read', searchRequest)
    })
  })

  describe('fetchContentRating', () => {
    it('should fetch content rating', () => {
      const mockRating = { rating: 4.5 }
      mockHttpClient.get.mockReturnValue(of(mockRating))

      service.fetchContentRating('content-123')

      expect(mockHttpClient.get).toHaveBeenCalledWith('/apis/protected/v8/user/rating/content-123')
    })
  })

  describe('deleteContentRating', () => {
    it('should delete content rating', () => {
      const mockResponse = { status: 'deleted' }
      mockHttpClient.delete.mockReturnValue(of(mockResponse))

      service.deleteContentRating('content-123')

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/apis/protected/v8/user/rating/content-123')
    })
  })

  describe('addContentRating', () => {
    it('should add content rating', () => {
      const mockResponse = { status: 'added' }
      mockHttpClient.post.mockReturnValue(of(mockResponse))

      const ratingData = { rating: 4 }
      service.addContentRating('content-123', ratingData)

      expect(mockHttpClient.post).toHaveBeenCalledWith('/apis/protected/v8/user/rating/content-123', ratingData)
    })
  })

  describe('getFirstChildInHierarchy', () => {
    it('should return content if no children', () => {
      const content: NsContent.IContent = {
        identifier: 'content-123',
        contentType: 'Resource',
        children: []
      } as unknown as NsContent.IContent

      const result = service.getFirstChildInHierarchy(content)

      expect(result).toBe(content)
    })

    it('should return Learning Path if it has artifactUrl', () => {
      const content: NsContent.IContent = {
        identifier: 'content-123',
        contentType: 'Learning Path',
        artifactUrl: 'https://example.com/artifact',
        children: [{ identifier: 'child-1' } as NsContent.IContent]
      } as NsContent.IContent

      const result = service.getFirstChildInHierarchy(content)

      expect(result).toBe(content)
    })

    it('should recurse for Learning Path without artifactUrl', () => {
      const childContent: NsContent.IContent = {
        identifier: 'child-1',
        contentType: 'Resource',
        children: []
      } as unknown as NsContent.IContent

      const content: NsContent.IContent = {
        identifier: 'content-123',
        contentType: 'Learning Path',
        children: [childContent]
      } as NsContent.IContent

      const result = service.getFirstChildInHierarchy(content)

      expect(result).toBe(childContent)
    })

    it('should return Resource content directly', () => {
      const content: NsContent.IContent = {
        identifier: 'content-123',
        contentType: 'Resource',
        children: [{ identifier: 'child-1' } as NsContent.IContent]
      } as NsContent.IContent

      const result = service.getFirstChildInHierarchy(content)

      expect(result).toBe(content)
    })

    it('should return Knowledge Artifact content directly', () => {
      const content: NsContent.IContent = {
        identifier: 'content-123',
        contentType: 'Knowledge Artifact',
        children: [{ identifier: 'child-1' } as NsContent.IContent]
      } as NsContent.IContent

      const result = service.getFirstChildInHierarchy(content)

      expect(result).toBe(content)
    })

    it('should recurse for other content types', () => {
      const grandChildContent: NsContent.IContent = {
        identifier: 'grandchild-1',
        contentType: 'Resource',
        children: []
      } as unknown as NsContent.IContent

      const childContent: NsContent.IContent = {
        identifier: 'child-1',
        contentType: 'Course',
        children: [grandChildContent]
      } as NsContent.IContent

      const content: NsContent.IContent = {
        identifier: 'content-123',
        contentType: 'Course',
        children: [childContent]
      } as NsContent.IContent

      const result = service.getFirstChildInHierarchy(content)

      expect(result).toBe(grandChildContent)
    })
  })

  describe('getRegistrationStatus', () => {
    it('should get registration status', async () => {
      const mockResponse = { hasAccess: true, registrationUrl: 'https://example.com/register' }
      mockHttpClient.get.mockReturnValue({ toPromise: () => Promise.resolve(mockResponse) })

      const result = await service.getRegistrationStatus('external-source')

      expect(mockHttpClient.get).toHaveBeenCalledWith('/apis/protected/v8/admin/userRegistration/checkUserRegistrationContent/external-source')
      expect(result).toEqual(mockResponse)
    })
  })

  describe('fetchConfig', () => {
    it('should fetch config from URL', () => {
      const mockConfig = { appConfig: { name: 'Test App' } }
      mockHttpClient.get.mockReturnValue(of(mockConfig))

      service.fetchConfig('https://example.com/config.json')

      expect(mockHttpClient.get).toHaveBeenCalledWith('https://example.com/config.json')
    })
  })
})