import { of, throwError } from 'rxjs'
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router'
import { PositionsService } from '../services/position.service'
import { IPosition } from '../models/positions.model'
import { IResolveResponse } from '@sunbird-cb/utils'
import { PositionsApprovedResolve } from './positions-approved-resolver.services'

// Mock the PositionsService
jest.mock('../services/position.service')

describe('PositionsApprovedResolve', () => {
  let resolver: PositionsApprovedResolve
  let mockPositionsService: jest.Mocked<PositionsService>
  let mockRoute: ActivatedRouteSnapshot
  let mockState: RouterStateSnapshot

  beforeEach(() => {
    // Create mock instances
    mockPositionsService = {
      getPositionsList: jest.fn()
    } as any

    // Create resolver instance
    resolver = new PositionsApprovedResolve(mockPositionsService)

    // Create mock route and state objects
    mockRoute = {} as ActivatedRouteSnapshot
    mockState = {} as RouterStateSnapshot
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('resolve', () => {
    it('should be defined', () => {
      expect(resolver).toBeDefined()
    })

    it('should call positionsSvc.getPositionsList with correct parameters', () => {
      // Arrange
      const mockResponse = {
        result: {
          data: []
        }
      }
      mockPositionsService.getPositionsList.mockReturnValue(of(mockResponse))

      const expectedReqBody = {
        serviceName: 'position',
        applicationStatus: 'APPROVED',
        limit: 1000,
        offset: 0,
        deptName: 'iGOT'
      }

      // Act
      resolver.resolve(mockRoute, mockState).subscribe()

      // Assert
      expect(mockPositionsService.getPositionsList).toHaveBeenCalledWith(expectedReqBody)
      expect(mockPositionsService.getPositionsList).toHaveBeenCalledTimes(1)
    })

    it('should return formatted data when service call is successful', (done) => {
      // Arrange
      const mockPositions: IPosition[] = [
      ]

      const mockServiceResponse = {
        result: {
          data: mockPositions
        }
      }

      mockPositionsService.getPositionsList.mockReturnValue(of(mockServiceResponse))

      const expectedResponse: IResolveResponse<IPosition[]> = {
        data: mockPositions,
        error: null
      }

      // Act & Assert
      resolver.resolve(mockRoute, mockState).subscribe(response => {
        expect(response).toEqual(expectedResponse)
        expect(response.data).toBe(mockPositions)
        expect(response.error).toBeNull()
        done()
      })
    })

    it('should return error response when service call fails', (done) => {
      // Arrange
      const mockError = new Error('Service error')
      mockPositionsService.getPositionsList.mockReturnValue(throwError(mockError))

      const expectedResponse: IResolveResponse<IPosition[]> = {
        data: null,
        error: mockError
      }

      // Act & Assert
      resolver.resolve(mockRoute, mockState).subscribe(response => {
        expect(response).toEqual(expectedResponse)
        expect(response.data).toBeNull()
        expect(response.error).toBe(mockError)
        done()
      })
    })

    it('should handle empty data array from service', (done) => {
      // Arrange
      const mockServiceResponse = {
        result: {
          data: []
        }
      }

      mockPositionsService.getPositionsList.mockReturnValue(of(mockServiceResponse))

      const expectedResponse: IResolveResponse<IPosition[]> = {
        data: [],
        error: null
      }

      // Act & Assert
      resolver.resolve(mockRoute, mockState).subscribe(response => {
        expect(response).toEqual(expectedResponse)
        expect(response.data).toEqual([])
        expect(response.error).toBeNull()
        done()
      })
    })

    it('should handle network timeout error', (done) => {
      // Arrange
      const timeoutError = new Error('Timeout')
      timeoutError.name = 'TimeoutError'
      mockPositionsService.getPositionsList.mockReturnValue(throwError(timeoutError))

      // Act & Assert
      resolver.resolve(mockRoute, mockState).subscribe(response => {
        expect(response.data).toBeNull()
        expect(response.error).toBe(timeoutError)
        expect(response.error.name).toBe('TimeoutError')
        done()
      })
    })

    it('should handle HTTP error responses', (done) => {
      // Arrange
      const httpError = {
        status: 500,
        message: 'Internal Server Error'
      }
      mockPositionsService.getPositionsList.mockReturnValue(throwError(httpError))

      // Act & Assert
      resolver.resolve(mockRoute, mockState).subscribe(response => {
        expect(response.data).toBeNull()
        expect(response.error).toBe(httpError)
        expect(response.error.status).toBe(500)
        done()
      })
    })

    it('should not modify the original service response data', (done) => {
      // Arrange
      const originalData: IPosition[] = [
      ]

      const mockServiceResponse = {
        result: {
          data: originalData
        }
      }

      mockPositionsService.getPositionsList.mockReturnValue(of(mockServiceResponse))

      // Act & Assert
      resolver.resolve(mockRoute, mockState).subscribe(response => {
        expect(response.data).toBe(originalData) // Should be the same reference
        expect(mockServiceResponse.result.data).toBe(originalData) // Original should be unchanged
        done()
      })
    })
  })

  describe('constructor', () => {
    it('should inject PositionsService correctly', () => {
      const newResolver = new PositionsApprovedResolve(mockPositionsService)
      expect(newResolver).toBeDefined()
      expect(newResolver['positionsSvc']).toBe(mockPositionsService)
    })
  })
})