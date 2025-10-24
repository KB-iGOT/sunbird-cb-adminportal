import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'

export interface Topic {
  categoryId: string
  categoryName: string
  status?: string
}

export interface TopicsSearchRequest {
  filterCriteriaMap: {
    status: string
    categoryName?: string
  }
  requestedFields: string[]
  pageNumber: number
  pageSize: number
}

export interface TopicsSearchResponse {
  result: {
    data: Topic[]
    count: number
  }
}

@Injectable({
  providedIn: 'root'
})
export class TopicsService {

  constructor(private http: HttpClient) { }

  searchTopics(searchRequest: TopicsSearchRequest): Observable<TopicsSearchResponse> {
    return this.http.post<TopicsSearchResponse>(
      '/apis/proxies/v8/community/v1/topic/search',
      searchRequest
    )
  }
}
