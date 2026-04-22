import { of } from 'rxjs'
import { EventService } from './event.service'

describe('EventService', () => {
  let service: EventService
  let mockHttp: { get: jest.Mock }

  beforeEach(() => {
    mockHttp = { get: jest.fn() }
    service = new EventService(mockHttp as any)
  })

  it('should create the service', () => {
    expect(service).toBeTruthy()
  })

  it('should initialize bannerisEnabled BehaviorSubject with true', () => {
    let value: boolean | undefined
    service.bannerisEnabled.subscribe(v => (value = v))
    expect(value).toBe(true)
  })

  it('should allow updating bannerisEnabled', () => {
    service.bannerisEnabled.next(false)
    let value: boolean | undefined
    service.bannerisEnabled.subscribe(v => (value = v))
    expect(value).toBe(false)
  })

  describe('getEventData', () => {
    it('should call http.get with the correct endpoint', () => {
      const mockResponse = [{ id: 'event-1', name: 'Test Event' }]
      mockHttp.get.mockReturnValue(of(mockResponse))

      service.getEventData().subscribe(result => {
        expect(result).toEqual(mockResponse)
      })

      expect(mockHttp.get).toHaveBeenCalledWith('/apis/protected/v8/event-external/')
    })

    it('should return the observable from http.get', () => {
      const eventData = { events: [] }
      mockHttp.get.mockReturnValue(of(eventData))

      let received: any
      service.getEventData().subscribe(data => (received = data))
      expect(received).toEqual(eventData)
    })
  })
})

