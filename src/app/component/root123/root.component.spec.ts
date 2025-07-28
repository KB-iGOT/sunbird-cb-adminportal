import { RootComponent } from './root.component'
import { NavigationEnd, NavigationStart, NavigationCancel, NavigationError } from '@angular/router'
import { of, Subject, Subscription } from 'rxjs'

// Mock classes and interfaces
class MockRouter {
    events = new Subject();
}

class MockConfigurationsService {
    // Add any needed configuration properties/methods
}

class MockValueService {
    isXSmall$ = of(false);
}

class MockMobileAppsService {
    init = jest.fn();
}

class MockRootService {
    showNavbarDisplay$ = of(true);
}

class MockBtnPageBackService {
    initialize = jest.fn();
}

class MockChangeDetectorRef {
    detectChanges = jest.fn();
    detach = jest.fn();
}

class MockGlobalEventsService {
    loaderState$ = of(false);
}

class MockViewContainerRef { }

class MockElementRef {
    nativeElement = {};
}

describe('RootComponent', () => {
    let component: RootComponent
    let mockRouter: MockRouter
    let mockConfigSvc: MockConfigurationsService
    let mockValueSvc: MockValueService
    let mockMobileAppsSvc: MockMobileAppsService
    let mockRootSvc: MockRootService
    let mockBtnBackSvc: MockBtnPageBackService
    let mockChangeDetector: MockChangeDetectorRef
    let mockLoader: MockGlobalEventsService

    // Helper to create NavigationEnd event
    const createNavigationEnd = (url: string) => {
        const event = new NavigationEnd(1, url, url)
        return event
    }

    // Helper to create NavigationStart event
    const createNavigationStart = (url: string) => {
        const event = new NavigationStart(1, url)
        return event
    }

    // Helper to create NavigationCancel event
    const createNavigationCancel = (url: string) => {
        const event = new NavigationCancel(1, url, 'cancelled')
        return event
    }

    // Helper to create NavigationError event
    const createNavigationError = (url: string) => {
        const event = new NavigationError(1, url, 'error')
        return event
    }

    beforeEach(() => {
        // Create fresh mocks for each test
        mockRouter = new MockRouter()
        mockConfigSvc = new MockConfigurationsService()
        mockValueSvc = new MockValueService()
        mockMobileAppsSvc = new MockMobileAppsService()
        mockRootSvc = new MockRootService()
        mockBtnBackSvc = new MockBtnPageBackService()
        mockChangeDetector = new MockChangeDetectorRef()
        mockLoader = new MockGlobalEventsService()

        // Create component instance
        component = new RootComponent(
            mockRouter as any,
            mockConfigSvc as any,
            mockValueSvc as any,
            mockMobileAppsSvc as any,
            mockRootSvc as any,
            mockBtnBackSvc as any,
            mockChangeDetector as any,
            mockLoader as any
        )

        // Mock ViewChild references
        component.previewContainerViewRef = new MockViewContainerRef() as any
        component.appUpdateTitleRef = new MockElementRef() as any
        component.appUpdateBodyRef = new MockElementRef() as any
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('Constructor', () => {
        it('should create component and initialize mobile apps service', () => {
            expect(component).toBeDefined()
            expect(mockMobileAppsSvc.init).toHaveBeenCalled()
        })

        it('should initialize default values', () => {
            expect(component.routeChangeInProgress).toBe(false)
            expect(component.showNavbar).toBe(false)
            expect(component.isNavBarRequired).toBe(false)
            expect(component.isInIframe).toBe(false)
            expect(component.appStartRaised).toBe(false)
            expect(component.isSetupPage).toBe(false)
            expect(component.isLoading).toBe(false)
        })

        it('should assign isXSmall$ from ValueService', () => {
            expect(component.isXSmall$).toBe(mockValueSvc.isXSmall$)
        })
    })

    describe('ngOnInit', () => {
        beforeEach(() => {
            // Mock window objects
            Object.defineProperty(window, 'self', { value: window, writable: true })
            Object.defineProperty(window, 'top', { value: window, writable: true })
        })

        it('should detect iframe status when window.self !== window.top', () => {
            Object.defineProperty(window, 'top', { value: 'different', writable: true })

            component.ngOnInit()

            expect(component.isInIframe).toBe(true)
        })

        it('should set isInIframe to false when window.self === window.top', () => {
            component.ngOnInit()

            expect(component.isInIframe).toBe(false)
        })

        it('should handle iframe detection error and set isInIframe to false', () => {
            // Mock getter to throw error
            Object.defineProperty(window, 'top', {
                get: () => { throw new Error('Access denied') }
            })

            component.ngOnInit()

            expect(component.isInIframe).toBe(false)
        })

        it('should initialize btnBackSvc and set appStartRaised to true', () => {
            component.ngOnInit()

            expect(mockBtnBackSvc.initialize).toHaveBeenCalled()
            expect(component.appStartRaised).toBe(true)
        })

        it('should subscribe to router events', () => {
            const subscribeSpy = jest.spyOn(mockRouter.events, 'subscribe')

            component.ngOnInit()

            expect(subscribeSpy).toHaveBeenCalled()
        })

        it('should subscribe to rootSvc.showNavbarDisplay$ with delay', () => {
            const pipeSpy = jest.spyOn(mockRootSvc.showNavbarDisplay$, 'pipe')

            component.ngOnInit()

            expect(pipeSpy).toHaveBeenCalled()
        })

        it('should subscribe to loader.loaderState$', () => {
            const subscribeSpy = jest.spyOn(mockLoader.loaderState$, 'subscribe')

            component.ngOnInit()

            expect(subscribeSpy).toHaveBeenCalled()
        })
    })

    describe('Router Events Handling', () => {
        beforeEach(() => {
            component.ngOnInit()
        })

        describe('NavigationStart Events', () => {
            it('should set isNavBarRequired to false for preview URLs', () => {
                const event = createNavigationStart('/app/preview/content')

                mockRouter.events.next(event)

                expect(component.isNavBarRequired).toBe(false)
                expect(component.routeChangeInProgress).toBe(true)
                expect(mockChangeDetector.detectChanges).toHaveBeenCalled()
            })

            it('should set isNavBarRequired to false for embed URLs', () => {
                const event = createNavigationStart('/app/embed/content')

                mockRouter.events.next(event)

                expect(component.isNavBarRequired).toBe(false)
                expect(component.routeChangeInProgress).toBe(true)
            })

            it('should set isNavBarRequired to false for author URLs when in iframe', () => {
                component.isInIframe = true
                const event = createNavigationStart('/author/editor')

                mockRouter.events.next(event)

                expect(component.isNavBarRequired).toBe(false)
                expect(component.routeChangeInProgress).toBe(true)
            })

            it('should set isNavBarRequired to true for author URLs when not in iframe', () => {
                component.isInIframe = false
                const event = createNavigationStart('/author/editor')

                mockRouter.events.next(event)

                expect(component.isNavBarRequired).toBe(true)
                expect(component.routeChangeInProgress).toBe(true)
            })

            it('should set isNavBarRequired to true for regular URLs', () => {
                const event = createNavigationStart('/app/dashboard')

                mockRouter.events.next(event)

                expect(component.isNavBarRequired).toBe(true)
                expect(component.routeChangeInProgress).toBe(true)
            })
        })

        describe('NavigationEnd Events', () => {
            it('should set isSetupPage to true for setup URLs', () => {
                const event = createNavigationEnd('/setup/configuration')

                mockRouter.events.next(event)

                expect(component.isSetupPage).toBe(true)
                expect(component.routeChangeInProgress).toBe(false)
                expect(component.currentUrl).toBe('/setup/configuration')
                expect(mockChangeDetector.detectChanges).toHaveBeenCalled()
            })

            it('should not set isSetupPage for non-setup URLs', () => {
                const event = createNavigationEnd('/app/dashboard')

                mockRouter.events.next(event)

                expect(component.isSetupPage).toBe(false)
                expect(component.routeChangeInProgress).toBe(false)
                expect(component.currentUrl).toBe('/app/dashboard')
            })

            it('should set appStartRaised to false when appStartRaised is true', () => {
                component.appStartRaised = true
                const event = createNavigationEnd('/app/dashboard')

                mockRouter.events.next(event)

                expect(component.appStartRaised).toBe(false)
            })

            it('should not change appStartRaised when it is already false', () => {
                component.appStartRaised = false
                const event = createNavigationEnd('/app/dashboard')

                mockRouter.events.next(event)

                expect(component.appStartRaised).toBe(false)
            })
        })

        describe('NavigationCancel Events', () => {
            it('should handle NavigationCancel events', () => {
                const event = createNavigationCancel('/app/dashboard')

                mockRouter.events.next(event)

                expect(component.routeChangeInProgress).toBe(false)
                expect(component.currentUrl).toBe('/app/dashboard')
                expect(mockChangeDetector.detectChanges).toHaveBeenCalled()
            })
        })

        describe('NavigationError Events', () => {
            it('should handle NavigationError events', () => {
                const event = createNavigationError('/app/dashboard')

                mockRouter.events.next(event)

                expect(component.routeChangeInProgress).toBe(false)
                expect(component.currentUrl).toBe('/app/dashboard')
                expect(mockChangeDetector.detectChanges).toHaveBeenCalled()
            })
        })
    })

    describe('RootService showNavbarDisplay$ Subscription', () => {
        it('should update showNavbar when showNavbarDisplay$ emits', (done) => {
            const mockSubject = new Subject<boolean>()
            mockRootSvc.showNavbarDisplay$ = mockSubject.asObservable()

            component.ngOnInit()

            // Test with true value
            mockSubject.next(true)

            // Use setTimeout to handle the delay(500) in the pipe
            setTimeout(() => {
                expect(component.showNavbar).toBe(true)

                // Test with false value
                mockSubject.next(false)

                setTimeout(() => {
                    expect(component.showNavbar).toBe(false)
                    done()
                }, 600)
            }, 600)
        })
    })

    describe('GlobalEventsService loaderState$ Subscription', () => {
        it('should update isLoading when loaderState$ emits true', () => {
            const mockSubject = new Subject<boolean>()
            mockLoader.loaderState$ = mockSubject.asObservable()

            component.ngOnInit()

            mockSubject.next(true)

            expect(component.isLoading).toBe(true)
            expect(mockChangeDetector.detectChanges).toHaveBeenCalled()
        })

        it('should update isLoading when loaderState$ emits false', () => {
            const mockSubject = new Subject<boolean>()
            mockLoader.loaderState$ = mockSubject.asObservable()

            component.ngOnInit()

            mockSubject.next(false)

            expect(component.isLoading).toBe(false)
            expect(mockChangeDetector.detectChanges).toHaveBeenCalled()
        })
    })

    describe('ngAfterViewInit', () => {
        it('should execute without errors', () => {
            expect(() => component.ngAfterViewInit()).not.toThrow()
        })
    })

    describe('ngOnDestroy', () => {
        it('should unsubscribe from loaderSubscription when it exists', () => {
            const mockSubscription = {
                unsubscribe: jest.fn()
            }
            component.loaderSubscription = mockSubscription as any

            component.ngOnDestroy()

            expect(mockSubscription.unsubscribe).toHaveBeenCalled()
            expect(mockChangeDetector.detach).toHaveBeenCalled()
        })

        it('should not throw error when loaderSubscription is undefined', () => {
            component.loaderSubscription = undefined as any

            expect(() => component.ngOnDestroy()).not.toThrow()
            expect(mockChangeDetector.detach).toHaveBeenCalled()
        })

        it('should call changeDetector.detach', () => {
            component.ngOnDestroy()

            expect(mockChangeDetector.detach).toHaveBeenCalled()
        })
    })

    describe('ViewChild References', () => {
        it('should have previewContainerViewRef initialized', () => {
            expect(component.previewContainerViewRef).toBeInstanceOf(MockViewContainerRef)
        })

        it('should have appUpdateTitleRef initialized', () => {
            expect(component.appUpdateTitleRef).toBeInstanceOf(MockElementRef)
        })

        it('should have appUpdateBodyRef initialized', () => {
            expect(component.appUpdateBodyRef).toBeInstanceOf(MockElementRef)
        })
    })

    describe('Complex Navigation Scenarios', () => {
        beforeEach(() => {
            component.ngOnInit()
        })

        it('should handle multiple navigation events in sequence', () => {
            // Start navigation
            const startEvent = createNavigationStart('/app/dashboard')
            mockRouter.events.next(startEvent)
            expect(component.routeChangeInProgress).toBe(true)

            // End navigation
            const endEvent = createNavigationEnd('/app/dashboard')
            mockRouter.events.next(endEvent)
            expect(component.routeChangeInProgress).toBe(false)
            expect(component.currentUrl).toBe('/app/dashboard')
        })

        it('should handle navigation start followed by navigation cancel', () => {
            // Start navigation
            const startEvent = createNavigationStart('/app/dashboard')
            mockRouter.events.next(startEvent)
            expect(component.routeChangeInProgress).toBe(true)

            // Cancel navigation
            const cancelEvent = createNavigationCancel('/app/dashboard')
            mockRouter.events.next(cancelEvent)
            expect(component.routeChangeInProgress).toBe(false)
            expect(component.currentUrl).toBe('/app/dashboard')
        })

        it('should handle navigation start followed by navigation error', () => {
            // Start navigation
            const startEvent = createNavigationStart('/app/dashboard')
            mockRouter.events.next(startEvent)
            expect(component.routeChangeInProgress).toBe(true)

            // Error in navigation
            const errorEvent = createNavigationError('/app/dashboard')
            mockRouter.events.next(errorEvent)
            expect(component.routeChangeInProgress).toBe(false)
            expect(component.currentUrl).toBe('/app/dashboard')
        })
    })

    describe('Edge Cases', () => {
        it('should handle empty URL strings', () => {
            component.ngOnInit()

            const event = createNavigationStart('')
            mockRouter.events.next(event)

            expect(component.isNavBarRequired).toBe(true) // Default case
        })

        it('should handle URLs with query parameters', () => {
            component.ngOnInit()

            const event = createNavigationStart('/app/preview/content?id=123')
            mockRouter.events.next(event)

            expect(component.isNavBarRequired).toBe(false)
        })

        it('should handle URLs with fragments', () => {
            component.ngOnInit()

            const event = createNavigationStart('/setup/config#section1')
            mockRouter.events.next(event)

            // Later handle NavigationEnd to test setup detection
            const endEvent = createNavigationEnd('/setup/config#section1')
            mockRouter.events.next(endEvent)

            expect(component.isSetupPage).toBe(true)
        })
    })

    describe('Subscription Management', () => {
        it('should create loaderSubscription during ngOnInit', () => {
            component.ngOnInit()

            expect(component.loaderSubscription).toBeDefined()
            expect(component.loaderSubscription).toBeInstanceOf(Subscription)
        })

        it('should properly manage multiple subscriptions', () => {
            // Mock multiple subscriptions scenario
            const mockSubject1 = new Subject<boolean>()
            const mockSubject2 = new Subject<boolean>()

            mockRootSvc.showNavbarDisplay$ = mockSubject1.asObservable()
            mockLoader.loaderState$ = mockSubject2.asObservable()

            component.ngOnInit()

            // Verify subscriptions are active
            expect(component.loaderSubscription).toBeDefined()

            // Test emissions
            mockSubject1.next(true)
            mockSubject2.next(true)

            expect(component.isLoading).toBe(true)
        })
    })
})