import { ChangeDetectorRef } from '@angular/core'
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router'
import { BtnPageBackService } from '@sunbird-cb/collection'
import { ConfigurationsService, ValueService } from '@sunbird-cb/utils'
import { of, Subject } from 'rxjs'
import { RootComponent } from './root.component'
import { MobileAppsService } from '../../services/mobile-apps.service'
import { RootService } from './root.service'

describe('RootComponent', () => {
    let component: RootComponent
    let mockRouter: jest.Mocked<Router>
    let mockConfigSvc: jest.Mocked<ConfigurationsService>
    let mockValueSvc: jest.Mocked<ValueService>
    let mockMobileAppsSvc: jest.Mocked<MobileAppsService>
    let mockRootSvc: jest.Mocked<RootService>
    let mockBtnBackSvc: jest.Mocked<BtnPageBackService>
    let mockChangeDetector: jest.Mocked<ChangeDetectorRef>
    let routerEventsSubject: Subject<any>
    let showNavbarSubject: Subject<boolean>

    beforeEach(() => {
        routerEventsSubject = new Subject()
        showNavbarSubject = new Subject()

        mockRouter = {
            events: routerEventsSubject.asObservable()
        } as any

        mockConfigSvc = {} as any

        mockValueSvc = {
            isXSmall$: of(false)
        } as any

        mockMobileAppsSvc = {
            init: jest.fn()
        } as any

        mockRootSvc = {
            showNavbarDisplay$: showNavbarSubject.asObservable()
        } as any

        mockBtnBackSvc = {
            initialize: jest.fn()
        } as any

        mockChangeDetector = {
            detectChanges: jest.fn()
        } as any

        component = new RootComponent(
            mockRouter,
            mockConfigSvc,
            mockValueSvc,
            mockMobileAppsSvc,
            mockRootSvc,
            mockBtnBackSvc,
            mockChangeDetector
        )
    })

    afterEach(() => {
        routerEventsSubject.complete()
        showNavbarSubject.complete()
    })

    describe('Constructor', () => {
        it('should initialize mobile apps service', () => {
            expect(mockMobileAppsSvc.init).toHaveBeenCalled()
        })

        it('should set initial values', () => {
            expect(component.routeChangeInProgress).toBe(false)
            expect(component.showNavbar).toBe(false)
            expect(component.isNavBarRequired).toBe(false)
            expect(component.isInIframe).toBe(false)
            expect(component.appStartRaised).toBe(false)
            expect(component.isSetupPage).toBe(false)
        })
    })

    describe('ngOnInit', () => {
        beforeEach(() => {
            // Reset the component to test ngOnInit fresh
            component = new RootComponent(
                mockRouter,
                mockConfigSvc,
                mockValueSvc,
                mockMobileAppsSvc,
                mockRootSvc,
                mockBtnBackSvc,
                mockChangeDetector
            )
        })

        it('should detect iframe context correctly when in iframe', () => {
            const originalSelf = window.self
            const originalTop = window.top

            // Mock being in iframe
            Object.defineProperty(window, 'self', { value: {} })
            Object.defineProperty(window, 'top', { value: {} })

            component.ngOnInit()

            expect(component.isInIframe).toBe(true)

            // Restore original values
            Object.defineProperty(window, 'self', { value: originalSelf })
            Object.defineProperty(window, 'top', { value: originalTop })
        })

        it('should detect iframe context correctly when not in iframe', () => {
            const mockWindow = window
            Object.defineProperty(window, 'self', { value: mockWindow })
            Object.defineProperty(window, 'top', { value: mockWindow })

            component.ngOnInit()

            expect(component.isInIframe).toBe(false)
        })

        it('should handle iframe detection error gracefully', () => {
            const originalSelf = window.self

            // Mock error scenario
            Object.defineProperty(window, 'self', {
                get: () => {
                    throw new Error('Access denied')
                }
            })

            component.ngOnInit()

            expect(component.isInIframe).toBe(false)

            // Restore
            Object.defineProperty(window, 'self', { value: originalSelf })
        })

        it('should initialize button back service', () => {
            component.ngOnInit()
            expect(mockBtnBackSvc.initialize).toHaveBeenCalled()
        })

        it('should set appStartRaised to true', () => {
            component.ngOnInit()
            expect(component.appStartRaised).toBe(true)
        })

        it('should subscribe to router events', () => {
            component.ngOnInit()
            expect(routerEventsSubject.observers.length).toBeGreaterThan(0)
        })

        it('should subscribe to navbar display changes', () => {
            component.ngOnInit()
            expect(showNavbarSubject.observers.length).toBeGreaterThan(0)
        })
    })

    describe('Router Events Handling', () => {
        beforeEach(() => {
            component.ngOnInit()
        })

        describe('NavigationStart Events', () => {
            it('should set isNavBarRequired to false for preview URLs', () => {
                const event = new NavigationStart(1, '/some/preview/url')

                routerEventsSubject.next(event)

                expect(component.isNavBarRequired).toBe(false)
                expect(component.routeChangeInProgress).toBe(true)
                expect(mockChangeDetector.detectChanges).toHaveBeenCalled()
            })

            it('should set isNavBarRequired to false for embed URLs', () => {
                const event = new NavigationStart(1, '/some/embed/url')

                routerEventsSubject.next(event)

                expect(component.isNavBarRequired).toBe(false)
                expect(component.routeChangeInProgress).toBe(true)
            })

            it('should set isNavBarRequired to false for author URLs when in iframe', () => {
                component.isInIframe = true
                const event = new NavigationStart(1, '/author/some-content')

                routerEventsSubject.next(event)

                expect(component.isNavBarRequired).toBe(false)
                expect(component.routeChangeInProgress).toBe(true)
            })

            it('should set isNavBarRequired to true for author URLs when not in iframe', () => {
                component.isInIframe = false
                const event = new NavigationStart(1, '/author/some-content')

                routerEventsSubject.next(event)

                expect(component.isNavBarRequired).toBe(true)
                expect(component.routeChangeInProgress).toBe(true)
            })

            it('should set isNavBarRequired to true for regular URLs', () => {
                const event = new NavigationStart(1, '/regular/url')

                routerEventsSubject.next(event)

                expect(component.isNavBarRequired).toBe(true)
                expect(component.routeChangeInProgress).toBe(true)
            })
        })

        describe('NavigationEnd Events', () => {
            it('should set routeChangeInProgress to false and update currentUrl', () => {
                const event = new NavigationEnd(1, '/test/url', '/test/url')

                routerEventsSubject.next(event)

                expect(component.routeChangeInProgress).toBe(false)
                expect(component.currentUrl).toBe('/test/url')
                expect(mockChangeDetector.detectChanges).toHaveBeenCalled()
            })

            it('should set isSetupPage to true for setup URLs', () => {
                const event = new NavigationEnd(1, '/setup/initial', '/setup/initial')

                routerEventsSubject.next(event)

                expect(component.isSetupPage).toBe(true)
            })

            it('should not set isSetupPage for non-setup URLs', () => {
                const event = new NavigationEnd(1, '/regular/page', '/regular/page')

                routerEventsSubject.next(event)

                expect(component.isSetupPage).toBe(false)
            })

            it('should reset appStartRaised when it was previously true', () => {
                component.appStartRaised = true
                const event = new NavigationEnd(1, '/test/url', '/test/url')

                routerEventsSubject.next(event)

                expect(component.appStartRaised).toBe(false)
            })

            it('should not change appStartRaised when it was already false', () => {
                component.appStartRaised = false
                const event = new NavigationEnd(1, '/test/url', '/test/url')

                routerEventsSubject.next(event)

                expect(component.appStartRaised).toBe(false)
            })
        })

        describe('NavigationCancel Events', () => {
            it('should set routeChangeInProgress to false and update currentUrl', () => {
                const event = new NavigationCancel(1, '/test/url', 'User cancelled')

                routerEventsSubject.next(event)

                expect(component.routeChangeInProgress).toBe(false)
                expect(component.currentUrl).toBe('/test/url')
                expect(mockChangeDetector.detectChanges).toHaveBeenCalled()
            })
        })

        describe('NavigationError Events', () => {
            it('should set routeChangeInProgress to false and update currentUrl', () => {
                const event = new NavigationError(1, '/test/url', new Error('Navigation failed'))

                routerEventsSubject.next(event)

                expect(component.routeChangeInProgress).toBe(false)
                expect(component.currentUrl).toBe('/test/url')
                expect(mockChangeDetector.detectChanges).toHaveBeenCalled()
            })
        })
    })

    describe('Navbar Display Subscription', () => {
        beforeEach(() => {
            component.ngOnInit()
        })

        it('should update showNavbar when navbar display changes', (done) => {
            // Test with delay - we need to wait for the delay(500) to complete
            setTimeout(() => {
                showNavbarSubject.next(true)

                setTimeout(() => {
                    expect(component.showNavbar).toBe(true)

                    showNavbarSubject.next(false)

                    setTimeout(() => {
                        expect(component.showNavbar).toBe(false)
                        done()
                    }, 600)
                }, 600)
            }, 100)
        })
    })

    describe('ngAfterViewInit', () => {
        it('should execute without errors', () => {
            expect(() => component.ngAfterViewInit()).not.toThrow()
        })
    })

    describe('ViewChild Properties', () => {
        it('should initialize ViewChild properties as null', () => {
            expect(component.previewContainerViewRef).toBeNull()
            expect(component.appUpdateTitleRef).toBeNull()
            expect(component.appUpdateBodyRef).toBeNull()
        })
    })

    describe('Observable Properties', () => {
        it('should have isXSmall$ observable from ValueService', () => {
            expect(component.isXSmall$).toBe(mockValueSvc.isXSmall$)
        })
    })
})