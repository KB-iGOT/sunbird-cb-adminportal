import { HttpClient } from '@angular/common/http'
import { of } from 'rxjs'
import { DeveloperDocService } from './developer-doc.service'

describe('DeveloperDocService', () => {
  let service: DeveloperDocService
  let mockHttp: jest.Mocked<Partial<HttpClient>>

  beforeEach(() => {
    mockHttp = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    }
    service = new DeveloperDocService(mockHttp as HttpClient, '/en/')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should create an instance of the service', () => {
    expect(service).toBeTruthy()
  })

  describe('getArticles', () => {
    it('should call POST with search endpoint and formBody', () => {
      const body = { query: 'angular' }
        ; (mockHttp.post as jest.Mock).mockReturnValue(of([]))
      service.getArticles(body)
      expect(mockHttp.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/knowledge/centre/spv/search',
        body
      )
    })
  })

  describe('createSubCategory', () => {
    it('should call POST with create subcategory endpoint', () => {
      const body = { name: 'New Sub' }
        ; (mockHttp.post as jest.Mock).mockReturnValue(of({}))
      service.createSubCategory(body)
      expect(mockHttp.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/knowledge/centre/create/subcategory',
        body
      )
    })
  })

  describe('updateSubCategory', () => {
    it('should call PUT with update subcategory endpoint including subCategoryId', () => {
      const body = { subCategoryId: 'sub-1', name: 'Updated Sub' }
        ; (mockHttp.put as jest.Mock).mockReturnValue(of({}))
      service.updateSubCategory(body)
      expect(mockHttp.put).toHaveBeenCalledWith(
        '/apis/proxies/v8/knowledge/centre/update/subcategory/sub-1',
        body
      )
    })
  })

  describe('createArticle', () => {
    it('should call POST with create article endpoint', () => {
      const body = { title: 'New Article' }
        ; (mockHttp.post as jest.Mock).mockReturnValue(of({}))
      service.createArticle(body)
      expect(mockHttp.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/knowledge/centre/create/article',
        body
      )
    })
  })

  describe('updateArticle', () => {
    it('should call PUT with update article endpoint including articleId', () => {
      const body = { articleId: 'art-42', title: 'Updated Article' }
        ; (mockHttp.put as jest.Mock).mockReturnValue(of({}))
      service.updateArticle(body)
      expect(mockHttp.put).toHaveBeenCalledWith(
        '/apis/proxies/v8/knowledge/centre/update/article/art-42',
        body
      )
    })
  })

  describe('deleteArticle', () => {
    it('should call DELETE with correct URL for given articleId', () => {
      ; (mockHttp.delete as jest.Mock).mockReturnValue(of({}))
      service.deleteArticle('art-99')
      expect(mockHttp.delete).toHaveBeenCalledWith(
        '/apis/proxies/v8/knowledge/centre/delete/article/art-99'
      )
    })
  })

  describe('publishSubCategory', () => {
    it('should call POST with publish subcategory endpoint', () => {
      const body = { subCategoryId: 'sub-2' }
        ; (mockHttp.post as jest.Mock).mockReturnValue(of({}))
      service.publishSubCategory(body)
      expect(mockHttp.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/knowledge/centre/publish/subcategory',
        body
      )
    })
  })

  describe('publishArticle', () => {
    it('should call POST with publish article endpoint', () => {
      const body = { articleId: 'art-1' }
        ; (mockHttp.post as jest.Mock).mockReturnValue(of({}))
      service.publishArticle(body)
      expect(mockHttp.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/knowledge/centre/publish/article',
        body
      )
    })
  })

  describe('deleteSubCategory', () => {
    it('should call DELETE with correct URL for given subCategoryId', () => {
      ; (mockHttp.delete as jest.Mock).mockReturnValue(of({}))
      service.deleteSubCategory('sub-77')
      expect(mockHttp.delete).toHaveBeenCalledWith(
        '/apis/proxies/v8/knowledge/centre/delete/subcategory/sub-77'
      )
    })
  })

  describe('locale getter', () => {
    it('should return locale extracted from baseHref', () => {
      service = new DeveloperDocService(mockHttp as HttpClient, '/en/')
      expect(service.locale).toBe('en')
    })

    it('should return "en" when baseHref is empty', () => {
      service = new DeveloperDocService(mockHttp as HttpClient, '/')
      expect(service.locale).toBe('en')
    })

    it('should return "en" when baseHref is just a slash', () => {
      service = new DeveloperDocService(mockHttp as HttpClient, '/')
      expect(service.locale).toBe('en')
    })

    it('should return language part when baseHref contains language and region', () => {
      service = new DeveloperDocService(mockHttp as HttpClient, '/hi-IN/')
      expect(service.locale).toBe('hi')
    })
  })
})
