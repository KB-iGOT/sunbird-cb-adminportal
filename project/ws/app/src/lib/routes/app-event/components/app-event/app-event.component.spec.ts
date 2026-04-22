
import { ActivatedRoute } from '@angular/router'
import { BehaviorSubject, of } from 'rxjs'
import { EventService } from '../../services/event.service'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { AppEventComponent } from './app-event.component'

describe('AppEventComponent', () => {
    let component: AppEventComponent
    let activatedRoute: any
    let appEventSvc: any
    let configSvc: any

    const mockEventData = {
        RegistrationStatus: { RegisteredUser: 'true' },
        Home: { title: 'Event' },
    }

    beforeEach(() => {
        appEventSvc = {
            bannerisEnabled: new BehaviorSubject<boolean>(false),
        }
        activatedRoute = {
            data: of({ eventdata: { data: mockEventData } }),
        }
        configSvc = {
            pageNavBar: { color: 'primary' },
        }

        component = new AppEventComponent(
            activatedRoute as ActivatedRoute,
            appEventSvc as EventService,
            configSvc as ConfigurationsService,
        )
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should create a instance of component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize pageNavbar from configSvc.pageNavBar', () => {
        expect(component.pageNavbar).toEqual({ color: 'primary' })
    })

    it('should initialize error as false', () => {
        expect(component.error).toBe(false)
    })

    it('should subscribe to bannerisEnabled and update isEnabled', () => {
        appEventSvc.bannerisEnabled = new BehaviorSubject<boolean>(false)
        component = new AppEventComponent(activatedRoute, appEventSvc, configSvc)
        component.ngOnInit()
        expect(component.isEnabled).toBe(false)

        appEventSvc.bannerisEnabled.next(true)
        expect(component.isEnabled).toBe(true)
    })

    it('should set data and isRegisteredUser when eventdata has data', () => {
        component.ngOnInit()
        expect(component.data).toEqual(mockEventData)
        expect(component.isRegisteredUser).toBe(true)
    })

    it('should set isRegisteredUser false when RegisteredUser is not "true"', () => {
        activatedRoute.data = of({
            eventdata: {
                data: {
                    RegistrationStatus: { RegisteredUser: 'false' },
                },
            },
        })
        component = new AppEventComponent(activatedRoute, appEventSvc, configSvc)
        component.ngOnInit()
        expect(component.isRegisteredUser).toBe(false)
    })

    it('should set error=true when eventdata is missing', () => {
        activatedRoute.data = of({ eventdata: null })
        component = new AppEventComponent(activatedRoute, appEventSvc, configSvc)
        component.ngOnInit()
        expect(component.error).toBe(true)
    })

    it('should set error=true when eventdata has error property', () => {
        activatedRoute.data = of({ eventdata: { error: true } })
        component = new AppEventComponent(activatedRoute, appEventSvc, configSvc)
        component.ngOnInit()
        expect(component.error).toBe(true)
    })

    it('should not set error when eventdata.data is valid', () => {
        component.ngOnInit()
        expect(component.error).toBe(false)
    })
})
