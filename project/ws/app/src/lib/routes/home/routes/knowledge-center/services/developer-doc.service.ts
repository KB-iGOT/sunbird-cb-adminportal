// import { HttpClient } from '@angular/common/http'
import { APP_BASE_HREF } from '@angular/common'
import { Inject, Injectable } from '@angular/core'
import { Observable, of } from 'rxjs'
import { HttpClient } from '@angular/common/http'

const API_END_POINTS = {
  SEARCH_ARTICLES: `/apis/proxies/v8/knowledge/centre/spv/search`,
  CREATE_SUB_CATEGORY: `/apis/proxies/v8/knowledge/centre/create/subcategory`,
  UPDATE_SUB_CATEGORY: (id: string) => `/apis/proxies/v8/knowledge/centre/update/subcategory/${id}`,
  CREATE_ARTICLE: `/apis/proxies/v8/knowledge/centre/create/article`,
  UPDATE_ARTICLE: (id: string) => `/apis/proxies/v8/knowledge/centre/update/article/${id}`,
  DELETE_ARTICLE: (id: string) => `/apis/proxies/v8/knowledge/centre/delete/article/${id}`,
  PUBLISH_ARTICLE: `/apis/proxies/v8/knowledge/centre/publish/article`,
  PUBLISH_SUB_CATEGORY: `/apis/proxies/v8/knowledge/centre/publish/subcategory`,
}

@Injectable({
  providedIn: 'root',
})
export class DeveloperDocService {
  constructor(
    private http: HttpClient,
    @Inject(APP_BASE_HREF) private baseHref: string,
  ) { }

  getArticles(formBody: any): Observable<any> {
    return this.http.post(API_END_POINTS.SEARCH_ARTICLES, formBody)
  }

  createSubCategory(formBody: any): Observable<any> {
    return this.http.post(`${API_END_POINTS.CREATE_SUB_CATEGORY}`, formBody)
  }

  updateSubCategory(formBody: any): Observable<any> {
    return this.http.put(`${API_END_POINTS.UPDATE_SUB_CATEGORY(formBody.subCategoryId)}`, formBody)
  }

  createArticle(formBody: any): Observable<any> {
    return this.http.post(`${API_END_POINTS.CREATE_ARTICLE}`, formBody)
  }

  updateArticle(formBody: any): Observable<any> {
    return this.http.put(`${API_END_POINTS.UPDATE_ARTICLE(formBody.articleId)}`, formBody)
  }

  deleteArticle(articleId: string): Observable<any> {
    if (articleId) { }
    // For now, return mock success response
    // TODO: Uncomment below to use actual API call
    // return this.http.delete(`${API_END_POINTS.DELETE_ARTICLE}/${articleId}`)
    return of({ success: true, message: 'Article deleted successfully' })
  }

  publishSubCategory(formBody: any): Observable<any> {
    return this.http.post(`${API_END_POINTS.PUBLISH_SUB_CATEGORY}`, formBody)
  }

  publishArticle(formBody: any): Observable<any> {
    return this.http.post(`${API_END_POINTS.PUBLISH_ARTICLE}`, formBody)
  }

  get locale(): string {
    return this.baseHref && this.baseHref.replace(/\//g, '')
      ? this.baseHref.replace(/\//g, '').split('-')[0]
      : 'en'
  }
}
