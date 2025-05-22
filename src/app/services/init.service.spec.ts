import { InitService } from './init.service'
import { HttpClient } from '@angular/common/http'
import { MatIconRegistry } from '@angular/material/icon'
import { DomSanitizer } from '@angular/platform-browser'
import { BtnSettingsService } from '@sunbird-cb/collection'
import { NsWidgetResolver, WidgetResolverService } from '@sunbird-cb/resolver'
import {
  ConfigurationsService,
  LoggerService,
  UserPreferenceService,
} from '@sunbird-cb/utils'
import { of, throwError } from 'rxjs'

// Mock the environment
jest.mock('../../environments/environment', () => ({
  environment: {
    production: false,
    portalRoles: ['PUBLIC', 'ADMIN', 'USER'],
  },
}))

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123'),
}))

// Mock lodash
jest.mock('lodash', () => ({
  get: jest.fn((obj, path, defaultValue) => {
    const keys = path.split('.')
    let result = obj
    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key]
      } else {
        return defaultValue
      }
    }
    return result
  }),
}))

describe('InitService', () => {
  let service: InitService
  let mockLoggerService: jest.Mocked<LoggerService>
  let mockConfigSvc: jest.Mocked<ConfigurationsService>
  let mockWidgetResolverService: jest.Mocked<WidgetResolverService>
  let mockSettingsSvc: jest.Mocked<BtnSettingsService>
  let mockUserPreference: jest.Mocked<UserPreferenceService>
  let mockHttpClient: jest.Mocked<HttpClient>
  let mockDomSanitizer: jest.Mocked<DomSanitizer>
  let mockIconRegistry: jest.Mocked<MatIconRegistry>

  const mockBaseHref = '/test'
  const mockBaseUrl = 'https://test.com'

  beforeEach(() => {
    // Create mocks for all dependencies
    mockLoggerService = {
      removeConsoleAccess: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any

    mockConfigSvc = {
      baseUrl: mockBaseUrl,
      isProduction: false,
      instanceConfig: null,
      rootOrg: '',
      org: [],
      activeOrg: null,
      appSetup: null,
      competency: null,
      sitePath: 'https://test.com/site',
      restrictedFeatures: new Set(),
      restrictedWidgets: new Set(),
      userRoles: new Set(),
      userGroups: new Set(),
      userProfile: null,
      userProfileV2: null,
      unMappedUser: null,
      hasAcceptedTnc: false,
      profileDetailsStatus: false,
      primaryNavBar: null,
      pageNavBar: null,
      primaryNavBarConfig: null,
      appsConfig: null,
      pinnedApps: { next: jest.fn() },
      profileSettings: null,
    } as any

    mockWidgetResolverService = {
      initialize: jest.fn(),
    } as any

    mockSettingsSvc = {
      initializePrefChanges: jest.fn(),
    } as any

    mockUserPreference = {
      initialize: jest.fn(),
      fetchUserPreference: jest.fn(),
    } as any

    mockHttpClient = {
      get: jest.fn(),
    } as any

    mockDomSanitizer = {
      bypassSecurityTrustResourceUrl: jest.fn().mockReturnValue('sanitized-url'),
    } as any

    mockIconRegistry = {
      addSvgIcon: jest.fn(),
    } as any

    // Create service instance
    service = new InitService(
      mockLoggerService,
      mockConfigSvc,
      mockWidgetResolverService,
      mockSettingsSvc,
      mockUserPreference,
      mockHttpClient,
      mockBaseHref,
      mockDomSanitizer,
      mockIconRegistry
    )

    // Mock localStorage and sessionStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    })

    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    })

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/test-path',
        origin: 'https://test.com',
        href: 'https://test.com/test-path',
        assign: jest.fn(),
      },
      writable: true,
    })

    // Mock document
    Object.defineProperty(document, 'title', {
      value: '',
      writable: true,
    })

    Object.defineProperty(document, 'baseURI', {
      value: 'https://test.com/',
      writable: true,
    })

    global.document.getElementById = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Constructor', () => {
    it('should create service and register SVG icons', () => {
      expect(service).toBeDefined()
      expect(mockConfigSvc.isProduction).toBe(false)
      expect(mockIconRegistry.addSvgIcon).toHaveBeenCalledTimes(6)
      expect(mockIconRegistry.addSvgIcon).toHaveBeenCalledWith(
        'pin',
        'sanitized-url'
      )
      expect(mockDomSanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith(
        'spv-assets/icons/pin.svg'
      )
    })
  })

  describe('locale getter', () => {
    it('should return locale from baseHref', () => {
      const serviceWithLocale = new InitService(
        mockLoggerService,
        mockConfigSvc,
        mockWidgetResolverService,
        mockSettingsSvc,
        mockUserPreference,
        mockHttpClient,
        '/fr/',
        mockDomSanitizer,
        mockIconRegistry
      )
      expect(serviceWithLocale.locale).toBe('fr')
    })

    it('should return "en" as default locale', () => {
      const serviceWithEmptyHref = new InitService(
        mockLoggerService,
        mockConfigSvc,
        mockWidgetResolverService,
        mockSettingsSvc,
        mockUserPreference,
        mockHttpClient,
        '/',
        mockDomSanitizer,
        mockIconRegistry
      )
      expect(serviceWithEmptyHref.locale).toBe('en')
    })
  })

  describe('hasRole', () => {
    it('should return true when user has valid role', () => {
      const roles = ['PUBLIC', 'ADMIN']
      expect(service.hasRole(roles)).toBe(true)
    })

    it('should return false when user has no valid roles', () => {
      const roles = ['INVALID_ROLE']
      expect(service.hasRole(roles)).toBe(false)
    })

    it('should return false when roles array is empty', () => {
      expect(service.hasRole([])).toBe(false)
    })
  })

  describe('init', () => {
    beforeEach(() => {
      // Mock all the private methods that init() calls
      jest.spyOn(service as any, 'fetchDefaultConfig').mockResolvedValue({
        rootOrg: 'test-org',
        org: ['org1'],
        appSetup: {},
        competency: {},
      })
      jest.spyOn(service as any, 'fetchStartUpDetails').mockResolvedValue({
        group: [],
        profileDetailsStatus: true,
        roles: ['public'],
        tncStatus: true,
        isActive: true,
      })
      jest.spyOn(service as any, 'fetchAppsConfig').mockResolvedValue({
        features: {},
        groups: [],
        tourGuide: {},
      })
      jest.spyOn(service as any, 'fetchInstanceConfig').mockResolvedValue({})
      jest.spyOn(service as any, 'fetchWidgetStatus').mockResolvedValue([])
      jest.spyOn(service as any, 'fetchFeaturesStatus').mockResolvedValue(new Set())
      jest.spyOn(service as any, 'processWidgetStatus').mockReturnValue(new Set())
      jest.spyOn(service as any, 'processAppsConfig').mockReturnValue({
        features: {},
        groups: [],
        tourGuide: {},
      })
      jest.spyOn(service as any, 'updateNavConfig').mockImplementation()
    })

    it('should initialize successfully for public path', async () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/public/test' },
        writable: true,
      })

      const result = await service.init()

      expect(result).toBe(true)
      expect(service['fetchDefaultConfig']).toHaveBeenCalled()
      expect(service['fetchStartUpDetails']).not.toHaveBeenCalled()
      expect(mockSettingsSvc.initializePrefChanges).toHaveBeenCalledWith(false)
    })

    it('should initialize successfully for non-public path', async () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/private/test' },
        writable: true,
      })

      const result = await service.init()

      expect(result).toBe(true)
      expect(service['fetchDefaultConfig']).toHaveBeenCalled()
      expect(service['fetchStartUpDetails']).toHaveBeenCalled()
      expect(mockWidgetResolverService.initialize).toHaveBeenCalled()
      expect(mockSettingsSvc.initializePrefChanges).toHaveBeenCalledWith(false)
      expect(mockUserPreference.initialize).toHaveBeenCalled()
    })

    it('should handle fetchStartUpDetails error', async () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/private/test' },
        writable: true,
      })

      jest.spyOn(service as any, 'fetchStartUpDetails').mockRejectedValue(new Error('Auth error'))

      const result = await service.init()

      expect(result).toBe(false)
      expect(mockLoggerService.info).toHaveBeenCalledWith('Not Authenticated')
    })

    it('should handle general initialization error', async () => {
      jest.spyOn(service as any, 'fetchAppsConfig').mockRejectedValue(new Error('Network error'))

      const result = await service.init()

      expect(result).toBe(true)
      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        'Initialization process encountered some error. Application may not work as expected',
        expect.any(Error)
      )
    })
  })

  describe('Private Methods', () => {
    describe('fetchDefaultConfig', () => {
      it('should fetch and set default configuration', async () => {
        const mockConfig = {
          rootOrg: 'test-org',
          org: ['org1', 'org2'],
          appSetup: { theme: 'default' },
          competency: { enabled: true },
        }

        mockHttpClient.get.mockReturnValue(of(mockConfig))

        const result = await service['fetchDefaultConfig']()

        expect(mockHttpClient.get).toHaveBeenCalledWith(`${mockBaseUrl}/host.config.json`)
        expect(mockConfigSvc.instanceConfig).toBe(mockConfig)
        expect(mockConfigSvc.rootOrg).toBe('test-org')
        expect(mockConfigSvc.org).toEqual(['org1', 'org2'])
        expect(mockConfigSvc.activeOrg).toBe('org1')
        expect(result).toBe(mockConfig)
      })
    })

    describe('fetchAppsConfig', () => {
      it('should fetch apps configuration', async () => {
        const mockAppsConfig = {
          features: { feature1: { id: 'feature1' } },
          groups: [],
          tourGuide: {},
        }

        mockHttpClient.get.mockReturnValue(of(mockAppsConfig))

        const result = await service['fetchAppsConfig']()

        expect(mockHttpClient.get).toHaveBeenCalledWith(`${mockBaseUrl}/feature/apps.json`)
        expect(result).toBe(mockAppsConfig)
      })
    })

    describe('fetchInstanceConfig', () => {
      it('should fetch instance configuration and update meta', async () => {
        const mockInstanceConfig = {
          rootOrg: 'instance-org',
          org: ['instance-org1'],
        }

        mockHttpClient.get.mockReturnValue(of(mockInstanceConfig))
        jest.spyOn(service as any, 'updateAppIndexMeta').mockImplementation()

        const result = await service['fetchInstanceConfig']()

        expect(mockHttpClient.get).toHaveBeenCalledWith(`${mockConfigSvc.sitePath}/site.config.json`)
        expect(mockConfigSvc.instanceConfig).toBe(mockInstanceConfig)
        expect(service['updateAppIndexMeta']).toHaveBeenCalled()
        expect(result).toBe(mockInstanceConfig)
      })
    })

    describe('fetchFeaturesStatus', () => {
      it('should fetch and process features configuration', async () => {
        const mockFeatureConfigs = {
          feature1: { roles: ['admin'] },
          feature2: { roles: ['public'] },
        }

        mockHttpClient.get.mockReturnValue(of(mockFeatureConfigs))
        mockConfigSvc.userRoles = new Set(['public'])
        mockConfigSvc.userGroups = new Set()

        const result = await service['fetchFeaturesStatus']()

        expect(mockHttpClient.get).toHaveBeenCalledWith(`${mockBaseUrl}/features.config.json`)
        expect(result).toBeInstanceOf(Set)
        expect(mockConfigSvc.restrictedFeatures).toBeInstanceOf(Set)
      })
    })

    describe('fetchWidgetStatus', () => {
      it('should fetch widget configuration', async () => {
        const mockWidgetConfigs = [
          { widgetPermission: { roles: ['admin'] } },
          { widgetPermission: { roles: ['public'] } },
        ]

        mockHttpClient.get.mockReturnValue(of(mockWidgetConfigs))

        const result = await service['fetchWidgetStatus']()

        expect(mockHttpClient.get).toHaveBeenCalledWith(`${mockBaseUrl}/widgets.config.json`)
        expect(result).toBe(mockWidgetConfigs)
      })
    })

    describe('fetchStartUpDetails', () => {
      beforeEach(() => {
        //  mockConfigSvc.instanceConfig = { disablePidCheck: false }
      })

      it('should fetch user profile and set configurations', async () => {
        const mockUserProfile = {
          userId: 'test-user',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          roles: ['PUBLIC'],
          thumbnail: 'profile.jpg',
          channel: 'test-channel',
          rootOrg: { rootOrgId: 'org1', orgName: 'Test Org' },
          userName: 'testuser',
          promptTnC: false,
          isDeleted: false,
          profiledetails: {
            personalDetails: {
              countryCode: 'IN',
              officialEmail: 'official@example.com',
              firstname: 'Test',
            },
            employmentDetails: {
              departmentName: 'IT',
            },
            photo: 'photo.jpg',
          },
        }

        mockHttpClient.get.mockReturnValue(of({
          result: { response: mockUserProfile },
        }))

        const result = await service['fetchStartUpDetails']()

        expect(mockHttpClient.get).toHaveBeenCalledWith('/apis/proxies/v8/api/user/v2/read')
        expect(mockConfigSvc.userProfile).toBeDefined()
        expect(mockConfigSvc.userProfileV2).toBeDefined()
        expect(mockConfigSvc.hasAcceptedTnc).toBe(true)
        expect(result.roles).toEqual(['public'])
      })

      it('should handle user without valid roles', async () => {
        const mockUserProfile = {
          userId: 'test-user',
          roles: ['INVALID_ROLE'],
        }

        const mockResponse = {
          result: { response: mockUserProfile },
          redirectUrl: 'https://redirect.com',
        }

        mockHttpClient.get.mockReturnValue(of(mockResponse))

        // Mock window.location.href assignment
        let redirectUrl = ''
        Object.defineProperty(window.location, 'href', {
          set: (url) => { redirectUrl = url },
          get: () => redirectUrl,
        })

        await service['fetchStartUpDetails']()

        expect(redirectUrl).toBe('https://redirect.com')
      })

      it('should handle API error', async () => {
        mockHttpClient.get.mockReturnValue(throwError('API Error'))

        await expect(service['fetchStartUpDetails']()).rejects.toThrow('Invalid user')
        expect(mockConfigSvc.userProfile).toBeNull()
      })

      it('should return default values when pidCheck is disabled', async () => {
        //mockConfigSvc.instanceConfig = { disablePidCheck: true }

        const result = await service['fetchStartUpDetails']()

        expect(result).toEqual({
          group: [],
          profileDetailsStatus: true,
          roles: new Set(['Public']),
          tncStatus: true,
          isActive: true,
        })
      })
    })

    describe('updateAppIndexMeta', () => {
      it('should update document meta information', () => {
        const mockElement = {
          setAttribute: jest.fn(),
          href: '',
        }

        document.getElementById = jest.fn().mockReturnValue(mockElement)

        // mockConfigSvc.instanceConfig = {
        //   details: { appName: 'Test App' },
        //   indexHtmlMeta: {
        //     description: 'Test Description',
        //     webmanifest: '/manifest.json',
        //     pngIcon: '/icon.png',
        //     xIcon: '/favicon.ico',
        //   },
        // }

        service['updateAppIndexMeta']()

        expect(document.title).toBe('Test App')
        expect(document.getElementById).toHaveBeenCalledWith('id-app-description')
        expect(mockElement.setAttribute).toHaveBeenCalledWith('content', 'Test Description')
      })

      it('should handle errors gracefully', () => {
        document.getElementById = jest.fn().mockImplementation(() => {
          throw new Error('Element not found')
        })

        // mockConfigSvc.instanceConfig = {
        //   details: { appName: 'Test App' },
        //   indexHtmlMeta: { description: 'Test Description' },
        // }

        expect(() => service['updateAppIndexMeta']()).not.toThrow()
        expect(mockLoggerService.error).toHaveBeenCalledWith(
          'Error updating index html meta >',
          expect.any(Error)
        )
      })
    })

    describe('updateNavConfig', () => {
      it('should update navigation configuration', () => {
        // mockConfigSvc.instanceConfig = {
        //   backgrounds: {
        //     primaryNavBar: { color: 'blue' },
        //     pageNavBar: { color: 'white' },
        //   },
        //   primaryNavBarConfig: { layout: 'horizontal' },
        // }

        service['updateNavConfig']()

        expect(mockConfigSvc.primaryNavBar).toEqual({ color: 'blue' })
        expect(mockConfigSvc.pageNavBar).toEqual({ color: 'white' })
        expect(mockConfigSvc.primaryNavBarConfig).toEqual({ layout: 'horizontal' })
      })

      it('should handle missing instanceConfig', () => {
        mockConfigSvc.instanceConfig = null

        expect(() => service['updateNavConfig']()).not.toThrow()
      })
    })

    describe('processAppsConfig', () => {
      it('should filter features based on permissions', () => {
        const mockAppsConfig: any = {
        }

        mockConfigSvc.restrictedFeatures = new Set(['feature2'])

        const result = service['processAppsConfig'](mockAppsConfig)

        expect(Object.keys(result.features)).toContain('feature1')
        expect(Object.keys(result.features)).not.toContain('feature2')
        expect(result.groups[0].featureIds).toEqual(['feature1'])
      })
    })

    describe('processWidgetStatus', () => {
      it('should process widget permissions', () => {
        const mockWidgetConfigs: NsWidgetResolver.IRegistrationsPermissionConfig[] = []

        mockConfigSvc.userRoles = new Set(['public'])
        mockConfigSvc.userGroups = new Set()
        mockConfigSvc.restrictedFeatures = new Set();

        // Mock the static method
        (WidgetResolverService.getWidgetKey as jest.Mock) = jest.fn().mockReturnValue('test-widget-key')

        const result = service['processWidgetStatus'](mockWidgetConfigs)

        expect(result).toBeInstanceOf(Set)
        expect(mockConfigSvc.restrictedWidgets).toBeInstanceOf(Set)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle null/undefined values gracefully', () => {
      expect(() => service.hasRole(undefined as any)).not.toThrow()
      expect(() => service.hasRole(null as any)).not.toThrow()
    })

    it('should handle empty configurations', () => {
      // mockConfigSvc.instanceConfig = {}
      expect(() => service['updateNavConfig']()).not.toThrow()
      expect(() => service['updateAppIndexMeta']()).not.toThrow()
    })
  })
})