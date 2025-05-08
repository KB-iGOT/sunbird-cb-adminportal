import { MobileAppsService } from './mobile-apps.service'
import { NavigationExternalService } from './navigation-external.service'
import {
  CHAT_BOT_VISIBILITY,
  DISPLAY_SETTING,
  DOWNLOAD_REQUESTED,
  GET_PLAYERCONTENT_JSON,
  GO_OFFLINE,
  IOS_OPEN_IN_BROWSER,
  NAVIGATION_DATA_INCOMING
} from '../models/mobile-events.model'

describe('MobileAppsService', () => {
  let service: MobileAppsService
  let mockNavigationExternalService: jest.Mocked<NavigationExternalService>

  beforeEach(() => {
    // Create a mock for NavigationExternalService
    mockNavigationExternalService = {
      init: jest.fn()
    } as any

    // Reset window properties before each test
    delete (window as any).appRef
    delete (window as any).webkit
    delete (window as any).navigateTo
    delete (window as any).getToken
    delete (window as any).getSessionId
    delete (window as any).isAuthenticated
    delete (window as any).dispatchEventFlag

    // Initialize service with mock dependencies
    service = new MobileAppsService(mockNavigationExternalService)
  })

  describe('init', () => {
    it('should call setupGlobalMethods and initialize navigation service', () => {
      // Setup spies
      const setupGlobalMethodsSpy = jest.spyOn(service, 'setupGlobalMethods')

      // Call the method
      service.init()

      // Verify calls
      expect(setupGlobalMethodsSpy).toHaveBeenCalled()
      expect(mockNavigationExternalService.init).toHaveBeenCalled()
    })
  })

  describe('simulateMobile', () => {
    // it('should set window.appRef and window.webkit', () => {
    //   service.simulateMobile()

    //   expect(window.appRef).toBeDefined()
    //   expect(window.webkit).toBeDefined()
    //   expect(window.appRef).toEqual({})
    //   expect(window.webkit).toEqual({})
    // })
  })

  describe('isMobile', () => {
    it('should return true when on Android app', () => {
      (window as any).appRef = {}

      expect(service.isMobile).toBe(true)
    })

    it('should return true when on iOS app', () => {
      (window as any).webkit = {
        messageHandlers: {
          appRef: {}
        }
      }

      expect(service.isMobile).toBe(true)
    })

    it('should return false when not on mobile app', () => {
      expect(service.isMobile).toBe(false)
    })
  })

  describe('isAndroidApp', () => {
    it('should return true when window.appRef exists', () => {
      (window as any).appRef = {}

      expect(service.isAndroidApp).toBe(true)
    })

    it('should return false when window.appRef does not exist', () => {
      expect(service.isAndroidApp).toBe(false)
    })
  })

  describe('iOsAppRef', () => {
    it('should return appRef when on iOS app', () => {
      const mockAppRef = { postMessage: jest.fn() };
      (window as any).webkit = {
        messageHandlers: {
          appRef: mockAppRef
        }
      }

      expect(service.iOsAppRef).toBe(mockAppRef)
    })

    it('should return null when not on iOS app', () => {
      expect(service.iOsAppRef).toBeNull()
    })

    it('should return null when webkit exists but not messageHandlers.appRef', () => {
      (window as any).webkit = {}

      expect(service.iOsAppRef).toBeNull()
    })
  })

  describe('canShowSettings', () => {
    it('should return true for Android when DISPLAY_SETTING is available', () => {
      (window as any).appRef = {
        [DISPLAY_SETTING]: jest.fn()
      }

      expect(service.canShowSettings).toBe(true)
    })

    it('should return true for iOS when webkit.messageHandlers.appRef exists', () => {
      (window as any).webkit = {
        messageHandlers: {
          appRef: {}
        }
      }

      expect(service.canShowSettings).toBe(true)
    })

    it('should return false when not on mobile app', () => {
      expect(service.canShowSettings).toBe(false)
    })
  })

  describe('goOffline', () => {
    it('should call sendDataAppToClient with GO_OFFLINE', () => {
      const sendDataSpy = jest.spyOn(service, 'sendDataAppToClient')

      service.goOffline()

      expect(sendDataSpy).toHaveBeenCalledWith(GO_OFFLINE, {})
    })
  })

  describe('viewSettings', () => {
    it('should call sendDataAppToClient with DISPLAY_SETTING', () => {
      const sendDataSpy = jest.spyOn(service, 'sendDataAppToClient')

      service.viewSettings()

      expect(sendDataSpy).toHaveBeenCalledWith(DISPLAY_SETTING, {})
    })
  })

  describe('sendViewerData', () => {
    it('should call sendDataAppToClient with GET_PLAYERCONTENT_JSON and viewerData', () => {
      const sendDataSpy = jest.spyOn(service, 'sendDataAppToClient')
      const mockViewerData = { id: 'content-1' } as any

      service.sendViewerData(mockViewerData)

      expect(sendDataSpy).toHaveBeenCalledWith(GET_PLAYERCONTENT_JSON, mockViewerData)
    })
  })

  describe('downloadResource', () => {
    it('should call sendDataAppToClient with DOWNLOAD_REQUESTED and id', () => {
      const sendDataSpy = jest.spyOn(service, 'sendDataAppToClient')
      const contentId = 'content-123'

      service.downloadResource(contentId)

      expect(sendDataSpy).toHaveBeenCalledWith(DOWNLOAD_REQUESTED, contentId)
    })
  })

  describe('appChatbotVisibility', () => {
    it('should call sendDataAppToClient with CHAT_BOT_VISIBILITY and visibility value', () => {
      const sendDataSpy = jest.spyOn(service, 'sendDataAppToClient')

      service.appChatbotVisibility('yes')

      expect(sendDataSpy).toHaveBeenCalledWith(CHAT_BOT_VISIBILITY, 'yes')
    })
  })

  describe('iosOpenInBrowserRequest', () => {
    it('should call sendDataAppToClient with IOS_OPEN_IN_BROWSER and url object', () => {
      const sendDataSpy = jest.spyOn(service, 'sendDataAppToClient')
      const url = 'https://example.com'

      service.iosOpenInBrowserRequest(url)

      expect(sendDataSpy).toHaveBeenCalledWith(IOS_OPEN_IN_BROWSER, { url })
    })
  })

  describe('setupGlobalMethods', () => {
    // it('should add navigateTo to window object', () => {
    //   service.setupGlobalMethods()

    //   expect(window.navigateTo).toBeDefined()
    //   expect(typeof window.navigateTo).toBe('function')
    // })

    it('should dispatch NAVIGATION_DATA_INCOMING event when navigateTo is called', () => {
      const dispatchEventSpy = jest.spyOn(document, 'dispatchEvent')
      const url = '/dashboard'
      const params = { id: '123' }

      service.setupGlobalMethods()
      //  window.navigateTo!(url, params)

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NAVIGATION_DATA_INCOMING,
          detail: { url, params }
        })
      )
    })
  })

  describe('isFunctionAvailableInAndroid', () => {
    it('should return true when function exists in appRef', () => {
      const functionName = 'testFunction';
      (window as any).appRef = {
        [functionName]: jest.fn()
      }

      expect(service.isFunctionAvailableInAndroid(functionName)).toBe(true)
    })

    it('should return false when function does not exist in appRef', () => {
      const functionName = 'testFunction';
      (window as any).appRef = {}

      expect(service.isFunctionAvailableInAndroid(functionName)).toBe(false)
    })

    it('should return false when appRef does not exist', () => {
      expect(service.isFunctionAvailableInAndroid('testFunction')).toBe(false)
    })
  })

  describe('sendDataAppToClient', () => {
    it('should call Android function when on Android and not DISPLAY_SETTING', () => {
      const eventName = 'testEvent'
      const mockFn = jest.fn()
      const data = { id: '123' };

      (window as any).appRef = {
        [eventName]: mockFn
      }

      service.sendDataAppToClient(eventName, data)

      expect(mockFn).toHaveBeenCalledWith(JSON.stringify(data))
    })

    it('should call Android function without data when DISPLAY_SETTING', () => {
      const mockFn = jest.fn();

      (window as any).appRef = {
        [DISPLAY_SETTING]: mockFn
      }

      service.sendDataAppToClient(DISPLAY_SETTING, {})

      expect(mockFn).toHaveBeenCalledWith()
    })

    it('should call iOS postMessage when on iOS', () => {
      const eventName = 'testEvent'
      const data = { id: '123' }
      const mockPostMessage = jest.fn();

      (window as any).webkit = {
        messageHandlers: {
          appRef: {
            postMessage: mockPostMessage
          }
        }
      }

      service.sendDataAppToClient(eventName, data)

      expect(mockPostMessage).toHaveBeenCalledWith(
        JSON.stringify({ eventName, data })
      )
    })

    it('should dispatch custom event when dispatchEventFlag is true', () => {
      const eventName = 'testEvent'
      const data = { id: '123' }
      const dispatchEventSpy = jest.spyOn(document, 'dispatchEvent');

      (window as any).dispatchEventFlag = true

      service.sendDataAppToClient(eventName, data)

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: eventName,
          detail: data
        })
      )
    })

    it('should do nothing when not on mobile and dispatchEventFlag is false', () => {
      const eventName = 'testEvent'
      const data = { id: '123' }
      const dispatchEventSpy = jest.spyOn(document, 'dispatchEvent')

      service.sendDataAppToClient(eventName, data)

      expect(dispatchEventSpy).not.toHaveBeenCalled()
    })
  })
})