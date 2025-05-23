import { HomeComponent } from './home.component'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { DomSanitizer } from '@angular/platform-browser'
import { Router, NavigationEnd } from '@angular/router'
import { Subject } from 'rxjs'

describe('HomeComponent', () => {
    let component: HomeComponent
    let mockConfigSvc: jest.Mocked<ConfigurationsService>
    let mockDomSanitizer: jest.Mocked<DomSanitizer>
    let mockRouter: jest.Mocked<Router>
    let routerEventsSubject: Subject<any>

    beforeEach(() => {
        // Create mock services
        mockConfigSvc = {
            instanceConfig: null
        } as jest.Mocked<ConfigurationsService>

        mockDomSanitizer = {
            bypassSecurityTrustResourceUrl: jest.fn()
        } as unknown as jest.Mocked<DomSanitizer>

        routerEventsSubject = new Subject()
        mockRouter = {
            events: routerEventsSubject.asObservable()
        } as jest.Mocked<Router>

        // Create component instance
        component = new HomeComponent(mockConfigSvc, mockDomSanitizer, mockRouter)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('Constructor', () => {
        it('should create component with default values', () => {
            expect(component).toBeDefined()
            expect(component.appIcon).toBe('')
            expect(component.stepCount).toBe(1)
            expect(component.appName).toBe('')
            expect(component.showStepCount).toBe(false)
        })

        it('should subscribe to router events', () => {
            const subscribeSpy = jest.spyOn(routerEventsSubject, 'subscribe')

            // Create new component to trigger constructor
            new HomeComponent(mockConfigSvc, mockDomSanitizer, mockRouter)

            expect(subscribeSpy).toHaveBeenCalled()
        })
    })

    describe('Router Events Handling', () => {
        it('should set stepCount to 1 and showStepCount to true when URL includes "lang"', () => {
            const navigationEndEvent = new NavigationEnd(1, '/some/lang/path', '/some/lang/path')

            routerEventsSubject.next(navigationEndEvent)

            expect(component.stepCount).toBe(1)
            expect(component.showStepCount).toBe(true)
        })

        it('should set stepCount to 2 and showStepCount to true when URL includes "tnc"', () => {
            const navigationEndEvent = new NavigationEnd(1, '/some/tnc/path', '/some/tnc/path')

            routerEventsSubject.next(navigationEndEvent)

            expect(component.stepCount).toBe(2)
            expect(component.showStepCount).toBe(true)
        })

        it('should set stepCount to 3 and showStepCount to true when URL includes "about-video"', () => {
            const navigationEndEvent = new NavigationEnd(1, '/some/about-video/path', '/some/about-video/path')

            routerEventsSubject.next(navigationEndEvent)

            expect(component.stepCount).toBe(3)
            expect(component.showStepCount).toBe(true)
        })

        it('should set stepCount to 4 and showStepCount to true when URL includes "interest"', () => {
            const navigationEndEvent = new NavigationEnd(1, '/some/interest/path', '/some/interest/path')

            routerEventsSubject.next(navigationEndEvent)

            expect(component.stepCount).toBe(4)
            expect(component.showStepCount).toBe(true)
        })

        it('should set showStepCount to false when URL does not match any conditions', () => {
            // First set showStepCount to true
            component.showStepCount = true

            const navigationEndEvent = new NavigationEnd(1, '/some/other/path', '/some/other/path')

            routerEventsSubject.next(navigationEndEvent)

            expect(component.showStepCount).toBe(false)
        })

        it('should not react to non-NavigationEnd events', () => {
            const initialStepCount = component.stepCount
            const initialShowStepCount = component.showStepCount

            // Send a different type of router event
            routerEventsSubject.next({ type: 'SomeOtherEvent' })

            expect(component.stepCount).toBe(initialStepCount)
            expect(component.showStepCount).toBe(initialShowStepCount)
        })

        it('should handle multiple URL patterns in sequence', () => {
            // Test lang -> tnc -> about-video -> interest -> other
            const events = [
                new NavigationEnd(1, '/lang', '/lang'),
                new NavigationEnd(2, '/tnc', '/tnc'),
                new NavigationEnd(3, '/about-video', '/about-video'),
                new NavigationEnd(4, '/interest', '/interest'),
                new NavigationEnd(5, '/home', '/home')
            ]

            const expectedResults = [
                { stepCount: 1, showStepCount: true },
                { stepCount: 2, showStepCount: true },
                { stepCount: 3, showStepCount: true },
                { stepCount: 4, showStepCount: true },
                { stepCount: 4, showStepCount: false } // stepCount remains same, showStepCount becomes false
            ]

            events.forEach((event, index) => {
                routerEventsSubject.next(event)
                expect(component.stepCount).toBe(expectedResults[index].stepCount)
                expect(component.showStepCount).toBe(expectedResults[index].showStepCount)
            })
        })
    })

    describe('ngOnInit', () => {
        it('should not set appName and appIcon when instanceConfig is null', () => {
            mockConfigSvc.instanceConfig = null

            component.ngOnInit()

            expect(component.appName).toBe('')
            expect(component.appIcon).toBe('')
            expect(mockDomSanitizer.bypassSecurityTrustResourceUrl).not.toHaveBeenCalled()
        })

        it('should not set appName and appIcon when instanceConfig is undefined', () => {
            mockConfigSvc.instanceConfig = undefined as any

            component.ngOnInit()

            expect(component.appName).toBe('')
            expect(component.appIcon).toBe('')
            expect(mockDomSanitizer.bypassSecurityTrustResourceUrl).not.toHaveBeenCalled()
        })

        it('should set appName and appIcon when instanceConfig is available', () => {
            const mockSafeUrl = 'safe-url-mock'
            // const mockInstanceConfig = {
            //     details: {
            //         appName: 'Test App'
            //     },
            //     logos: {
            //         appTransparent: 'test-logo-url'
            //     }
            // }

            //mockConfigSvc.instanceConfig = mockInstanceConfig
            mockDomSanitizer.bypassSecurityTrustResourceUrl.mockReturnValue(mockSafeUrl as any)

            component.ngOnInit()

            expect(component.appName).toBe('Test App')
            expect(component.appIcon).toBe(mockSafeUrl)
            expect(mockDomSanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith('test-logo-url')
        })

        it('should handle instanceConfig with missing details', () => {
            const mockInstanceConfig = {
                logos: {
                    appTransparent: 'test-logo-url'
                }
            } as any

            mockConfigSvc.instanceConfig = mockInstanceConfig

            expect(() => component.ngOnInit()).toThrow()
        })

        it('should handle instanceConfig with missing logos', () => {
            const mockInstanceConfig = {
                details: {
                    appName: 'Test App'
                }
            } as any

            mockConfigSvc.instanceConfig = mockInstanceConfig

            expect(() => component.ngOnInit()).toThrow()
        })
    })

    describe('Integration Tests', () => {
        it('should handle router navigation and config initialization together', () => {
            const mockSafeUrl = 'safe-url-mock'
            // const mockInstanceConfig = {
            //     details: {
            //         appName: 'Integration Test App'
            //     },
            //     logos: {
            //         appTransparent: 'integration-logo-url'
            //     }
            // }

            // mockConfigSvc.instanceConfig = mockInstanceConfig
            mockDomSanitizer.bypassSecurityTrustResourceUrl.mockReturnValue(mockSafeUrl as any)

            // Initialize component
            component.ngOnInit()

            // Trigger navigation
            const navigationEndEvent = new NavigationEnd(1, '/lang/setup', '/lang/setup')
            routerEventsSubject.next(navigationEndEvent)

            // Verify both functionalities work
            expect(component.appName).toBe('Integration Test App')
            expect(component.appIcon).toBe(mockSafeUrl)
            expect(component.stepCount).toBe(1)
            expect(component.showStepCount).toBe(true)
        })
    })
})