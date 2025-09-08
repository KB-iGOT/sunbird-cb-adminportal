import { MobileAppHomeComponent } from './mobile-app-home.component'
import { DomSanitizer, SafeUrl } from '@angular/platform-browser'
import { ActivatedRoute } from '@angular/router'
import { MobileAppsService } from 'src/app/services/mobile-apps.service'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { Platform } from '@angular/cdk/platform'
import { of } from 'rxjs'

describe('MobileAppHomeComponent', () => {
  let component: MobileAppHomeComponent
  let sanitizer: DomSanitizer
  let route: ActivatedRoute
  let mobileService: MobileAppsService
  let configSvc: ConfigurationsService
  let matPlatform: Platform

  beforeEach(() => {
    sanitizer = { bypassSecurityTrustUrl: jest.fn() } as unknown as DomSanitizer
    route = {
      data: of({
        pageData: {
          data: {
            appsAndroid: 'android-url',
            appsIos: 'ios-url',
            showQrCode: true,
            isClient: true,
            code: 'some-code',
          },
        },
      }),
    } as unknown as ActivatedRoute
    mobileService = { iOsAppRef: false, isAndroidApp: false } as unknown as MobileAppsService
    configSvc = { pageNavBar: {} } as unknown as ConfigurationsService
    matPlatform = { IOS: false } as unknown as Platform

    component = new MobileAppHomeComponent(sanitizer, route, matPlatform, mobileService, configSvc)
  })

  it('should initialize component and set mobileLinks', (done) => {
    component.ngOnInit()
    // Subscribe to route data and wait for the data to be received
    component.routeSubscription?.add(() => {
      expect(component.mobileLinks).toBeDefined()
      expect(component.mobileLinks?.appsAndroid).toBe('android-url')
      expect(component.mobileLinks?.appsIos).toBe('ios-url')
      expect(component.isClient).toBe(true)
      expect(component.mobilePlatformCode).toBe('some-code')
      done()
    })
  })

  it('should sanitize the ios URL correctly', () => {
    // Mocking sanitizer
    const sanitizedUrl: SafeUrl = {} as SafeUrl
    sanitizer.bypassSecurityTrustUrl = jest.fn().mockReturnValue(sanitizedUrl)

    component.ngOnInit()

    expect(sanitizer.bypassSecurityTrustUrl).toHaveBeenCalledWith('ios-url')
    expect(component.mobileLinks?.appsIosSanitized).toBe(sanitizedUrl)
  })

  it('should set isAndroidPlayStoreLink to true if showQrCode is true', (done) => {
    component.ngOnInit()
    // Subscribe to route data and wait for the data to be received
    component.routeSubscription?.add(() => {
      expect(component.isAndroidPlayStoreLink).toBe(true)
      done()
    })
  })

  it('should unsubscribe from routeSubscription on ngOnDestroy', () => {
    const unsubscribeSpy = jest.spyOn(component.routeSubscription!, 'unsubscribe')
    component.ngOnDestroy()
    expect(unsubscribeSpy).toHaveBeenCalled()
  })

  it('should correctly set isAndriod and isIos based on mobileService', () => {
    // Simulate iOS app reference
    // mobileService.iOsAppRef = true
    // mobileService.isAndroidApp = false
    component.ngOnInit()

    expect(component.isAndriod).toBe(false)
    expect(component.isIos).toBe(true)

    // Simulate Android app
    // mobileService.iOsAppRef = false
    // mobileService.isAndroidApp = true
    component.ngOnInit()

    expect(component.isAndriod).toBe(true)
    expect(component.isIos).toBe(false)
  })
})
