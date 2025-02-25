
import { HttpClient } from '@angular/common/http'
import { of } from 'rxjs'
import { SurveyApiService } from './survey-api.service'

// Mock HttpClient class
const mockHttpClient = {
  post: jest.fn(),
} as unknown as HttpClient

describe('SurveyApiService', () => {
  let service: SurveyApiService

  beforeEach(() => {
    // Reset mock between tests
    jest.clearAllMocks()

    // Create service with mocked HttpClient
    service = new SurveyApiService(mockHttpClient)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('getSurveyResults', () => {
    it('should call the correct API endpoint with provided request data', () => {
      // Arrange
      const mockRequest = { userId: '123', page: 1 }
      const mockResponse = { results: ['survey1', 'survey2'] };

      // Setup mock to return observable of mock response
      (mockHttpClient.post as jest.Mock).mockReturnValue(of(mockResponse))

      // Act
      let result: any
      service.getSurveyResults(mockRequest).subscribe((response: any) => {
        result = response
      })

      // Assert
      expect(mockHttpClient.post).toHaveBeenCalledTimes(1)
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/template/api/v1/survey/getSolutions',
        mockRequest
      )
      expect(result).toEqual(mockResponse)
    })

    it('should return an Observable with the HttpClient response', () => {
      // Arrange
      const mockRequest = { userId: '456' }
      const mockResponse = { results: [] };

      // Setup mock return value
      (mockHttpClient.post as jest.Mock).mockReturnValue(of(mockResponse))

      // Act & Assert
      service.getSurveyResults(mockRequest).subscribe((response: any) => {
        expect(response).toBe(mockResponse)
      })
    })

    it('should pass different request objects correctly', () => {
      // Arrange
      const mockRequest1 = { filter: { status: 'active' } }
      const mockRequest2 = { filter: { status: 'completed' } };

      (mockHttpClient.post as jest.Mock).mockReturnValue(of({}))

      // Act
      service.getSurveyResults(mockRequest1).subscribe()
      service.getSurveyResults(mockRequest2).subscribe()

      // Assert
      expect(mockHttpClient.post).toHaveBeenNthCalledWith(
        1,
        '/apis/proxies/v8/template/api/v1/survey/getSolutions',
        mockRequest1
      )
      expect(mockHttpClient.post).toHaveBeenNthCalledWith(
        2,
        '/apis/proxies/v8/template/api/v1/survey/getSolutions',
        mockRequest2
      )
    })
  })
})