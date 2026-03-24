import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

const API_BASE = '/apis/proxies/v8'

const API_PROTECTED = '/apis/protected/v8'

const API_END_POINTS = {
  SEARCH_USERS: `${API_BASE}/user/v1/search`,
  USER_BY_EMAIL: `${API_BASE}/user/v1/search`,
  UPDATE_USER_ADMIN_EXT: `${API_BASE}/user/v1/admin/extPatch`,
  ASSIGN_USER_ROLES: `${API_BASE}/user/private/v1/assign/role`,
  MODIFY_USER_ROLES: `${API_BASE}/user/private/v1/assign/role`,
  CREATE_USER: `${API_PROTECTED}/user/profileDetails/createUser`,
  MIGRATE_USER: `${API_BASE}/user/private/v1/migrate`,
  RESET_PASSWORD: `${API_PROTECTED}/user/password/reset`,
  FETCH_GROUPS: `/api/user/v1/groups`,
  FETCH_CADRE_DATA: `${API_BASE}/data/v2/system/settings/get/cadreConfig`,
  FETCH_DESIGNATIONS: `${API_PROTECTED}/proxies/v8/sunbirdigot/v4/search`,
  FETCH_MASTER_LANGUAGES: `${API_PROTECTED}/user/v1/master-languages`,
  FETCH_IGOT_ROLES: `${API_BASE}/data/v1/system/settings/get/orgTypeList`,
  SEARCH_ORG: `${API_BASE}/org/v1/search`,
}

@Injectable({ providedIn: 'root' })
export class UsersService {

  constructor(private http: HttpClient) { }

  getUsers(payload: any): Observable<any> {
    return this.http.post<any>(API_END_POINTS.SEARCH_USERS, payload)
  }

  getUserByEmail(payload: any): Observable<any> {
    return this.http.post<any>(API_END_POINTS.USER_BY_EMAIL, payload)
  }



  updateUserExt(payload: any): Observable<any> {
    return this.http.post<any>(API_END_POINTS.UPDATE_USER_ADMIN_EXT, payload)
  }

  extPatchUser(payload: any): Observable<any> {
    return this.http.post<any>(API_END_POINTS.UPDATE_USER_ADMIN_EXT, payload)
  }

  assignUserRoles(userId: string, orgId: string, roles: string[]): Observable<any> {
    return this.http.post<any>(API_END_POINTS.ASSIGN_USER_ROLES, {
      request: { userId, organisationId: orgId, roles },
    })
  }

  modifyUserRoles(payload: any): Observable<any> {
    return this.http.post<any>(API_END_POINTS.MODIFY_USER_ROLES, payload)
  }

  createUser(payload: any): Observable<any> {
    return this.http.post<any>(API_END_POINTS.CREATE_USER, payload)
  }

  migrateUser(payload: any): Observable<any> {
    return this.http.patch<any>(API_END_POINTS.MIGRATE_USER, payload)
  }

  resetPassword(payload: any): Observable<any> {
    return this.http.post<any>(API_END_POINTS.RESET_PASSWORD, payload)
  }

  fetchGroups(): Observable<any> {
    return this.http.get<any>(API_END_POINTS.FETCH_GROUPS)
  }

  fetchCadreData(): Observable<any> {
    return this.http.get<any>(API_END_POINTS.FETCH_CADRE_DATA)
  }

  fetchDesignations(): Observable<any> {
    return this.http.get<any>(API_END_POINTS.FETCH_DESIGNATIONS)
  }

  /** Search iGOT master designations */
  searchMasterDesignations(query: string, pageSize = 50, pageNumber = 0): Observable<{ items: { name: string; identifier: string }[]; totalCount: number }> {
    const body: any = {
      filterCriteriaMap: { status: 'Active' },
      requestedFields: [],
      pageNumber,
      pageSize,
    }
    if (query) { body['searchString'] = query }
    return this.http.post<any>(`${API_BASE}/designation/search`, body).pipe(
      map((res: any) => {
        const data: any[] = res?.result?.result?.data || []
        return {
          items: data.map((d: any) => ({ name: d.designation || d.name || '', identifier: String(d.id || d.identifier || '') })),
          totalCount: res?.result?.result?.totalCount || 0,
        }
      }),
    )
  }

  fetchMasterLanguages(): Observable<any> {
    return this.http.get<any>(API_END_POINTS.FETCH_MASTER_LANGUAGES)
  }

  fetchIgotRoles(): Observable<any> {
    return this.http.get<any>(API_END_POINTS.FETCH_IGOT_ROLES).pipe(
      map((res: any) => {
        const parsed = JSON.parse(res.result.response.value)
        const allRoles: string[] = []
        if (parsed.orgTypeList) {
          parsed.orgTypeList.forEach((orgType: any) => {
            if (orgType.roles) {
              allRoles.push(...orgType.roles)
            }
          })
        }
        return [...new Set(allRoles)].sort()
      }),
    )
  }

  searchOrganizations(query: string): Observable<any> {
    return this.http.post<any>(API_END_POINTS.SEARCH_ORG, {
      request: {
        filters: { isTenant: true, status: 1, isMdo: true },
        limit: 50,
        offset: 0,
        query,
      },
    }).pipe(
      map((res: any) => res.result?.response?.content || []),
    )
  }
}
