import { RolesUsersComponent } from './roles-users.component'
import { of } from 'rxjs'
import * as _ from 'lodash'

describe('RolesUsersComponent', () => {
    let component: RolesUsersComponent
    let mockUsersSvc: any
    let mockRouter: any
    let mockProfileUtilSvc: any
    let mockRoute: any
    let mockProfile: any
    let mockUsersService: any

    beforeEach(() => {
        // Mock services
        mockUsersSvc = {
            getUsersByDepartment: jest.fn().mockReturnValue(of({
                active_users: [
                    {
                        firstName: 'John',
                        lastName: 'Doe',
                        emailId: 'john.doe@example.com',
                        roleInfo: [{ roleName: 'Admin' }]
                    }
                ]
            })),
            searchUserByenter: jest.fn().mockReturnValue(of({
                result: {
                    response: {
                        content: []
                    }
                }
            }))
        }

        mockRouter = {
            url: 'app/home/roles-users/manager',
            navigate: jest.fn()
        }

        mockProfileUtilSvc = {
            emailTransform: jest.fn((email) => email)
        }

        mockRoute = {
            snapshot: {
                parent: {
                    data: {
                        configService: {
                            unMappedUser: {
                                rootOrg: {
                                    orgName: 'Test Org',
                                    id: 'test-org-id'
                                }
                            }
                        }
                    }
                }
            },
            queryParams: of({
                role: 'Admin',
                orgID: 'org123',
                currentDept: 'department',
                depatName: 'IT Department'
            })
        }

        mockProfile = {
            getMyDepartment: jest.fn().mockReturnValue(of({
                active_users: [
                    {
                        firstName: 'Jane',
                        lastName: 'Smith',
                        emailId: 'jane.smith@example.com',
                        roleInfo: [{ roleName: 'User' }]
                    }
                ]
            }))
        }

        mockUsersService = {
            getAllRoleUsers: jest.fn().mockReturnValue(of({
                count: {
                    content: [
                        {
                            firstName: 'Bob',
                            lastName: 'Johnson',
                            email: 'bob.johnson@example.com',
                            isDeleted: false,
                            organisations: [
                                {
                                    organisationId: 'test-org-id',
                                    roles: ['Admin'],
                                    isDeleted: false
                                }
                            ],
                            userId: 'user123'
                        }
                    ]
                }
            })),
            getAllKongUsers: jest.fn().mockReturnValue(of({
                result: {
                    response: {
                        content: []
                    }
                }
            }))
        }

        // Create component instance with mocked dependencies
        component = new RolesUsersComponent(
            mockUsersSvc,
            mockRouter,
            mockProfileUtilSvc,
            mockRoute,
            mockProfile,
            mockUsersService
        )

        // Spy on component methods
        jest.spyOn(component, 'getAllKongUsers')
        jest.spyOn(component, 'getMyDepartment')
        jest.spyOn(component, 'ngOnInit')
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    describe('ngOnInit', () => {
        it('should set initial values and call getAllKongUsers', () => {
            // Simulate the ElementRef for ViewChild
            component.menuElement = { nativeElement: { parentElement: { offsetTop: 100 } } } as any

            component.ngOnInit()

            expect(component.tabsData.length).toBe(2)
            expect(component.role).toBe('roles-users')
            expect(component.rolename).toBe('Admin')
            expect(component.orgiId).toBe('org123')
            expect(component.currentDept).toBe('department')
            expect(component.deptName).toBe('IT Department')
            expect(component.getAllKongUsers).toHaveBeenCalled()
            expect(component.tabledata.columns.length).toBe(3)
            expect(component.tabledata.actions).toBeDefined()
        })

        it('should set createdDepartment with department name and type when provided', () => {
            component.ngOnInit()

            expect(component.createdDepartment).toEqual({
                depName: 'IT Department',
                depType: 'department'
            })
        })

        it('should set default createdDepartment when department info not provided', () => {
            // Reset queryParams to simulate missing department info
            mockRoute.queryParams = of({
                role: 'Admin',
                orgID: 'org123'
            })

            component.ngOnInit()

            expect(component.createdDepartment).toEqual({
                depName: 'Test Org',
                depType: 'SPV'
            })
        })
    })

    describe('getAllActiveUsersByDepartmentId', () => {
        it('should transform user data correctly', () => {
            component.getAllActiveUsersByDepartmentId('org123')

            expect(mockUsersSvc.getUsersByDepartment).toHaveBeenCalledWith('org123')
            expect(component.data.length).toBe(1)
            expect(component.data[0].fullName).toBe('John')
            expect(component.data[0].position).toEqual(['Admin'])
        })
    })

    describe('getAllActiveUsers', () => {
        it('should get all active users and transform data', () => {
            component.getAllActiveUsers()

            expect(mockProfile.getMyDepartment).toHaveBeenCalled()
            expect(component.data.length).toBe(1)
            expect(component.data[0].fullName).toBe('Jane')
            expect(component.data[0].position).toEqual(['User'])
        })
    })

    describe('getAllKongUsers', () => {
        it('should call getAllRoleUsers and getMyDepartment when data exists', () => {
            component.orgiId = 'org123'
            component.rolename = 'Admin'

            component.getAllKongUsers()

            expect(mockUsersService.getAllRoleUsers).toHaveBeenCalledWith('org123', 'Admin')
            expect(component.userWholeData).toBeDefined()
            expect(component.getMyDepartment).toHaveBeenCalled()
        })
    })

    describe('onSideNavTabClick', () => {
        it('should update currentTab and call getAllActiveUsersByDepartmentId for users tab', () => {
            // Mock document.getElementById
            document.getElementById = jest.fn().mockReturnValue({
                scrollIntoView: jest.fn()
            })

            component.orgiId = 'org123'
            component.onSideNavTabClick('users')

            expect(component.currentTab).toBe('users')
            expect(mockUsersSvc.getUsersByDepartment).toHaveBeenCalledWith('org123')
        })

        it('should handle scroll for non-users tab', () => {
            // Mock document.getElementById
            const mockScrollIntoView = jest.fn()
            document.getElementById = jest.fn().mockReturnValue({
                scrollIntoView: mockScrollIntoView
            })

            component.onSideNavTabClick('rolesandaccess')

            expect(component.currentTab).toBe('rolesandaccess')
            expect(mockScrollIntoView).toHaveBeenCalledWith({
                behavior: 'smooth',
                block: 'start',
                inline: 'start'
            })
        })
    })

    describe('getRoleList', () => {
        it('should return roles from organisations matching rootOrg id', () => {
            component.configSvc = {
                unMappedUser: {
                    rootOrg: {
                        id: 'test-org-id'
                    }
                }
            }

            const user = {
                organisations: [
                    {
                        organisationId: 'test-org-id',
                        roles: ['Admin', 'Editor']
                    },
                    {
                        organisationId: 'other-org',
                        roles: ['User']
                    }
                ]
            }

            const roles = component.getRoleList(user)

            expect(roles).toEqual(['Admin', 'Editor'])
        })

        it('should return empty array when no organisations match', () => {
            component.configSvc = {
                unMappedUser: {
                    rootOrg: {
                        id: 'test-org-id'
                    }
                }
            }

            const user = {
                organisations: [
                    {
                        organisationId: 'other-org',
                        roles: ['User']
                    }
                ]
            }

            const roles = component.getRoleList(user)

            expect(roles).toEqual([])
        })

        it('should return empty array when no organisations exist', () => {
            const user = {}
            const roles = component.getRoleList(user)
            expect(roles).toEqual([])
        })
    })

    describe('getMyDepartment', () => {
        it('should filter and transform user data correctly', () => {
            component.rolename = 'Admin'
            component.userWholeData = {
                content: [
                    {
                        firstName: 'Bob',
                        lastName: 'Johnson',
                        email: 'bob@example.com',
                        isDeleted: false,
                        organisations: [
                            {
                                organisationId: 'test-org-id',
                                roles: ['Admin'],
                                isDeleted: false
                            }
                        ],
                        userId: 'user123'
                    },
                    {
                        firstName: 'Alice',
                        lastName: 'Smith',
                        email: 'alice@example.com',
                        isDeleted: true,
                        organisations: [
                            {
                                organisationId: 'test-org-id',
                                roles: ['Admin'],
                                isDeleted: false
                            }
                        ],
                        userId: 'user456'
                    }
                ]
            }

            component.configSvc = {
                unMappedUser: {
                    rootOrg: {
                        id: 'test-org-id'
                    }
                }
            }

            component.getMyDepartment()

            expect(component.data.length).toBe(1)
            expect(component.data[0].fullName).toBe('Bob')
            expect(component.data[0].userId).toBe('user123')
        })
    })

    describe('onEnterkySearch', () => {
        it('should call searchUserByenter and update userWholeData', () => {
            component.orgiId = 'org123'

            component.onEnterkySearch('search query')

            expect(mockUsersSvc.searchUserByenter).toHaveBeenCalledWith('search query', 'org123')
            expect(component.getMyDepartment).toHaveBeenCalled()
        })
    })

    describe('editUser', () => {
        it('should navigate to create-user with correct params', () => {
            // Mock window.location
            Object.defineProperty(window, 'location', {
                value: { href: 'http://test.com/app/roles' },
                writable: true
            })

            component.orgiId = 'org123'
            component.deptName = 'IT Department'
            component.createdDepartment = { depName: 'IT Department', depType: 'department' }

            const mockEvent = {
                row: {
                    fullName: 'John Doe',
                    email: 'john@example.com',
                    roles: ['Admin'],
                    userId: 'user123'
                }
            }

            component.editUser(mockEvent)

            expect(mockRouter.navigate).toHaveBeenCalledWith(
                ['app/home/create-user'],
                {
                    queryParams: {
                        id: 'org123',
                        currentDept: 'organisation',
                        createDept: JSON.stringify(component.createdDepartment),
                        orgName: 'IT Department',
                        redirectionPath: 'http://test.com/app/roles'
                    },
                    state: {
                        userData: {
                            fullName: 'John Doe',
                            email: 'john@example.com',
                            roles: ['Admin'],
                            userId: 'user123',
                            position: ['Admin']
                        },
                        updateButton: true
                    }
                }
            )
        })
    })

    describe('handleScroll', () => {
        it('should set sticky to true when scrolled past element position', () => {
            component.elementPosition = 100
            window.pageYOffset = 150

            component.handleScroll()

            expect(component.sticky).toBe(true)
        })

        it('should set sticky to false when scrolled above element position', () => {
            component.elementPosition = 100
            window.pageYOffset = 50

            component.handleScroll()

            expect(component.sticky).toBe(false)
        })
    })

    describe('ngAfterViewInit', () => {
        it('should set elementPosition to 127', () => {
            component.ngAfterViewInit()
            expect(component.elementPosition).toBe(127)
        })
    })

    describe('ngOnDestroy', () => {
        it('should unsubscribe if subscription exists', () => {
            const mockUnsubscribe = jest.fn()
            // component.defaultSideNavBarOpenedSubscription = {
            //     unsubscribe: mockUnsubscribe
            // }

            component.ngOnDestroy()

            expect(mockUnsubscribe).toHaveBeenCalled()
        })

        it('should not throw error if subscription does not exist', () => {
            // component.defaultSideNavBarOpenedSubscription = undefined

            // This should not throw an error
            expect(() => {
                component.ngOnDestroy()
            }).not.toThrow()
        })
    })
})