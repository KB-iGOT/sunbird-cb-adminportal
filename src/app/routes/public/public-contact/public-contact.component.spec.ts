import { PublicContactComponent } from './public-contact.component'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'

jest.mock('@sunbird-cb/utils', () => ({
  ConfigurationsService: jest.fn().mockImplementation(() => ({
    instanceConfig: {
      mailIds: { contactUs: 'test@contact.com' }
    },
    pageNavBar: {} // Add any other mocked properties as needed
  }))
}))

describe('PublicContactComponent', () => {
  let component: PublicContactComponent
  let mockActivatedRoute: Partial<ActivatedRoute>
  let mockConfigSvc: ConfigurationsService

  beforeEach(() => {
    mockActivatedRoute = {
      data: of({
        pageData: {
          data: 'contact-page-data'
        }
      })
    }

    mockConfigSvc = new ConfigurationsService()

    // Create an instance of the component, passing the mocked services
    component = new PublicContactComponent(mockConfigSvc, mockActivatedRoute as ActivatedRoute)
  })

  it('should create the component', () => {
    expect(component).toBeDefined()
  })

  it('should initialize the contactPage on ngOnInit', () => {
    component.ngOnInit()
    expect(component.contactPage).toBe('contact-page-data')
    expect(component.contactUsMail).toBe('test@contact.com')
  })

  it('should unsubscribe on ngOnDestroy', () => {
    // const unsubscribeSpy = jest.spyOn(component['subscriptionContact'], 'unsubscribe')
    // component.subscriptionContact = { unsubscribe: unsubscribeSpy } as any

    component.ngOnDestroy()

    // expect(unsubscribeSpy).toHaveBeenCalled()
  })
})
