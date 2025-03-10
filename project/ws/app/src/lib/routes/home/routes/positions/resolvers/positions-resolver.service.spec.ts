import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router'
import { of, throwError } from 'rxjs'

import { PositionsService } from '../services/position.service'
import { PositionsApprovedResolve } from './positions-approved-resolver.services'

// Mock of IPosition interface
interface IPosition {
  // Add properties as needed
  id: string
  name: string
}

describe('PositionsApprovedResolve', () => {
  let resolver: PositionsApprovedResolve
  let positionServiceMock: jest.Mocked<PositionsService>

  // Mock route and state
  const mockRoute = {} as ActivatedRouteSnapshot
  const mockState = {} as RouterStateSnapshot

  beforeEach(() => {
    // Create a mock for PositionsService
    positionServiceMock = {
      getPositionsList: jest.fn()
    } as unknown as jest.Mocked<PositionsService>

    // Initialize the resolver with the mock service
    resolver = new PositionsApprovedResolve(positionServiceMock)
  })

  it('should be created', () => {
    expect(resolver).toBeTruthy()
  })

  it('should resolve positions successfully', (done) => {
    // Mock successful response
    const mockResponse = {
      result: {
        data: [
          { id: '1', name: 'Position 1' },
          { id: '2', name: 'Position 2' }
        ] as IPosition[]
      }
    }

    positionServiceMock.getPositionsList.mockReturnValue(of(mockResponse))

    // Expected output based on the resolve method implementation
    const expectedResponse = {
      data: mockResponse.result.data,
      error: null
    }

    // Call the resolve method
    resolver.resolve(mockRoute, mockState).subscribe((response: any) => {
      expect(response).toEqual(expectedResponse)
      expect(positionServiceMock.getPositionsList).toHaveBeenCalledWith({
        serviceName: 'position',
        applicationStatus: 'APPROVED',
        limit: 1000,
        offset: 0,
        deptName: 'iGOT',
      })
      done()
    })
  })

  it('should handle error when position service fails', (done) => {
    // Mock error
    const mockError = new Error('Service failed')

    positionServiceMock.getPositionsList.mockReturnValue(throwError(mockError))

    // Expected output based on error handling in the resolve method
    const expectedResponse = {
      data: null,
      error: mockError
    }

    // Call the resolve method
    resolver.resolve(mockRoute, mockState).subscribe((response: any) => {
      expect(response).toEqual(expectedResponse)
      expect(positionServiceMock.getPositionsList).toHaveBeenCalled()
      done()
    })
  })
})