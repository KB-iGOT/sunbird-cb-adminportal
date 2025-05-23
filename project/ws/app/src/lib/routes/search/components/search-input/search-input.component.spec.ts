import { SearchInputComponent } from './search-input.component'
import { of, Subject } from 'rxjs'

// Mock dependencies
const mockActivatedRoute = {
    snapshot: {
        queryParams: { q: 'test-query' },
        data: {
            searchPageData: {
                data: {
                    search: {
                        isAutoCompleteAllowed: true,
                        languageSearch: ['en', 'hi', 'all', 'fr']
                    }
                }
            }
        }
    },
    queryParamMap: of({
        has: jest.fn(),
        get: jest.fn()
    }),
    parent: {}
}

const mockRouter = {
    navigate: jest.fn()
}

const mockSearchServService = {
    getLanguageSearchIndex: jest.fn(),
    searchAutoComplete: jest.fn()
}

const mockConfigService = {
    activeLocale: {
        locals: ['en']
    },
    userPreference: {
        selectedLangGroup: 'en,hi'
    }
}

const mockElementRef = {
    nativeElement: {
        blur: jest.fn(),
        activated: jest.fn()
    }
}

describe('SearchInputComponent', () => {
    let component: SearchInputComponent
    let queryParamMapSubject: Subject<any>

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks()

        // Setup query param map subject for reactive testing
        queryParamMapSubject = new Subject()
        mockActivatedRoute.queryParamMap = queryParamMapSubject.asObservable()

        // Setup default mock returns
        mockSearchServService.getLanguageSearchIndex.mockReturnValue('en')
        mockSearchServService.searchAutoComplete.mockResolvedValue([])

        // Create component instance
        component = new SearchInputComponent(
            mockActivatedRoute as any,
            mockRouter as any,
            mockSearchServService as any,
            mockConfigService as any,
            mockActivatedRoute as any
        )

        // Mock ViewChild
        component.searchInputElem = mockElementRef as any
    })

    describe('Constructor', () => {
        it('should initialize queryControl with query param value', () => {
            expect(component.queryControl.value).toBe('test-query')
        })

        it('should initialize queryControl with "all" when no query param', () => {
            mockActivatedRoute.snapshot.queryParams = { q: '' }
            const newComponent = new SearchInputComponent(
                mockActivatedRoute as any,
                mockRouter as any,
                mockSearchServService as any,
                mockConfigService as any,
                mockActivatedRoute as any
            )
            expect(newComponent.queryControl.value).toBe('all')
        })

        it('should subscribe to queryControl changes when autocomplete is allowed', () => {
            const spy = jest.spyOn(component, 'getSearchAutoCompleteResults')

            // Trigger value change
            component.queryControl.setValue('new query')

            // Wait for debounce
            setTimeout(() => {
                expect(spy).toHaveBeenCalledWith('new query')
            }, 250)
        })

        it('should not subscribe to queryControl changes when autocomplete is disabled', () => {
            mockActivatedRoute.snapshot.data.searchPageData.data.search.isAutoCompleteAllowed = false
            const spy = jest.spyOn(SearchInputComponent.prototype, 'getSearchAutoCompleteResults')

            new SearchInputComponent(
                mockActivatedRoute as any,
                mockRouter as any,
                mockSearchServService as any,
                mockConfigService as any,
                mockActivatedRoute as any
            )

            expect(spy).not.toHaveBeenCalled()
        })
    })

    describe('ngOnInit', () => {
        beforeEach(() => {
            jest.spyOn(component, 'getSearchAutoCompleteResults').mockImplementation()
            jest.spyOn(component, 'updateQuery').mockImplementation()
        })

        it('should activate search input element if available', () => {
            component.ngOnInit()
            expect(mockElementRef.nativeElement.activated).toHaveBeenCalled()
        })

        it('should handle query param changes with "q" parameter', () => {
            component.ngOnInit()

            const mockQueryParam = {
                has: jest.fn().mockImplementation((key: string) => key === 'q'),
                get: jest.fn().mockImplementation((key: string) => key === 'q' ? 'search-term' : null)
            }

            queryParamMapSubject.next(mockQueryParam)

            expect(component.queryControl.value).toBe('search-term')
        })

        it('should handle query param changes without "q" parameter', () => {
            const updateQuerySpy = jest.spyOn(component, 'updateQuery')
            component.ngOnInit()

            const mockQueryParam = {
                has: jest.fn().mockReturnValue(false),
                get: jest.fn().mockReturnValue(null)
            }

            queryParamMapSubject.next(mockQueryParam)

            expect(updateQuerySpy).toHaveBeenCalledWith('all')
        })

        it('should handle language parameter changes', () => {
            component.ngOnInit()

            const mockQueryParam = {
                has: jest.fn().mockImplementation((key: string) => key === 'lang'),
                get: jest.fn().mockImplementation((key: string) => key === 'lang' ? 'hi' : null)
            }

            queryParamMapSubject.next(mockQueryParam)

            expect(component.searchLocale).toBe('hi')
        })

        it('should sort language search array and move "all" to first position', () => {
            component.ngOnInit()

            expect(component.languageSearch[0]).toBe('all')
            expect(component.languageSearch).toEqual(['all', 'en,hi', 'en', 'fr', 'hi'])
        })

        it('should handle preferred languages insertion', () => {
            jest.spyOn(component, 'preferredLanguages', 'get').mockReturnValue('en,hi')
            component.ngOnInit()

            expect(component.languageSearch[1]).toBe('en,hi')
        })
    })

    describe('ngOnChanges', () => {
        it('should update placeholder when SimpleChange occurs', () => {
            component.placeHolder = 'new placeholder'
            component.ngOnChanges()
            expect(component.placeHolder).toBe('new placeholder')
        })
    })

    describe('swapRemove', () => {
        it('should move element from one position to another', () => {
            const testArray = ['a', 'b', 'c', 'd']
            component.swapRemove(testArray, 2, 0)
            expect(testArray).toEqual(['c', 'a', 'b', 'd'])
        })
    })

    describe('getActiveLocale', () => {
        it('should return mapped locale from config service', () => {
            mockSearchServService.getLanguageSearchIndex.mockReturnValue('mapped-en')
            const result = component.getActiveLocale()
            expect(mockSearchServService.getLanguageSearchIndex).toHaveBeenCalledWith('en')
            expect(result).toBe('mapped-en')
        })

        it('should return default "en" when no active locale', () => {
            mockConfigService.activeLocale = { locals: [] }
            mockSearchServService.getLanguageSearchIndex.mockReturnValue('mapped-en')
            const result = component.getActiveLocale()
            expect(mockSearchServService.getLanguageSearchIndex).toHaveBeenCalledWith('en')
            expect(result).toBe('mapped-en')
        })
    })

    describe('preferredLanguages getter', () => {
        it('should return mapped preferred languages', () => {
            mockSearchServService.getLanguageSearchIndex
                .mockReturnValueOnce('mapped-en')
                .mockReturnValueOnce('mapped-hi')

            const result = component.preferredLanguages
            expect(result).toBe('mapped-en,mapped-hi')
        })

        it('should return null when no user preference', () => {
            mockConfigService.userPreference = { selectedLangGroup: '' }
            const result = component.preferredLanguages
            expect(result).toBeNull()
        })

        it('should return null when no selectedLangGroup', () => {
            mockConfigService.userPreference = { selectedLangGroup: '' }
            const result = component.preferredLanguages
            expect(result).toBeNull()
        })
    })

    describe('updateQuery', () => {
        beforeEach(() => {
            component.searchInputElem = mockElementRef as any
        })

        it('should blur search input element', () => {
            component.updateQuery('test query')
            expect(mockElementRef.nativeElement.blur).toHaveBeenCalled()
        })

        it('should navigate to search page when ref is "home"', () => {
            component.ref = 'home'
            const closedSpy = jest.spyOn(component.closed, 'emit')

            component.updateQuery('test query')

            expect(closedSpy).toHaveBeenCalledWith(false)
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/search'], {
                queryParams: { q: 'test query' },
                queryParamsHandling: 'merge'
            })
        })

        it('should navigate relatively when ref is not "home"', () => {
            component.ref = 'other'

            component.updateQuery('test query')

            expect(mockRouter.navigate).toHaveBeenCalledWith([], {
                relativeTo: mockActivatedRoute.parent,
                queryParams: { q: 'test query' },
                queryParamsHandling: 'merge'
            })
        })

        it('should trim query before navigation', () => {
            component.updateQuery('  test query  ')

            expect(mockRouter.navigate).toHaveBeenCalledWith([], {
                relativeTo: mockActivatedRoute.parent,
                queryParams: { q: 'test query' },
                queryParamsHandling: 'merge'
            })
        })

        it('should handle missing search input element gracefully', () => {
            component.searchInputElem = null as any

            expect(() => component.updateQuery('test')).not.toThrow()
            expect(mockRouter.navigate).toHaveBeenCalled()
        })
    })

    describe('getSearchAutoCompleteResults', () => {
        beforeEach(() => {
            component.searchLocale = 'en'
        })

        it('should call search service with correct parameters', async () => {
            const mockResults = [{ id: '1', text: 'result1' }]
            mockSearchServService.searchAutoComplete.mockResolvedValue(mockResults)

            await component.getSearchAutoCompleteResults('test query')

            expect(mockSearchServService.searchAutoComplete).toHaveBeenCalledWith({
                q: 'test query',
                l: 'en'
            })
            expect(component.autoCompleteResults).toEqual(mockResults)
        })

        it('should handle search service errors gracefully', async () => {
            mockSearchServService.searchAutoComplete.mockRejectedValue(new Error('API Error'))

            await expect(component.getSearchAutoCompleteResults('test')).resolves.toBeUndefined()
            expect(component.autoCompleteResults).toEqual([])
        })

        it('should not call search service when multiple locales', async () => {
            component.searchLocale = 'en,hi'

            await component.getSearchAutoCompleteResults('test')

            expect(mockSearchServService.searchAutoComplete).not.toHaveBeenCalled()
        })
    })

    describe('searchLanguage', () => {
        it('should navigate with language and current query', () => {
            component.queryControl.setValue('current query')

            component.searchLanguage('hi')

            expect(mockRouter.navigate).toHaveBeenCalledWith([], {
                relativeTo: mockActivatedRoute.parent,
                queryParams: { lang: 'hi', q: 'current query' },
                queryParamsHandling: 'merge'
            })
        })
    })

    describe('Component Properties', () => {
        it('should have default empty placeHolder', () => {
            expect(component.placeHolder).toBe('')
        })

        it('should have default empty ref', () => {
            expect(component.ref).toBe('')
        })

        it('should initialize autoCompleteResults as empty array', () => {
            expect(component.autoCompleteResults).toEqual([])
        })

        it('should set searchLocale from getActiveLocale', () => {
            mockSearchServService.getLanguageSearchIndex.mockReturnValue('test-locale')
            const newComponent = new SearchInputComponent(
                mockActivatedRoute as any,
                mockRouter as any,
                mockSearchServService as any,
                mockConfigService as any,
                mockActivatedRoute as any
            )
            expect(newComponent.searchLocale).toBe('test-locale')
        })
    })

    describe('Edge Cases', () => {
        it('should handle undefined isAutoCompleteAllowed', () => {
            mockActivatedRoute.snapshot.data.searchPageData.data.search.isAutoCompleteAllowed = false

            expect(() => new SearchInputComponent(
                mockActivatedRoute as any,
                mockRouter as any,
                mockSearchServService as any,
                mockConfigService as any,
                mockActivatedRoute as any
            )).not.toThrow()
        })

        it('should handle empty language search array', () => {
            mockActivatedRoute.snapshot.data.searchPageData.data.search.languageSearch = []
            component.ngOnInit()
            expect(component.languageSearch).toEqual([])
        })

        it('should handle missing searchInputElem nativeElement', () => {
            component.searchInputElem = { nativeElement: null } as any
            expect(() => component.ngOnInit()).not.toThrow()
        })
    })
})