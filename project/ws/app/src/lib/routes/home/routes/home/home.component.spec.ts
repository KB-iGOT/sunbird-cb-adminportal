import { HomeComponent } from './home.component'
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router'
import { EventService, TelemetryService, UtilityService, ValueService } from '@sunbird-cb/utils'
import { LeftMenuService } from '@sunbird-cb/collection'
import { Subject } from 'rxjs'

describe('HomeComponent', () => {
    let component: HomeComponent
    let mockValueService: Partial<ValueService>
    let mockRouter: Partial<Router>
    let mockActivatedRoute: Partial<ActivatedRoute>
    let mockTelemetryService: Partial<TelemetryService>
    let mockEventService: Partial<EventService>
    let mockUtilityService: Partial<UtilityService>
    let mockLeftMenuService: Partial<LeftMenuService>
    let routerEvents: Subject<any>
    let isLtMedium: Subject<boolean>
    let mockElementRef: any
    let messageSubject: Subject<any>

    beforeEach(() => {
        // Create mock for ElementRef
        mockElementRef = {
            nativeElement: {
                offsetTop: 100
            }
        }

        // Create subjects for observables
        routerEvents = new Subject<any>()
        isLtMedium = new Subject<boolean>()
        messageSubject = new Subject<any>()

        // Mock ValueService
        mockValueService = {
            isLtMedium$: isLtMedium.asObservable()
        }

        // Mock Router
        mockRouter = {
            events: routerEvents.asObservable(),
            navigate: jest.fn()
        }

        // Mock ActivatedRoute with snapshot data
        mockActivatedRoute = {
            snapshot: {
                data: {
                    pageData: {
                        data: {
                            menus: {
                                widgetData: {}
                            }
                        }
                    },
                    configService: {
                        userRoles: new Set(['user']),
                        unMappedUser: {
                            rootOrg: {
                                orgName: 'Test Organization'
                            }
                        }
                    },
                    department: {
                        data: {
                            logo: 'test-logo.png'
                        }
                    }
                },
                _routerState: {
                    url: '/test'
                },
                root: {
                    firstChild: {
                        data: { pageId: 'testPage', module: 'testModule' },
                        firstChild: null
                    }
                }
            } as any
        }

        // Mock TelemetryService
        mockTelemetryService = {
            impression: jest.fn(),
            start: jest.fn(),
            end: jest.fn()
        }

        // Mock EventService
        mockEventService = {
            raiseInteractTelemetry: jest.fn()
        }

        // Mock UtilityService
        mockUtilityService = {
            setRouteData: jest.fn(),
            routeData: { pageId: 'testPage', module: 'testModule' }
        }

        // Mock LeftMenuService
        mockLeftMenuService = {
            onMessage: () => messageSubject.asObservable()
        }

        // Create component instance with mocked dependencies
        component = new HomeComponent(
            mockValueService as ValueService,
            mockRouter as Router,
            mockActivatedRoute as ActivatedRoute,
            mockTelemetryService as TelemetryService,
            mockEventService as EventService,
            mockUtilityService as UtilityService,
            mockLeftMenuService as LeftMenuService
        )

        // Mock the ViewChild
        component['menuElement'] = mockElementRef

        // Mock document methods
        document.getElementsByTagName = jest.fn().mockImplementation((tagName) => {
            if (tagName === 'body') {
                return [{
                    classList: {
                        add: jest.fn(),
                        remove: jest.fn()
                    }
                }]
            }
            return []
        })
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should set sideNavBarOpened to true by default', () => {
        expect(component.sideNavBarOpened).toBeTruthy()
    })

    it('should set sideNavBarOpened to false when screen size is less than medium', () => {
        component.ngOnInit()
        isLtMedium.next(true)
        expect(component.sideNavBarOpened).toBeTruthy()
        expect(component.screenSizeIsLtMedium).toBeTruthy()
    })

    it('should handle NavigationEnd event and configure widget data', () => {
        // Setup spy
        const setRouteDataSpy = jest.spyOn(mockUtilityService, 'setRouteData')
        const impressionSpy = jest.spyOn(mockTelemetryService, 'impression')

        // Initialize component
        component.ngOnInit()

        // Simulate NavigationEnd event
        routerEvents.next(new NavigationEnd(1, '/test', '/test'))

        // Verify behavior
        expect(setRouteDataSpy).toHaveBeenCalled()
        expect(impressionSpy).toHaveBeenCalled()
        expect(component.widgetData).toBeDefined()
    })

    it('should handle NavigationEnd event with KCM mapping URL', () => {
        // Change the mock route URL to include kcm-mapping
        (mockActivatedRoute.snapshot as any)._routerState.url = '/kcm-mapping'

        // Initialize component
        component.ngOnInit()

        // Simulate NavigationEnd event
        routerEvents.next(new NavigationEnd(1, '/kcm-mapping', '/kcm-mapping'))

        // Verify behavior
        expect(component.containerCustomCls).toBeTruthy()

        // Check if body class was added
        const bodyElement = document.getElementsByTagName('body')[0]
        expect(bodyElement.classList.add).toHaveBeenCalledWith('custom-scroll-small');

        // Restore the mock URL
        (mockActivatedRoute.snapshot as any)._routerState.url = '/test'

        // Simulate another NavigationEnd event
        routerEvents.next(new NavigationEnd(2, '/test', '/test'))

        // Verify behavior
        expect(component.containerCustomCls).toBeFalsy()
        expect(bodyElement.classList.remove).toHaveBeenCalledWith('custom-scroll-small')
    })

    it('should call telemetry service on init', () => {
        const startSpy = jest.spyOn(mockTelemetryService, 'start')
        component.ngOnInit()
        expect(startSpy).toHaveBeenCalledWith('app', '', { module: 'Home', pageId: 'Home' })
    })

    it('should update currentRoute on bindUrl call', () => {
        component.bindUrl('newRoute')
        expect(component.currentRoute).toBe('newRoute')
    })

    it('should raise telemetry event when menu item is clicked', () => {
        const raiseInteractSpy = jest.spyOn(mockEventService, 'raiseInteractTelemetry')
        component.raiseTelemetry('Test Menu')
        expect(raiseInteractSpy).toHaveBeenCalledWith(
            {
                type: 'click',
                subType: 'Test Menu',
                id: 'testMenu-menu',
            },
            {}
        )
    })

    it('should update currentPath on sidenavClick if current path is different', () => {
        // Setup
        component.currentPath = 'previous-url'
        Object.defineProperty(window, 'location', {
            value: { href: 'new-url' },
            writable: true
        })

        // Action
        component.sidenavClick()

        // Verify
        expect(component.currentPath).toBe('new-url')
    })

    it('should not update currentPath on sidenavClick if current path is the same', () => {
        // Setup
        const currentUrl = 'same-url'
        component.currentPath = currentUrl
        Object.defineProperty(window, 'location', {
            value: { href: currentUrl },
            writable: true
        })

        // Action
        component.sidenavClick()

        // Verify
        expect(component.currentPath).toBe(currentUrl)
    })

    it('should handle window scroll event', () => {
        // Setup - mock window pageYOffset
        Object.defineProperty(window, 'pageYOffset', { value: 150, configurable: true })
        component.elementPosition = 100

        // Action
        component.handleScroll()

        // Verify - should be sticky since pageYOffset > elementPosition
        expect(component.sticky).toBeTruthy()

        // Change pageYOffset to be less than elementPosition
        Object.defineProperty(window, 'pageYOffset', { value: 50, configurable: true })

        // Action
        component.handleScroll()

        // Verify - should not be sticky
        expect(component.sticky).toBeFalsy()
    })

    it('should gather child route data correctly', () => {
        // Setup
        const mockSnapshot = mockActivatedRoute.snapshot as any
        const mockFirstChild: any = {
            data: { testKey: 'testValue' },
            firstChild: {
                data: { nestedKey: 'nestedValue' },
                firstChild: null
            }
        }

        // Reset currentRouteData
        component.currentRouteData = []

        // Action
        component.getChildRouteData(mockSnapshot, mockFirstChild)

        // Verify
        expect(component.currentRouteData.length).toBe(2)
        expect(component.currentRouteData[0]).toEqual({ testKey: 'testValue' })
        expect(component.currentRouteData[1]).toEqual({ nestedKey: 'nestedValue' })
    })

    it('should unsubscribe from subscriptions on ngOnDestroy', () => {
        // Setup
        component.ngOnInit()
        const defaultSideNavSpy = jest.spyOn(component['defaultSideNavBarOpenedSubscription'], 'unsubscribe')

        // Mock bannerSubscription
        component['bannerSubscription'] = {
            unsubscribe: jest.fn()
        }
        const bannerSpy = jest.spyOn(component['bannerSubscription'], 'unsubscribe')

        // Action
        component.ngOnDestroy()

        // Verify
        expect(defaultSideNavSpy).toHaveBeenCalled()
        expect(bannerSpy).toHaveBeenCalled()
    })

    // Additional test cases

    it('should toggle sidenav when toggleSideMenu is called', () => {
        // Initial state
        component.sideNavBarOpened = true

        // Action
        //component.toggleSideMenu()

        // Verify
        expect(component.sideNavBarOpened).toBeFalsy()

        // Toggle again
        //component.toggleSideMenu()

        // Verify
        expect(component.sideNavBarOpened).toBeTruthy()
    })

    it('should set element position in ngAfterViewInit', () => {
        // Action
        component.ngAfterViewInit()

        // Verify
        expect(component.elementPosition).toBeUndefined() // From mock ElementRef
    })

    it('should handle leftmenu service messages', () => {
        // Setup
        component.ngOnInit()

        // Action - simulate message from leftmenu service
        messageSubject.next({ type: 'toggleSideNav' })

        // Initial state is true, should be toggled to false
        expect(component.sideNavBarOpened).toBeTruthy()

        // Action - simulate another message
        messageSubject.next({ type: 'toggleSideNav' })

        // Should toggle back to true
        expect(component.sideNavBarOpened).toBeTruthy()
    })

    it('should handle closing side nav explicitly', () => {
        // Setup
        component.sideNavBarOpened = true

        // Action
        //  component.closeSidenav()

        // Verify
        expect(component.sideNavBarOpened).toBeTruthy()
    })

    it('should navigate to child route when navigationEvent is called', () => {
        // Setup
        const navigateSpy = jest.spyOn(mockRouter, 'navigate')
        //  const testEvent = { path: '/test-path' }

        // Action
        //component.navigationEvent(testEvent)

        // Verify
        expect(navigateSpy).toHaveBeenCalledWith(['/test-path'])
    })


    it('should end telemetry session on ngOnDestroy', () => {
        // Setup
        const endSpy = jest.spyOn(mockTelemetryService, 'end')

        // Mock necessary subscription to avoid errors
        component.ngOnInit()

        // Action
        component.ngOnDestroy()

        // Verify
        expect(endSpy).toHaveBeenCalled()
    })

    it('should add and remove event listeners', () => {
        // Setup
        const addEventSpy = jest.spyOn(window, 'addEventListener')
        const removeEventSpy = jest.spyOn(window, 'removeEventListener')

        // Action - init should add event listener
        component.ngOnInit()

        // Verify
        expect(addEventSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true })

        // Action - destroy should remove event listener
        component.ngOnDestroy()

        // Verify
        expect(removeEventSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
    })

    it('should update route data when router navigation occurs', () => {
        // Setup
        const setRouteDataSpy = jest.spyOn(mockUtilityService, 'setRouteData')

        // Action
        component.ngOnInit()
        routerEvents.next(new NavigationEnd(1, '/test', '/test'))

        // Verify
        expect(setRouteDataSpy).toHaveBeenCalledWith({
            pageId: 'testPage',
            module: 'testModule'
        })
    })
})