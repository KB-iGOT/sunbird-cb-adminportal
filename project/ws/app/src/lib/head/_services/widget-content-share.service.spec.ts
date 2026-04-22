import { HttpClient } from '@angular/common/http'
import { of } from 'rxjs'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { WidgetContentShareService } from './widget-content-share.service'
import { NsContent } from './widget-content.model'

describe('WidgetContentShareService', () => {
  let service: WidgetContentShareService
  let httpClientSpy: jest.Mocked<HttpClient>
  let configServiceSpy: jest.Mocked<ConfigurationsService>

  beforeEach(() => {
    // Create mocks for the dependencies
    httpClientSpy = {
      get: jest.fn(),
      post: jest.fn()
    } as any

    configServiceSpy = {
      sitePath: 'https://test-site.com',
      userProfile: {
        userName: 'Test User',
        email: 'test@example.com'
      }
    } as any

    // Initialize the service with mocked dependencies
    service = new WidgetContentShareService(httpClientSpy, configServiceSpy)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('fetchConfigFile', () => {
    it('should call http.get with the correct URL', () => {
      const mockResponse: any = { someKey: 'someValue' } as any
      httpClientSpy.get.mockReturnValue(of(mockResponse))

      service.fetchConfigFile().subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(httpClientSpy.get).toHaveBeenCalledWith('https://test-site.com/feature/common.json')
    })
  })

  describe('shareContent', () => {
    it('should call shareContentApi with correct parameters for type share', () => {
      // Mock content
      const mockContent: NsContent.IContent = {
        identifier: 'content-123',
        name: 'Test Content',
        description: 'Test Description',
        appIcon: 'test-icon-url',
        artifactUrl: 'test-artifact-url',
        downloadUrl: 'test-download-url',
        duration: 60,
        creatorContacts: [{ name: 'creator', email: 'creator@example.com' }],
        track: [{ name: 'Track 1' }],
        size: 1024
      } as NsContent.IContent

      // Mock user email ids
      const userMailIds = [{ email: 'user1@example.com' }, { email: 'user2@example.com' }]

      // Mock text body
      const txtBody = 'Check out this content!'

      // Mock response
      const mockResponse = { response: 'Success' }
      httpClientSpy.post.mockReturnValue(of(mockResponse))

      // Call the service method
      service.shareContent(mockContent, userMailIds, txtBody, 'share').subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      // Verify http.post was called
      expect(httpClientSpy.post).toHaveBeenCalledWith(
        '/apis/protected/v8/user/share',
        expect.any(Object)
      )
    })

    it('should call shareContentApi with correct parameters for type attachment', () => {
      // Mock content
      const mockContent: NsContent.IContent = {
        identifier: 'content-123',
        name: 'Test Content',
        description: 'Test Description',
        appIcon: 'test-icon-url',
        artifactUrl: 'test-artifact-url',
        downloadUrl: 'test-download-url',
        duration: 60,
        creatorContacts: [{ name: 'creator', email: 'creator@example.com' }],
        track: [{ name: 'Track 1' }],
        size: 1024
      } as NsContent.IContent

      // Mock user email ids
      const userMailIds = [{ email: 'user1@example.com' }, { email: 'user2@example.com' }]

      // Mock text body
      const txtBody = 'Check out this content!'

      // Mock response
      const mockResponse = { response: 'Success' }
      httpClientSpy.post.mockReturnValue(of(mockResponse))

      // Call the service method
      service.shareContent(mockContent, userMailIds, txtBody, 'attachment').subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      // Verify http.post was called
      expect(httpClientSpy.post).toHaveBeenCalledWith(
        '/apis/protected/v8/user/share',
        expect.any(Object)
      )
    })

    it('should handle null userProfile gracefully', () => {
      configServiceSpy.userProfile = null as any
      const mockContent = {
        identifier: 'c1', name: 'C1', track: []
      } as any

      httpClientSpy.post.mockReturnValue(of({ response: 'ok' }))
      service.shareContent(mockContent, [{ email: 'a@b.com' }], 'text').subscribe()

      expect(httpClientSpy.post).toHaveBeenCalledWith(
        '/apis/protected/v8/user/share',
        expect.objectContaining({ sharedBy: [{ name: '', email: '' }] })
      )
    })

    it('should handle content with no track (undefined)', () => {
      const mockContent = {
        identifier: 'c2', name: 'C2', track: undefined
      } as any

      httpClientSpy.post.mockReturnValue(of({ response: 'ok' }))
      service.shareContent(mockContent, [{ email: 'x@y.com' }], 'body', 'query').subscribe()
      expect(httpClientSpy.post).toHaveBeenCalled()
    })
  })
})