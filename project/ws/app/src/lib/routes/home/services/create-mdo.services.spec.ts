import { of } from 'rxjs'
import { CreateMDOService } from './create-mdo.services'

describe('CreateMDOService', () => {
  let service: CreateMDOService
  let mockHttp: { get: jest.Mock; post: jest.Mock; patch: jest.Mock }

  beforeEach(() => {
    mockHttp = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
    }
    service = new CreateMDOService(mockHttp as any)
  })

  it('should create the service', () => {
    expect(service).toBeTruthy()
  })

  it('should initialize searchedUserdata BehaviorSubject with filteredData', () => {
    let value: any
    service.searchedUserdata.subscribe(v => (value = v))
    expect(value).toEqual({ filteredData: [] })
  })

  it('should initialize adminButton BehaviorSubject with false', () => {
    let value: any
    service.adminButton.subscribe(v => (value = v))
    expect(value).toBe(false)
  })

  describe('getAllSubDepartments', () => {
    it('should call http.get with correct URL', () => {
      mockHttp.get.mockReturnValue(of([]))
      service.getAllSubDepartments('state').subscribe()
      expect(mockHttp.get).toHaveBeenCalledWith('/apis/protected/v8/portal/departmentType/state')
    })
  })

  describe('createDepartment', () => {
    it('should call http.post with correct payload', () => {
      mockHttp.post.mockReturnValue(of({ result: {} }))
      service.createDepartment({ name: 'Test Dept' }, 'ministry', 'state', 'user-1').subscribe()
      expect(mockHttp.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/org/v1/create',
        expect.objectContaining({
          request: expect.objectContaining({
            orgName: 'Test Dept',
            channel: 'Test Dept',
            isTenant: true,
          }),
        })
      )
    })
  })

  describe('updateDepartment', () => {
    it('should call http.patch with correct payload', () => {
      mockHttp.patch.mockReturnValue(of({ result: {} }))
      service.updateDepartment(1 as any, 'ministry', 'state', 'user-1', { name: 'Updated Dept' }).subscribe()
      expect(mockHttp.patch).toHaveBeenCalledWith(
        '/apis/proxies/v8/org/v1/update',
        expect.objectContaining({
          request: expect.objectContaining({
            orgName: 'Updated Dept',
            organisationId: 1,
          }),
        })
      )
    })
  })

  describe('assignAdminToDepartment', () => {
    it('should call http.post with userId, deptId, and roles', () => {
      mockHttp.post.mockReturnValue(of({ result: {} }))
      service.assignAdminToDepartment('user-1', 'dept-1', ['ADMIN']).subscribe()
      expect(mockHttp.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/user/private/v1/assign/role',
        expect.objectContaining({
          request: expect.objectContaining({
            userId: 'user-1',
            organisationId: 'dept-1',
            roles: ['ADMIN'],
          }),
        })
      )
    })
  })

  describe('migrateDepartment', () => {
    it('should call http.patch with correct migrate payload', () => {
      mockHttp.patch.mockReturnValue(of({ result: {} }))
      service.migrateDepartment('user-1', 'org-channel').subscribe()
      expect(mockHttp.patch).toHaveBeenCalledWith(
        '/apis/proxies/v8/user/private/v1/migrate',
        expect.objectContaining({
          request: expect.objectContaining({
            userId: 'user-1',
            channel: 'org-channel',
            forceMigration: true,
            softDeleteOldOrg: true,
            notifyMigration: false,
          }),
        })
      )
    })
  })

  describe('getStatesOrMinisteries', () => {
    it('should call http.get with type in URL', () => {
      mockHttp.get.mockReturnValue(of([]))
      service.getStatesOrMinisteries('state').subscribe()
      expect(mockHttp.get).toHaveBeenCalledWith('/apis/public/v8/org/v1/list/state')
    })
  })

  describe('getDeparmentsOfState', () => {
    it('should call http.get with stateId in URL', () => {
      mockHttp.get.mockReturnValue(of([]))
      service.getDeparmentsOfState('state-123').subscribe()
      expect(mockHttp.get).toHaveBeenCalledWith('/apis/public/v8/org/v1/list/state-123')
    })
  })

  describe('getOrgsOfDepartment', () => {
    it('should call http.get with deptId in URL', () => {
      mockHttp.get.mockReturnValue(of([]))
      service.getOrgsOfDepartment('dept-456').subscribe()
      expect(mockHttp.get).toHaveBeenCalledWith('/apis/public/v8/org/v1/list/dept-456')
    })
  })

  describe('createStateOrMinistry', () => {
    it('should call http.post with wrapped request', () => {
      mockHttp.post.mockReturnValue(of({ result: {} }))
      const req = { name: 'New State' }
      service.createStateOrMinistry(req).subscribe()
      expect(mockHttp.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/org/ext/v1/create',
        { request: req }
      )
    })
  })

  describe('updateStateOrMinistry', () => {
    it('should call http.post with wrapped request', () => {
      mockHttp.post.mockReturnValue(of({ result: {} }))
      const req = { name: 'Updated State' }
      service.updateStateOrMinistry(req).subscribe()
      expect(mockHttp.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/org/ext/v1/update',
        { request: req }
      )
    })
  })

  describe('createOrganization', () => {
    it('should call http.post with request object', () => {
      mockHttp.post.mockReturnValue(of({ result: {} }))
      const req = { orgName: 'New Org' }
      service.createOrganization(req)
      expect(mockHttp.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/org/ext/v1/create',
        { request: req }
      )
    })
  })

  describe('searchOrgs', () => {
    it('should call http.post with orgName and type filters', () => {
      mockHttp.post.mockReturnValue(of({ result: {} }))
      service.searchOrgs('Test Org', 'state').subscribe()
      expect(mockHttp.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/org/v1/search',
        expect.objectContaining({
          request: expect.objectContaining({
            filters: { orgName: 'Test Org', parentType: 'state' },
            limit: 500,
          }),
        })
      )
    })
  })

  describe('signUpSearch', () => {
    it('should call http.post with identifier filter', () => {
      mockHttp.post.mockReturnValue(of({ result: {} }))
      service.signUpSearch('org-id-123').subscribe()
      expect(mockHttp.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/org/v1/search',
        expect.objectContaining({
          request: expect.objectContaining({
            filters: { identifier: 'org-id-123' },
          }),
        })
      )
    })
  })

  describe('updateOrganization', () => {
    it('should call http.patch with the request', () => {
      mockHttp.patch.mockReturnValue(of({ result: {} }))
      const req = { orgName: 'Updated Org' }
      service.updateOrganization(req).subscribe()
      expect(mockHttp.patch).toHaveBeenCalledWith(
        '/apis/proxies/v8/org/ext/v1/update',
        req
      )
    })
  })

  describe('updateOrganizationV2', () => {
    it('should call http.patch with v2 endpoint', () => {
      mockHttp.patch.mockReturnValue(of({ result: {} }))
      const req = { orgName: 'V2 Org' }
      service.updateOrganizationV2(req).subscribe()
      expect(mockHttp.patch).toHaveBeenCalledWith(
        '/apis/proxies/v8/org/ext/v2/update',
        req
      )
    })
  })

  describe('uploadOrganizationLogo', () => {
    it('should call http.post with payload to logo upload endpoint', () => {
      mockHttp.post.mockReturnValue(of({ result: {} }))
      const payload = new FormData()
      service.uploadOrganizationLogo(payload).subscribe()
      expect(mockHttp.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/customselfregistration/upload/logo/gcpcontainer',
        payload
      )
    })
  })
})
