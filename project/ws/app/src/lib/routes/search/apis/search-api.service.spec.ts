import { SearchApiService } from './search-api.service'
import { HttpClient } from '@angular/common/http'
import { of } from 'rxjs'
import { NSSearch } from '@sunbird-cb/collection'

jest.mock('@angular/common/http')

describe('SearchApiService', () => {
  let service: SearchApiService
  let httpClient: jest.Mocked<HttpClient>

  beforeEach(() => {
    // Mock HttpClient
    httpClient = new HttpClient(null as any) as jest.Mocked<HttpClient>
    service = new SearchApiService(httpClient)
  })

  describe('getSearchResults', () => {
    it('should return search results', () => {
      const mockRequest: any = { q: 'test' } // Use appropriate mock request structure
      const mockResponse: any = { results: [], total: 0 } // Mock the expected response

      httpClient.post.mockReturnValue(of(mockResponse))  // Mock HttpClient.post method

      service.getSearchResults(mockRequest).subscribe((response) => {
        expect(response).toEqual(mockResponse) // Assert that the response is what we mocked
      })

      expect(httpClient.post).toHaveBeenCalledWith(
        '/apis/protected/v8/social/post/search',
        mockRequest
      )
    })
  })

  describe('getSearchAutoCompleteResults', () => {
    it('should return autocomplete results', () => {
      const params = { q: 'test', l: 'en' }
      const mockAutoCompleteResults: any[] = [{ text: 'test' }]

      httpClient.get.mockReturnValue(of(mockAutoCompleteResults)) // Mock HttpClient.get method

      service.getSearchAutoCompleteResults(params).subscribe((response) => {
        expect(response).toEqual(mockAutoCompleteResults)
      })

      expect(httpClient.get).toHaveBeenCalledWith(
        '/apis/protected/v8/content/searchAutoComplete',
        { params }
      )
    })
  })

  describe('getSearchV6Results', () => {
    it('should return v6 search results and modify the filters correctly', () => {
      const mockRequest: NSSearch.ISearchV6Request = { query: 'test' }  // Use appropriate mock request structure
      const mockResponse: any = {
        filters: [
          { type: 'catalogPaths', content: [{ children: ['child1', 'child2'] }] },
        ],
        total: 1,
      }

      httpClient.post.mockReturnValue(of(mockResponse))  // Mock HttpClient.post method

      service.getSearchV6Results(mockRequest).subscribe((response) => {
        expect(response).toEqual(mockResponse)
        // Ensure the filter modification logic works
        expect(response.filters[0].content).toEqual(['child1', 'child2'])
      })

      expect(httpClient.post).toHaveBeenCalledWith(
        '/apis/protected/v8/content/searchV6',
        mockRequest
      )
    })
  })
})
