import { RolesAccessComponent } from './roles-access.component'
import { of } from 'rxjs'

// Mock dependencies
const mockActivatedRoute = {
    queryParams: of({
        roleId: 'test-role-id',
        depatName: 'Test Department',
        subOrgType: 'ministry'
    }),
    snapshot: {
        params: {},
        queryParams: {},
        url: [],
        fragment: null,
        data: {},
        outlet: 'primary',
        component: null,
        routeConfig: null,
        root: null as any,
        parent: null,
        firstChild: null,
        children: [],
        pathFromRoot: [],
        paramMap: null as any,
        queryParamMap: null as any
    },
    url: of([]),
    params: of({}),
    data: of({}),
    fragment: of(null),
    outlet: 'primary',
    component: null,
    title: of(''),
    routeConfig: null,
    root: null as any,
    parent: null,
    firstChild: null,
    children: [],
    pathFromRoot: [],
    paramMap: of(null as any),
    queryParamMap: of(null as any)
}

const mockUsersService = {
    getAllKongUsers: jest.fn(),
    getAllRoleUsers: jest.fn()
}

const mockRolesService = {
    getAllRoles: jest.fn()
}

// Mock environment
jest.mock('../../../../../../../../../src/environments/environment', () => ({
    environment: {
        cbpProviderRoles: ['cbp', 'provider']
    }
}))

describe('RolesAccessComponent', () => {
    let component: RolesAccessComponent
    let usersService: any
    let rolesService: any
    let activatedRoute: any

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks()

        // Setup fresh mock instances
        usersService = { ...mockUsersService }
        rolesService = { ...mockRolesService }
        activatedRoute = {
            ...mockActivatedRoute,
            queryParams: of({
                roleId: 'test-role-id',
                depatName: 'Test Department',
                subOrgType: 'ministry'
            })
        }

        // Create component instance
        component = new RolesAccessComponent(
            activatedRoute as any,
            usersService,
            rolesService
        )
    })

    describe('Constructor and Initialization', () => {
        it('should create component', () => {
            expect(component).toBeTruthy()
        })

        it('should initialize properties from query params', () => {
            expect(component.deparmentId).toBe('test-role-id')
            expect(component.deparmentName).toBe('Test Department')
            expect(component.currentDept).toBe('mdo') // ministry -> mdo
        })

        it('should set currentDept to "mdo" when subOrgType is "ministry"', () => {
            const route = {
                queryParams: of({
                    roleId: 'test-id',
                    depatName: 'Test',
                    subOrgType: 'ministry'
                }),
                snapshot: mockActivatedRoute.snapshot,
                url: of([]),
                params: of({}),
                data: of({}),
                fragment: of(null),
                outlet: 'primary',
                component: null,
                title: of(''),
                routeConfig: null,
                root: null as any,
                parent: null,
                firstChild: null,
                children: [],
                pathFromRoot: [],
                paramMap: of(null as any),
                queryParamMap: of(null as any)
            }

            const comp = new RolesAccessComponent(route as any, usersService, rolesService)
            expect(comp.currentDept).toBe('mdo')
        })

        it('should set currentDept to "state" when subOrgType is "state"', () => {
            const route = {
                queryParams: of({
                    roleId: 'test-id',
                    depatName: 'Test',
                    subOrgType: 'state'
                }),
                snapshot: mockActivatedRoute.snapshot,
                url: of([]),
                params: of({}),
                data: of({}),
                fragment: of(null),
                outlet: 'primary',
                component: null,
                title: of(''),
                routeConfig: null,
                root: null as any,
                parent: null,
                firstChild: null,
                children: [],
                pathFromRoot: [],
                paramMap: of(null as any),
                queryParamMap: of(null as any)
            }

            const comp = new RolesAccessComponent(route as any, usersService, rolesService)
            expect(comp.currentDept).toBe('state')
        })

        it('should set currentDept to "CBP" for other subOrgTypes', () => {
            const route = {
                queryParams: of({
                    roleId: 'test-id',
                    depatName: 'Test',
                    subOrgType: 'other'
                }),
                snapshot: mockActivatedRoute.snapshot,
                url: of([]),
                params: of({}),
                data: of({}),
                fragment: of(null),
                outlet: 'primary',
                component: null,
                title: of(''),
                routeConfig: null,
                root: null as any,
                parent: null,
                firstChild: null,
                children: [],
                pathFromRoot: [],
                paramMap: of(null as any),
                queryParamMap: of(null as any)
            }

            const comp = new RolesAccessComponent(route as any, usersService, rolesService)
            expect(comp.currentDept).toBe('CBP')
        })

        it('should initialize default values', () => {
            expect(component.tabledata).toEqual([])
            expect(component.data).toEqual([])
            expect(component.counts).toEqual([])
            expect(component.parseRoledata).toEqual([])
            expect(component.rolesObject).toEqual([])
            expect(component.rolesContentObject).toEqual([])
            expect(component.individualRoleCount).toBe(true)
            expect(component.filteredRoles).toEqual([])
        })
    })

    describe('ngOnInit', () => {
        it('should initialize tabledata configuration', () => {
            usersService.getAllKongUsers.mockReturnValue(of({
                result: { response: { content: [] } }
            }))
            rolesService.getAllRoles.mockReturnValue(of({
                result: { response: { value: JSON.stringify({ orgTypeList: [] }) } }
            }))

            component.ngOnInit()

            expect(component.tabledata).toEqual({
                columns: [
                    { displayName: 'Role', key: 'role' },
                    { displayName: 'Count', key: 'count' },
                ],
                actions: [{ icon: 'refresh', label: 'Refresh', name: 'ViewCount', type: 'link' }],
                needCheckBox: false,
                needHash: false,
                sortColumn: '',
                sortState: 'asc',
                actionColumnName: 'Refresh',
            })
        })

        it('should call getAllKongUsers', () => {
            usersService.getAllKongUsers.mockReturnValue(of({
                result: { response: { content: [] } }
            }))
            rolesService.getAllRoles.mockReturnValue(of({
                result: { response: { value: JSON.stringify({ orgTypeList: [] }) } }
            }))

            component.ngOnInit()

            expect(usersService.getAllKongUsers).toHaveBeenCalledWith('test-role-id')
        })
    })

    describe('getAllKongUsers', () => {
        it('should set userWholeData and call fetchRoles when data exists', () => {
            const mockData = {
                result: { response: { content: [{ id: 1, name: 'User 1' }] } }
            }
            usersService.getAllKongUsers.mockReturnValue(of(mockData))
            rolesService.getAllRoles.mockReturnValue(of({
                result: { response: { value: JSON.stringify({ orgTypeList: [] }) } }
            }))

            jest.spyOn(component, 'fetchRoles')

            component.getAllKongUsers()

            expect(component.userWholeData).toEqual([{ id: 1, name: 'User 1' }])
            expect(component.fetchRoles).toHaveBeenCalled()
        })

        it('should call fetchRoles even when no content', () => {
            const mockData = {
                result: { response: { content: [] } }
            }
            usersService.getAllKongUsers.mockReturnValue(of(mockData))
            rolesService.getAllRoles.mockReturnValue(of({
                result: { response: { value: JSON.stringify({ orgTypeList: [] }) } }
            }))

            jest.spyOn(component, 'fetchRoles')

            component.getAllKongUsers()

            expect(component.fetchRoles).toHaveBeenCalled()
        })
    })

    describe('fetchRoles', () => {
        it('should process roles data and set component data', () => {
            const mockRolesData = {
                result: {
                    response: {
                        value: JSON.stringify({
                            orgTypeList: [
                                {
                                    name: 'MDO',
                                    roles: ['ROLE_1', 'ROLE_2']
                                }
                            ]
                        })
                    }
                }
            }

            rolesService.getAllRoles.mockReturnValue(of(mockRolesData))
            component.currentDept = 'mdo'

            component.fetchRoles()

            expect(component.parseRoledata).toBeDefined()
            expect(component.rolesObject).toHaveLength(1)
            expect(component.rolesObject[0]).toEqual({
                name: 'MDO',
                roles: ['ROLE_1', 'ROLE_2']
            })
            expect(component.data).toEqual([
                { role: 'ROLE_1', count: '0' },
                { role: 'ROLE_2', count: '0' }
            ])
            expect(component.filteredRoles).toEqual(component.data)
        })

        it('should handle CBP provider roles transformation', () => {
            const mockRolesData = {
                result: {
                    response: {
                        value: JSON.stringify({
                            orgTypeList: [
                                {
                                    name: 'CBP',
                                    roles: ['CBP_ROLE_1']
                                }
                            ]
                        })
                    }
                }
            }

            rolesService.getAllRoles.mockReturnValue(of(mockRolesData))
            component.currentDept = 'provider' // Should be transformed to CBP

            component.fetchRoles()

            expect(component.currentDept).toBe('CBP')
            expect(component.rolesObject).toHaveLength(1)
        })

        it('should handle duplicate roles by filtering them out', () => {
            const mockRolesData = {
                result: {
                    response: {
                        value: JSON.stringify({
                            orgTypeList: [
                                {
                                    name: 'MDO',
                                    roles: ['ROLE_1', 'ROLE_2', 'ROLE_1'] // Duplicate ROLE_1
                                }
                            ]
                        })
                    }
                }
            }

            rolesService.getAllRoles.mockReturnValue(of(mockRolesData))
            component.currentDept = 'mdo'

            component.fetchRoles()

            expect(component.data).toHaveLength(2) // Should have only unique roles
            expect(component.data.map((d: any) => d.role)).toEqual(['ROLE_1', 'ROLE_2'])
        })
    })

    describe('onRoleSearch', () => {
        beforeEach(() => {
            component.data = [
                { role: 'ADMIN_ROLE', count: '5' },
                { role: 'USER_ROLE', count: '10' },
                { role: 'VIEWER_ROLE', count: '3' }
            ]
        })

        it('should filter roles based on search query', () => {
            component.onRoleSearch('admin')

            expect(component.filteredRoles).toEqual([
                { role: 'ADMIN_ROLE', count: '5' }
            ])
        })

        it('should filter roles case-insensitively', () => {
            component.onRoleSearch('USER')

            expect(component.filteredRoles).toEqual([
                { role: 'USER_ROLE', count: '10' }
            ])
        })

        it('should reset to full data when search query is empty', () => {
            component.filteredRoles = [{ role: 'ADMIN_ROLE', count: '5' }]

            component.onRoleSearch('')

            expect(component.filteredRoles).toEqual(component.data)
        })

        it('should handle null or undefined search query', () => {
            component.filteredRoles = [{ role: 'ADMIN_ROLE', count: '5' }]

            component.onRoleSearch(null as any)

            expect(component.filteredRoles).toEqual(component.data)
        })

        it('should return empty array when no matches found', () => {
            component.onRoleSearch('nonexistent')

            expect(component.filteredRoles).toEqual([])
        })
    })

    describe('fetchIndidualRoleData', () => {
        it('should update individual role count', () => {
            const mockResponse = { count: { count: 15 } }
            usersService.getAllRoleUsers.mockReturnValue(of(mockResponse))

            component.data = [
                { role: 'TEST_ROLE', count: '0' },
                { role: 'OTHER_ROLE', count: '0' }
            ]

            component.fetchIndidualRoleData('org-id', 'TEST_ROLE')

            expect(usersService.getAllRoleUsers).toHaveBeenCalledWith('org-id', 'TEST_ROLE')
            expect(component.individualRoleCount).toBe(true)
            expect(component.data[0].count).toBe(15)
            expect(component.data[1].count).toBe('0') // Should remain unchanged
        })

        it('should handle role not found in data array', () => {
            const mockResponse = { count: { count: 10 } }
            usersService.getAllRoleUsers.mockReturnValue(of(mockResponse))

            component.data = [
                { role: 'DIFFERENT_ROLE', count: '0' }
            ]

            component.fetchIndidualRoleData('org-id', 'NONEXISTENT_ROLE')

            expect(component.data[0].count).toBe('0') // Should remain unchanged
        })
    })

    describe('actionsClick', () => {
        it('should handle ViewCount action', () => {
            const mockEvent = {
                action: 'ViewCount',
                row: { role: 'TEST_ROLE' }
            }

            jest.spyOn(component, 'fetchIndidualRoleData')
            component.deparmentId = 'test-dept-id'

            component.actionsClick(mockEvent)

            expect(component.individualRoleCount).toBe(false)
            expect(component.fetchIndidualRoleData).toHaveBeenCalledWith('test-dept-id', 'TEST_ROLE')
        })

        it('should ignore other actions', () => {
            const mockEvent = {
                action: 'OtherAction',
                row: { role: 'TEST_ROLE' }
            }

            jest.spyOn(component, 'fetchIndidualRoleData')
            component.individualRoleCount = true

            component.actionsClick(mockEvent)

            expect(component.individualRoleCount).toBe(true)
            expect(component.fetchIndidualRoleData).not.toHaveBeenCalled()
        })
    })

    describe('onRoleClick', () => {
        it('should emit clicked department event', () => {
            const mockClickedData = { role: 'ADMIN_ROLE' }

            jest.spyOn(component.clickedDepartment, 'emit')

            component.onRoleClick(mockClickedData)

            expect(component.clickedDepartment.emit).toHaveBeenCalledWith('ADMIN_ROLE')
        })
    })

    describe('ngAfterViewInit', () => {
        it('should be called without errors', () => {
            expect(() => component.ngAfterViewInit()).not.toThrow()
        })
    })

    describe('Edge Cases', () => {
        it('should handle empty orgTypeList in fetchRoles', () => {
            const mockRolesData = {
                result: {
                    response: {
                        value: JSON.stringify({
                            orgTypeList: []
                        })
                    }
                }
            }

            rolesService.getAllRoles.mockReturnValue(of(mockRolesData))

            expect(() => component.fetchRoles()).not.toThrow()
            expect(component.data).toEqual([])
        })

        it('should handle malformed JSON in fetchRoles', () => {
            const mockRolesData = {
                result: {
                    response: {
                        value: 'invalid json'
                    }
                }
            }

            rolesService.getAllRoles.mockReturnValue(of(mockRolesData))

            expect(() => component.fetchRoles()).toThrow()
        })

        it('should handle empty data array in onRoleSearch', () => {
            component.data = []

            component.onRoleSearch('test')

            expect(component.filteredRoles).toEqual([])
        })
    })
})