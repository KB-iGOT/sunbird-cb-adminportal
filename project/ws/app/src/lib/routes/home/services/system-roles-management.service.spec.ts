import { of } from 'rxjs'
import { SystemRolesManagementService } from './system-roles-management.service'

describe('SystemRolesManagementService', () => {
  let service: SystemRolesManagementService

  const http: any = {
    get: jest.fn(),
    post: jest.fn(),
  }

  beforeEach(() => {
    service = new SystemRolesManagementService(http)
    jest.clearAllMocks()
  })

  it('should create an instance', () => {
    expect(service).toBeTruthy()
  })

  it('should call checkUser with correct endpoint', (done) => {
    const wid = 'user-123'
    const mockResponse = { default_roles: ['PUBLIC'], user_roles: ['ADMIN'] }
    http.get.mockReturnValue(of(mockResponse))

    service.checkUser(wid).subscribe(res => {
      expect(res).toEqual(mockResponse)
      done()
    })

    expect(http.get).toHaveBeenCalledWith(
      `/apis/protected/v8/user/roles/getRolesV2/${wid}`
    )
  })

  it('should build checkUser URL with given wid', (done) => {
    const wid = 'abc-456'
    http.get.mockReturnValue(of({}))

    service.checkUser(wid).subscribe(() => done())

    expect(http.get).toHaveBeenCalledWith(
      '/apis/protected/v8/user/roles/getRolesV2/abc-456'
    )
  })

  it('should call manageUser with correct endpoint and data', async () => {
    const data: any = { userId: 'user-123', roles: ['MDO_ADMIN'] }
    const promiseMock = Promise.resolve({ success: true })
    http.post.mockReturnValue({ toPromise: () => promiseMock })

    const result = await service.manageUser(data)

    expect(http.post).toHaveBeenCalledWith(
      '/apis/protected/v8/user/roles/updateRolesV2',
      data
    )
    expect(result).toEqual({ success: true })
  })

  it('should return observable from checkUser', () => {
    http.get.mockReturnValue(of({ default_roles: [], user_roles: [] }))
    const result = service.checkUser('wid-1')
    expect(result).toBeDefined()
    expect(typeof result.subscribe).toBe('function')
  })
})
