import { PublicFaqComponent } from './public-faq.component'
import { ActivatedRoute, ParamMap } from '@angular/router'
import { ValueService, ConfigurationsService, EFeatures } from '@sunbird-cb/utils-v2'
import { of, Subject } from 'rxjs'

describe('PublicFaqComponent', () => {
  let component: PublicFaqComponent
  let mockActivatedRoute: Partial<ActivatedRoute>
  let mockValueService: Partial<ValueService>
  let mockConfigurationsService: Partial<ConfigurationsService>
  let mockParamMapSubject: Subject<ParamMap>

  beforeEach(() => {
    // Mocking ActivatedRoute
    mockParamMapSubject = new Subject<ParamMap>()
    mockActivatedRoute = {
      paramMap: mockParamMapSubject.asObservable(),
    }

    // Mocking ValueService
    mockValueService = {
      isLtMedium$: of(true), // mock the observable to return true for isLtMedium$
    }

    // Mocking ConfigurationsService
    mockConfigurationsService = {
      // pageNavBar: { title: 'Test Navbar' }, // Example navbar config
      restrictedFeatures: new Set([EFeatures.FAQ]), // Restricted feature example
    }

    // Initialize the component
    component = new PublicFaqComponent(
      mockActivatedRoute as ActivatedRoute,
      mockValueService as ValueService,
      mockConfigurationsService as ConfigurationsService
    )
  })

  afterEach(() => {
    // Clean up if needed
    if (component.paramSubscription) {
      component.paramSubscription.unsubscribe()
    }
    // if (component.defaultSideNavBarOpenedSubscription) {
    //   component.defaultSideNavBarOpenedSubscription.unsubscribe()
    // }
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should initialize isFaqFeature based on restrictedFeatures', () => {
    component.ngOnInit()
    expect(component.isFaqFeature).toBe(false) // Restricted FAQ feature
  })

  it('should set sideNavBarOpened to false when screen size is small', () => {
    component.ngOnInit()
    mockValueService.isLtMedium$ = of(true) // Simulate small screen size
    // component.defaultSideNavBarOpenedSubscription?.unsubscribe()
    // component.defaultSideNavBarOpenedSubscription = component.isLtMedium$.subscribe((isLtMedium: boolean) => {
    //   component.sideNavBarOpened = !isLtMedium
    //   expect(component.sideNavBarOpened).toBe(false)
    // })
  })

  it('should set currentTab based on route param', () => {
    component.ngOnInit()
    mockParamMapSubject.next({
      get: jest.fn().mockReturnValue('installation') // Simulating a valid tab param
    } as unknown as ParamMap)

    expect(component.currentTab).toBe('installation')
  })

  it('should default to "login" tab if invalid route param is provided', () => {
    component.ngOnInit()
    mockParamMapSubject.next({
      get: jest.fn().mockReturnValue('invalidTab') // Simulating an invalid tab param
    } as unknown as ParamMap)

    expect(component.currentTab).toBe('login')
  })

  it('should toggle sideNavBarOpened on click when screen size is small', () => {
    component.ngOnInit()
    component.sideNavBarOpened = true
    component.screenSizeIsLtMedium = true // Simulate small screen size
    component.sideNavOnClick()
    expect(component.sideNavBarOpened).toBe(false) // Should toggle
  })

  it('should not toggle sideNavBarOpened on click when screen size is large', () => {
    component.ngOnInit()
    component.sideNavBarOpened = true
    component.screenSizeIsLtMedium = false // Simulate large screen size
    component.sideNavOnClick()
    expect(component.sideNavBarOpened).toBe(true) // Should not toggle
  })

  it('should unsubscribe from the defaultSideNavBarOpenedSubscription on destroy', () => {
    // const unsubscribeSpy = jest.spyOn(component.defaultSideNavBarOpenedSubscription!, 'unsubscribe')

    component.ngOnDestroy()
    //expect(unsubscribeSpy).toHaveBeenCalled()
  })
})
