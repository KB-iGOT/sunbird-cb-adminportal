import { of } from 'rxjs'
import { DesignationApprovalListComponent } from './designation-approval-list.component'

describe('DesignationApprovalListComponent', () => {
  let component: DesignationApprovalListComponent
  let mockDialog: any
  let mockRoute: any
  let mockConfigSvc: any
  let mockDesignationSvc: any
  let mockSnackBar: any
  let mockCdr: any
  let mockLoader: any

  const apiResponse = {
    items: [
      { id: '1', designation_name: 'Engineer', created_at: '2024-01-01T10:00:00Z', status: 'pending', organisation: 'OrgA', division: 'DivA', email: 'a@x.com' },
      { id: '2', designation_name: 'Manager', created_at: '2024-01-02T10:00:00Z', status: 'approved', organisation: 'OrgB', division: 'DivB', email: 'b@x.com' },
      { id: '3', designation_name: 'Clerk', created_at: '2024-01-03T10:00:00Z', status: 'pending', organisation: 'OrgA', division: 'DivC', email: 'c@x.com' },
    ],
    pagination: { total_items: 3 },
  }

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => { })
    mockDialog = { open: jest.fn() }
    mockRoute = { snapshot: { data: { configService: { userProfile: {} } } } }
    mockConfigSvc = { userProfile: { userId: 'u1', departmentName: 'Dept', rootOrgId: 'org1' } }
    mockDesignationSvc = {
      getApprovalList: jest.fn().mockReturnValue(of(apiResponse)),
      approveRequest: jest.fn(),
    }
    mockSnackBar = { open: jest.fn() }
    mockCdr = { markForCheck: jest.fn() }
    mockLoader = { changeLoaderState: jest.fn() }

    component = new DesignationApprovalListComponent(
      mockDialog,
      mockRoute,
      mockConfigSvc,
      mockDesignationSvc,
      mockDialog,
      mockSnackBar,
      mockCdr,
      mockLoader,
    )
  })

  afterEach(() => jest.restoreAllMocks())

  it('should create and read user profile from config service', () => {
    expect(component).toBeTruthy()
    expect(component.currentUser).toBe('u1')
    expect(component.department).toBe('Dept')
    expect(component.departmentID).toBe('org1')
  })

  it('should read user profile from route when config service has none', () => {
    const route = { snapshot: { data: { configService: { userProfile: { userId: 'u2', rootOrgId: 'org2', departmentName: 'D2' } } } } }
    const comp = new DesignationApprovalListComponent(
      mockDialog, route as any, {} as any, mockDesignationSvc, mockDialog, mockSnackBar, mockCdr, mockLoader,
    )
    expect(comp.currentUser).toBe('u2')
    expect(comp.departmentID).toBe('org2')
    expect(comp.department).toBe('D2')
  })

  it('should set up table and fetch pending requests on init', () => {
    component.ngOnInit()
    expect(component.tabledata.columns.length).toBe(6)
    expect(mockDesignationSvc.getApprovalList).toHaveBeenCalledWith(20, 0, 'pending')
    expect(component.data.length).toBe(2)
    expect(component.approvalRequestCount).toEqual({ pending: 2, approved: 1, rejected: 0 })
    expect(component.totalApprovalCount).toBe(3)
    expect(component.divisionList).toEqual(['DivA', 'DivB', 'DivC'])
    expect(component.organisationList).toEqual(['OrgA', 'OrgB'])
    expect(mockLoader.changeLoaderState).toHaveBeenLastCalledWith(false)
    expect(mockCdr.markForCheck).toHaveBeenCalled()
  })

  it('should switch tab and hide user menus for non-pending tabs', () => {
    component.ngOnInit()
    component.filter('approved')
    expect(component.currentFilter).toBe('approved')
    expect(component.tabledata.needUserMenus).toBe(false)
    expect(component.data.length).toBe(1)
  })

  it('should load all data and apply filters locally when a filter is active', () => {
    component.ngOnInit()
    component.selectedOrganisation = 'OrgA'
    component.searchText = 'clerk'
    component.applyFilters()
    expect(mockDesignationSvc.getApprovalList).toHaveBeenLastCalledWith(100, 0, 'pending')
    expect(component.isAllCurrentFilterDataLoaded).toBe(true)
    expect(component.data.length).toBe(1)
    expect(component.data[0].designationName).toBe('Clerk')
    expect(component.totalApprovalCount).toBe(1)
  })

  it('should page locally when filters active, otherwise refetch', () => {
    component.ngOnInit()
    component.selectedDivision = 'DivA'
    component.applyFilters()
    const calls = mockDesignationSvc.getApprovalList.mock.calls.length
    component.onPageChange({ pageIndex: 0, pageSize: 20 })
    expect(mockDesignationSvc.getApprovalList.mock.calls.length).toBe(calls)

    component.clearFilters()
    expect(component.selectedDivision).toBe('')
    component.onPageChange({ pageIndex: 1, pageSize: 20 })
    expect(mockDesignationSvc.getApprovalList).toHaveBeenLastCalledWith(20, 20, 'pending')
  })

  it('should approve request after confirmation', () => {
    component.ngOnInit()
    mockDialog.open.mockReturnValue({ afterClosed: () => of(true) })
    mockDesignationSvc.approveRequest.mockReturnValue(of({ status: 'approved' }))
    component.menuActions({ action: 'approve', row: { identifier: '1' } })
    expect(mockDesignationSvc.approveRequest).toHaveBeenCalledWith({ id: '1' })
    expect(mockSnackBar.open).toHaveBeenCalledWith('Request is successfully approved.', 'X', { duration: 5000 })
    expect(component.currentFilter).toBe('approved')
  })

  it('should show error when approval fails', () => {
    component.ngOnInit()
    mockDialog.open.mockReturnValue({ afterClosed: () => of(true) })
    mockDesignationSvc.approveRequest.mockReturnValue(of({ status: 'failed' }))
    component.menuActions({ action: 'approve', row: { identifier: '1' } })
    expect(mockSnackBar.open).toHaveBeenCalledWith('Error while approving the request', 'X', { duration: 5000 })
  })

  it('should refresh rejected list after successful reject dialog', () => {
    component.ngOnInit()
    mockDialog.open.mockReturnValue({ afterClosed: () => of('success') })
    component.menuActions({ action: 'reject', row: { identifier: '1' } })
    expect(mockDialog.open).toHaveBeenCalled()
    expect(component.currentFilter).toBe('rejected')
  })

  it('should truncate long designation names and default missing reviewer comments', () => {
    component.ngOnInit()
    const longName = 'D'.repeat(150)
    mockDesignationSvc.getApprovalList.mockReturnValue(of({
      items: [
        { id: '9', designation_name: longName, created_at: '2024-01-01T10:00:00Z', status: 'pending' },
        { id: '10', designation_name: 'Officer', created_at: '2024-01-01T10:00:00Z', status: 'pending', reviewer_comments: 'Looks fine' },
      ],
      pagination: { total_items: 2 },
    }))
    component.fetchApprovalRequests('pending')
    expect(component.data[0].designationName).toBe('D'.repeat(100))
    expect(component.data[0].reviewer_comments).toBe('No Reason Found')
    expect(component.data[1].reviewer_comments).toBe('Looks fine')
  })

  it('should do nothing when the approve or reject dialogs are dismissed', () => {
    component.ngOnInit()
    const calls = mockDesignationSvc.getApprovalList.mock.calls.length
    mockDialog.open.mockReturnValue({ afterClosed: () => of(false) })
    component.menuActions({ action: 'approve', row: { identifier: '1' } })
    component.menuActions({ action: 'reject', row: { identifier: '1' } })
    expect(mockDesignationSvc.approveRequest).not.toHaveBeenCalled()
    expect(mockDesignationSvc.getApprovalList.mock.calls.length).toBe(calls)
    expect(component.currentFilter).toBe('pending')
  })

  it('should fetch every page when loading data for local filtering', () => {
    component.ngOnInit()
    const pageOne = Array.from({ length: 100 }, (_item, i) => (
      { id: `p${i}`, designation_name: `Role ${i}`, created_at: '2024-01-01T10:00:00Z', status: 'pending', organisation: 'OrgA' }
    ))
    const pageTwo = [{ id: 'last', designation_name: 'Analyst', created_at: '2024-01-01T10:00:00Z', status: 'pending', organisation: 'OrgZ' }]
    mockDesignationSvc.getApprovalList.mockImplementation((_limit: number, offset: number) => of({
      items: offset === 0 ? pageOne : pageTwo,
      pagination: { total_items: 101 },
    }))

    component.selectedOrganisation = 'OrgZ'
    component.applyFilters()

    expect(mockDesignationSvc.getApprovalList).toHaveBeenCalledWith(100, 0, 'pending')
    expect(mockDesignationSvc.getApprovalList).toHaveBeenCalledWith(100, 100, 'pending')
    expect(component.organisationList).toEqual(['OrgA', 'OrgZ'])
    expect(component.data.map((item: any) => item.identifier)).toEqual(['last'])
    expect(mockLoader.changeLoaderState).toHaveBeenLastCalledWith(false)
  })

  it('should format dates and times', () => {
    expect(component.customDateFormat('2024-02-05', '10:00:00+05:30')).toBe('05-02-2024')
    expect(component.allEventDateFormat('2024-02-05T10:00:00')).toBe('05-02-2024')
    expect(component.formatTimeAmPm(new Date(2024, 0, 1, 13, 5))).toBe('1:05 pm')
    expect(component.formatTimeAmPm(new Date(2024, 0, 1, 0, 30))).toBe('12:30 am')
  })

  it('should determine if an event can be archived', () => {
    expect(component.canArchive({
      startDate: '2000-01-01', startTime: '10:00:00+05:30', endDate: '2000-01-02', endTime: '10:00:00+05:30',
    })).toBe(true)
    expect(component.canArchive({
      startDate: '2000-01-01', startTime: '10:00:00+05:30', endDate: '2999-01-02', endTime: '10:00:00+05:30',
    })).toBe(false)
  })
})
