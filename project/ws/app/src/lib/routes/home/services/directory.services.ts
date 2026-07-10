import { Injectable, signal, WritableSignal } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable, throwError } from 'rxjs'
import { catchError, map, shareReplay, tap } from 'rxjs/operators'

const API_END_POINTS = {
  GET_ALL_DEPARTMENTS: '/apis/protected/v8/portal/spv/department',
  GET_ALL_DEPARTMENT_KONG: '/apis/proxies/v8/org/v1/search',
  GET_DEPARTMENT_TITLE: 'apis/proxies/v8/data/v1/system/settings/get/orgTypeList',
  GET_DEPARTMENT_SUB_TITLE: 'apis/proxies/v8/data/v1/system/settings/get/orgTypeConfig',

}

@Injectable({
  providedIn: 'root',
})
export class DirectoryService {
  holdOrgTypeList: WritableSignal<any> = signal(null)
  holdOrgTypeConfig: WritableSignal<any> = signal(null)

  private orgTypeList$?: Observable<any>
  private orgTypeConfig$?: Observable<any>

  constructor(private http: HttpClient) { }
  getAllDepartments(): Observable<any> {
    return this.http.get<any>(`${API_END_POINTS.GET_ALL_DEPARTMENTS}`)
  }
  getAllDepartmentsKong(queryText: any, pagination: { limit: number, offset: number }, state?: string,): Observable<any> {
    let filters
    if (state !== undefined && state === 'state') {
      filters = {
        isTenant: true,
        isState: true,
        status: 1,
      }
    } else {
      filters = {
        isTenant: true,
        status: 1,
        ...(state === 'organisation' ? { isMdo: true } : { isCbp: true }),
      }
    }

    if (queryText) {
      const req1 = {
        request: {
          filters: {
            isTenant: true,
            status: 1,
            ...(state === 'organisation' ? { isMdo: true } : { isCbp: true }),
          },
          query: queryText,
          limit: pagination.limit || 20,
          offset: pagination.offset || 0,
        },
      }
      return this.http.post<any>(`${API_END_POINTS.GET_ALL_DEPARTMENT_KONG}`, req1)
    }

    const req = {
      request: {
        filters,
        sort_by: {
          createdDate: "desc",
        },
        limit: pagination.limit,
        offset: pagination.offset,
      },
    }
    return this.http.post<any>(`${API_END_POINTS.GET_ALL_DEPARTMENT_KONG}`, req)
  }
  getDepartmentTitles(): Observable<any> {
    return this.http.get<any>(`${API_END_POINTS.GET_DEPARTMENT_TITLE}`)
  }
  getDepartmentSubTitles(): Observable<any> {
    return this.http.get<any>(`${API_END_POINTS.GET_DEPARTMENT_SUB_TITLE}`)
  }

  getOrgTypeList$(): Observable<any> {
    if (!this.orgTypeList$) {
      this.orgTypeList$ = this.getDepartmentTitles().pipe(
        map(res => {
          const value = res?.result?.response?.value
          return value ? JSON.parse(value) : null
        }),
        tap(parsed => this.holdOrgTypeList.set(parsed)),
        shareReplay(1),
        catchError(err => {
          this.orgTypeList$ = undefined
          return throwError(() => err)
        })
      )
    }
    return this.orgTypeList$
  }

  getOrgTypeConfig$(): Observable<any> {
    if (!this.orgTypeConfig$) {
      this.orgTypeConfig$ = this.getDepartmentSubTitles().pipe(
        map(res => {
          const value = res?.result?.response?.value
          return value ? JSON.parse(value) : null
        }),
        tap(parsed => {
          if (parsed) { this.holdOrgTypeConfig.set(parsed) }
        }),
        shareReplay(1),
        catchError(err => {
          this.orgTypeConfig$ = undefined
          return throwError(() => err)
        })
      )
    }
    return this.orgTypeConfig$
  }

}
