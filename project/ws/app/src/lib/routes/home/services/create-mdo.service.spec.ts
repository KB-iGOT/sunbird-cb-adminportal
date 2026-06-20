
import { of } from 'rxjs' // Import 'of' to return observable values
import { CreateMDOService } from './create-mdo.services'
const API_END_POINTS = {
  GET_ALL_DEPARTMENTS: '/apis/protected/v8/portal/departmentType/',
  CREATE_DEPARTMENT: '/apis/proxies/v8/org/v1/create',
  UPDATE_DEPARTMENT: '/apis/proxies/v8/org/v1/update',
  ASSIGN_ADMIN_TO_CREATED_DEPARTMENT: '/apis/proxies/v8/user/v1/role/assign',
  GET_DEPARTMENT_BY_ID: '/apis/protected/v8/portal/deptAction/',
  MIGRATE_DEPARTMENT: '/apis/proxies/v8/user/private/v1/migrate',
  GET_ALL_STATES: '/apis/public/v8/org/v1/list',
  GET_DEPARTMENTS_OF_STATE: '/apis/public/v8/org/v1/list',
  GET_ORGS_OF_DEPT: '/apis/public/v8/org/v1/list',
  CREATE_STATE_OR_MINISTRY: '/apis/proxies/v8/org/ext/v1/create',
  UPDATE_STATE_OR_MINISTRY: '/apis/proxies/v8/org/ext/v1/update',
  SEARCH_ORG: '/api/org/ext/v2/signup/search',
  UPDATE_ORGANIZATION: '/apis/proxies/v8/org/ext/v1/update',
  UPLOAD_ORGANIZATION_LOGO: '/apis/proxies/v8/customselfregistration/upload/logo/gcpcontainer',

}

describe('CreateMDOService', () => {
  let service: CreateMDOService
  let httpClientMock: { get: jest.Mock, post: jest.Mock, patch: jest.Mock }

  beforeEach(() => {
    // Mock HttpClient methods
    httpClientMock = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
    }

    // Create an instance of the service with the mocked HttpClient
    service = new CreateMDOService(httpClientMock as any)
  })

  // Test for getAllSubDepartments
  it('should return departments data when getAllSubDepartments is called', () => {
    const deptName = 'TestDept'
    const mockResponse = { data: 'testData' }
    httpClientMock.get.mockReturnValue(of(mockResponse)) // Return the mock response

    service.getAllSubDepartments(deptName).subscribe(response => {
      expect(response).toEqual(mockResponse)
      expect(httpClientMock.get).toHaveBeenCalledWith(`${API_END_POINTS.GET_ALL_DEPARTMENTS}${deptName}`)
    })
  })

  // Test for createDepartment
  it('should call createDepartment and return data', () => {
    const deptData = { name: 'TestDepartment' }
    const deptType = 'typeA'
    const department = 'organization'
    const loggedInUserId = '12345'
    const mockResponse = { success: true }
    httpClientMock.post.mockReturnValue(of(mockResponse))

    service.createDepartment(deptData, deptType, department, loggedInUserId).subscribe(response => {
      expect(response).toEqual(mockResponse)
      expect(httpClientMock.post).toHaveBeenCalledWith(
        API_END_POINTS.CREATE_DEPARTMENT,
        {
          request: {
            orgName: deptData.name,
            channel: deptData.name,
            isTenant: true,
            organisationType: department.toLowerCase(),
            organisationSubType: deptType.toLowerCase(),
            requestedBy: loggedInUserId,
          }
        }
      )
    })
  })

  // Test for updateDepartment
  it('should call updateDepartment and return data', () => {
    const updateId = 1
    const deptType = 'typeA'
    const department = 'organization'
    const loggedInUserId = '12345'
    const deptvalue = { name: 'TestDepartment' }
    const mockResponse = { success: true }
    httpClientMock.patch.mockReturnValue(of(mockResponse))

    service.updateDepartment(updateId, deptType, department, loggedInUserId, deptvalue).subscribe(response => {
      expect(response).toEqual(mockResponse)
      expect(httpClientMock.patch).toHaveBeenCalledWith(
        API_END_POINTS.UPDATE_DEPARTMENT,
        {
          request: {
            orgName: deptvalue.name,
            channel: deptvalue.name,
            organisationId: updateId,
            organisationType: department.toLowerCase(),
            organisationSubType: deptType.toLowerCase(),
            requestedBy: loggedInUserId,
          }
        }
      )
    })
  })

  // Test for assignAdminToDepartment
  it('should assign admin to department and return data', () => {
    const userId = 'user123'
    const deptId = 'dept123'
    const deptRole = 'admin'
    const mockResponse = { success: true }
    httpClientMock.post.mockReturnValue(of(mockResponse))

    service.assignAdminToDepartment(userId, deptId, deptRole).subscribe(response => {
      expect(response).toEqual(mockResponse)
      expect(httpClientMock.post).toHaveBeenCalledWith(
        API_END_POINTS.ASSIGN_ADMIN_TO_CREATED_DEPARTMENT,
        {
          request: {
            userId,
            organisationId: deptId,
            roles: deptRole,
          }
        }
      )
    })
  })

  // Test for migrateDepartment
  it('should migrate department and return data', () => {
    const userId = 'user123'
    const deptName = 'TestDept'
    const mockResponse = { success: true }
    httpClientMock.patch.mockReturnValue(of(mockResponse))

    service.migrateDepartment(userId, deptName).subscribe(response => {
      expect(response).toEqual(mockResponse)
      expect(httpClientMock.patch).toHaveBeenCalledWith(
        API_END_POINTS.MIGRATE_DEPARTMENT,
        {
          request: {
            userId,
            channel: deptName,
            forceMigration: true,
            softDeleteOldOrg: true,
            notifyMigration: false,
          }
        }
      )
    })
  })

  // Test for getStatesOrMinisteries
  it('should return state data when getStatesOrMinisteries is called', () => {
    const type = 'typeA'
    const mockResponse = { data: 'stateData' }
    httpClientMock.get.mockReturnValue(of(mockResponse))

    service.getStatesOrMinisteries(type).subscribe((response: any) => {
      expect(response).toEqual(mockResponse)
      expect(httpClientMock.get).toHaveBeenCalledWith(`${API_END_POINTS.GET_ALL_STATES}/${type}`)
    })
  })

  // Test for searchOrgs
  it('should return org search results when searchOrgs is called', () => {
    const orgName = 'TestOrg'
    const type = 'typeA'
    const mockResponse = { data: 'orgSearchResults' }
    httpClientMock.post.mockReturnValue(of(mockResponse))

    service.searchOrgs(orgName, type).subscribe((response: any) => {
      expect(response).toEqual(mockResponse)
      expect(httpClientMock.post).toHaveBeenCalledWith(API_END_POINTS.SEARCH_ORG, {
        request: {
          filters: {
            orgName,
            parentType: type,
          },
          limit: 500,
        }
      })
    })
  })
})
