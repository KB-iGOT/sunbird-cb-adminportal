import { RolesAccessComponent } from './roles-access.component'
import { Router } from '@angular/router'
import { RolesService } from '../../services/roles.service'
import { UsersService } from '../../services/users.service'
import { of } from 'rxjs'

describe('RolesAccessComponent', () => {
    let component: RolesAccessComponent
    let mockRouter: jest.Mocked<Router>
    let mockActivatedRoute: any
    let mockUsersService: jest.Mocked<UsersService>
    let mockRolesService: jest.Mocked<RolesService>

    beforeEach(() => {
        // Create mock services
        mockRouter = {
            navigate: jest.fn()
        } as unknown as jest.Mocked<Router>

        mockActivatedRoute = {
            snapshot: {
                parent: {
                    data: {
                        configService: {
                            unMappedUser: {
                                roles: ['STATE_ADMIN'],
                                rootOrg: {
                                    rootOrgId: 'test-org-id',
                                    orgName: 'Test Org'
                                }
                            }
                        }
                    }
                }
            }
        }

        mockUsersService = {
            getAllKongUsers: jest.fn().mockReturnValue(of({
                result: {
                    response: {
                        content: [{ id: 'user1' }, { id: 'user2' }]
                    }
                }
            })),
            getAllRoleUsers: jest.fn().mockReturnValue(of({
                count: { count: 5 }
            }))
        } as unknown as jest.Mocked<UsersService>

        mockRolesService = {
            getAllRoles: jest.fn().mockReturnValue(of({
                result: {
                    response: {
                        value: JSON.stringify({
                            orgTypeList: [
                                {
                                    name: 'STATE',
                                    roles: ['ROLE1', 'ROLE2']
                                },
                                {
                                    name: 'SPV',
                                    roles: ['ROLE3', 'ROLE4']
                                }
                            ]
                        })
                    }
                }
            }))
        } as unknown as jest.Mocked<RolesService>

        // Create component instance
        component = new RolesAccessComponent(
            mockRouter,
            mockActivatedRoute,
            mockUsersService,
            mockRolesService
        )
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize with correct role type based on user roles (STATE_ADMIN)', () => {
        // Already initialized in beforeEach with STATE_ADMIN
        expect(component.roleType).toBe('STATE')
    })

    it('should initialize with correct role type based on user roles (SPV_ADMIN)', () => {
        // Setup SPV_ADMIN role
        mockActivatedRoute.snapshot.parent.data.configService.unMappedUser.roles = ['SPV_ADMIN']

        // Re-initialize component
        component = new RolesAccessComponent(
            mockRouter,
            mockActivatedRoute,
            mockUsersService,
            mockRolesService
        )

        expect(component.roleType).toBe('SPV')
    })

    it('should call getAllKongUsers on initialization', () => {
        expect(mockUsersService.getAllKongUsers).toHaveBeenCalledWith('test-org-id')
        expect(component.userWholeData).toEqual([{ id: 'user1' }, { id: 'user2' }])
    })

    it('should fetch roles on ngOnInit', () => {
        // Reset to ensure we're testing the call from ngOnInit
        mockRolesService.getAllRoles.mockClear()

        component.ngOnInit()

        expect(mockRolesService.getAllRoles).toHaveBeenCalled()
        expect(component.tabledata).toBeDefined()
        expect(component.tabledata.columns.length).toBe(2)
    })

    it('should filter roles correctly when searching', () => {
        // Setup roles data
        component.data = [
            { role: 'ADMIN', count: 0 },
            { role: 'TEACHER', count: 0 },
            { role: 'STUDENT', count: 0 }
        ]
        component.filteredRoles = [...component.data]

        // Test search
        component.onRoleSearch('ADMIN')

        expect(component.filteredRoles.length).toBe(1)
        expect(component.filteredRoles[0].role).toBe('ADMIN')

        // Test empty search
        component.onRoleSearch('')

        expect(component.filteredRoles.length).toBe(3)
    })

    it('should fetch individual role data correctly', () => {
        // Setup roles data
        component.data = [
            { role: 'ROLE1', count: 0 },
            { role: 'ROLE2', count: 0 }
        ]

        component.fetchIndidualRoleData('test-org-id', 'ROLE1')

        expect(mockUsersService.getAllRoleUsers).toHaveBeenCalledWith('test-org-id', 'ROLE1')
        expect(component.data[0].count).toBe(5)
        expect(component.individualRoleCount).toBe(true)
    })

    it('should handle actions click for ViewCount', () => {
        // Spy on fetchIndidualRoleData
        jest.spyOn(component, 'fetchIndidualRoleData')

        component.actionsClick({
            action: 'ViewCount',
            row: { role: 'ROLE1' }
        })

        expect(component.individualRoleCount).toBe(true)
        expect(component.fetchIndidualRoleData).toHaveBeenCalledWith('test-org-id', 'ROLE1')
    })

    it('should navigate to the correct route on role click', () => {
        component.onRoleClick({ role: 'ROLE1' })

        expect(mockRouter.navigate).toHaveBeenCalledWith(
            ['/app/home/roles-users'],
            {
                queryParams: {
                    role: 'ROLE1',
                    orgID: 'test-org-id',
                    depatName: 'Test Org'
                }
            }
        )
    })

    it('should parse role data correctly in fetchRoles', () => {
        // Call the method directly
        component.fetchRoles()

        // Check that the roles are parsed correctly
        expect(component.rolesObject.length).toBe(1)
        expect(component.rolesObject[0].name).toBe('STATE')
        expect(component.rolesObject[0].roles).toEqual(['ROLE1', 'ROLE2'])
        expect(component.data.length).toBe(2)
        expect(component.data[0].role).toBe('ROLE1')
        expect(component.data[1].role).toBe('ROLE2')
    })
})