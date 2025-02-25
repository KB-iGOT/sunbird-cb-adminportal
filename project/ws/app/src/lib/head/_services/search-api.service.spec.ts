import { SearchApiService } from './search-api.service'
import { HttpClient } from '@angular/common/http'
import { of } from 'rxjs'

jest.mock('@angular/common/http')

describe('SearchApiService', () => {
  let service: SearchApiService
  let httpClient: HttpClient

  beforeEach(() => {
    httpClient = new HttpClient(null as any) // This can be mocked as needed
    service = new SearchApiService(httpClient)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('getSearchResults', () => {
    it('should make a POST request to the correct URL with request body', () => {
      const request = { query: 'test query' }
      const response = { results: ['item1', 'item2'] }
      const spy = jest.spyOn(httpClient, 'post').mockReturnValue(of(response))

      service.getSearchResults(request).subscribe((result) => {
        expect(result).toEqual(response)
        expect(spy).toHaveBeenCalledWith('/apis/protected/v8/social/post/search', request)
      })
    })
  })

  describe('getSearchAutoCompleteResults', () => {
    it('should make a GET request to the correct URL with parameters', () => {
      const params = { q: 'test query', l: 'en' }
      const response = ['item1', 'item2']
      const spy = jest.spyOn(httpClient, 'get').mockReturnValue(of(response))

      service.getSearchAutoCompleteResults(params).subscribe((result) => {
        expect(result).toEqual(response)
        expect(spy).toHaveBeenCalledWith('/apis/proxies/v8/sunbirdigot/read', { params })
      })
    })
  })

  describe('getSearchV6Results', () => {
    it('should process response and return transformed data', () => {
      const body = { query: 'test query' }
      const response = {
        result: {
          facets: [
            {
              name: 'category',
              values: [
                { name: 'Cat1', count: 5 },
                { name: 'Cat2', count: 3 },
              ],
            },
          ],
        },
      }
      const spy = jest.spyOn(httpClient, 'post').mockReturnValue(of(response))

      service.getSearchV6Results(body).subscribe((result) => {
        expect(result.filters).toEqual([
          {
            displayName: 'category',
            type: 'category',
            content: [
              { displayName: 'Cat1', type: 'Cat1', count: 5, id: '' },
              { displayName: 'Cat2', type: 'Cat2', count: 3, id: '' },
            ],
          },
        ])
        expect(spy).toHaveBeenCalledWith('/apis/proxies/v8/sunbirdigot/search', body)
      })
    })
  })

  describe('getSearch', () => {
    it('should make a POST request with the correct body', () => {
      const body = { request: { query: 'test query' } }
      const response = { results: ['item1', 'item2'] }
      const spy = jest.spyOn(httpClient, 'post').mockReturnValue(of(response))

      service.getSearch(body).subscribe((result) => {
        expect(result).toEqual(response)
        expect(spy).toHaveBeenCalledWith('/apis/proxies/v8/sunbirdigot/read', expect.objectContaining({
          request: expect.objectContaining({
            query: 'test query',
          }),
        }))
      })
    })
  })
})
