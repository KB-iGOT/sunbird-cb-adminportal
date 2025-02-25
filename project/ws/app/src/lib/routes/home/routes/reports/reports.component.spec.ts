import { ReportsComponent } from './reports.component'
import { of } from 'rxjs'

describe('ReportsComponent', () => {
  let component: ReportsComponent
  let mockActivatedRoute: any
  let mockRouter: any
  let mockDirectoryService: any
  let mockConfigService: any
  let mockEventService: any
  let mockMatDialog: any

  beforeEach(() => {
    // Mock the required services
    mockActivatedRoute = {
      params: of({ tab: 'ministry' }),
      parent: { snapshot: { data: { pageData: { data: { tabs: [] } } } } },
    }
    mockRouter = {
      navigate: jest.fn(),
    }
    mockDirectoryService = {
      getDepartmentTitles: jest.fn().mockReturnValue(of({ result: { response: { value: '{"orgTypeList": []}' } } })),
      getAllDepartmentsKong: jest.fn().mockReturnValue(of({ result: { response: { content: [] } } })),
    }
    mockConfigService = {
      userProfile: { userId: '123' },
    }
    mockEventService = {
      handleTabTelemetry: jest.fn(),
    }
    mockMatDialog = {}

    component = new ReportsComponent(
      mockMatDialog,
      mockActivatedRoute,
      mockConfigService,
      mockDirectoryService,
      mockRouter,
      mockEventService,
    )
  })

  it('should create the ReportsComponent', () => {
    expect(component).toBeTruthy()
  })

  it('should set the currentFilter based on route params', () => {
    component.ngOnInit()
    expect(component.currentFilter).toBe('ministry')
  })

  it('should call getAllDepartmentsHeaderAPI on init', () => {
    const getDepartmentTitlesSpy = jest.spyOn(mockDirectoryService, 'getDepartmentTitles')
    component.ngOnInit()
    expect(getDepartmentTitlesSpy).toHaveBeenCalled()
  })

  it('should call getAllDepartments when filter is applied', () => {
    const getAllDepartmentsSpy = jest.spyOn(mockDirectoryService, 'getAllDepartmentsKong')
    component.filter('cbp providers')
    expect(getAllDepartmentsSpy).toHaveBeenCalledWith('')
  })

  it('should update department headers based on response from getDepartmentTitles', () => {
    component.getAllDepartmentsHeaderAPI()
    expect(component.departmentHearders.length).toBe(1) // As per mocked response
  })

  it('should navigate to role on onRoleClick', () => {
    component.onRoleClick({ data: { id: '1', mdo: 'Test', type: 'ministry' } })
    expect(mockRouter.navigate).toHaveBeenCalledWith([
      '/app/roles/1/users',
      { queryParams: { subOrgType: 'ministry', roleId: '1', depatName: 'Test', deptType: 'ministry', path: 'reports' } },
    ])
  })

  it('should call getDepartDataByKey when filter is applied', () => {
    const getDepartDataByKeySpy = jest.spyOn(component, 'getDepartDataByKey')
    component.filter('ministry')
    expect(getDepartDataByKeySpy).toHaveBeenCalledWith('ministry')
  })

  it('should raise telemetry data on tab change', () => {
    const raiseTabTelemetrySpy = jest.spyOn(component, 'raiseTabTelemetry')
    component.filter('cbp providers')
    expect(raiseTabTelemetrySpy).toHaveBeenCalled()
  })

  it('should call getAllDepartments when onEnterkySearch is triggered', () => {
    const getAllDepartmentsSpy = jest.spyOn(mockDirectoryService, 'getAllDepartmentsKong')
    component.onEnterkySearch('search term')
    expect(getAllDepartmentsSpy).toHaveBeenCalledWith('search term')
  })

  it('should update data when getDepartDataByKey is called with "mdo"', () => {
    component.wholeData2 = [
      { id: 1, isMdo: true, channel: 'MDO Channel', noOfMembers: 10, organisationSubType: 'Type A' },
    ]
    component.getDepartDataByKey('mdo')
    expect(component.data.length).toBe(1)
    expect(component.data[0].mdo).toBe('MDO Channel')
  })
})
