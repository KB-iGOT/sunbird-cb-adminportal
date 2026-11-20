import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { BehaviorSubject, Observable, throwError } from 'rxjs'
import { catchError, map, shareReplay } from 'rxjs/operators'
import * as _ from 'lodash'
import { environment } from '../../../../../../../../../../src/environments/environment'
import {
  ICadre,
  ICadreSelections,
  ICivilService,
  ICivilServiceType,
  IConfigItem,
} from '../models/access-settings.model'

const API_END_POINTS = {
  CREATE_CONTENTPARTNER: `/apis/proxies/v8/contentpartner/v2/create`,
  UPDATE_CONTENTPARTNER: `/apis/proxies/v8/contentpartner/v2/update`,
  UPLOAD_THUMBNAIL: `apis/proxies/v8/storage/v1/uploadCiosIcon`,
  UPLOAD_CIOS_CONTRACT: `/apis/proxies/v8/storage/v1/uploadCiosContract`,
  GET_PROVIDERS_LIST: `/apis/proxies/v8/contentpartner/v1/search`,
  DELETE_PROVIDER: `/apis/proxies/v8/contentpartner/v1/delete/`,
  ACTIVATE_PROVIDER: `/apis/proxies/v8/contentpartner/v1/activate`,
  GET_PROVIDER_DETAILS: (id: string) => `/apis/proxies/v8/contentpartner/v1/read/${id}`,
  UPLOAD_CONTENT: `/apis/proxies/v8/ciosIntegration/v1/loadContentFromExcel/`,
  UPLOAD_PROGRES: `/apis/proxies/v8/ciosIntegration/v1/loadContentProgressFromExcel/`,
  GET_FILES_LIST: `/apis/proxies/v8/ciosIntegration/v1/file/info/`,
  // GET_CONTENT_LIST: `/apis/proxies/v8/ciosIntegration/v1/readAllContentFromDb`,
  GET_CONTENT_LIST: `apis/proxies/v8/ciosIntegration/v1/search/content`,
  DELETE_NOT_PULISHED_COURSES: 'apis/proxies/v8/ciosIntegration/v1/deleteContent',
  DOWNLOAD_LOG: (gcpfileName: string) => `/apis/proxies/v8/storage/v1/downloadCiosLogs/${gcpfileName}`,
  CREATE_CONFIGURATION: `apis/proxies/v8/serviceregistry/config/create`,
  UPDATE_CONFIGURATION: `apis/proxies/v8/serviceregistry/config/update`,
  GET_CONFIGURATION: (configurationId: string) => `apis/proxies/v8/serviceregistry/config/read/${configurationId}`,

  GET_GROUPS_LIST: `/apis/proxies/v8/user/v1/groups`,
  SEARCH_ORGANISATIONS: '/apis/proxies/v8/org/v1/admin/search',
  SEARCH_DESIGNATIONS: '/apis/proxies/v8/designation/search',
  SEARCH_USERS: '/apis/proxies/v8/user/v1/search',
  GET_CADRE_CONFIG: '/apis/proxies/v8/data/v2/system/settings/get/cadreConfig',
  READ_PROVIDER_ACCESS_SETTINGS: (partnerId: string) => `/apis/proxies/v8/accessSettings/provider/v1/read/${partnerId}`,
  UPSERT_PROVIDER_ACCESS_SETTINGS: '/apis/proxies/v8/accessSettings/provider/v1/upsert',
  READ_NOTIFICATION_SETTINGS: (partnerId: string) => `/apis/proxies/v8/accessSettings/provider/v1/notification/read/${partnerId}`,
  UPSERT_NOTIFICATION_SETTINGS: '/apis/proxies/v8/accessSettings/provider/v1/notification/upsert',

  GET_SSO_CONFIGURATION: (partnerId: string) => `/apis/proxies/v8/sso/read/${partnerId}`,
  CREATE_SSO_CONFIGURATION: (partnerId: string) => `/apis/proxies/v8/sso/create/${partnerId}`,
  UPDATE_SSO_CONFIGURATION: (partnerId: string) => `/apis/proxies/v8/sso/update/${partnerId}`,
  TEST_SSO_CONFIGURATION: `/apis/proxies/v8/sso/validateSaml`,
  LTI_SSO_TEST: (partnerCode: string) => `/apis/proxies/v8/ciosIntegration/lti/ssotest/${partnerCode}`,


  contentRegisterSearch: `/apis/proxies/v8/contentpartner/register/v1/search`,
  updateStatusRegisterProvider: `/apis/proxies/v8/contentpartner/register/v1/update`,
  REGISTERED_PROVIDER_READ: (id: string) => `/apis/proxies/v8/contentpartner/register/v1/readbyid?id=${id}`,
}

const API_ERROR_FALLBACK = 'Something went wrong, please try again later'

export function apiErrorMessage(error: any): string {
  const message = [
    _.get(error, 'error.params.errMsg'),
    _.get(error, 'error.params.errmsg'),
    _.get(error, 'error.message'),
  ].find(text => typeof text === 'string' && text.trim())
  return message ? message.trim() : API_ERROR_FALLBACK
}

interface IIndexedCivilService extends ICivilService {
  typeName: string
  // the state a State Service type lists the service under, null for the other types
  stateKey: string | null
}

@Injectable({
  providedIn: 'root',
})
export class MarketplaceService {
  currentMenuItem: BehaviorSubject<any> = new BehaviorSubject<number>(0);
  newProviderAdded: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  // true once the provider settings (licence type and over all limit) are saved, which unlocks Access Settings
  providerSettingsSaved: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)

  // the cadre config, indexed so the civil services, cadres and batch years can each be narrowed by the other two
  private civilServiceTypes: ICivilServiceType[] = []
  private civilServices = new Map<string, IIndexedCivilService>()
  private cadres = new Map<string, ICadre>()
  private civilServiceToCadres = new Map<string, Set<string>>()
  private cadreToCivilServices = new Map<string, Set<string>>()
  private batchYearToCivilServices = new Map<number, Set<string>>()
  private batchYearToCadres = new Map<number, Set<string>>()
  private cadreConfig$?: Observable<void>

  constructor(
    private http: HttpClient,
  ) { }

  createProvider(formBody: any) {
    return this.http.post(`${API_END_POINTS.CREATE_CONTENTPARTNER}`, formBody)
  }

  updateProvider(formBody: any) {
    return this.http.post(`${API_END_POINTS.UPDATE_CONTENTPARTNER}`, formBody)
  }

  uploadThumbNail(
    icon: any
  ): Observable<any> {
    const file = icon.get('content') as File
    const fileName = file.name
    const newFormData = new FormData()
    newFormData.append('file', file, fileName)
    const url = `${API_END_POINTS.UPLOAD_THUMBNAIL}`
    return this.http.post<any>(
      url,
      newFormData
    )
  }

  uploadCIOSContract(
    data: any
  ): Observable<any> {
    const file = data.get('content') as File
    const fileName = file.name
    const newFormData = new FormData()
    newFormData.append('file', file, fileName)
    const url = `${API_END_POINTS.UPLOAD_CIOS_CONTRACT}`
    return this.http.post<any>(
      url,
      newFormData
    )
  }

  getProvidersList(formBody: any) {
    return this.http.post(`${API_END_POINTS.GET_PROVIDERS_LIST}`, formBody)
  }

  deleteProvider(providerId: string) {
    return this.http.delete(`${API_END_POINTS.DELETE_PROVIDER}${providerId}`)
  }

  activateProvider(formBody: any) {
    return this.http.put(`${API_END_POINTS.ACTIVATE_PROVIDER}`, formBody)
  }

  getProviderDetails(id: string) {
    return this.http.get(API_END_POINTS.GET_PROVIDER_DETAILS(id))
  }

  // The user groups of Access Settings, with what each has consumed, and the provider's licence totals (result.licence)
  readProviderAccessSettings(partnerId: string): Observable<any> {
    return this.http.get(API_END_POINTS.READ_PROVIDER_ACCESS_SETTINGS(partnerId))
  }

  // Writes only the user groups. A group with its userGroupId is updated, one without is created, and a saved group
  // left out is deleted.
  upsertProviderAccessSettings(formBody: any): Observable<any> {
    return this.http.put(API_END_POINTS.UPSERT_PROVIDER_ACCESS_SETTINGS, formBody)
  }

  // The thresholds (read-only), which of them have sent their alert, and the recipients of Licence Notifications
  readNotificationSettings(partnerId: string): Observable<any> {
    return this.http.get(API_END_POINTS.READ_NOTIFICATION_SETTINGS(partnerId))
  }

  upsertNotificationSettings(formBody: any): Observable<any> {
    return this.http.put(API_END_POINTS.UPSERT_NOTIFICATION_SETTINGS, formBody)
  }

  readProviderPreference(partnerId: string): Observable<any> {
    return this.http.get(API_END_POINTS.GET_PROVIDER_DETAILS(partnerId))
  }

  // saved with the rest of the provider's details through the existing provider update
  updateProviderPreference(providerDetails: any, providerPreference: boolean): Observable<any> {
    const formBody = _.cloneDeep(providerDetails)
    formBody.data = { ...formBody.data, providerPreference }
    return this.updateProvider(formBody)
  }

  // The names of saved organisations, which a user group keeps by id only
  getOrganisationsByIds(ids: string[]) {
    const formBody = {
      request: {
        filters: { id: ids },
        limit: ids.length,
        fields: ['channel', 'identifier'],
      },
    }
    return this.http.post<any>(API_END_POINTS.SEARCH_ORGANISATIONS, formBody)
  }

  getGroupsList() {
    return this.http.get(`${API_END_POINTS.GET_GROUPS_LIST}`)
  }

  // startsWith lists the organisations whose name starts with that letter
  searchOrganisations(query: string, offset: number, limit: number, startsWith = '') {
    const formBody: any = {
      request: {
        query,
        limit,
        offset,
        filters: { status: 1 },
        fields: ['channel', 'identifier'],
      },
    }
    if (startsWith) {
      formBody.request.filters.channel = { startsWith }
    }
    return this.http.post<any>(API_END_POINTS.SEARCH_ORGANISATIONS, formBody)
  }

  searchDesignations(query: string, pageNumber: number, pageSize: number, startsWith = '') {
    const formBody: any = {
      pageNumber,
      pageSize,
      filterCriteriaMap: { status: 'Active' },
      requestedFields: ['designation', 'id'],
    }
    if (query) {
      formBody.searchString = query
    } else {
      formBody.orderBy = 'designation'
    }
    if (startsWith) {
      formBody.startsWith = startsWith
    }
    return this.http.post<any>(API_END_POINTS.SEARCH_DESIGNATIONS, formBody)
  }

  // The response carries only the count of the users that match, which is all a user group shows
  getUserCount(filters: { [key: string]: any }) {
    const formBody = {
      request: {
        filters,
        fields: ['identifier', 'rootOrgId', 'firstName'],
      },
    }
    return this.http.post<any>(API_END_POINTS.SEARCH_USERS, formBody)
  }

  // personal details are read off profileDetails, the top level ones are masked.
  searchUsers(query: string, filters: { [key: string]: any }, offset: number, limit: number) {
    const formBody = {
      request: {
        query,
        filters,
        limit,
        offset,
        fields: ['userId', 'firstName', 'rootOrgName', 'maskedEmail', 'maskedPhone', 'profileDetails'],
      },
    }
    return this.http.post<any>(API_END_POINTS.SEARCH_USERS, formBody)
  }

  getCadreConfig() {
    return this.http.get<any>(API_END_POINTS.GET_CADRE_CONFIG)
  }

  getContentList(providerId: any) {
    return this.http.get(`${API_END_POINTS.GET_FILES_LIST}${providerId}`)
  }

  uploadContent(
    data: any,
    partnerCode: string,
    partnerId: string
  ): Observable<any> {
    const file = data.get('content') as File
    const fileName = file.name
    const newFormData = new FormData()
    newFormData.append('file', file, fileName)
    const url = `${API_END_POINTS.UPLOAD_CONTENT}${partnerCode}/${partnerId}`
    return this.http.post<any>(
      url,
      newFormData
    )
  }

  uploadProgress(
    data: any,
    partnerCode: string
  ): Observable<any> {
    const file = data.get('content') as File
    const newFormData = new FormData()
    newFormData.append('file', file)
    const url = `${API_END_POINTS.UPLOAD_PROGRES}${partnerCode}`
    return this.http.post<any>(
      url,
      newFormData
    )
  }

  convertResourceUrl(url?: string): string {
    if (!url) return ''
    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      return url
    }

    const firstSlash = parsed.pathname.indexOf('/', 1)
    if (firstSlash === -1) return url

    const resourcePath = parsed.pathname.slice(firstSlash)
    return `${environment.contentHost}/content-store${resourcePath}`
  }

  getCoursesList(formBody: any) {
    return this.http.post<any>(`${API_END_POINTS.GET_CONTENT_LIST}`, formBody)
  }

  // deleteCourse(courseId: string) {
  //   return this.http.delete(`${API_END_POINTS.DELETE_COURSE}${courseId}`)
  // }

  deleteUnPublishedCourses(formBody: any) {
    return this.http.post<any>(`${API_END_POINTS.DELETE_NOT_PULISHED_COURSES}`, formBody, { responseType: 'text' as 'json' })
  }

  downloadLogs(gcpfileName: string) {
    return this.http.get<any>(API_END_POINTS.DOWNLOAD_LOG(gcpfileName), { responseType: 'blob' as 'json' })
  }

  //#region (via api)
  createConfiguration(formBody: any) {
    return this.http.post(`${API_END_POINTS.CREATE_CONFIGURATION}`, formBody)
  }

  updateConfiguration(formBody: any) {
    return this.http.post(`${API_END_POINTS.UPDATE_CONFIGURATION}`, formBody)
  }

  getConfiguraionDetails(configurationId: string) {
    return this.http.get(`${API_END_POINTS.GET_CONFIGURATION(configurationId)}`)
  }
  //#endregion

  getSSOConfiguration(partnerId: string): Observable<any> {
    return this.http.get(`${API_END_POINTS.GET_SSO_CONFIGURATION(partnerId)}`)
  }

  createSSOConfiguration(partnerId: string, formBody: any) {
    return this.http.post(`${API_END_POINTS.CREATE_SSO_CONFIGURATION(partnerId)}`, formBody)
  }

  updateSSOConfiguration(partnerId: string, formBody: any) {
    return this.http.post(`${API_END_POINTS.UPDATE_SSO_CONFIGURATION(partnerId)}`, formBody)
  }

  testSSOConfiguration(formBody: any) {
    return this.http.post(`${API_END_POINTS.TEST_SSO_CONFIGURATION}`, formBody)
  }

  ltiSSOTest(partnerCode: string) {
    return this.http.get(`${API_END_POINTS.LTI_SSO_TEST(partnerCode)}`)
  }

  contentRegisterList(formBody: any) {
    return this.http.post(`${API_END_POINTS.contentRegisterSearch}`, formBody)
  }

  changeStatusRegisterProvider(formBody: any) {
    return this.http.post(`${API_END_POINTS.updateStatusRegisterProvider}`, formBody)
  }

  downloadAssetFile(assetPath: string, fileName?: string): void {
    const link = document.createElement('a')
    link.href = assetPath
    link.download = fileName || assetPath.split('/').pop() || 'file'
    link.target = '_blank'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  readRegisteredProviderDetails(id: string) {
    return this.http.get(`${API_END_POINTS.REGISTERED_PROVIDER_READ(id)}`)
  }


  // @sunbird-cb/access-settings, so the lists are the ones the creation portal access control offers.

  // The config is read once and shared, a read that failed is made again the next time
  loadCadreConfig(): Observable<void> {
    if (!this.cadreConfig$) {
      this.cadreConfig$ = this.getCadreConfig().pipe(
        map((response: any) => this.indexCadreConfig(response)),
        catchError(error => {
          this.cadreConfig$ = undefined
          return throwError(error)
        }),
        shareReplay(1),
      )
    }
    return this.cadreConfig$
  }

  getCivilServiceTypeNames(): string[] {
    return this.civilServiceTypes.map(type => type.name)
  }

  // A type that lists its services per state (State Service) rather than directly
  isStateServiceType(typeName: string): boolean {
    return this.civilServiceTypes.some(type => type.name === typeName && _.compact(type.states).length > 0)
  }

  // The services of a type, those of a state type from every state
  getCivilServicesOfType(typeName: string): IConfigItem[] {
    const isStateType = this.isStateServiceType(typeName)
    return Array.from(this.civilServices.values())
      .filter(service => service.typeName === typeName && !!service.stateKey === isStateType)
      .map(({ id, name }) => ({ id, name }))
  }

  // Each list is narrowed by what the group selects of the other two, never by what it selects of itself
  getCivilServices(selected: ICadreSelections): IConfigItem[] {
    const cadreIds = this.cadreIdsByName(selected.cadres)
    const years = selected.batchYears
    let serviceIds: string[]
    if (cadreIds.length) {
      serviceIds = this.linked(this.cadreToCivilServices, cadreIds)
      if (years.length) {
        serviceIds = serviceIds.filter(id => this.coversAnyYear(
          this.civilServices.get(id)?.commonBatchStartYear, this.civilServices.get(id)?.commonBatchEndYear, years))
      }
    } else if (years.length) {
      serviceIds = this.linked(this.batchYearToCivilServices, years)
    } else {
      serviceIds = Array.from(this.civilServices.keys())
    }
    return this.toConfigItems(serviceIds, this.civilServices)
  }

  getCadres(selected: ICadreSelections): IConfigItem[] {
    const serviceIds = this.civilServiceIdsByName(selected.services)
    const years = selected.batchYears
    let cadreIds: string[]
    if (serviceIds.length) {
      cadreIds = this.linked(this.civilServiceToCadres, serviceIds)
      if (years.length) {
        cadreIds = cadreIds.filter(id => this.coversAnyYear(
          this.cadres.get(id)?.startBatchYear, this.cadres.get(id)?.endBatchYear, years))
      }
    } else if (years.length) {
      cadreIds = this.linked(this.batchYearToCadres, years)
    } else {
      cadreIds = Array.from(this.cadres.keys())
    }
    return this.toConfigItems(cadreIds, this.cadres)
  }

  getBatchYears(selected: ICadreSelections): number[] {
    const serviceIds = this.civilServiceIdsByName(selected.services)
    const cadreIds = this.cadreIdsByName(selected.cadres)
    const serviceYears = _.flatMap(serviceIds, id =>
      this.yearRange(this.civilServices.get(id)?.commonBatchStartYear, this.civilServices.get(id)?.commonBatchEndYear))
    const cadreYears = _.flatMap(cadreIds, id =>
      this.yearRange(this.cadres.get(id)?.startBatchYear, this.cadres.get(id)?.endBatchYear))

    let years: number[]
    if (serviceIds.length && cadreIds.length) {
      years = _.intersection(serviceYears, cadreYears)
    } else if (serviceIds.length || cadreIds.length) {
      years = serviceIds.length ? serviceYears : cadreYears
    } else {
      years = Array.from(this.batchYearToCadres.keys())
    }
    return _.sortBy(_.uniq(years))
  }

  // The Cadre condition is not offered to a group whose services have no cadres
  hasCadres(serviceNames: string[]): boolean {
    return this.linked(this.civilServiceToCadres, this.civilServiceIdsByName(serviceNames)).length > 0
  }

  private indexCadreConfig(response: any): void {
    // the value comes as an object or as a JSON string, with or without the civilServiceType wrapper
    const value = _.get(response, 'result.response.value')
    const config = typeof value === 'string' ? JSON.parse(value) : value
    this.civilServiceTypes = _.compact(_.get(config, 'civilServiceType.civilServiceTypeList') || _.get(config, 'civilServiceTypeList'))

    this.civilServices.clear()
    this.cadres.clear()
    this.civilServiceToCadres.clear()
    this.cadreToCivilServices.clear()
    this.batchYearToCivilServices.clear()
    this.batchYearToCadres.clear()

    this.civilServiceTypes.forEach(type => {
      const typeKey = `${type.id || type.name}`
      this.indexCivilServices(type, typeKey, null, type.serviceList)
      _.compact(type.states).forEach(state => {
        const stateKey = `${typeKey}_${state.id || state.name}`
        this.indexCivilServices(type, stateKey, stateKey, state.serviceList)
      })
    })
  }

  // Service ids are only unique within their own branch of the config, the same id is used again under another
  // type or state, so a service is keyed by the branch it is listed in
  private indexCivilServices(type: ICivilServiceType, scope: string, stateKey: string | null, serviceList?: ICivilService[]): void {
    _.compact(serviceList).forEach(service => {
      const serviceId = `${scope}_${service.id}`
      this.civilServices.set(serviceId, { ...service, stateKey, id: serviceId, typeName: type.name })
      this.yearRange(service.commonBatchStartYear, service.commonBatchEndYear)
        .forEach(year => this.addLink(this.batchYearToCivilServices, year, serviceId))

      _.compact(service.cadreList).forEach(cadre => {
        this.cadres.set(cadre.id, cadre)
        this.addLink(this.civilServiceToCadres, serviceId, cadre.id)
        this.addLink(this.cadreToCivilServices, cadre.id, serviceId)
        this.yearRange(cadre.startBatchYear, cadre.endBatchYear)
          .forEach(year => this.addLink(this.batchYearToCadres, year, cadre.id))
      })
    })
  }

  private addLink<K>(links: Map<K, Set<string>>, key: K, id: string): void {
    if (!links.has(key)) {
      links.set(key, new Set<string>())
    }
    links.get(key)?.add(id)
  }

  // Everything the given keys are linked to, each once
  private linked<K>(links: Map<K, Set<string>>, keys: K[]): string[] {
    const linkedIds = new Set<string>()
    keys.forEach(key => links.get(key)?.forEach(id => linkedIds.add(id)))
    return Array.from(linkedIds)
  }

  private yearRange(start?: number, end?: number): number[] {
    return start && end && start <= end ? _.range(Number(start), Number(end) + 1) : []
  }

  private coversAnyYear(start: number | undefined, end: number | undefined, years: number[]): boolean {
    return years.some(year => !!start && !!end && year >= start && year <= end)
  }

  // Selections hold the names, lowercased the way the creation portal saves them
  private civilServiceIdsByName(names: string[]): string[] {
    const lowerNames = new Set(names.map(name => name.toLowerCase()))
    return Array.from(this.civilServices.values())
      .filter(service => lowerNames.has((service.name || '').toLowerCase()))
      .map(service => service.id)
  }

  private cadreIdsByName(names: string[]): string[] {
    const lowerNames = new Set(names.map(name => name.toLowerCase()))
    return Array.from(this.cadres.values())
      .filter(cadre => lowerNames.has((cadre.name || '').toLowerCase()))
      .map(cadre => cadre.id)
  }

  private toConfigItems(ids: string[], index: Map<string, IConfigItem>): IConfigItem[] {
    return _.compact(ids.map(id => index.get(id))).map(({ id, name }) => ({ id, name }))
  }
}
