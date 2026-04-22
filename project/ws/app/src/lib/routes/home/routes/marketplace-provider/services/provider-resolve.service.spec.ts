import { ProviderResolveService } from './provider-resolve.service'
import { MarketplaceService } from './marketplace.service'
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router'
import { of, throwError } from 'rxjs'

describe('ProviderResolveService', () => {
  let service: ProviderResolveService
  let mockMarketplaceService: jest.Mocked<Partial<MarketplaceService>>
  let mockRoute: any
  let mockState: Partial<RouterStateSnapshot>
  let mockParamMapGet: jest.Mock
  let mockQueryParamMapGet: jest.Mock

  beforeEach(() => {
    mockParamMapGet = jest.fn().mockReturnValue(null)
    mockQueryParamMapGet = jest.fn().mockReturnValue(null)

    mockMarketplaceService = {
      getProviderDetails: jest.fn(),
      readRegisteredProviderDetails: jest.fn(),
    }

    mockRoute = {
      paramMap: { get: mockParamMapGet },
      queryParamMap: { get: mockQueryParamMapGet },
    }

    mockState = {}

    service = new ProviderResolveService(mockMarketplaceService as MarketplaceService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should create an instance of the service', () => {
    expect(service).toBeDefined()
  })

  describe('resolve – no partnerId', () => {
    it('should return { data: null, error: null } when paramMap and queryParamMap return null', async () => {
      mockParamMapGet.mockReturnValue(null)
      mockQueryParamMapGet.mockReturnValue(null)

      const result = await service.resolve(mockRoute as ActivatedRouteSnapshot, mockState as RouterStateSnapshot)

      expect(result).toEqual({ data: null, error: null })
      expect(mockMarketplaceService.getProviderDetails).not.toHaveBeenCalled()
      expect(mockMarketplaceService.readRegisteredProviderDetails).not.toHaveBeenCalled()
    })

    it('should return { data: null, error: null } when partnerId is empty string', async () => {
      mockParamMapGet.mockReturnValue('')
      mockQueryParamMapGet.mockReturnValue(null)

      const result = await service.resolve(mockRoute as ActivatedRouteSnapshot, mockState as RouterStateSnapshot)

      expect(result).toEqual({ data: null, error: null })
    })
  })

  describe('resolve – regular provider (non-PENDING)', () => {
    const partnerId = 'partner-abc'

    beforeEach(() => {
      mockParamMapGet.mockImplementation((key: string) => key === 'id' ? partnerId : null)
      mockQueryParamMapGet.mockReturnValue(null)
    })

    it('should return data on success with params.status === success', async () => {
      const mockResponse = { params: { status: 'success' }, result: { name: 'Provider' } }
        ; (mockMarketplaceService.getProviderDetails as jest.Mock).mockReturnValue(of(mockResponse))

      const result = await service.resolve(mockRoute as ActivatedRouteSnapshot, mockState as RouterStateSnapshot)

      expect(mockMarketplaceService.getProviderDetails).toHaveBeenCalledWith(partnerId)
      expect(result).toEqual({ data: mockResponse, error: null })
    })

    it('should return errMsg when response params.status is not success', async () => {
      const mockResponse = { params: { status: 'failed', errMsg: 'Not found' } }
        ; (mockMarketplaceService.getProviderDetails as jest.Mock).mockReturnValue(of(mockResponse))

      const result = await service.resolve(mockRoute as ActivatedRouteSnapshot, mockState as RouterStateSnapshot)

      expect(result).toEqual({ data: null, error: 'Not found' })
    })

    it('should return specific errMsg from error object on API failure', async () => {
      const mockError = { error: { params: { errMsg: 'Server error' } } }
        ; (mockMarketplaceService.getProviderDetails as jest.Mock).mockReturnValue(throwError(mockError))

      const result = await service.resolve(mockRoute as ActivatedRouteSnapshot, mockState as RouterStateSnapshot)

      expect(result).toEqual({ data: null, error: 'Server error' })
    })

    it('should return default error message when error has no errMsg', async () => {
      const mockError = { error: { message: 'Network error' } }
        ; (mockMarketplaceService.getProviderDetails as jest.Mock).mockReturnValue(throwError(mockError))

      const result = await service.resolve(mockRoute as ActivatedRouteSnapshot, mockState as RouterStateSnapshot)

      expect(result).toEqual({ data: null, error: 'Something went wrong, please try again later' })
    })

    it('should return default error message when error object is empty', async () => {
      ; (mockMarketplaceService.getProviderDetails as jest.Mock).mockReturnValue(throwError({}))

      const result = await service.resolve(mockRoute as ActivatedRouteSnapshot, mockState as RouterStateSnapshot)

      expect(result).toEqual({ data: null, error: 'Something went wrong, please try again later' })
    })

    it('should use queryParamMap id when paramMap id is null', async () => {
      mockParamMapGet.mockReturnValue(null)
      mockQueryParamMapGet.mockImplementation((key: string) => key === 'id' ? partnerId : null)
      const mockResponse = { params: { status: 'success' } }
        ; (mockMarketplaceService.getProviderDetails as jest.Mock).mockReturnValue(of(mockResponse))

      const result = await service.resolve(mockRoute as ActivatedRouteSnapshot, mockState as RouterStateSnapshot)

      expect(mockMarketplaceService.getProviderDetails).toHaveBeenCalledWith(partnerId)
      expect(result).toEqual({ data: mockResponse, error: null })
    })
  })

  describe('resolve – PENDING status', () => {
    const partnerId = 'partner-pending'

    beforeEach(() => {
      mockParamMapGet.mockImplementation((key: string) => key === 'id' ? partnerId : null)
      mockQueryParamMapGet.mockImplementation((key: string) => key === 'status' ? 'PENDING' : null)
    })

    it('should call readRegisteredProviderDetails for PENDING status success', async () => {
      const mockResponse = { params: { status: 'success' }, result: { name: 'Pending Provider' } }
        ; (mockMarketplaceService.readRegisteredProviderDetails as jest.Mock).mockReturnValue(of(mockResponse))

      const result = await service.resolve(mockRoute as ActivatedRouteSnapshot, mockState as RouterStateSnapshot)

      expect(mockMarketplaceService.readRegisteredProviderDetails).toHaveBeenCalledWith(partnerId)
      expect(mockMarketplaceService.getProviderDetails).not.toHaveBeenCalled()
      expect(result).toEqual({ data: mockResponse, error: null })
    })

    it('should return errMsg when PENDING response params.status is not success', async () => {
      const mockResponse = { params: { status: 'failed', errMsg: 'Pending error' } }
        ; (mockMarketplaceService.readRegisteredProviderDetails as jest.Mock).mockReturnValue(of(mockResponse))

      const result = await service.resolve(mockRoute as ActivatedRouteSnapshot, mockState as RouterStateSnapshot)

      expect(result).toEqual({ data: null, error: 'Pending error' })
    })

    it('should return specific errMsg from error object on PENDING API failure', async () => {
      const mockError = { error: { params: { errMsg: 'PENDING server error' } } }
        ; (mockMarketplaceService.readRegisteredProviderDetails as jest.Mock).mockReturnValue(throwError(mockError))

      const result = await service.resolve(mockRoute as ActivatedRouteSnapshot, mockState as RouterStateSnapshot)

      expect(result).toEqual({ data: null, error: 'PENDING server error' })
    })

    it('should return default error message on PENDING API failure without errMsg', async () => {
      ; (mockMarketplaceService.readRegisteredProviderDetails as jest.Mock).mockReturnValue(throwError({}))

      const result = await service.resolve(mockRoute as ActivatedRouteSnapshot, mockState as RouterStateSnapshot)

      expect(result).toEqual({ data: null, error: 'Something went wrong, please try again later' })
    })
  })
})