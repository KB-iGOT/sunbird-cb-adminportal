import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { FracService } from './frac.service'

describe('FracService', () => {
  let service: FracService

  const http: any = {
    get: jest.fn(),
  }

  const configSvc: Partial<ConfigurationsService> = {
    baseUrl: 'https://test.example.com',
  }

  beforeEach(() => {
    service = new FracService(configSvc as ConfigurationsService, http)
    jest.clearAllMocks()
  })

  it('should create an instance', () => {
    expect(service).toBeTruthy()
  })

  it('should fetch frac from correct URL using configSvc.baseUrl', async () => {
    const mockFrac = { fracData: { enabled: true } }
    http.get.mockReturnValue({ toPromise: () => Promise.resolve(mockFrac) })

    const result = await service.fetchFrac()

    expect(http.get).toHaveBeenCalledWith('https://test.example.com/feature/frac.json')
    expect(result).toEqual(mockFrac)
  })

  it('should return promise from fetchFrac', () => {
    http.get.mockReturnValue({ toPromise: () => Promise.resolve({}) })
    const result = service.fetchFrac()
    expect(result).toBeInstanceOf(Promise)
  })

  it('should propagate rejection from http.get on fetchFrac', async () => {
    const error = new Error('Network error')
    http.get.mockReturnValue({ toPromise: () => Promise.reject(error) })

    await expect(service.fetchFrac()).rejects.toThrow('Network error')
  })
})
