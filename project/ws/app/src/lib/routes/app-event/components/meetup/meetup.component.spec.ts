
import { Subject } from 'rxjs'
import { ConfigurationsService, ValueService } from '@sunbird-cb/utils-v2'
import { MeetupComponent } from './meetup.component'

describe('MeetupComponent', () => {
    let component: MeetupComponent
    let isLtMedium$: Subject<boolean>
    let isXSmall$: Subject<boolean>

    let configSvc: Partial<ConfigurationsService>
    let valSvc: Partial<ValueService>

    beforeEach(() => {
        isLtMedium$ = new Subject<boolean>()
        isXSmall$ = new Subject<boolean>()

        configSvc = {
            pageNavBar: { background: 'blue', menuBar: true } as any,
        }
        valSvc = {
            isLtMedium$: isLtMedium$.asObservable() as any,
            isXSmall$: isXSmall$.asObservable() as any,
        }

        component = new MeetupComponent(
            configSvc as ConfigurationsService,
            valSvc as ValueService
        )
        jest.clearAllMocks()
    })

    it('should create a instance of component', () => {
        expect(component).toBeTruthy()
    })

    it('should set pageNavbar from configSvc.pageNavBar', () => {
        expect(component.pageNavbar).toEqual({ background: 'blue', menuBar: true })
    })

    it('should initialize navBarTitle to "iGOT Meetup Platform"', () => {
        expect(component.navBarTitle).toBe('iGOT Meetup Platform')
    })

    it('should set navBarTitle to empty when isLtMedium$ emits true', () => {
        component.ngOnInit()
        isLtMedium$.next(true)
        expect(component.navBarTitle).toBe('')
    })

    it('should not change navBarTitle when isLtMedium$ emits false', () => {
        component.ngOnInit()
        component.navBarTitle = 'iGOT Meetup Platform'
        isLtMedium$.next(false)
        expect(component.navBarTitle).toBe('iGOT Meetup Platform')
    })

    it('should set navBarTitle to empty when isXSmall$ emits true', () => {
        component.ngOnInit()
        isXSmall$.next(true)
        expect(component.navBarTitle).toBe('')
    })

    it('should not change navBarTitle when isXSmall$ emits false', () => {
        component.ngOnInit()
        component.navBarTitle = 'iGOT Meetup Platform'
        isXSmall$.next(false)
        expect(component.navBarTitle).toBe('iGOT Meetup Platform')
    })

    it('should assign screenSubscription on ngOnInit', () => {
        component.ngOnInit()
        expect(component.screenSubscription).not.toBeNull()
    })
})

