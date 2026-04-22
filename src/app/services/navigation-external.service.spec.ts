import { NavigationExternalService } from './navigation-external.service'

const mockRouter = {
  url: '/current/path',
  navigate: jest.fn(),
}

function createService(): NavigationExternalService {
  return new NavigationExternalService(mockRouter as any)
}

describe('NavigationExternalService', () => {
  let service: NavigationExternalService

  beforeEach(() => {
    jest.clearAllMocks()
    mockRouter.url = '/current/path'
    service = createService()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should expose breadcrumnItems BehaviorSubject', () => {
    expect(service.breadcrumnItems).toBeDefined()
  })

  describe('init', () => {
    it('should increment dummy by 1', () => {
      const before = service.dummy
      service.init()
      expect(service.dummy).toBe(before + 1)
    })
  })

  describe('navigateTo', () => {
    it('should call router.navigate with the given url and default params', () => {
      service.navigateTo('/some/url')
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/some/url'],
        expect.objectContaining({ queryParams: expect.objectContaining({ ref: expect.any(String) }) })
      )
    })

    it('should encode the current router url as ref when no params provided', () => {
      mockRouter.url = '/home/dashboard'
      service.navigateTo('/target')
      const call = mockRouter.navigate.mock.calls[0]
      expect(call[1].queryParams.ref).toBeDefined()
    })

    it('should merge provided params and set ref', () => {
      service.navigateTo('/target', { key: 'value' })
      const call = mockRouter.navigate.mock.calls[0]
      expect(call[1].queryParams.key).toBe('value')
      expect(call[1].queryParams.ref).toBeDefined()
    })

    it('should encode existing ref from params', () => {
      service.navigateTo('/target', { ref: 'my-ref' })
      const call = mockRouter.navigate.mock.calls[0]
      expect(call[1].queryParams.ref).toBe(encodeURIComponent('my-ref'))
    })

    it('should navigate to the correct url', () => {
      service.navigateTo('/learn/course')
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/learn/course'], expect.anything())
    })
  })
})
