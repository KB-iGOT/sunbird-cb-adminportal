
import { HttpClient } from '@angular/common/http'
import { of } from 'rxjs'
import { CreateMDOService } from './create-mdo.services'

describe('CreateMDOService', () => {
  let service: CreateMDOService
  let httpClient: HttpClient

  beforeEach(() => {
    httpClient = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
    } as any

    service = new CreateMDOService(httpClient)
  })

  describe('getAllSubDepartments', () => {
    it('should call HttpClient.get with correct URL', () => {
      const deptName = 'testDept'
      const mockResponse = {}
      jest.spyOn(httpClient, 'get').mockReturnValue(of(mockResponse))

      service.getAllSubDepartments(deptName).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(httpClient.get).toHaveBeenCalledWith('/apis/protected/v8/portal/departmentType/testDept')
    })
  })

  describe('createDepartment', () => {
    it('should call HttpClient.post with correct department data', () => {
      const deptData = { name: 'dept1', head: 'head1', fileUpload: 'file' }
      const subDept = ['subDept1']
      const mockResponse = {}
      jest.spyOn(httpClient, 'post').mockReturnValue(of(mockResponse))

      service.createDepartment(deptData, subDept).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      const expectedPayload = {
        rootOrg: 'igot',
        deptName: deptData.name,
        deptTypeInfos: subDept,
        description: '',
        headquarters: deptData.head,
        logo: deptData.fileUpload,
      }

      expect(httpClient.post).toHaveBeenCalledWith(
        '/apis/protected/v8/portal/spv/department',
        expectedPayload
      )
    })
  })

  describe('updateDepartment', () => {
    it('should call HttpClient.patch with correct department data and updateId', () => {
      const deptData = { name: 'dept1', head: 'head1', fileUpload: 'file' }
      const subDept = ['subDept1']
      const updateId = 123
      const mockResponse = {}
      jest.spyOn(httpClient, 'patch').mockReturnValue(of(mockResponse))

      service.updateDepartment(deptData, updateId, subDept).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      const expectedPayload = {
        id: updateId,
        rootOrg: 'igot',
        deptName: deptData.name,
        deptTypeIds: subDept,
        description: '',
        headquarters: deptData.head,
        logo: deptData.fileUpload,
      }

      expect(httpClient.patch).toHaveBeenCalledWith(
        '/apis/protected/v8/portal/spv/department',
        expectedPayload
      )
    })
  })

  describe('assignAdminToDepartment', () => {
    it('should call HttpClient.post with correct data', () => {
      const userId = 'user1'
      const deptId = 'dept1'
      const deptRole = 'admin'
      const mockResponse = {}
      jest.spyOn(httpClient, 'post').mockReturnValue(of(mockResponse))

      service.assignAdminToDepartment(userId, deptId, deptRole).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      const expectedPayload = {
        request: {
          userId,
          organisationId: deptId,
          roles: [deptRole, 'PUBLIC'],
        },
      }

      expect(httpClient.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/user/v1/role/assign',
        expectedPayload
      )
    })
  })

  describe('generateSelfRegistrationQRCode', () => {
    it('should call HttpClient.post with correct request data', () => {
      const request = { someData: 'test' }
      const mockResponse = {}
      jest.spyOn(httpClient, 'post').mockReturnValue(of(mockResponse))

      service.generateSelfRegistrationQRCode(request).subscribe((response: any) => {
        expect(response).toEqual(mockResponse)
      })

      expect(httpClient.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/customselfregistration',
        request
      )
    })
  })

  describe('getListOfRegisteedLinks', () => {
    it('should call HttpClient.post with correct request data', () => {
      const request = { someData: 'test' }
      const mockResponse = {}
      jest.spyOn(httpClient, 'post').mockReturnValue(of(mockResponse))

      service.getListOfRegisteedLinks(request).subscribe((response: any) => {
        expect(response).toEqual(mockResponse)
      })

      expect(httpClient.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/customselfregistration/listallqrs',
        request
      )
    })
  })
})
