
import { HttpClient } from '@angular/common/http'
import { CreateMDOService } from './create-mdo.services'

describe('CreateMDOService', () => {
  let service: CreateMDOService
  let httpClientMock: jest.Mocked<HttpClient>

  beforeEach(() => {
    // Mocking the HttpClient
    httpClientMock = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
    } as unknown as jest.Mocked<HttpClient>

    // Instantiating the service with the mocked HttpClient
    service = new CreateMDOService(httpClientMock)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should call getAllSubDepartments and return data', () => {
    const deptName = 'departmentName'
    const expectedResponse = { data: 'response' }

    // httpClientMock.get.mockResolvedValue(expectedResponse)

    service.getAllSubDepartments(deptName).subscribe(response => {
      expect(response).toEqual(expectedResponse)
    })

    // Verify that the HttpClient get method was called with the correct URL
    expect(httpClientMock.get).toHaveBeenCalledWith(`/apis/protected/v8/portal/departmentType/${deptName}`)
  })

  it('should call createDepartment and return response', () => {
    const deptData = { name: 'Test Department' }
    const deptType = 'type'
    const depatment = 'dept'
    const loggedInUserId = '123'
    const expectedResponse = { success: true }

    // httpClientMock.post.mockResolvedValue(expectedResponse)

    service.createDepartment(deptData, deptType, depatment, loggedInUserId).subscribe(response => {
      expect(response).toEqual(expectedResponse)
    })

    // Verify that the HttpClient post method was called with the correct URL and data
    expect(httpClientMock.post).toHaveBeenCalledWith(
      '/apis/proxies/v8/org/v1/create',
      expect.objectContaining({
        request: expect.objectContaining({
          orgName: deptData.name,
          channel: deptData.name,
          organisationType: depatment.toLowerCase(),
          organisationSubType: deptType.toLowerCase(),
          requestedBy: loggedInUserId,
        }),
      })
    )
  })

  it('should call updateDepartment and return response', () => {
    const updateId = 1
    const deptType = 'type'
    const depatment = 'dept'
    const loggedInUserId = '123'
    const deptValue = { name: 'Updated Dept' }
    const expectedResponse = { success: true }

    // httpClientMock.patch.mockResolvedValue(expectedResponse)

    service.updateDepartment(updateId, deptType, depatment, loggedInUserId, deptValue).subscribe(response => {
      expect(response).toEqual(expectedResponse)
    })

    expect(httpClientMock.patch).toHaveBeenCalledWith(
      '/apis/proxies/v8/org/v1/update',
      expect.objectContaining({
        request: expect.objectContaining({
          orgName: deptValue.name,
          channel: deptValue.name,
          organisationId: updateId,
          organisationType: depatment.toLowerCase(),
          organisationSubType: deptType.toLowerCase(),
          requestedBy: loggedInUserId,
        }),
      })
    )
  })

  it('should call assignAdminToDepartment and return response', () => {
    const userId = 'user123'
    const deptId = 'dept123'
    const deptRole = { role: 'admin' }
    const expectedResponse = { success: true }

    //httpClientMock.post.mockResolvedValue(expectedResponse)

    service.assignAdminToDepartment(userId, deptId, deptRole).subscribe(response => {
      expect(response).toEqual(expectedResponse)
    })

    expect(httpClientMock.post).toHaveBeenCalledWith(
      '/apis/proxies/v8/user/private/v1/assign/role',
      expect.objectContaining({
        request: expect.objectContaining({
          userId,
          organisationId: deptId,
          roles: deptRole,
        }),
      })
    )
  })

  it('should call migrateDepartment and return response', () => {
    const userId = 'user123'
    const deptName = 'deptName'
    const expectedResponse = { success: true }

    // httpClientMock.patch.mockResolvedValue(expectedResponse)

    service.migrateDepartment(userId, deptName).subscribe(response => {
      expect(response).toEqual(expectedResponse)
    })

    expect(httpClientMock.patch).toHaveBeenCalledWith(
      '/apis/proxies/v8/user/private/v1/migrate',
      expect.objectContaining({
        request: expect.objectContaining({
          userId,
          channel: deptName,
          forceMigration: true,
          softDeleteOldOrg: true,
          notifyMigration: false,
        }),
      })
    )
  })
})
