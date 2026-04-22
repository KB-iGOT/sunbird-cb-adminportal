import { GlobalEventsService } from './global-events.service'

const mockIconRegistry = {
  addSvgIcon: jest.fn(),
}

const mockDomSanitizer = {
  bypassSecurityTrustResourceUrl: jest.fn().mockImplementation((url: string) => `safe:${url}`),
}

function createService(): GlobalEventsService {
  return new GlobalEventsService(mockIconRegistry as any, mockDomSanitizer as any)
}

describe('GlobalEventsService', () => {
  let service: GlobalEventsService

  beforeEach(() => {
    jest.clearAllMocks()
    service = createService()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should register SVG icons on construction', () => {
    expect(mockIconRegistry.addSvgIcon).toHaveBeenCalledWith('frac', expect.anything())
    expect(mockIconRegistry.addSvgIcon).toHaveBeenCalledWith('users', expect.anything())
    expect(mockIconRegistry.addSvgIcon).toHaveBeenCalledWith('frac-no-connection', expect.anything())
    expect(mockIconRegistry.addSvgIcon).toHaveBeenCalledWith('download-icon', expect.anything())
  })

  it('should sanitize SVG icon URLs', () => {
    expect(mockDomSanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith('assets/icons/Frac.svg')
    expect(mockDomSanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith('assets/icons/users.svg')
    expect(mockDomSanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith('assets/icons/Frac_NoConnection.svg')
    expect(mockDomSanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith('assets/icons/download_icon.svg')
  })

  it('should expose loaderState$ observable', () => {
    expect(service.loaderState$).toBeDefined()
  })

  describe('setLoaderState', () => {
    it('should emit true via loaderState$', (done) => {
      service.loaderState$.subscribe(val => {
        expect(val).toBe(true)
        done()
      })
      service.setLoaderState(true)
    })

    it('should emit false via loaderState$', (done) => {
      service.loaderState$.subscribe(val => {
        expect(val).toBe(false)
        done()
      })
      service.setLoaderState(false)
    })

    it('should emit multiple values in sequence', () => {
      const emitted: boolean[] = []
      service.loaderState$.subscribe(val => emitted.push(val))
      service.setLoaderState(true)
      service.setLoaderState(false)
      service.setLoaderState(true)
      expect(emitted).toEqual([true, false, true])
    })
  })
})
