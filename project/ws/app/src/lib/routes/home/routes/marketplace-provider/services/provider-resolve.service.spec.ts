import { ProviderResolveService } from './provider-resolve.service'
import { MarketplaceService } from './marketplace.service'

describe('ProviderResolveService', () => {
  let service: ProviderResolveService
  let marketPlaceSvc: any

  const makeRoute = (params: { [key: string]: string } = {}, queryParams: { [key: string]: string } = {}): any => ({
    paramMap: { get: (key: string) => params[key] || null },
    queryParamMap: { get: (key: string) => queryParams[key] || null },
  })

  const createService = () => {
    marketPlaceSvc = {
      readRegisteredProviderDetails: jest.fn(() => ({ toPromise: () => Promise.resolve({ params: { status: 'success' } }) })),
      getProviderDetails: jest.fn(() => ({ toPromise: () => Promise.resolve({ params: { status: 'success' } }) })),
    }
    service = new ProviderResolveService(marketPlaceSvc as MarketplaceService)
  }

  beforeEach(() => {
    createService()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('resolve', () => {
    it('should return null data and error when partnerId is absent', async () => {
      const result = await service.resolve(makeRoute(), {} as any)
      expect(result).toEqual({ data: null, error: null })
      expect(marketPlaceSvc.readRegisteredProviderDetails).not.toHaveBeenCalled()
      expect(marketPlaceSvc.getProviderDetails).not.toHaveBeenCalled()
    })

    it('should read the id from queryParamMap and status from paramMap when paramMap.id is absent', async () => {
      const route = makeRoute({ status: 'PENDING' }, { id: '1' })
      const result = await service.resolve(route, {} as any)
      expect(marketPlaceSvc.readRegisteredProviderDetails).toHaveBeenCalledWith('1')
      expect(result).toEqual({ data: { params: { status: 'success' } }, error: null })
    })

    describe('when status is PENDING', () => {
      it('should return the response data when readRegisteredProviderDetails succeeds', async () => {
        const route = makeRoute({ id: '1', status: 'PENDING' })
        const result = await service.resolve(route, {} as any)
        expect(marketPlaceSvc.readRegisteredProviderDetails).toHaveBeenCalledWith('1')
        expect(result).toEqual({ data: { params: { status: 'success' } }, error: null })
      })

      it('should return the error message when the response status is not success', async () => {
        marketPlaceSvc.readRegisteredProviderDetails.mockReturnValue({
          toPromise: () => Promise.resolve({ params: { status: 'failed', errMsg: 'not found' } }),
        })
        const route = makeRoute({ id: '1', status: 'PENDING' })
        const result = await service.resolve(route, {} as any)
        expect(result).toEqual({ data: null, error: 'not found' })
      })

      it('should return the API error message when the call throws', async () => {
        marketPlaceSvc.readRegisteredProviderDetails.mockReturnValue({
          toPromise: () => Promise.reject({ error: { params: { errMsg: 'read failed' } } }),
        })
        const route = makeRoute({ id: '1', status: 'PENDING' })
        const result = await service.resolve(route, {} as any)
        expect(result).toEqual({ data: null, error: 'read failed' })
      })

      it('should return the default error message when the thrown error has no message', async () => {
        marketPlaceSvc.readRegisteredProviderDetails.mockReturnValue({
          toPromise: () => Promise.reject({}),
        })
        const route = makeRoute({ id: '1', status: 'PENDING' })
        const result = await service.resolve(route, {} as any)
        expect(result).toEqual({ data: null, error: 'Something went wrong, please try again later' })
      })
    })

    describe('when status is not PENDING', () => {
      it('should return the response data when getProviderDetails succeeds', async () => {
        const route = makeRoute({ id: '1' })
        const result = await service.resolve(route, {} as any)
        expect(marketPlaceSvc.getProviderDetails).toHaveBeenCalledWith('1')
        expect(result).toEqual({ data: { params: { status: 'success' } }, error: null })
      })

      it('should return the error message when the response status is not success', async () => {
        marketPlaceSvc.getProviderDetails.mockReturnValue({
          toPromise: () => Promise.resolve({ params: { status: 'failed', errMsg: 'not found' } }),
        })
        const route = makeRoute({ id: '1' })
        const result = await service.resolve(route, {} as any)
        expect(result).toEqual({ data: null, error: 'not found' })
      })

      it('should return the API error message when the call throws', async () => {
        marketPlaceSvc.getProviderDetails.mockReturnValue({
          toPromise: () => Promise.reject({ error: { params: { errMsg: 'get failed' } } }),
        })
        const route = makeRoute({ id: '1' })
        const result = await service.resolve(route, {} as any)
        expect(result).toEqual({ data: null, error: 'get failed' })
      })

      it('should return the default error message when the thrown error has no message', async () => {
        marketPlaceSvc.getProviderDetails.mockReturnValue({
          toPromise: () => Promise.reject({}),
        })
        const route = makeRoute({ id: '1' })
        const result = await service.resolve(route, {} as any)
        expect(result).toEqual({ data: null, error: 'Something went wrong, please try again later' })
      })
    })
  })
})
