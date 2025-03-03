import { AppFooterComponent } from './app-footer.component'
import { ConfigurationsService, ValueService } from '@sunbird-cb/utils'
import { of } from 'rxjs'

describe('AppFooterComponent', () => {
  let component: AppFooterComponent
  let mockConfigSvc: Partial<ConfigurationsService>
  let mockValueSvc: Partial<ValueService>

  beforeEach(() => {
    // Mock ConfigurationsService
    mockConfigSvc = {
      restrictedFeatures: new Set(['termsOfUser']) // This simulates that 'termsOfUser' is a restricted feature
    }

    // Mock ValueService
    mockValueSvc = {
      isXSmall$: of(true) // Initially, isXSmall is true
    }

    // Create an instance of the component with mocked services
    component = new AppFooterComponent(mockConfigSvc as ConfigurationsService, mockValueSvc as ValueService)
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should set termsOfUser to false if termsOfUser is restricted', () => {
    expect(component.termsOfUser).toBe(false)
  })

  it('should set isXSmall to true based on ValueService observable', () => {
    // Initially, isXSmall should be true
    expect(component.isXSmall).toBe(true)
  })

  it('should update isXSmall when the value changes', () => {
    // Change the observable value
    mockValueSvc.isXSmall$ = of(false)

    // Create a new instance to simulate change in isXSmall$
    component = new AppFooterComponent(mockConfigSvc as ConfigurationsService, mockValueSvc as ValueService)

    // After the change, isXSmall should be false
    expect(component.isXSmall).toBe(false)
  })
})
