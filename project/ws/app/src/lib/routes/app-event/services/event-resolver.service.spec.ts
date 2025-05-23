import { EventResolverService } from './event-resolver.service'
import { EventService } from './event.service'
import { ActivatedRouteSnapshot } from '@angular/router'
import { of, throwError } from 'rxjs'

describe('EventResolverService', () => {
  let service: EventResolverService
  let mockEventService: jest.Mocked<EventService>
  let mockRoute: ActivatedRouteSnapshot

  beforeEach(() => {
    // Create mock EventService
    mockEventService = {
      getEventData: jest.fn()
    } as unknown as jest.Mocked<EventService>

    // Create mock ActivatedRouteSnapshot
    mockRoute = {
      params: {}
    } as ActivatedRouteSnapshot

    // Create service instance
    service = new EventResolverService(mockEventService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('resolve', () => {
    const mockEventData = {
      Events: {
        'event1': { id: 1, name: 'Event 1', description: 'First event' },
        'event2': { id: 2, name: 'Event 2', description: 'Second event' },
        'event3': { id: 3, name: 'Event 3', description: 'Third event' }
      }
    }

    it('should resolve with first event when id is 1', (done) => {
      // Arrange
      mockRoute.params = { id: '1' }
      mockEventService.getEventData.mockReturnValue(of(mockEventData))

      // Act
      service.resolve(mockRoute).subscribe(result => {
        // Assert
        expect(result.data).toEqual(mockEventData.Events['event1'])
        expect(result.error).toBeNull()
        expect(mockEventService.getEventData).toHaveBeenCalledTimes(1)
        done()
      })
    })

    it('should resolve with second event when id is 2', (done) => {
      // Arrange
      mockRoute.params = { id: '2' }
      mockEventService.getEventData.mockReturnValue(of(mockEventData))

      // Act
      service.resolve(mockRoute).subscribe(result => {
        // Assert
        expect(result.data).toEqual(mockEventData.Events['event2'])
        expect(result.error).toBeNull()
        done()
      })
    })

    it('should resolve with third event when id is 3', (done) => {
      // Arrange
      mockRoute.params = { id: '3' }
      mockEventService.getEventData.mockReturnValue(of(mockEventData))

      // Act
      service.resolve(mockRoute).subscribe(result => {
        // Assert
        expect(result.data).toEqual(mockEventData.Events['event3'])
        expect(result.error).toBeNull()
        done()
      })
    })

    it('should default to id 1 when no id parameter is provided', (done) => {
      // Arrange
      mockRoute.params = {}
      mockEventService.getEventData.mockReturnValue(of(mockEventData))

      // Act
      service.resolve(mockRoute).subscribe(result => {
        // Assert
        expect(result.data).toEqual(mockEventData.Events['event1'])
        expect(result.error).toBeNull()
        done()
      })
    })

    it('should default to id 1 when id parameter is invalid (NaN)', (done) => {
      // Arrange
      mockRoute.params = { id: 'invalid' }
      mockEventService.getEventData.mockReturnValue(of(mockEventData))

      // Act
      service.resolve(mockRoute).subscribe(result => {
        // Assert
        expect(result.data).toEqual(mockEventData.Events['event1'])
        expect(result.error).toBeNull()
        done()
      })
    })

    it('should default to id 1 when id parameter is 0', (done) => {
      // Arrange
      mockRoute.params = { id: '0' }
      mockEventService.getEventData.mockReturnValue(of(mockEventData))

      // Act
      service.resolve(mockRoute).subscribe(result => {
        // Assert
        expect(result.data).toEqual(mockEventData.Events['event1'])
        expect(result.error).toBeNull()
        done()
      })
    })

    it('should handle when requested event index does not exist', (done) => {
      // Arrange
      mockRoute.params = { id: '10' }
      mockEventService.getEventData.mockReturnValue(of(mockEventData))

      // Act
      service.resolve(mockRoute).subscribe(result => {
        // Assert
        expect(result.data).toBeUndefined()
        expect(result.error).toBeNull()
        done()
      })
    })

    it('should handle empty Events object', (done) => {
      // Arrange
      mockRoute.params = { id: '1' }
      const emptyEventData = { Events: {} }
      mockEventService.getEventData.mockReturnValue(of(emptyEventData))

      // Act
      service.resolve(mockRoute).subscribe(result => {
        // Assert
        expect(result.data).toBeUndefined()
        expect(result.error).toBeNull()
        done()
      })
    })

    it('should handle null Events property', (done) => {
      // Arrange
      mockRoute.params = { id: '1' }
      const nullEventData = { Events: null }
      mockEventService.getEventData.mockReturnValue(of(nullEventData))

      // Act & Assert
      expect(() => {
        service.resolve(mockRoute).subscribe()
      }).not.toThrow()
      done()
    })

    it('should catch and handle service errors', (done) => {
      // Arrange
      mockRoute.params = { id: '1' }
      const mockError = new Error('Service unavailable')
      mockEventService.getEventData.mockReturnValue(throwError(mockError))

      // Act
      service.resolve(mockRoute).subscribe(result => {
        // Assert
        expect(result.data).toBeNull()
        expect(result.error).toEqual(mockError)
        expect(mockEventService.getEventData).toHaveBeenCalledTimes(1)
        done()
      })
    })

    it('should handle HTTP error responses', (done) => {
      // Arrange
      mockRoute.params = { id: '1' }
      const httpError = { status: 404, message: 'Not Found' }
      mockEventService.getEventData.mockReturnValue(throwError(httpError))

      // Act
      service.resolve(mockRoute).subscribe(result => {
        // Assert
        expect(result.data).toBeNull()
        expect(result.error).toEqual(httpError)
        done()
      })
    })

    it('should handle negative id values by defaulting to 1', (done) => {
      // Arrange
      mockRoute.params = { id: '-5' }
      mockEventService.getEventData.mockReturnValue(of(mockEventData))

      // Act
      service.resolve(mockRoute).subscribe(result => {
        // Assert
        expect(result.data).toEqual(mockEventData.Events['event1'])
        expect(result.error).toBeNull()
        done()
      })
    })

    it('should handle decimal id values by converting to integer', (done) => {
      // Arrange
      mockRoute.params = { id: '2.7' }
      mockEventService.getEventData.mockReturnValue(of(mockEventData))

      // Act
      service.resolve(mockRoute).subscribe(result => {
        // Assert
        expect(result.data).toEqual(mockEventData.Events['event2'])
        expect(result.error).toBeNull()
        done()
      })
    })
  })

  describe('constructor', () => {
    it('should create service instance with injected EventService', () => {
      // Act & Assert
      expect(service).toBeDefined()
      expect(service['eventSvc']).toBe(mockEventService)
    })
  })
})