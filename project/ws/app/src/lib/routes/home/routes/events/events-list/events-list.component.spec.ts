import { EventsListComponent } from './events-list.component'
import moment from 'moment'
import { of } from 'rxjs'

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
            handleTabTelemetry: jest.fn(),
            raiseInteractTelemetry: jest.fn()
        }

        mockEventsService = {
            getEventsList: jest.fn().mockReturnValue(of({
                result: {
                    Event: {}
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

    describe('Constructor', () => {
        it('should create the component', () => {
            expect(component).toBeTruthy()
        })

        it('should initialize with correct default values', () => {
            expect(component.currentFilter).toBe('upcoming')
            expect(component.currentUser).toBe('test-user-id')
            expect(component.department).toBe('test-department')
            expect(component.departmentID).toBe('test-org-id')
        })

        it('should read config from activeRoute when configSvc.userProfile is null', () => {
            mockConfigService.userProfile = null
            const comp = new EventsListComponent(
                mockDialog,
                mockActivatedRoute,
                mockConfigService,
                mockRouter,
                mockEventService,
                mockEventsService,
                mockDialogue,
                mockSnackBar
            )
            expect(comp.departmentID).toBe('test-org-id')
            expect(comp.department).toBe('test-department')
            expect(comp.currentUser).toBe('test-user-id')
        })
    })

    describe('ngOnInit', () => {
        it('should initialize table data structure', () => {
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

        it('should call fetchEvents on init', () => {
            const spy = jest.spyOn(component, 'fetchEvents')
            component.ngOnInit()
            expect(spy).toHaveBeenCalled()
        })
    })

    describe('fetchEvents', () => {
        it('should call getEventsList for upcoming filter', () => {
            component.fetchEvents('upcoming')
            expect(mockEventsService.getEventsList).toHaveBeenCalledWith(
                expect.objectContaining({
                    request: expect.objectContaining({
                        filters: expect.objectContaining({
                            status: ['Live'],
                            contentType: 'Event',
                        }),
                    }),
                })
            )
        })

        it('should call getEventsList for past filter', () => {
            component.fetchEvents('past')
            expect(mockEventsService.getEventsList).toHaveBeenCalledWith(
                expect.objectContaining({
                    request: expect.objectContaining({
                        filters: expect.objectContaining({
                            status: ['Live'],
                            contentType: 'Event',
                        }),
                    }),
                })
            )
        })

        it('should call getEventsList for archive filter', () => {
            component.fetchEvents('archive')
            expect(mockEventsService.getEventsList).toHaveBeenCalledWith(
                expect.objectContaining({
                    request: expect.objectContaining({
                        filters: expect.objectContaining({
                            status: ['Retired'],
                            contentType: 'Event',
                        }),
                    }),
                })
            )
        })

        it('should update currentFilter when tab param is given', () => {
            component.fetchEvents('past')
            expect(component.currentFilter).toBe('past')
        })
    })

    describe('setEventListData', () => {
        const buildEvent = (overrides: any = {}) => ({
            identifier: 'evt-1',
            name: 'Test Event Long Enough Title Here',
            startDate: '2025-01-15',
            startTime: '10:00:00+05:30',
            endDate: '2025-01-15',
            endTime: '12:00:00+05:30',
            createdOn: '2025-01-01T10:00:00.000Z',
            duration: 120,
            status: 'Live',
            creatorDetails: '[]',
            appIcon: 'icon.png',
            ...overrides
        })

        it('should do nothing when eventObj is undefined', () => {
            component.setEventListData(undefined)
            expect(component.data).toEqual([])
        })

        it('should process event and populate data array', () => {
            const events = { result: { Event: { 0: buildEvent() } } }
            component.setEventListData(events)
            expect(component.data).toHaveLength(1)
        })

        it('should set eventName from first 100 chars of name', () => {
            const events = { result: { Event: { 0: buildEvent({ name: 'A'.repeat(200) }) } } }
            component.setEventListData(events)
            expect(component.data[0].eventName).toHaveLength(100)
        })

        it('should format duration as hours and minutes', () => {
            const events = { result: { Event: { 0: buildEvent({ duration: 90 }) } } }
            component.setEventListData(events)
            expect(component.data[0].eventDuration).toBe('1 hour 30 minutes')
        })

        it('should format duration as "2 hours" for exact hours', () => {
            const events = { result: { Event: { 0: buildEvent({ duration: 120 }) } } }
            component.setEventListData(events)
            expect(component.data[0].eventDuration).toBe('2 hours')
        })

        it('should format duration as "1 hour" for 60 minutes', () => {
            const events = { result: { Event: { 0: buildEvent({ duration: 60 }) } } }
            component.setEventListData(events)
            expect(component.data[0].eventDuration).toBe('1 hour')
        })

        it('should format duration as "30 minutes" for less than 1 hour', () => {
            const events = { result: { Event: { 0: buildEvent({ duration: 30 }) } } }
            component.setEventListData(events)
            expect(component.data[0].eventDuration).toBe('30 minutes')
        })

        it('should format duration as "---" for 0 minutes', () => {
            const events = { result: { Event: { 0: buildEvent({ duration: 0 }) } } }
            component.setEventListData(events)
            expect(component.data[0].eventDuration).toBe('---')
        })

        it('should display creatorDetails count for presenter', () => {
            const creatorDetails = JSON.stringify([{ name: 'Alice', email: 'a@b.com', mdoName: 'Org' }])
            const events = { result: { Event: { 0: buildEvent({ creatorDetails }) } } }
            component.setEventListData(events)
            expect(component.data[0].eventjoined).toBe('1 person')
        })

        it('should display "N people" for multiple presenters', () => {
            const creatorDetails = JSON.stringify([
                { name: 'Alice', email: 'a@b.com', mdoName: 'Org' },
                { name: 'Bob', email: 'b@c.com', mdoName: 'Org' }
            ])
            const events = { result: { Event: { 0: buildEvent({ creatorDetails }) } } }
            component.setEventListData(events)
            expect(component.data[0].eventjoined).toBe('2 people')
        })

        it('should display " --- " when creatorDetails is empty', () => {
            const events = { result: { Event: { 0: buildEvent({ creatorDetails: '[]' }) } } }
            component.setEventListData(events)
            expect(component.data[0].eventjoined).toBe(' --- ')
        })
    })

    describe('customDateFormat', () => {
        it('should return a formatted date string', () => {
            const result = component.customDateFormat('2025-01-15', '10:00:00+05:30')
            expect(result).toMatch(/\d{1,2}(st|nd|rd|th) \w{3} \d{4} \d{2}:\d{2}/)
        })
    })

    describe('allEventDateFormat', () => {
        it('should format a datetime string', () => {
            const result = component.allEventDateFormat('2025-01-15T10:00:00.000Z')
            expect(typeof result).toBe('string')
            expect(result.length).toBeGreaterThan(0)
        })
    })

    describe('formatTimeAmPm', () => {
        it('should format time in AM/PM format', () => {
            const date = new Date('2025-01-15T10:30:00')
            const result = component.formatTimeAmPm(date)
            expect(result).toMatch(/\d{1,2}:\d{2} (am|pm)/)
        })

        it('should handle noon correctly', () => {
            const date = new Date('2025-01-15T12:00:00')
            const result = component.formatTimeAmPm(date)
            expect(result).toBe('12:00 pm')
        })

        it('should handle midnight correctly', () => {
            const date = new Date('2025-01-15T00:00:00')
            const result = component.formatTimeAmPm(date)
            expect(result).toBe('12:00 am')
        })
    })

    describe('filter', () => {
        it('should update currentFilter and fetch events', () => {
            const spy = jest.spyOn(component, 'fetchEvents')
            component.filter('past')
            expect(spy).toHaveBeenCalledWith('past')
        })

        it('should filter to archive', () => {
            const spy = jest.spyOn(component, 'fetchEvents')
            component.filter('archive')
            expect(spy).toHaveBeenCalledWith('archive')
        })
    })

    describe('tabTelemetry', () => {
        it('should call handleTabTelemetry with correct params', () => {
            component.tabTelemetry('test-label', 1)
            expect(mockEventService.handleTabTelemetry).toHaveBeenCalledWith(
                expect.any(String),
                { label: 'test-label', index: 1 }
            )
        })
    })

    describe('menuActions', () => {
        it('should open confirmation dialog and retire event on archive action', () => {
            const mockRow = { identifier: 'evt-id', startTime: '10:00:00+05:30', endTime: '11:00:00+05:30', startDate: '2020-01-01', endDate: '2020-01-01' }
            component.menuActions({ action: 'archive', row: mockRow })
            expect(mockDialogue.open).toHaveBeenCalled()
            expect(mockEventsService.retireEvent).toHaveBeenCalledWith('evt-id')
        })

        it('should show snackbar after successful archive', () => {
            const mockRow = { identifier: 'evt-id', startTime: '10:00:00+05:30', endTime: '11:00:00+05:30', startDate: '2020-01-01', endDate: '2020-01-01' }
            component.menuActions({ action: 'archive', row: mockRow })
            expect(mockSnackBar.open).toHaveBeenCalledWith('Event is successfully archived.', 'X', { duration: 5000 })
        })

        it('should not retire event when archive dialog is cancelled', () => {
            mockDialogue.open.mockReturnValue({
                afterClosed: jest.fn().mockReturnValue(of(false))
            })
            const mockRow = { identifier: 'evt-id', startTime: '10:00:00+05:30', endTime: '11:00:00+05:30', startDate: '2020-01-01', endDate: '2020-01-01' }
            component.menuActions({ action: 'archive', row: mockRow })
            expect(mockEventsService.retireEvent).not.toHaveBeenCalled()
        })

        it('should navigate to edit page for non-archive actions', () => {
            const mockRow = { identifier: 'test-id' }
            component.menuActions({ action: 'edit', row: mockRow })
            expect(mockRouter.navigate).toHaveBeenCalledWith(
                ['/app/home/events/test-id/edit'],
                { queryParams: { filter: 'upcoming' } }
            )
        })
    })

    describe('canArchive', () => {
        it('should return true for past events (ended before now)', () => {
            const pastEvent = {
                startDate: '2020-01-01',
                startTime: '00:00:00+05:30',
                endDate: '2020-01-01',
                endTime: '23:59:00+05:30'
            }
            expect(component.canArchive(pastEvent)).toBe(true)
        })

        it('should return true for future events (not yet started)', () => {
            const futureDate = moment().add(2, 'days').format('YYYY-MM-DD')
            const futureEvent = {
                startDate: futureDate,
                startTime: '00:00:00+05:30',
                endDate: futureDate,
                endTime: '23:59:00+05:30'
            }
            expect(component.canArchive(futureEvent)).toBe(true)
        })

        it('should return false for events currently in progress', () => {
            const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD')
            const tomorrow = moment().add(1, 'day').format('YYYY-MM-DD')
            const inProgressEvent = {
                startDate: yesterday,
                startTime: '00:00:00+05:30',
                endDate: tomorrow,
                endTime: '23:59:00+05:30'
            }
            expect(component.canArchive(inProgressEvent)).toBe(false)
        })
    })
})

