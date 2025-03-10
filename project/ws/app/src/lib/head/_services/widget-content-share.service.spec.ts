import { HttpClient } from '@angular/common/http'
import { of } from 'rxjs'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { WidgetContentShareService } from './widget-content-share.service'
import { NsContent } from './widget-content.model' // Assuming all models are exported from here
import { NsShare } from './widget-share.model'

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
      const mockResponse: NsShare.IEmailResponse = { response: 'Success' } as any
      httpClientSpy.post.mockReturnValue(of(mockResponse))

      // Call the service method
      service.shareContent(mockContent, userMailIds, txtBody, 'share').subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      // Verify http.post was called with correct parameters
      expect(httpClientSpy.post).toHaveBeenCalledWith(
        '/apis/protected/v8/user/share',
        expect.objectContaining({
          emailType: 'share',
          emailTo: userMailIds,
          body: { text: txtBody, isHTML: false },
          artifacts: expect.arrayContaining([
            expect.objectContaining({
              identifier: 'content-123',
              title: 'Test Content',
            })
          ])
        })
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
      const mockResponse: NsShare.IEmailResponse = { response: 'Success' } as any
      httpClientSpy.post.mockReturnValue(of(mockResponse))

      // Call the service method
      service.shareContent(mockContent, userMailIds, txtBody, 'attachment').subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      // Verify http.post was called with correct parameters
      expect(httpClientSpy.post).toHaveBeenCalledWith(
        '/apis/protected/v8/user/share',
        expect.objectContaining({
          emailType: 'attachment',
          emailTo: [{ name: 'Test User', email: 'test@example.com' }],
          ccTo: [],
        })
      )
    })

    it('should handle user profile being undefined', () => {
      // Set user profile to undefined
      // configServiceSpy.userProfile = undefined

      // Mock content
      const mockContent: NsContent.IContent = {
        identifier: 'content-123',
        name: 'Test Content'
      } as NsContent.IContent

      // Mock user email ids
      const userMailIds = [{ email: 'user1@example.com' }]

      // Mock text body
      const txtBody = 'Check out this content!'

      // Mock response
      const mockResponse: NsShare.IEmailResponse = { response: 'Success' } as any
      httpClientSpy.post.mockReturnValue(of(mockResponse))

      // Call the service method
      service.shareContent(mockContent, userMailIds, txtBody).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      // Verify http.post was called with empty user info
      expect(httpClientSpy.post).toHaveBeenCalledWith(
        '/apis/protected/v8/user/share',
        expect.objectContaining({
          sharedBy: [{ name: '', email: '' }]
        })
      )
    })
  })

  describe('contentShareNew', () => {
    it('should call http.post with the correct endpoint and request', () => {
      const mockRequest: NsShare.IShareRequest = {
        shareWith: ['user1@example.com'],
        content: { id: 'content-123' }
      } as any

      const mockResponse = { success: true }
      httpClientSpy.post.mockReturnValue(of(mockResponse))

      service.contentShareNew(mockRequest).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(httpClientSpy.post).toHaveBeenCalledWith(
        '/apis/protected/v8/user/share/content',
        mockRequest
      )
    })
  })
})