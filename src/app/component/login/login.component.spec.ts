// login.component.spec.ts
import { LoginComponent } from './login.component'
import { DomSanitizer } from '@angular/platform-browser'
import { ActivatedRoute, ActivatedRouteSnapshot, ParamMap } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { of } from 'rxjs'

describe('LoginComponent', () => {
  let component: LoginComponent
  let mockActivatedRoute: Partial<ActivatedRoute>
  let mockConfigSvc: Partial<ConfigurationsService>
  let mockDomSanitizer: Partial<DomSanitizer>

  const mockPageData = {
    pageData: {
      data: {
        isClient: true,
        topbar: {
          title: 'Test Title',
          subTitle: 'Test Subtitle'
        },
        footer: {
          descriptiveFooter: {
            description: 'Test footer',
            links: []
          },
          contactUs: true
        }
      }
    }
  }

  beforeEach(() => {
    // Mock DomSanitizer
    mockDomSanitizer = {
      bypassSecurityTrustResourceUrl: jest.fn().mockReturnValue('sanitized-url')
    }

    // Mock ConfigurationsService with type assertion
    mockConfigSvc = {
      instanceConfig: {
        logos: {
          appTransparent: 'app-logo-url',
          company: 'company-logo-url',
          developedBy: 'Developed By Test Company'
        }
      } as any // Use type assertion to bypass type checking
    }

    // Create a mock ParamMap
    const mockParamMap: ParamMap = {
      has: jest.fn().mockReturnValue(false),
      get: jest.fn().mockReturnValue(null),
      getAll: jest.fn().mockReturnValue([]),
      keys: []
    }

    // Create a more complete mock for ActivatedRouteSnapshot
    const mockRouteSnapshot: Partial<ActivatedRouteSnapshot> = {
      url: [],
      params: {},
      queryParams: {},
      fragment: null,
      data: {},
      outlet: 'primary',
      component: null,
      routeConfig: null,
      root: {} as ActivatedRouteSnapshot,
      parent: null,
      firstChild: null,
      children: [],
      pathFromRoot: [],
      paramMap: mockParamMap,
      queryParamMap: mockParamMap
    }

    // Mock ActivatedRoute
    mockActivatedRoute = {
      data: of(mockPageData),
      snapshot: mockRouteSnapshot as ActivatedRouteSnapshot
    }

    // Create component instance with mocked dependencies
    component = new LoginComponent(
      mockActivatedRoute as ActivatedRoute,
      mockConfigSvc as ConfigurationsService,
      mockDomSanitizer as DomSanitizer
    )
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should initialize product logo and app icon from config service', () => {
    // Verify the constructor logic
    expect(mockDomSanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith('app-logo-url')
    expect(component.appIcon).toBe('sanitized-url')
    expect(component.productLogo).toBe('company-logo-url')
    expect(component.developedBy).toBe('Developed By Test Company')
  })

  it('should initialize with null values when instanceConfig is not available', () => {
    // Reset the component
    mockConfigSvc.instanceConfig = undefined

    const newComponent = new LoginComponent(
      mockActivatedRoute as ActivatedRoute,
      mockConfigSvc as ConfigurationsService,
      mockDomSanitizer as DomSanitizer
    )

    expect(newComponent.appIcon).toBeNull()
    expect(newComponent.productLogo).toBe('')
    expect(newComponent.developedBy).toBe('')
  })

  it('should set properties from route data on initialization', () => {
    // Call ngOnInit to trigger subscription
    component.ngOnInit()

    // Verify the properties are set correctly
    expect(component.isClientLogin).toBe(true)
    expect(component.title).toBe('Test Title')
    expect(component.subTitle).toBe('Test Subtitle')
    expect(component.contactUs).toBe(true)
    expect(component.welcomeFooter).toEqual({
      description: 'Test footer',
      links: []
    })
  })

  it('should unsubscribe on destroy', () => {
    // Setup spy on unsubscribe
    component.ngOnInit()

    // @ts-ignore - accessing private property for testing
    const unsubscribeSpy = jest.spyOn(component.subscriptionLogin, 'unsubscribe')

    // Call ngOnDestroy
    component.ngOnDestroy()

    // Verify unsubscribe was called
    expect(unsubscribeSpy).toHaveBeenCalled()
  })

  it('should not throw error if subscription is null on destroy', () => {
    // @ts-ignore - setting private property for testing
    component.subscriptionLogin = null

    // This should not throw an error
    expect(() => {
      component.ngOnDestroy()
    }).not.toThrow()
  })
})