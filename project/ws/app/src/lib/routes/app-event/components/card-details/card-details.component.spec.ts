import { CardDetailsComponent } from './card-details.component'
import { ChangeDetectorRef } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { ISpeakerDetails } from '../../interfaces/speaker-details.model'
import { IUserDetails } from '../../interfaces/user-details.model'
import { IEventDetails } from '../../interfaces/event-details.model'

describe('CardDetailsComponent', () => {
    let component: CardDetailsComponent
    let mockChangeDetectorRef: jest.Mocked<ChangeDetectorRef>
    let mockRouter: jest.Mocked<Router>
    let mockActivatedRoute: jest.Mocked<ActivatedRoute>

    beforeEach(() => {
        // Create mocks
        mockChangeDetectorRef = {
            detectChanges: jest.fn(),
            markForCheck: jest.fn(),
            detach: jest.fn(),
            reattach: jest.fn(),
            checkNoChanges: jest.fn()
        } as any

        mockRouter = {
            navigate: jest.fn()
        } as any

        mockActivatedRoute = {} as any

        // Create component instance
        component = new CardDetailsComponent(
            mockChangeDetectorRef,
            mockActivatedRoute,
            mockRouter
        )
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('Component Initialization', () => {
        it('should create component with default values', () => {
            expect(component).toBeTruthy()
            expect(component.userDetails).toEqual([])
            expect(component.speakerDetails).toEqual([])
            expect(component.eventDetails).toEqual([])
            expect(component.cardType).toBe('user')
            expect(component.liveSpeaker).toEqual([])
            expect(component.sortedSpeaker).toEqual([])
            expect(component.navigationExtras).toEqual({})
            expect(component.currDate).toBeInstanceOf(Date)
        })

        it('should call ngOnInit without errors', () => {
            expect(() => component.ngOnInit()).not.toThrow()
        })
    })

    describe('sortSpeaker method', () => {
        it('should return -1 when first speaker has earlier start time', () => {
            const speakerA: ISpeakerDetails = { startRemainingTime: 1000 } as ISpeakerDetails
            const speakerB: ISpeakerDetails = { startRemainingTime: 2000 } as ISpeakerDetails

            const result = component.sortSpeaker(speakerA, speakerB)
            expect(result).toBe(-1)
        })

        it('should return 1 when first speaker has later start time', () => {
            const speakerA: ISpeakerDetails = { startRemainingTime: 2000 } as ISpeakerDetails
            const speakerB: ISpeakerDetails = { startRemainingTime: 1000 } as ISpeakerDetails

            const result = component.sortSpeaker(speakerA, speakerB)
            expect(result).toBe(1)
        })

        it('should return 0 when speakers have equal start times', () => {
            const speakerA: ISpeakerDetails = { startRemainingTime: 1000 } as ISpeakerDetails
            const speakerB: ISpeakerDetails = { startRemainingTime: 1000 } as ISpeakerDetails

            const result = component.sortSpeaker(speakerA, speakerB)
            expect(result).toBe(0)
        })

        it('should return 0 when startRemainingTime is undefined', () => {
            const speakerA: ISpeakerDetails = {} as ISpeakerDetails
            const speakerB: ISpeakerDetails = {} as ISpeakerDetails

            const result = component.sortSpeaker(speakerA, speakerB)
            expect(result).toBe(0)
        })

        it('should return 0 when one speaker has undefined startRemainingTime', () => {
            const speakerA: ISpeakerDetails = { startRemainingTime: 1000 } as ISpeakerDetails
            const speakerB: ISpeakerDetails = {} as ISpeakerDetails

            const result = component.sortSpeaker(speakerA, speakerB)
            expect(result).toBe(0)
        })
    })

    describe('convertMinutes method', () => {
        it('should convert milliseconds to hours and minutes correctly', () => {
            const minsRemaining = 3661000 // 1 hour and 1 minute in milliseconds
            const result = component.convertMinutes(minsRemaining)

            expect(result.hours).toBe(1)
            expect(result.mins).toBe(1)
        })

        it('should handle days conversion correctly', () => {
            const minsRemaining = 90061000 // 1 day, 1 hour and 1 minute in milliseconds
            const result = component.convertMinutes(minsRemaining)

            expect(result.hours).toBe(25) // 24 + 1
            expect(result.mins).toBe(1)
        })

        it('should handle zero minutes', () => {
            const minsRemaining = 0
            const result = component.convertMinutes(minsRemaining)

            expect(result.hours).toBe(0)
            expect(result.mins).toBe(0)
        })

        it('should handle partial minutes', () => {
            const minsRemaining = 30000 // 30 seconds in milliseconds
            const result = component.convertMinutes(minsRemaining)

            expect(result.hours).toBe(0)
            expect(result.mins).toBe(0) // Should floor to 0
        })
    })

    describe('ngAfterViewChecked method', () => {
        it('should call sortedSpeakerFunction when speakerDetails exist', () => {
            const mockSpeakerDetails: ISpeakerDetails[] = [
                { startRemainingTime: 1000 } as ISpeakerDetails,
                { startRemainingTime: 500 } as ISpeakerDetails
            ]

            component.speakerDetails = mockSpeakerDetails
            jest.spyOn(component, 'sortedSpeakerFunction')
            jest.spyOn(Array.prototype, 'sort')

            component.ngAfterViewChecked()

            expect(Array.prototype.sort).toHaveBeenCalledWith(component.sortSpeaker)
            expect(component.sortedSpeakerFunction).toHaveBeenCalled()
            expect(mockChangeDetectorRef.detectChanges).toHaveBeenCalled()
        })

        it('should not call sortedSpeakerFunction when speakerDetails is empty', () => {
            component.speakerDetails = []
            jest.spyOn(component, 'sortedSpeakerFunction')

            component.ngAfterViewChecked()

            expect(component.sortedSpeakerFunction).not.toHaveBeenCalled()
            expect(mockChangeDetectorRef.detectChanges).toHaveBeenCalled()
        })

        it('should not call sortedSpeakerFunction when speakerDetails is undefined', () => {
            component.speakerDetails = undefined
            jest.spyOn(component, 'sortedSpeakerFunction')

            component.ngAfterViewChecked()

            expect(component.sortedSpeakerFunction).not.toHaveBeenCalled()
            expect(mockChangeDetectorRef.detectChanges).toHaveBeenCalled()
        })
    })

    describe('sortedSpeakerFunction method', () => {
        beforeEach(() => {
            component.sortedSpeaker = []
        })

        it('should correctly sort active and ended sessions', () => {
            const mockSpeakerDetails: ISpeakerDetails[] = [
                {
                    sessionID: '1',
                    startRemainingTime: 1000,
                    endRemaningTime: 2000
                } as ISpeakerDetails,
                {
                    sessionID: '2',
                    startRemainingTime: -1000,
                    endRemaningTime: -500
                } as ISpeakerDetails,
                {
                    sessionID: '3',
                    startRemainingTime: -500,
                    endRemaningTime: 1000
                } as ISpeakerDetails
            ]

            component.speakerDetails = mockSpeakerDetails
            component.sortedSpeakerFunction()

            expect(component.sortedSpeaker).toHaveLength(2)
            expect(component.sortedSpeaker[0].sessionID).toBe('1')
            expect(component.sortedSpeaker[1].sessionID).toBe('2')
            expect(component.navigationExtras.state).toEqual({ speakerDetails: component.sortedSpeaker })
        })

        it('should handle speakers with live sessions (negative start, positive end)', () => {
            const mockSpeakerDetails: ISpeakerDetails[] = [
                {
                    sessionID: '1',
                    startRemainingTime: -1000,
                    endRemaningTime: 2000
                } as ISpeakerDetails
            ]

            component.speakerDetails = mockSpeakerDetails
            component.sortedSpeakerFunction()

            expect(component.sortedSpeaker).toHaveLength(0)
        })

        it('should handle empty speaker details', () => {
            component.speakerDetails = []
            component.sortedSpeakerFunction()

            expect(component.sortedSpeaker).toEqual([])
        })

        it('should handle undefined speaker details', () => {
            component.speakerDetails = undefined
            component.sortedSpeakerFunction()

            expect(component.sortedSpeaker).toEqual([])
        })

        it('should handle speakers with undefined timing properties', () => {
            const mockSpeakerDetails: ISpeakerDetails[] = [
                { sessionID: '1' } as ISpeakerDetails,
                {
                    sessionID: '2',
                    startRemainingTime: undefined,
                    endRemaningTime: 1000
                } as ISpeakerDetails
            ]

            component.speakerDetails = mockSpeakerDetails
            component.sortedSpeakerFunction()

            expect(component.sortedSpeaker).toHaveLength(2)
        })
    })

    describe('onClickSessionCard method', () => {
        beforeEach(() => {
            component.sortedSpeaker = [
                { sessionID: 'session1' } as ISpeakerDetails,
                { sessionID: 'session2' } as ISpeakerDetails
            ]
        })

        it('should navigate to session details with correct parameters', () => {
            const index = 0
            component.onClickSessionCard(index)

            expect(component.navigationExtras.state).toEqual({ sessionID: 'session1' })
            expect(mockRouter.navigate).toHaveBeenCalledWith(
                ['../session-details', 1],
                {
                    state: { sessionID: 'session1' },
                    relativeTo: mockActivatedRoute
                }
            )
        })

        it('should handle different index values', () => {
            const index = 1
            component.onClickSessionCard(index)

            expect(component.navigationExtras.state).toEqual({ sessionID: 'session2' })
            expect(mockRouter.navigate).toHaveBeenCalledWith(
                ['../session-details', 2],
                {
                    state: { sessionID: 'session2' },
                    relativeTo: mockActivatedRoute
                }
            )
        })

        it('should not navigate when index is out of bounds', () => {
            const index = 5
            component.onClickSessionCard(index)

            expect(mockRouter.navigate).not.toHaveBeenCalled()
        })

        it('should not navigate when sortedSpeaker is empty', () => {
            component.sortedSpeaker = []
            const index = 0
            component.onClickSessionCard(index)

            expect(mockRouter.navigate).not.toHaveBeenCalled()
        })

        it('should not navigate when speaker at index is undefined', () => {
            component.sortedSpeaker = [undefined as any]
            const index = 0
            component.onClickSessionCard(index)

            expect(mockRouter.navigate).not.toHaveBeenCalled()
        })
    })

    describe('Input Properties', () => {
        it('should accept userDetails input', () => {
            const mockUserDetails: IUserDetails[] = []
            component.userDetails = mockUserDetails

            expect(component.userDetails).toEqual(mockUserDetails)
        })

        it('should accept speakerDetails input', () => {
            const mockSpeakerDetails: ISpeakerDetails[] = [{ sessionID: '1' } as ISpeakerDetails]
            component.speakerDetails = mockSpeakerDetails

            expect(component.speakerDetails).toEqual(mockSpeakerDetails)
        })

        it('should accept eventDetails input', () => {
            const mockEventDetails: IEventDetails[] = []
            component.eventDetails = mockEventDetails

            expect(component.eventDetails).toEqual(mockEventDetails)
        })

        it('should accept cardType input', () => {
            component.cardType = 'speaker'
            expect(component.cardType).toBe('speaker')

            component.cardType = 'event'
            expect(component.cardType).toBe('event')

            component.cardType = 'liveSpeaker'
            expect(component.cardType).toBe('liveSpeaker')
        })

        it('should accept liveSpeaker input', () => {
            const mockLiveSpeaker: ISpeakerDetails[] = [{ sessionID: '1' } as ISpeakerDetails]
            component.liveSpeaker = mockLiveSpeaker

            expect(component.liveSpeaker).toEqual(mockLiveSpeaker)
        })
    })
})