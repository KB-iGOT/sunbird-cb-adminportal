import { FormBuilder } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { of, throwError } from 'rxjs'
import { ProviderSettingsComponent } from './provider-settings.component'
import { MarketplaceService } from '../../services/marketplace.service'
import { LoaderService } from '../../../../services/loader.service'

describe('ProviderSettingsComponent', () => {
  let component: ProviderSettingsComponent
  let marketPlaceSvc: any
  let snackBar: any
  let loaderService: any

  const createComponent = () => {
    marketPlaceSvc = {
      getGroupsList: jest.fn(() => of({ result: { response: ['group1', 'group2'] } })),
      createProvider: jest.fn(() => of({ result: 'success' })),
      updateProvider: jest.fn(() => of({ result: 'success' })),
    }
    snackBar = {
      open: jest.fn(),
    }
    loaderService = {
      changeLoad: { next: jest.fn() },
    }
    component = new ProviderSettingsComponent(
      new FormBuilder(),
      marketPlaceSvc as MarketplaceService,
      snackBar as MatSnackBar,
      loaderService as LoaderService
    )
  }

  beforeEach(() => {
    createComponent()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should create an instance of the component', () => {
    expect(component).toBeTruthy()
    expect(component.providerSettingsForm).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('should call getGroupsList', () => {
      const spy = jest.spyOn(component, 'getGroupsList')
      component.ngOnInit()
      expect(spy).toHaveBeenCalled()
    })
  })

  describe('ngOnChanges', () => {
    it('should set providerDetailsBeforeUpdate and patch the form when currentValue is present', () => {
      const patchSpy = jest.spyOn(component, 'patchProviderSettings')
      const currentValue = { id: '1', data: { licenseType: 'User' } }
      component.ngOnChanges({ providerDetails: { currentValue } } as any)

      expect(component.providerDetailsBeforeUpdate).toEqual(currentValue)
      expect(patchSpy).toHaveBeenCalledWith(currentValue)
    })

    it('should not patch the form when providerDetails is absent', () => {
      const patchSpy = jest.spyOn(component, 'patchProviderSettings')
      component.ngOnChanges({} as any)
      expect(patchSpy).not.toHaveBeenCalled()
    })

    it('should not patch the form when currentValue is falsy', () => {
      const patchSpy = jest.spyOn(component, 'patchProviderSettings')
      component.ngOnChanges({ providerDetails: { currentValue: null } } as any)
      expect(patchSpy).not.toHaveBeenCalled()
    })
  })

  describe('reactive form behaviour set up in initializeForm', () => {
    it('should cap concurrentLimit at the userWiseLimit value when isConcurrentLimitEnabled is toggled on and userWiseLimit is enabled', () => {
      component.controls['isUserWiseLimitEnabled'].setValue(true)
      component.controls['userWiseLimit'].setValue(10)
      component.controls['isConcurrentLimitEnabled'].setValue(true)

      expect(component.controls['concurrentLimit'].enabled).toBe(true)
      component.controls['concurrentLimit'].setValue(11)
      expect(component.controls['concurrentLimit'].hasError('max')).toBe(true)
      component.controls['concurrentLimit'].setValue(10)
      expect(component.controls['concurrentLimit'].hasError('max')).toBe(false)
    })

    it('should cap concurrentLimit at the overAllLimit value when isConcurrentLimitEnabled is toggled on and userWiseLimit is disabled', () => {
      component.controls['isUserWiseLimitEnabled'].setValue(true)
      component.controls['isUserWiseLimitEnabled'].setValue(false)
      component.controls['overAllLimit'].setValue(50)
      component.controls['isConcurrentLimitEnabled'].setValue(true)

      expect(component.controls['concurrentLimit'].enabled).toBe(true)
      component.controls['concurrentLimit'].setValue(51)
      expect(component.controls['concurrentLimit'].hasError('max')).toBe(true)
    })

    it('should disable and clear validators on concurrentLimit when isConcurrentLimitEnabled is toggled off', () => {
      component.controls['isConcurrentLimitEnabled'].setValue(true)
      component.controls['isConcurrentLimitEnabled'].setValue(false)

      expect(component.controls['concurrentLimit'].disabled).toBe(true)
    })

    it('should update the concurrentLimit max validator when overAllLimit changes while userWiseLimit is disabled and concurrentLimit is enabled', () => {
      component.controls['isUserWiseLimitEnabled'].setValue(true)
      component.controls['isUserWiseLimitEnabled'].setValue(false)
      component.controls['isConcurrentLimitEnabled'].setValue(true)

      component.controls['overAllLimit'].setValue(75)
      component.controls['concurrentLimit'].setValue(76)
      expect(component.controls['concurrentLimit'].hasError('max')).toBe(true)

      component.controls['overAllLimit'].setValue(100)
      component.controls['concurrentLimit'].setValue(76)
      expect(component.controls['concurrentLimit'].hasError('max')).toBe(false)
    })

    it('should not touch concurrentLimit validators when overAllLimit changes while concurrentLimit is disabled', () => {
      const updateSpy = jest.spyOn(component.controls['concurrentLimit'], 'updateValueAndValidity')
      component.controls['isConcurrentLimitEnabled'].setValue(false)
      updateSpy.mockClear()
      component.controls['overAllLimit'].setValue(75)

      expect(updateSpy).not.toHaveBeenCalled()
    })

    it('should enable userWiseLimit and mark it required when isUserWiseLimitEnabled is toggled on', () => {
      component.controls['isUserWiseLimitEnabled'].setValue(true)
      expect(component.controls['userWiseLimit'].enabled).toBe(true)
      component.controls['userWiseLimit'].setValue(null)
      expect(component.controls['userWiseLimit'].hasError('required')).toBe(true)
    })

    it('should disable userWiseLimit and reset concurrentLimit validators when isUserWiseLimitEnabled is toggled off while concurrentLimit is enabled', () => {
      component.controls['overAllLimit'].setValue(20)
      component.controls['isConcurrentLimitEnabled'].setValue(true)
      component.controls['isUserWiseLimitEnabled'].setValue(true)
      component.controls['isUserWiseLimitEnabled'].setValue(false)

      expect(component.controls['userWiseLimit'].disabled).toBe(true)
      expect(component.controls['concurrentLimit'].enabled).toBe(true)
      component.controls['concurrentLimit'].setValue(21)
      expect(component.controls['concurrentLimit'].hasError('max')).toBe(true)
    })

    it('should leave concurrentLimit untouched when isUserWiseLimitEnabled is toggled off while concurrentLimit is disabled', () => {
      component.controls['isConcurrentLimitEnabled'].setValue(true)
      component.controls['isConcurrentLimitEnabled'].setValue(false)
      component.controls['isUserWiseLimitEnabled'].setValue(true)
      const updateSpy = jest.spyOn(component.controls['concurrentLimit'], 'updateValueAndValidity')
      component.controls['isUserWiseLimitEnabled'].setValue(false)

      expect(updateSpy).not.toHaveBeenCalled()
    })

    it('should cap concurrentLimit at the new userWiseLimit value when userWiseLimit value changes', () => {
      component.controls['isUserWiseLimitEnabled'].setValue(true)
      component.controls['userWiseLimit'].setValue(30)
      component.controls['concurrentLimit'].setValue(31)

      expect(component.controls['concurrentLimit'].hasError('max')).toBe(true)
    })

    it('should enable karmaPoints and mark it required when addKarmaPointEnabled is toggled on', () => {
      component.controls['addKarmaPointEnabled'].setValue(true)
      expect(component.controls['karmaPoints'].enabled).toBe(true)
      component.controls['karmaPoints'].setValue(null)
      expect(component.controls['karmaPoints'].hasError('required')).toBe(true)
    })

    it('should clear validators and disable karmaPoints when addKarmaPointEnabled is toggled off', () => {
      component.controls['addKarmaPointEnabled'].setValue(true)
      component.controls['addKarmaPointEnabled'].setValue(false)
      expect(component.controls['karmaPoints'].disabled).toBe(true)
    })

    it('should enable group with validators when karmaPointsExemptionEnabled is toggled on', () => {
      component.controls['karmaPointsExemptionEnabled'].setValue(true)
      expect(component.controls['group'].enabled).toBe(true)
    })

    it('should reset and disable group when karmaPointsExemptionEnabled is toggled off', () => {
      component.controls['karmaPointsExemptionEnabled'].setValue(true)
      component.controls['group'].setValue(['group1'])
      component.controls['karmaPointsExemptionEnabled'].setValue(false)

      expect(component.controls['group'].value).toBeNull()
      expect(component.controls['group'].disabled).toBe(true)
    })
  })

  describe('getGroupsList', () => {
    it('should set groupsList on success', () => {
      component.getGroupsList()
      expect(component.groupsList).toEqual(['group1', 'group2'])
    })

    it('should set groupsList to an empty array on error', () => {
      marketPlaceSvc.getGroupsList.mockReturnValue(throwError(new Error('failed')))
      component.getGroupsList()
      expect(component.groupsList).toEqual([])
    })
  })

  describe('patchProviderSettings', () => {
    it('should patch the form and disable licenseType when licenseType is present', () => {
      const onLicenseTypeChangeSpy = jest.spyOn(component, 'onLicenseTypeChange')
      const providerDetails = {
        data: {
          licenseType: 'Course',
          licenseConsumedCount: 5,
          overAllLimit: 100,
          userWiseLimit: 10,
          isUserWiseLimitEnabled: true,
          concurrentLimit: 5,
          isConcurrentLimitEnabled: true,
          karmaPoints: 20,
          addKarmaPointEnabled: true,
          karmaPointsExemption: { group: ['group1'] },
          karmaPointsExemptionEnabled: true,
        },
      }

      component.patchProviderSettings(providerDetails)

      expect(component.licenseConsumedCount).toBe(5)
      expect(component.controls['licenseType'].value).toBe('Course')
      expect(component.controls['licenseType'].disabled).toBe(true)
      expect(onLicenseTypeChangeSpy).toHaveBeenCalledWith('Course')
    })

    it('should enable licenseType when licenseType is not present', () => {
      component.patchProviderSettings({ data: { licenseType: '' } })
      expect(component.controls['licenseType'].enabled).toBe(true)
    })

    it('should fall back to defaults when providerDetails has no data', () => {
      component.patchProviderSettings({})
      expect(component.licenseConsumedCount).toBe(0)
      expect(component.controls['licenseType'].value).toBe('User')
    })
  })

  describe('controls', () => {
    it('should return the form controls', () => {
      expect(component.controls).toBe(component.providerSettingsForm.controls)
    })
  })

  describe('onLicenseTypeChange', () => {
    it('should set the user message and enable overAllLimit for User license type', () => {
      component.onLicenseTypeChange('User')
      expect(component.overAllLimitMessage).toBe('Maximum total users allowed across all learners for this provider.')
      expect(component.controls['overAllLimit'].enabled).toBe(true)
    })

    it('should set the course message for Course license type', () => {
      component.onLicenseTypeChange('Course')
      expect(component.overAllLimitMessage).toBe('Maximum total course enrolments allowed across all learners for this provider.')
    })

    it('should clear the message and disable overAllLimit when licenseType is falsy', () => {
      component.onLicenseTypeChange('')
      expect(component.overAllLimitMessage).toBe('')
      expect(component.controls['overAllLimit'].disabled).toBe(true)
    })

    it('should use licenseConsumedCount as the minimum limit when greater than zero', () => {
      component.licenseConsumedCount = 10
      component.onLicenseTypeChange('User')
      component.controls['overAllLimit'].setValue(5)
      expect(component.controls['overAllLimit'].hasError('min')).toBe(true)
    })
  })

  describe('submit', () => {
    it('should show a snackbar when the form is invalid', () => {
      component.controls['overAllLimit'].setValue(-5)
      component.submit()
      expect(snackBar.open).toHaveBeenCalledWith('Please fill all the mandatory fields with proper data')
    })

    it('should call updateProviderSettings when the form is valid and providerDetails has an id', () => {
      const updateSpy = jest.spyOn(component, 'updateProviderSettings').mockImplementation()
      component.providerDetails = { id: '1' }
      component.submit()
      expect(updateSpy).toHaveBeenCalled()
    })

    it('should call createProviderSettings when the form is valid and providerDetails has no id', () => {
      const createSpy = jest.spyOn(component, 'createProviderSettings').mockImplementation()
      component.providerDetails = undefined
      component.submit()
      expect(createSpy).toHaveBeenCalled()
    })
  })

  describe('createProviderSettings', () => {
    it('should build the payload with optional fields and show a success message', () => {
      const emitSpy = jest.spyOn(component.loadProviderDetails, 'emit')
      component.controls['isUserWiseLimitEnabled'].setValue(true)
      component.controls['userWiseLimit'].setValue(10)
      component.controls['isConcurrentLimitEnabled'].setValue(true)
      component.controls['concurrentLimit'].setValue(5)
      component.controls['addKarmaPointEnabled'].setValue(true)
      component.controls['karmaPoints'].setValue(20)
      component.controls['karmaPointsExemptionEnabled'].setValue(true)
      component.controls['group'].setValue(['group1'])

      component.createProviderSettings()

      expect(marketPlaceSvc.createProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          userWiseLimit: 10,
          concurrentLimit: 5,
          karmaPoints: 20,
          karmaPointsExemption: { group: ['group1'] },
        })
      )
      expect(loaderService.changeLoad.next).toHaveBeenCalledWith(false)
      expect(snackBar.open).toHaveBeenCalledWith('Provider settings saved successfully')
      expect(emitSpy).toHaveBeenCalledWith(true)
    })

    it('should build the minimal payload when optional toggles are disabled', () => {
      component.createProviderSettings()

      const formBody = marketPlaceSvc.createProvider.mock.calls[0][0]
      expect(formBody.userWiseLimit).toBeUndefined()
      expect(formBody.concurrentLimit).toBeUndefined()
      expect(formBody.karmaPoints).toBeUndefined()
      expect(formBody.karmaPointsExemption).toBeUndefined()
    })

    it('should show the error message returned by the API on failure', () => {
      marketPlaceSvc.createProvider.mockReturnValue(
        throwError({ error: { params: { errMsg: 'custom error' } } })
      )
      component.createProviderSettings()
      expect(snackBar.open).toHaveBeenCalledWith('custom error')
      expect(loaderService.changeLoad.next).toHaveBeenCalledWith(false)
    })

    it('should show a default error message when the API does not return one', () => {
      marketPlaceSvc.createProvider.mockReturnValue(throwError({}))
      component.createProviderSettings()
      expect(snackBar.open).toHaveBeenCalledWith('Something went wrong, please try again later')
    })
  })

  describe('updateProviderSettings', () => {
    beforeEach(() => {
      component.providerDetailsBeforeUpdate = { data: {} }
    })

    it('should build the payload with optional fields and show a success message', () => {
      const emitSpy = jest.spyOn(component.loadProviderDetails, 'emit')
      component.controls['userWiseLimit'].setValue(10)
      component.controls['concurrentLimit'].setValue(5)
      component.controls['karmaPoints'].setValue(20)
      component.controls['karmaPointsExemptionEnabled'].setValue(true)
      component.controls['group'].setValue(['group1'])

      component.updateProviderSettings()

      expect(component.providerDetailsBeforeUpdate.data.userWiseLimit).toBe(10)
      expect(component.providerDetailsBeforeUpdate.data.concurrentLimit).toBe(5)
      expect(component.providerDetailsBeforeUpdate.data.karmaPoints).toBe(20)
      expect(component.providerDetailsBeforeUpdate.data.karmaPointsExemption).toEqual({ group: ['group1'] })
      expect(marketPlaceSvc.updateProvider).toHaveBeenCalledWith(component.providerDetailsBeforeUpdate)
      expect(loaderService.changeLoad.next).toHaveBeenCalledWith(false)
      expect(snackBar.open).toHaveBeenCalledWith('Provider settings updated successfully')
      expect(emitSpy).toHaveBeenCalledWith(true)
    })

    it('should not set optional fields when their values are absent', () => {
      component.updateProviderSettings()

      expect(component.providerDetailsBeforeUpdate.data.userWiseLimit).toBeUndefined()
      expect(component.providerDetailsBeforeUpdate.data.concurrentLimit).toBeUndefined()
      expect(component.providerDetailsBeforeUpdate.data.karmaPoints).toBeUndefined()
      expect(component.providerDetailsBeforeUpdate.data.karmaPointsExemption).toBeUndefined()
    })

    it('should show the error message returned by the API on failure', () => {
      marketPlaceSvc.updateProvider.mockReturnValue(
        throwError({ error: { params: { errMsg: 'update failed' } } })
      )
      component.updateProviderSettings()
      expect(snackBar.open).toHaveBeenCalledWith('update failed')
      expect(loaderService.changeLoad.next).toHaveBeenCalledWith(false)
    })
  })

  describe('sendDetailsUpdateEvent', () => {
    it('should emit true on loadProviderDetails', () => {
      const emitSpy = jest.spyOn(component.loadProviderDetails, 'emit')
      component.sendDetailsUpdateEvent()
      expect(emitSpy).toHaveBeenCalledWith(true)
    })
  })

  describe('showSnackBar', () => {
    it('should open the snackbar with the given message', () => {
      component.showSnackBar('hello')
      expect(snackBar.open).toHaveBeenCalledWith('hello')
    })
  })
})
