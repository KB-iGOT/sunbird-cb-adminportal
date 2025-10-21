import { of } from 'rxjs'
import { SearchServService } from './search-serv.service'
import { SearchApiService } from '../apis/search-api.service'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { HttpClient } from '@angular/common/http'
import { NSSearch } from '@sunbird-cb/collection'

jest.mock('../apis/search-api.service')
jest.mock('@sunbird-cb/utils-v2')
jest.mock('@angular/common/http')

describe('SearchServService', () => {
  let service: SearchServService
  let mockSearchApi: jest.Mocked<SearchApiService>
  let mockConfigSrv: jest.Mocked<ConfigurationsService>
  let mockHttp: jest.Mocked<HttpClient>

  beforeEach(() => {
    mockSearchApi = {
      getSearchAutoCompleteResults: jest.fn(),
      getSearchV6Results: jest.fn(),
      getSearchResults: jest.fn(),
    } as any

    mockConfigSrv = {
      sitePath: 'https://example.com',
      activeOrg: 'testOrg',
      rootOrg: 'testRootOrg',
    } as any

    mockHttp = {
      get: jest.fn(),
    } as any

    service = new SearchServService(
      mockSearchApi,
      mockConfigSrv,
      mockHttp
    )
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('getSearchConfig', () => {
    it('should fetch search config if not already cached', async () => {
      const mockConfig = { search: { tabs: [{ phraseSearch: true }], visibleFilters: {}, excludeSourceFields: [] } }
      mockHttp.get.mockReturnValue(of(mockConfig))

      const result = await service.getSearchConfig()
      expect(mockHttp.get).toHaveBeenCalledWith('https://example.com/feature/search.json')
      expect(result).toEqual(mockConfig)
    })

    it('should return cached config if already fetched', async () => {
      const mockConfig = { search: { tabs: [{ phraseSearch: true }] } }
      mockHttp.get.mockReturnValue(of(mockConfig))

      // First call to cache the config
      await service.getSearchConfig()
      mockHttp.get.mockClear()

      // Second call should use cache
      const result = await service.getSearchConfig()
      expect(mockHttp.get).not.toHaveBeenCalled()
      expect(result).toEqual(mockConfig)
    })
  })

  describe('getApplyPhraseSearch', () => {
    it('should return true when phraseSearch is true in config', async () => {
      jest.spyOn(service, 'getSearchConfig').mockResolvedValue({
        search: { tabs: [{ phraseSearch: true }] }
      })

      const result = await service.getApplyPhraseSearch()
      expect(result).toBe(true)
    })

    it('should return true when phraseSearch is undefined in config', async () => {
      jest.spyOn(service, 'getSearchConfig').mockResolvedValue({
        search: { tabs: [{}] }
      })

      const result = await service.getApplyPhraseSearch()
      expect(result).toBe(true)
    })

    it('should return false when phraseSearch is false in config', async () => {
      jest.spyOn(service, 'getSearchConfig').mockResolvedValue({
        search: { tabs: [{ phraseSearch: false }] }
      })

      const result = await service.getApplyPhraseSearch()
      expect(result).toBe(false)
    })
  })

  describe('searchAutoComplete', () => {
    it('should call API for single language that is not "all"', async () => {
      const mockParams = { q: 'SEARCH', l: 'en' }
      const mockResults: any[] = [{
        _source: { displayName: 'Result 1' },
        _id: '1',
        _index: 'index',
        _type: 'type',
        _score: 1
      }]

      mockSearchApi.getSearchAutoCompleteResults.mockReturnValue(of(mockResults))

      const result = await service.searchAutoComplete(mockParams)

      expect(mockSearchApi.getSearchAutoCompleteResults).toHaveBeenCalledWith({ q: 'search', l: 'en' })
      expect(result).toEqual(mockResults)
    })

    it('should return empty array for multiple languages', async () => {
      const mockParams = { q: 'SEARCH', l: 'en,fr' }

      const result = await service.searchAutoComplete(mockParams)

      expect(mockSearchApi.getSearchAutoCompleteResults).not.toHaveBeenCalled()
      expect(result).toEqual([])
    })

    it('should return empty array for language "all"', async () => {
      const mockParams = { q: 'SEARCH', l: 'all' }

      const result = await service.searchAutoComplete(mockParams)

      expect(mockSearchApi.getSearchAutoCompleteResults).not.toHaveBeenCalled()
      expect(result).toEqual([])
    })
  })

  describe('getLearning', () => {
    it('should call searchV6Wrapper with locale filter for non-all locales', () => {
      const mockRequest = {
        locale: ['en'],
        query: 'test',
        filters: {}
      }

      const mockResponse = { result: [] } as any
      jest.spyOn(service, 'searchV6Wrapper').mockReturnValue(of(mockResponse))

      service.getLearning(mockRequest).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(service.searchV6Wrapper).toHaveBeenCalledWith(mockRequest)
    })

    it('should clear locale filter when locale contains "all"', () => {
      const mockRequest = {
        locale: ['all'],
        query: 'test',
        filters: {}
      }

      const mockResponse = { result: [] } as any
      jest.spyOn(service, 'searchV6Wrapper').mockReturnValue(of(mockResponse))

      service.getLearning(mockRequest).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(service.searchV6Wrapper).toHaveBeenCalledWith({
        ...mockRequest,
        locale: []
      })
    })
  })

  describe('searchV6Wrapper', () => {
    it('should transform request to V6 format and call API', () => {
      const mockRequest: any = {
        locale: ['en'],
        pageNo: 1,
        pageSize: 10,
        query: 'test',
        filters: { contentType: ['Course'] },
        didYouMean: true,
        sort: [{ lastUpdatedOn: 'desc' }]
      }

      const mockConfig = {
        search: {
          visibleFilters: { contentType: ['Course', 'Resource'] },
          excludeSourceFields: ['body']
        }
      }

      jest.spyOn(service, 'getSearchConfig').mockResolvedValue(mockConfig)

      const mockResponse = { result: { content: [] } } as any
      mockSearchApi.getSearchV6Results.mockReturnValue(of(mockResponse))

      service.searchV6Wrapper(mockRequest).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(mockSearchApi.getSearchV6Results).toHaveBeenCalledWith({
        locale: ['en'],
        pageNo: 1,
        pageSize: 10,
        query: 'test',
        didYouMean: true,
        filters: [
          {
            andFilters: [
              { contentType: ['Course'] }
            ]
          }
        ],
        visibleFilters: {},
        includeSourceFields: ['creatorLogo'],
        isStandAlone: undefined,
        sort: [{ lastUpdatedOn: 'desc' }]
      })

      // Verify the search config was applied asynchronously
      setTimeout(() => {
        expect(mockSearchApi.getSearchV6Results.mock.calls[0][0].visibleFilters).toEqual(
          mockConfig.search.visibleFilters
        )
        expect(mockSearchApi.getSearchV6Results.mock.calls[0][0].excludeSourceFields).toEqual(
          mockConfig.search.excludeSourceFields
        )
      }, 0)
    })
  })

  describe('fetchSocialSearchUsers', () => {
    it('should add org and rootOrg to request', () => {
      const mockRequest = { q: 'test' }
      // const mockResponse = { data: [] }
      // mockSearchApi.getSearchResults.mockReturnValue(of(mockResponse))

      // service.fetchSocialSearchUsers(mockRequest).subscribe(response => {
      //   expect(response).toEqual(mockResponse)
      // })

      expect(mockSearchApi.getSearchResults).toHaveBeenCalledWith({
        ...mockRequest,
        org: 'testOrg',
        rootOrg: 'testRootOrg'
      })
    })
  })

  describe('updateSelectedFiltersSet', () => {
    it('should convert filters to a set of filter values', () => {
      const filters = {
        contentType: ['Course', 'Resource'],
        tags: ['Computer/Programming/JavaScript', 'Design']
      }

      const result = service.updateSelectedFiltersSet(filters)

      expect(result.filterSet).toBeInstanceOf(Set)
      expect(result.filterSet.size).toBe(6)
      expect(result.filterSet.has('Course')).toBe(true)
      expect(result.filterSet.has('Resource')).toBe(true)
      expect(result.filterSet.has('Computer')).toBe(true)
      expect(result.filterSet.has('Computer/Programming')).toBe(true)
      expect(result.filterSet.has('Computer/Programming/JavaScript')).toBe(true)
      expect(result.filterSet.has('Design')).toBe(true)
      expect(result.filterReset).toBe(true)
    })

    it('should handle empty filters', () => {
      const filters = {}

      const result = service.updateSelectedFiltersSet(filters)

      expect(result.filterSet).toBeInstanceOf(Set)
      expect(result.filterSet.size).toBe(0)
      expect(result.filterReset).toBe(false)
    })
  })

  describe('transformSearchV6Filters', () => {
    it('should transform v6 filters to simple object format', () => {
      const v6filters: NSSearch.ISearchV6Filters[] = [
        {
          andFilters: [
            { contentType: ['Course'] },
            { status: ['Live'] }
          ]
        }
      ]

      const result = service.transformSearchV6Filters(v6filters)

      expect(result).toEqual({
        contentType: ['Course'],
        status: ['Live']
      })
    })
  })

  describe('handleFilters', () => {
    it('should process filter responses and mark checked items', () => {
      const filters: any = [
        {
          type: 'contentType',
          displayName: 'Content Type',
          content: [
            { displayName: 'Course', type: 'Course', children: [] },
            { displayName: 'Resource', type: 'Resource', children: [] }
          ]
        },
        {
          type: 'concepts',
          displayName: 'Concepts',
          content: [
            { displayName: 'Programming', type: 'Programming', children: [] },
            { displayName: 'Design', type: 'Design', children: [] }
          ]
        },
        {
          type: 'dtLastModified',
          displayName: 'Last Modified',
          content: []
        }
      ]

      const selectedFilters = {
        contentType: ['Course']
      }

      const selectedFilterSet = new Set(['Course'])

      const result = service.handleFilters(filters, selectedFilterSet, selectedFilters)

      // Should extract concepts
      expect(result.concept).toEqual([
        { displayName: 'Programming', type: 'Programming', children: [] },
        { displayName: 'Design', type: 'Design', children: [] }
      ])

      // Should filter out concepts and dtLastModified
      expect(result.filtersRes.length).toBe(1)
      expect(result.filtersRes[0].type).toBe('contentType')

      // Should mark content type filter as checked
      expect(result.filtersRes[0].checked).toBe(true)

      // Should mark Course as checked and Resource as unchecked
      expect(result.filtersRes[0].content[0].checked).toBe(true)
      expect(result.filtersRes[0].content[1].checked).toBe(false)
    })

    it('should handle filter with nested children', () => {
      const filters: any = [
        {
          type: 'tags',
          displayName: 'Tags',
          content: [
            {
              displayName: 'Computer',
              type: 'Computer',
              children: [
                { displayName: 'Programming', type: 'Computer/Programming', children: [] }
              ]
            }
          ]
        }
      ]

      const selectedFilters = {
        tags: ['Computer/Programming']
      }

      const selectedFilterSet = new Set(['Computer/Programming'])

      const result: any = service.handleFilters(filters, selectedFilterSet, selectedFilters)

      // Child should be marked as checked
      expect(result.filtersRes[0].content[0].children[0].checked).toBe(true)
    })
  })

  describe('getLanguageSearchIndex', () => {
    it('should convert zh-CN to zh', () => {
      expect(service.getLanguageSearchIndex('zh-CN')).toBe('zh')
    })

    it('should return the original language for others', () => {
      expect(service.getLanguageSearchIndex('en')).toBe('en')
      expect(service.getLanguageSearchIndex('fr')).toBe('fr')
    })
  })

  describe('translateSearchFilters', () => {
    beforeEach(() => {
      // Mock localStorage
      const localStorageMock: any = (() => {
        let store: any = {}
        return {
          getItem: jest.fn(key => store[key] || null),
          setItem: jest.fn((key, value) => {
            store[key] = value.toString()
          }),
          clear: jest.fn(() => {
            store = {}
          })
        }
      })()

      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock
      })
    })

    it('should fetch translation for single language if not cached', async () => {
      const enTranslations = { contentType: { Course: 'Course' } }
      mockHttp.get.mockReturnValue(of(enTranslations))

      const result = await service.translateSearchFilters('en')

      expect(mockHttp.get).toHaveBeenCalledWith('/apis/protected/v8/translate/filterdata/en')
      expect(result).toEqual(enTranslations)
    })

    it('should use cached translation for single language if available', async () => {
      const cachedTranslations = { en: { contentType: { Course: 'Course' } }, all: {} }
      localStorage.setItem('filtersTranslation', JSON.stringify(cachedTranslations))

      const result = await service.translateSearchFilters('en')

      expect(mockHttp.get).not.toHaveBeenCalled()
      expect(result).toEqual(cachedTranslations.en)
    })

    it('should return english translation for multiple languages', async () => {
      const cachedTranslations = { en: { contentType: { Course: 'Course' } }, all: {} }
      localStorage.setItem('filtersTranslation', JSON.stringify(cachedTranslations))

      const result = await service.translateSearchFilters('en,fr')

      expect(mockHttp.get).not.toHaveBeenCalled()
      expect(result).toEqual(cachedTranslations.en)
    })
  })

  describe('formatFilterForSearch', () => {
    it('should convert filters object to formatted string', () => {
      const filters = {
        contentType: ['Course', 'Resource'],
        status: ['Live']
      }

      const result = service.formatFilterForSearch(filters)

      // Expected format: "contentType":["Course","Resource"]$"status":["Live"]
      expect(result).toContain('"contentType":["Course","Resource"]')
      expect(result).toContain('"status":["Live"]')
      expect(result.split('$').length).toBe(2)
    })

    it('should handle empty filters', () => {
      const filters = {
        contentType: [],
        status: []
      }

      const result = service.formatFilterForSearch(filters)

      expect(result).toBe('')
    })
  })

  describe('getDisplayName', () => {
    it('should return mapped display names for known types', () => {
      expect(service.getDisplayName('automationcentral')).toBe('Tools')
      expect(service.getDisplayName('topics')).toBe('Topics')
      expect(service.getDisplayName('kshop')).toBe('Documents')
      expect(service.getDisplayName('authors.mailid')).toBe('Authors')
    })

    it('should return original type for unknown types', () => {
      expect(service.getDisplayName('unknown')).toBe('unknown')
      expect(service.getDisplayName('customType')).toBe('customType')
    })
  })
})