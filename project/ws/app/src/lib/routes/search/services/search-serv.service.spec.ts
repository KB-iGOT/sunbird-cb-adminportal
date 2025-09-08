import { SearchServService } from './search-serv.service'
import { SearchApiService } from '../apis/search-api.service'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { HttpClient } from '@angular/common/http'
import { of } from 'rxjs'

jest.mock('../apis/search-api.service')
jest.mock('@sunbird-cb/utils-v2')
jest.mock('@angular/common/http')

describe('SearchServService', () => {
  let searchServService: SearchServService
  let mockSearchApiService: SearchApiService
  let mockConfigService: ConfigurationsService
  let mockHttpClient: HttpClient

  beforeEach(() => {
    mockSearchApiService = new SearchApiService(null as any) // Passing null as HttpClient mock
    mockConfigService = new ConfigurationsService() // Mocked dependency
    mockHttpClient = new HttpClient(null as any) // Mocked dependency

    searchServService = new SearchServService(mockSearchApiService, mockConfigService, mockHttpClient)
  })

  describe('getSearchConfig', () => {
    it('should fetch search config and return it', async () => {
      // Arrange
      const mockConfig = { search: { tabs: [{ phraseSearch: true }] } }
      mockHttpClient.get = jest.fn().mockReturnValue(of(mockConfig))

      // Act
      const result = await searchServService.getSearchConfig()

      // Assert
      expect(mockHttpClient.get).toHaveBeenCalled()
      expect(result).toEqual(mockConfig)
    })
  })

  describe('getApplyPhraseSearch', () => {
    it('should return true if phraseSearch is enabled', async () => {
      // Arrange
      const mockConfig = { search: { tabs: [{ phraseSearch: true }] } }
      mockHttpClient.get = jest.fn().mockReturnValue(of(mockConfig))

      // Act
      const result = await searchServService.getApplyPhraseSearch()

      // Assert
      expect(result).toBe(true)
    })

    it('should return false if phraseSearch is disabled', async () => {
      // Arrange
      const mockConfig = { search: { tabs: [{ phraseSearch: false }] } }
      mockHttpClient.get = jest.fn().mockReturnValue(of(mockConfig))

      // Act
      const result = await searchServService.getApplyPhraseSearch()

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('searchAutoComplete', () => {
    it('should return auto complete results from SearchApiService', async () => {
      // Arrange
      const mockParams = { q: 'test', l: 'en' }
      const mockAutoCompleteResponse = [{ title: 'Test result' }]
      mockSearchApiService.getSearchAutoCompleteResults = jest.fn().mockReturnValue(of(mockAutoCompleteResponse))

      // Act
      const result = await searchServService.searchAutoComplete(mockParams)

      // Assert
      expect(mockSearchApiService.getSearchAutoCompleteResults).toHaveBeenCalledWith(mockParams)
      expect(result).toEqual(mockAutoCompleteResponse)
    })

    it('should return an empty array if language is not supported', async () => {
      // Arrange
      const mockParams = { q: 'test', l: 'all' }

      // Act
      const result = await searchServService.searchAutoComplete(mockParams)

      // Assert
      expect(result).toEqual([])
    })
  })

  describe('getLearning', () => {
    it('should return search results from searchV6Wrapper', async () => {
      // Arrange
      const mockRequest = { locale: ['en'], query: 'test', filters: {} }
      const mockSearchResults = { items: [] }
      mockSearchApiService.getSearchV6Results = jest.fn().mockReturnValue(of(mockSearchResults))

      // Act
      const result = searchServService.getLearning(mockRequest)

      // Assert
      expect(result).toEqual(of(mockSearchResults))
    })
  })

  describe('updateSelectedFiltersSet', () => {
    it('should return filterSet with selected filters', () => {
      // Arrange
      const filters = { tags: ['filter1', 'filter2'] }

      // Act
      const result = searchServService.updateSelectedFiltersSet(filters)

      // Assert
      expect(result.filterSet).toEqual(new Set(['filter1', 'filter2']))
    })
  })

  describe('translateSearchFilters', () => {
    it('should return translated filters for a specific language', async () => {
      // Arrange
      const mockTranslatedFilters = { en: { filter1: 'value1' } }
      localStorage.setItem('filtersTranslation', JSON.stringify(mockTranslatedFilters))
      const lang = 'en'
      const mockTranslation = { filter1: 'value1' }

      mockHttpClient.get = jest.fn().mockReturnValue(of(mockTranslation))

      // Act
      const result = await searchServService.translateSearchFilters(lang)

      // Assert
      expect(result).toEqual(mockTranslation)
    })

    it('should return default filters if translation is missing in localStorage', async () => {
      // Arrange
      localStorage.setItem('filtersTranslation', JSON.stringify({}))
      const lang = 'en'

      mockHttpClient.get = jest.fn().mockReturnValue(of({}))

      // Act
      const result = await searchServService.translateSearchFilters(lang)

      // Assert
      expect(result).toEqual({})
    })
  })
})
