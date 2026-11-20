import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatIconRegistry } from '@angular/material/icon'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute } from '@angular/router'
import { of, Subject, throwError } from 'rxjs'

import { AccessSettingsComponent } from './access-settings.component'
import { MarketplaceService } from '../../services/marketplace.service'
import { EntitySelectionDialogComponent } from '../../dialogs/entity-selection-dialog/entity-selection-dialog.component'
import { USER_GROUP_COLOURS, USER_GROUP_ENTITIES } from '../../models/access-settings.model'

describe('AccessSettingsComponent', () => {
  let component: AccessSettingsComponent
  let fixture: ComponentFixture<AccessSettingsComponent>
  let dialog: any
  let iconRegistry: any
  let marketPlaceSvc: any
  let route: any
  let snackBar: any
  let toast: any

  const setCondition = (groupIndex: number, conditionIndex: number, entity: string, selections: any[]) => {
    const condition = component.conditions(groupIndex).at(conditionIndex)
    condition.get('entity')?.setValue(entity)
    condition.get('selections')?.setValue(selections)
  }

  // A stand-in for the apis: the reads give back what was last saved, the way the live apis do, and a group saved for
  // the first time is given its id
  let api: { settings: any, preference: boolean | null }

  beforeEach(() => {
    api = { settings: null, preference: null }
    dialog = { open: jest.fn() }
    iconRegistry = { addSvgIconLiteral: jest.fn() }
    marketPlaceSvc = {
      getUserCount: jest.fn().mockReturnValue(of({ result: { response: { count: 7 } } })),
      hasCadres: jest.fn().mockReturnValue(true),
      getCoursesList: jest.fn().mockReturnValue(of({ totalCount: 20, data: [] })),
      readProviderAccessSettings: jest.fn(() => of(api.settings)),
      readProviderPreference: jest.fn(() => of(api.preference === null ? null : { result: { data: { providerPreference: api.preference } } })),
      upsertProviderAccessSettings: jest.fn((body: any) => {
        const savedGroups: any[] = api.settings?.result?.accessControl?.userGroups || []
        api.settings = {
          result: {
            ...(api.settings?.result || {}),
            accessControl: {
              version: body.accessControl.version,
              userGroups: body.accessControl.userGroups.map((group: any) => ({
                ...group,
                userGroupId: group.userGroupId || `ug-new-${group.userGroup}`,
                status: 'ACTIVE',
                consumed: savedGroups.find(saved => saved.userGroupId === group.userGroupId)?.consumed || 0,
              })),
            },
          },
        }
        return of({ result: { message: 'Provider access settings saved successfully' } })
      }),
      updateProviderPreference: jest.fn((_details: any, preference: boolean) => {
        api.preference = preference
        return of({})
      }),
      getOrganisationsByIds: jest.fn().mockReturnValue(of({ result: { response: { content: [] } } })),
      searchUsers: jest.fn().mockReturnValue(of({ result: { response: { content: [] } } })),
    }
    route = { snapshot: { data: { pageData: { data: { access_settings: { allowGroupLimit: 5 } } } } } }
    toast = { dismiss: jest.fn() }
    snackBar = { openFromComponent: jest.fn().mockReturnValue(toast) }
    TestBed.configureTestingModule({
      declarations: [AccessSettingsComponent],
      providers: [
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: MatIconRegistry, useValue: iconRegistry },
        { provide: MarketplaceService, useValue: marketPlaceSvc },
        { provide: ActivatedRoute, useValue: route },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    fixture = TestBed.createComponent(AccessSettingsComponent)
    component = fixture.componentInstance
    // licences to give the user groups the tests add
    component.ngOnChanges({ providerDetails: new SimpleChange(null, { data: { overAllLimit: 40000 } }, true) })
    fixture.detectChanges()
  })

  describe('saved settings', () => {
    // as the provider access settings read gives them
    const savedSettings = {
      result: {
        maxUserGroups: 4,
        accessControl: {
          version: 2,
          userGroups: [
            {
              userGroupId: 'ug-2', userGroup: 2, licenceAllocation: 200, status: 'ACTIVE', consumed: 0, remaining: 200,
              userGroupCriteriaList: [{ criteriaKey: 'user', criteriaValue: ['user-1'] }],
            },
            {
              userGroupId: 'ug-1', userGroup: 1, licenceAllocation: 400, status: 'ACTIVE', consumed: 120, remaining: 280,
              userGroupCriteriaList: [
                // the key may come in any case
                { criteriaKey: 'rootorgid', criteriaValue: ['org-1'] },
                { criteriaKey: 'profilestatus', criteriaValue: ['VERIFIED'] },
                { criteriaKey: 'batch', criteriaValue: [2019] },
              ],
            },
            {
              userGroupId: 'ug-0', userGroup: 3, licenceAllocation: 5, status: 'DELETED', consumed: 0, remaining: 5,
              userGroupCriteriaList: [{ criteriaKey: 'group', criteriaValue: ['Group A'] }],
            },
          ],
        },
        licence: {
          overAllLimit: 40000, consumed: 21496, remaining: 18504, allocatedToGroups: 600, consumedInGroups: 120, unaudited: 320, unallocated: 39400,
        },
      },
    }
    // the provider read has Yes saved unless told otherwise; the input is set before ngOnChanges, as Angular sets it
    const open = (partnerId: string, preference: boolean | null = true) => {
      api.preference = preference
      component.providerDetails = { id: partnerId, data: { overAllLimit: 40000 } }
      component.ngOnChanges({ providerDetails: new SimpleChange(null, component.providerDetails, true) })
    }
    const lastToast = () => snackBar.openFromComponent.mock.calls[snackBar.openFromComponent.mock.calls.length - 1][1].data

    beforeEach(() => {
      api.settings = JSON.parse(JSON.stringify(savedSettings))
      marketPlaceSvc.getOrganisationsByIds.mockReturnValue(of({
        result: { response: { content: [{ identifier: 'org-1', channel: 'Org One' }] } },
      }))
      marketPlaceSvc.searchUsers.mockReturnValue(of({
        result: { response: { content: [{ userId: 'user-1', firstName: 'Asha', maskedEmail: 'as**@x.com', maskedPhone: '******1234', rootOrgName: 'Org One' }] } },
      }))
    })

    it('should open with the saved user groups in priority order, as saved', () => {
      open('partner-1')

      expect(marketPlaceSvc.readProviderAccessSettings).toHaveBeenCalledWith('partner-1')
      expect(component.checksEnrolmentHere).toBe(true)
      // marcket_place.json decides how many groups there can be, the read's maxUserGroups (4) doesn't
      expect(component.userGroupLimit).toBe(5)
      expect(component.consumedCount).toBe(21496)
      expect(component.unauditedCount).toBe(320)
      expect(component.userGroups.controls.map(group => [group.get('name')?.value, group.get('licences')?.value]))
        .toEqual([['User Group 1', 400], ['User Group 2', 200]])
      expect(component.userGroups.controls.map(group => component.consumedOf(group))).toEqual([120, 0])
      expect(component.conditions(0).at(0).get('entity')?.value).toBe('rootOrgId')
      expect(component.isInUse(component.userGroups.at(0))).toBe(true)
      expect(component.isInUse(component.userGroups.at(1))).toBe(false)
      expect(component.userCountOf(component.userGroups.at(0))).toBe(7)
      expect(component.hasUnsavedChanges).toBe(false)
    })

    it('should name the saved organisations, users and verification statuses, which are saved by id', () => {
      open('partner-1')

      expect(component.conditions(0).controls.map(condition => condition.get('selections')?.value)).toEqual([
        [{ value: 'org-1', label: 'Org One' }],
        [{ value: 'VERIFIED', label: 'Verified' }],
        [{ value: '2019', label: '2019' }],
      ])
      expect(component.conditions(1).at(0).get('selections')?.value)
        .toEqual([{ value: 'user-1', label: 'Asha', email: 'as**@x.com', mobile: '******1234', ministry: 'Org One' }])
      expect(marketPlaceSvc.getOrganisationsByIds).toHaveBeenCalledWith(['org-1'])
      expect(marketPlaceSvc.searchUsers).toHaveBeenCalledWith('', { identifier: ['user-1'] }, 0, 1)
    })

    it('should show an id when its name can\'t be looked up', () => {
      marketPlaceSvc.getOrganisationsByIds.mockReturnValue(throwError(() => new Error('failed')))
      open('partner-1')

      expect(component.conditions(0).at(0).get('selections')?.value).toEqual([{ value: 'org-1', label: 'org-1' }])
    })

    it('should say what the api gives when a read fails, and go on as if nothing were saved', () => {
      marketPlaceSvc.readProviderAccessSettings.mockReturnValue(
        throwError({ error: { params: { errMsg: 'Invalid partnerId: partner-1' } } }))
      open('partner-1')
      expect(lastToast()).toEqual({ message: 'Invalid partnerId: partner-1', type: 'error' })
      expect(component.userGroups.length).toBe(0)

      // the provider read too, with the gateway's message
      marketPlaceSvc.readProviderAccessSettings.mockReturnValue(of(null))
      marketPlaceSvc.readProviderPreference.mockReturnValue(
        throwError({ error: { params: { errmsg: 'Forbidden: API WHITELIST Access is denied' } } }))
      component.providerDetails = { id: 'partner-2', data: { overAllLimit: 40000 } }
      component.ngOnChanges({ providerDetails: new SimpleChange(null, component.providerDetails, true) })
      expect(lastToast()).toEqual({ message: 'Forbidden: API WHITELIST Access is denied', type: 'error' })
      expect(component.checksEnrolmentHere).toBeNull()
    })

    it('should say what the api gives when a name look-up fails', () => {
      marketPlaceSvc.getOrganisationsByIds.mockReturnValue(throwError({ error: { params: { errmsg: 'Org search failed' } } }))
      open('partner-1')
      expect(lastToast()).toEqual({ message: 'Org search failed', type: 'error' })
    })

    it('should take the preference from the provider read only, leaving it unanswered when the provider has none', () => {
      open('partner-1', false)
      expect(marketPlaceSvc.readProviderPreference).toHaveBeenCalledWith('partner-1')
      expect(component.checksEnrolmentHere).toBe(false)
      expect(component.hasUnsavedChanges).toBe(false)

      // the access settings read has no preference, it is read from the provider only
      open('partner-2', null)
      expect(component.checksEnrolmentHere).toBeNull()
      expect(component.savedPreferenceTitle).toBe('')
    })

    it('should warn only while the saved preference is being changed, either way', () => {
      const warning = () => (fixture.nativeElement as HTMLElement).querySelector('.preference-card .choose-carefully')
        ?.textContent?.replace(/\s+/g, ' ').trim()
      open('partner-1', false)
      fixture.detectChanges()
      expect(warning()).toBeUndefined()

      component.checksEnrolmentHere = true
      fixture.detectChanges()
      expect(warning()).toBe('⚠ You\'re changing the preference. Save to review what this means before it takes effect.')

      component.checksEnrolmentHere = false
      fixture.detectChanges()
      expect(warning()).toBeUndefined()

      open('partner-2', true)
      component.checksEnrolmentHere = false
      fixture.detectChanges()
      expect(warning()).toBeDefined()
    })

    it('should say the saved preference beside the question', () => {
      const question = () => (fixture.nativeElement as HTMLElement).querySelector('.preference-card .field-meta')
        ?.textContent?.replace(/\s+/g, ' ').trim()
      open('partner-1')
      fixture.detectChanges()
      expect(question()).toBe('Validate learner enrolment using provider-level access settings? Saved: Yes')

      open('partner-2', null)
      fixture.detectChanges()
      expect(question()).toBe('Validate learner enrolment using provider-level access settings?')
    })

    it('should read the settings once for a provider', () => {
      open('partner-1')
      open('partner-1')

      expect(marketPlaceSvc.readProviderAccessSettings).toHaveBeenCalledTimes(1)
    })

    it('should save the user groups as the api takes them, with the ids of the saved ones', () => {
      open('partner-1')
      component.userGroups.at(0).get('licences')?.setValue(500)
      component.addUserGroup()
      setCondition(2, 0, 'cadre', [{ value: 'assam', label: 'Assam' }])
      component.userGroups.at(2).get('licences')?.setValue(1)

      component.save()

      expect(dialog.open).not.toHaveBeenCalled()
      expect(marketPlaceSvc.updateProviderPreference).not.toHaveBeenCalled()
      expect(marketPlaceSvc.upsertProviderAccessSettings).toHaveBeenCalledWith({
        partnerId: 'partner-1',
        accessControl: {
          version: 2,
          userGroups: [
            {
              userGroupId: 'ug-1', userGroup: 1, licenceAllocation: 500,
              userGroupCriteriaList: [
                { criteriaKey: 'rootOrgId', criteriaValue: ['org-1'] },
                { criteriaKey: 'profilestatus', criteriaValue: ['VERIFIED'] },
                { criteriaKey: 'batch', criteriaValue: ['2019'] },
              ],
            },
            { userGroupId: 'ug-2', userGroup: 2, licenceAllocation: 200, userGroupCriteriaList: [{ criteriaKey: 'user', criteriaValue: ['user-1'] }] },
            { userGroup: 3, licenceAllocation: 1, userGroupCriteriaList: [{ criteriaKey: 'cadre', criteriaValue: ['assam'] }] },
          ],
        },
      })
      expect(lastToast()).toEqual({ message: 'Access settings saved successfully', type: 'success' })
      expect(component.hasUnsavedChanges).toBe(false)
    })

    it('should read the user groups again after a save, so a new group has the id the api gave it', () => {
      open('partner-1')
      component.addUserGroup()
      setCondition(2, 0, 'cadre', [{ value: 'assam', label: 'Assam' }])
      component.userGroups.at(2).get('licences')?.setValue(1)

      component.save()

      expect(marketPlaceSvc.readProviderAccessSettings).toHaveBeenCalledTimes(2)
      expect(component.userGroups.at(2).get('id')?.value).toBe('ug-new-3')
      expect(component.areConditionsLocked(component.userGroups.at(2))).toBe(true)
      expect(component.hasUnsavedChanges).toBe(false)
    })

    it('should have the page read the provider again once the preference is saved, and not while it is unchanged', () => {
      const reload = jest.fn()
      component.loadProviderDetails.subscribe(reload)
      dialog.open.mockReturnValue({ afterClosed: () => of(true) })
      open('partner-1')
      component.userGroups.at(0).get('licences')?.setValue(500)
      component.save()
      expect(reload).not.toHaveBeenCalled()

      component.checksEnrolmentHere = false
      component.save()
      expect(reload).toHaveBeenCalledWith(true)
      expect(component.savedPreferenceTitle).toBe('No')
    })

    it('should save the preference on the provider first, and the user groups only for Yes', () => {
      marketPlaceSvc.readProviderAccessSettings.mockReturnValue(of(null))
      open('partner-2', null)
      dialog.open.mockReturnValue({ afterClosed: () => of(true) })

      component.checksEnrolmentHere = false
      component.save()

      expect(dialog.open).toHaveBeenCalledWith(component.saveConfirm, expect.objectContaining({ width: '520px' }))
      expect(marketPlaceSvc.updateProviderPreference).toHaveBeenCalledWith(component.providerDetails, false)
      expect(marketPlaceSvc.upsertProviderAccessSettings).not.toHaveBeenCalled()
      expect(component.hasUnsavedChanges).toBe(false)
      expect(component.savedPreferenceTitle).toBe('No')
    })

    describe('the user groups the first save lists', () => {
      beforeEach(() => {
        open('partner-1', null)
        component.checksEnrolmentHere = true
      })

      it('should list every group it saves, saying which are new or changed, and the deleted ones, known by their ids', () => {
        expect(component.userGroupsToSave).toEqual([
          { name: 'User Group 1', detail: '400 licences · Organisation (1), Verification Status (1), Batch (1)' },
          { name: 'User Group 2', detail: '200 licences · User (1)' },
        ])

        component.userGroups.at(0).get('licences')?.setValue(500)
        setCondition(1, 0, 'user', [{ value: 'user-1', label: 'Asha' }, { value: 'user-2', label: 'Ravi' }])
        component.addUserGroup()
        setCondition(2, 0, 'group', [{ value: 'Group A', label: 'Group A' }])
        component.userGroups.at(2).get('licences')?.setValue(100)

        expect(component.userGroupsToSave).toEqual([
          { name: 'User Group 1', detail: '500 licences (was 400) · Organisation (1), Verification Status (1), Batch (1)' },
          { name: 'User Group 2', detail: '200 licences · User (2) · conditions changed' },
          { name: 'User Group 3', detail: 'New · 100 licences · Group (1)' },
        ])

        component.userGroups.removeAt(1)
        expect(component.userGroupsToSave.map(group => [group.name, group.detail.split(' · ')[0]])).toEqual([
          ['User Group 1', '500 licences (was 400)'],
          ['User Group 3', 'New'],
          ['User Group 2', 'Deleted'],
        ])
      })

      it('should show them in the confirmation, and none for No, which saves no groups', () => {
        const view = component.saveConfirm.createEmbeddedView({ dialogRef: { close: jest.fn() } })
        const items = () => view.rootNodes[0].querySelectorAll('.save-changes li')
        component.userGroups.at(0).get('licences')?.setValue(500)
        view.detectChanges()

        expect(Array.from(items()).map((item: any) => item.textContent.replace(/\s+/g, ' ').trim())).toEqual([
          'User Group 1 — 500 licences (was 400) · Organisation (1), Verification Status (1), Batch (1)',
          'User Group 2 — 200 licences · User (1)',
        ])

        component.checksEnrolmentHere = false
        view.detectChanges()
        expect(component.userGroupsToSave).toEqual([])
        expect(view.rootNodes[0].querySelector('.save-changes')).toBeNull()
        view.destroy()
      })
    })

    describe('a change of the saved preference', () => {
      const confirmWith = (answer: boolean) => dialog.open.mockReturnValue({ afterClosed: () => of(answer) })

      it('should confirm Yes to No, then save only the preference, the user groups staying as saved', () => {
        open('partner-1')
        // an unsaved change of a group, which No doesn't save
        component.userGroups.at(0).get('licences')?.setValue(500)
        component.checksEnrolmentHere = false
        confirmWith(true)

        component.save()

        expect(dialog.open).toHaveBeenCalledWith(component.preferenceChangeConfirm, expect.objectContaining({ width: '520px' }))
        expect(marketPlaceSvc.updateProviderPreference).toHaveBeenCalledWith(component.providerDetails, false)
        expect(marketPlaceSvc.upsertProviderAccessSettings).not.toHaveBeenCalled()
        expect(component.checksEnrolmentHere).toBe(false)
        expect(component.savedPreferenceTitle).toBe('No')
        expect(component.hasUnsavedChanges).toBe(false)
        // the groups stay as saved, to come back with Yes
        expect(component.userGroups.controls.map(group => group.get('licences')?.value)).toEqual([400, 200])
      })

      it('should confirm No to Yes, then save the preference and the user groups', () => {
        open('partner-1', false)
        component.checksEnrolmentHere = true
        confirmWith(true)

        component.save()

        expect(dialog.open).toHaveBeenCalledWith(component.preferenceChangeConfirm, expect.anything())
        expect(marketPlaceSvc.updateProviderPreference).toHaveBeenCalledWith(component.providerDetails, true)
        expect(marketPlaceSvc.upsertProviderAccessSettings).toHaveBeenCalled()
        expect(component.hasUnsavedChanges).toBe(false)
        expect(component.savedPreferenceTitle).toBe('Yes')
      })

      it('should save nothing when the change is not confirmed', () => {
        open('partner-1')
        component.checksEnrolmentHere = false
        confirmWith(false)

        component.save()

        expect(marketPlaceSvc.updateProviderPreference).not.toHaveBeenCalled()
        expect(component.checksEnrolmentHere).toBe(false)
        expect(component.hasUnsavedChanges).toBe(true)
      })

      it('should explain what each change does, and answer Go back or Confirm and save', () => {
        const dialogRef = { close: jest.fn() }
        const view = component.preferenceChangeConfirm.createEmbeddedView({ dialogRef })
        const popup = () => view.rootNodes.find(node => node.classList?.contains('save-confirm')) as HTMLElement
        const text = (selector: string) => popup().querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim()

        component.checksEnrolmentHere = false
        view.detectChanges()
        expect(text('.save-confirm-title')).toBe('Change enrolment check preference?')
        expect(text('.save-confirm-body')).toBe('Switching to No: enrolments will no longer be tracked against the user '
          + 'groups below. The groups are kept and will come back if you switch to Yes again. Licences used while the '
          + 'preference is No will show as Unaudited licences.')

        component.checksEnrolmentHere = true
        view.detectChanges()
        expect(text('.save-confirm-body')).toBe('Switching to Yes: the user groups set earlier come back as they were. '
          + 'Licences used while the preference was No will show as Unaudited licences in the licence breakup. If they take the '
          + 'total over the Over All Limit, unused licences are removed from the user groups, starting with #1, until it balances.')
        expect(Array.from(popup().querySelectorAll('.save-confirm-body strong')).map(bold => bold.textContent))
          .toEqual(['Yes', 'Unaudited licences'])

        const button = (selector: string) => popup().querySelector(selector) as HTMLButtonElement
        button('.confirm-back').click()
        button('.confirm-save').click()
        expect(dialogRef.close.mock.calls).toEqual([[false], [true]])
        view.destroy()
      })
    })

    it('should keep the changes unsaved and say why when the save fails, the preference staying saved', () => {
      marketPlaceSvc.readProviderAccessSettings.mockReturnValue(of(null))
      marketPlaceSvc.upsertProviderAccessSettings.mockReturnValue(throwError({ error: { params: { errMsg: 'Invalid criteriaKey' } } }))
      open('partner-2', null)
      dialog.open.mockReturnValue({ afterClosed: () => of(true) })
      component.checksEnrolmentHere = true
      component.addUserGroup()
      setCondition(0, 0, 'group', [{ value: 'Group A', label: 'Group A' }])
      component.userGroups.at(0).get('licences')?.setValue(1)

      component.save()

      expect(lastToast()).toEqual({ message: 'Invalid criteriaKey', type: 'error' })
      expect(component.hasUnsavedChanges).toBe(true)
      expect(component.saving).toBe(false)

      dialog.open.mockClear()
      component.save()
      expect(dialog.open).not.toHaveBeenCalled()
      expect(marketPlaceSvc.updateProviderPreference).toHaveBeenCalledTimes(1)
    })

    it('should not offer Save again while a save is being sent', () => {
      open('partner-1')
      component.userGroups.at(0).get('licences')?.setValue(500)

      component.saving = true

      expect(component.canSave).toBe(false)
    })
  })

  it('should create with no user groups', () => {
    expect(component).toBeTruthy()
    expect(component.userGroups.length).toBe(0)
  })

  it('should register the icons the user group controls use', () => {
    const registeredNames = iconRegistry.addSvgIconLiteral.mock.calls.map((call: any[]) => call[0])
    expect(registeredNames).toEqual(['access_restart', 'access_search_selections'])
  })

  describe('licence summary', () => {
    it('should read the saved provider settings', () => {
      const details = { data: { licenseType: 'Course', overAllLimit: 40000, licenseConsumedCount: 120 } }
      component.ngOnChanges({ providerDetails: new SimpleChange(null, details, true) })

      expect(component.licenseType).toBe('Course')
      expect(component.overAllLimit).toBe(40000)
      expect(component.consumedCount).toBe(120)
      expect(component.unallocatedCount).toBe(40000)
    })

    // a span, not a link: it opens nothing, and the app's global a { text-decoration: none } would drop its underline
    it('should say Edit in Provider Settings as text that opens nothing', () => {
      fixture.detectChanges()
      const edit = (fixture.nativeElement as HTMLElement).querySelector('.edit-link') as HTMLElement
      expect(edit.tagName).toBe('SPAN')
      expect(edit.textContent?.trim()).toBe('Edit in Provider Settings')
    })
  })

  describe('distribution notes', () => {
    const provide = (data: any) => component.ngOnChanges({ providerDetails: new SimpleChange(null, { data }, true) })

    it('should count the published courses of the provider, the way the Courses tab does', () => {
      provide({ contentPartnerName: 'SIMPLILEARN', partnerCode: 'SL' })

      expect(marketPlaceSvc.getCoursesList).toHaveBeenCalledWith({
        filterCriteriaMap: { partnerCode: 'SL', status: ['live'] }, pageNumber: 0, pageSize: 1, searchString: '',
      })
      expect(component.providerCourses).toBe('all 20 SIMPLILEARN courses')
    })

    it('should name the courses without a number while they cannot be counted', () => {
      provide({ contentPartnerName: 'SIMPLILEARN' })
      expect(marketPlaceSvc.getCoursesList).not.toHaveBeenCalled()
      expect(component.providerCourses).toBe('all SIMPLILEARN courses')

      marketPlaceSvc.getCoursesList.mockReturnValue(throwError({ error: { params: { errmsg: 'Search failed' } } }))
      provide({ contentPartnerName: 'SIMPLILEARN', partnerCode: 'SL' })
      expect(component.providerCourses).toBe('all SIMPLILEARN courses')
      // what the api says of it is shown
      expect(snackBar.openFromComponent.mock.calls.map((call: any[]) => call[1].data))
        .toContainEqual({ message: 'Search failed', type: 'error' })
    })

    it('should speak of a single course, and of a provider with no name', () => {
      marketPlaceSvc.getCoursesList.mockReturnValue(of({ totalCount: 1200 }))
      provide({ partnerCode: 'SL' })
      expect(component.providerCourses).toBe('all 1,200 courses of this provider')

      marketPlaceSvc.getCoursesList.mockReturnValue(of({ totalCount: 1 }))
      provide({ contentPartnerName: 'SIMPLILEARN', partnerCode: 'SL' })
      expect(component.providerCourses).toBe('the 1 SIMPLILEARN course')
    })

    it('should explain the groups and the licences under the distribution bar', () => {
      provide({ contentPartnerName: 'SIMPLILEARN', partnerCode: 'SL' })
      component.checksEnrolmentHere = true
      fixture.detectChanges()

      const notes = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.distribution-card .info-note'))
        .map(note => note.textContent?.replace(/\s+/g, ' ').trim())
      expect(notes[0]).toBe('ⓘ Every user group applies to all 20 SIMPLILEARN courses, including courses published later.')
      expect(notes[1]).toBe('ⓘ A learner who is in more than one group uses one licence, from the first group in priority order '
        + '(#1, #2, ... the order the groups were created) that has a licence left. When a learner\'s groups have none left, the '
        + 'learner can\'t enrol until you raise a group\'s allocation. Unallocated licences are not used automatically.')
    })

    it('should no longer ask what happens to the unallocated licences', () => {
      component.checksEnrolmentHere = true
      fixture.detectChanges()
      expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Shared pool')
      expect((fixture.nativeElement as HTMLElement).querySelectorAll('mat-radio-group').length).toBe(1)
    })
  })

  describe('save and reset', () => {
    const confirmWith = (answer: boolean) => dialog.open.mockReturnValue({ afterClosed: () => of(answer) })
    const header = () => fixture.nativeElement as HTMLElement
    const button = (label: string) => Array.from(header().querySelectorAll('.header-actions button'))
      .find(element => element.textContent?.trim() === label) as HTMLButtonElement

    beforeEach(() => {
      component.ngOnChanges({ providerDetails: new SimpleChange(null, { data: { overAllLimit: 40000 } }, true) })
    })

    it('should have nothing to save or reset while nothing has changed', () => {
      fixture.detectChanges()

      expect(component.hasUnsavedChanges).toBe(false)
      expect(button('Reset').disabled).toBe(true)
      expect(button('Save').disabled).toBe(true)
    })

    it('should save once the enrolment check preference is answered', () => {
      component.checksEnrolmentHere = false
      fixture.detectChanges()
      expect(button('Reset').disabled).toBe(false)
      expect(button('Save').disabled).toBe(false)

      confirmWith(true)
      component.save()
      fixture.detectChanges()

      expect(component.hasUnsavedChanges).toBe(false)
      expect(button('Save').disabled).toBe(true)
    })

    it('should say a group with a condition is required, in a toast, when Yes is chosen and no group was added', () => {
      const lastToast = () => snackBar.openFromComponent.mock.calls[snackBar.openFromComponent.mock.calls.length - 1][1]
      component.checksEnrolmentHere = true
      expect(component.userGroups.length).toBe(0)

      component.save()

      expect(dialog.open).not.toHaveBeenCalled()
      expect(lastToast().data).toEqual({ message: 'At least one group with one condition is required to save.', type: 'error' })
      expect(lastToast().panelClass).toEqual(['error', 'access-settings-toast'])
      expect(component.hasUnsavedChanges).toBe(true)
    })

    it('should say Add at least one condition in a toast on Save, counting the other groups with no condition as +1, +2', () => {
      const lastToast = () => snackBar.openFromComponent.mock.calls[snackBar.openFromComponent.mock.calls.length - 1][1]
      component.checksEnrolmentHere = true
      // a group with its condition still on Select has none yet
      component.addUserGroup()
      snackBar.openFromComponent.mockClear()

      component.save()
      expect(lastToast().data).toEqual({ message: 'Add at least one condition', type: 'error' })
      expect(lastToast().panelClass).toEqual(['error', 'access-settings-toast'])

      component.addUserGroup()
      component.save()
      expect(lastToast().data.message).toBe('Add at least one condition +1')

      component.addUserGroup()
      component.save()
      expect(lastToast().data.message).toBe('Add at least one condition +2')

      // a group with a condition isn't counted
      setCondition(0, 0, 'group', [{ value: 'Group A', label: 'Group A' }])
      component.save()
      expect(lastToast().data.message).toBe('Add at least one condition +1')
      expect(dialog.open).not.toHaveBeenCalled()
    })

    it('should name the group whose condition has no value, in a toast on Save', () => {
      const lastToast = () => snackBar.openFromComponent.mock.calls[snackBar.openFromComponent.mock.calls.length - 1][1]
      component.checksEnrolmentHere = true
      component.addUserGroup()
      component.addUserGroup()
      setCondition(0, 0, 'group', [{ value: 'Group A', label: 'Group A' }])
      setCondition(1, 0, 'group', [])
      snackBar.openFromComponent.mockClear()

      component.save()

      expect(component.canSave).toBe(false)
      expect(dialog.open).not.toHaveBeenCalled()
      expect(lastToast().data).toEqual({ message: 'Can\'t save: User Group 2: every condition needs at least one value.', type: 'error' })
      expect(lastToast().panelClass).toEqual(['error', 'access-settings-toast'])
    })

    it('should say a condition left without a field, on its row and in a toast naming the group, on Save', () => {
      const page = () => fixture.nativeElement as HTMLElement
      const rowErrors = () => Array.from(page().querySelectorAll('.selection-error')).map(error => error.textContent?.trim())
      const lastToast = () => snackBar.openFromComponent.mock.calls[snackBar.openFromComponent.mock.calls.length - 1][1]
      component.ngOnChanges({ providerDetails: new SimpleChange(null, { data: { overAllLimit: 40000 } }, true) })
      component.checksEnrolmentHere = true
      component.addUserGroup()
      component.userGroups.at(0).get('licences')?.setValue(1950)
      setCondition(0, 0, 'designation', [{ value: 'Analyst', label: 'Analyst' }])
      // the next condition is added and left without a field
      component.addCondition(0)
      fixture.detectChanges()
      expect(component.conditions(0).length).toBe(2)
      expect(rowErrors()).toEqual([])
      snackBar.openFromComponent.mockClear()

      component.save()
      fixture.detectChanges()

      expect(component.canSave).toBe(false)
      expect(dialog.open).not.toHaveBeenCalled()
      expect(lastToast().data).toEqual({ message: 'Can\'t save: User Group 1: select at least one condition.', type: 'error' })
      expect(rowErrors()).toEqual(['Select at least one condition'])

      setCondition(0, 1, 'group', [{ value: 'Group A', label: 'Group A' }])
      fixture.detectChanges()
      expect(rowErrors()).toEqual([])
    })

    it('should name the group whose allocation is below the licences already used, in a toast on Save', () => {
      const lastToast = () => snackBar.openFromComponent.mock.calls[snackBar.openFromComponent.mock.calls.length - 1][1]
      component.checksEnrolmentHere = true
      component.addUserGroup()
      component.addUserGroup()
      setCondition(0, 0, 'group', [{ value: 'Group A', label: 'Group A' }])
      setCondition(1, 0, 'group', [{ value: 'Group B', label: 'Group B' }])
      component.userGroups.at(1).get('consumed')?.setValue(11876)
      component.userGroups.at(1).get('licences')?.setValue(200)
      snackBar.openFromComponent.mockClear()

      component.save()

      expect(component.userGroups.at(1).get('licences')?.hasError('belowConsumed')).toBe(true)
      expect(component.canSave).toBe(false)
      expect(dialog.open).not.toHaveBeenCalled()
      expect(lastToast().data).toEqual({ message: 'Can\'t save: User Group 2: allocation is below licences already used.', type: 'error' })
      expect(lastToast().panelClass).toEqual(['error', 'access-settings-toast'])
    })

    it('should say the licences exceed the Over All Limit, and by how much, in a toast on Save', () => {
      const lastToast = () => snackBar.openFromComponent.mock.calls[snackBar.openFromComponent.mock.calls.length - 1][1]
      component.checksEnrolmentHere = true
      component.addUserGroup()
      setCondition(0, 0, 'group', [{ value: 'Group A', label: 'Group A' }])
      component.userGroups.at(0).get('licences')?.setValue(component.overAllLimit + 455)
      snackBar.openFromComponent.mockClear()

      component.save()

      expect(component.canSave).toBe(false)
      expect(dialog.open).not.toHaveBeenCalled()
      expect(lastToast().data).toEqual({
        message: 'Can\'t save: Over-allocated by 455',
        type: 'error',
      })
      expect(lastToast().panelClass).toEqual(['error', 'access-settings-toast'])
    })

    it('should not say that with No chosen, or while Save is not offered', () => {
      snackBar.openFromComponent.mockClear()
      component.save()
      component.checksEnrolmentHere = false
      confirmWith(false)
      component.save()

      const messages = snackBar.openFromComponent.mock.calls.map((call: any[]) => call[1].data.message)
      expect(messages).not.toContain('At least one group with one condition is required to save.')
    })

    it('should not save user groups until every condition selects something and the licences fit', () => {
      component.checksEnrolmentHere = true
      expect(component.canSave).toBe(false)

      component.addUserGroup()
      expect(component.canSave).toBe(false)

      setCondition(0, 0, 'group', [{ value: 'Group A', label: 'Group A' }])
      // no licences yet, and 0 is not taken either: a group holds at least 1
      expect(component.canSave).toBe(false)
      component.userGroups.at(0).get('licences')?.setValue(0)
      expect(component.canSave).toBe(false)

      component.userGroups.at(0).get('licences')?.setValue(1)
      expect(component.canSave).toBe(true)

      component.userGroups.at(0).get('licences')?.setValue(50000)
      expect(component.canSave).toBe(false)

      component.userGroups.at(0).get('licences')?.setValue(10)
      component.conditions(0).removeAt(0)
      expect(component.canSave).toBe(false)
    })

    it('should disable Save while the Over All Limit is 0, asking for it in a toast that stays until the tab is left', () => {
      component.checksEnrolmentHere = false
      expect(component.canSave).toBe(true)
      expect(snackBar.openFromComponent).not.toHaveBeenCalled()

      component.ngOnChanges({ providerDetails: new SimpleChange(null, { data: { overAllLimit: 0 } }, true) })
      fixture.detectChanges()

      expect(component.canSave).toBe(false)
      expect(button('Save').disabled).toBe(true)
      const config = snackBar.openFromComponent.mock.calls[0][1]
      expect(config.data).toEqual({ message: 'Set the Over All Limit in Provider Settings first', type: 'error' })
      expect(config.duration).toBe(0)
      expect(config.panelClass).toEqual(['error', 'over-all-limit-toast'])

      component.ngOnDestroy()
      expect(toast.dismiss).toHaveBeenCalled()
    })

    it('should go back to how the page opened when nothing is saved yet', () => {
      component.checksEnrolmentHere = true
      component.addUserGroup()
      confirmWith(true)

      component.reset()

      expect(component.checksEnrolmentHere).toBeNull()
      expect(component.userGroups.length).toBe(0)
      expect(component.hasUnsavedChanges).toBe(false)
    })

    it('should discard only what changed since the last save', () => {
      component.checksEnrolmentHere = true
      component.addUserGroup()
      setCondition(0, 0, 'group', [{ value: 'Group A', label: 'Group A' }])
      component.userGroups.at(0).get('licences')?.setValue(500)
      dialog.open.mockReturnValue({ afterClosed: () => of([{ value: 'Group A', label: 'Group A' }]) })
      component.manageSelection(0, 0)
      confirmWith(true)
      component.save()

      component.addUserGroup()
      component.userGroups.at(0).get('licences')?.setValue(900)
      component.conditions(0).at(0).get('selections')?.setValue([])
      confirmWith(true)
      component.reset()

      expect(component.userGroups.length).toBe(1)
      const group = component.userGroups.at(0)
      expect(group.get('name')?.value).toBe('User Group 1')
      expect(group.get('licences')?.value).toBe(500)
      expect(component.conditions(0).at(0).get('entity')?.value).toBe('group')
      expect(component.conditions(0).at(0).get('selections')?.value).toEqual([{ value: 'Group A', label: 'Group A' }])
      expect(component.userCountOf(group)).toBe(7)
      expect(component.hasUnsavedChanges).toBe(false)
    })

    it('should confirm the preference on the first save, and not again while it stays the same', () => {
      component.checksEnrolmentHere = true
      component.addUserGroup()
      setCondition(0, 0, 'group', [{ value: 'Group A', label: 'Group A' }])
      component.userGroups.at(0).get('licences')?.setValue(1)
      confirmWith(false)
      component.save()

      expect(dialog.open).toHaveBeenCalledWith(component.saveConfirm, expect.objectContaining({ width: '520px' }))
      expect(component.hasUnsavedChanges).toBe(true)

      confirmWith(true)
      component.save()
      expect(component.hasUnsavedChanges).toBe(false)

      dialog.open.mockClear()
      component.userGroups.at(0).get('licences')?.setValue(10)
      component.save()

      expect(dialog.open).not.toHaveBeenCalled()
      expect(component.hasUnsavedChanges).toBe(false)
    })

    it('should name the one-time choice in the confirmation, and answer Go back or Confirm and save', () => {
      const dialogRef = { close: jest.fn() }
      const view = component.saveConfirm.createEmbeddedView({ dialogRef })
      const popup = () => view.rootNodes.find(node => node.classList?.contains('save-confirm')) as HTMLElement
      const text = () => popup().textContent?.replace(/\s+/g, ' ').trim()

      component.checksEnrolmentHere = true
      view.detectChanges()
      expect(text()).toContain('Confirm one-time settings')
      expect(text()).toContain('Enrolment check preference: Yes — provider-level access settings')
      expect(text()).not.toContain('Unallocated licences')
      expect(text()).not.toContain('can\'t be changed')

      component.checksEnrolmentHere = false
      view.detectChanges()
      expect(text()).toContain('Enrolment check preference: No — each course\'s user groups in the Content Portal')
      expect(text()).not.toContain('can\'t be changed')

      const button = (selector: string) => popup().querySelector(selector) as HTMLButtonElement
      button('.confirm-back').click()
      button('.confirm-save').click()
      expect(dialogRef.close.mock.calls).toEqual([[false], [true]])
      view.destroy()
    })

    it('should keep the changes when the reset is not confirmed', () => {
      component.checksEnrolmentHere = false
      confirmWith(false)

      component.reset()

      expect(component.checksEnrolmentHere).toBe(false)
      expect(component.hasUnsavedChanges).toBe(true)
    })

    it('should ask before discarding, and not ask when there is nothing to discard', () => {
      component.reset()
      expect(dialog.open).not.toHaveBeenCalled()

      component.checksEnrolmentHere = false
      confirmWith(false)
      component.reset()
      expect(dialog.open.mock.calls[0][1].data.descriptions[0].header).toBe('Discard unsaved changes?')
      expect(dialog.open.mock.calls[0][1].data.descriptions[0].messages).toBeUndefined()
      expect(dialog.open.mock.calls[0][1].data.descriptions[0].headerClass).toContain('mb-6')
    })

    it('should not count a new user count or consumed licences as a change', () => {
      component.checksEnrolmentHere = true
      component.addUserGroup()
      setCondition(0, 0, 'group', [{ value: 'Group A', label: 'Group A' }])
      component.userGroups.at(0).get('licences')?.setValue(1)
      confirmWith(true)
      component.save()

      component.userGroups.at(0).get('consumed')?.setValue(3)

      expect(component.hasUnsavedChanges).toBe(false)
    })

    it('should lock a restored group that is in use', () => {
      // saved earlier, with 3 learners enrolled through it
      api.preference = true
      api.settings = { result: { accessControl: { version: 1, userGroups: [{
        userGroupId: 'ug-1', userGroup: 1, licenceAllocation: 10, consumed: 3,
        userGroupCriteriaList: [{ criteriaKey: 'group', criteriaValue: ['Group A'] }],
      }] } } }
      component.ngOnChanges({ providerDetails: new SimpleChange(null, { id: 'partner-1', data: { overAllLimit: 40000 } }, true) })

      component.addUserGroup()
      confirmWith(true)
      component.reset()

      expect(component.conditions(0).at(0).get('entity')?.disabled).toBe(true)
      expect(component.consumedOf(component.userGroups.at(0))).toBe(3)
    })
  })

  describe('enrolment check preference', () => {
    const page = () => fixture.nativeElement as HTMLElement
    const choose = (checksHere: boolean | null) => {
      component.checksEnrolmentHere = checksHere
      fixture.detectChanges()
    }

    beforeEach(() => {
      component.ngOnChanges({
        providerDetails: new SimpleChange(null, { data: { contentPartnerName: 'SIMPLILEARN', overAllLimit: 40000 } }, true),
      })
    })

    it('should offer Yes and No, with neither chosen yet', () => {
      expect(component.enrolmentCheckOptions.map(option => [option.value, option.title])).toEqual([[true, 'Yes'], [false, 'No']])
      expect(component.checksEnrolmentHere).toBeNull()
    })

    it('should set no user groups until enrolment is checked here', () => {
      choose(null)
      expect(page().querySelector('.user-groups')).toBeNull()
      expect(page().querySelector('.distribution-card')).toBeNull()
      expect(page().querySelector('.course-check-note')).toBeNull()

      choose(true)
      expect(page().querySelector('.user-groups')).not.toBeNull()
      expect(page().querySelector('.distribution-card')).not.toBeNull()
    })

    it('should leave enrolment to each course when No is chosen, and say so', () => {
      choose(false)

      expect(page().querySelector('.user-groups')).toBeNull()
      expect(page().querySelector('.course-check-note')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
        'ⓘ Enrolment for SIMPLILEARN is validated by each course\'s user groups in the Content Portal. Any user groups set '
        + 'earlier are hidden, not deleted.')
    })

    it('should show no warning while there is no saved preference to change', () => {
      choose(true)
      expect(page().querySelector('.preference-card .choose-carefully')).toBeNull()
    })
  })

  describe('licence distribution', () => {
    const setLimit = (overAllLimit: number, consumed = 0) =>
      component.ngOnChanges({
        providerDetails: new SimpleChange(null, { data: { licenseType: 'Course', overAllLimit, licenseConsumedCount: consumed } }, true),
      })
    const allocate = (groupIndex: number, licences: number | null) =>
      component.userGroups.at(groupIndex).get('licences')?.setValue(licences)

    beforeEach(() => {
      setLimit(40000, 21636)
      component.addUserGroup()
      component.addUserGroup()
      component.addUserGroup()
    })

    it('should start with the whole pool unallocated', () => {
      expect(component.allocatedToGroups).toBe(0)
      expect(component.unallocatedCount).toBe(40000)
      expect(component.segments).toEqual([])
    })

    it('should split the bar by what each group is given, and give each group its own colour', () => {
      allocate(0, 15000)
      allocate(1, 20000)
      allocate(2, 2000)

      expect(component.allocatedToGroups).toBe(37000)
      expect(component.unallocatedCount).toBe(3000)
      expect(component.segments.map(segment => [segment.name, segment.licences, segment.percent])).toEqual([
        ['User Group 1', 15000, '37.5'],
        ['User Group 2', 20000, '50.0'],
        ['User Group 3', 2000, '5.0'],
      ])
      expect(component.segments.map(segment => segment.width)).toEqual([37.5, 50, 5])
      expect(new Set(component.segments.map(segment => segment.colour)).size).toBe(3)
    })

    it('should keep a group\'s colour when the groups before it are left empty', () => {
      allocate(2, 1000)
      expect(component.segments.length).toBe(1)

      allocate(0, 1000)
      const colourOfThirdGroup = component.segments.find(segment => segment.name === 'User Group 3')?.colour
      expect(colourOfThirdGroup).toBe(component.segments[1].colour)
      expect(component.segments[0].colour).not.toBe(colourOfThirdGroup)
    })

    it('should not draw groups that have no licences', () => {
      allocate(0, 0)
      allocate(1, null)
      expect(component.segments).toEqual([])
    })

    it('should accept a group taking exactly what is left', () => {
      allocate(0, 15000)
      allocate(1, 25000)

      expect(component.userGroups.at(1).get('licences')?.valid).toBe(true)
      expect(component.unallocatedCount).toBe(0)
    })

    it('should flag a group asking for more than the pool has left', () => {
      allocate(0, 15000)
      allocate(1, 26000)

      const control = component.userGroups.at(1).get('licences')
      expect(control?.hasError('exceedsLimit')).toBe(true)
      expect(control?.getError('exceedsLimit').available).toBe(25000)
    })

    it('should flag a group again when another group takes its share of the pool', () => {
      allocate(1, 30000)
      expect(component.userGroups.at(1).get('licences')?.valid).toBe(true)

      allocate(0, 15000)
      expect(component.userGroups.at(1).get('licences')?.hasError('exceedsLimit')).toBe(true)
    })

    it('should free the pool when a group is deleted', () => {
      allocate(0, 30000)
      allocate(1, 20000)
      expect(component.userGroups.at(1).get('licences')?.hasError('exceedsLimit')).toBe(true)

      component.removeUserGroup(0)

      expect(component.userGroups.at(0).get('licences')?.valid).toBe(true)
      expect(component.userGroups.at(0).get('name')?.value).toBe('User Group 1')
    })

    it('should flag a group again when the over all limit is lowered', () => {
      allocate(0, 30000)
      expect(component.userGroups.at(0).get('licences')?.valid).toBe(true)

      setLimit(20000)

      expect(component.userGroups.at(0).get('licences')?.hasError('exceedsLimit')).toBe(true)
    })

    it('should reject negative and fractional licences', () => {
      allocate(0, -5)
      expect(component.userGroups.at(0).get('licences')?.hasError('invalidLicence')).toBe(true)

      allocate(0, 2.5)
      expect(component.userGroups.at(0).get('licences')?.hasError('invalidLicence')).toBe(true)
    })

    it('should never let the bar outgrow the pool while an oversized number is typed', () => {
      allocate(0, 50000)

      expect(component.unallocatedCount).toBe(0)
      expect(component.segments[0].width).toBe(100)
    })

    it('should show the over-allocation in red with a banner, and block Save, until allocations fit', () => {
      const page = () => fixture.nativeElement as HTMLElement
      component.checksEnrolmentHere = true
      component.userGroups.controls.forEach((_group, index) => setCondition(index, 0, 'group', [{ value: 'Group A', label: 'Group A' }]))
      allocate(0, 19956)
      allocate(1, 20000)
      allocate(2, 50)
      fixture.detectChanges()

      // each label without its info icon
      const labels = () => Array.from(page().querySelectorAll('.distribution-tile .tile-label')).map(label => {
        const copy = label.cloneNode(true) as HTMLElement
        copy.querySelector('.info-icon')?.remove()
        return copy.textContent?.trim()
      })
      const tiles = Array.from(page().querySelectorAll('.distribution-tile'))
      expect(page().querySelector('.distribution-tiles.has-over-allocation')).not.toBeNull()
      expect(labels()).toEqual(['Over All Limit', 'Allocated to groups', 'Unaudited licences', 'Unallocated', 'Over-allocated by',
        'Consumed (all)'])
      expect(tiles[3].querySelector('.tile-value')?.textContent?.trim()).toBe('0')
      expect(tiles[4].querySelector('.tile-value.over-allocated')?.textContent?.trim()).toBe('6')
      expect(component.unallocatedCount).toBe(0)
      expect(page().querySelector('.distribution-card .licence-error')?.textContent?.replace(/\s+/g, ' ').trim())
        .toBe('⛔ Over-allocated by 6. Group allocations exceed the Over All Limit. Lower allocations by 6 (not below each '
          + 'group\'s consumed licences) or raise the Over All Limit in Provider Settings to save.')
      expect(page().querySelector('.distribution-card .licence-error strong')?.textContent?.trim()).toBe('Over-allocated by 6.')
      expect(component.canSave).toBe(false)
      expect(page().querySelector('.pool-empty-warning')).toBeNull()

      allocate(2, 44)
      fixture.detectChanges()

      expect(component.overAllocatedCount).toBe(0)
      expect(labels()).toEqual(['Over All Limit', 'Allocated to groups', 'Unaudited licences', 'Unallocated', 'Consumed (all)'])
      expect(page().querySelector('.distribution-tiles.has-over-allocation')).toBeNull()
      expect(page().querySelector('.distribution-card .licence-error')).toBeNull()
      expect(component.canSave).toBe(true)
    })

    it('should say what the unallocated licences are for, in green while there are some', () => {
      const tile = () => (fixture.nativeElement as HTMLElement).querySelectorAll('.distribution-tile')[3]
      component.checksEnrolmentHere = true
      allocate(0, 35050)
      fixture.detectChanges()

      expect(tile().querySelector('.tile-value.has-unallocated')?.textContent?.trim()).toBe('4,950')
      expect(tile().querySelector('.tile-note')?.textContent?.trim()).toBe('For raising allocations or adding groups')

      allocate(0, 40000)
      fixture.detectChanges()
      expect(tile().querySelector('.tile-value.has-unallocated')).toBeNull()
      expect(tile().querySelector('.tile-note')?.textContent?.trim()).toBe('For raising allocations or adding groups')
    })

    it('should say no unallocated licences are left only while the groups hold the whole limit', () => {
      const warning = () => (fixture.nativeElement as HTMLElement).querySelector('.pool-empty-warning')
      component.checksEnrolmentHere = true
      allocate(0, 39999)
      fixture.detectChanges()
      expect(warning()).toBeNull()

      allocate(0, 40000)
      fixture.detectChanges()
      expect(warning()?.textContent?.replace(/\s+/g, ' ').trim()).toBe('⚠ No unallocated licences left. Add User Group is disabled and '
        + 'allocations can\'t be raised until another group is lowered or the Over All Limit is raised.')
    })

    it('should block Save when the over all limit is lowered below what the groups hold', () => {
      component.checksEnrolmentHere = true
      component.userGroups.controls.forEach((_group, index) => setCondition(index, 0, 'group', [{ value: 'Group A', label: 'Group A' }]))
      allocate(0, 29998)
      allocate(1, 1)
      allocate(2, 1)
      expect(component.canSave).toBe(true)

      setLimit(20000)

      expect(component.overAllocatedCount).toBe(10000)
      expect(component.canSave).toBe(false)
    })

    it('should draw an empty bar when the provider has no limit yet', () => {
      setLimit(0)
      allocate(0, 100)

      expect(component.segments.every(segment => segment.percent === '0.0')).toBe(true)
    })
  })

  describe('unaudited licences', () => {
    const page = () => fixture.nativeElement as HTMLElement
    const tiles = () => Array.from(page().querySelectorAll('.distribution-tile'))
    // the label without its info icon
    const labels = () => tiles().map(tile => {
      const label = tile.querySelector('.tile-label')?.cloneNode(true) as HTMLElement
      label.querySelector('.info-icon')?.remove()
      return label.textContent?.replace(/\s+/g, ' ').trim()
    })
    const allocate = (groupIndex: number, licences: number | null) =>
      component.userGroups.at(groupIndex).get('licences')?.setValue(licences)
    const showUnaudited = (unaudited: number) => {
      component.checksEnrolmentHere = true
      component.unauditedCount = unaudited
      component.userGroups.controls.forEach((_group, index) => setCondition(index, 0, 'group', [{ value: 'Group A', label: 'Group A' }]))
      fixture.detectChanges()
    }

    beforeEach(() => {
      component.ngOnChanges({
        providerDetails: new SimpleChange(null, { data: { licenseType: 'Course', overAllLimit: 40000, licenseConsumedCount: 0 } }, true),
      })
      component.addUserGroup()
      component.addUserGroup()
      component.addUserGroup()
    })

    it('should always show the Unaudited licences tile, 0 when there are none, with its info icon', () => {
      const popover = () => page().querySelector('.unaudited-tile .info-popover')?.textContent?.trim()
      component.checksEnrolmentHere = true
      fixture.detectChanges()
      expect(labels()).toEqual(['Over All Limit', 'Allocated to groups', 'Unaudited licences', 'Unallocated', 'Consumed (all)'])
      expect(page().querySelector('.unaudited-tile .tile-value')?.textContent?.trim()).toBe('0')
      // while there are none, it says what they are
      expect(popover()).toBe('Licences consumed but not recorded against any user group: enrolments while the preference was No, '
        + 'or enrolments that couldn\'t be recorded against a group while settings were being saved.')

      showUnaudited(1240)
      expect(labels()).toEqual(['Over All Limit', 'Allocated to groups', 'Unaudited licences', 'Unallocated', 'Consumed (all)'])
      expect(page().querySelector('.unaudited-tile .tile-value')?.textContent?.trim()).toBe('1,240')
      expect(popover()).toContain('Due to a switch of the enrolment check preference')
    })

    it('should take what the info icon says while there are none from the assets', () => {
      route.snapshot.data = { pageData: { data: { access_settings: { unauditedlicenceszeroinfo: ' None yet ' } } } }
      fixture = TestBed.createComponent(AccessSettingsComponent)
      component = fixture.componentInstance
      showUnaudited(0)
      expect(component.unauditedLicencesZeroInfo).toBe('None yet')
      expect(page().querySelector('.unaudited-tile .info-popover')?.textContent?.trim()).toBe('None yet')

      route.snapshot.data = { pageData: { data: { access_settings: { unauditedlicenceszeroinfo: '  ' } } } }
      fixture = TestBed.createComponent(AccessSettingsComponent)
      expect(fixture.componentInstance.unauditedLicencesZeroInfo).toContain('Licences consumed but not recorded against any user group')
    })

    it('should say what unaudited licences are on the info icon, as the assets configure it', () => {
      showUnaudited(1240)
      expect(page().querySelector('.unaudited-tile .info-icon')).not.toBeNull()
      expect(page().querySelector('.unaudited-tile .info-popover')?.textContent?.trim()).toBe(
        'Due to a switch of the enrolment check preference, these licence consumptions aren\'t tracked against the user groups set earlier in SPV.')

      route.snapshot.data = { pageData: { data: { access_settings: { unauditedlicencesinfo: ' From the assets ' } } } }
      fixture = TestBed.createComponent(AccessSettingsComponent)
      component = fixture.componentInstance
      showUnaudited(5)
      expect(component.unauditedLicencesInfo).toBe('From the assets')
      expect(page().querySelector('.unaudited-tile .info-popover')?.textContent?.trim()).toBe('From the assets')

      route.snapshot.data = { pageData: { data: { access_settings: { unauditedlicencesinfo: '  ' } } } }
      fixture = TestBed.createComponent(AccessSettingsComponent)
      expect(fixture.componentInstance.unauditedLicencesInfo).toContain('Due to a switch of the enrolment check preference')
    })

    it('should take the unaudited licences off the shared pool', () => {
      allocate(0, 15000)
      allocate(1, 20000)
      allocate(2, 50)
      showUnaudited(1240)

      expect(component.allocatedToGroups).toBe(35050)
      expect(component.unallocatedCount).toBe(3710)
      expect(component.overAllocatedCount).toBe(0)
      expect(tiles()[3].querySelector('.tile-value')?.textContent?.trim()).toBe('3,710')
    })

    it('should draw an Unaudited segment, between the groups and the shared pool, and list it in the legend', () => {
      allocate(0, 15000)
      allocate(1, 20000)
      allocate(2, 50)
      showUnaudited(1240)

      expect(component.unauditedWidth).toBeCloseTo(3.1, 5)
      const bar = Array.from(page().querySelectorAll('.allocation-bar .allocation-segment')) as HTMLElement[]
      expect(bar.map(segment => segment.className.replace('allocation-segment', '').trim()))
        .toEqual(['', '', '', 'unaudited-segment', 'unallocated-segment'])
      expect(Array.from(page().querySelectorAll('.legend-item')).map(item => item.textContent?.replace(/\s+/g, ' ').trim()))
        .toEqual(['User Group 1 · 15,000 (37.5%)', 'User Group 2 · 20,000 (50.0%)', 'User Group 3 · 50 (0.1%)',
          'Unaudited · 1,240 (3.1%)', 'Unallocated · 3,710'])
    })

    it('should show no Unaudited segment or legend entry when there are none', () => {
      allocate(0, 15000)
      showUnaudited(0)

      expect(page().querySelector('.unaudited-segment')).toBeNull()
      expect(page().querySelector('.unaudited-swatch')).toBeNull()
      expect(component.unauditedWidth).toBe(0)
    })

    it('should count the unaudited licences in the over-allocation, say so, and block Save', () => {
      allocate(0, 18999)
      allocate(1, 20000)
      allocate(2, 1)
      showUnaudited(1240)
      expect(component.overAllocatedCount).toBe(240)
      expect(component.unallocatedCount).toBe(0)
      expect(labels()[4]).toBe('Over-allocated by')
      expect(tiles()[4].querySelector('.tile-value.over-allocated')?.textContent?.trim()).toBe('240')
      expect(page().querySelector('.distribution-card .licence-error')?.textContent?.replace(/\s+/g, ' ').trim())
        .toBe('⛔ Over-allocated by 240. Group allocations plus unaudited licences exceed the Over All Limit. Lower allocations by '
          + '240 (not below each group\'s consumed licences) or raise the Over All Limit in Provider Settings to save.')
      expect(component.canSave).toBe(false)
      // the bar holds the whole of it
      expect(component.segments.reduce((total, segment) => total + segment.width, 0) + component.unauditedWidth).toBeCloseTo(100, 5)

      allocate(0, 18759)
      fixture.detectChanges()
      expect(component.overAllocatedCount).toBe(0)
      expect(page().querySelector('.distribution-card .licence-error')).toBeNull()
      expect(component.canSave).toBe(true)
    })

    it('should hold a group back from taking the licences the unaudited ones use', () => {
      showUnaudited(1240)
      allocate(0, 38760)
      expect(component.maxLicencesOf(component.userGroups.at(0))).toBe(38760)
      expect(component.userGroups.at(0).get('licences')?.valid).toBe(true)

      allocate(0, 38761)
      expect(component.userGroups.at(0).get('licences')?.hasError('exceedsLimit')).toBe(true)
      expect(component.maxLicencesOf(component.userGroups.at(1))).toBe(0)
    })

    it('should not allow a new group once the unaudited licences leave no pool', () => {
      showUnaudited(1240)
      allocate(0, 38760)
      expect(component.unallocatedCount).toBe(0)
      expect(component.canAddUserGroup).toBe(false)
    })

    it('should read the unaudited licences from the licence totals of the access settings read', () => {
      marketPlaceSvc.readProviderAccessSettings.mockReturnValue(of({ result: { licence: { consumed: 22236, unaudited: 1240 } } }))
      component.providerDetails = { id: 'partner-9', data: { overAllLimit: 40000 } }
      component.ngOnChanges({ providerDetails: new SimpleChange(null, component.providerDetails, true) })

      expect(component.unauditedCount).toBe(1240)
      expect(component.consumedCount).toBe(22236)
      expect(component.unallocatedCount).toBe(38760)

      marketPlaceSvc.readProviderAccessSettings.mockReturnValue(of({ result: { licence: { unaudited: -5 } } }))
      component.ngOnChanges({ providerDetails: new SimpleChange(null, { id: 'partner-10', data: { overAllLimit: 40000 } }, true) })
      expect(component.unauditedCount).toBe(0)

      marketPlaceSvc.readProviderAccessSettings.mockReturnValue(of(null))
      component.ngOnChanges({ providerDetails: new SimpleChange(null, { id: 'partner-11', data: { overAllLimit: 40000 } }, true) })
      expect(component.unauditedCount).toBe(0)
    })
  })

  describe('licence box', () => {
    const setLimit = (overAllLimit: number) =>
      component.ngOnChanges({
        providerDetails: new SimpleChange(null, { data: { licenseType: 'Course', overAllLimit } }, true),
      })
    const licences = () => component.userGroups.at(0).get('licences')

    beforeEach(() => {
      setLimit(40000)
      component.addUserGroup()
    })

    const group = () => component.userGroups.at(0)
    const consume = (consumed: number) => group().get('consumed')?.setValue(consumed)

    it('should start empty, with no licences, and no borrow or notify options', () => {
      expect(licences()?.value).toBeNull()
      expect(group().get('borrowFromPool')).toBeNull()
      expect(group().get('notifyAtThreshold')).toBeNull()
      expect(component.licencesOf(group())).toBe(0)
      // the licences are still to be given
      expect(licences()?.hasError('required')).toBe(true)
    })

    it('should take licences as a number only, with no percentage to switch to', () => {
      expect(group().get('licenceUnit')).toBeNull()
    })

    it('should show what the licences are as a share of the over all limit', () => {
      licences()?.setValue(15000)
      expect(component.licencePercent(group())).toBe('37.5')
    })

    it('should allow at most what the groups before it leave of the over all limit', () => {
      component.addUserGroup()
      component.addUserGroup()
      licences()?.setValue(15000)
      component.userGroups.at(1).get('licences')?.setValue(20000)
      const thirdGroup = component.userGroups.at(2)

      expect(component.maxLicencesOf(group())).toBe(40000)
      expect(component.maxLicencesOf(thirdGroup)).toBe(5000)
      thirdGroup.get('licences')?.setValue(5001)
      expect(thirdGroup.get('licences')?.getError('exceedsLimit').available).toBe(5000)
    })

    it('should keep an earlier group that fits, and flag only the group that overflows the pool', () => {
      setLimit(1000)
      component.addUserGroup()
      const secondGroup = component.userGroups.at(1)
      licences()?.setValue(500)
      secondGroup.get('licences')?.setValue(600)

      expect(licences()?.valid).toBe(true)
      expect(component.maxLicencesOf(group())).toBe(1000)
      expect(component.maxLicencesOf(secondGroup)).toBe(500)
      expect(secondGroup.get('licences')?.getError('exceedsLimit').available).toBe(500)
    })

    it('should move the error to the later group when an earlier group takes more', () => {
      setLimit(1000)
      component.addUserGroup()
      const secondGroup = component.userGroups.at(1)
      secondGroup.get('licences')?.setValue(600)
      expect(secondGroup.get('licences')?.valid).toBe(true)

      licences()?.setValue(500)

      expect(licences()?.valid).toBe(true)
      expect(secondGroup.get('licences')?.hasError('exceedsLimit')).toBe(true)
    })

    it('should not go below the licences the group has consumed', () => {
      licences()?.setValue(20000)
      consume(11876)

      licences()?.setValue(11875)
      expect(licences()?.getError('belowConsumed').consumed).toBe(11876)

      licences()?.setValue(11876)
      expect(licences()?.valid).toBe(true)
    })

    it('should block Save while the licences are below what the group has consumed', () => {
      component.checksEnrolmentHere = true
      setCondition(0, 0, 'group', [{ value: 'Group A', label: 'Group A' }])
      licences()?.setValue(20000)
      consume(9120)
      expect(component.canSave).toBe(true)

      licences()?.setValue(9119)

      expect(component.licenceErrorMessage(group())).toContain('Can\'t be lower than licences already used (9,120)')
      expect(component.canSave).toBe(false)

      licences()?.setValue(9120)
      expect(component.canSave).toBe(true)
    })

    it('should flag the licences again when the group consumes more than it was given', () => {
      licences()?.setValue(100)
      consume(150)
      expect(licences()?.hasError('belowConsumed')).toBe(true)
    })

    it('should show what is allocated, consumed and still available', () => {
      licences()?.setValue(20000)
      consume(11876)

      expect(component.licencesOf(group())).toBe(20000)
      expect(component.consumedOf(group())).toBe(11876)
      expect(component.availableOf(group())).toBe(8124)
      expect(component.consumedPercent(group())).toBeCloseTo(59.38, 2)
    })

    it('should draw an empty bar for a group with no licences, and never overfill it', () => {
      expect(component.consumedPercent(group())).toBe(0)

      licences()?.setValue(10)
      consume(15)
      expect(component.consumedPercent(group())).toBe(100)
      expect(component.availableOf(group())).toBe(0)
    })

    it('should reject negative and fractional licences', () => {
      licences()?.setValue(-1)
      expect(licences()?.hasError('invalidLicence')).toBe(true)

      licences()?.setValue(10.5)
      expect(licences()?.hasError('invalidLicence')).toBe(true)
    })

    it('should ask for the licences when the field is emptied', () => {
      licences()?.setValue(null)
      expect(licences()?.hasError('required')).toBe(true)
    })

    it('should not let e, + or a second - be typed into the licences', () => {
      component.checksEnrolmentHere = true
      fixture.detectChanges()
      const input = (fixture.nativeElement as HTMLElement).querySelector('.licence-input') as HTMLInputElement
      const press = (key: string) => {
        const event = new KeyboardEvent('keydown', { key, cancelable: true })
        input.dispatchEvent(event)
        return event.defaultPrevented
      }

      expect(['e', 'E', '+'].map(press)).toEqual([true, true, true])
      expect(['5', '-', 'Backspace'].map(press)).toEqual([false, false, false])

      input.value = '-5'
      expect(press('-')).toBe(true)
    })

    it('should show the hint with the least and the most the group can have', () => {
      component.checksEnrolmentHere = true
      licences()?.setValue(50)
      fixture.detectChanges()

      const hint = (fixture.nativeElement as HTMLElement).querySelector('.licence-hint')?.textContent?.replace(/\s+/g, ' ').trim()
      expect(hint).toBe('= 0.1% of Over All Limit · Min 1 · Max 40,000')
    })

    it('should take whole numbers from 1 up, telling 0 is not taken', () => {
      component.checksEnrolmentHere = true
      fixture.detectChanges()
      const input = (fixture.nativeElement as HTMLElement).querySelector('.licence-input') as HTMLInputElement
      expect(input.getAttribute('min')).toBe('1')
      expect(input.placeholder).toBe('1')

      for (const value of [0, -1, 2.5]) {
        licences()?.setValue(value)
        licences()?.markAsTouched()
        expect(licences()?.hasError('invalidLicence')).toBe(true)
        expect(component.licenceErrorMessage(group())).toBe('Enter a whole number of licences.')
      }

      licences()?.setValue(1)
      expect(licences()?.valid).toBe(true)
    })

    it('should give a group in use the licences already consumed as its least', () => {
      component.checksEnrolmentHere = true
      consume(30)
      fixture.detectChanges()
      expect(component.minLicencesOf(group())).toBe(30)
      expect(((fixture.nativeElement as HTMLElement).querySelector('.licence-input') as HTMLInputElement).getAttribute('min'))
        .toBe('30')
    })

    describe('idle licences', () => {
      const select = (users: number) => {
        marketPlaceSvc.getUserCount.mockReturnValue(of({ result: { response: { count: users } } }))
        setCondition(0, 0, 'group', [])
        dialog.open.mockReturnValue({ afterClosed: () => of([{ value: 'Group A', label: 'Group A' }]) })
        component.manageSelection(0, 0)
      }

      it('should warn when a group has more licences than users', () => {
        select(6)
        licences()?.setValue(50)

        expect(component.idleLicencesWarning(group()))
          .toBe('50 licences allocated but only 6 users match this group. 44 licences may sit idle.')
      })

      it('should speak of a single matching user', () => {
        select(1)
        licences()?.setValue(3)
        expect(component.idleLicencesWarning(group())).toBe('3 licences allocated but only 1 user matches this group. 2 licences may sit idle.')
      })

      it('should not warn while the group has enough users, or selects nobody yet', () => {
        licences()?.setValue(50)
        expect(component.idleLicencesWarning(group())).toBe('')

        select(80)
        expect(component.idleLicencesWarning(group())).toBe('')
      })
    })

    describe('licence banners', () => {
      const box = () => fixture.nativeElement as HTMLElement
      const text = (selector: string) => box().querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim()

      beforeEach(() => {
        component.checksEnrolmentHere = true
      })

      it('should show the error across the box, and a used-up group as having nothing available', () => {
        licences()?.setValue(3333)
        consume(9120)
        fixture.detectChanges()

        expect(text('.licence-error')).toBe('⛔ Can\'t be lower than licences already used (9,120). Only unused licences can be removed.')
        expect(box().querySelector('.licence-input')?.classList).toContain('invalid')
        expect(box().querySelector('.available-value')?.classList).toContain('used-up')
        expect(text('.licence-hint')).toBe('= 8.3% of Over All Limit · Min 9,120 · Max 40,000')
      })

      it('should show the idle licences warning while there is no error', () => {
        marketPlaceSvc.getUserCount.mockReturnValue(of({ result: { response: { count: 6 } } }))
        setCondition(0, 0, 'group', [])
        dialog.open.mockReturnValue({ afterClosed: () => of([{ value: 'Group A', label: 'Group A' }]) })
        component.manageSelection(0, 0)
        licences()?.setValue(50)
        fixture.detectChanges()

        expect(text('.idle-warning')).toBe('⚠ 50 licences allocated but only 6 users match this group. 44 licences may sit idle.')
        expect(box().querySelector('.licence-error')).toBeNull()
        expect(box().querySelector('.available-value')?.classList).not.toContain('used-up')
      })

      it('should warn when no users match the conditions applied, and still allow Save', () => {
        fixture.detectChanges()
        expect(box().querySelector('.no-users-warning')).toBeNull()

        marketPlaceSvc.getUserCount.mockReturnValue(of({ result: { response: { count: 0 } } }))
        setCondition(0, 0, 'group', [])
        dialog.open.mockReturnValue({ afterClosed: () => of([{ value: 'Group A', label: 'Group A' }]) })
        component.manageSelection(0, 0)
        fixture.detectChanges()

        expect(text('.licence-box .no-users-warning')).toBe('⚠ No users match these conditions')
        licences()?.setValue(1)
        expect(component.canSave).toBe(true)

        // in place of the idle licences warning, which would say the same
        licences()?.setValue(5)
        fixture.detectChanges()
        expect(text('.licence-box .no-users-warning')).toBe('⚠ No users match these conditions')
        expect(box().querySelector('.idle-warning')).toBeNull()

        // and under a licence error as well
        licences()?.setValue(50000)
        licences()?.markAsTouched()
        fixture.detectChanges()
        expect(text('.licence-box .licence-error')).toBe('⛔ Only 40,000 unallocated licences available')
        expect(text('.licence-box .no-users-warning')).toBe('⚠ No users match these conditions')
      })

      it('should not warn of no users while counting, or once users match', () => {
        const request = new Subject<any>()
        marketPlaceSvc.getUserCount.mockReturnValueOnce(request)
        setCondition(0, 0, 'group', [])
        dialog.open.mockReturnValue({ afterClosed: () => of([{ value: 'Group A', label: 'Group A' }]) })
        component.manageSelection(0, 0)
        fixture.detectChanges()
        expect(box().querySelector('.no-users-warning')).toBeNull()

        request.next({ result: { response: { count: 4 } } })
        request.complete()
        fixture.detectChanges()
        expect(box().querySelector('.no-users-warning')).toBeNull()
      })

      it('should show no checkboxes under the licences', () => {
        fixture.detectChanges()
        expect(box().querySelector('.licence-box mat-checkbox')).toBeNull()
      })
    })

    describe('error message', () => {
      it('should stay empty until the field has been used', () => {
        licences()?.setValue(-1)
        expect(component.licenceErrorMessage(group())).toBe('')
      })

      it('should say how many licences are left when the pool is exceeded', () => {
        licences()?.setValue(50000)
        licences()?.markAsDirty()
        expect(component.licenceErrorMessage(group())).toBe('Only 40,000 unallocated licences available')
      })

      it('should say the licences can\'t go below what is used, even when they were not just changed', () => {
        licences()?.setValue(100)
        consume(9120)
        expect(component.licenceErrorMessage(group()))
          .toBe('Can\'t be lower than licences already used (9,120). Only unused licences can be removed.')
      })

      it('should explain what a number of licences and an empty field need', () => {
        licences()?.markAsDirty()

        licences()?.setValue(-1)
        expect(component.licenceErrorMessage(group())).toBe('Enter a whole number of licences.')

        licences()?.setValue(null)
        expect(component.licenceErrorMessage(group())).toBe('Enter the licences for this group.')
      })

      it('should be gone once the licences fit', () => {
        licences()?.markAsDirty()
        licences()?.setValue(50000)
        licences()?.setValue(100)
        expect(component.licenceErrorMessage(group())).toBe('')
      })
    })
  })

  describe('group header', () => {
    beforeEach(() => component.addUserGroup())

    it('should colour each group by its position, the same as its slice of the bar', () => {
      component.addUserGroup()
      expect(component.groupColour(0)).toBe(USER_GROUP_COLOURS[0])
      expect(component.groupColour(1)).toBe(USER_GROUP_COLOURS[1])
      expect(component.groupColour(USER_GROUP_COLOURS.length)).toBe(USER_GROUP_COLOURS[0])
    })

    it('should start with no users counted', () => {
      expect(component.userCountOf(component.userGroups.at(0))).toBe(0)
    })

    it('should count the users matching the selections once they are applied', () => {
      setCondition(0, 0, 'rootOrgId', [])
      dialog.open.mockReturnValue({ afterClosed: () => of([{ value: 'org-1', label: 'Org One' }]) })

      component.manageSelection(0, 0)

      expect(marketPlaceSvc.getUserCount).toHaveBeenCalledWith({ rootOrgId: ['org-1'], status: 1 })
      expect(component.userCountOf(component.userGroups.at(0))).toBe(7)
    })

    it('should narrow the count by every condition of the group', () => {
      setCondition(0, 0, 'rootOrgId', [{ value: 'org-1', label: 'Org One' }])
      component.addCondition(0)
      setCondition(0, 1, 'group', [{ value: 'Group A', label: 'Group A' }])
      component.addCondition(0)
      setCondition(0, 2, 'designation', [{ value: 'Clerk', label: 'Clerk' }, { value: 'Director', label: 'Director' }])
      component.addCondition(0)
      setCondition(0, 3, 'profilestatus', [{ value: 'VERIFIED', label: 'Verified' }])
      dialog.open.mockReturnValue({ afterClosed: () => of([{ value: 'VERIFIED', label: 'Verified' }]) })

      component.manageSelection(0, 3)

      expect(marketPlaceSvc.getUserCount).toHaveBeenCalledWith({
        'rootOrgId': ['org-1'],
        'profileDetails.professionalDetails.group': ['Group A'],
        'profileDetails.professionalDetails.designation': ['Clerk', 'Director'],
        'profileDetails.profileStatus': ['VERIFIED'],
        'status': 1,
      })
    })

    it('should not ask for a count while nothing is selected', () => {
      component.resetUserGroup(0)

      expect(marketPlaceSvc.getUserCount).not.toHaveBeenCalled()
      expect(component.userCountOf(component.userGroups.at(0))).toBe(0)
    })

    it('should drop the count when the selections are cleared', () => {
      setCondition(0, 0, 'group', [{ value: 'Group A', label: 'Group A' }])
      dialog.open.mockReturnValue({ afterClosed: () => of([{ value: 'Group A', label: 'Group A' }]) })
      component.manageSelection(0, 0)
      expect(component.userCountOf(component.userGroups.at(0))).toBe(7)

      component.resetCondition(0, 0)
      expect(component.userCountOf(component.userGroups.at(0))).toBe(0)
    })

    it('should drop the count when the entity of the condition is changed', () => {
      setCondition(0, 0, 'group', [{ value: 'Group A', label: 'Group A' }])
      dialog.open.mockReturnValue({ afterClosed: () => of([{ value: 'Group A', label: 'Group A' }]) })
      component.manageSelection(0, 0)

      component.onEntityChange(0, 0)
      expect(component.userCountOf(component.userGroups.at(0))).toBe(0)
    })

    it('should count again when a condition is deleted', () => {
      setCondition(0, 0, 'group', [{ value: 'Group A', label: 'Group A' }])
      component.addCondition(0)
      setCondition(0, 1, 'designation', [])
      marketPlaceSvc.getUserCount.mockClear()

      component.removeCondition(0, 1)

      expect(marketPlaceSvc.getUserCount).toHaveBeenCalledWith({
        'profileDetails.professionalDetails.group': ['Group A'],
        'status': 1,
      })
    })

    it('should show no users when the count cannot be read, saying what the api gives', () => {
      marketPlaceSvc.getUserCount.mockReturnValue(throwError({ error: { params: { errmsg: 'Search timed out' } } }))
      setCondition(0, 0, 'group', [{ value: 'Group A', label: 'Group A' }])
      dialog.open.mockReturnValue({ afterClosed: () => of([{ value: 'Group A', label: 'Group A' }]) })

      component.manageSelection(0, 0)

      expect(component.userCountOf(component.userGroups.at(0))).toBe(0)
      const calls = snackBar.openFromComponent.mock.calls
      expect(calls[calls.length - 1][1].data).toEqual({ message: 'Search timed out', type: 'error' })
    })

    it('should show a loader in the Count chip while the users are being counted', () => {
      const request = new Subject<any>()
      marketPlaceSvc.getUserCount.mockReturnValueOnce(request)
      component.checksEnrolmentHere = true
      setCondition(0, 0, 'group', [{ value: 'Group A', label: 'Group A' }])
      dialog.open.mockReturnValue({ afterClosed: () => of([{ value: 'Group A', label: 'Group A' }]) })
      const chip = () => fixture.nativeElement.querySelector('.count-chip') as HTMLElement

      component.manageSelection(0, 0)
      fixture.detectChanges()
      expect(component.isCounting(component.userGroups.at(0))).toBe(true)
      expect(chip().querySelector('.count-loader')).not.toBeNull()

      request.next({ result: { response: { count: 27 } } })
      request.complete()
      fixture.detectChanges()
      expect(component.isCounting(component.userGroups.at(0))).toBe(false)
      expect(chip().querySelector('.count-loader')).toBeNull()
      expect(chip().textContent?.replace(/\s+/g, ' ').trim()).toBe('Count : 27')
    })

    it('should ignore a count that arrives after a newer one was asked for', () => {
      const firstRequest = new Subject<any>()
      marketPlaceSvc.getUserCount.mockReturnValueOnce(firstRequest)
      setCondition(0, 0, 'group', [{ value: 'Group A', label: 'Group A' }])
      dialog.open.mockReturnValue({ afterClosed: () => of([{ value: 'Group A', label: 'Group A' }]) })

      component.manageSelection(0, 0)
      component.manageSelection(0, 0)
      firstRequest.next({ result: { response: { count: 999 } } })

      expect(component.userCountOf(component.userGroups.at(0))).toBe(7)
    })
  })

  describe('groups in use', () => {
    const consume = (groupIndex: number, enrolments: number) => {
      component.userGroups.at(groupIndex).get('consumed')?.setValue(enrolments)
      fixture.detectChanges()
    }
    const chip = () => (fixture.nativeElement as HTMLElement).querySelector('.in-use-chip')?.textContent?.replace(/\s+/g, ' ').trim()

    beforeEach(() => {
      component.ngOnChanges({ providerDetails: new SimpleChange(null, { data: { overAllLimit: 40000 } }, true) })
      component.checksEnrolmentHere = true
      component.addUserGroup()
      setCondition(0, 0, 'service', [{ value: 'indian administrative service', label: 'Indian Administrative Service' }])
      fixture.detectChanges()
    })

    it('should not be marked while nobody has enrolled through the group', () => {
      expect(component.isInUse(component.userGroups.at(0))).toBe(false)
      expect(chip()).toBeUndefined()
    })

    it('should say Exhausted, before the in-use chip, while every licence of the group is used, until it is raised', () => {
      const page = () => fixture.nativeElement as HTMLElement
      const exhausted = () => page().querySelector('.exhausted-chip')?.textContent?.replace(/\s+/g, ' ').trim()
      const group = component.userGroups.at(0)
      group.get('licences')?.setValue(9120)
      consume(0, 9119)
      expect(component.isExhausted(group)).toBe(false)
      expect(exhausted()).toBeUndefined()

      consume(0, 9120)
      expect(component.isExhausted(group)).toBe(true)
      expect(exhausted()).toBe('⛔ Exhausted — learners matching only this group can\'t enrol until you raise its allocation.')
      expect(Array.from(page().querySelectorAll('.group-chip')).map(item => item.classList[1]))
        .toEqual(['count-chip', 'licences-chip', 'exhausted-chip', 'in-use-chip'])
      expect(page().querySelector('.available-value.used-up')).not.toBeNull()

      group.get('licences')?.setValue(10000)
      fixture.detectChanges()
      expect(exhausted()).toBeUndefined()
      expect(page().querySelector('.available-value.used-up')).toBeNull()
    })

    it('should not say Exhausted for a group nobody has enrolled through, even with no licences', () => {
      component.userGroups.at(0).get('licences')?.setValue(0)
      fixture.detectChanges()
      expect(component.isExhausted(component.userGroups.at(0))).toBe(false)
      expect((fixture.nativeElement as HTMLElement).querySelector('.exhausted-chip')).toBeNull()
    })

    it('should only show what a group in use selects: Manage Selection disabled, the selections opened read-only', () => {
      const page = fixture.nativeElement as HTMLElement
      const button = (selector: string) => page.querySelector(selector) as HTMLButtonElement
      const selected = component.conditions(0).at(0).get('selections')?.value
      expect(button('.manage-selection-btn').disabled).toBe(false)

      consume(0, 3)

      expect(button('.manage-selection-btn').disabled).toBe(true)
      expect(button('.items-selected').disabled).toBe(false)
      dialog.open.mockReturnValue({ afterClosed: () => of(undefined) })
      button('.items-selected').click()
      expect(dialog.open.mock.calls[0][1].data).toEqual(expect.objectContaining({ showSelected: true, readOnly: true }))
      expect(component.conditions(0).at(0).get('selections')?.value).toEqual(selected)
    })

    it('should lock the conditions once a save gives the group its id, still letting it be deleted while nobody has enrolled', () => {
      dialog.open.mockReturnValue({ afterClosed: () => of(true) })
      const deleteButton = () => (fixture.nativeElement as HTMLElement).querySelector('[aria-label="Delete user group"]') as HTMLButtonElement
      component.userGroups.at(0).get('licences')?.setValue(100)

      component.save()
      fixture.detectChanges()

      const group = component.userGroups.at(0)
      expect(component.hasUnsavedChanges).toBe(false)
      expect(group.get('id')?.value).toBe('ug-new-1')
      expect(component.isInUse(group)).toBe(false)
      expect(component.conditions(0).at(0).get('entity')?.disabled).toBe(true)
      expect(component.canAddCondition(0)).toBe(false)
      expect(deleteButton().disabled).toBe(false)

      // its licences can still be changed and saved
      group.get('licences')?.setValue(200)
      expect(component.canSave).toBe(true)
    })

    it('should say in the header how many have enrolled, and that the group is locked', () => {
      consume(0, 11876)
      expect(chip()).toBe('🔒 In use — 11,876 enrolments. Conditions locked; can\'t be deleted.')

      consume(0, 1)
      expect(chip()).toBe('🔒 In use — 1 enrolment. Conditions locked; can\'t be deleted.')
    })

    it('should lock the conditions of a group in use and keep it from being deleted', () => {
      component.addCondition(0)
      setCondition(0, 1, 'batch', [{ value: '2018', label: '2018' }])
      consume(0, 5)
      const condition = component.conditions(0).at(0)

      expect(condition.get('entity')?.disabled).toBe(true)
      expect(component.canAddCondition(0)).toBe(false)

      component.removeUserGroup(0)
      component.resetUserGroup(0)
      component.removeCondition(0, 1)
      component.resetCondition(0, 0)

      expect(dialog.open).not.toHaveBeenCalled()
      expect(component.userGroups.length).toBe(1)
      expect(component.conditions(0).length).toBe(2)
      expect(condition.get('entity')?.value).toBe('service')
      expect(component.selectedCount(condition)).toBe(1)
    })

    it('should unlock the conditions again when the group has no enrolments', () => {
      consume(0, 5)
      consume(0, 0)

      expect(component.conditions(0).at(0).get('entity')?.disabled).toBe(false)
      expect(component.canAddCondition(0)).toBe(true)
    })
  })

  describe('saved groups', () => {
    const page = () => fixture.nativeElement as HTMLElement
    const button = (selector: string) => page().querySelector(selector) as HTMLButtonElement
    const users = [{ value: 'user-1', label: 'Rohit Mehta' }, { value: 'user-2', label: 'Asha Rao' }]

    beforeEach(() => {
      component.ngOnChanges({ providerDetails: new SimpleChange(null, { data: { overAllLimit: 40000 } }, true) })
      component.checksEnrolmentHere = true
      // as the api gives a saved group back: with its id, nobody enrolled through it yet
      component.addUserGroup({ id: 'group-1', name: 'User Group 1', licences: 2, consumed: 0,
        conditions: [{ entity: 'user', selections: users }] })
      fixture.detectChanges()
    })

    it('should lock the conditions of a saved group even though nobody has enrolled through it', () => {
      const group = component.userGroups.at(0)
      expect(component.isInUse(group)).toBe(false)
      expect(component.areConditionsLocked(group)).toBe(true)
      expect(component.conditions(0).at(0).get('entity')?.disabled).toBe(true)
      expect(component.canAddCondition(0)).toBe(false)

      expect(button('.manage-selection-btn').disabled).toBe(true)
      expect(button('[aria-label="Delete condition"]').disabled).toBe(true)
      expect(button('[aria-label="Reset user group"]').disabled).toBe(true)
      expect(page().querySelector('.in-use-chip')).toBeNull()
    })

    it('should change nothing of the conditions of a saved group', () => {
      component.resetUserGroup(0)
      component.removeCondition(0, 0)
      component.resetCondition(0, 0)

      expect(component.conditions(0).length).toBe(1)
      expect(component.conditions(0).at(0).get('entity')?.value).toBe('user')
      expect(component.conditions(0).at(0).get('selections')?.value).toEqual(users)
    })

    it('should only show what a saved group selects', () => {
      dialog.open.mockReturnValue({ afterClosed: () => of(undefined) })
      expect(button('.items-selected').disabled).toBe(false)

      button('.items-selected').click()

      expect(dialog.open.mock.calls[0][1].data).toEqual(expect.objectContaining({ showSelected: true, readOnly: true }))
    })

    it('should still let a saved group nobody has enrolled through be deleted, and its licences be changed', () => {
      expect(button('[aria-label="Delete user group"]').disabled).toBe(false)

      component.userGroups.at(0).get('licences')?.setValue(5)
      expect(component.licencesOf(component.userGroups.at(0))).toBe(5)
    })

    it('should keep a group not saved yet editable', () => {
      component.addUserGroup()
      fixture.detectChanges()

      expect(component.areConditionsLocked(component.userGroups.at(1))).toBe(false)
      expect(component.conditions(1).at(0).get('entity')?.enabled).toBe(true)
    })
  })

  describe('user groups', () => {
    const recreateWithConfig = (accessSettings?: any) => {
      route.snapshot.data = accessSettings ? { pageData: { data: { access_settings: accessSettings } } } : {}
      fixture = TestBed.createComponent(AccessSettingsComponent)
      component = fixture.componentInstance
      component.ngOnChanges({ providerDetails: new SimpleChange(null, { data: { overAllLimit: 40000 } }, true) })
    }
    const addGroups = (count: number) => Array.from({ length: count }).forEach(() => component.addUserGroup())
    const addButton = () => fixture.nativeElement.querySelector('.add-group-row .add-link') as HTMLButtonElement
    const note = () => fixture.nativeElement.querySelector('.add-group-note') as HTMLElement | null
    const groupCount = () => fixture.nativeElement.querySelector('.add-group-row .group-count')?.textContent?.trim()

    it('should disable Add User Group while no licences are left unallocated, saying so in place of the count', () => {
      component.checksEnrolmentHere = true
      addGroups(2)
      component.userGroups.at(0).get('licences')?.setValue(30000)
      component.userGroups.at(1).get('licences')?.setValue(10000)
      fixture.detectChanges()

      expect(component.unallocatedCount).toBe(0)
      expect(addButton().disabled).toBe(true)
      expect(addButton().title).toBe('')
      expect(note()?.textContent?.trim())
        .toBe('No unallocated licences left. Increase the Over All Limit or reduce an allocation to add a group.')
      expect(groupCount()).toBeUndefined()
      addGroups(1)
      expect(component.userGroups.length).toBe(2)

      component.userGroups.at(1).get('licences')?.setValue(9999)
      fixture.detectChanges()

      expect(addButton().disabled).toBe(false)
      expect(note()).toBeNull()
      expect(groupCount()).toBe('2 of 5 user groups')
    })

    it('should disable Add User Group while the groups are over-allocated', () => {
      component.checksEnrolmentHere = true
      addGroups(2)
      component.userGroups.at(0).get('licences')?.setValue(30000)
      component.userGroups.at(1).get('licences')?.setValue(12000)
      fixture.detectChanges()

      expect(component.overAllocatedCount).toBe(2000)
      expect(addButton().disabled).toBe(true)
      expect(note()).not.toBeNull()
    })

    it('should disable Add User Group while the provider has no Over All Limit', () => {
      component.ngOnChanges({ providerDetails: new SimpleChange(null, { data: { overAllLimit: 0 } }, true) })
      addGroups(1)
      expect(component.userGroups.length).toBe(0)
      expect(component.canAddUserGroup).toBe(false)
    })

    it('should allow as many user groups as marcket_place.json allows', () => {
      addGroups(6)
      expect(component.userGroupLimit).toBe(5)
      expect(component.userGroups.length).toBe(5)

      recreateWithConfig({ allowGroupLimit: 6 })
      addGroups(7)
      expect(component.userGroups.length).toBe(6)
      expect(component.canAddUserGroup).toBe(false)
    })

    it('should allow 5 user groups when the config gives no usable limit', () => {
      recreateWithConfig()
      expect(component.userGroupLimit).toBe(5)

      recreateWithConfig({ allowGroupLimit: 'six' })
      expect(component.userGroupLimit).toBe(5)

      recreateWithConfig({ allowGroupLimit: 0 })
      expect(component.userGroupLimit).toBe(5)
    })

    it('should disable Add User Group once the limit is reached, counting the groups under it', () => {
      component.checksEnrolmentHere = true
      addGroups(4)
      fixture.detectChanges()
      expect(addButton().disabled).toBe(false)
      expect(groupCount()).toBe('4 of 5 user groups')

      addButton().click()
      fixture.detectChanges()

      expect(component.userGroups.length).toBe(5)
      expect(addButton().disabled).toBe(true)
      expect(addButton().title).toBe('Up to 5 user groups')
      expect(groupCount()).toBe('Maximum 5 user groups.')
    })

    it('should show every group\'s priority next to its name, in the order the groups were created', () => {
      component.checksEnrolmentHere = true
      addGroups(3)
      fixture.detectChanges()

      const pills = Array.from(fixture.nativeElement.querySelectorAll('.group-title .priority-pill')) as HTMLElement[]
      expect(pills.map(pill => pill.textContent?.trim())).toEqual(['#1', '#2', '#3'])
      expect(pills[1].title).toBe('Priority 2')
      expect(pills[0].previousElementSibling?.classList).toContain('group-name')
    })

    it('should still put back saved user groups beyond the limit', () => {
      addGroups(5)
      component.addUserGroup({ name: 'User Group 6', licences: 0, consumed: 0, conditions: [] })

      expect(component.userGroups.length).toBe(6)
    })

    it('should add numbered user groups, each starting with one empty condition', () => {
      component.addUserGroup()
      component.addUserGroup()

      expect(component.userGroups.length).toBe(2)
      expect(component.userGroups.at(0).get('name')?.value).toBe('User Group 1')
      expect(component.userGroups.at(1).get('name')?.value).toBe('User Group 2')
      expect(component.conditions(0).length).toBe(1)
      expect(component.conditions(0).at(0).get('entity')?.value).toBe('')
      expect(component.conditions(0).at(0).getRawValue().conditionType).toBe('is')
    })

    it('should delete an untouched user group straight away and renumber the rest', () => {
      component.addUserGroup()
      component.addUserGroup()
      component.addUserGroup()
      component.removeUserGroup(0)

      expect(dialog.open).not.toHaveBeenCalled()
      expect(component.userGroups.length).toBe(2)
      expect(component.userGroups.at(0).get('name')?.value).toBe('User Group 1')
      expect(component.userGroups.at(1).get('name')?.value).toBe('User Group 2')
    })

    it('should ask before deleting a user group that has selections', () => {
      component.addUserGroup()
      setCondition(0, 0, 'group', [{ value: 'a', label: 'a' }])

      dialog.open.mockReturnValue({ afterClosed: () => of(false) })
      component.removeUserGroup(0)
      expect(component.userGroups.length).toBe(1)
      expect(dialog.open).toHaveBeenCalledWith(component.deleteConfirm, expect.objectContaining({ data: 'User Group 1', width: '470px' }))

      dialog.open.mockReturnValue({ afterClosed: () => of(true) })
      component.removeUserGroup(0)
      expect(component.userGroups.length).toBe(0)
    })

    it('should ask in the delete popup by name, and answer Yes or No', () => {
      const dialogRef = { close: jest.fn() }
      const view = component.deleteConfirm.createEmbeddedView({ $implicit: 'this condition', dialogRef })
      view.detectChanges()
      const popup = view.rootNodes.find(node => node.classList?.contains('delete-confirm')) as HTMLElement

      expect(popup.querySelector('.delete-confirm-title')?.textContent).toBe('Are you sure you want to delete this condition ?')
      expect(popup.querySelector('.delete-confirm-text')?.textContent).toContain('any access permissions associated with it will be removed')

      const button = (selector: string) => popup.querySelector(selector) as HTMLButtonElement
      button('.confirm-no').click()
      button('.confirm-yes').click()
      expect(dialogRef.close.mock.calls).toEqual([[false], [true]])
      view.destroy()
    })

    it('should clear every condition of a user group on reset', () => {
      component.addUserGroup()
      setCondition(0, 0, 'group', [{ value: 'a', label: 'a' }])
      component.addCondition(0)
      setCondition(0, 1, 'designation', [{ value: 'b', label: 'b' }])

      component.resetUserGroup(0)

      expect(component.conditions(0).length).toBe(2)
      component.conditions(0).controls.forEach(condition => {
        expect(condition.get('entity')?.value).toBe('')
        expect(condition.get('selections')?.value).toEqual([])
      })
    })
  })

  describe('conditions', () => {
    beforeEach(() => component.addUserGroup())

    it('should ask for at least one condition once Save is pressed while none has its entity chosen, not saving', () => {
      const error = () => (fixture.nativeElement as HTMLElement).querySelector('.condition-error')?.textContent?.trim()
      const saveButton = () => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.header-actions button'))
        .find(element => element.textContent?.trim() === 'Save') as HTMLButtonElement
      component.checksEnrolmentHere = true
      fixture.detectChanges()
      expect(error()).toBeUndefined()
      expect(saveButton().disabled).toBe(false)

      saveButton().click()
      fixture.detectChanges()
      expect(dialog.open).not.toHaveBeenCalled()
      expect(component.hasUnsavedChanges).toBe(true)
      expect(error()).toBe('Add at least one condition')

      setCondition(0, 0, 'group', [])
      fixture.detectChanges()
      expect(error()).toBeUndefined()

      component.conditions(0).removeAt(0)
      fixture.detectChanges()
      expect(component.conditions(0).length).toBe(0)
      expect(error()).toBe('Add at least one condition')
    })

    it('should keep Add New Condition disabled while the last condition has no selection', () => {
      expect(component.canAddCondition(0)).toBe(false)
      component.addCondition(0)
      expect(component.conditions(0).length).toBe(1)

      setCondition(0, 0, 'group', [])
      expect(component.canAddCondition(0)).toBe(false)
    })

    it('should add a condition once the last one has a selection', () => {
      setCondition(0, 0, 'group', [{ value: 'a', label: 'a' }])
      expect(component.canAddCondition(0)).toBe(true)
      component.addCondition(0)

      expect(component.conditions(0).length).toBe(2)
    })

    it('should offer an entity only once per user group', () => {
      setCondition(0, 0, 'group', [{ value: 'a', label: 'a' }])
      component.addCondition(0)

      const secondOptions = component.availableEntities(0, 1).map(entity => entity.value)
      expect(secondOptions).not.toContain('group')
      // nor User, which is never combined with another condition
      expect(secondOptions.length).toBe(USER_GROUP_ENTITIES.length - 2)

      // the condition that holds an entity still lists it, so it can be changed back
      expect(component.availableEntities(0, 0).map(entity => entity.value)).toContain('group')
    })

    it('should offer User only while it would be the group\'s one condition', () => {
      const offered = (conditionIndex: number) => component.availableEntities(0, conditionIndex).map(entity => entity.value)
      setCondition(0, 0, 'rootOrgId', [{ value: 'org-1', label: 'Org One' }])
      expect(offered(0)).toContain('user')

      component.addCondition(0)
      expect(offered(1)).not.toContain('user')
      expect(offered(0)).not.toContain('user')

      component.conditions(0).removeAt(0)
      expect(offered(0)).toContain('user')
    })

    it('should still list User for a condition that holds it beside others, as a saved group may', () => {
      setCondition(0, 0, 'rootOrgId', [{ value: 'org-1', label: 'Org One' }])
      component.addCondition(0)
      setCondition(0, 1, 'user', [{ value: 'u-1', label: 'Asha', email: '', mobile: '', ministry: '' }])

      expect(component.availableEntities(0, 1).map(entity => entity.value)).toContain('user')
      expect(component.availableEntities(0, 0).map(entity => entity.value)).not.toContain('user')
    })

    it('should list the entities in the dropdown\'s order', () => {
      expect(component.availableEntities(0, 0).map(entity => entity.label)).toEqual([
        'Organisation', 'Group', 'Designation', 'Service', 'Batch', 'Cadre', 'Verification Status', 'User',
      ])
    })

    it('should stop adding conditions once every entity but User is in use', () => {
      // User is never combined with another condition, so the group holds every other entity at most
      const entities = USER_GROUP_ENTITIES.filter(entity => entity.value !== 'user')
      entities.forEach((entity, index) => {
        setCondition(0, index, entity.value, [{ value: 'x', label: 'x' }])
        if (index < entities.length - 1) {
          component.addCondition(0)
        }
      })

      expect(component.conditions(0).length).toBe(USER_GROUP_ENTITIES.length - 1)
      expect(component.canAddCondition(0)).toBe(false)
    })

    it('should add no condition after users are picked', () => {
      setCondition(0, 0, 'user', [{ value: 'u-1', label: 'Asha', email: '', mobile: '', ministry: '' }])

      expect(component.canAddCondition(0)).toBe(false)
      component.addCondition(0)

      expect(component.conditions(0).length).toBe(1)
    })

    it('should say a User condition takes no other in place of Add New Condition, once User is chosen', () => {
      const page = fixture.nativeElement as HTMLElement
      const note = () => page.querySelector('.user-condition-note')?.textContent?.replace(/\s+/g, ' ').trim()
      component.checksEnrolmentHere = true
      setCondition(0, 0, 'user', [])
      fixture.detectChanges()

      expect(note()).toBe('ⓘ The User condition can\'t be combined with other conditions.')
      expect(page.querySelector('.user-group-panel .add-link')).toBeNull()

      setCondition(0, 0, 'group', [])
      fixture.detectChanges()
      expect(note()).toBeUndefined()
      expect(page.querySelector('.user-group-panel .add-link')).not.toBeNull()
    })

    it('should take conditions again once the users are cleared', () => {
      setCondition(0, 0, 'user', [{ value: 'u-1', label: 'Asha', email: '', mobile: '', ministry: '' }])
      expect(component.canAddCondition(0)).toBe(false)

      component.resetCondition(0, 0)
      // the cleared condition needs a selection again first
      expect(component.canAddCondition(0)).toBe(false)

      setCondition(0, 0, 'group', [{ value: 'a', label: 'a' }])
      expect(component.canAddCondition(0)).toBe(true)
    })

    it('should note the limit beside the selections of User, Organisation and Designation', () => {
      component.checksEnrolmentHere = true
      const note = () => {
        fixture.detectChanges()
        return (fixture.nativeElement as HTMLElement).querySelector('.selection-max')?.textContent?.trim()
      }

      setCondition(0, 0, 'rootOrgId', [])
      expect(component.selectionLimitOf(component.conditions(0).at(0))).toBe(500)
      expect(note()).toBe('· max 500')

      setCondition(0, 0, 'group', [])
      expect(component.selectionLimitOf(component.conditions(0).at(0))).toBe(0)
      expect(note()).toBeUndefined()
    })

    it('should not offer Cadre when the services of the group have no cadres', () => {
      setCondition(0, 0, 'service', [{ value: 'assam civil service', label: 'Assam Civil Service' }])
      component.addCondition(0)

      marketPlaceSvc.hasCadres.mockReturnValue(false)
      expect(component.isEntityDisabled(0, 'cadre')).toBe(true)
      expect(marketPlaceSvc.hasCadres).toHaveBeenCalledWith(['assam civil service'])
      expect(component.isEntityDisabled(0, 'batch')).toBe(false)

      marketPlaceSvc.hasCadres.mockReturnValue(true)
      expect(component.isEntityDisabled(0, 'cadre')).toBe(false)
    })

    it('should offer Cadre while the group has no services', () => {
      marketPlaceSvc.hasCadres.mockReturnValue(false)
      expect(component.isEntityDisabled(0, 'cadre')).toBe(false)
    })

    it('should drop the selections when the entity is changed', () => {
      setCondition(0, 0, 'group', [{ value: 'a', label: 'a' }])
      component.onEntityChange(0, 0)

      expect(component.selectedCount(component.conditions(0).at(0))).toBe(0)
    })

    it('should delete a condition without asking when nothing is selected in it', () => {
      setCondition(0, 0, 'group', [{ value: 'a', label: 'a' }])
      component.addCondition(0)
      component.removeCondition(0, 1)

      expect(dialog.open).not.toHaveBeenCalled()
      expect(component.conditions(0).length).toBe(1)
    })

    it('should ask for a value once a field is picked and nothing is selected', () => {
      component.checksEnrolmentHere = true
      fixture.detectChanges()
      const message = () => fixture.nativeElement.querySelector('.selection-error')?.textContent?.trim()
      expect(message()).toBeUndefined()

      setCondition(0, 0, 'group', [])
      fixture.detectChanges()
      expect(message()).toBe('Select at least one value')

      setCondition(0, 0, 'group', [{ value: 'a', label: 'a' }])
      fixture.detectChanges()
      expect(message()).toBeUndefined()
    })

    it('should delete the first condition too, and let the group start again', () => {
      component.checksEnrolmentHere = true
      fixture.detectChanges()
      const deleteButton = () => fixture.nativeElement.querySelector('[aria-label="Delete condition"]') as HTMLButtonElement
      expect(deleteButton().disabled).toBe(false)

      setCondition(0, 0, 'group', [{ value: 'a', label: 'a' }])
      dialog.open.mockReturnValue({ afterClosed: () => of(true) })
      deleteButton().click()

      expect(component.conditions(0).length).toBe(0)
      expect(component.canAddCondition(0)).toBe(true)
      component.addCondition(0)
      expect(component.conditions(0).length).toBe(1)
    })

    it('should reset a single condition', () => {
      setCondition(0, 0, 'group', [{ value: 'a', label: 'a' }])
      component.resetCondition(0, 0)

      expect(component.conditions(0).at(0).get('entity')?.value).toBe('')
      expect(component.selectedCount(component.conditions(0).at(0))).toBe(0)
    })
  })

  describe('manageSelection', () => {
    beforeEach(() => component.addUserGroup())

    it('should do nothing until an entity is picked', () => {
      component.manageSelection(0, 0)
      expect(dialog.open).not.toHaveBeenCalled()
    })

    it('should hand the current selections to the dialog and store what it returns', () => {
      const current = [{ value: 'a', label: 'A' }]
      const chosen = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]
      setCondition(0, 0, 'group', current)
      dialog.open.mockReturnValue({ afterClosed: () => of(chosen) })

      component.manageSelection(0, 0, true)

      expect(dialog.open.mock.calls[0][0]).toBe(EntitySelectionDialogComponent)
      expect(dialog.open.mock.calls[0][1].data).toEqual({
        entity: 'group',
        entityLabel: 'Group',
        selected: current,
        showSelected: true,
        narrowBy: { services: [], cadres: [], batchYears: [] },
        filters: {},
        readOnly: false,
      })
      expect(component.conditions(0).at(0).get('selections')?.value).toEqual(chosen)
    })

    it('should narrow the services, cadres and batches by what the group selects of them', () => {
      setCondition(0, 0, 'service', [{ value: 'indian administrative service', label: 'Indian Administrative Service' }])
      component.addCondition(0)
      setCondition(0, 1, 'batch', [{ value: '2018', label: '2018' }, { value: '2019', label: '2019' }])
      component.addCondition(0)
      setCondition(0, 2, 'cadre', [])
      dialog.open.mockReturnValue({ afterClosed: () => of([{ value: 'assam', label: 'Assam' }]) })

      component.manageSelection(0, 2)

      expect(dialog.open.mock.calls[0][1].data).toEqual(expect.objectContaining({
        entity: 'cadre',
        entityLabel: 'Cadre',
        narrowBy: { services: ['indian administrative service'], cadres: [], batchYears: [2018, 2019] },
      }))
      expect(marketPlaceSvc.getUserCount).toHaveBeenLastCalledWith({
        'profileDetails.cadreDetails.civilServiceName': ['indian administrative service'],
        'profileDetails.cadreDetails.cadreBatch': [2018, 2019],
        'profileDetails.cadreDetails.cadreName': ['assam'],
        'status': 1,
      })
    })

    it('should pick users in the Users dialog, narrowed by the other conditions of the group', () => {
      const current = [{ value: 'u-1', label: 'Asha', email: 'asha@example.com', mobile: '9876543210', ministry: 'Org One' }]
      const chosen = [...current, { value: 'u-2', label: 'Ravi', email: '', mobile: '', ministry: 'Org One' }]
      setCondition(0, 0, 'rootOrgId', [{ value: 'org-1', label: 'Org One' }])
      component.addCondition(0)
      setCondition(0, 1, 'user', current)
      dialog.open.mockReturnValue({ afterClosed: () => of(chosen) })

      component.manageSelection(0, 1, true)

      expect(dialog.open.mock.calls[0][0]).toBe(EntitySelectionDialogComponent)
      expect(dialog.open.mock.calls[0][1].data).toEqual(expect.objectContaining({
        entity: 'user',
        selected: current,
        showSelected: true,
        filters: { rootOrgId: ['org-1'] },
      }))
      expect(component.conditions(0).at(1).get('selections')?.value).toEqual(chosen)
      expect(marketPlaceSvc.getUserCount).toHaveBeenLastCalledWith({ rootOrgId: ['org-1'], identifier: ['u-1', 'u-2'], status: 1 })
    })

    it('should open the column conditions as wide as the creation portal, the Users table and plain lists narrower', () => {
      dialog.open.mockReturnValue({ afterClosed: () => of(undefined) })
      setCondition(0, 0, 'rootOrgId', [])
      component.manageSelection(0, 0)
      setCondition(0, 0, 'group', [])
      component.manageSelection(0, 0)
      setCondition(0, 0, 'service', [])
      component.manageSelection(0, 0)
      setCondition(0, 0, 'user', [])
      component.manageSelection(0, 0)

      expect(dialog.open.mock.calls.map((call: any[]) => call[1].width)).toEqual(['1032px', '720px', '1032px', '1090px'])
    })

    it('should keep the selections when the dialog is cancelled', () => {
      const current = [{ value: 'a', label: 'A' }]
      setCondition(0, 0, 'group', current)
      dialog.open.mockReturnValue({ afterClosed: () => of(undefined) })

      component.manageSelection(0, 0)

      expect(component.conditions(0).at(0).get('selections')?.value).toEqual(current)
    })
  })
})
