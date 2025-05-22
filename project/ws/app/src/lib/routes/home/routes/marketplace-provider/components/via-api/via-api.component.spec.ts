import { ViaApiComponent } from './via-api.component'
import { FormBuilder, FormArray } from '@angular/forms'
import { of, throwError } from 'rxjs'
import { HttpErrorResponse } from '@angular/common/http'

// Mock dependencies
const mockFormBuilder = {
  group: jest.fn(),
  array: jest.fn()
}

const mockMarketplaceService = {
  getConfiguraionDetails: jest.fn(),
  updateConfiguration: jest.fn(),
  createConfiguration: jest.fn(),
  updateProvider: jest.fn()
}

const mockSnackBar = {
  open: jest.fn()
}

const mockActivatedRoute = {
  data: of({
    pageData: {
      data: {
        transformContentViaApi: { test: 'data' },
        transformProgressViaApi: { progress: 'data' }
      }
    }
  })
}

describe('ViaApiComponent', () => {
  let component: ViaApiComponent
  let formBuilder: any

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Create real FormBuilder instance for proper form handling
    formBuilder = new FormBuilder()

    // Mock FormBuilder methods to return actual FormBuilder results
    mockFormBuilder.group.mockImplementation((config: any) => formBuilder.group(config))
    mockFormBuilder.array.mockImplementation((controls: any) => formBuilder.array(controls))

    // Create component instance
    component = new ViaApiComponent(
      mockFormBuilder as any,
      mockMarketplaceService as any,
      mockSnackBar as any,
      mockActivatedRoute as any
    )
  })

  describe('Component Initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy()
    })

    it('should initialize form groups in initializaTion', () => {
      component.initializaTion()

      expect(component.servicesFormGroup).toBeDefined()
      expect(component.viaApiFormGroup).toBeDefined()
      expect(component.headersFormGroup).toBeDefined()
      expect(component.paramsFormGroup).toBeDefined()
      expect(component.bodyFormGroup).toBeDefined()
      expect(component.authenticationFormGroup).toBeDefined()
    })

    it('should set up apiTypesList correctly', () => {
      component.initializaTion()

      expect(component.apiTypesList).toEqual([
        { type: 'Get', value: 'GET' },
        { type: 'Post', value: 'POST' }
      ])
    })

    it('should initialize editor options', () => {
      component.initializaTion()

      expect(component.editorOptions.mode).toBe('text')
      expect(component.editorOptions.mainMenuBar).toBe(false)
      expect(component.editorOptions.navigationBar).toBe(false)
      expect(component.editorOptions.statusBar).toBe(false)
    })
  })

  describe('Form Validation', () => {
    beforeEach(() => {
      component.initializaTion()
    })

    it('should validate required fields in servicesFormGroup', () => {
      const serviceName = component.servicesFormGroup.get('serviceName')
      const serviceCode = component.servicesFormGroup.get('serviceCode')
      const serviceDescription = component.servicesFormGroup.get('serviceDescription')

      expect(serviceName?.hasError('required')).toBe(true)
      expect(serviceCode?.hasError('required')).toBe(true)
      expect(serviceDescription?.hasError('required')).toBe(true)
    })

    it('should validate pattern in form controls', () => {
      const serviceName = component.servicesFormGroup.get('serviceName')
      serviceName?.setValue('invalid@#$%')

      expect(serviceName?.hasError('pattern')).toBe(true)
    })

    it('should return correct validation status in getControlValidation', () => {
      const result = component.getControlValidation('serviceName', 'required')
      expect(result).toBe(true)

      component.servicesFormGroup.get('serviceName')?.setValue('Valid Name')
      const resultAfterValue = component.getControlValidation('serviceName', 'required')
      expect(resultAfterValue).toBe(false)
    })
  })

  describe('URL Construction', () => {
    beforeEach(() => {
      component.initializaTion()
    })

    it('should get actual URL without query parameters', () => {
      component.viaApiFormGroup.get('apiUrl')?.setValue('https://api.example.com/data?param=value')

      expect(component.actualUrl).toBe('https://api.example.com/data')
    })

    it('should construct display URL from params array', () => {
      component.viaApiFormGroup.get('apiUrl')?.setValue('https://api.example.com/data')

      const params = [
        { key: 'param1', value: 'value1' },
        { key: 'param2', value: 'value2' }
      ]

      component.constructDisplayUrl(params)

      expect(component.displayUrl).toBe('https://api.example.com/data?param1=value1&param2=value2')
    })

    it('should handle empty params in constructDisplayUrl', () => {
      component.viaApiFormGroup.get('apiUrl')?.setValue('https://api.example.com/data')

      const params: any[] = []
      component.constructDisplayUrl(params)

      expect(component.viaApiFormGroup.get('apiUrl')?.value).toBe('https://api.example.com/data')
    })

    it('should construct params from URL', () => {
      component.displayUrl = 'https://api.example.com/data?param1=value1&param2=value2'

      const params = component.constructParams

      expect(params).toEqual([
        { key: 'param1', value: 'value1' },
        { key: 'param2', value: 'value2' },
        { key: '', value: '' }
      ])
    })
  })

  describe('Form Array Management', () => {
    beforeEach(() => {
      component.initializaTion()
    })

    it('should get params form array', () => {
      const formArray = component.paramsFormArray
      expect(formArray instanceof FormArray).toBe(true)
    })

    it('should push object to form array', () => {
      const formArray = component.paramsFormArray
      const testObject = { key1: 'value1', key2: 'value2' }

      component.pushObjectToFormArray(formArray, testObject)

      expect(formArray.length).toBe(2)
    })

    it('should generate object from form array', () => {
      const formData = [
        { key: 'param1', value: 'value1' },
        { key: 'param2', value: 'value2' }
      ]

      const result = component.generateObjectFromForm(formData)

      expect(result).toEqual({
        param1: 'value1',
        param2: 'value2'
      })
    })

    it('should generate object with placeholders for params', () => {
      const formData = [
        { key: 'param1', value: 'value1' },
        { key: 'param2', value: 'value2' }
      ]

      const result = component.generateObjectFromForm(formData, true)

      expect(result).toEqual({
        param1: '{param1}',
        param2: '{param2}'
      })
    })
  })

  describe('Configuration Management', () => {
    beforeEach(() => {
      component.initializaTion()
      component.providerDetails = {
        serviceRegistryDetails: { contentApisId: 'test-id' },
        data: { partnerCode: 'TEST_PARTNER' }
      }
    })

    it('should get courses configuration when contentApisId exists', () => {
      const mockResponse = {
        serviceName: 'Test Service',
        serviceCode: 'TEST_CODE',
        serviceDescription: 'Test Description',
        url: 'https://api.example.com/test',
        requestMethod: 'GET'
      }

      mockMarketplaceService.getConfiguraionDetails.mockReturnValue(of(mockResponse))

      component.getCoursesConfiguration()

      expect(mockMarketplaceService.getConfiguraionDetails).toHaveBeenCalledWith('test-id')
    })

    it('should patch form data correctly', () => {
      const configDetails = {
        serviceName: 'Test Service',
        serviceCode: 'TEST_CODE',
        serviceDescription: 'Test Description',
        url: 'https://api.example.com/test',
        requestMethod: 'GET',
        requestPayload: {
          headerMap: { 'Content-Type': 'application/json' },
          requestMap: { key: 'value' },
          strictCache: true,
          strictCacheTimeInMinutes: 30
        }
      }

      component.patchFormData(configDetails)

      expect(component.servicesFormGroup.get('serviceName')?.value).toBe('Test Service')
      expect(component.viaApiFormGroup.get('apiType')?.value).toBe('GET')
      expect(component.viaApiFormGroup.get('apiUrl')?.value).toBe('https://api.example.com/test')
    })
  })

  describe('Toggle Changes', () => {
    beforeEach(() => {
      component.initializaTion()
    })

    it('should handle authentication toggle change', () => {
      component.servicesFormGroup.get('strictCache')?.setValue(true)
      component.servicesFormGroup.get('strictCacheTimeInMinutes')?.setValue(30)
      component.servicesFormGroup.get('isAuthenticated')?.setValue(false)

      component.authenticationToggleChange()

      expect(component.servicesFormGroup.get('strictCache')?.value).toBe(false)
      expect(component.servicesFormGroup.get('strictCacheTimeInMinutes')?.value).toBeNull()
    })

    it('should handle strict cache toggle change', () => {
      component.servicesFormGroup.get('strictCache')?.setValue(true)

      component.onToggleChange()

      const control = component.servicesFormGroup.get('strictCacheTimeInMinutes')
      expect(control?.hasError('required')).toBe(true)
    })
  })

  describe('Button Text Generation', () => {
    it('should return correct update button text for transformContentViaApi', () => {
      component.transformationType = 'transformContentViaApi'
      component.providerConfiguration = { transformContentViaApi: {} }

      expect(component.getUpdateBtnText).toBe('Update Transform Content')
    })

    it('should return correct save button text for new transformContentViaApi', () => {
      component.transformationType = 'transformContentViaApi'
      component.providerConfiguration = {}

      expect(component.getUpdateBtnText).toBe('Save Transform Content')
    })

    it('should return correct update button text for transformProgressViaApi', () => {
      component.transformationType = 'transformProgressViaApi'
      component.providerConfiguration = { transformProgressViaApi: {} }

      expect(component.getUpdateBtnText).toBe('Update Transform Progress')
    })
  })

  describe('Configuration Operations', () => {
    beforeEach(() => {
      component.initializaTion()
      component.providerDetails = {
        serviceRegistryDetails: { contentApisId: 'existing-id' },
        data: { partnerCode: 'TEST_PARTNER' }
      }
      component.transformationsUpdated = true
    })

    it('should update configuration when contentApisId exists', () => {
      // Set up valid forms
      component.servicesFormGroup.patchValue({
        serviceName: 'Test Service',
        serviceCode: 'TEST',
        serviceDescription: 'Test Description',
        isAuthenticated: false,
        strictCache: false
      })
      component.viaApiFormGroup.patchValue({
        apiType: 'GET',
        apiUrl: 'https://api.example.com/test'
      })

      mockMarketplaceService.updateConfiguration.mockReturnValue(of({}))

      component.configure()

      expect(mockMarketplaceService.updateConfiguration).toHaveBeenCalled()
    })

    it('should create configuration when contentApisId does not exist', () => {
      component.providerDetails = {
        data: { partnerCode: 'TEST_PARTNER' }
      }

      // Set up valid forms
      component.servicesFormGroup.patchValue({
        serviceName: 'Test Service',
        serviceCode: 'TEST',
        serviceDescription: 'Test Description',
        isAuthenticated: false,
        strictCache: false
      })
      component.viaApiFormGroup.patchValue({
        apiType: 'GET',
        apiUrl: 'https://api.example.com/test'
      })

      mockMarketplaceService.createConfiguration.mockReturnValue(of({ id: 'new-id' }))

      component.configure()

      expect(mockMarketplaceService.createConfiguration).toHaveBeenCalled()
    })

    it('should handle configuration update error', () => {
      component.servicesFormGroup.patchValue({
        serviceName: 'Test Service',
        serviceCode: 'TEST',
        serviceDescription: 'Test Description',
        isAuthenticated: false,
        strictCache: false
      })
      component.viaApiFormGroup.patchValue({
        apiType: 'GET',
        apiUrl: 'https://api.example.com/test'
      })

      const errorResponse = new HttpErrorResponse({
        error: { message: 'Update failed' },
        status: 500
      })

      mockMarketplaceService.updateConfiguration.mockReturnValue(throwError(errorResponse))

      component.configure()

      expect(mockSnackBar.open).toHaveBeenCalledWith('Update failed')
    })
  })

  describe('Transformation Updates', () => {
    beforeEach(() => {
      component.initializaTion()
      component.providerDetails = { data: {} }
      component.transformationType = 'transformContentViaApi'
    })

    it('should update transformation details successfully', () => {
      component.transformationSpecForm.setValue({ test: 'spec' })
      component.jsonEditor = { get: jest.fn().mockReturnValue({}) } as any

      mockMarketplaceService.updateProvider.mockReturnValue(of({}))

      component.upDateTransforamtionDetails()

      expect(mockMarketplaceService.updateProvider).toHaveBeenCalled()
      expect(component.providerDetails.data.isActive).toBe(true)
    })

    it('should handle transformation update error', () => {
      component.transformationSpecForm.setValue({ test: 'spec' })
      component.jsonEditor = { get: jest.fn().mockReturnValue({}) } as any

      const errorResponse = new HttpErrorResponse({
        error: { params: { errMsg: 'Transformation update failed' } },
        status: 500
      })

      mockMarketplaceService.updateProvider.mockReturnValue(throwError(errorResponse))

      component.upDateTransforamtionDetails()

      expect(mockSnackBar.open).toHaveBeenCalledWith('Transformation update failed')
    })

    it('should handle invalid JSON in transformation', () => {
      component.transformationSpecForm.setValue({})
      component.jsonEditor = {
        get: jest.fn().mockImplementation(() => { throw new Error('Invalid JSON') })
      } as any

      component.upDateTransforamtionDetails()

      expect(mockSnackBar.open).toHaveBeenCalledWith('Please provied valid spec json')
    })
  })

  describe('Utility Methods', () => {
    beforeEach(() => {
      component.initializaTion()
    })

    it('should get text length correctly', () => {
      component.servicesFormGroup.get('serviceName')?.setValue('Test Service')

      const length = component.getTextLength('serviceName')

      expect(length).toBe(12)
    })

    it('should return 0 for empty control in getTextLength', () => {
      const length = component.getTextLength('serviceName')

      expect(length).toBe(0)
    })

    it('should show snack bar with message', () => {
      const message = 'Test message'

      component.showSnackBar(message)

      expect(mockSnackBar.open).toHaveBeenCalledWith(message)
    })

    it('should get params and URL correctly', () => {
      component.viaApiFormGroup.get('apiUrl')?.setValue('https://api.example.com/test')
      component.paramsFormGroup.patchValue({
        tableListFormArray: [
          { key: 'param1', value: 'value1' },
          { key: 'param2', value: 'value2' }
        ]
      })

      const result = component.getParamsAndUrl()

      expect(result.url).toBe('https://api.example.com/test?&param1={param1}&param2={param2}')
      expect(result.urlPlaceholder).toBe('{param1},{param2}')
    })
  })

  describe('ngOnChanges', () => {
    beforeEach(() => {
      component.initializaTion()
    })

    it('should handle viaApiTabIndex change', () => {
      component.tabIndex = 1
      const changes = {
        viaApiTabIndex: {
          currentValue: 1,
          previousValue: 0,
          firstChange: false,
          isFirstChange: () => false
        }
      }

      component.ngOnChanges(changes as any)

      expect(component.delayTabLoad).toBe(false)
    })

    it('should call getCoursesConfiguration on providerDetails first change', () => {
      jest.spyOn(component, 'getCoursesConfiguration').mockImplementation()

      const changes = {
        providerDetails: {
          currentValue: { test: 'data' },
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      }

      component.ngOnChanges(changes as any)

      expect(component.getCoursesConfiguration).toHaveBeenCalled()
    })
  })
})