import { EventBannerComponent } from './event-banner.component'
import { Router } from '@angular/router'
import { ActivatedRoute } from '@angular/router'
import { ChangeDetectorRef } from '@angular/core'
import { Subscription } from 'rxjs'

describe('EventBannerComponent', () => {
    let component: EventBannerComponent
    let mockRouter: Router
    let mockActivatedRoute: ActivatedRoute
    let mockChangeDetectorRef: ChangeDetectorRef

    beforeEach(() => {
        mockRouter = { navigate: jest.fn() } as unknown as Router
        mockActivatedRoute = {} as ActivatedRoute
        mockChangeDetectorRef = { detectChanges: jest.fn() } as unknown as ChangeDetectorRef

        component = new EventBannerComponent(
            mockRouter,
            mockActivatedRoute,
            mockChangeDetectorRef
        )

        // Mock the timer subscription to avoid waiting
        jest.spyOn(component, 'ngOnInit').mockImplementation(() => {
            component.sessionTime = [60000, 120000] // sample session times
            component.allRemainingTime = [
                { hours: 1, mins: 0 },
                { hours: 2, mins: 0 },
            ]
        })
    })

    afterEach(() => {
        if (component['currentSubscription']) {
            component['currentSubscription'].unsubscribe()
        }
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize sessionTime and allRemainingTime on ngOnInit', () => {
        component.ngOnInit()
        expect(component.sessionTime.length).toBe(2) // expecting two session times
        expect(component.allRemainingTime.length).toBe(2) // expecting two time objects
        expect(component.allRemainingTime[0].hours).toBe(1)
        expect(component.allRemainingTime[1].hours).toBe(2)
    })

    it('should call navigate on register button click', () => {
        component.onClickRegister()
        expect(mockRouter.navigate).toHaveBeenCalledWith(['sessions'], { relativeTo: mockActivatedRoute })
        expect(component.isRegisteredUser).toBe(false) // toggling the value of isRegisteredUser
    })

    it('should calculate remaining time correctly in convertMinutes', () => {
        const result = component.convertMinutes(7200000) // 2 hours in milliseconds
        expect(result.hours).toBe(2)
        expect(result.mins).toBe(0)
    })

    it('should handle slideTo correctly', () => {
        component.slideTo(1)
        expect(component.currentIndex).toBe(1) // it should change the index to 1
    })

    it('should unsubscribe from currentSubscription on ngOnDestroy', () => {
        const unsubscribeSpy = jest.fn()
        // We will mock the unsubscribe function for currentSubscription
        component['currentSubscription'] = { unsubscribe: unsubscribeSpy } as unknown as Subscription

        component.ngOnDestroy()
        expect(unsubscribeSpy).toHaveBeenCalled()
    })

    it('should calculate correct session times in calculateTime', () => {
        component.data = {
            SessionCards: {
                Sessions: {
                    session1: {
                        SessionStartTime: new Date(Date.now() + 600000).toString(),
                    },
                    session2: {
                        SessionStartTime: new Date(Date.now() + 1200000).toString(),
                    },
                },
            },
        }

        component.calculateTime()
        expect(component.sessionTime.length).toBe(2)
    })
})
