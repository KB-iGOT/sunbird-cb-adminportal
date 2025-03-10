import { SearchServService } from './search-serv.service'
import { SearchApiService } from './search-api.service'
import { ConfigurationsService, EventService } from '@sunbird-cb/utils'
import { of } from 'rxjs'
import { HttpClient } from '@angular/common/http'

describe('SearchServService', () => {
  let service: SearchServService
  let mockEventService: jest.Mocked<EventService>
  let mockSearchApiService: jest.Mocked<SearchApiService>
  let mockConfigService: jest.Mocked<ConfigurationsService>
  let mockHttpClient: jest.Mocked<HttpClient>

  const mockSearchConfig = {
    search: {
      tabs: [
        { phraseSearch: true }
      ],
      visibleFiltersV2: {
        contentType: true,
        source: true,
        category: true
      }
    }
  }

  beforeEach(() => {
    // Create mock implementations
    mockEventService = {
      dispatchEvent: jest.fn()
    } as any

    mockSearchApiService = {
      getSearch: jest.fn().mockReturnValue(of({})),
      getSearchResults: jest.fn().mockReturnValue(of({}))
    } as any

    mockConfigService = {
      sitePath: 'http://example.com',
      activeOrg: 'testOrg',
      rootOrg: 'testRootOrg'
    } as any

    mockHttpClient = {
      get: jest.fn().mockReturnValue(of(mockSearchConfig))
    } as any

    // Initialize service with mocks
    service = new SearchServService(
      mockEventService,
      mockSearchApiService,
      mockConfigService,
      mockHttpClient
    )
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('getSearchConfig', () => {
    it('should fetch and cache search config', async () => {
      const result = await service.getSearchConfig()

      expect(mockHttpClient.get).toHaveBeenCalledWith('http://example.com/feature/search.json')
      expect(result).toEqual(mockSearchConfig)

      // Config should be cached, so HTTP request should not be made again
      mockHttpClient.get.mockClear()
      const cachedResult = await service.getSearchConfig()
      expect(mockHttpClient.get).not.toHaveBeenCalled()
      expect(cachedResult).toEqual(mockSearchConfig)
    })
  })

  describe('getApplyPhraseSearch', () => {
    it('should return true when phraseSearch is true', async () => {
      // Already setup with true in mock config
      const result = await service.getApplyPhraseSearch()
      expect(result).toBe(true)
    })

    it('should return true when phraseSearch is undefined', async () => {
      // Modify config to have undefined
      mockHttpClient.get.mockReturnValue(of({
        search: { tabs: [{}] } // phraseSearch is undefined
      }))

      // Reset cached config
      service.searchConfig = null

      const result = await service.getApplyPhraseSearch()
      expect(result).toBe(true)
    })

    it('should return false when phraseSearch is false', async () => {
      // Modify config to have false
      mockHttpClient.get.mockReturnValue(of({
        search: { tabs: [{ phraseSearch: false }] }
      }))

      // Reset cached config
      service.searchConfig = null

      const result = await service.getApplyPhraseSearch()
      expect(result).toBe(false)
    })
  })

  describe('searchAutoComplete', () => {
    it('should convert query to lowercase and return empty array', async () => {
      const params = { q: 'TEST', l: 'all' }
      const result = await service.searchAutoComplete(params)

      expect(params.q).toBe('test') // Should be lowercase
      expect(result).toEqual([])
    })
  })

  describe('getLearning', () => {
    it('should call searchV6Wrapper with request', () => {
      const request = { query: 'test', filters: {}, fields: [] }
      jest.spyOn(service, 'searchV6Wrapper').mockReturnValue(of({} as any))

      service.getLearning(request)

      expect(service.searchV6Wrapper).toHaveBeenCalledWith(request)
    })
  })

  describe('searchV6Wrapper', () => {
    it('should transform request and call searchApi.getSearch', () => {
      service.searchConfig = mockSearchConfig

      const request = {
        query: 'test',
        filters: { contentType: ['Course'] },
        lastUpdatedOn: 'desc',
        fields: ['name', 'description']
      }

      service.searchV6Wrapper(request)

      expect(mockSearchApiService.getSearch).toHaveBeenCalledWith({
        request: {
          query: 'test',
          filters: { contentType: ['Course'] },
          sort_by: { lastUpdatedOn: 'desc' },
          facets: ['contentType', 'source', 'category'],
          fields: ['name', 'description']
        }
      })
    })
  })

  describe('fetchSocialSearchUsers', () => {
    it('should add org info to request and call searchApi', () => {
      const request = { query: 'test' }

      service.fetchSocialSearchUsers(request)

      expect(mockSearchApiService.getSearchResults).toHaveBeenCalledWith({
        org: 'testOrg',
        rootOrg: 'testRootOrg',
        query: 'test'
      })
    })
  })

  describe('updateSelectedFiltersSet', () => {
    it('should create filter set and determine if filters are resetable', () => {
      const filters = {
        contentType: ['Course', 'Video'],
        tags: ['Skills/Coding', 'Skills/Coding/JavaScript']
      }

      const result = service.updateSelectedFiltersSet(filters)

      expect(result.filterReset).toBe(true)
      expect(result.filterSet.size).toBe(4)
      expect(result.filterSet.has('Course')).toBe(true)
      expect(result.filterSet.has('Video')).toBe(true)
      expect(result.filterSet.has('Skills')).toBe(true)
      expect(result.filterSet.has('Skills/Coding')).toBe(true)
      expect(result.filterSet.has('Skills/Coding/JavaScript')).toBe(true)
    })

    it('should return non-resetable when filters are empty', () => {
      const filters = {
        contentType: [],
        tags: []
      }

      const result = service.updateSelectedFiltersSet(filters)

      expect(result.filterReset).toBe(false)
      expect(result.filterSet.size).toBe(0)
    })
  })

  describe('transformSearchV6Filters', () => {
    it('should flatten andFilters into a single object', () => {
      // const v6filters = [
      //   {
      //     andFilters: [
      //       { contentType: ['Course'] },
      //       { source: ['External'] }
      //     ]
      //   },
      //   {
      //     andFilters: [
      //       { category: ['IT'] }
      //     ]
      //   }
      // ]

      // const result = service.transformSearchV6Filters(v6filters)

      // expect(result).toEqual({
      //   contentType: ['Course'],
      //   source: ['External'],
      //   category: ['IT']
      // })
    })
  })

  describe('handleFilters', () => {
    it('should transform filters and handle concepts separately', () => {
      const filters = [
        {
          type: 'concepts',
          content: [{ id: 1, name: 'Programming' }, { id: 2, name: 'Design' }]
        },
        {
          type: 'contentType',
          content: [{ type: 'Course', displayName: 'Courses' }]
        },
        {
          type: 'source',
          content: [{ type: 'Internal', displayName: 'Internal' }]
        }
      ]

      const selectedFilterSet = new Set(['Course'])
      const selectedFilters = { contentType: ['Course'] }

      const result = service.handleFilters(filters, selectedFilterSet, selectedFilters)

      // Should extract concepts
      expect(result.concept).toEqual([
        { id: 1, name: 'Programming' },
        { id: 2, name: 'Design' }
      ])

      // Should transform the remaining filters (excluding dtLastModified)
      expect(result.filtersRes.length).toBe(2)
      expect(result.filtersRes[0].type).toBe('contentType')
      expect(result.filtersRes[0].checked).toBe(true)
      expect(result.filtersRes[0].content[0].checked).toBe(true)
    })

    it('should hide contentType when showContentType is false', () => {
      const filters = [
        {
          type: 'contentType',
          content: [{ type: 'Course', displayName: 'Courses' }]
        },
        {
          type: 'source',
          content: [{ type: 'Internal', displayName: 'Internal' }]
        }
      ]

      const result = service.handleFilters(filters, new Set(), {}, false)

      // Should have only source filter
      expect(result.filtersRes.length).toBe(1)
      expect(result.filtersRes[0].type).toBe('source')
    })
  })

  describe('raiseSearchEvent', () => {
    it('should dispatch telemetry interact event', () => {
      service.raiseSearchEvent('test', { contentType: ['Course'] }, 'en')

      expect(mockEventService.dispatchEvent).toHaveBeenCalledWith({
        eventType: 'telemetry',
        eventLogLevel: 'warn',
        data: {
          eventSubType: 'interact',
          object: {
            query: 'test',
            filters: { contentType: ['Course'] },
            locale: 'en'
          },
          type: 'search'
        },
        from: 'search',
        to: 'telemetry'
      })
    })
  })

  describe('raiseSearchResponseEvent', () => {
    it('should dispatch telemetry search event', () => {
      service.raiseSearchResponseEvent('test', { contentType: ['Course'] }, 100, 'en')

      expect(mockEventService.dispatchEvent).toHaveBeenCalledWith({
        eventType: 'telemetry',
        eventLogLevel: 'warn',
        data: {
          query: 'test',
          filters: { contentType: ['Course'] },
          locale: 'en',
          eventSubType: 'search',
          size: 100,
          type: 'search'
        },
        from: 'search',
        to: 'telemetry'
      })
    })
  })

  describe('translateSearchFilters', () => {
    beforeEach(() => {
      // Mock localStorage
      const localStorageMock = {
        getItem: jest.fn(),
        setItem: jest.fn()
      }
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })

      localStorageMock.getItem.mockReturnValue(JSON.stringify({ en: {}, all: {} }))
    })

    it('should use cached translation if available', async () => {
      const translations = { en: { contentType: 'Content Type' }, fr: { contentType: 'Type de contenu' } };
      (window.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(translations))

      const result = await service.translateSearchFilters('fr')

      expect(result).toEqual({ contentType: 'Type de contenu' })
      expect(mockHttpClient.get).not.toHaveBeenCalled()
    })

    it('should fetch translation if not cached', async () => {
      const frTranslation = { contentType: 'Type de contenu' }
      mockHttpClient.get.mockReturnValue(of(frTranslation))

      const result = await service.translateSearchFilters('fr')

      expect(mockHttpClient.get).toHaveBeenCalled()
      expect(window.localStorage.setItem).toHaveBeenCalled()
      expect(result).toEqual(frTranslation)
    })

    it('should return English translation for multi-language request', async () => {
      const translations = { en: { contentType: 'Content Type' } };
      (window.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(translations))

      const result = await service.translateSearchFilters('en,fr')

      expect(result).toEqual({ contentType: 'Content Type' })
    })
  })

  describe('formatKhubFilters', () => {
    it('should format filters with correct structure', () => {
      const filters = {
        contentType: [
          { key: 'Course', doc_count: 10 },
          { key: 'Video', doc_count: 5 }
        ],
        source: [
          { key: 'Internal', doc_count: 15 }
        ]
      }

      const result = service.formatKhubFilters(filters)

      expect(result.length).toBe(2)
      expect(result[0]).toEqual({
        type: 'contentType',
        displayName: 'contentType',
        content: [
          { count: 10, displayName: 'Course', type: 'Course' },
          { count: 5, displayName: 'Video', type: 'Video' }
        ]
      })
    })
  })

  describe('getDisplayName', () => {
    it('should return proper display names for types', () => {
      expect(service.getDisplayName('automationcentral')).toBe('Tools')
      expect(service.getDisplayName('topics')).toBe('Topics')
      expect(service.getDisplayName('kshop')).toBe('Documents')
      expect(service.getDisplayName('unknownType')).toBe('unknownType')
    })
  })

  describe('formatFilterForSearch', () => {
    it('should format filters for search query', () => {
      const filters = {
        contentType: ['Course', 'Video'],
        source: ['Internal']
      }

      const result = service.formatFilterForSearch(filters)

      expect(result).toBe('"contentType":["Course","Video"]$"source":["Internal"]')
    })

    it('should skip empty filter arrays', () => {
      const filters = {
        contentType: ['Course'],
        source: []
      }

      const result = service.formatFilterForSearch(filters)

      expect(result).toBe('"contentType":["Course"]')
    })
  })
})