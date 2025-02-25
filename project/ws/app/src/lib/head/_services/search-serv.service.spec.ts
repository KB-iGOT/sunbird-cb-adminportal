import { HttpClient } from '@angular/common/http'
import { SearchApiService } from './search-api.service'
import { ConfigurationsService, EventService } from '@sunbird-cb/utils'
import { SearchServService } from './search-serv.service'

// Define the mock searchConfig type structure
interface MockSearchConfig {
  search: {
    tabs: { phraseSearch: boolean }[]
  }
}

describe('SearchServService', () => {
  let searchServService: SearchServService
  let mockHttp: jest.Mocked<HttpClient>
  let mockSearchApiService: jest.Mocked<SearchApiService>
  let mockConfigSrv: jest.Mocked<ConfigurationsService>
  let mockEventService: jest.Mocked<EventService>

  beforeEach(() => {
    mockHttp = { get: jest.fn() } as any
    mockSearchApiService = { getSearch: jest.fn(), getSearchResults: jest.fn() } as any
    mockConfigSrv = { sitePath: 'https://dummyapi.com', activeOrg: 'org1', rootOrg: 'rootOrg' } as any
    mockEventService = { dispatchEvent: jest.fn() } as any

    searchServService = new SearchServService(
      mockEventService,
      mockSearchApiService,
      mockConfigSrv,
      mockHttp
    )
  })

  describe('getSearchConfig', () => {
    it('should fetch and return search config when it is not already fetched', async () => {
      // Create the mock search config with the correct structure
      const mockConfig: MockSearchConfig = {
        search: {
          tabs: [{ phraseSearch: true }]
        }
      }

      // Mock the HTTP request to return the mock config
      // mockHttp.get.mockResolvedValueOnce(mockConfig)

      const result = await searchServService.getSearchConfig()

      expect(mockHttp.get).toHaveBeenCalledWith('https://dummyapi.com/feature/search.json')
      expect(result).toEqual(mockConfig)
    })

    it('should return the cached search config if already fetched', async () => {
      const mockConfig: MockSearchConfig = { search: { tabs: [{ phraseSearch: true }] } }
      searchServService['searchConfig'] = mockConfig // Manually set the searchConfig for the test.

      const result = await searchServService.getSearchConfig()

      expect(mockHttp.get).not.toHaveBeenCalled()
      expect(result).toEqual(mockConfig)
    })
  })

  describe('getApplyPhraseSearch', () => {
    it('should return true if phraseSearch is enabled in the config', async () => {
      // const mockConfig: MockSearchConfig = { search: { tabs: [{ phraseSearch: true }] } }
      // mockHttp.get.mockResolvedValueOnce(mockConfig)

      const result = await searchServService.getApplyPhraseSearch()

      expect(result).toBe(true)
    })

    it('should return false if phraseSearch is disabled in the config', async () => {
      // const mockConfig: MockSearchConfig = { search: { tabs: [{ phraseSearch: false }] } }
      // mockHttp.get.mockResolvedValueOnce(mockConfig)

      const result = await searchServService.getApplyPhraseSearch()

      expect(result).toBe(false)
    })
  })
})
