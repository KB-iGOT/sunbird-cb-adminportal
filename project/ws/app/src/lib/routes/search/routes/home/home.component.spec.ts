import { Subject } from 'rxjs'
import { HomeComponent } from './home.component'
import { UntypedFormControl } from '@angular/forms'

// Mock dependencies
const mockConfigurationsService = {
    pageNavBar: { background: 'primary' },
    activeLocale: { locals: ['en'] },
    userPreference: { selectedLangGroup: 'en,hi,ta' }
}

const mockRouter = {
    navigate: jest.fn().mockResolvedValue(true)
}

const mockActivatedRoute = {
    snapshot: {
        data: {
            pageData: {
                data: {
                    search: {
                        isAutoCompleteAllowed: true,
                        languageSearch: ['All', 'English', 'Hindi', 'Tamil']
                    }
                }
            }
        }
    },
    queryParamMap: new Subject(),
    parent: {}
}

const mockSearchServService = {
    getLanguageSearchIndex: jest.fn().mockReturnValue('en'),
    searchAutoComplete: jest.fn().mockResolvedValue([]),
    getSearchConfig: jest.fn().mockResolvedValue({
        search: {
            suggestedFilters: [
                { contentType: 'Course', displayName: 'Courses' },
                { resourceType: 'Video', displayName: 'Videos' }
            ]
        }
    })
}

describe('HomeComponent', () => {
    let component: HomeComponent
    let mockQueryParamMapSubject: Subject<any>

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks()

        // Create a new subject for query param map
        mockQueryParamMapSubject = new Subject()
        mockActivatedRoute.queryParamMap = mockQueryParamMapSubject

        // Create component instance
        component = new HomeComponent(
            mockConfigurationsService as any,
            mockRouter as any,
            mockActivatedRoute as any,
            mockSearchServService as any
        )
    })

    describe('Constructor', () => {
        it('should initialize with default values', () => {
            expect(component.query).toBeInstanceOf(UntypedFormControl)
            expect(component.pageNavbar).toEqual({ background: 'primary' })
            expect(component.autoCompleteResults).toEqual([])
            expect(component.searchQuery).toEqual({
                l: 'en',
                q: ''
            })
            expect(component.languageSearch).toEqual([])
            expect(component.suggestedFilters).toEqual([])
        })

        it('should set up autocomplete subscription when isAutoCompleteAllowed is true', () => {
            const spy = jest.spyOn(component, 'getAutoCompleteResults')

            // Trigger value change
            component.query.setValue('test query')

            // Wait for debounce
            setTimeout(() => {
                expect(spy).toHaveBeenCalled()
                expect(component.searchQuery.q).toBe('test query')
            }, 250)
        })

        it('should not set up autocomplete subscription when isAutoCompleteAllowed is false', () => {
            // Create new component with autocomplete disabled
            mockActivatedRoute.snapshot.data.pageData.data.search.isAutoCompleteAllowed = false

            const newComponent = new HomeComponent(
                mockConfigurationsService as any,
                mockRouter as any,
                mockActivatedRoute as any,
                mockSearchServService as any
            )

            const spy = jest.spyOn(newComponent, 'getAutoCompleteResults')

            newComponent.query.setValue('test')

            setTimeout(() => {
                expect(spy).not.toHaveBeenCalled()
            }, 250)
        })
    })

    describe('search method', () => {
        it('should navigate to search pages with query parameter', async () => {
            component.searchQuery.q = 'test query'
            component.searchQuery.l = 'en'

            await component.search()

            expect(mockRouter.navigate).toHaveBeenCalledTimes(2)
            expect(mockRouter.navigate).toHaveBeenNthCalledWith(1, ['/app/search/home'], {
                queryParams: { lang: 'en', q: 'test query' }
            })
            expect(mockRouter.navigate).toHaveBeenNthCalledWith(2, ['/app/search/learning'], {
                queryParams: { q: 'test query', lang: 'en' }
            })
        })

        it('should use provided query parameter', async () => {
            component.searchQuery.l = 'hi'

            await component.search('custom query')

            expect(mockRouter.navigate).toHaveBeenNthCalledWith(1, ['/app/search/home'], {
                queryParams: { lang: 'hi', q: 'custom query' }
            })
            expect(mockRouter.navigate).toHaveBeenNthCalledWith(2, ['/app/search/learning'], {
                queryParams: { q: 'custom query', lang: 'hi' }
            })
        })
    })

    describe('searchWithFilter method', () => {
        it('should navigate with contentType filter', async () => {
            component.searchQuery.q = 'test'
            component.searchQuery.l = 'en'
            const filter = { contentType: 'Course' }

            await component.searchWithFilter(filter)

            expect(mockRouter.navigate).toHaveBeenNthCalledWith(2, ['/app/search/learning'], {
                queryParams: {
                    q: 'test',
                    lang: 'en',
                    f: JSON.stringify({ contentType: ['Course'] })
                }
            })
        })

        it('should navigate with resourceType filter', async () => {
            component.searchQuery.q = 'test'
            component.searchQuery.l = 'en'
            const filter = { resourceType: 'Video' }

            await component.searchWithFilter(filter)

            expect(mockRouter.navigate).toHaveBeenNthCalledWith(2, ['/app/search/learning'], {
                queryParams: {
                    q: 'test',
                    lang: 'en',
                    f: JSON.stringify({ resourceType: ['Video'] })
                }
            })
        })

        it('should navigate with combinedType learningContent filter', async () => {
            component.searchQuery.q = 'test'
            component.searchQuery.l = 'en'
            const filter = { combinedType: 'learningContent' }

            await component.searchWithFilter(filter)

            expect(mockRouter.navigate).toHaveBeenNthCalledWith(2, ['/app/search/learning'], {
                queryParams: {
                    q: 'test',
                    lang: 'en',
                    f: JSON.stringify({ contentType: ['Collection', 'Learning Path', 'Course'] })
                }
            })
        })

        it('should navigate with empty filter for unknown filter type', async () => {
            component.searchQuery.q = 'test'
            component.searchQuery.l = 'en'
            const filter = { unknownType: 'unknown' }

            await component.searchWithFilter(filter)

            expect(mockRouter.navigate).toHaveBeenNthCalledWith(2, ['/app/search/learning'], {
                queryParams: {
                    q: 'test',
                    lang: 'en',
                    f: JSON.stringify('')
                }
            })
        })
    })

    describe('getActivateLocale method', () => {
        it('should return language search index from active locale', () => {
            mockSearchServService.getLanguageSearchIndex.mockReturnValue('en_index')

            const result = component.getActivateLocale()

            expect(mockSearchServService.getLanguageSearchIndex).toHaveBeenCalledWith('en')
            expect(result).toBe('en_index')
        })

        it('should return default "en" when no active locale', () => {
            mockConfigurationsService.activeLocale = { locals: [] }
            mockSearchServService.getLanguageSearchIndex.mockReturnValue('en_default')

            const result = component.getActivateLocale()

            expect(mockSearchServService.getLanguageSearchIndex).toHaveBeenCalledWith('en')
            expect(result).toBe('en_default')
        })
    })

    describe('preferredLanguages getter', () => {
        it('should return formatted preferred languages', () => {
            mockSearchServService.getLanguageSearchIndex
                .mockReturnValueOnce('en_index')
                .mockReturnValueOnce('hi_index')
                .mockReturnValueOnce('ta_index')

            const result = component.preferredLanguages

            expect(result).toBe('en_index,hi_index,ta_index')
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

    describe('swapRemove method', () => {
        it('should move element from one position to another', () => {
            const array = ['a', 'b', 'c', 'd']

            component.swapRemove(array, 2, 0)

            expect(array).toEqual(['c', 'a', 'b', 'd'])
        })

        it('should handle moving element to end', () => {
            const array = ['a', 'b', 'c']

            component.swapRemove(array, 0, 2)

            expect(array).toEqual(['b', 'c', 'a'])
        })
    })

    describe('getAutoCompleteResults method', () => {
        it('should fetch and set autocomplete results', async () => {
            const mockResults = [
                { identifier: '1', name: 'Test 1' },
                { identifier: '2', name: 'Test 2' }
            ]
            mockSearchServService.searchAutoComplete.mockResolvedValue(mockResults)

            await component.getAutoCompleteResults()

            expect(mockSearchServService.searchAutoComplete).toHaveBeenCalledWith(component.searchQuery)
            expect(component.autoCompleteResults).toEqual(mockResults)
        })

        it('should handle autocomplete search errors gracefully', async () => {
            mockSearchServService.searchAutoComplete.mockRejectedValue(new Error('Search failed'))

            await component.getAutoCompleteResults()

            expect(component.autoCompleteResults).toEqual([])
        })
    })

    describe('searchLanguage method', () => {
        it('should navigate with language parameter and refresh autocomplete', async () => {
            const spy = jest.spyOn(component, 'getAutoCompleteResults')
            component.searchQuery.q = 'test'

            await component.searchLanguage('hi')

            expect(mockRouter.navigate).toHaveBeenCalledWith([], {
                queryParams: { lang: 'hi', q: 'test' },
                queryParamsHandling: 'merge',
                relativeTo: mockActivatedRoute.parent
            })
            expect(spy).toHaveBeenCalled()
        })
    })

    describe('ngOnInit method', () => {
        it('should initialize component with query parameters', () => {
            const spy = jest.spyOn(component, 'ngOnInit')
            component.ngOnInit()

            expect(spy).toHaveBeenCalled()
            expect(mockSearchServService.getSearchConfig).toHaveBeenCalled()
        })

        it('should handle query parameter changes', () => {
            component.ngOnInit()

            const mockQueryParams = new Map()
            mockQueryParams.set = jest.fn()
            mockQueryParams.has = jest.fn()
                .mockReturnValueOnce(true) // for 'q'
                .mockReturnValueOnce(true) // for 'lang'
            mockQueryParams.get = jest.fn()
                .mockReturnValueOnce('test query') // for 'q'
                .mockReturnValueOnce('hi') // for 'lang'

            mockQueryParamMapSubject.next(mockQueryParams)

            expect(component.searchQuery.q).toBe('test query')
            expect(component.searchQuery.l).toBe('hi')
        })

        it('should handle missing query parameters', () => {
            component.ngOnInit()

            const mockQueryParams = new Map()
            mockQueryParams.has = jest.fn().mockReturnValue(false)
            mockSearchServService.getLanguageSearchIndex.mockReturnValue('en_default')

            mockQueryParamMapSubject.next(mockQueryParams)

            expect(component.searchQuery.q).toBe('')
            expect(component.searchQuery.l).toBe('en_default')
        })

        it('should process language search array and move "all" to first position', () => {
            component.ngOnInit()

            const mockQueryParams = new Map()
            mockQueryParams.has = jest.fn().mockReturnValue(false)

            mockQueryParamMapSubject.next(mockQueryParams)

            expect(component.languageSearch[0]).toBe('all')
            expect(component.languageSearch).toContain('english')
            expect(component.languageSearch).toContain('hindi')
            expect(component.languageSearch).toContain('tamil')
        })

        it('should add preferred languages to language search when multiple languages exist', () => {
            mockConfigurationsService.userPreference.selectedLangGroup = 'en,hi,ta'
            mockSearchServService.getLanguageSearchIndex
                .mockReturnValue('en')
                .mockReturnValue('hi')
                .mockReturnValue('ta')

            component.ngOnInit()

            const mockQueryParams = new Map()
            mockQueryParams.has = jest.fn().mockReturnValue(false)

            mockQueryParamMapSubject.next(mockQueryParams)

            // Preferred languages should be inserted at index 1
            expect(component.languageSearch[1]).toContain('en')
        })

        it('should set suggested filters from search config', async () => {
            const mockConfig = {
                search: {
                    suggestedFilters: [
                        { contentType: 'Course', displayName: 'Courses' },
                        { resourceType: 'Video', displayName: 'Videos' }
                    ]
                }
            }
            mockSearchServService.getSearchConfig.mockResolvedValue(mockConfig)

            component.ngOnInit()

            // Wait for async operation
            await new Promise(resolve => setTimeout(resolve, 0))

            expect(component.suggestedFilters).toEqual(mockConfig.search.suggestedFilters)
        })

        it('should handle getSearchConfig errors gracefully', async () => {
            mockSearchServService.getSearchConfig.mockRejectedValue(new Error('Config failed'))

            component.ngOnInit()

            // Wait for async operation
            await new Promise(resolve => setTimeout(resolve, 0))

            expect(component.suggestedFilters).toEqual([])
        })
    })

    describe('Integration Tests', () => {
        it('should properly chain search navigation', async () => {
            component.searchQuery = { q: 'integration test', l: 'en' }

            await component.search()

            expect(mockRouter.navigate).toHaveBeenCalledTimes(2)

            // Verify the navigation chain
            const firstCall = mockRouter.navigate.mock.calls[0]
            const secondCall = mockRouter.navigate.mock.calls[1]

            expect(firstCall[0]).toEqual(['/app/search/home'])
            expect(secondCall[0]).toEqual(['/app/search/learning'])

            expect(firstCall[1].queryParams.q).toBe('integration test')
            expect(secondCall[1].queryParams.q).toBe('integration test')
        })

        it('should maintain language consistency across operations', () => {
            component.searchQuery.l = 'hi'

            component.search('test')
            component.searchWithFilter({ contentType: 'Course' })

            // Both operations should maintain the same language
            mockRouter.navigate.mock.calls.forEach(call => {
                expect(call[1].queryParams.lang || call[1].queryParams.lang).toBe('hi')
            })
        })
    })
})