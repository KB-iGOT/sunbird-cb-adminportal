import { SimpleChange, SimpleChanges } from '@angular/core'
import { Router, NavigationStart, NavigationEnd } from '@angular/router'
import { DomSanitizer } from '@angular/platform-browser'
import { Subject } from 'rxjs'

import { AppNavBarComponent } from './app-nav-bar.component'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { CustomTourService } from '@sunbird-cb/collection'

describe('AppNavBarComponent', () => {
  // Mock class implementations with full observable support
  class MockRouter {
    events: Subject<any> = new Subject<any>();
  }

  class MockConfigurationsService {
    restrictedFeatures = new Set<string>();
    instanceConfig = {
      logos: {
        app: 'app-logo-url',
        appBottomNav: 'bottom-nav-logo-url',
      },
      showNavBarInSetup: true,
    };
    rootOrg = 'test-org';
    primaryNavBar = { color: 'test-color' };
    pageNavBar = { color: 'page-color' };
    primaryNavBarConfig = { config: 'test-config' };
    appsConfig = {
      features: {
        feature1: {},
        feature2: {},
      },
    };
    tourGuideNotifier = new Subject<boolean>();
    prefChangeNotifier = new Subject<any>();
    completedTour = false;
  }

  class MockTourService {
    isTourComplete = new Subject<boolean>();

    createPopupTour = jest.fn().mockReturnValue({ id: 'popup-tour' });
    startTour = jest.fn();
    startPopupTour = jest.fn();
    cancelPopupTour = jest.fn();
  }

  class MockDomSanitizer {
    bypassSecurityTrustResourceUrl = jest.fn().mockReturnValue('sanitized-url');
  }

  let component: AppNavBarComponent
  let configService: MockConfigurationsService
  let domSanitizer: MockDomSanitizer
  let tourService: MockTourService
  let router: MockRouter

  beforeEach(() => {
    // Create new instances of mocks for each test
    router = new MockRouter()
    configService = new MockConfigurationsService()
    tourService = new MockTourService()
    domSanitizer = new MockDomSanitizer()

    // Create component with mocks
    component = new AppNavBarComponent(
      domSanitizer as unknown as DomSanitizer,
      configService as unknown as ConfigurationsService,
      tourService as unknown as CustomTourService,
      router as unknown as Router
    )
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should initialize with default values and subscribe to events in ngOnInit', () => {
    // Call ngOnInit to initialize the component
    component.ngOnInit()

    expect(component.mode).toBe('top')
    expect(component.btnAppsConfig).toBeDefined()
    expect(component.appIcon).toBe('sanitized-url')
    expect(component.instanceVal).toBe('test-org')
    expect(component.appBottomIcon).toBe('sanitized-url')
    expect(component.primaryNavbarBackground).toEqual({ color: 'test-color' })
    expect(component.pageNavbar).toEqual({ color: 'page-color' })
    expect(component.primaryNavbarConfig).toEqual({ config: 'test-config' })
    expect(component.featureApps).toEqual(['feature1', 'feature2'])
  })

  it('should handle mode changes', () => {
    // Initialize component first
    component.ngOnInit()

    // Initial state (mode = 'top')
    expect(component.btnAppsConfig.widgetData.showTitle).toBeUndefined()

    // Simulate ngOnChanges with mode change to 'bottom'
    const changes: SimpleChanges = {
      mode: new SimpleChange('top', 'bottom', false)
    }
    component.mode = 'bottom'
    component.ngOnChanges(changes)

    // Check if config is updated correctly
    expect(component.btnAppsConfig.widgetData.showTitle).toBe(true)

    // Change back to 'top'
    const changesBack: SimpleChanges = {
      mode: new SimpleChange('bottom', 'top', false)
    }
    component.mode = 'top'
    component.ngOnChanges(changesBack)

    // Check if config is reset
    expect(component.btnAppsConfig.widgetData.showTitle).toBeUndefined()
  })

  it('should handle navigation events', () => {
    // Initialize component first
    component.ngOnInit()

    // Test NavigationStart event
    router.events.next(new NavigationStart(1, '/test'))
    expect(tourService.cancelPopupTour).toHaveBeenCalled()

    // Reset mocks
    jest.clearAllMocks()

    // Test NavigationEnd event with public/logout url
    router.events.next(new NavigationEnd(1, '/public/logout', '/public/logout'))
    expect(component.showAppNavBar).toBe(false)
    expect(tourService.cancelPopupTour).toHaveBeenCalled()

    // Reset mocks
    jest.clearAllMocks()

    // Test NavigationEnd event with app/setup url
    configService.instanceConfig.showNavBarInSetup = false
    router.events.next(new NavigationEnd(2, '/app/setup', '/app/setup'))
    expect(component.showAppNavBar).toBe(false)

    // Reset mocks
    jest.clearAllMocks()

    // Test NavigationEnd event with normal url
    router.events.next(new NavigationEnd(3, '/dashboard', '/dashboard'))
    expect(component.showAppNavBar).toBe(true)
  })

  it('should handle tour guide notifications', () => {
    // Initialize component first
    component.ngOnInit()

    // Reset previously called mocks
    jest.clearAllMocks()

    // Set up conditions for tour guide to be available
    configService.restrictedFeatures = new Set<string>()

    // Emit tour guide notification
    configService.tourGuideNotifier.next(true)

    // Check if tour guide is available
    expect(component.isTourGuideAvailable).toBe(true)
    expect(tourService.createPopupTour).toHaveBeenCalled()
    expect(component.popupTour).toEqual({ id: 'popup-tour' })
  })

  it('should not show tour guide when feature is restricted', () => {
    // Set up conditions for tour guide to be restricted
    configService.restrictedFeatures = new Set<string>(['tourGuide'])

    // Initialize component
    component.ngOnInit()

    // Reset previously called mocks
    jest.clearAllMocks()

    // Emit tour guide notification
    configService.tourGuideNotifier.next(true)

    // Check if tour guide is not available
    expect(component.isTourGuideAvailable).toBe(false)
    expect(tourService.createPopupTour).not.toHaveBeenCalled()
  })

  it('should start and complete tour correctly', () => {
    // Initialize component first
    component.ngOnInit()

    // Setup the spy for setTimeout
    jest.useFakeTimers()

    // Start the tour
    component.startTour()
    expect(tourService.startTour).toHaveBeenCalled()

    // Complete the tour
    tourService.isTourComplete.next(true)

    // Verify actions after tour completion
    expect(tourService.startPopupTour).toHaveBeenCalled()
    expect(configService.completedTour).toBe(true)

    // Fast-forward timers
    jest.runAllTimers()

    // Verify popup tour cancellation
    expect(tourService.cancelPopupTour).toHaveBeenCalled()

    // Restore timers
    jest.useRealTimers()
  })

  it('should cancel tour', () => {
    // Initialize component first
    component.ngOnInit()

    // Setup popup tour
    component.popupTour = { id: 'test-tour' }

    // Reset mocks
    jest.clearAllMocks()

    // Cancel tour
    component.cancelTour()

    // Verify cancellation
    expect(tourService.cancelPopupTour).toHaveBeenCalled()
    expect(component.isTourGuideClosed).toBe(false)
  })

  it('should handle help menu restrictions', () => {
    // Set help menu as restricted
    configService.restrictedFeatures = new Set<string>(['helpNavBarMenu'])

    // Create a new component with these restrictions
    component = new AppNavBarComponent(
      domSanitizer as unknown as DomSanitizer,
      configService as unknown as ConfigurationsService,
      tourService as unknown as CustomTourService,
      router as unknown as Router
    )

    // Initialize component
    component.ngOnInit()

    // Check if help menu is restricted
    expect(component.isHelpMenuRestricted).toBe(true)
  })
})