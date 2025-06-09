import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'

const API_END_POINTS = {
  ORG_V1_Search: '/apis/proxies/v8/org/v1/search',
}

@Injectable({
  providedIn: 'root'
})
export class OrgHierarchyService {

  constructor(private http: HttpClient) { }

  getCenterOrStateList(request: any): Observable<any> {
    return this.http.post<any>(API_END_POINTS.ORG_V1_Search, request)
  }
}
