import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { of, throwError } from 'rxjs'

import { EntitySelectionDialogComponent } from './entity-selection-dialog.component'
import { MarketplaceService } from '../../services/marketplace.service'
import { ISelectionDialogData, IUserSelection } from '../../models/access-settings.model'

const CADRE_CONFIG = {
  civilServiceType: {
    civilServiceTypeList: [
      {
        id: 'cst-1',
        name: 'All India Services',
        serviceList: [{
          id: 'cs-1', name: 'Indian Administrative Service', commonBatchStartYear: 2018, commonBatchEndYear: 2020,
          cadreList: [
            { id: 'c-1', name: 'Assam', startBatchYear: 2018, endBatchYear: 2019 },
            { id: 'c-2', name: 'Bihar', startBatchYear: 2019, endBatchYear: 2020 },
          ],
        }],
      },
      {
        id: 'cst-2',
        name: 'Central Services',
        serviceList: [{
          id: 'cs-1', name: 'Indian Railway Service', commonBatchStartYear: 2024, commonBatchEndYear: 2027,
          cadreList: [{ id: 'c-3', name: 'Traffic', startBatchYear: 2024, endBatchYear: 2027 }],
        }],
      },
      {
        id: 'cst-3',
        name: 'State Service',
        states: [
          {
            id: 's-1',
            name: 'Kerala',
            serviceList: [{
              id: 'cs-1', name: 'Secretariat Service', commonBatchStartYear: 1985, commonBatchEndYear: 1986,
              cadreList: [{ id: 'c-4', name: 'Kerala Secretariat', startBatchYear: 1985, endBatchYear: 1986 }],
            }],
          },
          {
            id: 's-2',
            name: 'Assam',
            serviceList: [
              { id: 'cs-1', name: 'Secretariat Service', commonBatchStartYear: 1990, commonBatchEndYear: 1995 },
              { id: 'cs-2', name: 'Assam Civil Service', commonBatchStartYear: 2000, commonBatchEndYear: 2001 },
            ],
          },
        ],
      },
    ],
  },
}

const ASHA = {
  userId: 'u-1',
  firstName: 'Asha',
  rootOrgName: 'Org One',
  profileDetails: { personalDetails: { primaryEmail: 'asha@example.com', mobile: 9876543210 } },
}
const RAVI = {
  userId: 'u-2',
  firstName: 'Ravi',
  rootOrgName: 'Org Two',
  maskedEmail: 'ra**@example.com',
  maskedPhone: '******3211',
  profileDetails: { personalDetails: { primaryEmail: 'ravi@example.com', mobile: '9876543211' } },
}
const asha: IUserSelection = { value: 'u-1', label: 'Asha', email: 'as**@example.com', mobile: '******3210', ministry: 'Org One' }
const ravi: IUserSelection = { value: 'u-2', label: 'Ravi', email: 'ra**@example.com', mobile: '******3211', ministry: 'Org Two' }

const usersResponse = (users: any[], count = users.length) => of({ result: { response: { count, content: users } } })

describe('EntitySelectionDialogComponent', () => {
  let component: EntitySelectionDialogComponent
  let fixture: ComponentFixture<EntitySelectionDialogComponent>
  let dialogRef: any
  let marketPlaceSvc: any
  let snackBar: any
  let toast: any

  const createComponent = (data: Partial<ISelectionDialogData>) => {
    TestBed.configureTestingModule({
      declarations: [EntitySelectionDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MarketplaceService, useValue: marketPlaceSvc },
        { provide: MatSnackBar, useValue: snackBar },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            entity: 'rootOrgId',
            entityLabel: 'Organisation',
            selected: [],
            showSelected: false,
            narrowBy: { services: [], cadres: [], batchYears: [] },
            filters: {},
            ...data,
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    fixture = TestBed.createComponent(EntitySelectionDialogComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  const lastSearch = () => marketPlaceSvc.searchUsers.mock.calls[marketPlaceSvc.searchUsers.mock.calls.length - 1]

  beforeEach(() => {
    dialogRef = { close: jest.fn() }
    toast = { dismiss: jest.fn() }
    snackBar = { openFromComponent: jest.fn().mockReturnValue(toast) }
    // the cadre config is read and indexed by the real service, the searches are stubbed
    const http: any = { get: jest.fn().mockReturnValue(of({ result: { response: { value: CADRE_CONFIG } } })) }
    marketPlaceSvc = Object.assign(new MarketplaceService(http), {
      searchOrganisations: jest.fn().mockReturnValue(of({
        result: {
          response: {
            count: 150,
            content: [
              { identifier: 'o1', channel: 'Org One' },
              { identifier: 'o2', channel: 'Org Two' },
            ],
          },
        },
      })),
      searchDesignations: jest.fn().mockReturnValue(of({
        result: { result: { totalCount: 2, data: [{ designation: 'Clerk', id: '1' }, { designation: 'Director', id: '2' }] } },
      })),
      getGroupsList: jest.fn().mockReturnValue(of({ result: { response: ['Group A', 'Group B'] } })),
      searchUsers: jest.fn().mockReturnValue(usersResponse([ASHA, RAVI], 12)),
    })
  })

  it('should list organisations as identifier and name, and offer more when the server has more', () => {
    createComponent({})

    expect(marketPlaceSvc.searchOrganisations).toHaveBeenCalledWith('', 0, 100, 'A')
    expect(component.items).toEqual([{ value: 'o1', label: 'Org One' }, { value: 'o2', label: 'Org Two' }])
    expect(component.hasMore).toBe(true)
  })

  it('should fetch the next page and not repeat items already listed', () => {
    createComponent({})
    marketPlaceSvc.searchOrganisations.mockReturnValue(of({
      result: { response: { count: 3, content: [{ identifier: 'o2', channel: 'Org Two' }, { identifier: 'o3', channel: 'Org Three' }] } },
    }))

    component.loadMore()

    expect(marketPlaceSvc.searchOrganisations).toHaveBeenLastCalledWith('', 100, 100, 'A')
    expect(component.items.map(item => item.value)).toEqual(['o1', 'o2', 'o3'])
    expect(component.hasMore).toBe(false)
  })

  it('should search organisations on the server from the first page', () => {
    createComponent({})
    component.searchControl.setValue('  ministry ')
    component.search()

    expect(marketPlaceSvc.searchOrganisations).toHaveBeenLastCalledWith('ministry', 0, 100, '')
  })

  it('should list designations by name', () => {
    createComponent({ entity: 'designation', entityLabel: 'Designation' })

    expect(marketPlaceSvc.searchDesignations).toHaveBeenCalledWith('', 0, 100, 'A')
    expect(component.items).toEqual([{ value: 'Clerk', label: 'Clerk' }, { value: 'Director', label: 'Director' }])
    expect(component.hasMore).toBe(false)
  })

  it('should filter groups on the page without calling the server again', () => {
    createComponent({ entity: 'group', entityLabel: 'Group' })
    component.searchControl.setValue('group b')
    component.search()

    expect(marketPlaceSvc.getGroupsList).toHaveBeenCalledTimes(1)
    expect(component.visibleItems).toEqual([{ value: 'Group B', label: 'Group B' }])
  })

  it('should offer the verification statuses without any request', () => {
    createComponent({ entity: 'profilestatus', entityLabel: 'Verification Status' })

    expect(component.items.map(item => item.value)).toEqual(['VERIFIED', 'NOT-VERIFIED'])
    expect(marketPlaceSvc.getGroupsList).not.toHaveBeenCalled()
  })

  it('should start on the Selected tab when asked to and something is selected', () => {
    createComponent({ selected: [{ value: 'o9', label: 'Org Nine' }], showSelected: true })

    expect(component.activeTab).toBe(1)
    expect(component.visibleItems).toEqual([{ value: 'o9', label: 'Org Nine' }])
  })

  it('should start on the All tab when nothing is selected', () => {
    createComponent({ showSelected: true })
    expect(component.activeTab).toBe(0)
  })

  it('should return the selections, kept across searches, when applied', () => {
    createComponent({ selected: [{ value: 'o9', label: 'Org Nine' }] })

    component.toggleItem(component.items[0], true)
    component.toggleItem({ value: 'o9', label: 'Org Nine' }, false)
    component.toggleItem(component.items[1], true)
    component.apply()

    expect(dialogRef.close).toHaveBeenCalledWith([
      { value: 'o1', label: 'Org One' },
      { value: 'o2', label: 'Org Two' },
    ])
  })

  it('should select and clear everything listed with Select All', () => {
    createComponent({})

    component.toggleAll(true)
    expect(component.areAllVisibleSelected).toBe(true)
    expect(component.selectedItems.size).toBe(2)

    component.toggleAll(false)
    expect(component.selectedItems.size).toBe(0)
  })

  it('should close without a value when cancelled', () => {
    createComponent({})
    component.cancel()
    expect(dialogRef.close).toHaveBeenCalledWith()
  })

  it('should flag a failed load so it can be retried', () => {
    marketPlaceSvc.searchOrganisations.mockReturnValue(throwError(() => new Error('failed')))
    createComponent({})

    expect(component.loadError).toBe(true)
    expect(component.isLoading).toBe(false)
  })

  describe('read-only', () => {
    const selected = [{ value: 'org-1', label: 'Org One' }]
    const page = () => fixture.nativeElement as HTMLElement

    beforeEach(() => createComponent({ selected, showSelected: true, readOnly: true }))

    it('should show the selections without letting any be ticked or cleared', () => {
      expect(component.activeTab).toBe(1)
      expect(component.canToggle(selected[0])).toBe(false)

      component.toggleItem(selected[0], false)
      component.toggleItem({ value: 'org-2', label: 'Org Two' }, true)
      component.toggleAll(false)

      expect(Array.from(component.selectedItems.keys())).toEqual(['org-1'])
      expect(page().querySelector('.select-all')).toBeNull()
    })

    it('should title the popup by the entity with (view only)', () => {
      expect(page().querySelector('[mat-dialog-title]')?.textContent?.trim()).toBe('Organisation (view only)')

      const titleFor = (entity: string, entityLabel: string) => {
        component.data.entity = entity
        component.data.entityLabel = entityLabel
        return component.dialogTitle
      }
      expect(titleFor('service', 'Service')).toBe('Services (view only)')
      expect(titleFor('user', 'User')).toBe('Users (view only)')
      expect(titleFor('cadre', 'Cadre')).toBe('Cadre (view only)')
    })

    it('should offer Close in place of Apply, closing with nothing to apply', () => {
      const buttons = Array.from(page().querySelectorAll('.dialog-footer button')).map(button => button.textContent?.trim())
      expect(buttons).toEqual(['Close'])

      ;(page().querySelector('.read-only-close') as HTMLButtonElement).click()
      expect(dialogRef.close).toHaveBeenCalledWith()
    })
  })

  describe('services', () => {
    const labels = () => component.items.map(item => item.label)

    it('should list each service once by name, valued in lower case the way the creation portal saves it', () => {
      createComponent({ entity: 'service', entityLabel: 'Service' })

      expect(component.items).toEqual([
        { value: 'indian administrative service', label: 'Indian Administrative Service' },
        { value: 'indian railway service', label: 'Indian Railway Service' },
      ])
    })

    it('should lay the services out like the creation portal: one run of columns, no letter bar, a plural title', () => {
      createComponent({ entity: 'service', entityLabel: 'Service' })

      expect(component.layout).toBe('columns')
      expect(component.dialogTitle).toBe('Select Services')
      expect(component.tabNoun).toBe('Services')
      expect(component.canSelectAll).toBe(true)
      expect(component.barLabels).toEqual([])
      expect(component.sections).toEqual([{
        label: 'All',
        columns: [[
          { value: 'indian administrative service', label: 'Indian Administrative Service' },
          { value: 'indian railway service', label: 'Indian Railway Service' },
        ]],
      }])
    })

    it('should keep the other titles in the singular', () => {
      createComponent({})
      expect(component.dialogTitle).toBe('Select Organisation')
    })

    it('should offer neither the State Service type nor its services', () => {
      createComponent({ entity: 'service', entityLabel: 'Service' })

      expect(component.serviceTypes).toEqual(['All Services', 'All India Services', 'Central Services'])
      expect(labels()).not.toContain('Secretariat Service')
      expect(labels()).not.toContain('Assam Civil Service')
    })

    it('should list the services of the type picked', () => {
      createComponent({ entity: 'service', entityLabel: 'Service' })

      component.onServiceTypeChange('Central Services')
      expect(labels()).toEqual(['Indian Railway Service'])

      component.onServiceTypeChange('All India Services')
      expect(labels()).toEqual(['Indian Administrative Service'])

      component.onServiceTypeChange('All Services')
      expect(labels()).toEqual(['Indian Administrative Service', 'Indian Railway Service'])
    })

    it('should keep the selections when the type changes', () => {
      createComponent({ entity: 'service', entityLabel: 'Service' })
      component.toggleItem(component.items[0], true)

      component.onServiceTypeChange('Central Services')
      component.apply()

      expect(dialogRef.close).toHaveBeenCalledWith([{ value: 'indian administrative service', label: 'Indian Administrative Service' }])
    })

    it('should only list the services the cadres and batches of the group allow', () => {
      createComponent({ entity: 'service', entityLabel: 'Service', narrowBy: { services: [], cadres: ['traffic'], batchYears: [] } })
      expect(labels()).toEqual(['Indian Railway Service'])
    })

    it('should flag a cadre config that could not be read, and read it again on retry', () => {
      jest.spyOn(marketPlaceSvc, 'getCadreConfig').mockReturnValueOnce(throwError(() => new Error('failed')))
      createComponent({ entity: 'service', entityLabel: 'Service' })
      expect(component.loadError).toBe(true)

      component.loadItems()
      expect(component.loadError).toBe(false)
      expect(component.items.length).toBe(2)
    })
  })

  describe('cadres', () => {
    it('should lay the cadres out like the creation portal: one run of columns that scroll sideways, no bar', () => {
      createComponent({ entity: 'cadre', entityLabel: 'Cadre' })

      expect(component.layout).toBe('columns')
      expect(component.dialogTitle).toBe('Select Cadre')
      expect(component.tabNoun).toBe('Cadre')
      expect(component.canSelectAll).toBe(true)
      expect(component.barLabels).toEqual([])
      expect(component.sections.map(section => [section.label, section.columns.map(column => column.length)])).toEqual([
        ['All', [4]],
      ])
    })

    it('should list each cadre once by name, in lower case', () => {
      createComponent({ entity: 'cadre', entityLabel: 'Cadre' })
      expect(component.items.map(item => item.value)).toEqual(['assam', 'bihar', 'kerala secretariat', 'traffic'])
    })

    it('should only list the cadres the services and batches of the group allow', () => {
      createComponent({
        entity: 'cadre',
        entityLabel: 'Cadre',
        narrowBy: { services: ['indian administrative service'], cadres: [], batchYears: [2018] },
      })
      expect(component.items).toEqual([{ value: 'assam', label: 'Assam' }])
    })
  })

  describe('batches', () => {
    it('should group the years by the creation portal ranges, and the later years by a range of their own', () => {
      createComponent({ entity: 'batch', entityLabel: 'Batch' })

      expect(component.batchGroups.map(group => [group.label, group.items.map(item => item.value)])).toEqual([
        ['1960-1990', ['1985', '1986']],
        ['1991-2020', ['2018', '2019', '2020']],
        ['2021-2025', ['2024', '2025']],
        ['2026-2027', ['2026', '2027']],
      ])
    })

    it('should only list the years the services of the group allow, and filter them as typed', () => {
      createComponent({
        entity: 'batch',
        entityLabel: 'Batch',
        narrowBy: { services: ['indian administrative service'], cadres: [], batchYears: [] },
      })
      expect(component.items.map(item => item.value)).toEqual(['2018', '2019', '2020'])

      component.searchControl.setValue('19')
      expect(component.batchGroups).toEqual([{ label: '1991-2020', items: [{ value: '2019', label: '2019' }] }])
    })

    it('should lay the years out in columns under their range, with the ranges in the bar', () => {
      createComponent({ entity: 'batch', entityLabel: 'Batch' })

      expect(component.tabNoun).toBe('Batches')
      expect(component.barLabels).toEqual(['1960-1990', '1991-2020', '2021-2025', '2026-2027'])
      expect(component.sections.map(section => [section.label, section.columns.map(column => column.length)])).toEqual([
        ['1960-1990', [2]], ['1991-2020', [3]], ['2021-2025', [2]], ['2026-2027', [2]],
      ])
    })

    it('should scroll to the range picked', () => {
      const scrollIntoView = jest.fn()
      Element.prototype.scrollIntoView = scrollIntoView
      createComponent({ entity: 'batch', entityLabel: 'Batch' })

      component.onBarClick('1991-2020')

      expect(component.activeBarLabel).toBe('1991-2020')
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'nearest', inline: 'start' })
    })
  })

  describe('column layout', () => {
    const orgs = (...names: string[]) => of({
      result: { response: { count: names.length, content: names.map((name, index) => ({ identifier: `o${index}`, channel: name })) } },
    })
    const LETTERS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), '#']

    it('should be used for Organisation, Designation and Batch only', () => {
      createComponent({})
      expect(component.layout).toBe('columns')
      expect(component.tabNoun).toBe('Organisation')
      expect(component.canSelectAll).toBe(true)
      expect(component.selectionHint).toContain('Select the Organisations only if')
    })

    it('should keep the other entities as they were', () => {
      createComponent({ entity: 'group', entityLabel: 'Group' })
      expect(component.layout).toBe('grid')
      expect(component.selectionHint).toBe('')
    })

    it('should offer no Select All for designations, the way the creation portal does', () => {
      createComponent({ entity: 'designation', entityLabel: 'Designation' })
      expect(component.canSelectAll).toBe(false)
      expect(component.selectionHint).toContain('Select the Designations only if')
    })

    it('should load the organisations a letter at a time from the A-Z bar', () => {
      createComponent({})
      expect(component.barLabels).toEqual(LETTERS)
      expect(component.activeBarLabel).toBe('A')

      marketPlaceSvc.searchOrganisations.mockReturnValue(orgs('Ministry of Mines'))
      component.onBarClick('M')
      expect(marketPlaceSvc.searchOrganisations).toHaveBeenLastCalledWith('', 0, 100, 'M')
      expect(component.items).toEqual([{ value: 'o0', label: 'Ministry of Mines' }])
      expect(component.activeBarLabel).toBe('M')

      // the server has no filter for names that start with no letter, # lists from every letter
      component.onBarClick('#')
      expect(marketPlaceSvc.searchOrganisations).toHaveBeenLastCalledWith('', 0, 100, '')
    })

    it('should put seven names to a column, grouped by their first letter', () => {
      marketPlaceSvc.searchOrganisations.mockReturnValue(orgs(
        'A1', 'A2', 'A3', 'a4', 'A5', 'A6', 'A7', 'A8', 'A9', '1st Org',
      ))
      createComponent({})

      expect(component.sections.map(section => [section.label, section.columns.map(column => column.length)])).toEqual([
        ['A', [7, 2]], ['#', [1]],
      ])
    })

    it('should hide the bar while a search is listed, and go back to the letters when the search is cleared', () => {
      createComponent({})

      component.searchControl.setValue('org')
      component.search()
      expect(component.barLabels).toEqual([])
      expect(component.sections.map(section => section.label)).toEqual(['All'])

      component.searchControl.setValue('')
      component.search()
      expect(marketPlaceSvc.searchOrganisations).toHaveBeenLastCalledWith('', 0, 100, 'A')
      expect(component.barLabels).toEqual(LETTERS)
    })

    it('should read the next page once the columns are scrolled near their end', () => {
      createComponent({})
      marketPlaceSvc.searchOrganisations.mockClear()

      component.onColumnsScroll({ target: { scrollWidth: 2000, scrollLeft: 0, offsetWidth: 900 } } as any)
      expect(marketPlaceSvc.searchOrganisations).not.toHaveBeenCalled()

      component.onColumnsScroll({ target: { scrollWidth: 2000, scrollLeft: 1000, offsetWidth: 900 } } as any)
      expect(marketPlaceSvc.searchOrganisations).toHaveBeenCalledWith('', 100, 100, 'A')
    })

    it('should pick on the All tab, then list what is picked by letter on the Selected tab', () => {
      createComponent({})
      component.toggleItem(component.items[0], true)

      component.onTabChange(1)

      expect(component.visibleItems).toEqual([{ value: 'o1', label: 'Org One' }])
      expect(component.barLabels).toEqual(['O'])
    })

    it('should keep an item unticked on the Selected tab listed until the tab is opened again', () => {
      createComponent({ selected: [{ value: 'o9', label: 'Org Nine' }], showSelected: true })

      component.toggleItem({ value: 'o9', label: 'Org Nine' }, false)
      expect(component.visibleItems).toEqual([{ value: 'o9', label: 'Org Nine' }])

      component.onTabChange(0)
      component.onTabChange(1)
      expect(component.visibleItems).toEqual([])
    })
  })

  describe('users', () => {
    const createUsers = (data: Partial<ISelectionDialogData> = {}) => createComponent({ entity: 'user', entityLabel: 'User', ...data })

    it('should pick the users from a table, under the Users title', () => {
      createUsers()

      expect(component.layout).toBe('users')
      expect(component.dialogTitle).toBe('Users')
      expect(component.allTabLabel).toBe('All Learners')
      expect(component.selectedTabLabel).toBe('Selected Users (0)')
      expect(component.searchPlaceholder).toBe('Search by Name, Email and Phone Number')
    })

    it('should search from the All Learners tab whichever tab the search is made from', () => {
      createUsers({ selected: [asha], showSelected: true })
      component.searchControl.setValue('ravi')

      component.search()

      expect(component.activeTab).toBe(0)
      expect(lastSearch()[0]).toBe('ravi')
    })

    describe('search', () => {
      it('should list the first page of the users the other conditions of the group allow', () => {
        createUsers({ filters: { rootOrgId: ['org-1'] } })

        expect(marketPlaceSvc.searchUsers).toHaveBeenCalledWith('', { rootOrgId: ['org-1'], status: 1 }, 0, 5)
        expect(component.items).toEqual([asha, ravi])
        expect(component.total).toBe(12)
      })

      it('should show the mobile number masked as the search masks it, and mask one it returns unmasked', () => {
        const withMobile = (userId: string, mobile: any) => ({ userId, profileDetails: { personalDetails: { mobile } } })
        marketPlaceSvc.searchUsers.mockReturnValue(usersResponse([
          RAVI, withMobile('u-3', 9123456789), withMobile('u-4', '123'), { userId: 'u-5' },
        ]))
        createUsers()

        expect((component.items as IUserSelection[]).map(user => user.mobile)).toEqual(['******3211', '******6789', '123', ''])
      })

      it('should draw the content portal table: the selected count over the rows, and its pagination', () => {
        createUsers({ selected: [asha] })
        const table = () => fixture.nativeElement as HTMLElement

        expect(table().querySelector('.table-selection-count .count-badge')?.textContent?.trim()).toBe('1')
        expect(table().querySelector('.table-selection-count')?.textContent).toContain('Items Selected')
        expect(table().querySelector('ws-widget-pagination')).not.toBeNull()

        component.onTabChange(1)
        fixture.detectChanges()
        expect(table().querySelector('ws-widget-pagination')).toBeNull()
      })

      it('should show the masked phone of a user without personal details', () => {
        marketPlaceSvc.searchUsers.mockReturnValue(usersResponse([{ ...RAVI, profileDetails: {} }]))
        createUsers()

        expect(component.items[0]).toEqual({ ...ravi, mobile: '******3211' })
      })

      it('should show the e-mail id masked as the search masks it, and mask one it returns unmasked', () => {
        const withEmail = (userId: string, primaryEmail: string) => ({ userId, profileDetails: { personalDetails: { primaryEmail } } })
        marketPlaceSvc.searchUsers.mockReturnValue(usersResponse([
          RAVI, withEmail('u-3', 'nalini@nic.in'), withEmail('u-4', 'ab@nic.in'), withEmail('u-5', 'no-domain'), { userId: 'u-6' },
        ]))
        createUsers()

        expect((component.items as IUserSelection[]).map(user => user.email)).toEqual([
          'ra**@example.com', 'na****@nic.in', 'ab@nic.in', 'no*******', '',
        ])
      })

      it('should search by name, and look an e-mail id or a mobile number up in the personal details', () => {
        createUsers({ filters: { rootOrgId: ['org-1'] } })

        component.searchControl.setValue(' asha ')
        component.search()
        expect(lastSearch()).toEqual(['asha', { rootOrgId: ['org-1'], status: 1 }, 0, 5])

        component.searchControl.setValue('Asha@Example.com')
        component.search()
        expect(lastSearch()).toEqual(['', {
          'rootOrgId': ['org-1'],
          'status': 1,
          'profileDetails.personalDetails.primaryEmail': 'asha@example.com',
        }, 0, 5])

        component.searchControl.setValue('9876543210')
        component.search()
        expect(lastSearch()).toEqual(['', {
          'rootOrgId': ['org-1'],
          'status': 1,
          'profileDetails.personalDetails.mobile': '9876543210',
        }, 0, 5])
      })

      it('should read the page asked for, and start again from the first page on a new search', () => {
        createUsers()

        component.onPageChange({ currentPage: 3, previousPage: 1, limit: 10 })
        expect(lastSearch()).toEqual(['', { status: 1 }, 20, 10])

        component.search()
        expect(lastSearch()).toEqual(['', { status: 1 }, 0, 10])
      })

      it('should flag a failed search so it can be retried', () => {
        marketPlaceSvc.searchUsers.mockReturnValue(throwError(() => new Error('failed')))
        createUsers()
        expect(component.loadError).toBe(true)
        expect(component.items).toEqual([])

        marketPlaceSvc.searchUsers.mockReturnValue(usersResponse([ASHA]))
        component.loadItems()
        expect(component.loadError).toBe(false)
        expect(component.items).toEqual([asha])
      })
    })

    describe('selection', () => {
      it('should start on the Selected Users tab when asked to and someone is selected', () => {
        createUsers({ selected: [asha], showSelected: true })

        expect(component.activeTab).toBe(1)
        expect(component.visibleItems).toEqual([asha])
      })

      it('should start on the All Learners tab when nobody is selected', () => {
        createUsers({ showSelected: true })
        expect(component.activeTab).toBe(0)
      })

      it('should tick and untick users, and every user of the page at once', () => {
        createUsers()

        component.toggleItem(component.items[0], true)
        expect(component.isSelected(asha)).toBe(true)
        expect(component.isPartlySelected).toBe(true)

        component.toggleAll(true)
        expect(component.areAllVisibleSelected).toBe(true)
        expect(component.isPartlySelected).toBe(false)

        component.toggleAll(false)
        expect(component.selectedItems.size).toBe(0)
      })

      it('should keep a user unticked on the Selected Users tab listed, so it can be ticked again', () => {
        createUsers({ selected: [asha, ravi], showSelected: true })

        component.toggleItem(asha, false)
        expect(component.visibleItems).toEqual([asha, ravi])
        expect(component.selectedItems.size).toBe(1)

        component.onTabChange(0)
        component.onTabChange(1)
        expect(component.visibleItems).toEqual([ravi])
      })

      it('should return the users selected, kept across searches, when applied', () => {
        createUsers({ selected: [ravi] })
        component.toggleItem(component.items[0], true)
        marketPlaceSvc.searchUsers.mockReturnValue(usersResponse([]))
        component.search()

        component.apply()

        expect(dialogRef.close).toHaveBeenCalledWith([ravi, asha])
      })

      it('should close without a value when cancelled', () => {
        createUsers()
        component.cancel()
        expect(dialogRef.close).toHaveBeenCalledWith()
      })
    })
  })

  describe('selection limit', () => {
    const orgs = (count: number) => Array.from({ length: count }, (_value, index) => ({ value: `x${index}`, label: `Org ${index}` }))
    const text = (selector: string) =>
      (fixture.nativeElement as HTMLElement).querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim()

    it('should cap organisations at 500', () => {
      createComponent({})
      expect(component.selectionLimit).toBe(500)
    })

    it('should cap designations at 500', () => {
      createComponent({ entity: 'designation', entityLabel: 'Designation' })
      expect(component.selectionLimit).toBe(500)
    })

    it('should cap users at 500', () => {
      createComponent({ entity: 'user', entityLabel: 'User' })
      expect(component.selectionLimit).toBe(500)
    })

    it('should not cap the other lists', () => {
      createComponent({ entity: 'group', entityLabel: 'Group' })
      expect(component.selectionLimit).toBe(0)
      expect(component.isAtLimit).toBe(false)
    })

    it('should tick nothing more once 500 are selected, and still untick', () => {
      createComponent({ selected: orgs(500) })

      expect(component.isAtLimit).toBe(true)
      expect(component.canToggle(component.items[0])).toBe(false)
      component.toggleItem(component.items[0], true)
      expect(component.selectedItems.size).toBe(500)

      component.toggleItem(orgs(1)[0], false)
      expect(component.selectedItems.size).toBe(499)
      expect(component.canToggle(component.items[0])).toBe(true)
    })

    it('should select all only up to the limit', () => {
      createComponent({ selected: orgs(499) })

      component.toggleAll(true)

      expect(component.selectedItems.size).toBe(500)
      expect(component.isSelected(component.items[0])).toBe(true)
      expect(component.isSelected(component.items[1])).toBe(false)
      expect(component.isPartlySelected).toBe(true)
    })

    describe('when something past the limit is ticked', () => {
      const toasts = () => snackBar.openFromComponent.mock.calls.map((call: any[]) => [call[1].data, call[1].panelClass])
      const message = [{ message: 'Maximum 500 values', type: 'error' }, ['error', 'entity-selection-toast']]

      it('should say "Maximum 500 values" in an error toast, keeping what is selected', () => {
        createComponent({ selected: orgs(500) })

        expect(component.toggleItem(component.items[0], true)).toBe(false)

        expect(toasts()).toEqual([message])
        expect(component.selectedItems.size).toBe(500)
      })

      it('should say nothing for what is allowed: ticking below the limit, and unticking at it', () => {
        createComponent({ selected: orgs(499) })
        expect(component.toggleItem(component.items[0], true)).toBe(true)
        expect(component.selectedItems.size).toBe(500)

        expect(component.toggleItem(orgs(1)[0], false)).toBe(true)
        expect(snackBar.openFromComponent).not.toHaveBeenCalled()
      })

      it('should say it once when Select All leaves some out', () => {
        createComponent({ selected: orgs(499) })
        component.toggleAll(true)
        expect(toasts()).toEqual([message])
      })

      it('should say nothing when Select All fits under the limit', () => {
        createComponent({ selected: [] })
        component.toggleAll(true)
        expect(snackBar.openFromComponent).not.toHaveBeenCalled()
      })

      it('should put a refused checkbox back to what is selected, and a Select All to its real state', () => {
        createComponent({ selected: orgs(500) })
        const refused = component.items[0]
        const box: any = { checked: true, indeterminate: false }

        component.onItemChange(refused, { source: box, checked: true } as any)
        expect(box.checked).toBe(false)

        component.onAllChange({ source: box, checked: true } as any)
        expect(box.checked).toBe(component.areAllVisibleSelected)
        expect(box.indeterminate).toBe(component.isPartlySelected)
      })

      it('should leave the checkboxes clickable at the limit, only a view-only popup disables them', () => {
        createComponent({ selected: orgs(500) })
        const boxes = () => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('mat-checkbox'))
        expect(boxes().length).toBeGreaterThan(0)
        expect(boxes().every(box => !box.hasAttribute('ng-reflect-disabled') || box.getAttribute('ng-reflect-disabled') === 'false')).toBe(true)
      })

      it('should dismiss the toast with the popup', () => {
        createComponent({ selected: orgs(500) })
        component.toggleItem(component.items[0], true)

        component.ngOnDestroy()

        expect(toast.dismiss).toHaveBeenCalled()
      })

      it('should say nothing in a view-only popup, where nothing can be ticked', () => {
        createComponent({ selected: orgs(500), readOnly: true })

        expect(component.toggleItem(component.items[0], true)).toBe(false)
        component.toggleAll(true)

        expect(snackBar.openFromComponent).not.toHaveBeenCalled()
      })
    })

    it('should show the count on the left, with the limit beside it', () => {
      createComponent({ selected: orgs(9) })

      expect(text('.selected-count')).toBe('9 selected')
      expect(text('.limit-pill')).toBe('9 / 500 max')
      expect((fixture.nativeElement as HTMLElement).querySelector('.limit-pill')?.classList).not.toContain('at-limit')
    })

    it('should mark the limit once it is reached', () => {
      createComponent({ selected: orgs(500) })
      expect(text('.limit-pill')).toBe('500 / 500 max')
      expect((fixture.nativeElement as HTMLElement).querySelector('.limit-pill')?.classList).toContain('at-limit')
    })

    it('should show the count without a limit for the other lists', () => {
      createComponent({ entity: 'group', entityLabel: 'Group' })
      expect(text('.selected-count')).toBe('0 selected')
      expect(text('.limit-pill')).toBeUndefined()
    })
  })
})
