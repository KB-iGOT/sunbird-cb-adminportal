
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { NotificationApiService } from '../../services/notification-api.service'
import { NotificationService } from '../../services/notification.service'
import { Router } from '@angular/router'
import { of, throwError } from 'rxjs'
import { HomeComponent } from './home.component'
import { ENotificationType, INotification } from '../../models/notifications.model'

describe('HomeComponent', () => {
    let component: HomeComponent
    let mockConfigSvc: Partial<ConfigurationsService>
    let mockNotificationApi: any
    let mockNotificationSvc: any
    let mockRouter: any

    const makeNotification = (overrides: Partial<INotification> = {}): INotification => ({
        classifiedAs: ENotificationType.Action,
        eventId: undefined as any,
        message: 'Test message',
        notificationId: 'notif-1',
        receivedOn: new Date(),
        seen: false,
        seenOn: new Date(),
        targetData: {},
        userId: 'user-1',
        ...overrides,
    })

    beforeEach(() => {
        mockConfigSvc = { pageNavBar: { title: 'Test' } as any }

        mockNotificationApi = {
            getNotifications: jest.fn(),
            updateNotificationSeenStatus: jest.fn(),
        }

        mockNotificationSvc = {
            mapRoute: jest.fn(),
        }

        mockRouter = {
            navigate: jest.fn(),
        }

        component = new HomeComponent(
            mockConfigSvc as ConfigurationsService,
            mockNotificationApi as NotificationApiService,
            mockNotificationSvc as NotificationService,
            mockRouter as Router
        )
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should create an instance of component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize default values', () => {
        expect(component.showMarkAsRead).toBe(false)
        expect(component.actionNotifications).toEqual([])
        expect(component.infoNotifications).toEqual([])
        expect(component.actionNotificationsFetchStatus).toBe('none')
        expect(component.infoNotificationsFetchStatus).toBe('none')
    })

    describe('ngOnInit', () => {
        it('should call fetchActionNotifications and fetchInfoNotifications on init', () => {
            mockNotificationApi.getNotifications!.mockReturnValue(of({ data: [], page: '' }))
            const spyAction = jest.spyOn(component, 'fetchActionNotifications')
            const spyInfo = jest.spyOn(component, 'fetchInfoNotifications')
            component.ngOnInit()
            expect(spyAction).toHaveBeenCalled()
            expect(spyInfo).toHaveBeenCalled()
        })
    })

    describe('fetchActionNotifications', () => {
        it('should set status to done and append notifications on success', () => {
            const notifications = [makeNotification()]
            mockNotificationApi.getNotifications!.mockReturnValue(of({ data: notifications, page: 'page2' }))

            component.fetchActionNotifications()

            expect(component.actionNotificationsFetchStatus).toBe('done')
            expect(component.actionNotifications).toEqual(notifications)
            expect(component.actionNotificationsNextPage).toBe('page2')
        })

        it('should set status to fetching before API call', () => {
            mockNotificationApi.getNotifications!.mockReturnValue(of({ data: [], page: '' }))
            const statuses: string[] = []
            jest.spyOn(mockNotificationApi as any, 'getNotifications').mockImplementation(() => {
                statuses.push(component.actionNotificationsFetchStatus)
                return of({ data: [], page: '' })
            })
            component.fetchActionNotifications()
            expect(statuses[0]).toBe('fetching')
        })

        it('should set status to error on API failure', () => {
            mockNotificationApi.getNotifications!.mockReturnValue(throwError('error'))
            component.fetchActionNotifications()
            expect(component.actionNotificationsFetchStatus).toBe('error')
        })

        it('should accumulate notifications on subsequent calls', () => {
            const first = [makeNotification({ notificationId: 'n1' })]
            const second = [makeNotification({ notificationId: 'n2' })]
            mockNotificationApi.getNotifications!
                .mockReturnValueOnce(of({ data: first, page: 'page2' }))
                .mockReturnValueOnce(of({ data: second, page: 'page3' }))

            component.fetchActionNotifications()
            component.fetchActionNotifications()

            expect(component.actionNotifications.length).toBe(2)
        })
    })

    describe('fetchInfoNotifications', () => {
        it('should set status to done and append notifications on success', () => {
            const notifications = [makeNotification({ classifiedAs: ENotificationType.Information })]
            mockNotificationApi.getNotifications!.mockReturnValue(of({ data: notifications, page: 'pg1' }))

            component.fetchInfoNotifications()

            expect(component.infoNotificationsFetchStatus).toBe('done')
            expect(component.infoNotifications).toEqual(notifications)
            expect(component.infoNotificationsNextPage).toBe('pg1')
        })

        it('should set status to error on API failure', () => {
            mockNotificationApi.getNotifications!.mockReturnValue(throwError('error'))
            component.fetchInfoNotifications()
            expect(component.infoNotificationsFetchStatus).toBe('error')
        })

        it('should pass Information type to getNotifications', () => {
            mockNotificationApi.getNotifications!.mockReturnValue(of({ data: [], page: '' }))
            component.fetchInfoNotifications()
            expect(mockNotificationApi.getNotifications).toHaveBeenCalledWith(
                ENotificationType.Information,
                5,
                undefined
            )
        })
    })

    describe('onClickNotification', () => {
        it('should update seen status and call mapRoute when notification is not seen', () => {
            const notif = makeNotification({ seen: false })
            mockNotificationApi.updateNotificationSeenStatus!.mockReturnValue(of({}))
            component.onClickNotification(notif)
            expect(mockNotificationApi.updateNotificationSeenStatus).toHaveBeenCalledWith(
                notif.notificationId,
                notif.classifiedAs
            )
            expect(notif.seen).toBe(true)
            expect(mockNotificationSvc.mapRoute).toHaveBeenCalledWith(notif)
        })

        it('should only call mapRoute when notification is already seen', () => {
            const notif = makeNotification({ seen: true })
            component.onClickNotification(notif)
            expect(mockNotificationApi.updateNotificationSeenStatus).not.toHaveBeenCalled()
            expect(mockNotificationSvc.mapRoute).toHaveBeenCalledWith(notif)
        })
    })

    describe('readAllNotifications', () => {
        it('should navigate, hide mark-as-read, and mark all as seen', () => {
            const actionNotif = makeNotification({ seen: false })
            const infoNotif = makeNotification({ seen: false, classifiedAs: ENotificationType.Information })
            component.actionNotifications = [actionNotif]
            component.infoNotifications = [infoNotif]
            component.showMarkAsRead = true

            mockNotificationApi.updateNotificationSeenStatus!.mockReturnValue(of({}))

            component.readAllNotifications()

            expect(mockRouter.navigate).toHaveBeenCalledWith([], { queryParams: { ts: expect.any(Number) } })
            expect(component.showMarkAsRead).toBe(false)
            expect(actionNotif.seen).toBe(true)
            expect(infoNotif.seen).toBe(true)
        })
    })
})
