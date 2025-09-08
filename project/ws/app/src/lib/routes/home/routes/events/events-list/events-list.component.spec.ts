import { EventsListComponent } from './events-list.component'
import * as moment from 'moment'
import { of } from 'rxjs'

// Mock the dependencies
jest.mock('@angular/material/dialog')
jest.mock('@angular/material/legacy-snack-bar')
jest.mock('@angular/router')
jest.mock('@sunbird-cb/utils-v2')
jest.mock('../services/events.service')

describe('EventsListComponent', () => {
    let component: EventsListComponent
    let mockDialog: any
    let mockActivatedRoute: any
    let mockConfigService: any
    let mockRouter: any
    let mockEventService: any
    let mockEventsService: any
    let mockDialogue: any
    let mockSnackBar: any

    beforeEach(() => {
        // Setup mock dependencies
        mockDialog = {
            open: jest.fn()
        }

        mockActivatedRoute = {
            snapshot: {
                data: {
                    configService: {
                        userProfile: {
                            userId: 'test-user-id',
                            departmentName: 'test-department',
                            rootOrgId: 'test-org-id'
                        }
                    }
                }
            }
        }

        mockConfigService = {
            userProfile: {
                userId: 'test-user-id',
                departmentName: 'test-department',
                rootOrgId: 'test-org-id'
            }
        }

        mockRouter = {
            navigate: jest.fn()
        }

        mockEventService = {
            handleTabTelemetry: jest.fn()
        }

        mockEventsService = {
            getEventsList: jest.fn().mockReturnValue(of({
                result: {
                    Event: []
                }
            })),
            retireEvent: jest.fn().mockReturnValue(of({
                responseCode: 'OK'
            }))
        }

        mockDialogue = {
            open: jest.fn().mockReturnValue({
                afterClosed: jest.fn().mockReturnValue(of(true))
            })
        }

        mockSnackBar = {
            open: jest.fn()
        }

        // Create component instance
        component = new EventsListComponent(
            mockDialog,
            mockActivatedRoute,
            mockConfigService,
            mockRouter,
            mockEventService,
            mockEventsService,
            mockDialogue,
            mockSnackBar
        )
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize with correct default values', () => {
        expect(component.currentFilter).toBe('upcoming')
        expect(component.currentUser).toBe('test-user-id')
        expect(component.department).toBe('test-department')
        expect(component.departmentID).toBe('test-org-id')
    })

    it('should initialize table data in ngOnInit', () => {
        component.ngOnInit()
        expect(component.tabledata).toEqual({
            actions: [],
            columns: [
                { displayName: 'Event title', key: 'eventName' },
                { displayName: 'Date and time', key: 'eventStartDate' },
                { displayName: 'Created on', key: 'eventCreatedOn' },
                { displayName: 'Duration', key: 'eventDuration' },
                { displayName: 'Presenters', key: 'eventjoined' },
            ],
            needCheckBox: false,
            needHash: false,
            needUserMenus: true,
        })
    })

    it('should fetch events on init', () => {
        component.ngOnInit()
        expect(mockEventsService.getEventsList).toHaveBeenCalledWith({
            locale: ['en'],
            query: '',
            request: {
                query: '',
                filters: {
                    status: ['Live', 'Retired'],
                    contentType: 'Event',
                    createdFor: 'test-org-id',
                },
                sort_by: {
                    lastUpdatedOn: 'desc',
                },
            },
        })
    })

    it('should format date correctly', () => {
        const date = '2023-01-01'
        const time = '1000+0000'
        const formattedDate = component.customDateFormat(date, time)
        expect(formattedDate).toMatch(/\d{1,2}(st|nd|rd|th) \w{3} \d{4} \d{2}:\d{2}/)
    })

    it('should compare dates correctly', () => {
        const pastDate = moment().subtract(1, 'day').format('YYYY-MM-DD HH:mm')
        const futureDate = moment().add(1, 'day').format('YYYY-MM-DD HH:mm')

        expect(component.compareDate(pastDate)).toBe(true)
        expect(component.compareDate(futureDate)).toBe(false)
    })

    it('should format duration correctly', () => {
        const mockEvent = {
            identifier: 'test-id',
            name: 'Test Event',
            startDate: '2023-01-01',
            startTime: '1000+0000',
            endDate: '2023-01-01',
            endTime: '1200+0000',
            createdOn: '2023-01-01T10:00:00.000Z',
            duration: 120,
            status: 'Live',
            creatorDetails: '[]',
            appIcon: 'test-icon'
        }

        const events = {
            result: {
                Event: [mockEvent]
            }
        }

        component.setEventListData(events)
        const processedEvent = component.eventData['upcomingEvents'][0]
        expect(processedEvent.eventDuration).toBe('2 hours')
    })

    it('should filter events correctly', () => {
        // Setup mock data
        component.eventData = {
            upcomingEvents: [{ id: 'upcoming1' }, { id: 'upcoming2' }],
            pastEvents: [{ id: 'past1' }, { id: 'past2' }],
            archiveEvents: [{ id: 'archive1' }]
        }

        // Test upcoming filter
        component.filter('upcoming')
        expect(component.currentFilter).toBe('upcoming')
        expect(component.data).toEqual([{ id: 'upcoming1' }, { id: 'upcoming2' }])

        // Test past filter
        component.filter('past')
        expect(component.currentFilter).toBe('past')
        expect(component.data).toEqual([{ id: 'past1' }, { id: 'past2' }])

        // Test archive filter
        component.filter('archive')
        expect(component.currentFilter).toBe('archive')
        expect(component.data).toEqual([{ id: 'archive1' }])
    })

    it('should handle menu actions correctly for archive', () => {
        const mockRow = { identifier: 'test-id' }
        component.menuActions({ action: 'archive', row: mockRow })

        expect(mockDialogue.open).toHaveBeenCalled()
        // Since we mocked the dialog to return true, it should call retireEvent
        expect(mockEventsService.retireEvent).toHaveBeenCalledWith('test-id')
    })

    it('should handle menu actions correctly for edit', () => {
        const mockRow = { identifier: 'test-id' }
        component.menuActions({ action: 'edit', row: mockRow })

        expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/events/test-id/edit'], {})
    })

    it('should handle telemetry correctly', () => {
        component.tabTelemetry('test-label', 1)

        expect(mockEventService.handleTabTelemetry).toHaveBeenCalledWith(
            'approval-tab',
            { label: 'test-label', index: 1 }
        )
    })

    it('should correctly determine if an event can be archived', () => {
        const currentTime = new Date()
        const futureDate = moment(currentTime).add(1, 'day').format('YYYY-MM-DD')
        const pastDate = moment(currentTime).subtract(1, 'day').format('YYYY-MM-DD')

        // Event in progress (can't archive)
        const inProgressEvent = {
            startDate: pastDate,
            startTime: '0000+0000',
            endDate: futureDate,
            endTime: '2359+0000'
        }
        expect(component.canArchive(inProgressEvent)).toBe(false)

        // Past event (can archive)
        const pastEvent = {
            startDate: pastDate,
            startTime: '0000+0000',
            endDate: pastDate,
            endTime: '2359+0000'
        }
        expect(component.canArchive(pastEvent)).toBe(true)

        // Future event (can archive)
        const futureEvent = {
            startDate: futureDate,
            startTime: '0000+0000',
            endDate: futureDate,
            endTime: '2359+0000'
        }
        expect(component.canArchive(futureEvent)).toBe(true)
    })
})