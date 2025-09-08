import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { APP_BASE_HREF } from '@angular/common'
import { MatIconRegistry } from '@angular/material/icon'
import { DomSanitizer } from '@angular/platform-browser'

import { InitService } from './init.service'
import { ConfigurationsService, LoggerService, UserPreferenceService } from '@sunbird-cb/utils-v2'
import { BtnSettingsService } from '@sunbird-cb/collection'
import { SbUiResolverService } from '@sunbird-cb/resolver-v2'
import { environment } from '../../environments/environment'

describe('InitService', () => {
  let service: InitService
  let httpMock: HttpTestingController
  let configServiceMock: jest.Mocked<ConfigurationsService>
  // let loggerServiceMock: jest.Mocked<LoggerService>
  // let SbUiResolverServiceMock: jest.Mocked<SbUiResolverService>
  // let btnSettingsServiceMock: jest.Mocked<BtnSettingsService>
  // let userPreferenceServiceMock: jest.Mocked<UserPreferenceService>
  // let domSanitizerMock: jest.Mocked<DomSanitizer>
  let matIconRegistryMock: jest.Mocked<MatIconRegistry>

  beforeEach(() => {
    const configServiceMockImpl = {
      baseUrl: 'http://test.com',
      instanceConfig: null,
      isProduction: false,
      sitePath: 'http://test.com/site',
      setUserProfile: jest.fn(),
      userGroups: new Set(),
      userRoles: new Set(),
      restrictedFeatures: new Set(),
      rootOrg: '',
      org: [],
      activeOrg: '',
      unMappedUser: null,
      userProfile: null,
      userProfileV2: null,
      hasAcceptedTnc: false,
      profileDetailsStatus: false,
    }

    const domSanitizerMockImpl = {
      bypassSecurityTrustResourceUrl: jest.fn((url: string) => url)
    }

    const matIconRegistryMockImpl = {
      addSvgIcon: jest.fn()
    }

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        InitService,
        {
          provide: ConfigurationsService,
          useValue: configServiceMockImpl
        },
        {
          provide: LoggerService,
          useValue: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
          }
        },
        {
          provide: SbUiResolverService,
          useValue: {
            initialize: jest.fn(),
            getWidgetKey: jest.fn()
          }
        },
        {
          provide: BtnSettingsService,
          useValue: {
            initializePrefChanges: jest.fn()
          }
        },
        {
          provide: UserPreferenceService,
          useValue: {
            initialize: jest.fn()
          }
        },
        {
          provide: DomSanitizer,
          useValue: domSanitizerMockImpl
        },
        {
          provide: MatIconRegistry,
          useValue: matIconRegistryMockImpl
        },
        {
          provide: APP_BASE_HREF,
          useValue: '/test'
        }
      ]
    })

    service = TestBed.inject(InitService)
    httpMock = TestBed.inject(HttpTestingController)
    configServiceMock = TestBed.inject(ConfigurationsService) as jest.Mocked<ConfigurationsService>
    // loggerServiceMock = TestBed.inject(LoggerService) as jest.Mocked<LoggerService>
    // SbUiResolverServiceMock = TestBed.inject(SbUiResolverService) as jest.Mocked<SbUiResolverService>
    // btnSettingsServiceMock = TestBed.inject(BtnSettingsService) as jest.Mocked<BtnSettingsService>
    // userPreferenceServiceMock = TestBed.inject(UserPreferenceService) as jest.Mocked<UserPreferenceService>
    // domSanitizerMock = TestBed.inject(DomSanitizer) as jest.Mocked<DomSanitizer>
    matIconRegistryMock = TestBed.inject(MatIconRegistry) as jest.Mocked<MatIconRegistry>
  })

  afterEach(() => {
    httpMock.verify()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('fetchDefaultConfig', () => {
    it('should fetch and set default configuration', async () => {
      const mockConfig = {
        rootOrg: 'TestRootOrg',
        org: ['TestOrg'],
        appSetup: {},
        competency: {},
        details: { appName: 'TestApp' },
        backgrounds: {}
      }

      const fetchDefaultConfigPromise = service['fetchDefaultConfig']()

      const req = httpMock.expectOne('http://test.com/host.config.json')
      req.flush(mockConfig)

      const result = await fetchDefaultConfigPromise

      expect(result).toEqual(mockConfig)
      expect(configServiceMock.instanceConfig).toEqual(mockConfig)
      expect(configServiceMock.rootOrg).toBe('TestRootOrg')
      expect(configServiceMock.org).toEqual(['TestOrg'])
      expect(configServiceMock.activeOrg).toBe('TestOrg')
    })
  })

  describe('locale getter', () => {
    it('should return baseHref without slashes or default to "en"', () => {
      expect(service.locale).toBe('test')
    })
  })

  describe('hasRole', () => {
    it('should return true if any role matches environment portalRoles', () => {
      environment.portalRoles = ['ADMIN', 'USER']

      expect(service.hasRole(['ADMIN'])).toBeTruthy()
      expect(service.hasRole(['GUEST'])).toBeFalsy()
    })
  })

  describe('Icon Registration', () => {
    it('should register SVG icons during construction', () => {
      const expectedIcons = [
        'pin', 'facebook', 'linked-in',
        'twitter', 'goi', 'hubs'
      ]

      expectedIcons.forEach(icon => {
        expect(matIconRegistryMock.addSvgIcon).toHaveBeenCalledWith(
          icon,
          expect.any(String)
        )
      })
    })
  })

  // More complex method tests would require more setup and mocking
  describe('init method', () => {
    it('should handle initialization for public paths', async () => {
      // Simulate public path
      Object.defineProperty(window, 'location', {
        value: { pathname: '/public' },
        writable: true
      })

      const result = await service.init()
      expect(result).toBeTruthy()
    })
  })
})