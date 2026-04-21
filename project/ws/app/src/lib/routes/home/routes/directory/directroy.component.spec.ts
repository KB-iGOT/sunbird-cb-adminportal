import { DirectoryViewComponent } from './directroy.component'
import { of, BehaviorSubject } from 'rxjs'
jest.mock('@angular/router')
jest.mock('@angular/material/dialog')
jest.mock('../../services/directory.services')
jest.mock('@sunbird-cb/utils-v2')
jest.mock('@angular/common')

describe('DirectoryViewComponent', () => {
    let component: DirectoryViewComponent
    let mockDialog: any
    let mockRoute: any
    let mockConfigSvc: any
    let mockDirectoryService: any
    let mockRouter: any
    let mockEvents: any
    let mockDatePipe: any
    let mockParamsSubject: BehaviorSubject<any>
    let mockDataSubject: BehaviorSubject<any>

    beforeEach(() => {
        // Mock dependencies
        mockDialog = {
            open: jest.fn()
        }

        mockParamsSubject = new BehaviorSubject({ tab: 'mdo' })
        mockDataSubject = new BehaviorSubject({
            profile: {
                data: [{ id: 1, name: 'test' }]
            }
        })

        mockRoute = {
            params: mockParamsSubject.asObservable(),
            data: mockDataSubject.asObservable(),
            parent: {
                snapshot: {
                    data: {
                        pageData: {
                            data: {
                                tabs: [{ id: 1, name: 'tab1' }]
                            }
                        },
                        configService: {
                            userRoles: new Set(['DASHBOARD_ADMIN', 'STATE_ADMIN'])
                        }
                    }
                }
            }
        }

        mockConfigSvc = {
            userProfile: {
                userId: 'test-user-id'
            }
        }

        mockDirectoryService = {
            getDepartmentTitles: jest.fn().mockReturnValue(of({
                result: {
                    response: {
                        value: JSON.stringify({
                            orgTypeList: [
                                { name: 'CBP', isHidden: false },
                                { name: 'MDO', isHidden: false },
                                { name: 'Hidden', isHidden: true }
                            ]
                        })
                    }
                }
            })),
            getAllDepartmentsKong: jest.fn().mockReturnValue(of({
                result: {
                    response: {
                        content: [
                            {
                                id: '1',
                                orgName: 'Test Org',
                                channel: 'test-channel',
                                isMdo: true,
                                noOfMembers: 10,
                                organisationSubType: 'mdo-type',
                                createdBy: 'test-user',
                                createdDate: '2023-01-01 10:30:000+0530',
                                ministryOrStateName: 'Test State'
                            },
                            {
                                id: '2',
                                orgName: 'Test CBP',
                                channel: 'cbp-channel',
                                isCbp: true,
                                noOfMembers: 5,
                                organisationSubType: 'cbp-type'
                            }
                        ],
                        count: 2
                    }
                }
            }))
        }

        mockRouter = {
            navigate: jest.fn()
        }

        mockEvents = {
            handleTabTelemetry: jest.fn()
        }

        mockDatePipe = {
            transform: jest.fn().mockReturnValue('01/01/2023, 10:30 AM')
        }

        // Create component instance
        component = new DirectoryViewComponent(
            mockDialog,
            mockRoute,
            mockConfigSvc,
            mockDirectoryService,
            mockRouter,
            mockEvents,
            mockDatePipe
        )
    })

    describe('Constructor', () => {
        it('should initialize component with dependencies', () => {
            expect(component.currentUser).toBe('test-user-id')
            expect(component.tabsData).toEqual([{ id: 1, name: 'tab1' }])
            expect(component.userRoles).toEqual(new Set(['DASHBOARD_ADMIN', 'STATE_ADMIN']))
        })

        it('should handle missing route parent', () => {
            mockRoute.parent = null
            const comp = new DirectoryViewComponent(
                mockDialog,
                mockRoute,
                mockConfigSvc,
                mockDirectoryService,
                mockRouter,
                mockEvents,
                mockDatePipe
            )
            expect(comp.tabsData).toEqual([])
        })

        it('should handle missing user profile', () => {
            mockConfigSvc.userProfile = null
            const comp = new DirectoryViewComponent(
                mockDialog,
                mockRoute,
                mockConfigSvc,
                mockDirectoryService,
                mockRouter,
                mockEvents,
                mockDatePipe
            )
            expect(comp.currentUser).toBeNull()
        })
    })

    describe('ngOnInit', () => {
        it('should initialize with default organisation tab when no tab param', () => {
            mockParamsSubject.next({})
            component.ngOnInit()
            expect(component.currentFilter).toBe('organisation')
            expect(component.currentTab).toBe('organisation')
        })

        it('should initialize with tab param', () => {
            mockParamsSubject.next({ tab: 'mdo' })
            component.ngOnInit()
            expect(component.currentFilter).toBe('mdo')
            expect(component.currentTab).toBe('mdo')
        })

        it('should handle orgHierarchies tab without fetching departments', () => {
            mockParamsSubject.next({ tab: 'orgHierarchies' })
            component.ngOnInit()
            expect(component.currentFilter).toBe('orgHierarchies')
            expect(mockDirectoryService.getAllDepartmentsKong).not.toHaveBeenCalled()
        })

        it('should handle error in route params', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
            mockParamsSubject.error(new Error('Route error'))
            component.ngOnInit()
            expect(component.currentFilter).toBe('organisation')
            expect(component.currentTab).toBe('organisation')
            consoleSpy.mockRestore()
        })
    })

    describe('getAllDepartmentsHeaderAPI', () => {
        it('should fetch and process department headers', () => {
            component.getAllDepartmentsHeaderAPI()
            expect(mockDirectoryService.getDepartmentTitles).toHaveBeenCalled()
            expect(component.departmentHearders).toEqual(['CBP Providers', 'MDO', 'Organisation'])
        })

        it('should call getDepartDataByKey when headers exist', () => {
            const spy = jest.spyOn(component, 'getDepartDataByKey')
            component.currentFilter = 'mdo'
            component.getAllDepartmentsHeaderAPI()
            expect(spy).toHaveBeenCalledWith('mdo')
        })
    })

    describe('createTableHeader', () => {
        beforeEach(() => {
            component.totalCount = 100
            component.allowedCreateRoles = ['DASHBOARD_ADMIN']
            component.userRoles = new Set(['DASHBOARD_ADMIN'])
        })

        it('should create table header for organisation filter', () => {
            component.currentFilter = 'organisation'
            component.createTableHeader()

            expect(component.tabledata.columns).toHaveLength(4)
            expect(component.tabledata.columns[0].displayName).toBe('Organisation')
            expect(component.tabledata.link).toBeDefined()
        })

        it('should create table header for organisation without link for unauthorized user', () => {
            component.currentFilter = 'organisation'
            component.userRoles = new Set(['OTHER_ROLE'])
            component.createTableHeader()

            expect(component.tabledata.link).toBeUndefined()
        })

        it('should create table header for non-organisation filter', () => {
            component.currentFilter = 'mdo'
            component.createTableHeader()

            expect(component.tabledata.columns).toHaveLength(2)
            expect(component.tabledata.columns[0].displayName).toBe('Department')
        })
    })

    describe('getAllDepartments', () => {
        it('should fetch departments with query text', () => {
            component.getAllDepartments('test query')
            expect(mockDirectoryService.getAllDepartmentsKong).toHaveBeenCalledWith(
                'test query',
                component.pagination,
                component.currentTab
            )
        })

        it('should fetch departments with empty query', () => {
            component.getAllDepartments('')
            expect(mockDirectoryService.getAllDepartmentsKong).toHaveBeenCalledWith(
                '',
                component.pagination,
                component.currentTab
            )
        })

        it('should handle null query text', () => {
            component.getAllDepartments(null)
            expect(mockDirectoryService.getAllDepartmentsKong).toHaveBeenCalledWith(
                '',
                component.pagination,
                component.currentTab
            )
        })
    })

    describe('onPageChange', () => {
        it('should update pagination and fetch data', () => {
            const event = { pageSize: 10, pageIndex: 2 }
            const spy = jest.spyOn(component, 'getAllDepartments')
            component.searchInputvalue = {
                searchInput: { nativeElement: { value: 'search term' } }
            } as any

            component.onPageChange(event)

            expect(component.pagination.limit).toBe(10)
            expect(component.pagination.offset).toBe(20)
            expect(spy).toHaveBeenCalledWith('search term')
        })

        it('should handle missing searchInputvalue', () => {
            const event = { pageSize: 10, pageIndex: 1 }
            const spy = jest.spyOn(component, 'getAllDepartments')
            component.searchInputvalue = null as any

            component.onPageChange(event)
            expect(spy).toHaveBeenCalled()
        })

        it('should not do anything if event is null', () => {
            const spy = jest.spyOn(component, 'getAllDepartments')
            component.onPageChange(null)
            expect(spy).not.toHaveBeenCalled()
        })
    })

    describe('onRoleClick', () => {
        it('should navigate to roles page with correct params', () => {
            const role = {
                data: { id: 'role-1', channel: 'test-channel', mdo: 'test-mdo', type: 'mdo' },
                type: 'mdo'
            }
            component.currentFilter = 'mdo'

            component.onRoleClick(role)

            expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/roles/role-1/users'], {
                queryParams: {
                    currentDept: 'mdo',
                    roleId: 'role-1',
                    depatName: 'test-channel',
                    orgName: 'test-mdo',
                    tab: 'mdo',
                    subOrgType: ''
                }
            })
        })

        it('should handle organisation role', () => {
            const role = {
                data: { id: 'role-1', channel: 'test-channel', organisation: 'test-org' },
                type: 'organisation'
            }

            component.onRoleClick(role)

            expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/roles/role-1/users'], {
                queryParams: expect.objectContaining({
                    orgName: 'test-org'
                })
            })
        })
    })

    describe('filter', () => {
        beforeEach(() => {
            component.searchInputvalue = {
                searchInput: { nativeElement: { value: 'old search' } },
                applyFilter: jest.fn()
            } as any
        })

        it('should filter by CBP Providers', () => {
            const spy = jest.spyOn(component, 'getAllDepartments')
            component.filter('CBP Providers')

            expect(component.currentTab).toBe('cbp-providers')
            expect(spy).toHaveBeenCalledWith('')
        })

        it('should filter by organisation', () => {
            const spy = jest.spyOn(component, 'getAllDepartments')
            component.filter('organisation')

            expect(component.currentTab).toBe('organisation')
            expect(spy).toHaveBeenCalledWith('')
        })

        it('should handle orgHierarchies without fetching data', () => {
            const spy = jest.spyOn(component, 'getAllDepartments')
            component.filter('orgHierarchies')

            expect(component.currentTab).toBe('orgHierarchies')
            expect(spy).not.toHaveBeenCalled()
        })

        it('should handle unknown filter value', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
            component.filter('unknown')

            expect(component.currentTab).toBe('organisation')
            expect(consoleSpy).toHaveBeenCalledWith('Unknown filter value:', 'unknown')
            consoleSpy.mockRestore()
        })

        it('should handle non-string filter value', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
            component.filter(123 as any)

            expect(component.currentTab).toBe('organisation')
            consoleSpy.mockRestore()
        })

        it('should handle error in filter method', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
            component.searchInputvalue.applyFilter = jest.fn().mockImplementation(() => {
                throw new Error('Filter error')
            })

            component.filter('mdo')
            expect(consoleSpy).toHaveBeenCalled()
            consoleSpy.mockRestore()
        })

        it('should handle missing searchInputvalue', () => {
            component.searchInputvalue = null as any
            expect(() => component.filter('mdo')).not.toThrow()
        })

        it('should clear search input value', () => {
            component.filter('mdo')
            expect(component.searchInputvalue.searchInput.nativeElement.value).toBe('')
        })
    })

    describe('getDepartDataByKey', () => {
        beforeEach(() => {
            component.wholeData2 = [
                {
                    id: '1',
                    orgName: 'MDO Org',
                    channel: 'mdo-channel',
                    isMdo: true,
                    noOfMembers: 10,
                    organisationSubType: 'mdo-type',
                    createdDate: '2023-01-01 10:30:000+0530',
                    ministryOrStateName: 'Test State'
                },
                {
                    id: '2',
                    orgName: 'CBP Org',
                    channel: 'cbp-channel',
                    isCbp: true,
                    noOfMembers: 5,
                    organisationSubType: 'cbp-type'
                },
                {
                    id: '3',
                    orgName: 'CBC Org',
                    channel: 'cbc-channel',
                    isCbc: true,
                    noOfMembers: 8,
                    organisationSubType: 'cbc-type'
                },
                {
                    id: '4',
                    orgName: 'State Org',
                    channel: 'state-channel',
                    isState: true,
                    noOfMembers: 12,
                    organisationSubType: 'state-type'
                },
                {
                    id: '5',
                    orgName: 'Ministry Org',
                    channel: 'ministry-channel',
                    isMinistry: true,
                    noOfMembers: 15,
                    organisationSubType: 'ministry-type'
                }
            ]
        })

        it('should filter data by mdo key', () => {
            component.getDepartDataByKey('mdo')
            expect(component.currentFilter).toBe('mdo')
            expect(component.data).toHaveLength(1)
            expect(component.data[0].mdo).toBe('MDO Org')
        })

        it('should filter data by cbp-providers key', () => {
            component.getDepartDataByKey('cbp-providers')
            expect(component.data).toHaveLength(1)
            expect(component.data[0].mdo).toBe('CBP Org')
        })

        it('should filter data by cbc key', () => {
            component.getDepartDataByKey('cbc')
            expect(component.data).toHaveLength(1)
            expect(component.data[0].mdo).toBe('CBC Org')
        })

        it('should filter data by state key', () => {
            component.getDepartDataByKey('state')
            expect(component.data).toHaveLength(1)
            expect(component.data[0].mdo).toBe('State Org')
        })

        it('should filter data by ministry key', () => {
            component.getDepartDataByKey('ministry')
            expect(component.data).toHaveLength(1)
            expect(component.data[0].mdo).toBe('Ministry Org')
        })

        it('should filter data by organisation key', () => {
            component.getDepartDataByKey('organisation')
            expect(component.data).toHaveLength(5)
            expect(component.data[0].organisation).toBe('MDO Org')
        })

        it('should handle orgHierarchies key', () => {
            component.getDepartDataByKey('orgHierarchies')
            expect(component.data).toEqual([])
        })

        it('should handle organisation data with ministryorstatetype', () => {
            component.wholeData2[0].ministryorstatetype = 'ministry'
            component.getDepartDataByKey('organisation')
            expect(component.data[0].type).toBe('Ministry')
        })

        it('should handle organisation data with ministryOrStateType', () => {
            component.wholeData2[0].ministryOrStateType = 'state'
            component.getDepartDataByKey('organisation')
            expect(component.data[0].type).toBe('State')
        })

        it('should handle missing members count', () => {
            component.wholeData2[0].noOfMembers = undefined
            component.getDepartDataByKey('mdo')
            expect(component.data[0].user).toBe(0)
        })
    })

    describe('actionClick', () => {
        it('should navigate to create department page', () => {
            const clickedData = { id: '1', name: 'Test Data' }
            component.currentFilter = 'mdo'

            component.actionClick(clickedData)

            expect(mockRouter.navigate).toHaveBeenCalledWith([
                '/app/home/mdo/create-department',
                { data: JSON.stringify(clickedData) }
            ])
        })
    })

    describe('raiseTabTelemetry', () => {
        it('should call events handleTabTelemetry', () => {
            const data = { index: 1, label: 'test' }
            component.raiseTabTelemetry('test-sub', data)
            expect(mockEvents.handleTabTelemetry).toHaveBeenCalledWith('test-sub', data)
        })
    })

    describe('onEnterkySearch', () => {
        it('should reset pagination and search', () => {
            const spy = jest.spyOn(component, 'getAllDepartments')
            component.pagination.offset = 20

            component.onEnterkySearch('search term')

            expect(component.pagination.offset).toBe(0)
            expect(spy).toHaveBeenCalledWith('search term')
        })
    })

    describe('transformDate', () => {
        it('should transform date string correctly', () => {
            const result = component.transformDate('2023-01-01 10:30:000+0530')
            expect(mockDatePipe.transform).toHaveBeenCalledWith(
                '2023-01-01T10:30.000+05:30',
                'dd/MM/yyyy, hh:mm a'
            )
            expect(result).toBe('01/01/2023, 10:30 AM')
        })

        it('should handle different date format', () => {
            component.transformDate('2023-12-25 15:45:123+0000')
            expect(mockDatePipe.transform).toHaveBeenCalledWith(
                '2023-12-25T15:45.123+00:00',
                'dd/MM/yyyy, hh:mm a'
            )
        })
    })

    describe('isAllowed', () => {
        it('should return true when user has allowed role', () => {
            component.userRoles = new Set(['dashboard_admin', 'other_role'])
            const result = component.isAllowed(['DASHBOARD_ADMIN', 'SPV_ADMIN'])
            expect(result).toBe(true)
        })

        it('should return false when user does not have allowed role', () => {
            component.userRoles = new Set(['other_role'])
            const result = component.isAllowed(['DASHBOARD_ADMIN', 'SPV_ADMIN'])
            expect(result).toBe(false)
        })

        it('should return false when userRoles is null', () => {
            component.userRoles = null as any
            const result = component.isAllowed(['DASHBOARD_ADMIN'])
            expect(result).toBe(false)
        })

        it('should return false when userRoles is empty', () => {
            component.userRoles = new Set()
            const result = component.isAllowed(['DASHBOARD_ADMIN'])
            expect(result).toBe(false)
        })
    })

    describe('getSubOrgType', () => {
        it('should return ministry for organisation filter', () => {
            component.currentFilter = 'organisation'
            const result = component.getSubOrgType('any-type')
            expect(result).toBe('ministry')
        })

        it('should return orgHierarchies for orgHierarchies filter', () => {
            component.currentFilter = 'orgHierarchies'
            const result = component.getSubOrgType('any-type')
            expect(result).toBe('orgHierarchies')
        })

        it('should return cbp-providers for cbp-providers type', () => {
            component.currentFilter = 'other'
            const result = component.getSubOrgType('cbp-providers')
            expect(result).toBe('cbp-providers')
        })

        it('should return empty string for other cases', () => {
            component.currentFilter = 'other'
            const result = component.getSubOrgType('other-type')
            expect(result).toBe('')
        })
    })

    describe('Edge Cases and Error Handling', () => {
        it('should handle empty wholeData2 array', () => {
            component.wholeData2 = []
            component.getDepartDataByKey('mdo')
            expect(component.data).toEqual([])
        })

        it('should handle malformed department headers response', () => {
            mockDirectoryService.getDepartmentTitles.mockReturnValue(of({
                result: {
                    response: {
                        value: 'invalid-json'
                    }
                }
            }))

            expect(() => component.getAllDepartmentsHeaderAPI()).toThrow()
        })

        it('should handle missing route data', () => {
            mockDataSubject.next({})
            const comp = new DirectoryViewComponent(
                mockDialog,
                mockRoute,
                mockConfigSvc,
                mockDirectoryService,
                mockRouter,
                mockEvents,
                mockDatePipe
            )
            expect(comp.portalProfile).toBeUndefined()
        })
    })
})