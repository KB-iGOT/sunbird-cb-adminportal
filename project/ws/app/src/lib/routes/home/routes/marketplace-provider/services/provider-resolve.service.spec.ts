import { ProviderResolveService } from './provider-resolve.service'
import { MarketplaceService } from './marketplace.service'
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router'
import { of, throwError } from 'rxjs'
import * as _ from 'lodash'

// Mock the MarketplaceService
jest.mock('./marketplace.service')

describe('ProviderResolveService', () => {
  let service: ProviderResolveService
  let mockMarketplaceService: jest.Mocked<MarketplaceService>
  let mockRoute: Partial<ActivatedRouteSnapshot>
  let mockState: Partial<RouterStateSnapshot>
  let mockParamMapGet: jest.Mock

  beforeEach(() => {
    // Create mock for paramMap.get
    mockParamMapGet = jest.fn()

    // Create mock instances
    mockMarketplaceService = {
      getProviderDetails: jest.fn()
    } as any

    mockRoute = {
      paramMap: {
        get: mockParamMapGet
      }
    } as any

    mockState = {} as Partial<RouterStateSnapshot>

    // Create service instance with mocked dependencies
    service = new ProviderResolveService(mockMarketplaceService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('resolve', () => {
    it('should return success response when partnerId exists and API call succeeds', async () => {
      // Arrange
      const partnerId = 'test-partner-123'
      const mockProviderData = {
        id: partnerId,
        name: 'Test Provider',
        description: 'Test Description'
      }

      mockParamMapGet.mockReturnValue(partnerId)
      mockMarketplaceService.getProviderDetails.mockReturnValue(
        of(mockProviderData)
      )

      // Act
      const result = await service.resolve(mockRoute as ActivatedRouteSnapshot, mockState as RouterStateSnapshot)

      // Assert
      expect(mockParamMapGet).toHaveBeenCalledWith('id')
      expect(mockMarketplaceService.getProviderDetails).toHaveBeenCalledWith(partnerId)
      expect(result).toEqual({
        data: mockProviderData,
        error: null
      })
    })

    it('should return error response when partnerId exists but API call fails with error message', async () => {
      // Arrange
      const partnerId = 'test-partner-123'
      const errorMessage = 'Provider not found'
      const mockError = {
        error: {
          params: {
            errMsg: errorMessage
          }
        }
      }

      mockParamMapGet.mockReturnValue(partnerId)
      mockMarketplaceService.getProviderDetails.mockReturnValue(
        throwError(mockError)
      )

      // Act
      const result = await service.resolve(mockRoute as ActivatedRouteSnapshot, mockState as RouterStateSnapshot)

      // Assert
      expect(mockParamMapGet).toHaveBeenCalledWith('id')
      expect(mockMarketplaceService.getProviderDetails).toHaveBeenCalledWith(partnerId)
      expect(result).toEqual({
        data: null,
        error: errorMessage
      })
    })

    it('should return default error message when API call fails without specific error message', async () => {
      // Arrange
      const partnerId = 'test-partner-123'
      const mockError = {
        error: {
          message: 'Network error'
        }
      }

      mockParamMapGet.mockReturnValue(partnerId)
      mockMarketplaceService.getProviderDetails.mockReturnValue(
        throwError(mockError)
      )

      // Act
      const result = await service.resolve(mockRoute as ActivatedRouteSnapshot, mockState as RouterStateSnapshot)

      // Assert
      expect(mockParamMapGet).toHaveBeenCalledWith('id')
      expect(mockMarketplaceService.getProviderDetails).toHaveBeenCalledWith(partnerId)
      expect(result).toEqual({
        data: null,
        error: 'Something went worng, please try again later'
      })
    })

    it('should return default error message when API call fails with empty error object', async () => {
      // Arrange
      const partnerId = 'test-partner-123'
      const mockError = {}

      mockParamMapGet.mockReturnValue(partnerId)
      mockMarketplaceService.getProviderDetails.mockReturnValue(
        throwError(mockError)
      )

      // Act
      const result = await service.resolve(mockRoute as ActivatedRouteSnapshot, mockState as RouterStateSnapshot)

      // Assert
      expect(result).toEqual({
        data: null,
        error: 'Something went worng, please try again later'
      })
    })

    it('should return null data and error when partnerId is null', async () => {
      // Arrange
      mockParamMapGet.mockReturnValue(null)

      // Act
      const result = await service.resolve(mockRoute as ActivatedRouteSnapshot, mockState as RouterStateSnapshot)

      // Assert
      expect(mockParamMapGet).toHaveBeenCalledWith('id')
      expect(mockMarketplaceService.getProviderDetails).not.toHaveBeenCalled()
      expect(result).toEqual({
        data: null,
        error: null
      })
    })

    it('should return null data and error when partnerId is undefined', async () => {
      // Arrange
      mockParamMapGet.mockReturnValue(undefined)

      // Act
      const result = await service.resolve(mockRoute as ActivatedRouteSnapshot, mockState as RouterStateSnapshot)

      // Assert
      expect(mockParamMapGet).toHaveBeenCalledWith('id')
      expect(mockMarketplaceService.getProviderDetails).not.toHaveBeenCalled()
      expect(result).toEqual({
        data: null,
        error: null
      })
    })

    it('should return null data and error when partnerId is empty string', async () => {
      // Arrange
      mockParamMapGet.mockReturnValue('')

      // Act
      const result = await service.resolve(mockRoute as ActivatedRouteSnapshot, mockState as RouterStateSnapshot)

      // Assert
      expect(mockParamMapGet).toHaveBeenCalledWith('id')
      expect(mockMarketplaceService.getProviderDetails).not.toHaveBeenCalled()
      expect(result).toEqual({
        data: null,
        error: null
      })
    })

    it('should handle API response with null data', async () => {
      // Arrange
      const partnerId = 'test-partner-123'

      mockParamMapGet.mockReturnValue(partnerId)
      // mockMarketplaceService.getProviderDetails.mockReturnValue(
      //   of(null)
      // )

      // Act
      const result = await service.resolve(mockRoute as ActivatedRouteSnapshot, mockState as RouterStateSnapshot)

      // Assert
      expect(result).toEqual({
        data: null,
        error: null
      })
    })

    it('should handle unexpected error types', async () => {
      // Arrange
      const partnerId = 'test-partner-123'
      const stringError = 'String error message'

      mockParamMapGet.mockReturnValue(partnerId)
      mockMarketplaceService.getProviderDetails.mockReturnValue(
        throwError(stringError)
      )

      // Act
      const result = await service.resolve(mockRoute as ActivatedRouteSnapshot, mockState as RouterStateSnapshot)

      // Assert
      expect(result).toEqual({
        data: null,
        error: 'Something went worng, please try again later'
      })
    })
  })

  describe('dependency injection', () => {
    it('should be created with MarketplaceService dependency', () => {
      expect(service).toBeDefined()
      expect(service['marketPlaceSvc']).toBeDefined()
    })
  })
})