
import { ActivatedRoute } from '@angular/router'
import { BehaviorSubject, of } from 'rxjs'
import { EventService } from '../../services/event.service'
import { EventOverviewComponent } from './event-overview.component'

describe('EventOverviewComponent', () => {
    let component: EventOverviewComponent
    let activatedRoute: any
    let appEventSvc: any

    const mockSessionTypes = {
        TypeA: {
            SessionTypeImage: 'imageA.png',
            SessionTypeTitle: 'Title A',
            SessionTypeBody: 'Body A',
        },
        TypeB: {
            SessionTypeImage: 'imageB.png',
            SessionTypeTitle: 'Title B',
            SessionTypeBody: 'Body B',
        },
    }

    const mockEventdata = {
        data: {
            Home: {
                SessionTypes: mockSessionTypes,
                footer: 'some footer',
            },
        },
    }

    beforeEach(() => {
        appEventSvc = {
            bannerisEnabled: new BehaviorSubject<boolean>(false),
        }

        activatedRoute = {
            parent: {
                data: of({ eventdata: mockEventdata }),
            },
        }

        component = new EventOverviewComponent(
            activatedRoute as ActivatedRoute,
            appEventSvc as EventService,
        )
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should create a instance of component', () => {
        expect(component).toBeTruthy()
    })

    it('should call bannerisEnabled.next(true) on ngOnInit', () => {
        const nextSpy = jest.spyOn(appEventSvc.bannerisEnabled, 'next')
        component.ngOnInit()
        expect(nextSpy).toHaveBeenCalledWith(true)
    })

    it('should populate data array from SessionTypes on ngOnInit', () => {
        component.ngOnInit()
        expect(component.data.length).toBe(2)
        expect(component.data[0]).toEqual({
            plannedImage: 'imageA.png',
            plannedName: 'Title A',
            plannedDetails: 'Body A',
        })
        expect(component.data[1]).toEqual({
            plannedImage: 'imageB.png',
            plannedName: 'Title B',
            plannedDetails: 'Body B',
        })
    })

    it('should set eventFooter on ngOnInit', () => {
        component.ngOnInit()
        expect(component.eventFooter).toEqual(mockEventdata.data.Home)
    })

    it('should reset data array before populating on ngOnInit', () => {
        component.data = [{ plannedImage: 'old.png', plannedName: 'Old', plannedDetails: 'Old' }]
        component.ngOnInit()
        expect(component.data.length).toBe(2)
    })

    it('should not throw if activatedRoute.parent is null', () => {
        activatedRoute.parent = null
        component = new EventOverviewComponent(activatedRoute, appEventSvc)
        expect(() => component.ngOnInit()).not.toThrow()
    })

    it('should initialize data as empty array', () => {
        expect(component.data).toEqual([])
    })
})
