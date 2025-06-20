import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'

const API_END_POINTS = {
  ORG_V1_Search: '/apis/proxies/v8/org/v1/search',
  CREATE_FRAMEWORK: 'apis/proxies/v8/org/framework/v1/create',
  DOWNLOAD_FILE_RESULT: '/apis/proxies/v8/organisation/v1/hierarchy/download/file/',
  DOWNLOAD_FRAMEWORK_TEMPLATE: '/apis/proxies/v8/organisation/v1/hierarchy/download/',
  BULKUPLOAD_FRAMEWORK: '/apis/proxies/v8/organisation/v1/hierarchy/bulkUpload/',
  DOWNLOAD_SAMPLE_TEMPLATE: '/apis/proxies/v8/organisation/v1/getMappingFile/sample/',
  ORG_READ: '/apis/proxies/v8/org/v1/read'
}

@Injectable({
  providedIn: 'root'
})
export class OrgHierarchyService {

  constructor(private http: HttpClient) { }

  getCenterOrStateList(request: any): Observable<any> {
    return this.http.post<any>(API_END_POINTS.ORG_V1_Search, request)
  }

  createMasterFrameWork(request: any): Observable<any> {
    return this.http.post<any>(
      `${API_END_POINTS.CREATE_FRAMEWORK}?masterFrameworkName=${request.frameworkName}&orgId=${request.identifier}`,
      {}
    )
  }

  downloadfileResponse(orgType: string): Observable<any> {
    return this.http.get(`${API_END_POINTS.DOWNLOAD_FILE_RESULT}${orgType}`)
  }

  downloadSampleTemplate(orgType: string): Observable<any> {
    return this.http.get(`${API_END_POINTS.DOWNLOAD_SAMPLE_TEMPLATE}${orgType}`)
  }

  exportFramework(orgType: string): Observable<any> {
    return this.http.get(`${API_END_POINTS.DOWNLOAD_FRAMEWORK_TEMPLATE}${orgType}`)
  }

  uploadFreameworkTemplate(request: any, frameworkId: any): Observable<any> {
    return this.http.post<any>(`${API_END_POINTS.BULKUPLOAD_FRAMEWORK}${frameworkId.orgHierarchyFrameworkId}`, request)
  }

  getOrgReadData(request: any): Observable<any> {
    return this.http.post<any>(API_END_POINTS.ORG_READ, request)
  }

  getOrganizationDetails(request: any): Observable<any> {
    return this.http.post<any>(API_END_POINTS.ORG_V1_Search, request)
  }
}
