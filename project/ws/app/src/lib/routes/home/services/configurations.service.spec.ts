import { ConfigurationsService } from './configurations.service'
import { BehaviorSubject, ReplaySubject } from 'rxjs'

describe('ConfigurationsService', () => {
  let service: ConfigurationsService

  // Mock window.location object
  const originalWindow = { ...window }
  const mockLocation = {
    host: 'test-host.com'
  }

  beforeEach(() => {
    // Setup window.location mock
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true
    })

    // Create a new instance of the service for each test
    service = new ConfigurationsService()
  })

  afterEach(() => {
    // Restore original window object
    Object.defineProperty(window, 'location', {
      value: originalWindow.location,
      writable: true
    })
  })

  it('should create the service', () => {
    expect(service).toBeTruthy()
  })

  it('should initialize with default properties', () => {
    expect(service.appSetup).toBe(true)
    expect(service.userUrl).toBe('')
    expect(service.baseUrl).toBe('assets/configurations')
    expect(service.sitePath).toBe('assets/configurations')
    expect(service.hostPath).toBe('test-host.com')
    expect(service.userRoles).toBeNull()
    expect(service.userGroups).toBeNull()
    expect(service.restrictedFeatures).toBeNull()
    expect(service.restrictedWidgets).toBeNull()
    expect(service.instanceConfig).toBeNull()
    expect(service.appsConfig).toBeNull()
    expect(service.rootOrg).toBeNull()
    expect(service.org).toBeNull()
    expect(service.activeOrg).toBe('')
    expect(service.isProduction).toBe(false)
    expect(service.hasAcceptedTnc).toBe(false)
    expect(service.profileDetailsStatus).toBe(false)
    expect(service.isActive).toBe(true)
    expect(service.userPreference).toBeNull()
    expect(service.userProfile).toBeNull()
    expect(service.userProfileV2).toBeNull()
    expect(service.nodebbUserProfile).toBeNull()
    expect(service.isAuthenticated).toBe(false)
    expect(service.isNewUser).toBe(false)
  })

  it('should have correctly initialized observable properties', () => {
    expect(service.pinnedApps).toBeInstanceOf(BehaviorSubject)
    expect(service.prefChangeNotifier).toBeInstanceOf(ReplaySubject)
    expect(service.tourGuideNotifier).toBeInstanceOf(ReplaySubject)
    expect(service.authChangeNotifier).toBeInstanceOf(ReplaySubject)

    // Test initial value of pinnedApps
    let pinnedAppsValue: Set<string> | undefined
    service.pinnedApps.subscribe(value => {
      pinnedAppsValue = value
    })
    expect(pinnedAppsValue).toEqual(new Set())
  })

  it('should have correctly initialized theme and UI preferences', () => {
    expect(service.activeThemeObject).toBeNull()
    expect(service.activeFontObject).toBeNull()
    expect(service.isDarkMode).toBe(false)
    expect(service.isIntranetAllowed).toBe(false)
    expect(service.isRTL).toBe(false)
    expect(service.activeLocale).toBeNull()
    expect(service.activeLocaleGroup).toBe('')
    expect(service.completedActivity).toBeNull()
    expect(service.completedTour).toBe(false)
  })

  it('should have correct profile settings', () => {
    expect(service.profileSettings).toEqual(['profilePicture', 'learningTime', 'learningPoints'])
  })

  it('should have correct navbar configurations', () => {
    expect(service.primaryNavBar).toEqual({ color: 'primary' })
    expect(service.pageNavBar).toEqual({ color: 'primary' })
    expect(service.primaryNavBarConfig).toBeNull()
  })

  it('should set hostPath based on window.location.host', () => {
    // Update the mock location
    Object.defineProperty(window, 'location', {
      value: { host: 'example.com:8080' },
      writable: true
    })

    // Create a new instance to trigger the constructor
    const newService = new ConfigurationsService()

    // Check if the hostPath is correctly set
    expect(newService.hostPath).toBe('example.com_8080')
  })

  it('should emit values through BehaviorSubject and ReplaySubjects', () => {
    const pinnedAppsSet = new Set(['app1', 'app2'])
    // const userPrefChange = { theme: 'dark' }
    const authChange = true
    const tourGuideValue = true

    // Setup test listeners
    let emittedPinnedApps: Set<string> | undefined
    let emittedPrefChange: any
    let emittedAuthChange: boolean | undefined
    let emittedTourGuide: boolean | undefined

    service.pinnedApps.subscribe(value => emittedPinnedApps = value)
    service.prefChangeNotifier.subscribe(value => emittedPrefChange = value)
    service.authChangeNotifier.subscribe(value => emittedAuthChange = value)
    service.tourGuideNotifier.subscribe(value => emittedTourGuide = value)

    // Emit values
    service.pinnedApps.next(pinnedAppsSet)
    // service.prefChangeNotifier.next(userPrefChange)
    service.authChangeNotifier.next(authChange)
    service.tourGuideNotifier.next(tourGuideValue)

    // Assert emitted values
    expect(emittedPinnedApps).toEqual(pinnedAppsSet)
    expect(emittedPrefChange).toBeUndefined()
    expect(emittedAuthChange).toBe(authChange)
    expect(emittedTourGuide).toBe(tourGuideValue)
  })
})