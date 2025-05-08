
import { of } from 'rxjs'
import { Router } from '@angular/router'
import { ConfigurationsService, EventService } from '@sunbird-cb/utils'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { DirectoryService } from '../../services/directory.services'
import { DatePipe } from '@angular/common'
import { DirectoryViewComponent } from './directroy.component'

describe('DirectoryViewComponent', () => {
    let component: DirectoryViewComponent
    let mockDialog: jest.Mocked<MatDialog>
    let mockActivatedRoute: any
    let mockConfigSvc: jest.Mocked<ConfigurationsService>
    let mockDirectoryService: jest.Mocked<DirectoryService>
    let mockRouter: jest.Mocked<Router>
    let mockEvents: jest.Mocked<EventService>
    let mockDatePipe: jest.Mocked<DatePipe>

    const mockDepartmentHeaders = {
        result: {
            response: {
                value: JSON.stringify({
                    orgTypeList: [
                        { name: 'MDO', isHidden: false },
                        { name: 'CBP', isHidden: false },
                        { name: 'CBC', isHidden: true },
                        { name: 'SPV', isHidden: false }
                    ]
                })
            }
        }
    }

    const mockDepartmentsResponse = {
        result: {
            response: {
                content: [
                    {
                        id: '1',
                        orgName: 'Dept1',
                        channel: 'channel1',
                        isMdo: true,
                        noOfMembers: 10,
                        organisationSubType: 'subtype1',
                        createdDate: '2023-05-10 12:30:45.123+0530',
                        createdBy: 'user1',
                        ministryOrStateName: 'State1'
                    },
                    {
                        id: '2',
                        orgName: 'Dept2',
                        channel: 'channel2',
                        isCbp: true,
                        noOfMembers: 15,
                        organisationSubType: 'subtype2',
                        createdDate: '2023-06-15 10:20:30.456+0530',
                        createdBy: 'user2',
                        ministryOrStateName: 'Ministry1'
                    }
                ],
                count: 2
            }
        }
    }

    beforeEach(() => {
        mockDialog = {
            open: jest.fn(),
        } as any

        mockActivatedRoute = {
            params: of({ tab: 'mdo' }),
            data: of({
                profile: { data: [{ name: 'Test Profile' }] }
            }),
            parent: {
                snapshot: {
                    data: {
                        pageData: {
                            data: {
                                tabs: [{ key: 'tab1' }, { key: 'tab2' }]
                            }
                        },
                        configService: {
                            userRoles: new Set(['DASHBOARD_ADMIN'])
                        }
                    }
                }
            }
        }

        mockConfigSvc = {
            userProfile: { userId: 'test-user-id' }
        } as any

        mockDirectoryService = {
            getDepartmentTitles: jest.fn().mockReturnValue(of(mockDepartmentHeaders)),
            getAllDepartmentsKong: jest.fn().mockReturnValue(of(mockDepartmentsResponse))
        } as any

        mockRouter = {
            navigate: jest.fn()
        } as any

        mockEvents = {
            handleTabTelemetry: jest.fn()
        } as any

        mockDatePipe = {
            transform: jest.fn().mockImplementation(() => '10/05/2023, 12:30 PM')
        } as any

        component = new DirectoryViewComponent(
            mockDialog,
            mockActivatedRoute,
            mockConfigSvc,
            mockDirectoryService,
            mockRouter,
            mockEvents,
            mockDatePipe
        )
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    describe('ngOnInit', () => {
        it('should initialize component and call required methods', () => {
            const getAllDepartmentsHeaderAPISpy = jest.spyOn(component, 'getAllDepartmentsHeaderAPI')
            const getAllDepartmentsSpy = jest.spyOn(component, 'getAllDepartments')

            component.ngOnInit()

            expect(getAllDepartmentsHeaderAPISpy).toHaveBeenCalled()
            expect(getAllDepartmentsSpy).toHaveBeenCalledWith('')
            expect(component.currentFilter).toBe('mdo')
            expect(component.currentTab).toBe('mdo')
        })

        it('should set default filter to organisation if none is provided', () => {
            mockActivatedRoute.params = of({})
            component.ngOnInit()
            expect(component.currentFilter).toBe('organisation')
        })
    })

    describe('getAllDepartmentsHeaderAPI', () => {
        it('should fetch department headers and process them correctly', () => {
            const createTableHeaderSpy = jest.spyOn(component, 'createTableHeader')
            const getDepartDataByKeySpy = jest.spyOn(component, 'getDepartDataByKey')

            component.getAllDepartmentsHeaderAPI()

            expect(mockDirectoryService.getDepartmentTitles).toHaveBeenCalled()
            expect(component.departmentHearders).toContain('MDO')
            expect(component.departmentHearders).toContain('CBP Providers')
            expect(component.departmentHearders).toContain('SPV')
            expect(component.departmentHearders).toContain('Organisation')
            expect(getDepartDataByKeySpy).toHaveBeenCalledWith(component.currentFilter)
            expect(createTableHeaderSpy).toHaveBeenCalled()
        })
    })

    describe('createTableHeader', () => {
        it('should create organisation table header correctly', () => {
            component.currentFilter = 'organisation'
            component.userRoles = new Set(['DASHBOARD_ADMIN'])

            component.createTableHeader()

            expect(component.tabledata.columns).toHaveLength(4)
            expect(component.tabledata.columns[0].displayName).toBe('Organisation')
            expect(component.tabledata.link).toBeDefined()
        })

        it('should create department table header correctly', () => {
            component.currentFilter = 'mdo'

            component.createTableHeader()

            expect(component.tabledata.columns).toHaveLength(2)
            expect(component.tabledata.columns[0].displayName).toBe('Department')
            expect(component.tabledata.link).toBeUndefined()
        })

        it('should not include link in organisation table header for non-admin users', () => {
            component.currentFilter = 'organisation'
            component.userRoles = new Set(['USER'])

            component.createTableHeader()

            expect(component.tabledata.link).toBeUndefined()
        })
    })

    describe('getAllDepartments', () => {
        it('should fetch departments and process them correctly', () => {
            const getDepartDataByKeySpy = jest.spyOn(component, 'getDepartDataByKey')
            component.departmentHearders = ['MDO', 'CBP Providers']

            component.getAllDepartments('')

            expect(mockDirectoryService.getAllDepartmentsKong).toHaveBeenCalledWith('', component.pagination, component.currentTab)
            expect(component.wholeData2).toEqual(mockDepartmentsResponse.result.response.content)
            expect(component.totalCount).toBe(2)
            expect(getDepartDataByKeySpy).toHaveBeenCalledWith(component.currentFilter)
        })
    })

    describe('onPageChange', () => {
        it('should update pagination and fetch departments', () => {
            const getAllDepartmentsSpy = jest.spyOn(component, 'getAllDepartments')
            const event = { pageSize: 10, pageIndex: 2 }

            component.onPageChange(event)

            expect(component.pagination.limit).toBe(10)
            expect(component.pagination.offset).toBe(20)
            expect(getAllDepartmentsSpy).toHaveBeenCalledWith('')
        })

        it('should do nothing if event is falsy', () => {
            const getAllDepartmentsSpy = jest.spyOn(component, 'getAllDepartments')

            component.onPageChange(null)

            expect(getAllDepartmentsSpy).not.toHaveBeenCalled()
        })
    })

    describe('onRoleClick', () => {
        it('should navigate to role users page with correct parameters', () => {
            const role = {
                data: {
                    id: 'role1',
                    channel: 'channel1',
                    mdo: 'Department1',
                    type: 'mdo'
                },
                type: 'roleType'
            }

            component.currentFilter = 'mdo'
            component.onRoleClick(role)

            expect(mockRouter.navigate).toHaveBeenCalledWith(
                ['/app/roles/role1/users'],
                {
                    queryParams: {
                        currentDept: 'mdo',
                        roleId: 'role1',
                        depatName: 'channel1',
                        orgName: 'Department1',
                        tab: 'roleType',
                        subOrgType: ''
                    }
                }
            )
        })
    })

    describe('filter', () => {
        it('should update current tab and fetch data for the selected filter', () => {
            const raiseTabTelemetrySpy = jest.spyOn(component, 'raiseTabTelemetry')
            const getDepartDataByKeySpy = jest.spyOn(component, 'getDepartDataByKey')
            const getAllDepartmentsSpy = jest.spyOn(component, 'getAllDepartments')

            // Mock searchInputvalue
            component.searchInputvalue = {
                searchInput: { nativeElement: { value: 'test' } },
                applyFilter: jest.fn()
            } as any

            component.filter('cbp providers')

            expect(component.searchInputvalue.searchInput.nativeElement.value).toBe('')
            expect(component.searchInputvalue.applyFilter).toHaveBeenCalledWith('')
            expect(component.currentTab).toBe('cbp providers')
            expect(getAllDepartmentsSpy).toHaveBeenCalledWith('')
            expect(raiseTabTelemetrySpy).toHaveBeenCalledWith('cbp-providers', { index: 2, label: 'cbp-providers' })
            expect(getDepartDataByKeySpy).toHaveBeenCalledWith('cbp-providers')
        })
    })

    describe('getDepartDataByKey', () => {
        beforeEach(() => {
            component.wholeData2 = [
                {
                    id: '1',
                    orgName: 'Dept1',
                    channel: 'channel1',
                    isMdo: true,
                    noOfMembers: 10,
                    organisationSubType: 'subtype1',
                    createdDate: '2023-05-10 12:30:45.123+0530',
                    createdBy: 'user1',
                    ministryOrStateName: 'State1'
                },
                {
                    id: '2',
                    orgName: 'Dept2',
                    channel: 'channel2',
                    isCbp: true,
                    noOfMembers: 15,
                    organisationSubType: 'subtype2',
                    createdDate: '2023-06-15 10:20:30.456+0530',
                    createdBy: 'user2',
                    ministryOrStateName: 'Ministry1'
                }
            ]
        })

        it('should filter data for mdo key', () => {
            const createTableHeaderSpy = jest.spyOn(component, 'createTableHeader')

            component.getDepartDataByKey('mdo')

            expect(component.currentFilter).toBe('mdo')
            expect(component.currentDepartment).toBe('mdo')
            expect(component.data.length).toBe(1)
            expect(component.data[0].mdo).toBe('Dept1')
            expect(createTableHeaderSpy).toHaveBeenCalled()
        })

        it('should filter data for cbp-providers key', () => {
            const createTableHeaderSpy = jest.spyOn(component, 'createTableHeader')

            component.getDepartDataByKey('cbp-providers')

            expect(component.currentFilter).toBe('cbp-providers')
            expect(component.data.length).toBe(1)
            expect(component.data[0].mdo).toBe('Dept2')
            expect(createTableHeaderSpy).toHaveBeenCalled()
        })

        it('should filter data for organisation key', () => {
            const createTableHeaderSpy = jest.spyOn(component, 'createTableHeader')
            jest.spyOn(component, 'transformDate').mockReturnValue('10/05/2023, 12:30 PM')

            component.getDepartDataByKey('organisation')

            expect(component.currentFilter).toBe('organisation')
            expect(component.data.length).toBe(2)
            expect(component.data[0].organisation).toBe('Dept1')
            expect(component.data[0].createdOn).toBe('10/05/2023, 12:30 PM')
            expect(createTableHeaderSpy).toHaveBeenCalled()
        })
    })

    describe('actionClick', () => {
        it('should navigate to create department page with the clicked data', () => {
            const clickedData = { id: '1', name: 'Test Dept' }
            component.currentFilter = 'mdo'

            component.actionClick(clickedData)

            expect(mockRouter.navigate).toHaveBeenCalledWith(
                ['/app/home/mdo/create-department', { data: JSON.stringify(clickedData) }]
            )
        })
    })

    describe('onEnterkySearch', () => {
        it('should reset pagination offset and call getAllDepartments with search value', () => {
            const getAllDepartmentsSpy = jest.spyOn(component, 'getAllDepartments')

            component.onEnterkySearch('test search')

            expect(component.pagination.offset).toBe(0)
            expect(getAllDepartmentsSpy).toHaveBeenCalledWith('test search')
        })
    })

    describe('transformDate', () => {
        it('should transform ISO date string to formatted date', () => {
            const result = component.transformDate('2023-05-10 12:30:45.123+0530')

            expect(mockDatePipe.transform).toHaveBeenCalled()
            expect(result).toBe('10/05/2023, 12:30 PM')
        })
    })

    describe('isAllowed', () => {
        it('should return true if user has allowed role', () => {
            component.userRoles = new Set(['DASHBOARD_ADMIN', 'USER'])

            const result = component.isAllowed(['DASHBOARD_ADMIN', 'SPV_ADMIN'])

            expect(result).toBe(true)
        })

        it('should return false if user does not have allowed role', () => {
            component.userRoles = new Set(['USER', 'LEARNER'])

            const result = component.isAllowed(['DASHBOARD_ADMIN', 'SPV_ADMIN'])

            expect(result).toBe(false)
        })

        it('should handle role case insensitively', () => {
            component.userRoles = new Set(['dashboard_admin', 'user'])

            const result = component.isAllowed(['DASHBOARD_ADMIN', 'SPV_ADMIN'])

            expect(result).toBe(true)
        })

        it('should return false if userRoles is empty', () => {
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

        it('should return cbp-providers for cbp-providers type', () => {
            component.currentFilter = 'mdo'

            const result = component.getSubOrgType('cbp-providers')

            expect(result).toBe('cbp-providers')
        })

        it('should return empty string for other cases', () => {
            component.currentFilter = 'mdo'

            const result = component.getSubOrgType('mdo')

            expect(result).toBe('')
        })
    })
})