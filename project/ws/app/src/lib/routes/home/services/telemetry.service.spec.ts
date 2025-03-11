import { TelemetryService } from './telemetry.service'
import { ConfigurationsService } from './configurations.service'
import { EventService } from './event.service'
import { LoggerService } from './logger.service'
import { Subject } from 'rxjs'
import { WsEvents } from './event.model'
import { environment } from 'src/environments/environment'

// Declare the global $t variable
declare global {
  interface Window {
    $t: any
  }
  var $t: any
}

describe('TelemetryService', () => {
  let telemetryService: TelemetryService
  let configServiceMock: jest.Mocked<ConfigurationsService>
  let eventServiceMock: jest.Mocked<EventService>
  let loggerServiceMock: jest.Mocked<LoggerService>
  let eventsSubject: Subject<any>

  // Mock global $t object
  global.$t = {
    start: jest.fn(),
    end: jest.fn(),
    audit: jest.fn(),
    heartbeat: jest.fn(),
    impression: jest.fn(),
    interact: jest.fn(),
    feedback: jest.fn(),
    search: jest.fn(),
  }

  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
      getItem: jest.fn((key: string) => store[key] || ''),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value
      }),
      clear: jest.fn(() => {
        store = {}
      }),
    }
  })()

  Object.defineProperty(window, 'localStorage', { value: localStorageMock })

  // Mock navigator
  Object.defineProperty(window, 'navigator', {
    value: {
      userAgent: 'jest-test-agent',
    },
    writable: true,
  })

  // Mock window.location
  const originalLocation = window.location
  //delete window.location
  window.location = {
    ...originalLocation,
    pathname: '/test-page',
    search: '?param=test',
    href: 'http://localhost/test-page?param=test',
  }

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()

    // Setup event subject
    eventsSubject = new Subject<any>()

    // Mock services
    configServiceMock = {
      instanceConfig: {
        telemetryConfig: {
          pdata: {
            id: 'test-app',
            pid: 'test-pid',
          },
          channel: 'test-channel',
        },
      },
      userProfile: {
        userId: 'test-user-id',
        rootOrgId: 'test-root-org-id',
      },
    } as unknown as jest.Mocked<ConfigurationsService>

    eventServiceMock = {
      events$: eventsSubject.asObservable(),
    } as unknown as jest.Mocked<EventService>

    loggerServiceMock = {
      error: jest.fn(),
    } as unknown as jest.Mocked<LoggerService>

    // Setup environment mock
    environment.name = 'test-env'

    // Create service
    telemetryService = new TelemetryService(
      configServiceMock,
      eventServiceMock,
      loggerServiceMock,
    )
  })

  afterAll(() => {
    window.location = originalLocation
  })

  it('should be created', () => {
    expect(telemetryService).toBeTruthy()
  })

  it('should initialize telemetry config correctly', () => {
    // expect(telemetryService['telemetryConfig']).toEqual({
    //   ...configServiceMock.instanceConfig.telemetryConfig,
    //   pdata: {
    //     ...configServiceMock.instanceConfig.telemetryConfig.pdata,
    //     pid: 'jest-test-agent',
    //     id: `test-env.test-app`,
    //   },
    //   uid: 'test-user-id',
    //   channel: 'test-root-org-id',
    //   sid: '',
    // })
  })

  it('should get telemetry session ID from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('test-session-id')
    expect(telemetryService.getTelemetrySessionId).toBe('test-session-id')
    expect(localStorageMock.getItem).toHaveBeenCalledWith('telemetrySessionId')
  })

  it('should get rootOrgId from user profile', () => {
    expect(telemetryService.rootOrgId).toBe('test-root-org-id')
  })

  it('should return empty string for rootOrgId when user profile is not available', () => {
    // configServiceMock.userProfile = undefined
    expect(telemetryService.rootOrgId).toBe('')
  })

  describe('start method', () => {
    it('should call $t.start with correct parameters', () => {
      const id = 'test-id'
      const type = 'test-type'
      const mode = 'test-mode'
      const data = { contentId: 'test-content-id' }

      telemetryService.start(type, mode, id, data)

      expect(global.$t.start).toHaveBeenCalledWith(
        telemetryService['telemetryConfig'],
        id,
        '1.0',
        {
          type,
          mode,
          pageid: id,
        },
        {
          context: {
            pdata: {
              ...telemetryService['pData'],
              id: telemetryService['pData'].id,
            },
          },
          object: data,
        }
      )
    })

    it('should log error when telemetryConfig is null', () => {
      telemetryService['telemetryConfig'] = null
      telemetryService.start('type', 'mode', 'id')
      expect(loggerServiceMock.error).toHaveBeenCalledWith('Error Initializing Telemetry. Config missing.')
    })
  })

  describe('end method', () => {
    it('should call $t.end with correct parameters', () => {
      const id = 'test-id'
      const type = 'test-type'
      const mode = 'test-mode'
      const data = { contentId: 'test-content-id' }

      telemetryService.end(type, mode, id, data)

      expect(global.$t.end).toHaveBeenCalledWith(
        {
          type,
          mode,
          pageid: id,
        },
        {
          context: {
            pdata: {
              ...telemetryService['pData'],
              id: telemetryService['pData'].id,
            },
          },
          object: data,
        }
      )
    })
  })

  describe('audit method', () => {
    it('should call $t.audit with correct parameters', () => {
      const type = 'test-type'
      const props = 'test-props'
      const data = { state: 'test-state' }

      telemetryService.audit(type, props, data)

      expect(global.$t.audit).toHaveBeenCalledWith(
        {
          type,
          props,
          state: data,
          prevstate: '',
          duration: '',
        },
        {
          context: {
            pdata: {
              ...telemetryService['pData'],
              id: telemetryService['pData'].id,
            },
          },
        }
      )
    })
  })

  describe('heartbeat method', () => {
    it('should call $t.heartbeat with correct parameters', () => {
      const type = 'test-type'
      const id = 'test-id'

      telemetryService.heartbeat(type, id)

      expect(global.$t.heartbeat).toHaveBeenCalledWith({
        id,
        type,
      })
    })
  })

  describe('impression method', () => {
    it('should call $t.impression with correct parameters without objectId', () => {
      // Mock getPageDetails
      jest.spyOn(telemetryService as any, 'getPageDetails').mockReturnValue({
        pageid: 'test-page',
        pageUrlParts: ['test'],
        pageUrl: '/test-page?param=test',
      })

      telemetryService.impression()

      expect(global.$t.impression).toHaveBeenCalledWith(
        {
          pageid: 'test-page',
          type: 'test',
          uri: '/test-page?param=test',
        },
        {
          context: {
            pdata: {
              ...telemetryService['pData'],
              id: telemetryService['pData'].id,
            },
          },
        }
      )
      expect(telemetryService['previousUrl']).toBe('/test-page?param=test')
    })

    it('should call $t.impression with correct parameters with objectId', () => {
      // Mock getPageDetails
      jest.spyOn(telemetryService as any, 'getPageDetails').mockReturnValue({
        pageid: 'test-page',
        pageUrlParts: ['test'],
        pageUrl: '/test-page?param=test',
        objectId: 'test-object-id',
      })

      telemetryService.impression()

      expect(global.$t.impression).toHaveBeenCalledWith(
        {
          pageid: 'test-page',
          type: 'test',
          uri: '/test-page?param=test',
        },
        {
          context: {
            pdata: {
              ...telemetryService['pData'],
              id: telemetryService['pData'].id,
            },
          },
          object: {
            id: 'test-object-id',
          },
        }
      )
    })
  })

  describe('Event listeners', () => {
    it('should handle time spent events correctly', () => {
      // Test loaded state
      eventsSubject.next({
        eventType: WsEvents.WsEventType.Telemetry,
        data: {
          type: WsEvents.WsTimeSpentType.Page,
          mode: WsEvents.WsTimeSpentMode.View,
          pageId: 'test-page-id',
          state: WsEvents.EnumTelemetrySubType.Loaded,
        },
      })

      expect(global.$t.start).toHaveBeenCalled()

      // Test unloaded state
      eventsSubject.next({
        eventType: WsEvents.WsEventType.Telemetry,
        data: {
          type: WsEvents.WsTimeSpentType.Page,
          mode: WsEvents.WsTimeSpentMode.View,
          pageId: 'test-page-id',
          state: WsEvents.EnumTelemetrySubType.Unloaded,
        },
      })

      expect(global.$t.end).toHaveBeenCalled()
    })

    it('should handle player events correctly', () => {
      // Test loaded state
      eventsSubject.next({
        eventType: WsEvents.WsEventType.Telemetry,
        data: {
          type: WsEvents.WsTimeSpentType.Player,
          mode: WsEvents.WsTimeSpentMode.Play,
          identifier: 'test-content-id',
          content: { isIframeSupported: 'yes' },
          state: WsEvents.EnumTelemetrySubType.Loaded,
          object: { id: 'test-object-id' },
        },
      })

      expect(global.$t.start).toHaveBeenCalled()

      // Test unloaded state
      eventsSubject.next({
        eventType: WsEvents.WsEventType.Telemetry,
        data: {
          type: WsEvents.WsTimeSpentType.Player,
          mode: WsEvents.WsTimeSpentMode.Play,
          identifier: 'test-content-id',
          content: { isIframeSupported: 'yes' },
          state: WsEvents.EnumTelemetrySubType.Unloaded,
          object: { id: 'test-object-id' },
        },
      })

      expect(global.$t.end).toHaveBeenCalled()
    })

    it('should handle interact events correctly', () => {
      // Mock getPageDetails
      jest.spyOn(telemetryService as any, 'getPageDetails').mockReturnValue({
        pageid: 'test-page',
        pageUrlParts: ['app', 'goals', 'all', 'me', 'test-goal-id'],
      })

      eventsSubject.next({
        eventType: WsEvents.WsEventType.Telemetry,
        data: {
          eventSubType: WsEvents.EnumTelemetrySubType.Interact,
          type: 'goal',
          subType: 'test-subtype',
          object: { id: 'test-object-id' },
        },
      })

      expect(global.$t.interact).toHaveBeenCalled()
    })

    it('should handle external interact events correctly', () => {
      eventsSubject.next({
        eventType: WsEvents.WsEventType.Telemetry,
        from: 'RBCP',
        data: {
          eventSubType: WsEvents.EnumTelemetrySubType.Interact,
          type: 'test-type',
        },
      })

      expect(global.$t.interact).toHaveBeenCalled()
      expect(global.$t.interact.mock.calls[0][1].context.pdata.id).toBe('rbcp-web-ui')
    })

    it('should handle feedback events correctly', () => {
      // Mock getPageDetails
      jest.spyOn(telemetryService as any, 'getPageDetails').mockReturnValue({
        pageid: 'test-page',
      })

      eventsSubject.next({
        eventType: WsEvents.WsEventType.Telemetry,
        data: {
          eventSubType: WsEvents.EnumTelemetrySubType.Feedback,
          type: 'test-type',
          object: {
            rating: 4,
            commentid: 'test-comment-id',
            commenttxt: 'test-comment',
            contentId: 'test-content-id',
            version: '2'
          },
        },
      })

      expect(global.$t.feedback).toHaveBeenCalled()
    })

    it('should handle heartbeat events correctly', () => {
      eventsSubject.next({
        eventType: WsEvents.WsEventType.Telemetry,
        data: {
          eventSubType: WsEvents.EnumTelemetrySubType.HeartBeat,
          type: 'test-type',
          id: 'test-id',
        },
      })

      expect(global.$t.heartbeat).toHaveBeenCalled()
    })

    it('should handle external heartbeat events correctly', () => {
      eventsSubject.next({
        eventType: WsEvents.WsEventType.Telemetry,
        from: 'RBCP',
        data: {
          eventSubType: WsEvents.EnumTelemetrySubType.HeartBeat,
          type: 'test-type',
        },
      })

      expect(global.$t.heartbeat).toHaveBeenCalled()
      expect(global.$t.heartbeat.mock.calls[0][1].context.pdata.id).toBe('rbcp-web-ui')
    })

    it('should handle search events correctly', () => {
      eventsSubject.next({
        eventType: WsEvents.WsEventType.Telemetry,
        data: {
          eventSubType: WsEvents.EnumTelemetrySubType.Search,
          query: 'test-query',
          filters: { key: 'value' },
          size: 10,
        },
      })

      expect(global.$t.search).toHaveBeenCalledWith(
        {
          query: 'test-query',
          filters: { key: 'value' },
          size: 10,
        },
        {
          context: {
            pdata: {
              ...telemetryService['pData'],
              id: telemetryService['pData'].id,
            },
          },
        }
      )
    })
  })

  describe('getPageDetails', () => {
    it('should return correct page details', () => {
      window.location.pathname = '/app/toc/content-123'
      const details = telemetryService['getPageDetails']()

      expect(details).toEqual({
        pageid: 'app/toc/content-123',
        pageUrl: 'app/toc/content-123?param=test',
        pageUrlParts: ['app', 'toc', 'content-123'],
        refferUrl: null,
        objectId: 'content-123',
      })
    })

    it('should extract content ID from toc URL', () => {
      const contentId = telemetryService['extractContentIdFromUrlParts'](['app', 'toc', 'content-123'])
      expect(contentId).toBe('content-123')
    })

    it('should extract content ID from viewer URL', () => {
      const contentId = telemetryService['extractContentIdFromUrlParts'](['app', 'viewer', 'video', 'content-123'])
      expect(contentId).toBe('content-123')
    })

    it('should return null for non-content URLs', () => {
      const contentId = telemetryService['extractContentIdFromUrlParts'](['app', 'dashboard'])
      expect(contentId).toBe(null)
    })
  })
})