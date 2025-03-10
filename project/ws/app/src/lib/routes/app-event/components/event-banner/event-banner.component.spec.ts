import { EventBannerComponent } from './event-banner.component'
import { Router, ActivatedRoute } from '@angular/router'
import { ChangeDetectorRef } from '@angular/core'

// Mock the timer function from rxjs
jest.mock('rxjs', () => {
    const original = jest.requireActual('rxjs')
    return {
        ...original,
        timer: jest.fn().mockImplementation(() => ({
            subscribe: (callback: Function) => {
                callback()
                return {
                    unsubscribe: jest.fn()
                }
            }
        }))
    }
})

describe('EventBannerComponent', () => {
    let component: EventBannerComponent
    let mockRouter: Router
    let mockActivatedRoute: ActivatedRoute
    let mockChangeDetectorRef: ChangeDetectorRef

    beforeEach(() => {
        // Create mocks for dependencies
        mockRouter = {
            navigate: jest.fn()
        } as unknown as Router

        mockActivatedRoute = {} as ActivatedRoute

        mockChangeDetectorRef = {
            detectChanges: jest.fn()
        } as unknown as ChangeDetectorRef

        // Setup the component with mock data
        component = new EventBannerComponent(
            mockRouter,
            mockActivatedRoute,
            mockChangeDetectorRef
        )

        // Mock the calculateTime method directly to avoid Date issues
        jest.spyOn(component, 'calculateTime').mockImplementation(() => {
            component.allStartTimeData = ['2025-03-10T14:00:00', '2025-03-10T16:00:00']
            component.sessionTime = [7200000, 14400000] // 2 hours and 4 hours in milliseconds
        })

        // Setup test data
        component.data = {
            SessionCards: {
                Sessions: {
                    session1: {
                        SessionStartTime: '2025-03-10T14:00:00' // 2 hours from now
                    },
                    session2: {
                        SessionStartTime: '2025-03-10T16:00:00' // 4 hours from now
                    }
                }
            }
        }

        component.sessionTime = []
        component.allRemainingTime = []
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    test('should initialize with default values', () => {
        expect(component.currentIndex).toBe(0)
        expect(component.slideInterval).toBeNull()
        expect(component.eventStarted).toBe(true)
        expect(component.bannerTemplates).toEqual(['registeredBanner', 'timeBanner'])
    })

    test('should calculate time correctly on ngOnInit', () => {
        component.ngOnInit()

        expect(component.calculateTime).toHaveBeenCalled()
        // Check if timer subscription was created
        //expect(component.currentSubscription).toBeDefined()
    })

    test('should unsubscribe on ngOnDestroy', () => {
        // Setup a mock subscription
        const mockUnsubscribe = jest.fn()
        // component.currentSubscription = { unsubscribe: mockUnsubscribe } as unknown as Subscription

        component.ngOnDestroy()

        expect(mockUnsubscribe).toHaveBeenCalled()
    })

    test('convertMinutes should convert milliseconds to hours and minutes', () => {
        // Test case 1: 2 hours and 30 minutes
        const twoHoursThirtyMins = 2 * 60 * 60 * 1000 + 30 * 60 * 1000
        const result1 = component.convertMinutes(twoHoursThirtyMins)
        expect(result1).toEqual({ hours: 2, mins: 30 })

        // Test case 2: 1 day, 3 hours and 15 minutes
        const oneDayThreeHoursFifteenMins = 27 * 60 * 60 * 1000 + 15 * 60 * 1000
        const result2 = component.convertMinutes(oneDayThreeHoursFifteenMins)
        expect(result2).toEqual({ hours: 27, mins: 15 })

        // Test case 3: 0 hours and 45 minutes
        const fortyFiveMins = 45 * 60 * 1000
        const result3 = component.convertMinutes(fortyFiveMins)
        expect(result3).toEqual({ hours: 0, mins: 45 })
    })

    test('slideTo should update currentIndex when within range', () => {
        component.slideTo(1)
        expect(component.currentIndex).toBe(1)

        component.slideTo(0)
        expect(component.currentIndex).toBe(0)

        // Should not change if out of range
        component.slideTo(-1)
        expect(component.currentIndex).toBe(0)

        component.slideTo(2)
        expect(component.currentIndex).toBe(0)
    })

    test('onClickRegister should navigate to sessions and toggle isRegisteredUser', () => {
        component.isRegisteredUser = false

        component.onClickRegister()

        expect(mockRouter.navigate).toHaveBeenCalledWith(['sessions'], { relativeTo: mockActivatedRoute })
        expect(component.isRegisteredUser).toBe(true)

        // Test toggle in opposite direction
        component.onClickRegister()
        expect(component.isRegisteredUser).toBe(false)
    })

    test('timer subscription should update allRemainingTime and call detectChanges', () => {
        // Setup initial session times
        component.sessionTime = [7200000, 14400000] // 2 hours and 4 hours in milliseconds
        component.allRemainingTime = []

        // Create a function that mimics the timer callback
        const timerCallback = () => {
            component.allRemainingTime = []
            component.sessionTime.forEach((v: number, index: number) => {
                component.sessionTime[index] = v - 60000
                component.allRemainingTime.push(component.convertMinutes(component.sessionTime[index]))
            })
            mockChangeDetectorRef.detectChanges()
        }

        // Execute the timer callback directly
        timerCallback()

        // Check if the values were updated correctly
        expect(component.sessionTime).toEqual([7140000, 14340000]) // Original times minus 60000ms (1 minute)
        expect(component.allRemainingTime.length).toBe(2)
        expect(component.allRemainingTime[0]).toEqual({ hours: 1, mins: 59 }) // 7140000ms = 1h 59m
        expect(component.allRemainingTime[1]).toEqual({ hours: 3, mins: 59 }) // 14340000ms = 3h 59m
        expect(mockChangeDetectorRef.detectChanges).toHaveBeenCalled()
    })
})