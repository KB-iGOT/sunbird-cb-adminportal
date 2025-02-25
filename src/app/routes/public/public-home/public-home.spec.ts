import { PublicHomeComponent } from './public-home.component'

describe('PublicHomeComponent', () => {
  let component: PublicHomeComponent
  let mockRouter: any

  beforeEach(() => {
    // Mock Router
    mockRouter = {
      events: {
        subscribe: jest.fn()
      }
    }

    // Create component instance
    component = new PublicHomeComponent(mockRouter)
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should subscribe to router events on ngOnInit', () => {
    // Mock the subscription callback function
    const subscribeCallback = jest.fn()
    mockRouter.events.subscribe.mockImplementation(subscribeCallback)

    // Call ngOnInit
    component.ngOnInit()

    // Verify that the subscription was made
    expect(mockRouter.events.subscribe).toHaveBeenCalledTimes(1)
  })

  it('should redirect to /public/logout if URL contains "public/home"', () => {
    // Mock window.location.href
    const originalLocation = global.location
    // delete global.location // Delete default location object
    const mockLocation = { href: '' } as Location
    global.location = mockLocation

    // Set the mock URL to "public/home"
    mockLocation.href = 'https://example.com/public/home'

    // Call ngOnInit to trigger the redirect logic
    component.ngOnInit()

    // Verify if window.location.href was set to /public/logout
    expect(mockLocation.href).toBe('/public/logout')

    // Restore the original location object after the test
    global.location = originalLocation
  })
})
