import { ProfileDetailComponent } from './profile-detail.component'
import { of, Subject } from 'rxjs'
import { ViewUsersComponent } from './view-users/view-users.component'

jest.mock('@angular/router', () => ({
    ActivatedRoute: jest.fn(),
    Router: jest.fn(),
}))
jest.mock('../../services/event.service', () => ({
    EventService: jest.fn(),
}))
jest.mock('@sunbird-cb/utils', () => ({
    ValueService: jest.fn(),
}))
jest.mock('@angular/material/legacy-dialog', () => ({
    MatLegacyDialog: jest.fn(),
}))

describe('ProfileDetailComponent', () => {
    let component: ProfileDetailComponent
    let activatedRouteMock: any
    let eventServiceMock: any
    let matDialogMock: any
    let valueServiceMock: any
    let routerMock: any

    beforeEach(() => {
        activatedRouteMock = {
            parent: {
                data: of({
                    eventdata: {
                        data: {
                            SessionCards: {
                                Sessions: {
                                    'session-id': {
                                        SessionDescription: {
                                            Content4: {
                                                Link1: 'link-1',
                                                Line1: 'line-1',
                                            },
                                            Content3: {
                                                url1: 'url-1',
                                            },
                                        },
                                        AttendeesList: ['user1', 'user2'],
                                        Attendees: 2,
                                    },
                                },
                            },
                        },
                    },
                }),
            },
        }
        eventServiceMock = {
            bannerisEnabled: new Subject<boolean>(),
        }
        matDialogMock = {
            open: jest.fn(),
        }
        valueServiceMock = {
            isLtMedium$: of(false),
        }
        routerMock = {
            getCurrentNavigation: jest.fn().mockReturnValue({
                extras: { state: { sessionID: 'session-id' } },
            }),
        }

        component = new ProfileDetailComponent(
            activatedRouteMock,
            eventServiceMock,
            matDialogMock,
            valueServiceMock,
            routerMock,
        )
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should create the ProfileDetailComponent', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize component with correct session ID and data', () => {
        component.ngOnInit()

        expect(component.sessionID).toBe('session-id')
        expect(component.data).toEqual({
            SessionDescription: {
                Content4: {
                    Link1: 'link-1',
                    Line1: 'line-1',
                },
                Content3: {
                    url1: 'url-1',
                },
            },
            AttendeesList: ['user1', 'user2'],
            Attendees: 2,
        })
        expect(component.links).toEqual(['link-1'])
        expect(component.lines).toEqual(['line-1'])
        expect(component.urls).toEqual(['url-1'])
    })

    it('should handle screen size changes and adjust layout', () => {
        valueServiceMock.isLtMedium$ = of(true)
        component.ngOnInit()

        expect(component.noOfCards).toBe(4)
        expect(component.width).toBe('80vw')
    })

    it('should open dialog with correct data', () => {
        component.openDialog()

        expect(matDialogMock.open).toHaveBeenCalledWith(ViewUsersComponent, {
            width: '35vw',
            height: 'auto',
            data: {
                userArray: ['user1', 'user2'],
                noOfUser: 2,
            },
        })
    })

    it('should unsubscribe from screenSubscription on ngOnDestroy', () => {
        const unsubscribeMock = jest.fn()
        //  component.screenSubscription = { unsubscribe: unsubscribeMock }

        component.ngOnDestroy()

        expect(unsubscribeMock).toHaveBeenCalled()
    })
})
