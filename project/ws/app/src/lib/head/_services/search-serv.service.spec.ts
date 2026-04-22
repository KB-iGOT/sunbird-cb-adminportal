import { HttpClient } from '@angular/common/http'
import { SearchApiService } from './search-api.service'
import { SearchServService } from './search-serv.service'
import { EventService, ConfigurationsService, WsEvents } from '@sunbird-cb/utils-v2'
import { of, Observable } from 'rxjs'
import { NSSearch } from './widget-search.model'

describe('SearchServService', () => {
  let service: SearchServService
  let mockEventService: jest.Mocked<EventService>
  let mockSearchApiService: jest.Mocked<SearchApiService>
  let mockConfigurationsService: jest.Mocked<ConfigurationsService>
  let mockHttpClient: jest.Mocked<HttpClient>

  // Mock localStorage
  const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  }

  beforeAll(() => {
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    })
  })

  beforeEach(() => {
    // Create mocks
    mockEventService = {
      dispatchEvent: jest.fn(),
    } as any

    mockSearchApiService = {
      getSearchAutoCompleteResults: jest.fn(),
      getSearch: jest.fn(),
      getSearchResults: jest.fn(),
    } as any

    mockConfigurationsService = {
      sitePath: '/test-site',
      activeOrg: 'test-org',
      rootOrg: 'test-root-org',
    } as any

    mockHttpClient = {
      get: jest.fn(),
    } as any

    // Create service instance
    service = new SearchServService(
      mockEventService,
      mockSearchApiService,
      mockConfigurationsService,
      mockHttpClient
    )

    // Clear mocks
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockClear()
    mockLocalStorage.setItem.mockClear()
  })

  describe('defaultFiltersTranslated getter', () => {
    it('should return default filters structure', () => {
      const result = service.defaultFiltersTranslated
      expect(result).toEqual({ en: {}, all: {} })
    })
  })

  describe('getSearchConfig', () => {
    it('should fetch and cache search config', async () => {
      const mockConfig = { search: { tabs: [{ phraseSearch: true }] } }
      mockHttpClient.get.mockReturnValue(of(mockConfig))

      const result = await service.getSearchConfig()

      expect(mockHttpClient.get).toHaveBeenCalledWith('/test-site/feature/search.json')
      expect(result).toEqual(mockConfig)
      expect(service.searchConfig).toEqual(mockConfig)
    })

    it('should return cached config on subsequent calls', async () => {
      const mockConfig = { search: { tabs: [{ phraseSearch: true }] } }
      service.searchConfig = mockConfig

      const result = await service.getSearchConfig()

      expect(mockHttpClient.get).not.toHaveBeenCalled()
      expect(result).toEqual(mockConfig)
    })
  })

  describe('getApplyPhraseSearch', () => {
    it('should return true when phraseSearch is true', async () => {
      const mockConfig = { search: { tabs: [{ phraseSearch: true }] } }
      service.searchConfig = mockConfig

      const result = await service.getApplyPhraseSearch()

      expect(result).toBe(true)
    })

    it('should return true when phraseSearch is undefined', async () => {
      const mockConfig = { search: { tabs: [{}] } }
      service.searchConfig = mockConfig

      const result = await service.getApplyPhraseSearch()

      expect(result).toBe(true)
    })

    it('should return false when phraseSearch is false', async () => {
      const mockConfig = { search: { tabs: [{ phraseSearch: false }] } }
      service.searchConfig = mockConfig

      const result = await service.getApplyPhraseSearch()

      expect(result).toBe(false)
    })
  })

  describe('searchAutoComplete', () => {
    it('should convert query to lowercase and return empty array', async () => {
      const params = { q: 'TEST QUERY', l: 'en' }

      const result = await service.searchAutoComplete(params)

      expect(params.q).toBe('test query')
      expect(result).toEqual([])
    })
  })

  describe('getLearning', () => {
    it('should call searchV6Wrapper with request', () => {
      service.searchConfig = {
        search: {
          visibleFiltersV2: { contentType: {}, tags: {} }
        }
      }
      const mockRequest = { query: 'test', filters: {} }
      mockSearchApiService.getSearch.mockReturnValue(of({ result: [] } as any))

      const result = service.getLearning(mockRequest)

      expect(result).toBeDefined()
    })
  })

  describe('searchV6Wrapper', () => {
    it('should create v6 request and call search API', () => {
      const mockRequest = {
        query: 'test query',
        filters: { contentType: ['Course'] },
        lastUpdatedOn: 'desc',
        fields: ['name', 'description']
      }

      service.searchConfig = {
        search: {
          visibleFiltersV2: { contentType: {}, tags: {} }
        }
      }

      const expectedV6Request: any = {
        request: {
          query: 'test query',
          filters: { contentType: ['Course'] },
          sort_by: { lastUpdatedOn: 'desc' },
          facets: ['contentType', 'tags'],
          fields: ['name', 'description']
        }
      }

      const mockResponse = { result: [] } as any
      mockSearchApiService.getSearch.mockReturnValue(of(mockResponse))

      const result = service.searchV6Wrapper(mockRequest)

      expect(mockSearchApiService.getSearch).toHaveBeenCalledWith(expectedV6Request)
      expect(result).toBeInstanceOf(Observable)
    })
  })

  describe('fetchSocialSearchUsers', () => {
    it('should add org info to request and call search API', () => {
      const mockRequest = { query: 'user', type: 'social' }
      const expectedRequest = {
        org: 'test-org',
        rootOrg: 'test-root-org',
        query: 'user',
        type: 'social'
      }

      const mockResponse = { users: [] }
      mockSearchApiService.getSearchResults.mockReturnValue(of(mockResponse))

      const result = service.fetchSocialSearchUsers(mockRequest)

      expect(mockSearchApiService.getSearchResults).toHaveBeenCalledWith(expectedRequest)
      expect(result).toBeInstanceOf(Observable)
    })
  })

  describe('fetchSearchDataDocs', () => {
    it('should return empty string', () => {
      const result = service.fetchSearchDataDocs({})
      expect(result).toBe('')
    })
  })

  describe('fetchSearchDataProjects', () => {
    it('should return empty string', () => {
      const result = service.fetchSearchDataProjects({})
      expect(result).toBe('')
    })
  })

  describe('updateSelectedFiltersSet', () => {
    it('should create filter set from regular filters', () => {
      const filters = {
        contentType: ['Course', 'Resource'],
        duration: ['Medium']
      }

      const result = service.updateSelectedFiltersSet(filters)

      expect(result.filterSet).toEqual(new Set(['Course', 'Resource', 'Medium']))
      expect(result.filterReset).toBe(true)
    })

    it('should handle tags with hierarchical structure', () => {
      const filters = {
        tags: ['parent/child', 'parent/child/grandchild'],
        contentType: ['Course']
      }

      const result = service.updateSelectedFiltersSet(filters)

      expect(result.filterSet).toEqual(new Set([
        'parent', 'parent/child', 'parent', 'parent/child', 'parent/child/grandchild', 'Course'
      ]))
      expect(result.filterReset).toBe(true)
    })

    it('should return empty set when no filters', () => {
      const result = service.updateSelectedFiltersSet({})

      expect(result.filterSet).toEqual(new Set())
      expect(result.filterReset).toBe(false)
    })

    it('should handle null/undefined filters', () => {
      const result = service.updateSelectedFiltersSet(null as any)

      expect(result.filterSet).toEqual(new Set())
      expect(result.filterReset).toBe(false)
    })

    it('should handle empty filter arrays', () => {
      const filters = {
        contentType: [],
        tags: []
      }

      const result = service.updateSelectedFiltersSet(filters)

      expect(result.filterSet).toEqual(new Set())
      expect(result.filterReset).toBe(false)
    })
  })

  describe('transformSearchV6Filters', () => {
    it('should transform v6 filters to flat structure', () => {
      const v6filters: NSSearch.ISearchV6Filters[] = [
        {
          andFilters: [
            { contentType: ['Course'] },
            { tags: ['programming'] }
          ]
        },
        {
          andFilters: [
            { duration: ['Medium'] }
          ]
        }
      ]

      const result = service.transformSearchV6Filters(v6filters)

      expect(result).toEqual({
        contentType: ['Course'],
        tags: ['programming'],
        duration: ['Medium']
      })
    })

    it('should handle filters without andFilters', () => {
      const v6filters: NSSearch.ISearchV6Filters[] = [
        {} as NSSearch.ISearchV6Filters
      ]

      const result = service.transformSearchV6Filters(v6filters)

      expect(result).toEqual({})
    })
  })

  describe('handleFilters', () => {
    it('should process filters and return formatted response', () => {
      const filters = [
        {
          type: 'contentType',
          content: [
            { type: 'Course', count: 10 },
            { type: 'Resource', count: 5 }
          ]
        },
        {
          type: 'concepts',
          content: Array(15).fill({ type: 'concept', count: 1 })
        },
        {
          type: 'dtLastModified',
          content: [{ type: 'recent', count: 3 }]
        }
      ]

      const selectedFilterSet = new Set(['Course'])
      const selectedFilters = { contentType: ['Course'] }

      const result = service.handleFilters(filters, selectedFilterSet, selectedFilters)

      expect(result.concept).toHaveLength(10) // Limited to 10
      expect(result.filtersRes).toHaveLength(1) // Excludes concepts and dtLastModified
      expect(result.filtersRes[0].checked).toBe(true)
      expect(result.filtersRes[0].content[0].checked).toBe(true)
      expect(result.filtersRes[0].content[1].checked).toBe(false)
    })

    it('should handle filters with children', () => {
      const filters = [
        {
          type: 'tags',
          content: [
            {
              type: 'parent',
              count: 10,
              children: [
                { type: 'child1', count: 5 },
                { type: 'child2', count: 3 }
              ]
            }
          ]
        }
      ]

      const selectedFilterSet = new Set(['child1'])
      const selectedFilters = { tags: ['child1'] }

      const result = service.handleFilters(filters, selectedFilterSet, selectedFilters)

      expect(result.filtersRes[0].content[0].children).toHaveLength(2)
      expect(result.filtersRes[0].content[0].children[0].checked).toBe(true)
      expect(result.filtersRes[0].content[0].children[1].checked).toBe(false)
    })

    it('should handle showContentType parameter', () => {
      const filters = [
        { type: 'contentType', content: [] },
        { type: 'tags', content: [] }
      ]

      const result = service.handleFilters(filters, new Set(), {}, true)

      expect(result.filtersRes).toHaveLength(1) // contentType filtered out
      expect(result.filtersRes[0].type).toBe('tags')
    })

    it('should handle non-array children', () => {
      const filters = [
        {
          type: 'tags',
          content: [
            {
              type: 'parent',
              count: 10,
              children: null
            }
          ]
        }
      ]

      const result = service.handleFilters(filters, new Set(), {})

      expect(result.filtersRes[0].content[0].children).toEqual([])
    })
  })

  describe('setTilesDocs', () => {
    it('should format document response into tiles', () => {
      const response = [
        {
          authors: ['John Doe'],
          category: 'Technical',
          description: 'Test document',
          itemId: '123',
          itemType: 'Document',
          noOfViews: 100,
          isAccessRestricted: 'Y',
          source: 'kshop',
          title: 'Test Title',
          topics: ['Programming'],
          url: 'http://example.com',
          dateCreated: '2023-01-01',
          sourceId: 1
        },
        {
          authors: [],
          source: 'other',
          dateCreated: null
        }
      ]

      const result = service.setTilesDocs(response)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        author: ['John Doe'],
        category: 'Technical',
        description: 'Test document',
        itemId: '123',
        itemType: 'Document',
        noOfViews: 100,
        restricted: 'Y',
        source: 'kshop',
        title: 'Test Title',
        topics: ['Programming'],
        url: 'http://example.com',
        dateCreated: new Date('2023-01-01'),
        color: '3px solid #f26522',
        sourceId: 1
      })
      expect(result[1].color).toBe('3px solid #28a9b2')
      expect(result[1].dateCreated).toBeInstanceOf(Date)
    })

    it('should handle empty/null response', () => {
      expect(() => service.setTilesDocs([])).not.toThrow()
    })

    it('should throw error when processing fails', () => {
      const invalidResponse = [{ invalidProperty: true }]

      expect(() => service.setTilesDocs(invalidResponse)).toThrow()
    })
  })

  describe('setTileProject', () => {
    it('should format project response into tiles', () => {
      const response = [
        {
          pm: ['Project Manager'],
          dm: ['Delivery Manager'],
          mstObjectives: 'Test objectives',
          risks: ['Risk 1'],
          contributions: ['Contribution 1'],
          mstProjectScope: 'Project scope',
          mstBusinessContext: 'Business context',
          itemId: 'proj-123',
          isAccessRestricted: 'N',
          mstProjectName: 'Test Project',
          topics: ['Management'],
          dateStartDate: '2023-01-01'
        }
      ]

      const result = service.setTileProject(response)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        pm: ['Project Manager'],
        dm: ['Delivery Manager'],
        objectives: 'Test objectives',
        risks: ['Risk 1'],
        contribution: ['Contribution 1'],
        category: 'Project',
        projectScope: 'Project scope',
        businessContext: 'Business context',
        itemId: 'proj-123',
        restricted: 'N',
        source: 'PROMT',
        title: 'Test Project',
        topics: ['Management'],
        url: '',
        dateCreated: new Date('2023-01-01'),
        color: '3px solid #e94a48',
        sourceId: 0
      })
    })

    it('should handle empty response', () => {
      expect(() => service.setTileProject([])).not.toThrow()
    })

    it('should handle data with missing fields gracefully', () => {
      const invalidResponse = [{ invalidProperty: true }]
      // The function handles missing fields with defaults (|| []) and does not throw
      expect(() => service.setTileProject(invalidResponse)).not.toThrow()
    })
  })

  describe('formatKhubFilters', () => {
    it('should format filters for display', () => {
      const filters = {
        contentType: [
          { key: 'Course', doc_count: 10 },
          { key: 'Resource', doc_count: 5 }
        ],
        topics: [
          { key: 'Programming', doc_count: 8 }
        ]
      }

      const result = service.formatKhubFilters(filters)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        type: 'contentType',
        displayName: 'contentType',
        content: [
          { count: 10, displayName: 'Course', type: 'Course' },
          { count: 5, displayName: 'Resource', type: 'Resource' }
        ]
      })
    })

    it('should handle empty filters', () => {
      expect(() => service.formatKhubFilters({})).not.toThrow()
    })

    it('should throw error when processing fails', () => {
      const invalidFilters = { invalidKey: null }

      expect(() => service.formatKhubFilters(invalidFilters)).toThrow()
    })
  })

  describe('fetchContentOfFilter', () => {
    it('should format filter content', () => {
      const filter = [
        { key: 'Course', doc_count: 10 },
        { key: 'Resource', doc_count: 5 }
      ]

      const result = service.fetchContentOfFilter(filter)

      expect(result).toEqual([
        { count: 10, displayName: 'Course', type: 'Course' },
        { count: 5, displayName: 'Resource', type: 'Resource' }
      ])
    })
  })

  describe('formatFilterForSearch', () => {
    it('should format filters for search string', () => {
      const filters = {
        contentType: ['Course', 'Resource'],
        tags: ['programming']
      }

      const result = service.formatFilterForSearch(filters)

      expect(result).toBe('"contentType":["Course","Resource"]$"tags":["programming"]')
    })

    it('should handle empty filters', () => {
      const result = service.formatFilterForSearch({})
      expect(result).toBe('')
    })

    it('should handle single item arrays', () => {
      const filters = { contentType: ['Course'] }
      const result = service.formatFilterForSearch(filters)
      expect(result).toBe('"contentType":["Course"]')
    })

    it('should handle empty arrays', () => {
      const filters = { contentType: [] }
      const result = service.formatFilterForSearch(filters)
      expect(result).toBe('')
    })

    it('should handle filters with object values without throwing', () => {
      const invalidFilters: any = { key: [{ invalid: 'object' }] }
      // The function converts objects to strings and does not throw
      expect(() => service.formatFilterForSearch(invalidFilters)).not.toThrow()
    })
  })

  describe('getDisplayName', () => {
    const testCases = [
      { input: 'automationcentral', expected: 'Tools' },
      { input: 'autogeneratedtopic', expected: 'Topics' },
      { input: 'topics', expected: 'Topics' },
      { input: 'kshopdocument', expected: 'Kshop Document' },
      { input: 'project', expected: 'Project References' },
      { input: 'kshop', expected: 'Documents' },
      { input: 'itemtype', expected: 'Item Type' },
      { input: 'authors.mailid', expected: 'Authors' },
      { input: 'mstlocation', expected: 'Location' },
      { input: 'status', expected: 'Project Status' },
      { input: 'marketing', expected: 'Marketing' },
      { input: 'unknown', expected: 'unknown' },
      { input: 'AUTOMATIONCENTRAL', expected: 'Tools' }, // Test case sensitivity
    ]

    testCases.forEach(({ input, expected }) => {
      it(`should return "${expected}" for "${input}"`, () => {
        expect(service.getDisplayName(input)).toBe(expected)
      })
    })
  })

  describe('getLanguageSearchIndex', () => {
    it('should return "zh" for "zh-CN"', () => {
      expect(service.getLanguageSearchIndex('zh-CN')).toBe('zh')
    })

    it('should return same language for other codes', () => {
      expect(service.getLanguageSearchIndex('en')).toBe('en')
      expect(service.getLanguageSearchIndex('fr')).toBe('fr')
    })
  })

  describe('raiseSearchEvent', () => {
    it('should dispatch search telemetry event', () => {
      const query = 'test query'
      const filters = { contentType: ['Course'] }
      const locale = 'en'

      service.raiseSearchEvent(query, filters, locale)

      expect(mockEventService.dispatchEvent).toHaveBeenCalledWith({
        eventType: WsEvents.WsEventType.Telemetry,
        eventLogLevel: WsEvents.WsEventLogLevel.Warn,
        data: {
          eventSubType: WsEvents.EnumTelemetrySubType.Interact,
          object: { query, filters, locale },
          type: 'search',
        },
        from: 'search',
        to: 'telemetry',
      })
    })
  })

  describe('raiseSearchResponseEvent', () => {
    it('should dispatch search response telemetry event', () => {
      const query = 'test query'
      const filters = { contentType: ['Course'] }
      const totalHits = 25
      const locale = 'en'

      service.raiseSearchResponseEvent(query, filters, totalHits, locale)

      expect(mockEventService.dispatchEvent).toHaveBeenCalledWith({
        eventType: WsEvents.WsEventType.Telemetry,
        eventLogLevel: WsEvents.WsEventLogLevel.Warn,
        data: {
          query,
          filters,
          locale,
          eventSubType: WsEvents.EnumTelemetrySubType.Search,
          size: totalHits,
          type: 'search',
        },
        from: 'search',
        to: 'telemetry',
      })
    })
  })

  describe('translateSearchFilters', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockClear()
      mockLocalStorage.setItem.mockClear()
    })

    it('should return cached translation for existing language', async () => {
      const mockTranslations = {
        en: { filter1: 'Filter 1' },
        fr: { filter1: 'Filtre 1' },
        all: {}
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockTranslations))

      const result = await service.translateSearchFilters('fr')

      expect(result).toEqual({ filter1: 'Filtre 1' })
      expect(mockHttpClient.get).not.toHaveBeenCalled()
    })

    it('should fetch and cache new translation', async () => {
      const mockTranslations = { en: {}, all: {} }
      const newTranslation = { filter1: 'Neue Filter' }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockTranslations))
      mockHttpClient.get.mockReturnValue(of(newTranslation))

      const result = await service.translateSearchFilters('de')

      expect(mockHttpClient.get).toHaveBeenCalledWith('/apis/protected/v8/translate/filterdata/de')
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(2)
      expect(result).toEqual(newTranslation)
    })

    it('should return English translation for multiple languages', async () => {
      const mockTranslations = {
        en: { filter1: 'Filter 1' },
        all: {}
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockTranslations))

      const result = await service.translateSearchFilters('en,fr')

      expect(result).toEqual({ filter1: 'Filter 1' })
      expect(mockHttpClient.get).not.toHaveBeenCalled()
    })

    it('should handle empty localStorage', async () => {
      // When localStorage returns null, defaultFiltersTranslated ({en:{},all:{}}) is used
      // Since 'en' already exists in defaults, setItem is NOT called and result is {}
      mockLocalStorage.getItem.mockReturnValue(null)

      const result = await service.translateSearchFilters('en')

      expect(result).toEqual({})
    })

    it('should return empty object when English translation not available', async () => {
      const mockTranslations = { all: {} }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockTranslations))

      const result = await service.translateSearchFilters('en,fr,de')

      expect(result).toEqual({})
    })
  })

  describe('Service Properties', () => {
    it('should initialize properties correctly', () => {
      expect(service.progressHash).toEqual({})
      expect(service.progressHashSubject).toBeUndefined()
      expect(service.isFetchingProgress).toBe(false)
      expect(service.searchConfig).toBeNull()
    })

    it('should allow setting progressHash', () => {
      service.progressHash = { '123': 50, '456': 100 }
      expect(service.progressHash).toEqual({ '123': 50, '456': 100 })
    })

    it('should allow setting isFetchingProgress', () => {
      service.isFetchingProgress = true
      expect(service.isFetchingProgress).toBe(true)
    })
  })
})