import { SsoIntegrationComponent } from './sso-integration.component'
import { of, throwError } from 'rxjs'

const mockDialogRef = {
  close: jest.fn(),
}

const mockDialog = {
  open: jest.fn().mockReturnValue(mockDialogRef),
}

const mockMarketplaceService = {
  testSSOConfiguration: jest.fn(),
  updateSSOConfiguration: jest.fn(),
  updateProvider: jest.fn(),
}

const mockSnackBar = {
  openFromComponent: jest.fn(),
}

describe('SsoIntegrationComponent', () => {
  let component: SsoIntegrationComponent

  beforeEach(() => {
    jest.clearAllMocks()
    component = new SsoIntegrationComponent(
      mockDialog as any,
      mockMarketplaceService as any,
      mockSnackBar as any,
    )
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should have correct default values', () => {
    expect(component.ssoConfigurations).toBeNull()
    expect(component.selectedTabIndex).toBe(0)
    expect(component.helpCenterGuide).toBeDefined()
  })

  it('ngOnInit should run without errors', () => {
    expect(() => component.ngOnInit()).not.toThrow()
  })

  it('loadSSODetails should set ssoConfigurations and emit loadProviderDetails', () => {
    const emitSpy = jest.spyOn(component.loadProviderDetails, 'emit')
    component.providerDetails = { id: 'prov-1' }
    const event = { configuration: 'completed', ssoTested: true }
    component.loadSSODetails(event)
    expect(component.ssoConfigurations).toEqual(event)
    expect(emitSpy).toHaveBeenCalledWith({ id: 'prov-1', ssoDetails: event })
  })

  it('isSSOSuccessfullyConfigured should return false when providerDetails is null', () => {
    component.providerDetails = null
    component.ssoConfigurations = null
    expect(component.isSSOSuccessfullyConfigured).toBeFalsy()
  })

  it('isSSOSuccessfullyConfigured should return true when all conditions met', () => {
    component.providerDetails = { data: { isAuthenticate: true, isActive: true } }
    component.ssoConfigurations = { configuration: 'completed', ssoTested: true } as any
    expect(component.isSSOSuccessfullyConfigured).toBe(true)
  })

  it('isSSOSuccessfullyConfigured should return false when ssoTested is false', () => {
    component.providerDetails = { data: { isAuthenticate: true, isActive: true } }
    component.ssoConfigurations = { configuration: 'completed', ssoTested: false } as any
    expect(component.isSSOSuccessfullyConfigured).toBe(false)
  })

  it('canSave should return false when ssoConfigurationSettings is not set', () => {
    component['ssoConfigurationSettings'] = undefined as any
    expect(component.canSave).toBe(false)
  })

  it('canSave should return false when isSaveDisabled is true', () => {
    component['ssoConfigurationSettings'] = {
      isSaveDisabled: true,
      ssoSettingsForm: { valid: true, touched: true, dirty: true },
      acsUrl: { valid: true, touched: true, dirty: true },
      ssoTestUrl: { valid: true, touched: true, dirty: true },
      status: { valid: true, touched: true, dirty: true },
    } as any
    expect(component.canSave).toBe(false)
  })

  it('canSave should return true when all forms are valid, touched/dirty, and not disabled', () => {
    component['ssoConfigurationSettings'] = {
      isSaveDisabled: false,
      ssoSettingsForm: { valid: true, touched: true, dirty: false },
      acsUrl: { valid: true, touched: false, dirty: true },
      ssoTestUrl: { valid: true, touched: false, dirty: false },
      status: { valid: true, touched: false, dirty: false },
    } as any
    expect(component.canSave).toBe(true)
  })

  it('canSave should return false when forms are invalid', () => {
    component['ssoConfigurationSettings'] = {
      isSaveDisabled: false,
      ssoSettingsForm: { valid: false, touched: true, dirty: true },
      acsUrl: { valid: true, touched: true, dirty: false },
      ssoTestUrl: { valid: true, touched: false, dirty: false },
      status: { valid: true, touched: false, dirty: false },
    } as any
    expect(component.canSave).toBe(false)
  })

  it('updateCreateSSO should call updateSSOConfigurations if SSOConfigurationData exists', () => {
    const updateSpy = jest.fn()
    const createSpy = jest.fn()
    component['ssoConfigurationSettings'] = {
      SSOConfigurationData: { ssoId: '123' },
      updateSSOConfigurations: updateSpy,
      createSSOConfigurations: createSpy,
    } as any
    component.updateCreateSSO()
    expect(updateSpy).toHaveBeenCalled()
    expect(createSpy).not.toHaveBeenCalled()
  })

  it('updateCreateSSO should call createSSOConfigurations if SSOConfigurationData is null', () => {
    const updateSpy = jest.fn()
    const createSpy = jest.fn()
    component['ssoConfigurationSettings'] = {
      SSOConfigurationData: null,
      updateSSOConfigurations: updateSpy,
      createSSOConfigurations: createSpy,
    } as any
    component.updateCreateSSO()
    expect(createSpy).toHaveBeenCalled()
    expect(updateSpy).not.toHaveBeenCalled()
  })

  it('updateCreateSSO should do nothing when ssoConfigurationSettings is not set', () => {
    component['ssoConfigurationSettings'] = undefined as any
    expect(() => component.updateCreateSSO()).not.toThrow()
  })

  it('showSnackBar should call snackBar.openFromComponent', () => {
    component.showSnackBar('Test message', 'error')
    expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
  })

  it('testSsoUrl should open loading dialog and call testSSOConfiguration', () => {
    const fetchSpy = jest.fn()
    const emitSpy = jest.spyOn(component.loadProviderDetails, 'emit')
    component.providerDetails = { id: 'prov-1', data: { isAuthenticate: false } }
    component.ssoConfigurations = { configuration: 'pending', ssoTested: false } as any
    component['ssoConfigurationSettings'] = {
      SSOConfigurationData: { ssoTestUrl: 'http://test.com', ssoId: 'sso-1' },
      fetchSSOSettings: fetchSpy,
    } as any

    mockMarketplaceService.testSSOConfiguration.mockReturnValue(
      of({ responseCode: 'OK' })
    )
    mockMarketplaceService.updateSSOConfiguration.mockReturnValue(
      of({ result: { ssoData: { configuration: 'completed', ssoTested: true } } })
    )
    mockMarketplaceService.updateProvider.mockReturnValue(
      of({ result: { id: 'prov-1' } })
    )

    jest.useFakeTimers()
    component.testSsoUrl()
    expect(mockDialog.open).toHaveBeenCalled()
    expect(mockMarketplaceService.testSSOConfiguration).toHaveBeenCalled()
    jest.runAllTimers()
    expect(fetchSpy).toHaveBeenCalled()
    expect(emitSpy).toHaveBeenCalledWith(true)
    jest.useRealTimers()
  })

  it('testSsoUrl should show snackbar on error', () => {
    component.providerDetails = { id: 'prov-1', data: { isAuthenticate: false } }
    component.ssoConfigurations = { configuration: 'pending', ssoTested: false } as any
    component['ssoConfigurationSettings'] = {
      SSOConfigurationData: { ssoTestUrl: 'http://test.com', ssoId: 'sso-1' },
    } as any

    mockMarketplaceService.testSSOConfiguration.mockReturnValue(
      throwError({ error: { params: { errmsg: 'SSO test failed' } } })
    )

    component.testSsoUrl()
    expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
  })

  it('testSsoUrl should show error when testSSOConfiguration returns non-OK responseCode', () => {
    component.providerDetails = { id: 'prov-1', data: { isAuthenticate: false } }
    component.ssoConfigurations = {} as any
    component['ssoConfigurationSettings'] = {
      SSOConfigurationData: { ssoTestUrl: 'http://test.com', ssoId: 'sso-1' },
    } as any

    mockMarketplaceService.testSSOConfiguration.mockReturnValue(
      of({ responseCode: 'ERROR', params: { errmsg: 'Connection failed' } })
    )

    component.testSsoUrl()
    expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
  })
})
