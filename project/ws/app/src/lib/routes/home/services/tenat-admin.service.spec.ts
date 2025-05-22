import { TenantAdminService } from './tenant-admin.service'
import { HttpClient } from '@angular/common/http'
import { of } from 'rxjs'

// Mock the HttpClient
const mockHttpClient = {
  get: jest.fn(),
  post: jest.fn(),
}

describe('TenantAdminService', () => {
  let service: TenantAdminService
  let httpClient: jest.Mocked<HttpClient>

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()

    // Cast mockHttpClient to the proper type
    httpClient = mockHttpClient as unknown as jest.Mocked<HttpClient>

    // Create service instance with mocked HttpClient
    service = new TenantAdminService(httpClient)
  })

  describe('fetchJson', () => {
    it('should fetch JSON data from the provided URL', async () => {
      const mockJsonData = { key: 'value' }
      const jsonUrl = 'https://example.com/data.json'

      httpClient.get.mockReturnValue({
        toPromise: jest.fn().mockResolvedValue(mockJsonData)
      } as any)

      const result = await service.fetchJson(jsonUrl)

      expect(httpClient.get).toHaveBeenCalledWith(jsonUrl)
      expect(result).toEqual(mockJsonData)
    })
  })

  describe('getAllSources', () => {
    it('should fetch all sources', async () => {
      const mockSources = [{ id: 1, name: 'Source 1' }]

      httpClient.get.mockReturnValue({
        toPromise: jest.fn().mockResolvedValue(mockSources)
      } as any)

      const result = await service.getAllSources()

      expect(httpClient.get).toHaveBeenCalledWith('/apis/protected/v8/admin/userRegistration/getAllSources')
      expect(result).toEqual(mockSources)
    })
  })

  describe('registerUsers', () => {
    it('should register users with provided data', async () => {
      const userData = { users: ['user1', 'user2'] }
      const mockResponse = { success: true }

      httpClient.post.mockReturnValue({
        toPromise: jest.fn().mockResolvedValue(mockResponse)
      } as any)

      const result = await service.registerUsers(userData)

      expect(httpClient.post).toHaveBeenCalledWith('/apis/protected/v8/admin/userRegistration/register', userData)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('createUser', () => {
    it('should create user and return result from response', (done) => {
      const userData = { name: 'John Doe', email: 'john@example.com' }
      const mockResponse = { result: { userId: 123 } }

      httpClient.post.mockReturnValue(of(mockResponse))

      service.createUser(userData).subscribe(result => {
        expect(httpClient.post).toHaveBeenCalledWith('/apis/protected/v8/admin/userRegistration/create-user', userData)
        expect(result).toEqual(mockResponse.result)
        done()
      })
    })
  })

  describe('getOrdinals', () => {
    it('should fetch ordinals with rootOrg and org parameters', async () => {
      const rootOrg = 'root-org'
      const org = ['org1', 'org2']
      const mockResponse = { ordinals: [] }

      httpClient.get.mockReturnValue({
        toPromise: jest.fn().mockResolvedValue(mockResponse)
      } as any)

      const result = await service.getOrdinals(rootOrg, org)

      expect(httpClient.get).toHaveBeenCalledWith(`/apis/authApi/action/meta/v2/ordinals/list?rootOrg=${rootOrg}&org=${org}`)
      expect(result).toEqual(mockResponse)
    })

    it('should handle null parameters', async () => {
      const mockResponse = { ordinals: [] }

      httpClient.get.mockReturnValue({
        toPromise: jest.fn().mockResolvedValue(mockResponse)
      } as any)

      const result = await service.getOrdinals(null, null)

      expect(httpClient.get).toHaveBeenCalledWith('/apis/authApi/action/meta/v2/ordinals/list?rootOrg=null&org=null')
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getAcessPaths', () => {
    it('should get access paths for given wid', (done) => {
      const wid = 'user123'
      const mockResponse = { accessPaths: [] }

      httpClient.post.mockReturnValue(of(mockResponse))

      service.getAcessPaths(wid).subscribe(result => {
        expect(httpClient.post).toHaveBeenCalledWith('/apis/protected/v8/admin/userRegistration/user/access-path', { wid })
        expect(result).toEqual(mockResponse)
        done()
      })
    })
  })

  describe('getBulkUploadData', () => {
    it('should fetch bulk upload data', async () => {
      const mockData = { uploadData: [] }

      httpClient.get.mockReturnValue({
        toPromise: jest.fn().mockResolvedValue(mockData)
      } as any)

      const result = await service.getBulkUploadData()

      expect(httpClient.get).toHaveBeenCalledWith('/apis/protected/v8/admin/userRegistration/bulkUploadData')
      expect(result).toEqual(mockData)
    })
  })

  describe('updateAccessPaths', () => {
    it('should update access paths and return result from response', (done) => {
      const updateData = { wid: 'user123', paths: ['path1', 'path2'] }
      const mockResponse = { result: { success: true } }

      httpClient.post.mockReturnValue(of(mockResponse))

      service.updateAccessPaths(updateData).subscribe(result => {
        expect(httpClient.post).toHaveBeenCalledWith('/apis/protected/v8/admin/userRegistration/user/update-access-path', updateData)
        expect(result).toEqual(mockResponse.result)
        done()
      })
    })
  })

  describe('getUserDepartments', () => {
    it('should fetch user departments', async () => {
      const mockDepartments = [{ id: 1, name: 'IT' }]

      httpClient.get.mockReturnValue({
        toPromise: jest.fn().mockResolvedValue(mockDepartments)
      } as any)

      const result = await service.getUserDepartments()

      expect(httpClient.get).toHaveBeenCalledWith('/apis/protected/v8/admin/userRegistration/user/department')
      expect(result).toEqual(mockDepartments)
    })
  })

  describe('updateUserDepartment', () => {
    it('should update user department and return result from response', (done) => {
      const updateData = { userId: 123, departmentId: 456 }
      const mockResponse = { result: { updated: true } }

      httpClient.post.mockReturnValue(of(mockResponse))

      service.updateUserDepartment(updateData).subscribe(result => {
        expect(httpClient.post).toHaveBeenCalledWith('/apis/protected/v8/admin/userRegistration/user/department/update', updateData)
        expect(result).toEqual(mockResponse.result)
        done()
      })
    })
  })

  describe('Error handling', () => {
    it('should handle errors in async methods', async () => {
      const error = new Error('Network error')

      httpClient.get.mockReturnValue({
        toPromise: jest.fn().mockRejectedValue(error)
      } as any)

      await expect(service.getAllSources()).rejects.toThrow('Network error')
    })

    it('should handle errors in Observable methods', (done) => {
      const error = new Error('Observable error')

      httpClient.post.mockReturnValue(of().pipe(() => {
        throw error
      }))

      service.createUser({}).subscribe({
        next: () => fail('Should not emit success'),
        error: (err) => {
          expect(err).toEqual(error)
          done()
        }
      })
    })
  })
})