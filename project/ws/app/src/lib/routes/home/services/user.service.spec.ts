import { UsersService } from './users.service'
import { HttpClient } from '@angular/common/http'
import { of } from 'rxjs'
import * as _ from 'lodash'

// Mock HttpClient
const httpClientMock = {
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn()
}

// Mock response data
const mockUsers = {
  result: {
    response: [
      { id: 'user1', name: 'User One' },
      { id: 'user2', name: 'User Two' }
    ]
  }
}

const mockDepartments = {
  departments: [
    { id: 'dept1', name: 'Department One' },
    { id: 'dept2', name: 'Department Two' }
  ]
}

describe('UsersService', () => {
  let service: UsersService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new UsersService(httpClientMock as unknown as HttpClient)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('getUsersByDepartment', () => {
    it('should fetch users by department id', () => {
      const userId = 'dept1'
      const mockResponse = { users: [] }
      httpClientMock.get.mockReturnValue(of(mockResponse))

      service.getUsersByDepartment(userId).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(httpClientMock.get).toHaveBeenCalledWith(`/apis/protected/v8/portal/spv/department/${userId}/?allUsers=true`)
    })
  })

  describe('getAllUsers', () => {
    it('should fetch all users', () => {
      const mockResponse = { users: [] }
      httpClientMock.get.mockReturnValue(of(mockResponse))

      service.getAllUsers().subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(httpClientMock.get).toHaveBeenCalledWith('/apis/protected/v8/portal/spv/mydepartment?allUsers=true')
    })
  })

  describe('getAllKongUsersPaginated', () => {
    it('should fetch paginated kong users with default parameters', () => {
      const depId = 'dept1'
      const userStatus = 1
      const mockResponse = { result: { response: [] } }
      httpClientMock.post.mockReturnValue(of(mockResponse))

      service.getAllKongUsersPaginated(depId, userStatus).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(httpClientMock.post).toHaveBeenCalledWith('/apis/proxies/v8/user/v1/search', {
        request: {
          filters: {
            rootOrgId: depId,
            status: userStatus,
          },
          sort_by: {
            createdDate: "desc",
          },
          limit: 20,
          offset: 0,
          query: undefined,
        },
      })
    })

    it('should fetch paginated kong users with custom parameters', () => {
      const depId = 'dept1'
      const userStatus = 1
      const pageLimit = 10
      const offsetNum = 5
      const searchText = 'test'
      const mockResponse = { result: { response: [] } }
      httpClientMock.post.mockReturnValue(of(mockResponse))

      service.getAllKongUsersPaginated(depId, userStatus, pageLimit, offsetNum, searchText).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(httpClientMock.post).toHaveBeenCalledWith('/apis/proxies/v8/user/v1/search', {
        request: {
          filters: {
            rootOrgId: depId,
            status: userStatus,
          },
          sort_by: {
            createdDate: "desc",
          },
          limit: pageLimit,
          offset: offsetNum,
          query: searchText,
        },
      })
    })
  })

  describe('getAllKongUsers', () => {
    it('should fetch all kong users', () => {
      const depId = 'dept1'
      const mockResponse = { result: { response: [] } }
      httpClientMock.post.mockReturnValue(of(mockResponse))

      service.getAllKongUsers(depId).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(httpClientMock.post).toHaveBeenCalledWith('/apis/proxies/v8/user/v1/search', {
        request: {
          filters: {
            rootOrgId: depId,
          },
        },
      })
    })
  })

  describe('getAllRoleUsers', () => {
    it('should fetch all users with specific role', () => {
      const depId = 'dept1'
      const role = 'ADMIN'
      const responseData = { result: { response: [{ id: 'user1' }] } }
      httpClientMock.post.mockReturnValue(of(responseData))

      service.getAllRoleUsers(depId, role).subscribe(response => {
        expect(response).toEqual({ role, count: responseData.result.response })
      })

      expect(httpClientMock.post).toHaveBeenCalledWith('/apis/proxies/v8/user/v1/search', {
        request: {
          filters: {
            rootOrgId: depId,
            status: 1,
            'organisations.roles': [role],
          },
        },
      })
    })
  })

  describe('getAllDepartments', () => {
    it('should fetch all departments', () => {
      httpClientMock.get.mockReturnValue(of(mockDepartments))

      service.getAllDepartments().subscribe(response => {
        expect(response).toEqual(mockDepartments)
      })

      expect(httpClientMock.get).toHaveBeenCalledWith('/apis/protected/v8/portal/spv/department')
    })
  })

  describe('getMyDepartment', () => {
    it('should fetch my department', () => {
      const mockResponse = { department: {} }
      httpClientMock.get.mockReturnValue(of(mockResponse))

      service.getMyDepartment().subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(httpClientMock.get).toHaveBeenCalledWith('/apis/protected/v8/portal/spv/mydepartment?allUsers=true')
    })
  })

  describe('createUser', () => {
    it('should create a new user', () => {
      const userReq = { name: 'New User', email: 'test@example.com' }
      const mockResponse = { id: 'newuser123' }
      httpClientMock.post.mockReturnValue(of(mockResponse))

      service.createUser(userReq).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(httpClientMock.post).toHaveBeenCalledWith('/apis/protected/v8/user/profileDetails/createUser', userReq)
    })
  })

  describe('searchMDOLeaders', () => {
    it('should search for MDO leaders', () => {
      const orgId = 'org1'
      const mockResponse = { result: { response: [] } }
      httpClientMock.post.mockReturnValue(of(mockResponse))

      service.searchMDOLeaders(orgId).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(httpClientMock.post).toHaveBeenCalledWith('/apis/proxies/v8/user/v1/search', {
        request: {
          filters: {
            status: 1,
            rootOrgId: orgId,
            'organisations.roles': ['MDO_LEADER'],
          },
          limit: 0,
          fields: [],
        },
      })
    })
  })

  describe('getUserById', () => {
    it('should fetch user by id', () => {
      const userId = 'user1'
      const mockResponse = { user: {} }
      httpClientMock.get.mockReturnValue(of(mockResponse))

      service.getUserById(userId).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(httpClientMock.get).toHaveBeenCalledWith('apis/protected/v8/user/profileRegistry/getUserRegistryByUser/user1')
    })
  })

  describe('createUserById', () => {
    it('should create user by id', () => {
      const userId = 'user1'
      const userReq = { name: 'Test User' }
      const mockResponse = { success: true }
      httpClientMock.post.mockReturnValue(of(mockResponse))

      service.createUserById(userId, userReq).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(httpClientMock.post).toHaveBeenCalledWith('apis/protected/v8/user/profileRegistry/createUserRegistryV2/user1', userReq)
    })
  })

  describe('addUserToDepartment', () => {
    it('should add user to department', () => {
      const reqBody = { userId: 'user1', deptId: 'dept1' }
      const mockResponse = { success: true }
      httpClientMock.post.mockReturnValue(of(mockResponse))

      service.addUserToDepartment(reqBody).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(httpClientMock.post).toHaveBeenCalledWith('/apis/protected/v8/portal/spv/deptAction/userrole', reqBody)
    })
  })

  describe('getWfHistoryByAppId', () => {
    it('should get workflow history by application id', () => {
      const appId = 'app1'
      const mockResponse = { history: [] }
      httpClientMock.get.mockReturnValue(of(mockResponse))

      service.getWfHistoryByAppId(appId).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(httpClientMock.get).toHaveBeenCalledWith('apis/protected/v8/workflowhandler/historyByApplicationId/app1')
    })
  })

  describe('onSearchUserByEmail', () => {
    it('should search user by email', () => {
      const email = 'test@example.com'
      const mockResponse = { users: [] }
      httpClientMock.get.mockReturnValue(of(mockResponse))

      service.onSearchUserByEmail(email).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(httpClientMock.get).toHaveBeenCalledWith('apis/protected/v8/user/autocomplete/test@example.com')
    })
  })

  describe('blockUser', () => {
    it('should block a user', () => {
      const userObj = { userId: 'user1', action: 'block' }
      const mockResponse = { success: true }
      httpClientMock.patch.mockReturnValue(of(mockResponse))

      service.blockUser(userObj).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(httpClientMock.patch).toHaveBeenCalledWith('/apis/protected/v8/portal/spv/deptAction/userrole/', userObj)
    })
  })

  describe('deActiveUser', () => {
    it('should deactivate a user', () => {
      const userObj = { userId: 'user1', action: 'deactivate' }
      const mockResponse = { success: true }
      httpClientMock.patch.mockReturnValue(of(mockResponse))

      service.deActiveUser(userObj).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(httpClientMock.patch).toHaveBeenCalledWith('/apis/protected/v8/portal/spv/deptAction/userrole/', userObj)
    })
  })

  describe('deleteUser', () => {
    it('should delete a user', () => {
      const userObj = { userId: 'user1', action: 'delete' }
      const mockResponse = { success: true }
      httpClientMock.patch.mockReturnValue(of(mockResponse))

      service.deleteUser(userObj).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(httpClientMock.patch).toHaveBeenCalledWith('/apis/protected/v8/portal/spv/deptAction/userrole/', userObj)
    })
  })

  describe('getAllDepartmentsKong', () => {
    it('should get all departments kong', () => {
      const orgId = 'org1'
      const mockResponse = { result: { response: [] } }
      httpClientMock.post.mockReturnValue(of(mockResponse))

      service.getAllDepartmentsKong(orgId).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(httpClientMock.post).toHaveBeenCalledWith('/apis/proxies/v8/org/v1/read', {
        request: {
          organisationId: orgId,
        },
      })
    })
  })

  describe('newBlockUserKong', () => {
    it('should block user with kong', () => {
      const loggedInUser = 'admin'
      const userId = 'user1'
      const mockResponse = { result: { response: 'success' } }
      httpClientMock.post.mockReturnValue(of(mockResponse))

      service.newBlockUserKong(loggedInUser, userId).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(httpClientMock.post).toHaveBeenCalledWith('/apis/proxies/v8/user/v1/block', {
        request: {
          userId,
          requestedBy: loggedInUser,
        },
      })
    })
  })

  describe('newUnBlockUserKong', () => {
    it('should unblock user with kong', () => {
      const loggedInUser = 'admin'
      const userId = 'user1'
      const mockResponse = { result: { response: 'success' } }
      httpClientMock.post.mockReturnValue(of(mockResponse))

      service.newUnBlockUserKong(loggedInUser, userId).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(httpClientMock.post).toHaveBeenCalledWith('/apis/proxies/v8/user/v1/unblock', {
        request: {
          userId,
          requestedBy: loggedInUser,
        },
      })
    })
  })

  describe('searchUserByenter', () => {
    it('should search user by enter', () => {
      const searchValue = 'test'
      const rootOrgId = 'org1'
      const mockResponse = { result: { response: [] } }
      httpClientMock.post.mockReturnValue(of(mockResponse))

      service.searchUserByenter(searchValue, rootOrgId).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(httpClientMock.post).toHaveBeenCalledWith('/apis/proxies/v8/user/v1/search', {
        request: {
          query: searchValue,
          filters: {
            rootOrgId,
          },
        },
      })
    })
  })

  describe('getAllValidUsers', () => {
    it('should get all valid users', () => {
      const filter = { status: 'active' }
      httpClientMock.post.mockReturnValue(of(mockUsers))

      service.getAllValidUsers(filter).subscribe(response => {
        expect(response).toEqual(mockUsers.result.response)
      })

      expect(httpClientMock.post).toHaveBeenCalledWith('/apis/protected/v8/portal/spv/mydepartment?allUsers=true', filter)
    })
  })

  describe('getAllUsersV3', () => {
    it('should get all users v3', () => {
      const filter = { status: 'active' }
      httpClientMock.post.mockReturnValue(of(mockUsers))

      service.getAllUsersV3(filter).subscribe(response => {
        expect(response).toEqual(mockUsers.result.response)
      })

      expect(httpClientMock.post).toHaveBeenCalledWith('/apis/proxies/v8/user/v3/search', filter)
    })
  })

  describe('addUserToDepartmentMentor', () => {
    it('should add user to department as mentor', () => {
      const reqBody = { userId: 'user1', role: 'MENTOR' }
      const mockResponse = { success: true }
      httpClientMock.post.mockReturnValue(of(mockResponse))

      service.addUserToDepartmentMentor(reqBody).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(httpClientMock.post).toHaveBeenCalledWith('/apis/proxies/v8/user/private/v1/assign/role', reqBody)
    })
  })
})