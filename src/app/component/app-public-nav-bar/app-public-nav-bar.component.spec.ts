import { AppPublicNavBarComponent } from './app-public-nav-bar.component'
import { DomSanitizer, SafeUrl } from '@angular/platform-browser'
import { ConfigurationsService, NsPage } from '@sunbird-cb/utils'

describe('AppPublicNavBarComponent', () => {
  let component: AppPublicNavBarComponent
  let mockDomSanitizer: jest.Mocked<DomSanitizer>
  let mockConfigSvc: jest.Mocked<ConfigurationsService>

  beforeEach(() => {
    // Create mocks for the dependencies
    mockDomSanitizer = {
      bypassSecurityTrustResourceUrl: jest.fn(),
    } as any

    mockConfigSvc = {
      instanceConfig: {
        logos: {
          appTransparent: 'app-icon-url',
        },
        details: {
          appName: 'MyApp',
        },
      },
      primaryNavBar: { background: 'blue' } as Partial<NsPage.INavBackground>,
    } as any

    // Create the component instance
    component = new AppPublicNavBarComponent(mockDomSanitizer, mockConfigSvc)
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should initialize appIcon, appName, and navBar on ngOnInit', () => {
    // Mock return value for bypassSecurityTrustResourceUrl
    const mockSafeUrl = 'mock-safe-url' as SafeUrl
    mockDomSanitizer.bypassSecurityTrustResourceUrl.mockReturnValue(mockSafeUrl)

    // Call ngOnInit method
    component.ngOnInit()

    // Assert that the appIcon, appName, and navBar are set correctly
    expect(component.appIcon).toBe(mockSafeUrl)
    expect(component.appName).toBe('MyApp')
    expect(component.navBar).toEqual({ background: 'blue' })
  })

  it('should have showPublicNavbar as true', () => {
    expect(component.showPublicNavbar).toBe(true)
  })
})
