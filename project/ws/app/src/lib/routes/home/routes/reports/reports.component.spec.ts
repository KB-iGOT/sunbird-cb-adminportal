import { ReportsComponent } from './reports.component'
import { of } from 'rxjs'
import { Router, ActivatedRoute } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { DirectoryService } from '../../services/directory.services'
import { EventService } from '@sunbird-cb/utils'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'

describe('ReportsComponent', () => {
  let component: ReportsComponent
  let mockRouter: jest.Mocked<Router>
  let mockRoute: jest.Mocked<ActivatedRoute>
  let mockConfigService: jest.Mocked<ConfigurationsService>
  let mockDirectoryService: jest.Mocked<DirectoryService>
  let mockEventService: jest.Mocked<EventService>
  let mockDialog: jest.Mocked<MatDialog>

  beforeEach(() => {
    // Create mock implementations
    mockRouter = {
      url: '/test-url',
      navigate: jest.fn(),
    } as any

    mockRoute = {
      params: of({ tab: 'ministry' }),
      parent: {
        snapshot: {
          data: {
            pageData: {
              data: {
                tabs: [],
              },
            },
          },
        },
      },
      data: of({
        profile: {
          data: [{ testProfile: 'data' }],
        },
      }),
    } as any

    mockConfigService = {
      userProfile: {
        userId: 'test-user-id',
      },
    } as any

    mockDirectoryService = {
      getDepartmentTitles: jest.fn().mockReturnValue(
        of({
          result: {
            response: {
              value: JSON.stringify({
                orgTypeList: [
                  { name: 'CBP', isHidden: false },
                  { name: 'MDO', isHidden: false },
                ],
              }),
            },
          },
        })
      ),
      getAllDepartmentsKong: jest.fn().mockReturnValue(
        of({
          result: {
            response: {
              content: [
                {
                  id: '1',
                  channel: 'Test Channel',
                  isMdo: true,
                  noOfMembers: 10,
                  organisationSubType: 'sub-type',
                },
              ],
            },
          },
        })
      ),
    } as any

    mockEventService = {
      handleTabTelemetry: jest.fn(),
    } as any

    mockDialog = {} as any

    // Create component instance with mocked dependencies
    component = new ReportsComponent(
      mockDialog,
      mockRoute as any,
      mockConfigService,
      mockDirectoryService,
      mockRouter,
      mockEventService
    )
  })

  describe('Initialization', () => {
    it('should initialize with default filter as ministry', () => {
      component.ngOnInit()
      expect(component.currentFilter).toBe('ministry')
    })

    it('should fetch department headers and departments on init', () => {
      const getDepartmentTitlesSpy = jest.spyOn(mockDirectoryService, 'getDepartmentTitles')
      const getAllDepartmentsSpy = jest.spyOn(mockDirectoryService, 'getAllDepartmentsKong')

      component.ngOnInit()

      expect(getDepartmentTitlesSpy).toHaveBeenCalled()
      expect(getAllDepartmentsSpy).toHaveBeenCalledWith('', { limit: 20, offset: 0 })
    })
  })

  describe('Filter Method', () => {
    it('should filter departments correctly for different types', () => {
      const testCases = [
        { input: 'ministry', expectedKey: 'ministry', expectedIndex: 1 },
        { input: 'cbc', expectedKey: 'cbc', expectedIndex: 1 },
        { input: 'cbp providers', expectedKey: 'cbp-providers', expectedIndex: 2 },
        { input: 'spv', expectedKey: 'spv', expectedIndex: 3 },
      ]

      testCases.forEach(testCase => {
        component.filter(testCase.input)

        expect(component.currentFilter).toBe(testCase.expectedKey)
        expect(mockEventService.handleTabTelemetry).toHaveBeenCalledWith(
          testCase.expectedKey,
          { index: testCase.expectedIndex, label: testCase.expectedKey }
        )
      })
    })
  })

  describe('Department Data Filtering', () => {
    it('should filter departments by key correctly', () => {
      component.wholeData2 = [
        {
          id: '1',
          channel: 'Test Channel',
          isMdo: true,
          noOfMembers: 10,
          organisationSubType: 'sub-type'
        }
      ]

      component.getDepartDataByKey('mdo')

      expect(component.data.length).toBe(1)
      expect(component.data[0].mdo).toBe('Test Channel')
      expect(component.data[0].type).toBe('mdo')
    })
  })

  describe('Action Handling', () => {
    it('should navigate to create department when action is clicked', () => {
      const mockClickedData = { id: '1', mdo: 'Test Department' }
      component.currentFilter = 'ministry'

      component.actionClick(mockClickedData)

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/app/home/ministry/create-department'],
        { data: JSON.stringify(mockClickedData) }
      )
    })
  })

  describe('Role Click Navigation', () => {
    it('should navigate to roles page with correct parameters', () => {
      const mockRole = {
        data: {
          id: 'role-1',
          mdo: 'Test MDO',
          type: 'ministry'
        }
      }

      component.currentFilter = 'ministry'
      component.onRoleClick(mockRole)

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/app/roles/role-1/users'],
        {
          queryParams: {
            subOrgType: 'ministry',
            roleId: 'role-1',
            depatName: 'Test MDO',
            deptType: 'ministry',
            path: 'reports'
          }
        }
      )
    })
  })
})