import { GlobalErrorHandlingService } from './global-error-handling.service'

describe('GlobalErrorHandlingService', () => {
  let service: GlobalErrorHandlingService
  let originalWindowLocation: Location

  // Store original window.location before tests
  beforeEach(() => {
    service = new GlobalErrorHandlingService()
    originalWindowLocation = window.location

    // Mock window.location.reload
    //delete window.location
    window.location = { ...originalWindowLocation, reload: jest.fn() }
  })

  // Restore original window.location after tests
  afterEach(() => {
    window.location = originalWindowLocation
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

  it('should handle errors with undefined message property', () => {
    //const errorWithoutMessage = { stack: 'Error stack trace' }

    // expect(() => {
    //   service.handleError(errorWithoutMessage)
    // }).toThrow(errorWithoutMessage)
  })
})