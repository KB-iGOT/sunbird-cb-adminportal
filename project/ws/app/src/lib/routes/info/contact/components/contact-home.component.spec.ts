
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { ContactHomeComponent } from './contact-home.component'

describe('ContactHomeComponent', () => {
    let component: ContactHomeComponent

    const mockPageNavBar = { background: 'blue' }

    const configSvc: Partial<ConfigurationsService> = {
        pageNavBar: mockPageNavBar as any,
    }

    beforeEach(() => {
        jest.clearAllMocks()
        jest.resetAllMocks()
            ; (configSvc as any).pageNavBar = mockPageNavBar
            ; (configSvc as any).instanceConfig = undefined
        component = new ContactHomeComponent(configSvc as ConfigurationsService)
    })

    it('should create a instance of component', () => {
        expect(component).toBeTruthy()
    })

    it('should assign pageNavbar from configSvc.pageNavBar', () => {
        expect(component.pageNavbar).toEqual(mockPageNavBar)
    })

    it('should initialize contactUsMail as empty string', () => {
        expect(component.contactUsMail).toBe('')
    })

    it('should set contactUsMail from instanceConfig when available', () => {
        ; (configSvc as any).instanceConfig = {
            mailIds: { contactUs: 'support@example.com' },
        }
        component = new ContactHomeComponent(configSvc as ConfigurationsService)
        component.ngOnInit()
        expect(component.contactUsMail).toBe('support@example.com')
    })

    it('should not set contactUsMail when instanceConfig is missing', () => {
        ; (configSvc as any).instanceConfig = null
        component = new ContactHomeComponent(configSvc as ConfigurationsService)
        component.ngOnInit()
        expect(component.contactUsMail).toBe('')
    })
})

