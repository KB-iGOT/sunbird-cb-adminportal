// import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable, of } from 'rxjs'
// import { HttpClient } from '@angular/common/http'

// const API_END_POINTS = {
//   SEARCH_ARTICLES: `/api/knowledge/centre/search`,
//   CREATE_ARTICLE: `/api/knowledge/centre/create`,
//   UPDATE_ARTICLE: `/api/knowledge/centre/update`,
//   DELETE_ARTICLE: `/api/knowledge/centre/delete`,
// }

@Injectable({
  providedIn: 'root',
})
export class DeveloperDocService {
  constructor(
    // private http: HttpClient
  ) { }

  // Dummy data for initial load
  private dummyArticles = {
    data: [
      {
        title: 'Marketplace',
        summary: 'Build high-quality learning content for public officials with tools designed for precision, clarity, and impact.',
        status: 'DRAFT',
        type: 'CATEGORY',
        id: 'eef95158-98d3-4700-836e-a85bb997813d',
        createdBy: '54d7b84e-556b-4ca1-be07-f031c159fd8c',
        updatedBy: '54d7b84e-556b-4ca1-be07-f031c159fd8c',
        createdOn: '2026-02-16T14:23:08.48+05:30',
        updatedOn: '2026-02-16T14:23:08.48+05:30'
      },
      {
        title: 'Integration Overview',
        summary: 'Multiple ways to connect your content with our platform.',
        status: 'DRAFT',
        type: 'CATEGORY',
        id: 'b7a7334d-262e-47b1-9bee-479acfcdc292',
        createdBy: '54d7b84e-556b-4ca1-be07-f031c159fd8c',
        updatedBy: '54d7b84e-556b-4ca1-be07-f031c159fd8c',
        createdOn: '2026-02-16T14:25:08.48+05:30',
        updatedOn: '2026-02-16T14:25:08.48+05:30'
      },
      {
        title: 'API Reference',
        summary: 'Detailed documentation of all available APIs, including request parameters and response formats.',
        status: 'DRAFT',
        type: 'CATEGORY',
        id: 'c8b8445e-373f-58c2-acff-580bede6d393',
        createdBy: '54d7b84e-556b-4ca1-be07-f031c159fd8c',
        updatedBy: '54d7b84e-556b-4ca1-be07-f031c159fd8c',
        createdOn: '2026-02-16T14:27:08.48+05:30',
        updatedOn: '2026-02-16T14:27:08.48+05:30'
      },
      {
        title: 'SDKs & Tools',
        summary: 'SDKs, libraries, and tools to speed up development and simplify integrations.',
        status: 'DRAFT',
        type: 'CATEGORY',
        id: 'd9c9556f-484g-69d3-bdgg-691cfef7e4a4',
        createdBy: '54d7b84e-556b-4ca1-be07-f031c159fd8c',
        updatedBy: '54d7b84e-556b-4ca1-be07-f031c159fd8c',
        createdOn: '2026-02-16T14:29:08.48+05:30',
        updatedOn: '2026-02-16T14:29:08.48+05:30'
      }
    ],
    facets: {},
    totalCount: 4
  }

  getArticles(formBody: any): Observable<any> {
    // return this.http.post(API_END_POINTS.SEARCH_ARTICLES, formBody)
    if (formBody) { }
    return of(this.dummyArticles)
  }

  /**
   * Create a new article
   */
  createArticle(formBody: any): Observable<any> {
    // For now, return mock success response
    // TODO: Uncomment below to use actual API call
    // return this.http.post(`${API_END_POINTS.CREATE_ARTICLE}`, formBody)
    return of({ success: true, message: 'Article created successfully', data: formBody })
  }

  /**
   * Update an existing article
   */
  updateArticle(formBody: any): Observable<any> {
    // For now, return mock success response
    // TODO: Uncomment below to use actual API call
    // return this.http.put(`${API_END_POINTS.UPDATE_ARTICLE}`, formBody)
    return of({ success: true, message: 'Article updated successfully', data: formBody })
  }

  /**
   * Delete an article
   */
  deleteArticle(articleId: string): Observable<any> {
    if (articleId) { }
    // For now, return mock success response
    // TODO: Uncomment below to use actual API call
    // return this.http.delete(`${API_END_POINTS.DELETE_ARTICLE}/${articleId}`)
    return of({ success: true, message: 'Article deleted successfully' })
  }
}
