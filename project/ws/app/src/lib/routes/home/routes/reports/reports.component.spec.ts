import { ReportsComponent } from './reports.component'
import { of } from 'rxjs'
import { Router } from '@angular/router'
import { ConfigurationsService, EventService } from '@sunbird-cb/utils'
import { DirectoryService } from '../../services/directory.services'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'

describe('ReportsComponent', () => {
  let component: ReportsComponent
  let mockMatDialog: jest.Mocked<MatDialog>
  let mockActivatedRoute: any
  let mockConfigSvc: jest.Mocked<ConfigurationsService>
  let mockDirectoryService: jest.Mocked<DirectoryService>
  let mockRouter: jest.Mocked<Router>
  let mockEventService: jest.Mocked<EventService>

  const mockDepartmentTitlesResponse = {
    result: {
      response: {
        value: JSON.stringify({
          orgTypeList: [
            { name: 'Ministry', isHidden: false },
            { name: 'State', isHidden: false },
            { name: 'CBP', isHidden: false },
            { name: 'Hidden', isHidden: true }
          ]
        })
      }
    }
  }

  const mockAllDepartmentsResponse = {
    result: {
      response: {
        content: [
          { id: '1', channel: 'Dept1', isMinistry: true, noOfMembers: 20, organisationSubType: 'type1' },
          { id: '2', channel: 'Dept2', isCbp: true, noOfMembers: 15, organisationSubType: 'type2' },
          { id: '3', channel: 'Dept3', isCbc: true, noOfMembers: 10, organisationSubType: 'type3' },
          { id: '4', channel: 'Dept4', isState: true, noOfMembers: 25, organisationSubType: 'type4' },
          { id: '5', channel: 'Dept5', isMdo: true, noOfMembers: 30, organisationSubType: 'type5' }
        ]
      }
    }
  }

  beforeEach(() => {
    // Create mock services
    mockMatDialog = {
      open: jest.fn(),
    } as unknown as jest.Mocked<MatDialog>

    mockActivatedRoute = {
      params: of({ tab: 'ministry' }),
      data: of({}),
      parent: {
        snapshot: {
          data: {
            pageData: {
              data: {
                tabs: []
              }
            }
          }
        }
      }
    }

    mockConfigSvc = {
      userProfile: {
        userId: 'test-user-id'
      }
    } as unknown as jest.Mocked<ConfigurationsService>

    mockDirectoryService = {
      getDepartmentTitles: jest.fn().mockReturnValue(of(mockDepartmentTitlesResponse)),
      getAllDepartmentsKong: jest.fn().mockReturnValue(of(mockAllDepartmentsResponse))
    } as unknown as jest.Mocked<DirectoryService>

    mockRouter = {
      url: '/app/reports',
      navigate: jest.fn()
    } as unknown as jest.Mocked<Router>

    mockEventService = {
      handleTabTelemetry: jest.fn()
    } as unknown as jest.Mocked<EventService>

    // Initialize component
    component = new ReportsComponent(
      mockMatDialog,
      mockActivatedRoute as any,
      mockConfigSvc,
      mockDirectoryService,
      mockRouter,
      mockEventService
    )
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('should initialize with default filter and fetch departments', () => {
      component.ngOnInit()

      expect(mockDirectoryService.getDepartmentTitles).toHaveBeenCalled()
      expect(mockDirectoryService.getAllDepartmentsKong).toHaveBeenCalledWith('', { limit: 20, offset: 0 })
      expect(component.currentFilter).toBe('ministry')
    })

    it('should set filter from route params if available', () => {
      mockActivatedRoute.params = of({ tab: 'state' })

      component.ngOnInit()

      expect(component.currentFilter).toBe('state')
    })
  })

  describe('getAllDepartmentsHeaderAPI', () => {
    it('should parse department headers and exclude hidden ones', () => {
      component.getAllDepartmentsHeaderAPI()

      expect(component.departmentHearders).toContain('Ministry')
      expect(component.departmentHearders).toContain('State')
      expect(component.departmentHearders).toContain('CBP Providers')
      expect(component.departmentHearders).not.toContain('Hidden')
      expect(component.departmentHearders).toContain('survey')
    })
  })

  describe('getDepartDataByKey', () => {
    beforeEach(() => {
      component.wholeData2 = mockAllDepartmentsResponse.result.response.content
    })

    it('should filter ministry departments correctly', () => {
      component.getDepartDataByKey('ministry')

      expect(component.currentFilter).toBe('ministry')
      expect(component.data.length).toBe(1)
      expect(component.data[0].id).toBe('1')
      expect(component.data[0].mdo).toBe('Dept1')
    })

    it('should filter cbp-providers departments correctly', () => {
      component.getDepartDataByKey('cbp-providers')

      expect(component.currentFilter).toBe('cbp-providers')
      expect(component.data.length).toBe(1)
      expect(component.data[0].id).toBe('2')
      expect(component.data[0].mdo).toBe('Dept2')
    })

    it('should filter cbc departments correctly', () => {
      component.getDepartDataByKey('cbc')

      expect(component.currentFilter).toBe('cbc')
      expect(component.data.length).toBe(1)
      expect(component.data[0].id).toBe('3')
      expect(component.data[0].mdo).toBe('Dept3')
    })

    it('should filter state departments correctly', () => {
      component.getDepartDataByKey('state')

      expect(component.currentFilter).toBe('state')
      expect(component.data.length).toBe(1)
      expect(component.data[0].id).toBe('4')
      expect(component.data[0].mdo).toBe('Dept4')
    })

    it('should filter mdo departments correctly', () => {
      component.getDepartDataByKey('mdo')

      expect(component.currentFilter).toBe('mdo')
      expect(component.data.length).toBe(1)
      expect(component.data[0].id).toBe('5')
      expect(component.data[0].mdo).toBe('Dept5')
    })
  })

  describe('filter', () => {
    beforeEach(() => {
      component.searchInputvalue = {
        searchInput: {
          nativeElement: {
            value: 'test'
          }
        },
        applyFilter: jest.fn()
      } as any

      jest.spyOn(component, 'getDepartDataByKey')
      jest.spyOn(component, 'raiseTabTelemetry')
      jest.spyOn(component, 'getAllDepartments')
    })

    it('should reset search input and apply new filter for ministry', () => {
      component.filter('ministry')

      expect(component.searchInputvalue.searchInput.nativeElement.value).toBe('')
      expect(component.searchInputvalue.applyFilter).toHaveBeenCalledWith('')
      expect(component.getAllDepartments).toHaveBeenCalledWith('')
      expect(component.getDepartDataByKey).toHaveBeenCalledWith('ministry')
      expect(component.raiseTabTelemetry).toHaveBeenCalledWith('ministry', expect.any(Object))
    })

    it('should handle cbp providers filter', () => {
      component.filter('cbp providers')

      expect(component.getDepartDataByKey).toHaveBeenCalledWith('cbp-providers')
      expect(component.raiseTabTelemetry).toHaveBeenCalledWith('cbp-providers', expect.objectContaining({
        index: 2,
        label: 'cbp-providers'
      }))
    })

    it('should handle survey filter differently', () => {
      component.filter('survey')

      expect(component.searchInputvalue.applyFilter).not.toHaveBeenCalled()
      expect(component.getAllDepartments).not.toHaveBeenCalled()
      expect(component.getDepartDataByKey).not.toHaveBeenCalled()
    })
  })

  describe('onRoleClick', () => {
    it('should navigate to role users page with correct params', () => {
      const mockRole = {
        data: {
          id: 'role-123',
          mdo: 'Dept1',
          type: 'ministry'
        }
      }

      component.currentFilter = 'ministry'
      component.onRoleClick(mockRole)

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/app/roles/role-123/users'],
        {
          queryParams: {
            subOrgType: 'ministry',
            roleId: 'role-123',
            depatName: 'Dept1',
            deptType: 'ministry',
            path: 'reports'
          }
        }
      )
    })
  })

  describe('actionClick', () => {
    it('should navigate to create department page with data', () => {
      const mockClickedData = { id: '123', name: 'Test Department' }
      component.currentFilter = 'ministry'

      component.actionClick(mockClickedData)

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/app/home/ministry/create-department', { data: JSON.stringify(mockClickedData) }]
      )
    })
  })

  describe('onEnterkySearch', () => {
    it('should call getAllDepartments with search value', () => {
      jest.spyOn(component, 'getAllDepartments')

      component.onEnterkySearch('search term')

      expect(component.getAllDepartments).toHaveBeenCalledWith('search term')
    })
  })

  describe('renderSurvey', () => {
    it('should set currentFilter to survey', () => {
      component.renderSurvey()

      expect(component.currentFilter).toBe('survey')
    })
  })
})