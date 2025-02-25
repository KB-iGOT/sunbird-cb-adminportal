import { LoaderService } from './loader.service' // Adjust the path as needed

describe('LoaderService', () => {
  let service: LoaderService

  beforeEach(() => {
    // Create an instance of the service
    service = new LoaderService()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('changeLoadState', () => {
    it('should change the state of changeLoad BehaviorSubject', () => {
      // Subscribe to the observable
      const spy = jest.fn()
      service.$currentState.subscribe(spy)

      // Call the method to change the state
      service.changeLoaderState(true)

      // Assert that the correct value was emitted
      expect(spy).toHaveBeenCalledWith(true)

      service.changeLoaderState(false)
      expect(spy).toHaveBeenCalledWith(false)
    })
  })

  describe('changeLoadState (doubleBack)', () => {
    it('should change the state of doubleBack BehaviorSubject', () => {
      // Subscribe to the currentState observable
      const spy = jest.fn()
      service.currentState.subscribe(spy)

      // Call the method to change the state of doubleBack
      service.changeLoadState(true)

      // Assert that the correct value was emitted
      expect(spy).toHaveBeenCalledWith(true)

      service.changeLoadState(false)
      expect(spy).toHaveBeenCalledWith(false)
    })
  })

  describe('$currentState observable', () => {
    it('should emit the state when changeLoaderState is called', () => {
      const spy = jest.fn()
      service.$currentState.subscribe(spy)

      service.changeLoaderState(true)
      expect(spy).toHaveBeenCalledWith(true)

      service.changeLoaderState(false)
      expect(spy).toHaveBeenCalledWith(false)
    })
  })

  describe('currentState observable', () => {
    it('should emit the state when changeLoadState is called', () => {
      const spy = jest.fn()
      service.currentState.subscribe(spy)

      service.changeLoadState(true)
      expect(spy).toHaveBeenCalledWith(true)

      service.changeLoadState(false)
      expect(spy).toHaveBeenCalledWith(false)
    })
  })
})
