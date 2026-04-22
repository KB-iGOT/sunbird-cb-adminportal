import { of } from 'rxjs'
import { RolesService } from './roles.service'

describe('RolesService', () => {
  let service: RolesService
  let mockHttp: { get: jest.Mock }

  beforeEach(() => {
    mockHttp = { get: jest.fn() }
    service = new RolesService(mockHttp as any)
  })

  it('should create the service', () => {
    expect(service).toBeTruthy()
  })

  describe('getAllRoles', () => {
    it('should call http.get with the correct endpoint', () => {
      const mockResponse = { result: { roles: [] } }
      mockHttp.get.mockReturnValue(of(mockResponse))

      service.getAllRoles().subscribe(result => {
        expect(result).toEqual(mockResponse)
      })

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/apis/proxies/v8/data/v1/system/settings/get/orgTypeList'
      )
    })

    it('should return observable from http.get', () => {
      const mockData = [{ roleId: 'r1', roleName: 'Admin' }]
      mockHttp.get.mockReturnValue(of(mockData))

      let result: any
      service.getAllRoles().subscribe(data => (result = data))
      expect(result).toEqual(mockData)
    })
  })
})
