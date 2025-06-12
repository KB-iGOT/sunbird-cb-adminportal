import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'

const API_END_POINTS = {
  ORG_V1_Search: '/apis/proxies/v8/org/v1/search',
  CREATE_FRAMEWORK: 'apis/proxies/v8/org/framework/v1/create'
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
}
