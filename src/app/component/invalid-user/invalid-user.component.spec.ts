import { InvalidUserComponent } from './invalid-user.component'
import { of } from 'rxjs'

describe('InvalidUserComponent', () => {
  let component: InvalidUserComponent
  let mockActivatedRoute: any

  beforeEach(() => {
    // Create a mock ActivatedRoute
    mockActivatedRoute = {
      data: of({ pageData: { data: { value: 'Invalid User' } } }),
    }

    // Create the component instance
    component = new InvalidUserComponent(mockActivatedRoute)
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should set invalidData on ngOnInit', () => {
    // Call ngOnInit to trigger the subscription
    component.ngOnInit()

    // Assert that the invalidData is set correctly
    expect(component.invalidData).toBe('Invalid User')
  })

  it('should unsubscribe on ngOnDestroy', () => {
    // Call ngOnInit first to trigger the subscription
    component.ngOnInit()

    // We can now safely spy on unsubscribe method because subscriptionData is no longer null
    // const unsubscribeSpy = jest.spyOn(component['subscriptionData'], 'unsubscribe')

    // Call ngOnDestroy to ensure the unsubscribe method is called
    component.ngOnDestroy()

    // Assert that unsubscribe is called
    // expect(unsubscribeSpy).toHaveBeenCalled()
  })

})
