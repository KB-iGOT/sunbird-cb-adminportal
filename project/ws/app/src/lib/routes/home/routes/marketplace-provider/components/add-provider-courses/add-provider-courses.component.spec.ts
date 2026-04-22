import { AddProviderCoursesComponent } from './add-provider-courses.component'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'

describe('AddProviderCoursesComponent', () => {
  let component: AddProviderCoursesComponent
  let mockActivateRoute: any

  beforeEach(() => {
    mockActivateRoute = {
      data: of({}),
    }
    component = new AddProviderCoursesComponent(mockActivateRoute as ActivatedRoute)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should create an instance of the component', () => {
    expect(component).toBeTruthy()
  })

  it('should have action EventEmitter initialized', () => {
    expect(component.action).toBeDefined()
  })

  describe('ngOnInit', () => {
    it('should set providerDetails when data.providerDetails.data exists', () => {
      const providerResult = { name: 'Test Provider', id: '123' }
      mockActivateRoute.data = of({
        providerDetails: { data: { result: providerResult } },
      })
      component = new AddProviderCoursesComponent(mockActivateRoute as ActivatedRoute)

      component.ngOnInit()

      expect(component.providerDetails).toEqual(providerResult)
    })

    it('should not set providerDetails when data.providerDetails is absent', () => {
      mockActivateRoute.data = of({})
      component = new AddProviderCoursesComponent(mockActivateRoute as ActivatedRoute)

      component.ngOnInit()

      expect(component.providerDetails).toBeUndefined()
    })

    it('should not set providerDetails when data.providerDetails.data is absent', () => {
      mockActivateRoute.data = of({ providerDetails: {} })
      component = new AddProviderCoursesComponent(mockActivateRoute as ActivatedRoute)

      component.ngOnInit()

      expect(component.providerDetails).toBeUndefined()
    })

    it('should not set providerDetails when data is empty object', () => {
      mockActivateRoute.data = of({})
      component = new AddProviderCoursesComponent(mockActivateRoute as ActivatedRoute)

      component.ngOnInit()

      expect(component.providerDetails).toBeUndefined()
    })
  })

  describe('goBack', () => {
    it('should emit goBack action', () => {
      const emitSpy = jest.spyOn(component.action, 'emit')
      component.goBack()
      expect(emitSpy).toHaveBeenCalledWith({ action: 'goBack' })
    })
  })
})
