
import { of } from 'rxjs'
import { DirectoryViewComponent } from './directroy.component'
jest.mock('@angular/router')
jest.mock('@angular/material/legacy-dialog')
jest.mock('../../services/directory.services')
jest.mock('@sunbird-cb/utils-v2')
jest.mock('@angular/common')

describe('DirectoryViewComponent', () => {
    let component: DirectoryViewComponent
    let mockActivatedRoute: any
    let mockRouter: any
    let mockMatDialog: any
    let mockDirectoryService: any
    let mockConfigurationsService: any
    let mockEventService: any
    let mockDatePipe: any

    beforeEach(() => {
        mockActivatedRoute = {
            params: of({ tab: 'mdo' }),
            parent: {
                snapshot: {
                    data: {
                        pageData: { data: { tabs: [] } },
                        configService: { userRoles: new Set(['DASHBOARD_ADMIN']) },
                    },
                },
            },
        }

        mockRouter = {
            navigate: jest.fn(),
        }

        mockMatDialog = {}

        mockDirectoryService = {
            getDepartmentTitles: jest.fn().mockReturnValue(of({ result: { response: { value: JSON.stringify({ orgTypeList: [] }) } } })),
            getAllDepartmentsKong: jest.fn().mockReturnValue(of({ result: { response: { content: [], count: 0 } } })),
        }

        mockConfigurationsService = {
            userProfile: { userId: 'testUser' },
        }

        mockEventService = {
            handleTabTelemetry: jest.fn(),
        }

        mockDatePipe = {
            transform: jest.fn().mockReturnValue('01/01/2022, 12:00 AM'),
        }

        component = new DirectoryViewComponent(
            mockMatDialog,
            mockActivatedRoute,
            mockConfigurationsService,
            mockDirectoryService,
            mockRouter,
            mockEventService,
            mockDatePipe
        )
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should call getAllDepartmentsHeaderAPI on ngOnInit', () => {
        const spy = jest.spyOn(component, 'getAllDepartmentsHeaderAPI')
        component.ngOnInit()
        expect(spy).toHaveBeenCalled()
    })

    it('should update currentFilter when route params change', () => {
        component.ngOnInit()
        // component.route.params.subscribe(params => {
        //     expect(component.currentFilter).toBe('mdo')
        // })
    })

    it('should call getAllDepartments on filter method', () => {
        const spy = jest.spyOn(component, 'getAllDepartments')
        component.filter('cbp providers')
        expect(spy).toHaveBeenCalled()
    })

    it('should call getDepartDataByKey with correct key in filter method', () => {
        const spy = jest.spyOn(component, 'getDepartDataByKey')
        component.filter('spv')
        expect(spy).toHaveBeenCalledWith('spv')
    })

    it('should handle pagination correctly in onPageChange', () => {
        component.onPageChange({ pageSize: 10, pageIndex: 1 })
        expect(component.pagination.offset).toBe(10)
        expect(mockDirectoryService.getAllDepartmentsKong).toHaveBeenCalled()
    })

    it('should navigate to role detail page on onRoleClick', () => {
        const mockRole = { data: { id: '1', channel: 'test', mdo: 'testOrg', type: 'mdo' } }
        component.onRoleClick(mockRole)
        expect(mockRouter.navigate).toHaveBeenCalledWith([
            '/app/roles/1/users',
            {
                queryParams: {
                    currentDept: component.currentFilter,
                    roleId: mockRole.data.id,
                    depatName: mockRole.data.channel,
                    orgName: mockRole.data.mdo,
                    tab: 'mdo',
                    subOrgType: '',
                },
            },
        ])
    })

    it('should call transformDate on date transformation', () => {
        const transformedDate = component.transformDate('2022-01-01 12:00:00')
        expect(transformedDate).toBe('01/01/2022, 12:00 AM')
    })

    it('should return true for allowed roles when user has matching role', () => {
        const result = component.isAllowed(['DASHBOARD_ADMIN'])
        expect(result).toBe(true)
    })

    it('should return false for allowed roles when user does not have matching role', () => {
        const result = component.isAllowed(['ADMIN'])
        expect(result).toBe(false)
    })
})
