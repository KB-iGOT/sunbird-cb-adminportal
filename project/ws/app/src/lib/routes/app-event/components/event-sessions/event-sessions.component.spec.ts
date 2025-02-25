import { EventSessionsComponent } from './event-sessions.component'
import { of } from 'rxjs'
import { ISpeakerDetails } from '../../interfaces/speaker-details.model'

// Mock data
const mockSessionCardsData = {
    data: {
        eventdata: {
            data: {
                SessionCards: {
                    Sessions: {
                        session1: {
                            SessionType: 'Keynote',
                            SessionImage: 'image1.jpg',
                            SessionTitle: 'Opening Keynote',
                            SessionStartTime: '2023-05-01T09:00:00',
                            Speaker: 'John Doe',
                            Attendees: 150,
                            SessionEndTime: '2023-05-01T10:00:00'
                        },
                        session2: {
                            SessionType: 'Workshop',
                            SessionImage: 'image2.jpg',
                            SessionTitle: 'Angular Best Practices',
                            SessionStartTime: '2023-05-01T11:00:00',
                            Speaker: 'Jane Smith',
                            Attendees: 75,
                            SessionEndTime: '2023-05-01T12:30:00'
                        }
                    }
                }
            }
        }
    }
}

// Mock services and dependencies
describe('EventSessionsComponent', () => {
    let component: EventSessionsComponent
    let mockActivatedRoute: any
    let mockParentActivatedRoute: any
    let mockEventService: any
    let mockChangeDetectorRef: any

    beforeEach(() => {
        // Create parent data observable for ActivatedRoute
        mockParentActivatedRoute = {
            data: of(mockSessionCardsData.data)
        }

        // Create mock ActivatedRoute
        mockActivatedRoute = {
            parent: mockParentActivatedRoute
        }

        // Create mock EventService
        mockEventService = {
            bannerisEnabled: {
                next: jest.fn()
            }
        }

        // Create mock ChangeDetectorRef
        mockChangeDetectorRef = {
            detectChanges: jest.fn()
        }

        // Mock Date functions for time calculation tests
        const mockDateNow = new Date('2023-05-01T08:30:00').getTime()
        jest.spyOn(Date, 'parse').mockImplementation((dateString) => {
            if (dateString === Date()) {
                return mockDateNow
            }
            return new Date(dateString).getTime()
        })

        // Instantiate component with mocks
        component = new EventSessionsComponent(
            mockActivatedRoute as any,
            mockEventService as any,
            mockChangeDetectorRef as any
        )
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    test('should initialize with empty data array', () => {
        expect(component.data).toEqual([])
    })

    test('should enable banner on init', () => {
        component.ngOnInit()
        expect(mockEventService.bannerisEnabled.next).toHaveBeenCalledWith(true)
    })

    test('should transform session data correctly on init', () => {
        // Spy on calculateTime method
        const calculateTimeSpy = jest.spyOn(component, 'calculateTime')

        // Call ngOnInit to trigger data subscription
        component.ngOnInit()

        // Check if data was transformed properly
        expect(component.data.length).toBe(2)
        expect(component.data[0].sessionID).toBe('Session1')
        expect(component.data[0].speakerType).toBe('Keynote')
        expect(component.data[0].speakerImage).toBe('image1.jpg')
        expect(component.data[0].speakerKeynote).toBe('Opening Keynote')
        expect(component.data[0].speakerName).toBe('John Doe')
        expect(component.data[0].registeredUsers).toBe(150)

        expect(component.data[1].sessionID).toBe('Session2')
        expect(component.data[1].speakerType).toBe('Workshop')

        // Verify calculateTime was called
        expect(calculateTimeSpy).toHaveBeenCalled()
    })

    test('should calculate session times correctly', () => {
        // Set up test data
        component.data = [
            {
                sessionID: 'Session1',
                speakerType: 'Keynote',
                speakerImage: 'image1.jpg',
                speakerKeynote: 'Opening Keynote',
                speakerDate: '2023-05-01T09:00:00',
                speakerName: 'John Doe',
                registeredUsers: 150,
                startTime: '2023-05-01T09:00:00',
                endTime: '2023-05-01T10:00:00'
            },
            {
                sessionID: 'Session2',
                speakerType: 'Workshop',
                speakerImage: 'image2.jpg',
                speakerKeynote: 'Angular Best Practices',
                speakerDate: '2023-05-01T11:00:00',
                speakerName: 'Jane Smith',
                registeredUsers: 75,
                startTime: '2023-05-01T11:00:00',
                endTime: '2023-05-01T12:30:00'
            }
        ] as unknown as ISpeakerDetails[]

        // Call the method to test
        component.calculateTime()

        // Session 1 starts at 9:00, current time is 8:30, so should be 30 minutes = 1,800,000 ms
        expect(component.sessionStartTime[0]).toBe(30 * 60 * 1000)

        // Session 1 ends at 10:00, current time is 8:30, so should be 90 minutes = 5,400,000 ms
        expect(component.sessionEndTime[0]).toBe(90 * 60 * 1000)

        // Session 2 starts at 11:00, current time is 8:30, so should be 150 minutes = 9,000,000 ms
        expect(component.sessionStartTime[1]).toBe(150 * 60 * 1000)

        // Session 2 ends at 12:30, current time is 8:30, so should be 240 minutes = 14,400,000 ms
        expect(component.sessionEndTime[1]).toBe(240 * 60 * 1000)
    })

    test('should handle timer subscription correctly', (done) => {
        // Setup data for component
        component.data = [
            {
                sessionID: 'Session1',
                speakerType: 'Keynote',
                speakerImage: 'image1.jpg',
                speakerKeynote: 'Opening Keynote',
                speakerDate: '2023-05-01T09:00:00',
                speakerName: 'John Doe',
                registeredUsers: 150,
                startTime: '2023-05-01T09:00:00',
                endTime: '2023-05-01T10:00:00'
            }
        ] as unknown as ISpeakerDetails[]

        // Mock the calculateTime method
        jest.spyOn(component, 'calculateTime').mockImplementation(() => {
            component.sessionStartTime = [30 * 60 * 1000] // 30 minutes before start
            component.sessionEndTime = [90 * 60 * 1000]   // 90 minutes before end
        })

        // Call ngOnInit which sets up the timer
        component.ngOnInit()

        // Timer emits immediately (with timer(0, 60000)), so we should be able to check results right away
        setTimeout(() => {
            // Check that change detection was triggered
            expect(mockChangeDetectorRef.detectChanges).toHaveBeenCalled()

            // Check that times were updated (decremented by 1 minute = 60000 ms)
            expect(component.sessionStartTime[0]).toBe((30 * 60 * 1000) - 60000)
            expect(component.sessionEndTime[0]).toBe((90 * 60 * 1000) - 60000)

            // Clean up timer subscription
            component.ngOnDestroy()
            done()
        }, 10)
    })

    test('should identify live speakers correctly', (done) => {
        // Setup data with one session that should be live
        component.data = [
            {
                sessionID: 'Session1',
                speakerType: 'Keynote',
                speakerImage: 'image1.jpg',
                speakerKeynote: 'Opening Keynote',
                speakerDate: '2023-05-01T09:00:00',
                speakerName: 'John Doe',
                registeredUsers: 150,
                startTime: '2023-05-01T09:00:00',
                endTime: '2023-05-01T10:00:00'
            },
            {
                sessionID: 'Session2',
                speakerType: 'Workshop',
                speakerImage: 'image2.jpg',
                speakerKeynote: 'Angular Best Practices',
                speakerDate: '2023-05-01T11:00:00',
                speakerName: 'Jane Smith',
                registeredUsers: 75,
                startTime: '2023-05-01T11:00:00',
                endTime: '2023-05-01T12:30:00'
            }
        ] as unknown as ISpeakerDetails[]

        // Mock the calculateTime method to set up a scenario where session 1 has just started
        jest.spyOn(component, 'calculateTime').mockImplementation(() => {
            // Session 1 started 5 minutes ago, ends in 55 minutes
            component.sessionStartTime = [-5 * 60 * 1000, 150 * 60 * 1000]
            component.sessionEndTime = [55 * 60 * 1000, 240 * 60 * 1000]
        })

        // Call ngOnInit which sets up the timer
        component.ngOnInit()

        // Check after immediate timer emission
        setTimeout(() => {
            // Session 1 should be identified as live (started and not yet ended)
            expect(component.liveSpeaker.length).toBe(1)
            expect(component.liveSpeaker[0]).toBe(component.data[0])

            // Session 2 should not be live
            expect(component.liveSpeaker.includes(component.data[1])).toBe(false)

            // Clean up
            component.ngOnDestroy()
            done()
        }, 10)
    })

    test('should unsubscribe from timer on destroy', () => {
        // Create a spy on the unsubscribe method
        const unsubscribeSpy = jest.fn()

        // Set the subscription manually
        component['currentSubscription'] = { unsubscribe: unsubscribeSpy } as any

        // Call ngOnDestroy
        component.ngOnDestroy()

        // Verify unsubscribe was called
        expect(unsubscribeSpy).toHaveBeenCalled()

        // Verify subscription was cleared
        expect(component['currentSubscription']).toBeNull()
    })

    test('should handle empty or null data gracefully', () => {
        // Create a new component with parent route that returns null data
        const emptyParentRoute = {
            data: of({ eventdata: { data: { SessionCards: { Sessions: {} } } } })
        }
        const emptyActivatedRoute = {
            parent: emptyParentRoute
        }

        const emptyComponent = new EventSessionsComponent(
            emptyActivatedRoute as any,
            mockEventService as any,
            mockChangeDetectorRef as any
        )

        // Should not throw errors when initializing with empty data
        expect(() => {
            emptyComponent.ngOnInit()
        }).not.toThrow()

        // Data array should be empty
        expect(emptyComponent.data).toEqual([])
    })
})