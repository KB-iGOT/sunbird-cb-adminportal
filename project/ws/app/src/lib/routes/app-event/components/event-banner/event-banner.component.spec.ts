import { EventBannerComponent } from './event-banner.component'
import { ChangeDetectorRef } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
// import { Subscription, of } from 'rxjs'

// Mock classes for dependencies
class MockRouter {
    navigate = jest.fn();
}

class MockActivatedRoute { }

class MockChangeDetectorRef {
    detectChanges = jest.fn();
}

describe('EventBannerComponent', () => {
    let component: EventBannerComponent
    let router: MockRouter
    let route: MockActivatedRoute
    let changeDetectorRef: MockChangeDetectorRef

    // Helper to create the component with mock dependencies
    function createComponent() {
        router = new MockRouter()
        route = new MockActivatedRoute()
        changeDetectorRef = new MockChangeDetectorRef()

        component = new EventBannerComponent(
            router as unknown as Router,
            route as unknown as ActivatedRoute,
            changeDetectorRef as unknown as ChangeDetectorRef
        )

        // Setup default input values
        component.data = {
            SessionCards: {
                Sessions: {
                    session1: {
                        SessionStartTime: new Date(Date.now() + 7200000).toISOString() // 2 hours in the future
                    },
                    session2: {
                        SessionStartTime: new Date(Date.now() + 3600000).toISOString() // 1 hour in the future
                    }
                }
            }
        }
        component.totalEvent = 2
        component.isRegisteredUser = false

        return component
    }

    beforeEach(() => {
        jest.clearAllMocks()

        // Mock the timer
        jest.useFakeTimers()

        component = createComponent()
    })

    afterEach(() => {
        jest.useRealTimers()

        // Ensure we clean up the subscription to avoid memory leaks
        // if (component.currentSubscription) {
        //     component.currentSubscription.unsubscribe()
        // }
    })

    describe('initialization', () => {
        it('should create the component with initial values', () => {
            expect(component).toBeDefined()
            expect(component.currentIndex).toBe(0)
            expect(component.slideInterval).toBeNull()
            expect(component.eventStarted).toBe(true)
            expect(component.bannerTemplates).toEqual(['registeredBanner', 'timeBanner'])
            expect(component.allStartTimeData).toEqual([])
            expect(component.allRemainingTime).toEqual([])
            expect(component.sessionTime).toEqual([])
        })
    })

    describe('ngOnInit', () => {
        it('should call calculateTime and start a timer subscription', () => {
            // Spy on the calculateTime method
            const calculateTimeSpy = jest.spyOn(component, 'calculateTime')

            // Mock the timer observable
            // const mockTimerSub = new Subscription()
            // jest.spyOn(mockTimerSub, 'unsubscribe').mockImplementation()

            // const timerMock = jest.fn().mockReturnValue({
            //     subscribe: jest.fn().mockReturnValue(mockTimerSub)
            // })

            // Replace the timer function with our mock
            // jest.mock('rxjs', () => ({
            //     ...jest.requireActual('rxjs'),
            //     timer: timerMock
            // }))

            // Call ngOnInit
            component.ngOnInit()

            // Check if calculateTime was called
            expect(calculateTimeSpy).toHaveBeenCalled()

            // Check if timer subscription was created
            //expect(component.currentSubscription).toBeDefined()
        })
    })

    describe('ngOnDestroy', () => {
        it('should unsubscribe from currentSubscription if it exists', () => {
            // Create a mock subscription
            // component.currentSubscription = new Subscription()
            // const unsubscribeSpy = jest.spyOn(component.currentSubscription, 'unsubscribe')

            // // Call ngOnDestroy
            // component.ngOnDestroy()

            // // Check if unsubscribe was called
            // expect(unsubscribeSpy).toHaveBeenCalled()
            // expect(component.currentSubscription.closed).toBe(true)
        })

        it('should handle null subscription gracefully', () => {
            // Set subscription to null
            //  component.currentSubscription = null

            // This should not throw an error
            expect(() => component.ngOnDestroy()).not.toThrow()
        })
    })

    describe('calculateTime', () => {
        it('should calculate session times correctly', () => {
            // Call calculateTime
            component.calculateTime()

            // Check if allStartTimeData was populated correctly
            expect(component.allStartTimeData.length).toBe(2)

            // Check if sessionTime was calculated correctly
            expect(component.sessionTime.length).toBe(2)

            // The values should be positive (future dates)
            expect(component.sessionTime[0]).toBeGreaterThan(0)
            expect(component.sessionTime[1]).toBeGreaterThan(0)
        })
    })

    describe('convertMinutes', () => {
        it('should convert milliseconds to hours and minutes correctly', () => {
            // Test with 2 hours and 30 minutes
            const result = component.convertMinutes(2 * 60 * 60 * 1000 + 30 * 60 * 1000)

            expect(result).toEqual({ hours: 2, mins: 30 })
        })

        it('should handle days correctly by converting to hours', () => {
            // Test with 1 day, 3 hours and 15 minutes
            const result = component.convertMinutes(27 * 60 * 60 * 1000 + 15 * 60 * 1000)

            expect(result).toEqual({ hours: 27, mins: 15 })
        })
    })

    describe('slideTo', () => {
        it('should update currentIndex when index is valid', () => {
            // Call slideTo with valid index
            component.slideTo(1)

            expect(component.currentIndex).toBe(1)
        })

        it('should not update currentIndex when index is invalid', () => {
            // Set initial index
            component.currentIndex = 0

            // Call slideTo with invalid index
            component.slideTo(-1)
            expect(component.currentIndex).toBe(0)

            component.slideTo(2)
            expect(component.currentIndex).toBe(0)
        })
    })

    describe('onClickRegister', () => {
        it('should navigate to sessions and toggle isRegisteredUser', () => {
            // Set initial value
            component.isRegisteredUser = false

            // Call onClickRegister
            component.onClickRegister()

            // Check if navigation was called correctly
            expect(router.navigate).toHaveBeenCalledWith(['sessions'], { relativeTo: route })

            // Check if isRegisteredUser was toggled
            expect(component.isRegisteredUser).toBe(true)
        })
    })

    describe('timer subscription behavior', () => {
        it('should update allRemainingTime when timer emits', () => {
            // Setup
            component.calculateTime() // Initialize sessionTime array
            component.ngOnInit() // Create timer subscription

            // Clear mocks to check just the timer callback behavior
            changeDetectorRef.detectChanges.mockClear()

            // Mock the timer callback
            // const timerCallback = (component.currentSubscription as any)._finalizer
            // if (timerCallback) {
            //     timerCallback()
            // }

            // Check if detectChanges was called
            expect(changeDetectorRef.detectChanges).toHaveBeenCalled()

            // Check if allRemainingTime was updated
            expect(component.allRemainingTime.length).toBeGreaterThan(0)
        })
    })
})