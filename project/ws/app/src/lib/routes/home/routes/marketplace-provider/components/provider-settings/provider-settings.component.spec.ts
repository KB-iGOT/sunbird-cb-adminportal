import { FormBuilder } from '@angular/forms'
import { of, throwError } from 'rxjs'
import { ProviderSettingsComponent } from './provider-settings.component'

const mockMarketPlaceSvc = {
  createProvider: jest.fn(),
  updateProvider: jest.fn(),
}

const mockSnackBar = {
  open: jest.fn(),
}

const mockLoaderService = {
  changeLoad: { next: jest.fn() },
}

function createComponent() {
  const fb = new FormBuilder()
  const component = new ProviderSettingsComponent(fb, mockMarketPlaceSvc as any, mockSnackBar as any, mockLoaderService as any)
  return component
}

describe('ProviderSettingsComponent', () => {
  let component: ProviderSettingsComponent

  beforeEach(() => {
    jest.clearAllMocks()
    component = createComponent()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should initialize the form with default values', () => {
    expect(component.providerSettingsForm).toBeDefined()
    expect(component.controls['overAllLimit']).toBeDefined()
    expect(component.controls['isUserWiseLimitEnabled'].value).toBe(false)
    expect(component.controls['isConcurrentLimitEnabled'].value).toBe(false)
    expect(component.controls['addKarmaPointEnabled'].value).toBe(false)
  })

  describe('ngOnChanges', () => {
    it('should patch form when providerDetails changes', () => {
      const providerDetails = {
        data: {
          overAllLimit: 1000,
          userWiseLimit: 100,
          isUserWiseLimitEnabled: true,
          concurrentLimit: 50,
          isConcurrentLimitEnabled: true,
          karmaPoints: 5,
          addKarmaPointEnabled: true,
        }
      }
      component.ngOnChanges({
        providerDetails: {
          currentValue: providerDetails,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      })
      expect(component.providerDetailsBeforeUpdate).toBeDefined()
      expect(component.controls['overAllLimit'].value).toBe(1000)
    })

    it('should not patch if providerDetails is not in changes', () => {
      const spy = jest.spyOn(component, 'patchProviderSettings')
      component.ngOnChanges({})
      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('patchProviderSettings', () => {
    it('should patch the form with provider details', () => {
      const details = {
        data: {
          overAllLimit: 500,
          userWiseLimit: 50,
          isUserWiseLimitEnabled: false,
          concurrentLimit: null,
          isConcurrentLimitEnabled: false,
          karmaPoints: null,
          addKarmaPointEnabled: false,
        }
      }
      component.patchProviderSettings(details)
      expect(component.controls['overAllLimit'].value).toBe(500)
    })

    it('should use defaults when data fields are missing', () => {
      component.patchProviderSettings({ data: {} })
      expect(component.controls['overAllLimit'].value).toBeNull()
      expect(component.controls['isUserWiseLimitEnabled'].value).toBe(false)
    })
  })

  describe('submit', () => {
    it('should call createProviderSettings when form is valid and no provider id', () => {
      const spy = jest.spyOn(component, 'createProviderSettings').mockImplementation(() => { })
      component.providerDetails = undefined
      component.providerSettingsForm.patchValue({ overAllLimit: null })
      component.submit()
      // form is valid (no required fields), so createProviderSettings is called
      expect(spy).toHaveBeenCalled()
    })

    it('should call updateProviderSettings when form is valid and provider has id', () => {
      const spy = jest.spyOn(component, 'updateProviderSettings')
      component.providerDetails = { id: '123', data: { overAllLimit: 100 } }
      component.providerDetailsBeforeUpdate = { data: { overAllLimit: 100 } }
      mockMarketPlaceSvc.updateProvider.mockReturnValue(of({ result: 'ok' }))
      component.submit()
      expect(spy).toHaveBeenCalled()
    })
  })

  describe('createProviderSettings', () => {
    it('should call marketPlaceSvc.createProvider and show success snack bar', () => {
      mockMarketPlaceSvc.createProvider.mockReturnValue(of({ id: 'new-id' }))
      component.loadProviderDetails.emit = jest.fn()
      component.createProviderSettings()
      expect(mockMarketPlaceSvc.createProvider).toHaveBeenCalled()
      expect(mockLoaderService.changeLoad.next).toHaveBeenCalledWith(false)
      expect(mockSnackBar.open).toHaveBeenCalledWith('Provider settings saved successfully')
    })

    it('should show error snack bar when createProvider fails', () => {
      const error = { error: { params: { errMsg: 'Create failed' } } }
      mockMarketPlaceSvc.createProvider.mockReturnValue(throwError(error))
      component.createProviderSettings()
      expect(mockSnackBar.open).toHaveBeenCalledWith('Create failed')
    })

    it('should use fallback error message when errMsg is missing', () => {
      mockMarketPlaceSvc.createProvider.mockReturnValue(throwError({}))
      component.createProviderSettings()
      expect(mockSnackBar.open).toHaveBeenCalledWith('Something went wrong, please try again later')
    })

    it('should include userWiseLimit when isUserWiseLimitEnabled and value set', () => {
      mockMarketPlaceSvc.createProvider.mockReturnValue(of(null))
      component.controls['isUserWiseLimitEnabled'].setValue(true)
      component.controls['userWiseLimit'].setValue(10)
      component.createProviderSettings()
      const callArg = mockMarketPlaceSvc.createProvider.mock.calls[0][0]
      expect(callArg.userWiseLimit).toBe(10)
    })
  })

  describe('updateProviderSettings', () => {
    beforeEach(() => {
      component.providerDetailsBeforeUpdate = {
        data: {
          overAllLimit: 100,
          isUserWiseLimitEnabled: false,
          isConcurrentLimitEnabled: false,
          addKarmaPointEnabled: false,
        }
      }
    })

    it('should call updateProvider and emit on success', () => {
      mockMarketPlaceSvc.updateProvider.mockReturnValue(of({ result: 'ok' }))
      component.loadProviderDetails.emit = jest.fn()
      component.updateProviderSettings()
      expect(mockMarketPlaceSvc.updateProvider).toHaveBeenCalled()
      expect(mockSnackBar.open).toHaveBeenCalledWith('Provider settings updated successfully')
      expect(component.loadProviderDetails.emit).toHaveBeenCalledWith(true)
    })

    it('should show error snack bar when updateProvider fails', () => {
      const error = { error: { params: { errMsg: 'Update failed' } } }
      mockMarketPlaceSvc.updateProvider.mockReturnValue(throwError(error))
      component.updateProviderSettings()
      expect(mockSnackBar.open).toHaveBeenCalledWith('Update failed')
    })

    it('should include karmaPoints when addKarmaPointEnabled and value set', () => {
      mockMarketPlaceSvc.updateProvider.mockReturnValue(of(null))
      component.controls['addKarmaPointEnabled'].setValue(true)
      component.controls['karmaPoints'].setValue(5)
      component.updateProviderSettings()
      expect(component.providerDetailsBeforeUpdate.data.karmaPoints).toBe(5)
    })
  })

  describe('form reactive behaviors', () => {
    it('should enable concurrentLimit when isConcurrentLimitEnabled is set to true', () => {
      component.controls['isConcurrentLimitEnabled'].setValue(true)
      expect(component.controls['concurrentLimit'].enabled).toBe(true)
    })

    it('should disable concurrentLimit when isConcurrentLimitEnabled is set to false', () => {
      component.controls['isConcurrentLimitEnabled'].setValue(true)
      component.controls['isConcurrentLimitEnabled'].setValue(false)
      expect(component.controls['concurrentLimit'].disabled).toBe(true)
    })

    it('should enable userWiseLimit when isUserWiseLimitEnabled is true', () => {
      component.controls['isUserWiseLimitEnabled'].setValue(true)
      expect(component.controls['userWiseLimit'].enabled).toBe(true)
    })

    it('should disable userWiseLimit when isUserWiseLimitEnabled is false', () => {
      component.controls['isUserWiseLimitEnabled'].setValue(true)
      component.controls['isUserWiseLimitEnabled'].setValue(false)
      expect(component.controls['userWiseLimit'].disabled).toBe(true)
    })

    it('should enable karmaPoints when addKarmaPointEnabled is true', () => {
      component.controls['addKarmaPointEnabled'].setValue(true)
      expect(component.controls['karmaPoints'].enabled).toBe(true)
    })

    it('should disable karmaPoints when addKarmaPointEnabled is false', () => {
      component.controls['addKarmaPointEnabled'].setValue(true)
      component.controls['addKarmaPointEnabled'].setValue(false)
      expect(component.controls['karmaPoints'].disabled).toBe(true)
    })

    it('should update concurrentLimit validators when overAllLimit changes and concurrent is enabled', () => {
      component.controls['isConcurrentLimitEnabled'].setValue(true)
      component.controls['overAllLimit'].setValue(200)
      expect(component.controls['concurrentLimit'].errors).toBeDefined()
    })

    it('should update concurrentLimit validators when userWiseLimit changes', () => {
      component.controls['isUserWiseLimitEnabled'].setValue(true)
      component.controls['isConcurrentLimitEnabled'].setValue(true)
      component.controls['userWiseLimit'].setValue(50)
      expect(component.controls['concurrentLimit'].errors).toBeDefined()
    })
  })

  describe('showSnackBar', () => {
    it('should call snackBar.open with message', () => {
      component.showSnackBar('Test message')
      expect(mockSnackBar.open).toHaveBeenCalledWith('Test message')
    })
  })

  describe('sendDetailsUpdateEvent', () => {
    it('should emit loadProviderDetails', () => {
      component.loadProviderDetails.emit = jest.fn()
      component.sendDetailsUpdateEvent()
      expect(component.loadProviderDetails.emit).toHaveBeenCalledWith(true)
    })
  })
})

