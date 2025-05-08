// positions.resolve.spec.ts

import { PositionsService } from '../services/position.service'
import { of, throwError } from 'rxjs'
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router'
import { PositionsResolve } from './positions-resolver.service'

// Mock PositionsService
jest.mock('../services/position.service')

describe('PositionsResolve', () => {
  let resolver: PositionsResolve
  let positionsService: jest.Mocked<PositionsService>

  // Mock route and state
  const mockRoute = {} as ActivatedRouteSnapshot
  const mockState = {} as RouterStateSnapshot

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()

    // Create a mock of PositionsService
    positionsService = {
      getPositionsList: jest.fn()
    } as unknown as jest.Mocked<PositionsService>

    // Initialize resolver with mock service
    resolver = new PositionsResolve(positionsService)
  })

  it('should be created', () => {
    expect(resolver).toBeTruthy()
  })

  it('should resolve positions data successfully', (done) => {
    // Mock successful response
    const mockResponse = {
      result: {
        data: [{ id: '1', name: 'Position 1' }, { id: '2', name: 'Position 2' }]
      }
    }

    positionsService.getPositionsList.mockReturnValue(of(mockResponse))

    // Expected request body
    const expectedReqBody = {
      serviceName: 'position',
      applicationStatus: 'IN_PROGRESS',
      limit: 1000,
      offset: 0,
      deptName: 'iGOT'
    }

    // Call the resolver
    const result = resolver.resolve(mockRoute, mockState)

    // Subscribe to the observable and verify the result
    result.subscribe(response => {
      // Check if service was called with correct parameters
      expect(positionsService.getPositionsList).toHaveBeenCalledWith(expectedReqBody)

      // Check if response is transformed correctly
      expect(response).toEqual({
        data: mockResponse.result.data,
        error: null
      })
      done()
    })
  })

  it('should handle error when positions service fails', (done) => {
    // Mock error response
    const mockError = new Error('Service failed')
    positionsService.getPositionsList.mockReturnValue(throwError(mockError))

    // Call the resolver
    const result = resolver.resolve(mockRoute, mockState)

    // Subscribe to the observable and verify error handling
    result.subscribe((response: any) => {
      // Check if service was called
      expect(positionsService.getPositionsList).toHaveBeenCalled()

      // Check if error is handled correctly
      expect(response).toEqual({
        data: null,
        error: mockError
      })
      done()
    })
  })
})