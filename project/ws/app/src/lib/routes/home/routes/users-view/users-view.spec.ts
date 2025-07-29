import { UsersViewComponent } from './users-view.component'
import { of, throwError } from 'rxjs'
import * as _ from 'lodash'

describe('UsersViewComponent', () => {
  let component: UsersViewComponent
  let mockDialog: any
  let mockRoute: any
  let mockLoaderService: any
  let mockRouter: any
  let mockUsersService: any
  let mockConfigSvc: any
  let mockSnackBar: any
  let mockEvents: any
  let mockProfileUtilSvc: any

  beforeEach(() => {
    // Mock dependencies
    mockDialog = {
      open: jest.fn()
    }

    mockRoute = {
      parent: {
        snapshot: {
          data: {
            configService: {
              userProfile: { userId: 'test-user-id' },
              unMappedUser: {
                rootOrg: {
                  rootOrgId: 'test-root-org-id',
                  id: 'test-org-id'
                }
              }
            },
            pageData: {
              data: {
                tabs: [{ name: 'tab1' }, { name: 'tab2' }]
              }
            }
          }
        }
      },
      data: {
        subscribe: jest.fn()
      },
      snapshot: {
        parent: {
          data: {
            configService: {
              userProfile: { userId: 'logged-in-user-id' },
              unMappedUser: {
                rootOrg: {
                  rootOrgId: 'test-root-org-id',
                  id: 'test-org-id'
                }
              }
            }
          }
        }
      }
    }

    mockLoaderService = {
      changeLoad: {
        next: jest.fn()
      }
    }

    mockRouter = {
      navigate: jest.fn()
    }

    mockUsersService = {
      getAllKongUsersPaginated: jest.fn(),
      blockUser: jest.fn(),
      newBlockUserKong: jest.fn(),
      newUnBlockUserKong: jest.fn(),
      deActiveUser: jest.fn()
    }

    mockConfigSvc = {
      userProfile: { userId: 'test-user-id' },
      unMappedUser: {
        rootOrg: {
          rootOrgId: 'test-root-org-id',
          id: 'test-org-id'
        }
      }
    }

    mockSnackBar = {
      open: jest.fn()
    }

    mockEvents = {
      handleTabTelemetry: jest.fn()
    }

    mockProfileUtilSvc = {
      emailTransform: jest.fn((email) => email)
    }
  })

  describe('Constructor - Lines 73-87', () => {
    it('should handle route.data.subscribe with complete profile data', () => {
      const subscribeFn = jest.fn((callback) => {
        callback({
          profile: {
            data: [{ id: 'profile-1', name: 'Test Profile' }]
          }
        })
        return { unsubscribe: jest.fn() }
      })
      mockRoute.data.subscribe = subscribeFn

      component = new UsersViewComponent(
        mockDialog,
        mockRoute,
        mockLoaderService,
        mockRouter,
        mockUsersService,
        mockConfigSvc,
        mockSnackBar,
        mockEvents,
        mockProfileUtilSvc
      )

      expect(subscribeFn).toHaveBeenCalled()
      expect(component.portalProfile).toEqual({ id: 'profile-1', name: 'Test Profile' })
    })

    it('should handle route.data.subscribe with null profile', () => {
      const subscribeFn = jest.fn((callback) => {
        callback({
          profile: null
        })
        return { unsubscribe: jest.fn() }
      })
      mockRoute.data.subscribe = subscribeFn

      component = new UsersViewComponent(
        mockDialog,
        mockRoute,
        mockLoaderService,
        mockRouter,
        mockUsersService,
        mockConfigSvc,
        mockSnackBar,
        mockEvents,
        mockProfileUtilSvc
      )

      expect(component.portalProfile).toBeFalsy()
    })

    it('should handle route.data.subscribe with profile but no data', () => {
      const subscribeFn = jest.fn((callback) => {
        callback({
          profile: {}
        })
        return { unsubscribe: jest.fn() }
      })
      mockRoute.data.subscribe = subscribeFn

      component = new UsersViewComponent(
        mockDialog,
        mockRoute,
        mockLoaderService,
        mockRouter,
        mockUsersService,
        mockConfigSvc,
        mockSnackBar,
        mockEvents,
        mockProfileUtilSvc
      )

      expect(component.portalProfile).toBeFalsy()
    })

    it('should handle route.data.subscribe with empty profile data array', () => {
      const subscribeFn = jest.fn((callback) => {
        callback({
          profile: {
            data: []
          }
        })
        return { unsubscribe: jest.fn() }
      })
      mockRoute.data.subscribe = subscribeFn

      component = new UsersViewComponent(
        mockDialog,
        mockRoute,
        mockLoaderService,
        mockRouter,
        mockUsersService,
        mockConfigSvc,
        mockSnackBar,
        mockEvents,
        mockProfileUtilSvc
      )

      expect(component.portalProfile).toBeFalsy()
    })

    it('should handle complete constructor initialization', () => {
      const subscribeFn = jest.fn((callback) => {
        callback({
          profile: {
            data: [{ id: 'profile-1', name: 'Test Profile' }]
          }
        })
        return { unsubscribe: jest.fn() }
      })
      mockRoute.data.subscribe = subscribeFn

      component = new UsersViewComponent(
        mockDialog,
        mockRoute,
        mockLoaderService,
        mockRouter,
        mockUsersService,
        mockConfigSvc,
        mockSnackBar,
        mockEvents,
        mockProfileUtilSvc
      )

      expect(component.Math).toBe(Math)
      ///  expect(component.configSvc).toBe(mockConfigSvc)
      expect(component.currentUser).toBe('test-user-id')
      expect(component.tabsData).toEqual([{ name: 'tab1' }, { name: 'tab2' }])
      expect(component.tabs).toBeDefined()
    })
  })

  describe('Component Initialization', () => {
    beforeEach(() => {
      const subscribeFn = jest.fn((callback) => {
        callback({
          profile: {
            data: [{ id: 'profile-1', name: 'Test Profile' }]
          }
        })
        return { unsubscribe: jest.fn() }
      })
      mockRoute.data.subscribe = subscribeFn

      component = new UsersViewComponent(
        mockDialog,
        mockRoute,
        mockLoaderService,
        mockRouter,
        mockUsersService,
        mockConfigSvc,
        mockSnackBar,
        mockEvents,
        mockProfileUtilSvc
      )
    })

    describe('ngOnInit', () => {
      it('should initialize component properties and call filterData', () => {
        jest.spyOn(component, 'filterData').mockImplementation(() => { })
        component.ngOnInit()

        expect(component.rootOrgId).toBe('test-root-org-id')
        expect(component.tabledata).toEqual({
          actions: [],
          columns: [
            { displayName: 'Full name', key: 'fullname' },
            { displayName: 'Email', key: 'email' },
            { displayName: 'Roles', key: 'roles' },
          ],
          needCheckBox: false,
          needHash: false,
          sortColumn: '',
          sortState: 'asc',
          needUserMenus: true,
        })
        expect(component.filterData).toHaveBeenCalledWith('')
      })
    })

    describe('filter', () => {
      it('should reset pagination and call filterData', () => {
        jest.spyOn(component, 'filterData').mockImplementation(() => { })
        component.pageIndex = 5
        component.currentOffset = 100
        component.limit = 50
        component.searchQuery = 'test'

        component.filter('inactive')

        expect(component.currentFilter).toBe('inactive')
        expect(component.pageIndex).toBe(0)
        expect(component.currentOffset).toBe(0)
        expect(component.limit).toBe(20)
        expect(component.searchQuery).toBe('')
        expect(component.filterData).toHaveBeenCalledWith('')
      })
    })

    describe('dataForTable getter', () => {
      it('should return activeUsersData when filter is active', () => {
        component.currentFilter = 'active'
        component.activeUsersData = [{ id: 1 }]
        expect(component.dataForTable).toEqual([{ id: 1 }])
      })

      it('should return inactiveUsersData when filter is inactive', () => {
        component.currentFilter = 'inactive'
        component.inactiveUsersData = [{ id: 2 }]
        expect(component.dataForTable).toEqual([{ id: 2 }])
      })

      it('should return empty array for unknown filter', () => {
        component.currentFilter = 'unknown'
        expect(component.dataForTable).toEqual([])
      })
    })

    describe('filterData', () => {
      it('should call activeUsers when filter is active', () => {
        jest.spyOn(component, 'activeUsers').mockImplementation(() => [])
        jest.spyOn(component, 'raiseTabTelemetry').mockImplementation(() => { })
        component.currentFilter = 'active'

        component.filterData('test query')

        expect(component.raiseTabTelemetry).toHaveBeenCalledWith('active', { index: 1, label: 'active' })
        expect(component.activeUsers).toHaveBeenCalledWith('test query')
      })

      it('should call inActiveUsers when filter is inactive', () => {
        jest.spyOn(component, 'inActiveUsers').mockImplementation(() => [])
        jest.spyOn(component, 'raiseTabTelemetry').mockImplementation(() => { })
        component.currentFilter = 'inactive'

        component.filterData('test query')

        expect(component.raiseTabTelemetry).toHaveBeenCalledWith('inactive', { index: 2, label: 'inactive' })
        expect(component.inActiveUsers).toHaveBeenCalledWith('test query')
      })
    })

    describe('activeUsers - Lines 138-139', () => {
      const mockUserData = {
        result: {
          response: {
            count: 50,
            content: [
              {
                firstName: 'John',
                isDeleted: false,
                personalDetails: { primaryEmail: 'john@test.com' },
                email: 'john@test.com',
                userId: 'user-1',
                blocked: false,
                organisations: [
                  {
                    organisationId: 'test-org-id',
                    roles: ['admin', 'user']
                  }
                ]
              },
              {
                firstName: 'Jane',
                isDeleted: true, // This should be filtered out
                personalDetails: { primaryEmail: 'jane@test.com' },
                email: 'jane@test.com',
                userId: 'user-2',
                blocked: false,
                organisations: [
                  {
                    organisationId: 'test-org-id',
                    roles: ['user']
                  }
                ]
              }
            ]
          }
        }
      }

      it('should process active users and return activeUsersData', () => {
        mockUsersService.getAllKongUsersPaginated.mockReturnValue(of(mockUserData))
        component.currentFilter = 'active'
        component.pageIndex = 1
        component.limit = 20

        const result = component.activeUsers('test query')

        expect(mockLoaderService.changeLoad.next).toHaveBeenCalledWith(true)
        expect(mockUsersService.getAllKongUsersPaginated).toHaveBeenCalledWith(
          'test-root-org-id',
          1,
          20,
          20,
          'test query'
        )
        expect(component.userDataTotalCount).toBe(50)
        expect(component.activeUsersData).toHaveLength(1)
        expect(component.activeUsersData[0]).toEqual({
          fullname: 'John',
          active: true,
          email: 'john@test.com',
          roles: 'admin, user',
          userId: 'user-1',
          role: ['admin', 'user'],
          blocked: false
        })
        // Testing line 138-139 - the return statement
        expect(result).toBe(component.activeUsersData)
      })

      it('should handle user without personalDetails', () => {
        const userData = {
          result: {
            response: {
              count: 1,
              content: [
                {
                  firstName: 'John',
                  isDeleted: false,
                  email: 'john@test.com',
                  userId: 'user-1',
                  blocked: false,
                  organisations: [
                    {
                      organisationId: 'test-org-id',
                      roles: ['admin']
                    }
                  ]
                }
              ]
            }
          }
        }
        mockUsersService.getAllKongUsersPaginated.mockReturnValue(of(userData))

        const result = component.activeUsers('test')

        expect(component.activeUsersData[0].email).toBe('john@test.com')
        expect(result).toBe(component.activeUsersData)
      })

      it('should handle empty content', () => {
        const userData = {
          result: {
            response: {
              count: 0,
              content: []
            }
          }
        }
        mockUsersService.getAllKongUsersPaginated.mockReturnValue(of(userData))

        const result = component.activeUsers('test')

        expect(component.activeUsersData).toEqual([])
        expect(result).toBe(component.activeUsersData)
      })
    })

    describe('inActiveUsers - Lines 168-182', () => {
      const mockInactiveUserData = {
        result: {
          response: {
            count: 25,
            content: [
              {
                firstName: 'Inactive',
                isDeleted: true,
                personalDetails: { primaryEmail: 'inactive@test.com' },
                userId: 'inactive-user-1',
                blocked: true,
                organisations: [
                  {
                    organisationId: 'test-org-id',
                    roles: ['user']
                  }
                ]
              },
              {
                firstName: 'Active',
                isDeleted: false, // This should be filtered out in inactive
                personalDetails: { primaryEmail: 'active@test.com' },
                userId: 'active-user-1',
                blocked: false,
                organisations: [
                  {
                    organisationId: 'test-org-id',
                    roles: ['admin']
                  }
                ]
              },
              {
                firstName: 'Deleted2',
                isDeleted: true,
                email: 'deleted2@test.com',
                userId: 'inactive-user-2',
                blocked: false,
                organisations: [
                  {
                    organisationId: 'test-org-id',
                    roles: ['moderator', 'user']
                  }
                ]
              }
            ]
          }
        }
      }

      it('should process inactive users and return inactiveUsersData', () => {
        mockUsersService.getAllKongUsersPaginated.mockReturnValue(of(mockInactiveUserData))
        component.currentFilter = 'inactive'

        const result = component.inActiveUsers('test query')

        expect(mockUsersService.getAllKongUsersPaginated).toHaveBeenCalledWith(
          'test-root-org-id',
          0,
          20,
          0,
          'test query'
        )
        expect(component.userDataTotalCount).toBe(25)
        // Lines 168-182 - processing only deleted users
        expect(component.inactiveUsersData).toHaveLength(2)
        expect(component.inactiveUsersData[0]).toEqual({
          fullname: 'Inactive',
          active: false,
          email: 'inactive@test.com',
          roles: 'user',
          userId: 'inactive-user-1',
          role: ['user'],
          blocked: true
        })
        expect(component.inactiveUsersData[1]).toEqual({
          fullname: 'Deleted2',
          active: false,
          email: 'deleted2@test.com',
          roles: 'moderator, user',
          userId: 'inactive-user-2',
          role: ['moderator', 'user'],
          blocked: false
        })
        expect(result).toBe(component.inactiveUsersData)
      })

      it('should handle pagination calculation in inActiveUsers', () => {
        mockUsersService.getAllKongUsersPaginated.mockReturnValue(of(mockInactiveUserData))
        component.currentFilter = 'inactive'
        component.pageIndex = 2
        component.limit = 10

        component.inActiveUsers('search term')

        expect(component.currentOffset).toBe(20) // 10 * ((2+1) - 1)
        expect(mockUsersService.getAllKongUsersPaginated).toHaveBeenCalledWith(
          'test-root-org-id',
          0,
          10,
          20,
          'search term'
        )
      })

      it('should filter only deleted users in inActiveUsers forEach', () => {
        const mixedData = {
          result: {
            response: {
              count: 4,
              content: [
                {
                  firstName: 'Active1',
                  isDeleted: false,
                  email: 'active1@test.com',
                  userId: 'active-1',
                  blocked: false,
                  organisations: [{ organisationId: 'test-org-id', roles: ['user'] }]
                },
                {
                  firstName: 'Deleted1',
                  isDeleted: true,
                  email: 'deleted1@test.com',
                  userId: 'deleted-1',
                  blocked: false,
                  organisations: [{ organisationId: 'test-org-id', roles: ['admin'] }]
                },
                {
                  firstName: 'Active2',
                  isDeleted: false,
                  email: 'active2@test.com',
                  userId: 'active-2',
                  blocked: true,
                  organisations: [{ organisationId: 'test-org-id', roles: ['moderator'] }]
                },
                {
                  firstName: 'Deleted2',
                  isDeleted: true,
                  email: 'deleted2@test.com',
                  userId: 'deleted-2',
                  blocked: true,
                  organisations: [{ organisationId: 'test-org-id', roles: ['user', 'admin'] }]
                }
              ]
            }
          }
        }
        mockUsersService.getAllKongUsersPaginated.mockReturnValue(of(mixedData))

        const result = component.inActiveUsers('test')

        // Lines 168-182 should only process deleted users
        expect(component.inactiveUsersData).toHaveLength(2)
        expect(component.inactiveUsersData.map(u => u.userId)).toEqual(['deleted-1', 'deleted-2'])
        expect(component.inactiveUsersData.every(user => !user.active)).toBe(true)
        expect(result).toBe(component.inactiveUsersData)
      })
    })

    describe('onCreateClick', () => {
      it('should navigate to create user page', () => {
        component.onCreateClick()
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/create-user'])
      })
    })

    describe('menuActions - Testing Commented Implementation Lines 193-269', () => {
      // These tests simulate the commented-out alternative menuActions implementation

      beforeEach(() => {
        component.currentUser = 'current-user-id'
        component.usersData = { id: 'dept-123' }
      })

      it('should handle showOnKarma action from commented implementation', () => {
        const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
        const event = {
          action: 'showOnKarma',
          row: { userId: 'test-user-id' }
        }

        // Simulate line 216-217 from commented code
        component.menuActions(event)

        expect(windowOpenSpy).toHaveBeenCalledWith(
          expect.stringContaining('/app/person-profile/test-user-id')
        )
        windowOpenSpy.mockRestore()
      })

      it('should handle block action with newBlockUserKong - commented implementation style', () => {
        const mockResponse = { params: { status: 'SUCCESS' } }
        mockUsersService.newBlockUserKong.mockReturnValue(of(mockResponse))
        const event = {
          action: 'block',
          row: {
            userId: 'test-user-id',
            blocked: false,
            active: true,
            role: [{ roleName: 'admin' }, { roleName: 'user' }]
          }
        }

        jest.useFakeTimers()
        jest.spyOn(component, 'filterData').mockImplementation(() => { })

        // Simulating lines 218-235 from commented implementation
        component.menuActions(event)

        expect(mockUsersService.newBlockUserKong).toHaveBeenCalledWith(
          'logged-in-user-id',
          'test-user-id'
        )

        jest.advanceTimersByTime(1500)

        expect(component.filterData).toHaveBeenCalledWith('')
        expect(mockSnackBar.open).toHaveBeenCalledWith('Deactivated successfully!')

        jest.useRealTimers()
      })

      it('should handle unblock action with newUnBlockUserKong - commented implementation', () => {
        const mockResponse = { params: { status: 'SUCCESS' } }
        mockUsersService.newUnBlockUserKong.mockReturnValue(of(mockResponse))
        const event = {
          action: 'unblock',
          row: {
            userId: 'test-user-id',
            blocked: true,
            active: false,
            role: [{ roleName: 'user' }]
          }
        }

        jest.useFakeTimers()
        jest.spyOn(component, 'filterData').mockImplementation(() => { })

        // Simulating lines 236-251 from commented implementation
        component.menuActions(event)

        expect(mockUsersService.newUnBlockUserKong).toHaveBeenCalledWith(
          'logged-in-user-id',
          'test-user-id'
        )

        jest.advanceTimersByTime(1500)

        expect(mockSnackBar.open).toHaveBeenCalledWith('Activated successfully!')

        jest.useRealTimers()
      })

      it('should handle deactive action with newUnBlockUserKong - commented implementation', () => {
        const mockResponse = { params: { errmsg: 'Deactivated successfully' } }
        mockUsersService.newUnBlockUserKong.mockReturnValue(of(mockResponse))
        const event = {
          action: 'deactive',
          row: {
            userId: 'test-user-id',
            active: true,
            role: [{ roleName: 'user' }]
          }
        }

        // Simulating lines 252-261 from commented implementation
        component.menuActions(event)

        expect(mockSnackBar.open).toHaveBeenCalledWith('Deactivated successfully')
      })

      it('should handle active action with deActiveUser - commented implementation', () => {
        const mockResponse = { result: 'success' }
        mockUsersService.deActiveUser.mockReturnValue(of(mockResponse))
        const event = {
          action: 'active',
          row: {
            userId: 'test-user-id',
            blocked: false,
            active: false,
            role: [{ roleName: 'admin' }, { roleName: 'user' }]
          }
        }

        // Simulating lines 262-269 from commented implementation
        component.menuActions(event)

        expect(mockUsersService.deActiveUser).toHaveBeenCalledWith({
          userId: 'test-user-id',
          deptId: 'dept-123',
          isBlocked: false,
          isActive: false,
          roles: ['admin', 'user']
        })
        expect(mockSnackBar.open).toHaveBeenCalledWith('Updated successfully !')
      })

      it('should handle error in block action - commented implementation', () => {
        mockUsersService.newBlockUserKong.mockReturnValue(throwError('Service error'))
        const event = {
          action: 'block',
          row: {
            userId: 'test-user-id',
            blocked: false,
            active: true,
            role: [{ roleName: 'admin' }]
          }
        }

        component.menuActions(event)

        expect(mockSnackBar.open).toHaveBeenCalledWith('Error in inactive')
      })

      it('should handle error in unblock action - commented implementation', () => {
        mockUsersService.newUnBlockUserKong.mockReturnValue(throwError('Service error'))
        const event = {
          action: 'unblock',
          row: {
            userId: 'test-user-id',
            blocked: true,
            active: false,
            role: [{ roleName: 'user' }]
          }
        }

        component.menuActions(event)

        expect(mockSnackBar.open).toHaveBeenCalledWith('Error in active')
      })

      it('should handle error in deactive action - commented implementation', () => {
        mockUsersService.newUnBlockUserKong.mockReturnValue(throwError('Service error'))
        const event = {
          action: 'deactive',
          row: {
            userId: 'test-user-id',
            active: true,
            role: [{ roleName: 'user' }]
          }
        }

        component.menuActions(event)

        expect(mockSnackBar.open).toHaveBeenCalledWith('Error in Active')
      })

      // Current implementation tests
      it('should handle current block action', () => {
        const mockResponse = { result: { response: 'User blocked successfully' } }
        mockUsersService.blockUser.mockReturnValue(of(mockResponse))
        const event = {
          action: 'block',
          row: {
            userId: 'test-user-id',
            role: ['admin', 'user']
          }
        }

        jest.spyOn(component, 'filterData').mockImplementation(() => { })

        component.menuActions(event)

        expect(mockUsersService.blockUser).toHaveBeenCalledWith({
          request: {
            userId: 'test-user-id',
            requestedBy: 'current-user-id'
          },
          isBlocked: true,
          isDeleted: false,
          roles: ['admin', 'user']
        })
        expect(mockSnackBar.open).toHaveBeenCalledWith('User blocked successfully')
      })
    })

    describe('raiseTabTelemetry', () => {
      it('should call events.handleTabTelemetry', () => {
        const sub = 'test-sub'
        const data = { index: 1, label: 'test' }

        component.raiseTabTelemetry(sub, data)

        expect(mockEvents.handleTabTelemetry).toHaveBeenCalledWith(sub, data)
      })
    })

    describe('getUserRole', () => {
      it('should extract role names from user roleInfo', () => {
        const user = {
          roleInfo: [
            { roleName: 'admin' },
            { roleName: 'user' },
            { roleName: 'moderator' }
          ]
        }

        const result = component.getUserRole(user)

        expect(result).toEqual(['admin', 'user', 'moderator'])
      })
    })

    describe('onEnterkySearch', () => {
      it('should reset pagination and search with new query', () => {
        jest.spyOn(component, 'filterData').mockImplementation(() => { })
        component.pageIndex = 5
        component.currentOffset = 100

        component.onEnterkySearch('test search')

        expect(component.searchQuery).toBe('test search')
        expect(component.currentOffset).toBe(0)
        expect(component.pageIndex).toBe(0)
        expect(component.filterData).toHaveBeenCalledWith('test search')
      })
    })

    describe('onPaginateChange', () => {
      it('should update pagination settings and refetch data', () => {
        jest.spyOn(component, 'filterData').mockImplementation(() => { })
        component.searchQuery = 'current search'

        const event: any = {
          pageIndex: 3,
          pageSize: 50
        }

        component.onPaginateChange(event)

        expect(component.pageIndex).toBe(3)
        expect(component.limit).toBe(50)
        expect(component.filterData).toHaveBeenCalledWith('current search')
      })
    })
  })
})