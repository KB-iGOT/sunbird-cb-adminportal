import { LearningComponent } from './learning.component'
import { of, Subject } from 'rxjs'

describe('LearningComponent', () => {
    let component: LearningComponent
    let mockActivatedRoute: any
    let mockRouter: any
    let mockValueService: any
    let mockSearchService: any
    let mockConfigService: any
    let mockUtilityService: any

    const mockQueryParamMap = new Map<string, string>()
    mockQueryParamMap.set('q', 'test query')
    mockQueryParamMap.set('f', '{"contentType":["Course"]}')
    mockQueryParamMap.set('sort', 'lastUpdatedOn')

    beforeEach(() => {
        // Set up mocks for dependencies
        mockActivatedRoute = {
            snapshot: {
                data: {
                    pageData: {
                        data: {
                            search: {
                                tabs: [
                                    {
                                        titleKey: 'learning',
                                        searchQuery: {
                                            filters: { resourceType: ['Course'] }
                                        },
                                        phraseSearch: true,
                                        isStandAlone: true,
                                        acrossPreferredLang: false
                                    }
                                ]
                            }
                        }
                    },
                    pageroute: 'learning'
                },
                queryParamMap: {
                    get: jest.fn((key) => mockQueryParamMap.get(key)),
                    has: jest.fn((key) => mockQueryParamMap.has(key))
                }
            },
            queryParamMap: of({
                get: (key: string) => mockQueryParamMap.get(key),
                has: (key: string) => mockQueryParamMap.has(key)
            }),
            parent: {}
        }

        mockRouter = {
            navigate: jest.fn()
        }

        mockValueService = {
            isLtMedium$: of(false)
        }

        mockSearchService = {
            getLearning: jest.fn(() => of({
                totalHits: 10,
                result: [{ identifier: '1' }, { identifier: '2' }],
                filters: [],
                filtersUsed: [],
                notVisibleFilters: [],
                doYouMean: [],
                queryUsed: 'test query'
            })),
            translateSearchFilters: jest.fn(() => Promise.resolve({})),
            updateSelectedFiltersSet: jest.fn(() => ({ filterSet: new Set(), filterReset: true })),
            handleFilters: jest.fn(() => ({ filtersRes: [] })),
            getLanguageSearchIndex: jest.fn((locale) => locale || 'en'),
            searchConfig: {}
        }

        mockConfigService = {
            prefChangeNotifier: new Subject(),
            isIntranetAllowed: true,
            userPreference: {
                selectedLocale: 'en',
                selectedLangGroup: 'en'
            },
            activeLocale: {
                locals: ['en']
            }
        }

        mockUtilityService = {
            isMobile: false
        }

        // Create component instance with mocked dependencies
        component = new LearningComponent(
            mockActivatedRoute as any,
            mockRouter as any,
            mockValueService as any,
            mockSearchService as any,
            mockConfigService as any,
            mockUtilityService as any
        )
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    describe('getActiveLocale', () => {
        it('should return language search index from active locale', () => {
            mockSearchService.getLanguageSearchIndex.mockReturnValue('en')
            expect(component.getActiveLocale()).toBe('en')
            expect(mockSearchService.getLanguageSearchIndex).toHaveBeenCalledWith('en')
        })

        it('should return empty string if no active locale', () => {
            mockConfigService.activeLocale = null
            mockSearchService.getLanguageSearchIndex.mockReturnValue('')
            expect(component.getActiveLocale()).toBe('')
        })
    })

    describe('applyPhraseSearch', () => {
        it('should return true when phraseSearch is true in config', () => {
            mockActivatedRoute.snapshot.data.pageData.data.search.tabs[0].phraseSearch = true
            expect(component.applyPhraseSearch).toBe(true)
        })

        it('should return true when phraseSearch is undefined in config', () => {
            mockActivatedRoute.snapshot.data.pageData.data.search.tabs[0].phraseSearch = undefined
            expect(component.applyPhraseSearch).toBe(true)
        })

        it('should return false when phraseSearch is false in config', () => {
            mockActivatedRoute.snapshot.data.pageData.data.search.tabs[0].phraseSearch = false
            expect(component.applyPhraseSearch).toBe(false)
        })
    })

    describe('applyIsStandAlone', () => {
        it('should return true when isStandAlone is true in config', () => {
            mockActivatedRoute.snapshot.data.pageData.data.search.tabs[0].isStandAlone = true
            expect(component.applyIsStandAlone).toBe(true)
        })

        it('should return true when isStandAlone is undefined in config', () => {
            mockActivatedRoute.snapshot.data.pageData.data.search.tabs[0].isStandAlone = undefined
            expect(component.applyIsStandAlone).toBe(true)
        })

        it('should return false when isStandAlone is false in config', () => {
            mockActivatedRoute.snapshot.data.pageData.data.search.tabs[0].isStandAlone = false
            expect(component.applyIsStandAlone).toBe(false)
        })
    })

    describe('filtersFromConfig', () => {
        it('should return filters from config', () => {
            const expectedFilters = { resourceType: ['Course'] }
            expect(component.filtersFromConfig).toEqual(expectedFilters)
        })
    })

    describe('isDefaultFilterApplied', () => {
        it('should return true when default filters are applied', () => {
            component.searchRequestObject.filters = { resourceType: ['Course'] }
            expect(component.isDefaultFilterApplied).toBe(true)
        })

        it('should return false when default filters are not applied', () => {
            component.searchRequestObject.filters = { contentType: ['Course'] }
            expect(component.isDefaultFilterApplied).toBe(false)
        })

        it('should return false when no default filters exist', () => {
            mockActivatedRoute.snapshot.data.pageData.data.search.tabs[0].searchQuery.filters = {}
            expect(component.isDefaultFilterApplied).toBe(false)
        })
    })

    describe('preferredLanguages', () => {
        it('should return comma-separated preferred languages', () => {
            mockConfigService.userPreference.selectedLangGroup = 'en,hi'
            mockSearchService.getLanguageSearchIndex.mockImplementation((lang: any) => lang)
            expect(component.preferredLanguages).toBe('en,hi')
        })

        it('should return "en" when no preferred languages', () => {
            mockConfigService.userPreference = {}
            expect(component.preferredLanguages).toBe('en')
        })
    })

    describe('searchAcrossPreferredLang', () => {
        it('should return true when acrossPreferredLang is true and locale differs', () => {
            mockActivatedRoute.snapshot.data.pageData.data.search.tabs[0].acrossPreferredLang = true
            component.searchRequestObject.locale = ['fr']
            mockConfigService.userPreference.selectedLangGroup = 'en,hi'
            mockSearchService.getLanguageSearchIndex.mockImplementation((lang: any) => lang)
            expect(component.searchAcrossPreferredLang).toBe(true)
        })

        it('should return false when acrossPreferredLang is false', () => {
            mockActivatedRoute.snapshot.data.pageData.data.search.tabs[0].acrossPreferredLang = false
            expect(component.searchAcrossPreferredLang).toBe(false)
        })
    })

    describe('removeDefaultFiltersApplied', () => {
        it('should navigate with default filters removed', () => {
            component.searchRequestObject.filters = { resourceType: ['Course'] }
            component.removeDefaultFiltersApplied()
            expect(mockRouter.navigate).toHaveBeenCalledWith(
                [],
                expect.objectContaining({
                    queryParams: { f: '{}' },
                    relativeTo: mockActivatedRoute.parent
                })
            )
        })

        it('should return early if filters do not match structure', () => {
            component.searchRequestObject.filters = { resourceType: ['Resource'] }
            component.removeDefaultFiltersApplied()
            expect(mockRouter.navigate).not.toHaveBeenCalled()
        })
    })

    describe('searchWithPreferredLanguage', () => {
        it('should navigate with preferred language param', () => {
            mockConfigService.userPreference.selectedLangGroup = 'en,hi'
            mockSearchService.getLanguageSearchIndex.mockImplementation((lang: any) => lang)
            component.searchWithPreferredLanguage()
            expect(mockRouter.navigate).toHaveBeenCalledWith(
                [],
                expect.objectContaining({
                    queryParams: { lang: 'en,hi' },
                    relativeTo: mockActivatedRoute.parent
                })
            )
        })
    })

    describe('ngOnInit', () => {
        it('should set up subscriptions and call getResults', () => {
            const getResultsSpy = jest.spyOn(component, 'getResults')
            component.ngOnInit()
            expect(getResultsSpy).toHaveBeenCalled()
            expect(mockSearchService.searchConfig).toBeDefined()
        })
    })

    describe('getResults', () => {
        it('should fetch search results and process them', () => {
            component.searchRequestObject = {
                query: 'test',
                filters: {},
                pageNo: 0,
                pageSize: 10,
                locale: [],
                sort: [],
                instanceCatalog: true,
            }

            component.getResults()

            expect(mockSearchService.getLearning).toHaveBeenCalledWith(expect.objectContaining({
                query: '"test"',
                filters: {},
                pageNo: 0
            }))

            expect(component.searchResults.totalHits).toBe(10)
            expect(component.searchResults.result.length).toBe(2)
            expect(component.searchRequestStatus).toBe('hasMore')
            expect(component.searchRequestObject.pageNo).toBe(1)
        })

        it('should handle no results scenario properly', () => {
            component.searchRequestObject = {
                query: 'test',
                filters: {},
                pageNo: 0,
                pageSize: 10,
                locale: [],
                sort: [],
                instanceCatalog: true,
            }

            mockSearchService.getLearning.mockReturnValue(of({
                totalHits: 0,
                result: [],
                filters: [],
                filtersUsed: [],
                notVisibleFilters: [],
                doYouMean: [],
                queryUsed: 'test query'
            }))

            const removeDefaultFiltersSpy = jest.spyOn(component, 'removeDefaultFiltersApplied')
            removeDefaultFiltersSpy.mockImplementation(() => { })
            const isDefaultFilterAppliedGetter = jest.spyOn(component, 'isDefaultFilterApplied', 'get')
            isDefaultFilterAppliedGetter.mockReturnValue(true)

            component.getResults()

            expect(removeDefaultFiltersSpy).toHaveBeenCalled()
        })
    })

    describe('contentTrackBy', () => {
        it('should return content identifier', () => {
            const content = { identifier: 'test-id' }
            expect(component.contentTrackBy(content as any)).toBe('test-id')
        })
    })

    describe('sortOrder', () => {
        it('should navigate with sort parameter', () => {
            component.sortOrder('duration')
            expect(mockRouter.navigate).toHaveBeenCalledWith(
                [],
                expect.objectContaining({
                    queryParams: { sort: 'duration' },
                    relativeTo: mockActivatedRoute.parent
                })
            )
        })
    })

    describe('getSortType', () => {
        it('should return correct sort object for lastUpdatedOn', () => {
            expect(component.getSortType('lastUpdatedOn')).toEqual([{ lastUpdatedOn: 'desc' }])
        })

        it('should return correct sort object for duration', () => {
            expect(component.getSortType('duration')).toEqual([{ duration: 'desc' }])
        })

        it('should return correct sort object for size', () => {
            expect(component.getSortType('size')).toEqual([{ size: 'desc' }])
        })

        it('should return default sort for unknown sort type', () => {
            expect(component.getSortType('unknown')).toEqual([{ lastUpdatedOn: 'desc' }])
        })
    })

    describe('searchLanguage', () => {
        it('should navigate with language parameter', () => {
            component.searchLanguage('hi')
            expect(mockRouter.navigate).toHaveBeenCalledWith(
                [],
                expect.objectContaining({
                    queryParams: { lang: 'hi' },
                    relativeTo: mockActivatedRoute.parent
                })
            )
            expect(component.expandToPrefLang).toBe(false)
        })
    })

    describe('didYouMeanSearch', () => {
        it('should navigate with corrected query', () => {
            component.didYouMeanSearch('<em>corrected</em>')
            expect(mockRouter.navigate).toHaveBeenCalledWith(
                [],
                expect.objectContaining({
                    queryParams: { q: 'corrected' },
                    relativeTo: mockActivatedRoute.parent
                })
            )
        })
    })

    describe('searchInsteadFor', () => {
        it('should clear results and call getResults with didYouMean false', () => {
            const getResultsSpy = jest.spyOn(component, 'getResults')
            component.searchInsteadFor()
            expect(component.searchResults.result).toEqual([])
            expect(getResultsSpy).toHaveBeenCalledWith(undefined, false)
        })
    })

    describe('removeFilters', () => {
        it('should navigate with null filters', () => {
            component.searchRequestObject.query = 'test'
            component.removeFilters()
            expect(mockRouter.navigate).toHaveBeenCalledWith(
                [],
                expect.objectContaining({
                    queryParams: { f: null, q: 'test' },
                    relativeTo: mockActivatedRoute.parent
                })
            )
        })
    })

    describe('removeLanguage', () => {
        it('should reset language and navigate', () => {
            component.searchRequestObject.query = 'test'
            component.searchRequest.filters = { contentType: ['Course'] }
            component.removeLanguage()

            expect(component.searchRequest.lang).toBe('')
            expect(mockRouter.navigate).toHaveBeenCalledWith(
                [],
                expect.objectContaining({
                    queryParams: {
                        f: JSON.stringify({ contentType: ['Course'] }),
                        q: 'test',
                        lang: null
                    },
                    relativeTo: mockActivatedRoute.parent
                })
            )
        })
    })

    describe('closeFilter', () => {
        it('should set sideNavBarOpened to the value passed', () => {
            component.closeFilter(false)
            expect(component.sideNavBarOpened).toBe(false)

            component.closeFilter(true)
            expect(component.sideNavBarOpened).toBe(true)
        })
    })

    describe('ngOnDestroy', () => {
        it('should unsubscribe from all subscriptions', () => {
            // Setup subscriptions
            const mockSubscription = { unsubscribe: jest.fn() }
            component.searchResultsSubscription = mockSubscription as any
            component.defaultSideNavBarOpenedSubscription = mockSubscription as any
            component.prefChangeSubscription = mockSubscription as any

            component.ngOnDestroy()

            expect(mockSubscription.unsubscribe).toHaveBeenCalledTimes(3)
        })

        it('should handle null subscriptions gracefully', () => {
            component.searchResultsSubscription = undefined
            component.defaultSideNavBarOpenedSubscription = null
            component.prefChangeSubscription = null

            // Should not throw errors
            expect(() => component.ngOnDestroy()).not.toThrow()
        })
    })
})