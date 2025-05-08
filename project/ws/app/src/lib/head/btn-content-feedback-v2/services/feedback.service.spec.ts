import { FeedbackService } from './feedback.service'
import { HttpClient } from '@angular/common/http'
import { of } from 'rxjs'
import {
  IFeedbackSearchQuery,
  IFeedback,
  IFeedbackThread,
  IFeedbackSearchResult,
  IFeedbackSummary,
  IFeedbackConfig,
  EFeedbackRole,
} from '../models/feedback.model'
import { EFeedbackType, NsContent } from '@sunbird-cb/collection'

describe('FeedbackService', () => {
  let service: FeedbackService
  let httpClientMock: jest.Mocked<HttpClient>

  beforeEach(() => {
    // Create mock for HttpClient
    httpClientMock = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
    } as unknown as jest.Mocked<HttpClient>

    // Initialize service with mocked dependencies
    service = new FeedbackService(httpClientMock)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('searchFeedback', () => {
    it('should call the correct endpoint with query', () => {
      // Arrange
      const mockQuery: IFeedbackSearchQuery = {
        query: 'test query',
        filters: {
          feedbackType: ['CONTENT'],
          status: ['OPEN']
        },
        viewedBy: 'user123',
        all: true,
        from: 0,
        size: 0
      }

      const mockResponse: IFeedbackSearchResult = {
        hits: 0,
        result: []
      }

      httpClientMock.post.mockReturnValue(of(mockResponse))

      // Act
      let result: IFeedbackSearchResult | undefined
      service.searchFeedback(mockQuery).subscribe(response => {
        result = response
      })

      // Assert
      expect(httpClientMock.post).toHaveBeenCalledWith(
        '/apis/protected/v8/user/feedbackV2/search',
        mockQuery
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getFeedbackThread', () => {
    it('should call the correct endpoint with feedbackId', () => {
      // Arrange
      const mockFeedbackId = 'feedback-123'
      const mockResponse: IFeedbackThread[] = [{
        feedbackId: 'feedback-123',
        assignedTo: {
          email: '',
          name: '',
          uuid: ''
        },
        category: '',
        contentDesc: '',
        contentId: '',
        contentTitle: '',
        contentType: NsContent.EContentTypes.PROGRAM,
        createdOn: new Date(),
        dimension: '',
        feedbackBy: {
          email: '',
          name: '',
          userId: ''
        },
        feedbackCategory: '',
        feedbackSentimentCategory: 'positive',
        feedbackSentimentValue: 0,
        feedbackText: '',
        feedbackType: EFeedbackType.Content,
        lastActivityOn: new Date(),
        lastUpdatedOn: new Date(),
        replied: false,
        rootFeedbackId: '',
        rootOrg: '',
        seenReply: false
      }]

      httpClientMock.get.mockReturnValue(of(mockResponse))

      // Act
      let result: IFeedbackThread[] | undefined
      service.getFeedbackThread(mockFeedbackId).subscribe(response => {
        result = response
      })

      // Assert
      expect(httpClientMock.get).toHaveBeenCalledWith(
        '/apis/protected/v8/user/feedbackV2/feedback-123'
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('submitPlatformFeedback', () => {
    it('should call the correct endpoint with feedback data', () => {
      // Arrange
      const mockFeedback: IFeedback = {
        role: EFeedbackRole.User,
        text: '',
        type: EFeedbackType.Content
      }

      const mockResponse = { success: true }
      httpClientMock.post.mockReturnValue(of(mockResponse))

      // Act
      let result: any
      service.submitPlatformFeedback(mockFeedback).subscribe(response => {
        result = response
      })

      // Assert
      expect(httpClientMock.post).toHaveBeenCalledWith(
        '/apis/protected/v8/user/feedbackV2/platform',
        mockFeedback
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('contentShareNew', () => {
    it('should call the correct endpoint with notification request', () => {
      // Arrange
      const mockRequest: any = {
        'event-id': 'platform_feedback',
        'tag-value-pair': undefined,
        recipients: undefined
      }

      const mockResponse = { success: true }
      httpClientMock.post.mockReturnValue(of(mockResponse))

      // Act
      let result: any
      service.contentShareNew(mockRequest).subscribe(response => {
        result = response
      })

      // Assert
      expect(httpClientMock.post).toHaveBeenCalledWith(
        '/apis/protected/v8/user/share/content',
        mockRequest
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('submitContentFeedback', () => {
    it('should call the correct endpoint with content feedback', () => {
      // Arrange
      const mockFeedback: IFeedback = {
        role: EFeedbackRole.User,
        text: '',
        type: EFeedbackType.Content
      }

      const mockResponse = { success: true }
      httpClientMock.post.mockReturnValue(of(mockResponse))

      // Act
      let result: any
      service.submitContentFeedback(mockFeedback).subscribe(response => {
        result = response
      })

      // Assert
      expect(httpClientMock.post).toHaveBeenCalledWith(
        '/apis/protected/v8/user/feedbackV2/content/content-123',
        mockFeedback
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('submitContentRequest', () => {
    it('should call the correct endpoint with content request', () => {
      // Arrange
      const mockFeedback: IFeedback = {
        role: EFeedbackRole.User,
        text: '',
        type: EFeedbackType.Content
      }

      const mockResponse = { success: true }
      httpClientMock.post.mockReturnValue(of(mockResponse))

      // Act
      let result: any
      service.submitContentRequest(mockFeedback).subscribe(response => {
        result = response
      })

      // Assert
      expect(httpClientMock.post).toHaveBeenCalledWith(
        '/apis/protected/v8/user/feedbackV2/content-request',
        mockFeedback
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('submitServiceRequest', () => {
    it('should call the correct endpoint with service request', () => {
      // Arrange
      const mockFeedback: IFeedback = {
        role: EFeedbackRole.User,
        text: '',
        type: EFeedbackType.Content
      }

      const mockResponse = { success: true }
      httpClientMock.post.mockReturnValue(of(mockResponse))

      // Act
      let result: any
      service.submitServiceRequest(mockFeedback).subscribe(response => {
        result = response
      })

      // Assert
      expect(httpClientMock.post).toHaveBeenCalledWith(
        '/apis/protected/v8/user/feedbackV2/service-request',
        mockFeedback
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getFeedbackSummary', () => {
    it('should call the correct endpoint for feedback summary', () => {
      // Arrange
      const mockResponse: IFeedbackSummary = {
        forActionCount: 0,
        roles: [],
        totalCount: 0
      }

      httpClientMock.get.mockReturnValue(of(mockResponse))

      // Act
      let result: IFeedbackSummary | undefined
      service.getFeedbackSummary().subscribe(response => {
        result = response
      })

      // Assert
      expect(httpClientMock.get).toHaveBeenCalledWith(
        '/apis/protected/v8/user/feedbackV2/feedback-summary'
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('updateFeedbackStatus', () => {
    it('should call the correct endpoint without category', () => {
      // Arrange
      const mockFeedbackId = 'feedback-123'
      const mockResponse: IFeedbackThread = {
        assignedTo: {
          email: '',
          name: '',
          uuid: ''
        },
        category: '',
        contentDesc: '',
        contentId: '',
        contentTitle: '',
        contentType: NsContent.EContentTypes.PROGRAM,
        createdOn: new Date(),
        dimension: '',
        feedbackBy: {
          email: '',
          name: '',
          userId: ''
        },
        feedbackCategory: '',
        feedbackId: '',
        feedbackSentimentCategory: 'positive',
        feedbackSentimentValue: 0,
        feedbackText: '',
        feedbackType: EFeedbackType.Content,
        lastActivityOn: new Date(),
        lastUpdatedOn: new Date(),
        replied: false,
        rootFeedbackId: '',
        rootOrg: '',
        seenReply: false
      }

      httpClientMock.patch.mockReturnValue(of(mockResponse))

      // Act
      let result: IFeedbackThread | undefined
      service.updateFeedbackStatus(mockFeedbackId).subscribe(response => {
        result = response
      })

      // Assert
      expect(httpClientMock.patch).toHaveBeenCalledWith(
        '/apis/protected/v8/user/feedbackV2/feedback-123',
        {}
      )
      expect(result).toEqual(mockResponse)
    })

    it('should call the correct endpoint with category', () => {
      // Arrange
      const mockFeedbackId = 'feedback-123'
      const mockCategory = 'bug'
      const mockResponse: IFeedbackThread = {
        assignedTo: {
          email: '',
          name: '',
          uuid: ''
        },
        category: '',
        contentDesc: '',
        contentId: '',
        contentTitle: '',
        contentType: NsContent.EContentTypes.PROGRAM,
        createdOn: new Date(),
        dimension: '',
        feedbackBy: {
          email: '',
          name: '',
          userId: ''
        },
        feedbackCategory: '',
        feedbackId: '',
        feedbackSentimentCategory: 'positive',
        feedbackSentimentValue: 0,
        feedbackText: '',
        feedbackType: EFeedbackType.Content,
        lastActivityOn: new Date(),
        lastUpdatedOn: new Date(),
        replied: false,
        rootFeedbackId: '',
        rootOrg: '',
        seenReply: false
      }

      httpClientMock.patch.mockReturnValue(of(mockResponse))

      // Act
      let result: IFeedbackThread | undefined
      service.updateFeedbackStatus(mockFeedbackId, mockCategory).subscribe(response => {
        result = response
      })

      // Assert
      expect(httpClientMock.patch).toHaveBeenCalledWith(
        '/apis/protected/v8/user/feedbackV2/feedback-123?category=bug',
        {}
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getFeedbackConfig', () => {
    it('should call the correct endpoint for feedback config', () => {
      // Arrange
      const mockResponse: IFeedbackConfig = {
        feedbackCategories: [],
        feedbackSentimentMode: false
      }

      httpClientMock.get.mockReturnValue(of(mockResponse))

      // Act
      let result: IFeedbackConfig | undefined
      service.getFeedbackConfig().subscribe(response => {
        result = response
      })

      // Assert
      expect(httpClientMock.get).toHaveBeenCalledWith(
        '/apis/protected/v8/user/feedbackV2/config'
      )
      expect(result).toEqual(mockResponse)
    })
  })
})