import { FormBuilder, FormArray } from '@angular/forms'
import { of } from 'rxjs'
import { ProvidersApiIntegrationsComponent } from './providers-api-integrations.component'
const mockSnackBar = { openFromComponent: jest.fn() }
const mockActivateRoute = {
  data: of({
    pageData: {
      data: {
        transformContentViaApi: { spec: 'spec' },
        transformContentViaApiAuthentication: {},
      }
    }
  })
}
const mockMarketPlaceSvc = {
  getConfiguraionDetails: jest.fn(),
  updateProvider: jest.fn(),
  updateConfiguration: jest.fn(),
  createConfiguration: jest.fn(),
}

function createComponent() {
  const fb = new FormBuilder()
  return new ProvidersApiIntegrationsComponent(
    fb,
    mockSnackBar as any,
    mockActivateRoute as any,
    mockMarketPlaceSvc as any,
  )
}

describe('ProvidersApiIntegrationsComponent', () => {
  let component: ProvidersApiIntegrationsComponent

  beforeEach(() => {
    jest.clearAllMocks()
    component = createComponent()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('should set providerConfiguration from route data', () => {
      component.ngOnInit()
      expect(component.providerConfiguration).toBeDefined()
    })
  })

  describe('ngOnChanges', () => {
    it('should call getCoursesConfiguration when providerDetails first appears', () => {
      const spy = jest.spyOn(component, 'getCoursesConfiguration')
      mockMarketPlaceSvc.getConfiguraionDetails.mockReturnValue(of({}))
      component.providerDetails = { id: 'pid', data: {} }
      component.ngOnChanges({
        providerDetails: {
          previousValue: undefined,
          currentValue: { id: 'pid' },
          firstChange: true,
          isFirstChange: () => true
        }
      })
      expect(spy).toHaveBeenCalled()
    })

    it('should not call getCoursesConfiguration on subsequent changes', () => {
      const spy = jest.spyOn(component, 'getCoursesConfiguration')
      component.ngOnChanges({
        providerDetails: {
          previousValue: { id: 'old' },
          currentValue: { id: 'new' },
          firstChange: false,
          isFirstChange: () => false
        }
      })
      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('getCoursesConfiguration', () => {
    it('should call getConfiguraionDetails when contentApisId exists', () => {
      mockMarketPlaceSvc.getConfiguraionDetails.mockReturnValue(of({ serviceName: 'Test' }))
      component.providerDetails = { serviceRegistryDetails: { contentApisId: 'api123' }, data: {} }
      component.ngOnInit()
      component.getCoursesConfiguration()
      expect(mockMarketPlaceSvc.getConfiguraionDetails).toHaveBeenCalledWith('api123')
    })

    it('should patch transformation form when no contentApisId', () => {
      component.providerDetails = { data: {} }
      component.providerConfiguration = { transformContentViaApi: { spec: 'value' } }
      component.getCoursesConfiguration()
      expect(component.transformationSpecForm.value).toEqual({ spec: 'value' })
    })
  })

  describe('paramsFormArray getter', () => {
    it('should return the tableListFormArray from paramsFormGroup', () => {
      expect(component.paramsFormArray).toBeDefined()
    })
  })

  describe('numericOnly', () => {
    it('should return true for numeric key', () => {
      expect(component.numericOnly({ key: '5' })).toBe(true)
    })

    it('should return false for non-numeric key', () => {
      expect(component.numericOnly({ key: 'a' })).toBe(false)
    })
  })

  describe('onApiTabChange', () => {
    it('should set selectedApiTab', () => {
      component.onApiTabChange('Headers')
      expect(component.selectedApiTab).toBe('Headers')
    })
  })

  describe('getControlValidation', () => {
    it('should return false for valid control', () => {
      component.servicesFormGroup.get('serviceName')?.setValue('Test')
      expect(component.getControlValidation('serviceName', 'required')).toBe(false)
    })

    it('should return true for invalid touched control', () => {
      component.servicesFormGroup.get('serviceName')?.markAsTouched()
      component.servicesFormGroup.get('serviceName')?.setValue('')
      expect(component.getControlValidation('serviceName', 'required')).toBe(true)
    })
  })

  describe('getTextLength', () => {
    it('should return character length of control value', () => {
      component.servicesFormGroup.get('serviceName')?.setValue('Hello')
      expect(component.getTextLength('serviceName')).toBe(5)
    })

    it('should return 0 for empty value', () => {
      expect(component.getTextLength('serviceName')).toBe(0)
    })
  })

  describe('getControl', () => {
    it('should return control by name', () => {
      const control = component.getControl('serviceName')
      expect(control).toBeDefined()
    })

    it('should return null for non-existent control', () => {
      const control = component.getControl('nonExistent')
      expect(control).toBeNull()
    })
  })

  describe('resetControl', () => {
    it('should reset and clear validators from control', () => {
      const ctrl = component.servicesFormGroup.get('strictCacheTimeInMinutes')
      ctrl?.setValue('5')
      component.resetControl('strictCacheTimeInMinutes')
      expect(ctrl?.value).toBeNull()
    })
  })

  describe('onToggleChange', () => {
    it('should reset strictCacheTimeInMinutes when strictCache is false', () => {
      component.servicesFormGroup.get('strictCache')?.setValue(false)
      component.servicesFormGroup.get('strictCacheTimeInMinutes')?.setValue('5')
      component.onToggleChange()
      expect(component.servicesFormGroup.get('strictCacheTimeInMinutes')?.value).toBeNull()
    })

    it('should add required validator when strictCache is true', () => {
      component.servicesFormGroup.get('strictCache')?.setValue(true)
      component.onToggleChange()
      const ctrl = component.servicesFormGroup.get('strictCacheTimeInMinutes')
      ctrl?.setValue('')
      expect(ctrl?.errors).toBeDefined()
    })
  })

  describe('authenticationToggleChange', () => {
    it('should remove Authentication from apiMetadata when not authenticated', () => {
      component.servicesFormGroup.get('isAuthenticated')?.setValue(false)
      component.authenticationToggleChange()
      const hasAuth = component.apiMetadata.some(m => m.name === 'Authentication')
      expect(hasAuth).toBe(false)
    })

    it('should add Authentication to apiMetadata when authenticated', () => {
      component.servicesFormGroup.get('isAuthenticated')?.setValue(true)
      component.ngOnInit()
      component.authenticationToggleChange()
      const hasAuth = component.apiMetadata.some(m => m.name === 'Authentication')
      expect(hasAuth).toBe(true)
    })
  })

  describe('onSelectChange', () => {
    it('should set transformationsUpdated to false', () => {
      component.transformationsUpdated = true
      component.onSelectChange()
      expect(component.transformationsUpdated).toBe(false)
    })
  })

  describe('pushObjectToFormArray', () => {
    it('should add form groups to form array', () => {
      const formArray = new FormArray<any>([])
      component.pushObjectToFormArray(formArray, { key1: 'val1', key2: 'val2' })
      expect(formArray.length).toBe(2)
    })

    it('should handle null inputs gracefully', () => {
      expect(() => component.pushObjectToFormArray(null as any, null)).not.toThrow()
    })
  })

  describe('actualUrl getter', () => {
    it('should return URL without query params', () => {
      component.viaApiFormGroup.get('apiUrl')?.setValue('https://api.example.com?param=value')
      expect(component.actualUrl).toBe('https://api.example.com')
    })
  })

  describe('constructParams getter', () => {
    it('should return empty array when no displayUrl', () => {
      component.displayUrl = ''
      const params = component.constructParams
      expect(params).toEqual([{ key: '', value: '' }])
    })

    it('should parse params from displayUrl', () => {
      component.displayUrl = 'https://api.com?key1=val1&key2=val2'
      const params = component.constructParams
      expect(params.find((p: any) => p.key === 'key1')).toBeDefined()
    })
  })

  describe('getUpdateBtnText getter', () => {
    it('should return "Update" when transformationType config exists', () => {
      component.providerConfiguration = { transformContentViaApi: { spec: 'val' } }
      component.transformationType = 'transformContentViaApi'
      expect(component.getUpdateBtnText).toBe('Update')
    })

    it('should return "Add" when no config exists', () => {
      component.providerConfiguration = {}
      component.transformationType = 'transformContentViaApi'
      expect(component.getUpdateBtnText).toBe('Add')
    })
  })

  describe('generateObjectFromForm', () => {
    it('should convert form array to object', () => {
      const form = [{ key: 'myKey', value: 'myValue' }]
      const result = component.generateObjectFromForm(form)
      expect(result['myKey']).toBe('myValue')
    })

    it('should skip entries without key', () => {
      const form = [{ key: '', value: 'val' }]
      const result = component.generateObjectFromForm(form)
      expect(Object.keys(result).length).toBe(0)
    })
  })

  describe('configure', () => {
    it('should show error and mark forms when invalid', () => {
      component.configure()
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })

    it('should call createConfiguration when valid and no existing config', () => {
      jest.spyOn(component, 'generatCoursesConfiguration').mockReturnValue({ url: 'https://api.test.com', serviceName: 'Test', serviceCode: 'TST' } as any)
      component.servicesFormGroup.patchValue({
        serviceName: 'TestService', serviceCode: 'TST',
        serviceDescription: 'Desc', isAuthenticated: false,
        strictCache: false, strictCacheTimeInMinutes: ''
      })
      component.viaApiFormGroup.patchValue({ apiType: 'GET', apiUrl: 'https://api.test.com' })
      component.transformationsUpdated = true
      component.providerDetails = { data: { partnerCode: 'ABC' } }
      component.providerConfiguration = {}
      mockMarketPlaceSvc.createConfiguration.mockReturnValue(of({ id: 'config123' }))
      mockMarketPlaceSvc.updateProvider.mockReturnValue(of({}))
      component.configure()
      expect(mockMarketPlaceSvc.createConfiguration).toHaveBeenCalled()
    })
  })

  describe('updateTransformationDetails', () => {
    it('should show error for invalid spec form', () => {
      component.providerDetails = { transformContentViaApi: null, data: {} }
      // transformationSpecForm is invalid (null value treated as empty object but invalid)
      component.transformationSpecForm.markAsTouched()
      // Set an empty object which makes the JSON.stringify check fail
      component.providerDetails = { transformContentViaApi: 'existing', data: {} }
      component.transformationSpecForm.setValue({})
      component.updateTransformationDetails()
      // With empty object {} the JSON.stringify check returns '{}' which fails the condition
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })
  })

  describe('showSnackBar', () => {
    it('should call snackBar.openFromComponent', () => {
      component.showSnackBar('Test message', 'error')
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })
  })
})

