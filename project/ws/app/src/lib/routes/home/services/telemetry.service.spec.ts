import { TelemetryService } from './telemetry.service'
import { ConfigurationsService } from './configurations.service'
import { EventService } from './event.service'
import { LoggerService } from './logger.service'
import { WsEvents } from './event.model'
import { Subject } from 'rxjs'

describe('TelemetryService', () => {
  let telemetryService: TelemetryService
  let configServiceMock: jest.Mocked<ConfigurationsService>
  let eventServiceMock: jest.Mocked<EventService>
  let loggerServiceMock: jest.Mocked<LoggerService>
  let eventsSubject: Subject<any>

  // Mock global $t object
  const $tMock = {
    start: jest.fn(),
    end: jest.fn(),
    audit: jest.fn(),
    heartbeat: jest.fn(),
    impression: jest.fn(),
    interact: jest.fn(),
    feedback: jest.fn(),
    search: jest.fn()
  }

  beforeEach(() => {
    // Reset DOM storage
    localStorage.clear()
    localStorage.setItem('telemetrySessionId', 'test-session-id')

    // Store original $t and replace with mock
    // global.$t = $tMock

    eventsSubject = new Subject()

    configServiceMock = {
      instanceConfig: {
        telemetryConfig: {
          pdata: {
            id: 'test-portal',
            pid: 'test-portal-id',
            ver: '1.0'
          },
          channel: 'test-channel'
        }
      },
      userProfile: {
        userId: 'test-user',
        rootOrgId: 'test-root-org'
      }
    } as any

    eventServiceMock = {
      events$: eventsSubject.asObservable()
    } as any

    loggerServiceMock = {
      error: jest.fn()
    } as any

    // Create the service
    telemetryService = new TelemetryService(
      configServiceMock,
      eventServiceMock,
      loggerServiceMock
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be created', () => {
    expect(telemetryService).toBeTruthy()
  })

  it('should initialize telemetry config correctly', () => {
    // expect(telemetryService['telemetryConfig']).toEqual({
    //   ...configServiceMock.instanceConfig.telemetryConfig,
    //   pdata: {
    //     ...configServiceMock.instanceConfig.telemetryConfig.pdata,
    //     pid: navigator.userAgent,
    //     id: `${environment.name}.${configServiceMock.instanceConfig.telemetryConfig.pdata.id}`,
    //   },
    //   uid: configServiceMock.userProfile.userId,
    //   channel: configServiceMock.userProfile.rootOrgId,
    //   sid: 'test-session-id',
    // })
  })

  it('should get telemetry session id from local storage', () => {
    expect(telemetryService.getTelemetrySessionId).toBe('test-session-id')
  })

  it('should get root org id from user profile', () => {
    expect(telemetryService.rootOrgId).toBe('test-root-org')
  })

  describe('start method', () => {
    it('should call $t.start with correct parameters', () => {
      telemetryService.start('test-type', 'test-mode', 'test-id', { contentId: 'test-content' })

      expect($tMock.start).toHaveBeenCalledWith(
        telemetryService['telemetryConfig'],
        'test-id',
        '1.0',
        {
          type: 'test-type',
          mode: 'test-mode',
          pageid: 'test-id',
        },
        {
          context: {
            pdata: {
              ...telemetryService['pData'],
              id: telemetryService['pData'].id,
            },
          },
          object: {
            contentId: 'test-content'
          },
        }
      )
    })

    it('should log error when telemetryConfig is null', () => {
      telemetryService['telemetryConfig'] = null
      telemetryService.start('test-type', 'test-mode', 'test-id')

      expect(loggerServiceMock.error).toHaveBeenCalledWith('Error Initializing Telemetry. Config missing.')
      expect($tMock.start).not.toHaveBeenCalled()
    })
  })

  describe('end method', () => {
    it('should call $t.end with correct parameters', () => {
      telemetryService.end('test-type', 'test-mode', 'test-id', { contentId: 'test-content' })

      expect($tMock.end).toHaveBeenCalledWith(
        {
          type: 'test-type',
          mode: 'test-mode',
          pageid: 'test-id',
        },
        {
          context: {
            pdata: {
              ...telemetryService['pData'],
              id: telemetryService['pData'].id,
            },
          },
          object: {
            contentId: 'test-content'
          },
        }
      )
    })
  })

  describe('audit method', () => {
    it('should call $t.audit with correct parameters', () => {
      telemetryService.audit('test-type', 'test-props', 'test-data')

      expect($tMock.audit).toHaveBeenCalledWith(
        {
          type: 'test-type',
          props: 'test-props',
          state: 'test-data',
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
      telemetryService.heartbeat('test-type', 'test-id')

      expect($tMock.heartbeat).toHaveBeenCalledWith({
        id: 'test-id',
        type: 'test-type',
      })
    })
  })

  describe('impression method', () => {
    beforeEach(() => {
      // Mock getPageDetails
      jest.spyOn(telemetryService as any, 'getPageDetails').mockReturnValue({
        pageid: 'test-page',
        pageUrlParts: ['test'],
        pageUrl: 'test-url',
        objectId: null
      })
    })

    it('should call $t.impression without object when objectId is not present', () => {
      telemetryService.impression()

      expect($tMock.impression).toHaveBeenCalledWith(
        {
          pageid: 'test-page',
          type: 'test',
          uri: 'test-url',
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
      expect(telemetryService['previousUrl']).toBe('test-url')
    })

    it('should call $t.impression with object when objectId is present', () => {
      (telemetryService as any).getPageDetails.mockReturnValue({
        pageid: 'test-page',
        pageUrlParts: ['test'],
        pageUrl: 'test-url',
        objectId: 'test-object-id'
      })

      telemetryService.impression()

      expect($tMock.impression).toHaveBeenCalledWith(
        {
          pageid: 'test-page',
          type: 'test',
          uri: 'test-url',
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

  describe('externalImpression method', () => {
    beforeEach(() => {
      // Mock getPageDetails
      jest.spyOn(telemetryService as any, 'getPageDetails').mockReturnValue({
        pageid: 'test-page',
        pageUrlParts: ['test'],
        pageUrl: 'test-url',
        objectId: null
      })
    })

    it('should call $t.impression with external app id when subApplicationName is valid', () => {
      const impressionData = {
        subApplicationName: 'RBCP',
        data: { test: 'data' }
      }

      telemetryService.externalImpression(impressionData)

      expect($tMock.impression).toHaveBeenCalledWith(
        impressionData.data,
        {
          context: {
            pdata: {
              ...telemetryService['pData'],
              id: 'rbcp-web-ui',
            },
          },
        }
      )
    })

    it('should include object id when present', () => {
      (telemetryService as any).getPageDetails.mockReturnValue({
        pageid: 'test-page',
        pageUrlParts: ['test'],
        pageUrl: 'test-url',
        objectId: 'test-object-id'
      })

      const impressionData = {
        subApplicationName: 'RBCP',
        data: { test: 'data' }
      }

      telemetryService.externalImpression(impressionData)

      expect($tMock.impression).toHaveBeenCalledWith(
        impressionData.data,
        {
          context: {
            pdata: {
              ...telemetryService['pData'],
              id: 'rbcp-web-ui',
            },
          },
          object: {
            id: 'test-object-id',
          },
        }
      )
    })

    it('should not call $t.impression when subApplicationName is invalid', () => {
      const impressionData = {
        subApplicationName: 'INVALID',
        data: { test: 'data' }
      }

      telemetryService.externalImpression(impressionData)

      expect($tMock.impression).not.toHaveBeenCalled()
    })
  })

  describe('addTimeSpentListener', () => {
    it('should call start on Loaded event', () => {
      const spy = jest.spyOn(telemetryService, 'start')

      eventsSubject.next({
        eventType: WsEvents.WsEventType.Telemetry,
        data: {
          type: WsEvents.WsTimeSpentType.Page,
          mode: WsEvents.WsTimeSpentMode.View,
          state: WsEvents.EnumTelemetrySubType.Loaded,
          pageId: 'test-page'
        }
      })

      expect(spy).toHaveBeenCalledWith(
        WsEvents.WsTimeSpentType.Page,
        WsEvents.WsTimeSpentMode.View,
        'test-page'
      )
    })

    it('should call end on Unloaded event', () => {
      const spy = jest.spyOn(telemetryService, 'end')

      eventsSubject.next({
        eventType: WsEvents.WsEventType.Telemetry,
        data: {
          type: WsEvents.WsTimeSpentType.Page,
          mode: WsEvents.WsTimeSpentMode.View,
          state: WsEvents.EnumTelemetrySubType.Unloaded,
          pageId: 'test-page'
        }
      })

      expect(spy).toHaveBeenCalledWith(
        WsEvents.WsTimeSpentType.Page,
        WsEvents.WsTimeSpentMode.View,
        'test-page'
      )
    })
  })

  describe('addPlayerListener', () => {
    it('should call start on Loaded event with supported iframe', () => {
      const spy = jest.spyOn(telemetryService, 'start')

      eventsSubject.next({
        eventType: WsEvents.WsEventType.Telemetry,
        data: {
          type: WsEvents.WsTimeSpentType.Player,
          mode: WsEvents.WsTimeSpentMode.Play,
          state: WsEvents.EnumTelemetrySubType.Loaded,
          identifier: 'test-id',
          content: { isIframeSupported: 'yes' },
          object: { id: 'test-object' }
        }
      })

      expect(spy).toHaveBeenCalledWith(
        WsEvents.WsTimeSpentType.Player,
        WsEvents.WsTimeSpentMode.Play,
        'test-id',
        { id: 'test-object' }
      )
    })

    it('should call end on Unloaded event with supported iframe', () => {
      const spy = jest.spyOn(telemetryService, 'end')

      eventsSubject.next({
        eventType: WsEvents.WsEventType.Telemetry,
        data: {
          type: WsEvents.WsTimeSpentType.Player,
          mode: WsEvents.WsTimeSpentMode.Play,
          state: WsEvents.EnumTelemetrySubType.Unloaded,
          identifier: 'test-id',
          content: { isIframeSupported: 'yes' },
          object: { id: 'test-object' }
        }
      })

      expect(spy).toHaveBeenCalledWith(
        WsEvents.WsTimeSpentType.Player,
        WsEvents.WsTimeSpentMode.Play,
        'test-id',
        { id: 'test-object' }
      )
    })
  })

  describe('addInteractListener', () => {
    beforeEach(() => {
      // Mock getPageDetails
      jest.spyOn(telemetryService as any, 'getPageDetails').mockReturnValue({
        pageid: 'test-page',
        pageUrlParts: ['part1', 'part2', 'part3', 'part4', 'goal-id'],
        pageUrl: 'test-url',
        objectId: null
      })
    })

    it('should call $t.interact for regular interaction events', () => {
      eventsSubject.next({
        eventType: WsEvents.WsEventType.Telemetry,
        data: {
          eventSubType: WsEvents.EnumTelemetrySubType.Interact,
          type: 'click',
          subType: 'button',
          object: { id: 'test-obj-id', contentId: 'test-content-id' }
        }
      })

      expect($tMock.interact).toHaveBeenCalledWith(
        {
          type: 'click',
          subtype: 'button',
          id: 'test-content-id',
          pageid: 'test-page',
        },
        {
          context: {
            pdata: {
              ...telemetryService['pData'],
              id: telemetryService['pData'].id,
            },
          },
          object: { id: 'test-obj-id', contentId: 'test-content-id' },
        }
      )
    })

    it('should use goal id for goal type events', () => {
      eventsSubject.next({
        eventType: WsEvents.WsEventType.Telemetry,
        data: {
          eventSubType: WsEvents.EnumTelemetrySubType.Interact,
          type: 'goal',
          subType: 'view',
          object: {}
        }
      })

      expect($tMock.interact).toHaveBeenCalledWith(
        {
          type: 'goal',
          subtype: 'view',
          id: 'goal-id',
          pageid: 'test-page',
        },
        {
          context: {
            pdata: {
              ...telemetryService['pData'],
              id: telemetryService['pData'].id,
            },
          },
          object: {},
        }
      )
    })

    it('should handle external app interactions', () => {
      eventsSubject.next({
        eventType: WsEvents.WsEventType.Telemetry,
        from: 'RBCP',
        data: {
          eventSubType: WsEvents.EnumTelemetrySubType.Interact,
          type: 'external-click'
        }
      })

      expect($tMock.interact).toHaveBeenCalledWith(
        { type: 'external-click' },
        {
          context: {
            pdata: {
              ...telemetryService['pData'],
              id: 'rbcp-web-ui',
            },
          },
        }
      )
    })
  })

  describe('addFeedbackListener', () => {
    beforeEach(() => {
      // Mock getPageDetails
      jest.spyOn(telemetryService as any, 'getPageDetails').mockReturnValue({
        pageid: 'test-page',
        pageUrlParts: ['test'],
        pageUrl: 'test-url',
        objectId: null
      })
    })

    it('should call $t.feedback with correct parameters', () => {
      eventsSubject.next({
        eventType: WsEvents.WsEventType.Telemetry,
        data: {
          eventSubType: WsEvents.EnumTelemetrySubType.Feedback,
          type: 'rating',
          object: {
            rating: 5,
            commentid: 'test-comment-id',
            commenttxt: 'Great content!',
            contentId: 'test-content-id',
            version: '2.0'
          }
        }
      })

      expect($tMock.feedback).toHaveBeenCalledWith(
        {
          rating: 5,
          commentid: 'test-comment-id',
          commenttxt: 'Great content!',
          pageid: 'test-page',
        },
        {
          context: {
            pdata: {
              ...telemetryService['pData'],
              id: telemetryService['pData'].id,
            },
          },
          object: {
            id: 'test-content-id',
            type: 'rating',
            ver: '2.0',
            rollup: {},
          },
        }
      )
    })
  })

  describe('addHearbeatListener', () => {
    it('should call $t.heartbeat for regular heartbeat events', () => {
      eventsSubject.next({
        eventType: WsEvents.WsEventType.Telemetry,
        data: {
          eventSubType: WsEvents.EnumTelemetrySubType.HeartBeat,
          type: 'player',
          id: 'test-id'
        }
      })

      expect($tMock.heartbeat).toHaveBeenCalledWith(
        {
          type: 'player',
          id: 'test-id',
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

    it('should handle external app heartbeats', () => {
      eventsSubject.next({
        eventType: WsEvents.WsEventType.Telemetry,
        from: 'RBCP',
        data: {
          eventSubType: WsEvents.EnumTelemetrySubType.HeartBeat,
          type: 'external-beat'
        }
      })

      expect($tMock.heartbeat).toHaveBeenCalledWith(
        { type: 'external-beat' },
        {
          context: {
            pdata: {
              ...telemetryService['pData'],
              id: 'rbcp-web-ui',
            },
          },
        }
      )
    })
  })

  describe('addSearchListener', () => {
    it('should call $t.search with correct parameters', () => {
      eventsSubject.next({
        eventType: WsEvents.WsEventType.Telemetry,
        data: {
          eventSubType: WsEvents.EnumTelemetrySubType.Search,
          query: 'test query',
          filters: { type: 'course' },
          size: 10
        }
      })

      expect($tMock.search).toHaveBeenCalledWith(
        {
          query: 'test query',
          filters: { type: 'course' },
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
      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: {
          pathname: '/app/toc/content-123',
          search: '?param=value'
        },
        writable: true
      })

      telemetryService['previousUrl'] = 'previous-url'

      const result = telemetryService['getPageDetails']()

      expect(result).toEqual({
        pageid: 'app/toc/content-123',
        pageUrl: 'app/toc/content-123?param=value',
        pageUrlParts: ['app', 'toc', 'content-123'],
        refferUrl: 'previous-url',
        objectId: 'content-123',
      })
    })
  })

  describe('extractContentIdFromUrlParts', () => {
    it('should extract content id from toc url', () => {
      const result = telemetryService['extractContentIdFromUrlParts'](['app', 'toc', 'content-123'])
      expect(result).toBe('content-123')
    })

    it('should extract content id from viewer url', () => {
      const result = telemetryService['extractContentIdFromUrlParts'](['app', 'viewer', 'pdf', 'content-123'])
      expect(result).toBe('content-123')
    })

    it('should return null for non-content urls', () => {
      const result = telemetryService['extractContentIdFromUrlParts'](['app', 'home'])
      expect(result).toBe(null)
    })

    it('should return null for incomplete urls', () => {
      const result1 = telemetryService['extractContentIdFromUrlParts'](['app', 'toc'])
      const result2 = telemetryService['extractContentIdFromUrlParts'](['app', 'viewer', 'pdf'])

      expect(result1).toBe(null)
      expect(result2).toBe(null)
    })
  })
})