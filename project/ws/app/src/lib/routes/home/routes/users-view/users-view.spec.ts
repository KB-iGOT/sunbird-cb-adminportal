import { of } from 'rxjs'
import { UsersViewComponent } from './users-view.component'

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
    mockDialog = { open: jest.fn() }

    mockRoute = {
      parent: {
        snapshot: {
          data: {
            configService: {
              userProfile: { userId: 'test-user-id' },
              unMappedUser: { rootOrg: { rootOrgId: 'root-org-id', id: 'org-id' } }
            },
            pageData: { data: { tabs: [] } }
          }
        }
      },
      snapshot: {
        parent: {
          data: {
            configService: {
              userProfile: { userId: 'test-user-id' }
            }
          }
        }
      },
      data: {
        subscribe: jest.fn(callback => {
          callback({ profile: { data: [{ id: 'profile-data' }] } })
          return { unsubscribe: jest.fn() }
        })
      }
    }

    mockLoaderService = {
      changeLoad: { next: jest.fn() }
    }

    mockRouter = {
      navigate: jest.fn()
    }

    mockUsersService = {
      getAllKongUsersPaginated: jest.fn(),
      blockUser: jest.fn(),
      newBlockUserKong: jest.fn(),
      newUnBlockUserKong: jest.fn()
    }

    mockConfigSvc = {
      userProfile: { userId: 'test-user-id' },
      unMappedUser: { rootOrg: { rootOrgId: 'root-org-id', id: 'org-id' } }
    }

    mockSnackBar = {
      open: jest.fn()
    }

    mockEvents = {
      handleTabTelemetry: jest.fn()
    }

    mockProfileUtilSvc = {
      emailTransform: jest.fn(email => `transformed-${email}`)
    }

    component = new UsersViewComponent(
      mockDialog,
      mockRoute as any,
      mockLoaderService,
      mockRouter,
      mockUsersService,
      mockConfigSvc,
      mockSnackBar,
      mockEvents,
      mockProfileUtilSvc
    )
  })

  it('should initialize component properly', () => {
    component.ngOnInit()

    expect(component.rootOrgId).toBe('root-org-id')
    expect(component.tabledata).toBeDefined()
    expect(component.tabledata.columns.length).toBe(3)
  })

  describe('filter', () => {
    it('should set filter and reset pagination params', () => {
      // Setup spy on filterData
      const filterDataSpy = jest.spyOn(component, 'filterData')

      // Call filter with 'inactive'
      component.filter('inactive')

      // Check if correct values are set
      expect(component.currentFilter).toBe('inactive')
      expect(component.pageIndex).toBe(0)
      expect(component.currentOffset).toBe(0)
      expect(component.limit).toBe(20)
      expect(component.searchQuery).toBe('')

      // Check if filterData was called with empty string
      expect(filterDataSpy).toHaveBeenCalledWith('')
    })
  })

  describe('filterData', () => {
    it('should call activeUsers when filter is active', () => {
      // Setup spies
      const activeUsersSpy = jest.spyOn(component, 'activeUsers').mockImplementation(() => [])
      const raiseTabTelemetrySpy = jest.spyOn(component, 'raiseTabTelemetry')

      // Set filter and call filterData
      component.currentFilter = 'active'
      component.filterData('search-query')

      // Check if correct methods were called
      expect(raiseTabTelemetrySpy).toHaveBeenCalledWith('active', { index: 1, label: 'active' })
      expect(activeUsersSpy).toHaveBeenCalledWith('search-query')
    })

    it('should call inActiveUsers when filter is inactive', () => {
      // Setup spies
      const inActiveUsersSpy = jest.spyOn(component, 'inActiveUsers').mockImplementation(() => [])
      const raiseTabTelemetrySpy = jest.spyOn(component, 'raiseTabTelemetry')

      // Set filter and call filterData
      component.currentFilter = 'inactive'
      component.filterData('search-query')

      // Check if correct methods were called
      expect(raiseTabTelemetrySpy).toHaveBeenCalledWith('inactive', { index: 2, label: 'inactive' })
      expect(inActiveUsersSpy).toHaveBeenCalledWith('search-query')
    })
  })

  describe('activeUsers', () => {
    it('should fetch active users and process the data', () => {
      // Mock API response
      const mockResponse = {
        result: {
          response: {
            count: 100,
            content: [
              {
                userId: 'user1',
                firstName: 'Test',
                isDeleted: false,
                email: 'test@example.com',
                personalDetails: { primaryEmail: 'primary@example.com' },
                organisations: [
                  {
                    organisationId: 'org-id',
                    roles: ['ROLE1', 'ROLE2']
                  }
                ],
                blocked: false
              }
            ]
          }
        }
      }

      mockUsersService.getAllKongUsersPaginated.mockReturnValue(of(mockResponse))

      // Call activeUsers
      component.activeUsers('')

      // Verify loader was triggered
      expect(mockLoaderService.changeLoad.next).toHaveBeenCalledWith(true)

      // Verify API was called with correct params
      expect(mockUsersService.getAllKongUsersPaginated).toHaveBeenCalledWith(
        'root-org-id',
        1,
        20,
        0,
        ''
      )

      // Verify data processing
      expect(component.userDataTotalCount).toBe(100)
      expect(component.activeUsersData.length).toBe(1)
      expect(component.activeUsersData[0].fullname).toBe('Test')
      expect(component.activeUsersData[0].userId).toBe('user1')
      expect(component.activeUsersData[0].roles).toBe('ROLE1, ROLE2')
    })
  })

  describe('inActiveUsers', () => {
    it('should fetch inactive users and process the data', () => {
      // Mock API response with isDeleted: true
      const mockResponse = {
        result: {
          response: {
            count: 50,
            content: [
              {
                userId: 'inactiveUser',
                firstName: 'Inactive',
                isDeleted: true, // This makes it an inactive user
                email: 'inactive@example.com',
                organisations: [
                  {
                    organisationId: 'org-id',
                    roles: ['VIEWER']
                  }
                ],
                blocked: true
              }
            ]
          }
        }
      }

      mockUsersService.getAllKongUsersPaginated.mockReturnValue(of(mockResponse))

      // Call inActiveUsers
      component.inActiveUsers('')

      // Verify loader was triggered
      expect(mockLoaderService.changeLoad.next).toHaveBeenCalledWith(true)

      // Verify API was called with correct params (0 for inactive status)
      expect(mockUsersService.getAllKongUsersPaginated).toHaveBeenCalledWith(
        'root-org-id',
        0,
        20,
        0,
        ''
      )

      // Verify data processing
      expect(component.userDataTotalCount).toBe(50)
      expect(component.inactiveUsersData.length).toBe(1)
      expect(component.inactiveUsersData[0].fullname).toBe('Inactive')
      expect(component.inactiveUsersData[0].userId).toBe('inactiveUser')
      expect(component.inactiveUsersData[0].active).toBe(false)
    })
  })

  describe('onCreateClick', () => {
    it('should navigate to create-user route', () => {
      component.onCreateClick()
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/create-user'])
    })
  })

  describe('menuActions', () => {
    it('should handle block action', () => {
      // Mock response
      mockUsersService.blockUser.mockReturnValue(of({
        result: { response: 'User blocked successfully' }
      }))

      // Setup test data
      const eventData = {
        action: 'block',
        row: {
          userId: 'user-to-block',
          role: ['ADMIN', 'CONTENT_CREATOR']
        }
      }

      // Call menuActions
      component.menuActions(eventData)

      // Verify loader was triggered
      expect(mockLoaderService.changeLoad.next).toHaveBeenCalledWith(true)

      // Verify blockUser was called with correct params
      expect(mockUsersService.blockUser).toHaveBeenCalledWith(expect.objectContaining({
        request: {
          userId: 'user-to-block',
          requestedBy: 'test-user-id'
        },
        isBlocked: true,
        isDeleted: false,
        roles: ['ADMIN', 'CONTENT_CREATOR']
      }))

      // Verify snackBar was called
      expect(mockSnackBar.open).toHaveBeenCalledWith('User blocked successfully')
    })

    it('should handle deactive action', () => {
      // Mock successful response
      mockUsersService.newBlockUserKong.mockReturnValue(of({
        params: { status: 'SUCCESS' }
      }))

      // Setup test data
      const eventData = {
        action: 'deactive',
        row: {
          userId: 'user-to-deactivate',
          role: ['REVIEWER']
        }
      }

      // Setup timer mock
      jest.useFakeTimers()

      // Call menuActions
      component.menuActions(eventData)

      // Verify newBlockUserKong was called with correct params
      expect(mockUsersService.newBlockUserKong).toHaveBeenCalledWith(
        'test-user-id',
        'user-to-deactivate'
      )

      // Fast-forward timers
      jest.runAllTimers()

      // Verify snackBar was called after timeout
      expect(mockSnackBar.open).toHaveBeenCalledWith('Deactivated successfully!')

      // Restore timers
      jest.useRealTimers()
    })

    it('should handle active action', () => {
      // Mock successful response
      mockUsersService.newUnBlockUserKong.mockReturnValue(of({
        params: { status: 'SUCCESS' }
      }))

      // Setup test data
      const eventData = {
        action: 'active',
        row: {
          userId: 'user-to-activate',
          role: ['USER'],
          blocked: true
        }
      }

      // Setup timer mock
      jest.useFakeTimers()

      // Call menuActions
      component.menuActions(eventData)

      // Verify newUnBlockUserKong was called with correct params
      expect(mockUsersService.newUnBlockUserKong).toHaveBeenCalledWith(
        'test-user-id',
        'user-to-activate'
      )

      // Fast-forward timers
      jest.runAllTimers()

      // Verify snackBar was called after timeout
      expect(mockSnackBar.open).toHaveBeenCalledWith('Activated successfully!')

      // Restore timers
      jest.useRealTimers()
    })

    it('should handle error in active action', () => {
      // Mock failed response
      mockUsersService.newUnBlockUserKong.mockReturnValue(of({
        params: { status: 'FAILURE' }
      }))

      // Setup test data
      const eventData = {
        action: 'active',
        row: {
          userId: 'user-to-activate',
          role: ['USER']
        }
      }

      // Call menuActions
      component.menuActions(eventData)

      // Verify error handling
      expect(mockLoaderService.changeLoad.next).toHaveBeenCalledWith(false)
      expect(mockSnackBar.open).toHaveBeenCalledWith('Update unsuccess!')
    })
  })

  describe('onPaginateChange', () => {
    it('should update pagination params and filter data', () => {
      // Setup spy
      const filterDataSpy = jest.spyOn(component, 'filterData')
      component.searchQuery = 'test-query'

      // Call onPaginateChange
      component.onPaginateChange({ pageIndex: 2, pageSize: 50, length: 100 } as any)

      // Verify pagination params were updated
      expect(component.pageIndex).toBe(2)
      expect(component.limit).toBe(50)

      // Verify filterData was called with current search query
      expect(filterDataSpy).toHaveBeenCalledWith('test-query')
    })
  })

  describe('dataForTable getter', () => {
    it('should return activeUsersData when filter is active', () => {
      component.currentFilter = 'active'
      component.activeUsersData = [{ id: 'active1' }, { id: 'active2' }] as any[]

      expect(component.dataForTable).toEqual(component.activeUsersData)
    })

    it('should return inactiveUsersData when filter is inactive', () => {
      component.currentFilter = 'inactive'
      component.inactiveUsersData = [{ id: 'inactive1' }] as any[]

      expect(component.dataForTable).toEqual(component.inactiveUsersData)
    })

    it('should return empty array for unknown filter', () => {
      component.currentFilter = 'unknown'

      expect(component.dataForTable).toEqual([])
    })
  })

  describe('onEnterkySearch', () => {
    it('should set search query, reset pagination and filter data', () => {
      // Setup spy
      const filterDataSpy = jest.spyOn(component, 'filterData')

      // Call onEnterkySearch
      component.onEnterkySearch('search-term')

      // Verify search params were updated
      expect(component.searchQuery).toBe('search-term')
      expect(component.currentOffset).toBe(0)
      expect(component.pageIndex).toBe(0)

      // Verify filterData was called with search term
      expect(filterDataSpy).toHaveBeenCalledWith('search-term')
    })
  })
})