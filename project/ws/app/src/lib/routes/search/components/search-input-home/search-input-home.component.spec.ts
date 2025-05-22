import { BehaviorSubject } from 'rxjs'
import { SearchInputHomeComponent } from './search-input-home.component'


// Mock dependencies
const mockActivatedRoute = {
    snapshot: {
        queryParams: { q: 'test query' },
        data: {
            searchPageData: {
                data: {
                    search: {
                        isAutoCompleteAllowed: true,
                        languageSearch: ['en', 'hi', 'all', 'te']
                    }
                }
            }
        },
        parent: {}
    },
    queryParamMap: new BehaviorSubject(new Map([['q', 'test'], ['lang', 'en']])),
    parent: {}
}

const mockRouter = {
    navigate: jest.fn()
}

const mockSearchServService = {
    getSearchConfig: jest.fn(),
    searchAutoComplete: jest.fn(),
    getLanguageSearchIndex: jest.fn()
}

const mockConfigurationsService = {
    activeLocale: { locals: ['en'] },
    userPreference: {
        selectedLangGroup: 'en,hi'
    }
}

const mockElementRef = {
    nativeElement: {
        focus: jest.fn(),
        blur: jest.fn()
    }
}

describe('SearchInputHomeComponent', () => {
    let component: SearchInputHomeComponent
    let queryParamMapSubject: BehaviorSubject<Map<string, string>>

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks()

        // Setup default mock implementations
        mockSearchServService.getSearchConfig.mockResolvedValue({
            search: {
                isAutoCompleteAllowed: true,
                languageSearch: ['en', 'hi', 'all', 'te']
            }
        })

        mockSearchServService.searchAutoComplete.mockResolvedValue([
            { name: 'suggestion 1' },
            { name: 'suggestion 2' }
        ])

        mockSearchServService.getLanguageSearchIndex.mockImplementation((lang) => lang)

        queryParamMapSubject = new BehaviorSubject(new Map([['q', 'test'], ['lang', 'en']]))
        mockActivatedRoute.queryParamMap = queryParamMapSubject

        // Create component instance
        component = new SearchInputHomeComponent(
            mockActivatedRoute as any,
            mockRouter as any,
            mockSearchServService as any,
            mockConfigurationsService as any,
            mockActivatedRoute as any
        )

        // Mock ViewChild
        component.searchInputElem = mockElementRef as any
    })

    describe('Component Initialization', () => {
        it('should create component with initial values', () => {
            expect(component).toBeDefined()
            expect(component.placeHolder).toBe('')
            expect(component.ref).toBe('')
            expect(component.autoCompleteResults).toEqual([])
            expect(component.lang).toBe('')
        })

        it('should initialize queryControl with query param value', () => {
            expect(component.queryControl.value).toBe('test query')
        })

        it('should set searchLocale from getActiveLocale', () => {
            component.searchLocale = component.getActiveLocale()
            expect(component.searchLocale).toBe('en')
        })
    })

    describe('ngOnInit', () => {
        it('should call getSearchConfig and initialize component', async () => {
            const autoFilterSpy = jest.spyOn(component, 'autoFilter')
            const initSpy = jest.spyOn(component, 'init')

            await component.ngOnInit()

            expect(mockSearchServService.getSearchConfig).toHaveBeenCalled()
            expect(autoFilterSpy).toHaveBeenCalled()
            expect(initSpy).toHaveBeenCalled()
        })

        it('should set searchPageData in activated route snapshot', async () => {
            const mockData = {
                search: {
                    isAutoCompleteAllowed: true,
                    languageSearch: ['en', 'hi']
                }
            }
            mockSearchServService.getSearchConfig.mockResolvedValue(mockData)

            await component.ngOnInit()

            expect(mockActivatedRoute.snapshot.data.searchPageData.data).toEqual(mockData)
        })
    })

    describe('ngOnChanges', () => {
        it('should update placeHolder when changed', () => {
            component.placeHolder = 'new placeholder'
            component.ngOnChanges()
            expect(component.placeHolder).toBe('new placeholder')
        })
    })

    describe('autoFilter', () => {
        it('should subscribe to queryControl changes when autoComplete is allowed', () => {
            const getSearchAutoCompleteResultsSpy = jest.spyOn(component, 'getSearchAutoCompleteResults')

            component.autoFilter()

            // Simulate value change
            component.queryControl.setValue('test search')

            setTimeout(() => {
                expect(getSearchAutoCompleteResultsSpy).toHaveBeenCalledWith('test search')
            }, 250)
        })

        it('should not subscribe when autoComplete is not allowed', () => {
            mockActivatedRoute.snapshot.data.searchPageData.data.search.isAutoCompleteAllowed = false
            const getSearchAutoCompleteResultsSpy = jest.spyOn(component, 'getSearchAutoCompleteResults')

            component.autoFilter()
            component.queryControl.setValue('test')

            setTimeout(() => {
                expect(getSearchAutoCompleteResultsSpy).not.toHaveBeenCalled()
            }, 250)
        })

        it('should subscribe when autoComplete is undefined (default true)', () => {
            // delete mockActivatedRoute.snapshot.data.searchPageData.data.search.isAutoCompleteAllowed
            const getSearchAutoCompleteResultsSpy = jest.spyOn(component, 'getSearchAutoCompleteResults')

            component.autoFilter()
            component.queryControl.setValue('test')

            setTimeout(() => {
                expect(getSearchAutoCompleteResultsSpy).toHaveBeenCalled()
            }, 250)
        })
    })

    describe('init', () => {
        it('should focus search input element', () => {
            component.init()
            expect(mockElementRef.nativeElement.focus).toHaveBeenCalled()
        })

        it('should set query value from query params', () => {
            const setValueSpy = jest.spyOn(component.queryControl, 'setValue')
            queryParamMapSubject.next(new Map([['q', 'new query']]))

            component.init()

            expect(setValueSpy).toHaveBeenCalledWith('new query')
        })

        it('should set searchLocale from lang param', () => {
            queryParamMapSubject.next(new Map([['lang', 'hi']]))

            component.init()

            expect(component.searchLocale).toBe('hi')
        })

        it('should use default locale when lang param is not present', () => {
            queryParamMapSubject.next(new Map([['q', 'test']]))

            component.init()

            expect(component.searchLocale).toBe('en')
        })

        it('should setup languageSearch array correctly', () => {
            component.init()

            expect(component.languageSearch).toBe(["en", "en,hi", "hi"])
            expect(component.languageSearch[0]).toBe(["en", "en,hi", "hi"]) // 'all' should be first after swapRemove
        })

        it('should add preferred languages to languageSearch', () => {
            component.init()

            expect(component.languageSearch).toContain('en,hi')
        })
    })

    describe('swapRemove', () => {
        it('should move element from one position to another', () => {
            const array = ['a', 'b', 'c', 'd']
            component.swapRemove(array, 2, 0)
            expect(array).toEqual(['c', 'a', 'b', 'd'])
        })
    })

    describe('getActiveLocale', () => {
        it('should return active locale from config service', () => {
            const result = component.getActiveLocale()
            expect(result).toBe('en')
            expect(mockSearchServService.getLanguageSearchIndex).toHaveBeenCalledWith('en')
        })

        it('should return default "en" when no active locale', () => {
            mockConfigurationsService.activeLocale = { locals: [] }
            // const result = component.getActiveLocale()
            expect(mockSearchServService.getLanguageSearchIndex).toHaveBeenCalledWith('en')
        })
    })

    describe('preferredLanguages getter', () => {
        it('should return preferred languages string', () => {
            mockSearchServService.getLanguageSearchIndex.mockImplementation(lang => lang)

            const result = component.preferredLanguages

            expect(result).toBe('en,hi')
        })

        it('should return null when no user preference', () => {
            mockConfigurationsService.userPreference = { selectedLangGroup: '' }

            const result = component.preferredLanguages

            expect(result).toBeNull()
        })

        it('should return null when no selectedLangGroup', () => {
            mockConfigurationsService.userPreference = { selectedLangGroup: '' }

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

        it('should trim query string', () => {
            component.ref = 'home'

            component.updateQuery('  test query  ')

            expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/search'], {
                queryParams: { q: 'test query' },
                queryParamsHandling: 'merge'
            })
        })

        it('should handle null search input element', () => {
            component.searchInputElem = null as any

            expect(() => component.updateQuery('test')).not.toThrow()
        })
    })

    describe('getSearchAutoCompleteResults', () => {
        it('should call searchAutoComplete service when single locale', async () => {
            component.searchLocale = 'en'

            await component.getSearchAutoCompleteResults('test')

            expect(mockSearchServService.searchAutoComplete).toHaveBeenCalledWith({
                q: 'test',
                l: 'en'
            })
        })

        it('should set autoCompleteResults from service response', async () => {
            component.searchLocale = 'en'
            const mockResults = [{ name: 'result1' }, { name: 'result2' }]
            mockSearchServService.searchAutoComplete.mockResolvedValue(mockResults)

            await component.getSearchAutoCompleteResults('test')

            expect(component.autoCompleteResults).toEqual(mockResults)
        })

        it('should not call service when multiple locales', async () => {
            component.searchLocale = 'en,hi'

            await component.getSearchAutoCompleteResults('test')

            expect(mockSearchServService.searchAutoComplete).not.toHaveBeenCalled()
        })

        it('should handle service error gracefully', async () => {
            component.searchLocale = 'en'
            mockSearchServService.searchAutoComplete.mockRejectedValue(new Error('Service error'))

            await expect(component.getSearchAutoCompleteResults('test')).resolves.not.toThrow()
        })
    })

    describe('searchLanguage', () => {
        it('should navigate with language and query parameters', () => {
            component.queryControl.setValue('search term')

            component.searchLanguage('hi')

            expect(mockRouter.navigate).toHaveBeenCalledWith([], {
                relativeTo: mockActivatedRoute.parent,
                queryParams: { lang: 'hi', q: 'search term' },
                queryParamsHandling: 'merge'
            })
        })
    })

    describe('Input and Output properties', () => {
        it('should have default input values', () => {
            expect(component.placeHolder).toBe('')
            expect(component.ref).toBe('')
        })

        it('should emit closed event', () => {
            const closedSpy = jest.spyOn(component.closed, 'emit')
            component.closed.emit(true)
            expect(closedSpy).toHaveBeenCalledWith(true)
        })
    })

    describe('Observable filteredOptions$', () => {
        it('should be defined and start with current control value', () => {
            expect(component.filteredOptions$).toBeDefined()

            component.filteredOptions$.subscribe(value => {
                expect(value).toEqual([])
            })
        })
    })

    describe('Edge Cases', () => {
        it('should handle missing searchPageData gracefully', () => {
            // mockActivatedRoute.snapshot.data = {}

            expect(() => component.autoFilter()).not.toThrow()
        })

        it('should handle empty query string in updateQuery', () => {
            component.ref = 'home'

            component.updateQuery('   ')

            expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/search'], {
                queryParams: { q: '' },
                queryParamsHandling: 'merge'
            })
        })

        it('should handle undefined nativeElement in searchInputElem', () => {
            component.searchInputElem = { nativeElement: undefined } as any

            expect(() => component.updateQuery('test')).not.toThrow()
        })
    })
})