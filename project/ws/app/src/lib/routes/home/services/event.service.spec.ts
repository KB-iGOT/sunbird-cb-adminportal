import { EventService } from './event.service'
import { WsEvents } from './event.model'
import { Subject } from 'rxjs'

describe('EventService', () => {
  let service: EventService
  let subjectSpy: jest.SpyInstance
  let eventsSubjectMock: Subject<any>

  beforeEach(() => {
    // Mock the Subject to track emitted values
    eventsSubjectMock = new Subject()
    subjectSpy = jest.spyOn(eventsSubjectMock, 'next')

    // Create an instance of EventService, inject the mocked Subject
    service = new EventService()
    service['eventsSubject'] = eventsSubjectMock // Replace the actual subject with the mock
  })

  it('should create the service', () => {
    expect(service).toBeDefined()
  })

  it('should dispatch an event when dispatchEvent is called', () => {
    const event: WsEvents.IWsEvents<any> = {
      eventType: WsEvents.WsEventType.Telemetry,
      eventLogLevel: WsEvents.WsEventLogLevel.Info,
      data: {
        type: 'click',
        subType: 'button',
        object: {},
        eventSubType: WsEvents.EnumTelemetrySubType.Interact,
      },
      from: '',
      to: 'Telemetry',
    }

    // Call dispatchEvent
    service.dispatchEvent(event)

    // Assert that next was called with the correct event
    expect(subjectSpy).toHaveBeenCalledWith(event)
  })

  it('should dispatch the correct event when raiseInteractTelemetry is called', () => {
    const type = 'click'
    const subType = 'button'
    const object = {}
    const from = 'testSource'

    // Call raiseInteractTelemetry
    service.raiseInteractTelemetry(type, subType, object, from)

    // Check the dispatched event
    const expectedEvent: any = {
      eventType: WsEvents.WsEventType.Telemetry,
      eventLogLevel: WsEvents.WsEventLogLevel.Info,
      data: {
        type,
        subType,
        object,
        eventSubType: WsEvents.EnumTelemetrySubType.Interact,
      },
      from,
      to: 'Telemetry',
    }

    // Assert that next was called with the expected event
    expect(subjectSpy).toHaveBeenCalledWith(expectedEvent)
  })

  it('should dispatch the correct event when raiseFeedbackTelemetry is called', () => {
    const type = 'submit'
    const subType = 'form'
    const object = {}
    const from = 'testSource'

    // Call raiseFeedbackTelemetry
    service.raiseFeedbackTelemetry(type, subType, object, from)

    // Check the dispatched event
    const expectedEvent: any = {
      eventType: WsEvents.WsEventType.Telemetry,
      eventLogLevel: WsEvents.WsEventLogLevel.Info,
      data: {
        type,
        subType,
        object,
        eventSubType: WsEvents.EnumTelemetrySubType.Feedback,
      },
      from,
      to: 'Telemetry',
    }

    // Assert that next was called with the expected event
    expect(subjectSpy).toHaveBeenCalledWith(expectedEvent)
  })

  it('should use an empty string for "from" if not provided in raiseInteractTelemetry', () => {
    const type = 'click'
    const subType = 'button'
    const object = {}

    // Call raiseInteractTelemetry without "from"
    service.raiseInteractTelemetry(type, subType, object)

    // Check the dispatched event
    const expectedEvent: any = {
      eventType: WsEvents.WsEventType.Telemetry,
      eventLogLevel: WsEvents.WsEventLogLevel.Info,
      data: {
        type,
        subType,
        object,
        eventSubType: WsEvents.EnumTelemetrySubType.Interact,
      },
      from: '', // Default value for 'from' is an empty string
      to: 'Telemetry',
    }

    // Assert that next was called with the expected event
    expect(subjectSpy).toHaveBeenCalledWith(expectedEvent)
  })
})
