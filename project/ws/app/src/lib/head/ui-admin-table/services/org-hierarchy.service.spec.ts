import { HttpClient } from '@angular/common/http'
import { of } from 'rxjs'
import { OrgHierarchyService } from './org-hierarchy.service'

describe('OrgHierarchyService', () => {
  let service: OrgHierarchyService
  let mockHttp: jest.Mocked<Partial<HttpClient>>

  beforeEach(() => {
    mockHttp = {
      get: jest.fn(),
      post: jest.fn(),
    }
    service = new OrgHierarchyService(mockHttp as HttpClient)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should create an instance of the service', () => {
    expect(service).toBeTruthy()
  })

  describe('getCenterOrStateList', () => {
    it('should call POST with org search endpoint and request body', () => {
      const request = { filters: { type: 'State' } }
        ; (mockHttp.post as jest.Mock).mockReturnValue(of([]))
      service.getCenterOrStateList(request)
      expect(mockHttp.post).toHaveBeenCalledWith('/apis/proxies/v8/org/v1/search', request)
    })
  })

  describe('createMasterFrameWork', () => {
    it('should call POST with correct URL including frameworkName and orgId', () => {
      const request = { frameworkName: 'TestFW', identifier: 'org-123' }
        ; (mockHttp.post as jest.Mock).mockReturnValue(of({}))
      service.createMasterFrameWork(request)
      expect(mockHttp.post).toHaveBeenCalledWith(
        'apis/proxies/v8/org/framework/v1/create?masterFrameworkName=TestFW&orgId=org-123',
        {}
      )
    })
  })

  describe('downloadFileLog', () => {
    it('should call GET with correct URL including fileName', () => {
      ; (mockHttp.get as jest.Mock).mockReturnValue(of(new Blob()))
      service.downloadFileLog('log-file.csv')
      expect(mockHttp.get).toHaveBeenCalledWith(
        '/apis/proxies/v8/organisation/v1/hierarchy/download/file/log-file.csv'
      )
    })
  })

  describe('downloadSampleTemplate', () => {
    it('should call GET with correct URL including orgType', () => {
      ; (mockHttp.get as jest.Mock).mockReturnValue(of(new Blob()))
      service.downloadSampleTemplate('STATE')
      expect(mockHttp.get).toHaveBeenCalledWith(
        '/apis/proxies/v8/organisation/v1/getMappingFile/sample/STATE'
      )
    })
  })

  describe('exportFramework', () => {
    it('should call GET with correct URL including orgType', () => {
      ; (mockHttp.get as jest.Mock).mockReturnValue(of(new Blob()))
      service.exportFramework('CENTRE')
      expect(mockHttp.get).toHaveBeenCalledWith(
        '/apis/proxies/v8/organisation/v1/hierarchy/download/CENTRE'
      )
    })
  })

  describe('uploadFreameworkTemplate', () => {
    it('should call POST with correct URL using frameworkId', () => {
      const request = { file: 'data' }
      const frameworkId = { orgHierarchyFrameworkId: 'fw-456' }
        ; (mockHttp.post as jest.Mock).mockReturnValue(of({}))
      service.uploadFreameworkTemplate(request, frameworkId)
      expect(mockHttp.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/organisation/v1/hierarchy/bulkUpload/fw-456',
        request
      )
    })
  })

  describe('getOrgReadData', () => {
    it('should call POST with org read endpoint', () => {
      const request = { id: 'org-1' }
        ; (mockHttp.post as jest.Mock).mockReturnValue(of({}))
      service.getOrgReadData(request)
      expect(mockHttp.post).toHaveBeenCalledWith('/apis/proxies/v8/org/v1/read', request)
    })
  })

  describe('getOrganizationDetails', () => {
    it('should call POST with org search endpoint', () => {
      const request = { filters: {} }
        ; (mockHttp.post as jest.Mock).mockReturnValue(of([]))
      service.getOrganizationDetails(request)
      expect(mockHttp.post).toHaveBeenCalledWith('/apis/proxies/v8/org/v1/search', request)
    })
  })

  describe('getBulkuploadProgress', () => {
    it('should call GET with correct URL including framework', () => {
      ; (mockHttp.get as jest.Mock).mockReturnValue(of({ progress: 50 }))
      service.getBulkuploadProgress('fw-789')
      expect(mockHttp.get).toHaveBeenCalledWith(
        '/apis/proxies/v8/organisation/v1/hierarchy/progress/details/bulkUpload/fw-789'
      )
    })
  })

  describe('setOrgData / getOrgData', () => {
    it('should store and retrieve org data', () => {
      const orgData = { id: 'org-1', name: 'Test Org' }
      service.setOrgData(orgData)
      expect(service.getOrgData()).toEqual(orgData)
    })
  })

  describe('setParentOrgData / getParentOrgData', () => {
    it('should store and retrieve parent org data', () => {
      const parentOrgData = { id: 'parent-1', name: 'Parent Org' }
      service.setParentOrgData(parentOrgData)
      expect(service.getParentOrgData()).toEqual(parentOrgData)
    })
  })
})
