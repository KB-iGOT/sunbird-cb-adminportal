// positions.service.spec.ts

import { HttpClient } from '@angular/common/http'
import { of } from 'rxjs'
import { PositionsService } from './position.service'

describe('PositionsService', () => {
  let service: PositionsService
  let httpClientMock: jest.Mocked<HttpClient>

  beforeEach(() => {
    // Create a mock for HttpClient
    httpClientMock = {
      post: jest.fn(),
    } as unknown as jest.Mocked<HttpClient>

    // Instantiate the service with the mock
    service = new PositionsService(httpClientMock)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('getPositionsList', () => {
    it('should call the correct API endpoint with request body', () => {
      // Arrange
      const mockRequest = { key: 'value' }
      const mockResponse = { data: [{ id: 1, name: 'Position 1' }] }
      httpClientMock.post.mockReturnValue(of(mockResponse))

      // Act
      let result: any
      service.getPositionsList(mockRequest).subscribe((response: any) => {
        result = response
      })

      // Assert
      expect(httpClientMock.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/workflow/position/search',
        mockRequest
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('approveNewPosition', () => {
    it('should call the correct API endpoint with position data', () => {
      // Arrange
      const mockPositionData = { positionId: 123, status: 'APPROVED' }
      const mockResponse = { success: true }
      httpClientMock.post.mockReturnValue(of(mockResponse))

      // Act
      let result: any
      service.approveNewPosition(mockPositionData).subscribe((response: any) => {
        result = response
      })

      // Assert
      expect(httpClientMock.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/workflow/position/update',
        mockPositionData
      )
      expect(result).toEqual(mockResponse)
    })
  })
})