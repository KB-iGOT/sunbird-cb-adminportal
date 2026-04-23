import { GlobalErrorHandlingService } from './global-error-handling.service'

describe('GlobalErrorHandlingService', () => {
  let service: GlobalErrorHandlingService

  beforeEach(() => {
    service = new GlobalErrorHandlingService()
    // Use defineProperty to override window.location.reload without type errors
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload: jest.fn() },
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should reload the page when ChunkLoadError occurs', () => {
    const chunkError = new Error('ChunkLoadError: Failed to load chunk')
    service.handleError(chunkError)
    expect(window.location.reload).toHaveBeenCalled()
  })

  it('should rethrow the error when it is not a ChunkLoadError', () => {
    const regularError = new Error('Some other error')
    expect(() => {
      service.handleError(regularError)
    }).toThrow('Some other error')
  })

  it('should handle non-ChunkLoadError errors by rethrowing', () => {
    const networkError = new Error('NetworkError: fetch failed')
    expect(() => service.handleError(networkError)).toThrow()
  })
})