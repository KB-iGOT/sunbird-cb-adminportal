import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core'
import { MatIconRegistry } from '@angular/material/icon'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute } from '@angular/router'
import { NsAccessControlConfig } from '@sunbird-cb/access-settings'
import { of, throwError } from 'rxjs'

import { AccessSettingsComponent } from './access-settings.component'
import { MarketplaceService } from '../../services/marketplace.service'
import { SPV_ACCESS_CONTROL_CONFIG } from '../../models/access-settings.model'

describe('AccessSettingsComponent', () => {
  let component: AccessSettingsComponent
  let fixture: ComponentFixture<AccessSettingsComponent>
  let marketPlaceSvc: any
  let snackBar: any
  let iconRegistry: any
  let accessControl: { completeSpvSave: jest.Mock }

  // as the provider access settings read gives them
  const savedSettings = {
    accessControl: {
      version: 2,
      userGroups: [{ userGroupId: 'ug-1', userGroup: 1, licenceAllocation: 400, consumed: 120, userGroupCriteriaList: [] }],
    },
    licence: { consumed: 21496, unaudited: 320 },
  }
  const providerDetails = (data: any = {}) => ({
    id: 'partner-1',
    data: {
      contentPartnerName: 'SIMPLILEARN', licenseType: 'Course', overAllLimit: 40000, licenseConsumedCount: 20996,
      partnerCode: 'SL', providerPreference: true, ...data,
    },
  })
  // the input is set before ngOnChanges, as Angular sets it
  const open = (details: any = providerDetails()) => {
    component.providerDetails = details
    component.ngOnChanges({ providerDetails: new SimpleChange(null, details, true) })
  }
  // what the library's Save emits
  const saveEvent = (overrides: any = {}) => ({
    userGroup: { partnerId: 'partner-1', accessControl: { version: 2, userGroups: [] } },
    accessType: 'custom',
    action: NsAccessControlConfig.SPV_SAVE_ACTION,
    providerPreference: true,
    preferenceChanged: false,
    ...overrides,
  })
  const lastToast = () => snackBar.openFromComponent.mock.calls[snackBar.openFromComponent.mock.calls.length - 1][1].data

  beforeEach(() => {
    marketPlaceSvc = {
      readProviderAccessSettings: jest.fn(() => of({ result: savedSettings })),
      getCoursesList: jest.fn(() => of({ totalCount: 20 })),
      updateProviderPreference: jest.fn(() => of({})),
      upsertProviderAccessSettings: jest.fn(() => of({})),
    }
    snackBar = { openFromComponent: jest.fn() }
    iconRegistry = { addSvgIconLiteral: jest.fn() }
    TestBed.configureTestingModule({
      declarations: [AccessSettingsComponent],
      providers: [
        { provide: MarketplaceService, useValue: marketPlaceSvc },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: MatIconRegistry, useValue: iconRegistry },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { data: { pageData: { data: { access_settings: {
            allowGroupLimit: 6, unauditedlicencesinfo: 'Info', unauditedlicenceszeroinfo: 'Zero info',
          } } } } } },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    fixture = TestBed.createComponent(AccessSettingsComponent)
    component = fixture.componentInstance
    // the library's component, which the tab tells how a save went
    accessControl = { completeSpvSave: jest.fn() }
    component.accessControl = accessControl as any
  })

  it('should register the Manage Selection icon the library uses', () => {
    expect(iconRegistry.addSvgIconLiteral).toHaveBeenCalledWith('svg_search', expect.anything())
  })

  it('should give the library a copy of its config, in the SPV portal mode', () => {
    expect(component.accessControlConfig).not.toBe(SPV_ACCESS_CONTROL_CONFIG)
    expect(component.accessControlConfig.application).toBe(NsAccessControlConfig.Application.SPV)
    expect(component.accessControlConfig.accessControlCriteriaSelection.optionsEntity.map(option => option.label)).toEqual([
      'Organisation', 'Group', 'Designation', 'Service', 'Batch', 'Cadre', 'Verification Status', 'User',
    ])
  })

  describe('reading', () => {
    it('should give the library the provider, its preference and the access settings of marcket_place.json', () => {
      open()

      expect(component.partnerId).toBe('partner-1')
      expect(component.spvProvider).toEqual({
        name: 'SIMPLILEARN',
        licenseType: 'Course',
        overAllLimit: 40000,
        consumedCount: 20996,
        providerPreference: true,
        publishedCourseCount: 20,
        userGroupLimit: 6,
        unauditedLicencesInfo: 'Info',
        unauditedLicencesZeroInfo: 'Zero info',
      })
    })

    it('should read the saved settings and the published courses once for a provider', () => {
      open()
      open(providerDetails({ overAllLimit: 50000 }))

      expect(marketPlaceSvc.readProviderAccessSettings).toHaveBeenCalledTimes(1)
      expect(marketPlaceSvc.readProviderAccessSettings).toHaveBeenCalledWith('partner-1')
      expect(marketPlaceSvc.getCoursesList).toHaveBeenCalledTimes(1)
      expect(marketPlaceSvc.getCoursesList).toHaveBeenCalledWith({
        filterCriteriaMap: { partnerCode: 'SL', status: ['live'] }, pageNumber: 0, pageSize: 1, searchString: '',
      })
      expect(component.savedSettings).toBe(savedSettings)
      // the provider read again is passed on
      expect(component.spvProvider?.overAllLimit).toBe(50000)
    })

    it('should read a preference not chosen yet as none', () => {
      open(providerDetails({ providerPreference: undefined }))
      expect(component.spvProvider?.providerPreference).toBeNull()
    })

    it('should say what the api gives when a read fails, and go on as if nothing were saved', () => {
      marketPlaceSvc.readProviderAccessSettings.mockReturnValue(throwError({ error: { params: { errMsg: 'Invalid partnerId' } } }))
      marketPlaceSvc.getCoursesList.mockReturnValue(throwError({ error: { params: { errmsg: 'Forbidden' } } }))

      open()

      expect(component.savedSettings).toBeNull()
      expect(snackBar.openFromComponent.mock.calls.map((call: any[]) => call[1].data.message)).toEqual(['Invalid partnerId', 'Forbidden'])
      expect(component.spvProvider?.publishedCourseCount).toBeNull()
    })

    it('should show the library once the provider is known', () => {
      fixture.detectChanges()
      expect(fixture.nativeElement.querySelector('sb-uic-access-control')).toBeNull()

      open()
      fixture.detectChanges()

      expect(fixture.nativeElement.querySelector('sb-uic-access-control')).not.toBeNull()
    })
  })

  describe('saving what the library emits', () => {
    beforeEach(() => open())

    it('should save only the user groups when the preference is unchanged, and read them again for their ids', () => {
      const event = saveEvent()

      component.onAccessControlData(event)

      expect(marketPlaceSvc.updateProviderPreference).not.toHaveBeenCalled()
      expect(marketPlaceSvc.upsertProviderAccessSettings).toHaveBeenCalledWith(event.userGroup)
      expect(accessControl.completeSpvSave).toHaveBeenCalledWith()
      expect(marketPlaceSvc.readProviderAccessSettings).toHaveBeenCalledTimes(2)
    })

    it('should save a changed preference first, then the user groups for Yes, and have the page read the provider again', () => {
      const reload = jest.fn()
      component.loadProviderDetails.subscribe(reload)

      component.onAccessControlData(saveEvent({ preferenceChanged: true }))

      expect(marketPlaceSvc.updateProviderPreference).toHaveBeenCalledWith(component.providerDetails, true)
      expect(reload).toHaveBeenCalledWith(true)
      expect(marketPlaceSvc.upsertProviderAccessSettings).toHaveBeenCalled()
      expect(accessControl.completeSpvSave).toHaveBeenCalledWith()
    })

    it('should save only the preference for No', () => {
      component.onAccessControlData(saveEvent({ userGroup: null, providerPreference: false, preferenceChanged: true }))

      expect(marketPlaceSvc.updateProviderPreference).toHaveBeenCalledWith(component.providerDetails, false)
      expect(marketPlaceSvc.upsertProviderAccessSettings).not.toHaveBeenCalled()
      expect(accessControl.completeSpvSave).toHaveBeenCalledWith()
    })

    it('should not save the user groups when the preference could not be saved, and tell the library what the api says', () => {
      marketPlaceSvc.updateProviderPreference.mockReturnValue(throwError({ error: { params: { errMsg: 'Invalid partner' } } }))

      component.onAccessControlData(saveEvent({ preferenceChanged: true }))

      expect(marketPlaceSvc.upsertProviderAccessSettings).not.toHaveBeenCalled()
      expect(accessControl.completeSpvSave).toHaveBeenCalledWith('Invalid partner')
    })

    it('should tell the library what the api says when the user groups could not be saved', () => {
      marketPlaceSvc.upsertProviderAccessSettings.mockReturnValue(throwError({ error: { message: 'Missing or invalid fields: [accessControl]' } }))

      component.onAccessControlData(saveEvent())

      expect(accessControl.completeSpvSave).toHaveBeenCalledWith('Missing or invalid fields: [accessControl]')
      expect(marketPlaceSvc.readProviderAccessSettings).toHaveBeenCalledTimes(1)
    })

    it('should ignore the library\'s other events', () => {
      component.onAccessControlData({ userGroup: [] })

      expect(marketPlaceSvc.updateProviderPreference).not.toHaveBeenCalled()
      expect(marketPlaceSvc.upsertProviderAccessSettings).not.toHaveBeenCalled()
      expect(accessControl.completeSpvSave).not.toHaveBeenCalled()
    })
  })

  it('should say a read failure in an error toast of this tab', () => {
    marketPlaceSvc.readProviderAccessSettings.mockReturnValue(throwError({}))
    open()
    expect(lastToast()).toEqual({ message: 'Something went wrong, please try again later', type: 'error' })
  })
})
