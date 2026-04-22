import { FormBuilder } from '@angular/forms'
import { of, throwError } from 'rxjs'
import { SsoConfigureSettingsComponent } from './sso-configure-settings.component'

const mockClipboard = { copy: jest.fn() }
const mockMarketplaceService = {
  getSSOConfiguration: jest.fn(),
  createSSOConfiguration: jest.fn(),
  updateSSOConfiguration: jest.fn(),
}
const mockSnackBar = { openFromComponent: jest.fn() }
const mockLoaderService = { setLoaderState: jest.fn() }
const mockRouter = { navigateByUrl: jest.fn() }
const mockActivateRoute = {
  data: of({ pageData: { data: { SSO_attributs: ['email', 'name'] } } })
}

function createComponent() {
  const fb = new FormBuilder()
  return new SsoConfigureSettingsComponent(
    mockClipboard as any,
    fb,
    mockMarketplaceService as any,
    mockSnackBar as any,
    mockLoaderService as any,
    mockRouter as any,
    mockActivateRoute as any,
  )
}

describe('SsoConfigureSettingsComponent', () => {
  let component: SsoConfigureSettingsComponent

  beforeEach(() => {
    jest.clearAllMocks()
    mockMarketplaceService.getSSOConfiguration.mockReturnValue(of({
      params: { status: 'success' },
      result: { ssoData: {} }
    }))
    component = createComponent()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('should initialize form and fetch SSO settings', () => {
      component.providerDetails = { id: 'pid', data: { contentPartnerName: 'Provider' } }
      mockMarketplaceService.getSSOConfiguration.mockReturnValue(of({
        params: { status: 'success' },
        result: { ssoData: {} }
      }))
      component.ngOnInit()
      expect(component.ssoSettingsForm).toBeDefined()
    })
  })

  describe('initializeForm', () => {
    it('should set attributesOptionsList from route data', () => {
      component.initializeForm()
      expect(component.attributesOptionsList).toEqual(['email', 'name'])
    })

    it('should create form with required controls', () => {
      component.initializeForm()
      expect(component.ssoSettingsForm.get('clientId')).toBeDefined()
      expect(component.ssoSettingsForm.get('ssoProtocol')).toBeDefined()
    })
  })

  describe('mappersFormArray getter', () => {
    it('should return the mappers FormArray', () => {
      component.initializeForm()
      expect(component.mappersFormArray).toBeDefined()
    })
  })

  describe('addMappers', () => {
    it('should add a mapper when last mapper is filled', () => {
      component.initializeForm()
      component.mappersFormArray.push(component.createMapperGroup())
      component.mappersFormArray.at(0).patchValue({ key: 'k', value: 'v' })
      component.addMappers()
      expect(component.mappersFormArray.length).toBe(2)
    })

    it('should not add mapper when last mapper is empty', () => {
      component.initializeForm()
      component.mappersFormArray.push(component.createMapperGroup())
      component.addMappers()
      expect(component.mappersFormArray.length).toBe(1)
    })
  })

  describe('isLastMapperFilled', () => {
    it('should return true when no mappers', () => {
      component.initializeForm()
      expect(component.isLastMapperFilled()).toBe(true)
    })

    it('should return false when last mapper is empty', () => {
      component.initializeForm()
      component.mappersFormArray.push(component.createMapperGroup())
      expect(component.isLastMapperFilled()).toBeFalsy()
    })

    it('should return true when last mapper has key and value', () => {
      component.initializeForm()
      const mapper = component.createMapperGroup()
      mapper.patchValue({ key: 'k', value: 'v' })
      component.mappersFormArray.push(mapper)
      expect(component.isLastMapperFilled()).toBeTruthy()
    })
  })

  describe('canAddMapper', () => {
    it('should return same as isLastMapperFilled', () => {
      component.initializeForm()
      expect(component.canAddMapper()).toBe(component.isLastMapperFilled())
    })
  })

  describe('removeMapper', () => {
    it('should remove mapper at given index', () => {
      component.initializeForm()
      component.mappersFormArray.push(component.createMapperGroup())
      component.mappersFormArray.push(component.createMapperGroup())
      component.removeMapper(0)
      expect(component.mappersFormArray.length).toBe(1)
    })
  })

  describe('createMapperGroup', () => {
    it('should return a FormGroup with key and value', () => {
      component.initializeForm()
      const group = component.createMapperGroup()
      expect(group.get('key')).toBeDefined()
      expect(group.get('value')).toBeDefined()
    })
  })

  describe('addEmptyMapperIfNone', () => {
    it('should add an empty mapper if none exist', () => {
      component.initializeForm()
      component.addEmptyMapperIfNone()
      expect(component.mappersFormArray.length).toBe(1)
    })

    it('should not add if mappers already exist', () => {
      component.initializeForm()
      component.mappersFormArray.push(component.createMapperGroup())
      component.addEmptyMapperIfNone()
      expect(component.mappersFormArray.length).toBe(1)
    })
  })

  describe('isSaveDisabled getter', () => {
    it('should return true when form has not changed', () => {
      component.initializeForm()
      component.initialFormValue = component.ssoSettingsForm.getRawValue()
      component.initialAcsUrl = component.acsUrl.value || ''
      component.initialSsoTestUrl = component.ssoTestUrl.value || ''
      component.initialStatus = component.status.value || false
      expect(component.isSaveDisabled).toBe(true)
    })
  })

  describe('copy', () => {
    it('should copy callback URL and set callbackUrlCopied', () => {
      jest.useFakeTimers()
      component.copy('callback', 'https://callback.url')
      expect(mockClipboard.copy).toHaveBeenCalledWith('https://callback.url')
      expect(component.callbackUrlCopied).toBe(true)
      jest.runAllTimers()
      expect(component.callbackUrlCopied).toBe(false)
      jest.useRealTimers()
    })

    it('should copy redirect URL and set redirectUrlCopied', () => {
      jest.useFakeTimers()
      component.copy('redirect', 'https://redirect.url')
      expect(mockClipboard.copy).toHaveBeenCalledWith('https://redirect.url')
      expect(component.redirectUrlCopied).toBe(true)
      jest.runAllTimers()
      expect(component.redirectUrlCopied).toBe(false)
      jest.useRealTimers()
    })
  })

  describe('fetchSSOSettings', () => {
    it('should not call service when providerDetails is missing', () => {
      component.providerDetails = null
      component.fetchSSOSettings()
      expect(mockMarketplaceService.getSSOConfiguration).not.toHaveBeenCalled()
    })

    it('should patch form on successful SSO fetch with data', () => {
      component.initializeForm()
      component.providerDetails = { id: 'pid', data: { contentPartnerName: 'Provider' } }
      const ssoData = {
        clientId: 'client1', ssoProtocol: 'saml', ssoUrl: 'https://sso.example.com',
        acsUrl: 'https://acs.url', ssoTestUrl: 'https://test.url', status: true,
        mappers: [{ key: 'email', value: 'attr_email' }]
      }
      mockMarketplaceService.getSSOConfiguration.mockReturnValue(of({
        params: { status: 'success' },
        result: { ssoData }
      }))
      component.fetchSSOSettings()
      expect(component.ssoSettingsForm.get('clientId')?.value).toBe('client1')
    })

    it('should handle error on SSO fetch', () => {
      component.initializeForm()
      component.providerDetails = { id: 'pid', data: { contentPartnerName: 'Provider' } }
      mockMarketplaceService.getSSOConfiguration.mockReturnValue(throwError(() => new Error('Error')))
      component.fetchSSOSettings()
      expect(mockLoaderService.setLoaderState).toHaveBeenCalledWith(false)
    })
  })

  describe('createSSOConfigurations', () => {
    it('should mark form touched and return when form is invalid', () => {
      component.initializeForm()
      component.providerDetails = { id: 'pid' }
      component.createSSOConfigurations()
      expect(mockMarketplaceService.createSSOConfiguration).not.toHaveBeenCalled()
    })

    it('should call createSSOConfiguration on valid form', () => {
      component.initializeForm()
      component.providerDetails = { id: 'pid', data: { contentPartnerName: 'Provider' } }
      component.ssoSettingsForm.patchValue({
        clientId: 'cid', partnerName: 'Provider', ssoProtocol: 'saml',
        ssoUrl: 'https://sso.example.com'
      })
      component.acsUrl.setValue('https://acs.example.com')
      component.ssoTestUrl.setValue('https://test.example.com')
      mockMarketplaceService.createSSOConfiguration.mockReturnValue(of({ params: { status: 'success' } }))
      mockMarketplaceService.getSSOConfiguration.mockReturnValue(of({ params: { status: 'success' }, result: { ssoData: {} } }))
      component.createSSOConfigurations()
      expect(mockMarketplaceService.createSSOConfiguration).toHaveBeenCalled()
    })
  })

  describe('updateSSOConfigurations', () => {
    it('should mark form touched and return when form is invalid', () => {
      component.initializeForm()
      component.providerDetails = { id: 'pid' }
      component.updateSSOConfigurations()
      expect(mockMarketplaceService.updateSSOConfiguration).not.toHaveBeenCalled()
    })

    it('should call updateSSOConfiguration on valid form', () => {
      component.initializeForm()
      component.providerDetails = { id: 'pid', data: { contentPartnerName: 'Provider' } }
      component.ssoSettingsForm.patchValue({
        clientId: 'cid', partnerName: 'Provider', ssoProtocol: 'saml',
        ssoUrl: 'https://sso.example.com'
      })
      component.SSOConfigurationData = { ssoId: 'sso123' } as any
      mockMarketplaceService.updateSSOConfiguration.mockReturnValue(of({ params: { status: 'success' } }))
      mockMarketplaceService.getSSOConfiguration.mockReturnValue(of({ params: { status: 'success' }, result: { ssoData: {} } }))
      component.updateSSOConfigurations()
      expect(mockMarketplaceService.updateSSOConfiguration).toHaveBeenCalled()
    })
  })

  describe('updateCreateSSO', () => {
    it('should call updateSSOConfigurations when SSOConfigurationData exists', () => {
      const spy = jest.spyOn(component, 'updateSSOConfigurations')
      component.initializeForm()
      component.SSOConfigurationData = { ssoId: 'sso1' } as any
      component.updateCreateSSO()
      expect(spy).toHaveBeenCalled()
    })

    it('should call createSSOConfigurations when no SSOConfigurationData', () => {
      const spy = jest.spyOn(component, 'createSSOConfigurations')
      component.initializeForm()
      component.SSOConfigurationData = null
      component.updateCreateSSO()
      expect(spy).toHaveBeenCalled()
    })
  })

  describe('urlValidator', () => {
    it('should return null for valid URL', () => {
      component.initializeForm()
      const validator = component.urlValidator()
      const result = validator({ value: 'https://valid.example.com' } as any)
      expect(result).toBeNull()
    })

    it('should return invalidUrl error for invalid URL', () => {
      component.initializeForm()
      const validator = component.urlValidator()
      const result = validator({ value: 'not-a-url' } as any)
      expect(result).toEqual({ invalidUrl: true })
    })

    it('should return null for empty value', () => {
      component.initializeForm()
      const validator = component.urlValidator()
      expect(validator({ value: '' } as any)).toBeNull()
    })
  })

  describe('extractErrorMessage', () => {
    it('should return Something went wrong for null', () => {
      expect(component.extractErrorMessage(null)).toBe('Something went wrong')
    })

    it('should return errorMessage from object', () => {
      expect(component.extractErrorMessage({ errorMessage: 'Custom error' })).toBe('Custom error')
    })

    it('should extract errorMessage from JSON string', () => {
      const jsonStr = 'Some prefix {"errorMessage":"Parsed error"}'
      expect(component.extractErrorMessage(jsonStr)).toBe('Parsed error')
    })

    it('should return Something went wrong if no JSON match in string', () => {
      expect(component.extractErrorMessage('plain error string')).toBe('Something went wrong')
    })
  })

  describe('populateMappers', () => {
    it('should populate from array', () => {
      component.initializeForm()
      component.populateMappers([{ key: 'email', value: 'attr_email' }])
      expect(component.mappersFormArray.length).toBe(1)
    })

    it('should populate from object', () => {
      component.initializeForm()
      component.populateMappers({ email: 'attr_email' })
      expect(component.mappersFormArray.length).toBe(1)
    })

    it('should add empty mapper when mappers list is empty array', () => {
      component.initializeForm()
      component.populateMappers([])
      expect(component.mappersFormArray.length).toBe(1)
    })
  })

  describe('navigateToProvidersDashboard', () => {
    it('should navigate to providers dashboard', () => {
      component.navigateToProvidersDashboard()
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app/home/marketplace-providers')
    })
  })

  describe('showSnackBar', () => {
    it('should call snackBar.openFromComponent', () => {
      component.showSnackBar('Test', 'success')
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })
  })
})

