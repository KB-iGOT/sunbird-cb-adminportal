import { SocialComponent } from './social.component'
import { of, Subject, throwError } from 'rxjs'
import { ISocialSearchResult } from '../../models/search.model'


describe('SocialComponent', () => {
    let component: SocialComponent
    let mockRouter: any
    let mockActivatedRoute: any
    let mockValueService: any
    let mockSearchService: any
    let isLtMediumSubject: Subject<boolean>
    let queryParamMapSubject: Subject<any>

    beforeEach(() => {
        // Create mock subjects for observables
        isLtMediumSubject = new Subject<boolean>()
        queryParamMapSubject = new Subject<any>()

        // Mock router
        mockRouter = {
            navigate: jest.fn(),
        }

        // Mock ActivatedRoute
        mockActivatedRoute = {
            queryParamMap: queryParamMapSubject.asObservable(),
            parent: {},
        }

        // Mock ValueService
        mockValueService = {
            isLtMedium$: isLtMediumSubject.asObservable(),
        }

        // Mock SearchServService
        mockSearchService = {
            fetchSocialSearchUsers: jest.fn(),
            updateSelectedFiltersSet: jest.fn(),
            handleFilters: jest.fn(),
        }

        // Create the component
        component = new SocialComponent(
            mockActivatedRoute,
            mockRouter,
            mockValueService,
            mockSearchService,
        )
    })

    afterEach(() => {
        // Clean up subscriptions
        component.ngOnDestroy()
    })

    test('should initialize with default values', () => {
        expect(component.searchRequestStatus).toBe('none')
        expect(component.filtersResponse).toEqual([])
        expect(component.searchResults).toEqual({} as ISocialSearchResult)
        expect(component.sideNavBarOpened).toBe(true)
        expect(component.searchRequest.query).toBe('')
        expect(component.searchRequest.sort).toBe('Relevance')
        expect(component.searchRequestObject.postKind).toBe('Query')
    })

    test('should update sideNavBarOpened based on screen size', () => {
        component.ngOnInit()

        // Emit small screen size
        isLtMediumSubject.next(true)
        expect(component.screenSizeIsLtMedium).toBe(true)
        expect(component.sideNavBarOpened).toBe(false)

        // Emit large screen size
        isLtMediumSubject.next(false)
        expect(component.screenSizeIsLtMedium).toBe(false)
        expect(component.sideNavBarOpened).toBe(true)
    })

    test('should process query parameters correctly', () => {
        // Mock the updateSelectedFiltersSet response
        mockSearchService.updateSelectedFiltersSet.mockReturnValue({
            filterSet: new Set(['filter1']),
            filterReset: true,
        })

        // Mock the fetchSocialSearchUsers response
        const mockSearchResult: any = {
            total: 10,
            result: [{
                id: '1', title: 'Test',
                abstract: '',
                accessPaths: [],
                activity: null,
                activityEndDate: null,
                attachments: [],
                body: '',
                dtCreated: '',
                dtLastModified: '',
                dtPublished: '',
                hasAcceptedAnswer: false,
                highlight: {
                    tags: undefined,
                    body: undefined,
                    title: undefined
                },
                hashTags: [],
                likes: '',
                options: [],
                org: '',
                postCreator: null,
                postKind: 'Blog',
                reply: [],
                replyCount: 0,
                rootOrg: '',
                source: {
                    id: '',
                    name: ''
                },
                status: '',
                tags: [],
                threadContributors: [],
                thumbnail: '',
                upVoteCount: 0
            }]
        }
        mockSearchService.fetchSocialSearchUsers.mockReturnValue(of(mockSearchResult))

        // Mock handleFilters response
        mockSearchService.handleFilters.mockReturnValue({
            filtersRes: [{ name: 'filter1', values: [] }],
        })

        // Initialize component
        component.ngOnInit()

        // Simulate query params
        queryParamMapSubject.next({
            has: (key: string) => ['q', 'f', 'sort', 'social'].includes(key),
            get: (key: string) => {
                if (key === 'q') return 'search query'
                if (key === 'f') return JSON.stringify({ contentType: ['Course'] })
                if (key === 'sort') return 'Latest'
                if (key === 'social') return 'Query'
                return null
            },
        })

        // Check if search request is updated correctly
        expect(component.searchRequestObject.query).toBe('search query')
        expect(component.searchRequestObject.filters).toEqual({ contentType: ['Course'] })
        expect(component.searchRequestObject.sort).toEqual([{ dtLastModified: 'desc' }])
        expect(component.searchRequestObject.postKind).toBe('Query')

        // Check if search service is called
        expect(mockSearchService.fetchSocialSearchUsers).toHaveBeenCalled()

        // Check if search results are updated
        expect(component.searchResults.total).toBe(10)
        expect(component.searchResults.result.length).toBe(1)
        expect(component.searchRequestStatus).toBe('hasMore')
        expect(component.noContent).toBe(false)
    })

    test('should handle empty search results', () => {
        // Mock the updateSelectedFiltersSet response
        mockSearchService.updateSelectedFiltersSet.mockReturnValue({
            filterSet: new Set(),
            filterReset: false,
        })

        // Mock the fetchSocialSearchUsers with empty results
        const mockEmptyResult: ISocialSearchResult = {
            total: 0,
            result: [],
            filters: [],
        }
        mockSearchService.fetchSocialSearchUsers.mockReturnValue(of(mockEmptyResult))

        // Mock handleFilters response
        mockSearchService.handleFilters.mockReturnValue({
            filtersRes: [],
        })

        // Initialize component
        component.ngOnInit()

        // Simulate query params
        queryParamMapSubject.next({
            has: (key: string) => key === 'q',
            get: (key: string) => key === 'q' ? 'empty search' : null,
        })

        // Check if no content flag is set to true
        expect(component.searchResults.total).toBe(0)
        expect(component.noContent).toBe(true)
        expect(component.searchRequestStatus).toBe('done')
    })

    test('should handle error in search', () => {
        // Mock the updateSelectedFiltersSet response
        mockSearchService.updateSelectedFiltersSet.mockReturnValue({
            filterSet: new Set(),
            filterReset: false,
        })

        // Mock the fetchSocialSearchUsers with error
        mockSearchService.fetchSocialSearchUsers.mockReturnValue(throwError('Test error'))

        // Initialize component
        component.ngOnInit()

        // Simulate query params
        queryParamMapSubject.next({
            has: () => false,
            get: () => null,
        })

        // Check if error is handled correctly
        expect(component.error.load).toBe(true)
        expect(component.error.message).toBe('Test error')
        expect(component.searchRequestStatus).toBe('done')
    })

    test('should remove filters correctly', () => {
        component.removeFilters()
        expect(mockRouter.navigate).toHaveBeenCalledWith(
            [],
            {
                queryParams: { f: null },
                queryParamsHandling: 'merge',
                relativeTo: mockActivatedRoute.parent,
            }
        )
    })

    test('should toggle between Query and Blog post kind', () => {
        // Initialize with Query
        component.query = true
        component.searchRequestObject.postKind = 'Query'

        // Toggle to Blog
        component.toggleBestResults()

        expect(component.query).toBe(false)
        expect(component.searchRequestObject.postKind).toBe('Blog')
        expect(component.searchRequestObject.pageNo).toBe(0)
        expect(mockRouter.navigate).toHaveBeenCalledWith(
            [],
            {
                queryParams: { social: 'Blog' },
                queryParamsHandling: 'merge',
                relativeTo: mockActivatedRoute.parent,
            }
        )

        // Toggle back to Query
        component.toggleBestResults()

        expect(component.query).toBe(true)
        expect(component.searchRequestObject.postKind).toBe('Query')
    })

    test('should change sort order', () => {
        component.sortOrder('Latest')

        expect(mockRouter.navigate).toHaveBeenCalledWith(
            [],
            {
                queryParams: { sort: 'Latest' },
                queryParamsHandling: 'merge',
                relativeTo: mockActivatedRoute.parent,
            }
        )
    })

    test('should close filter sidebar', () => {
        component.sideNavBarOpened = true
        component.closeFilter(false)

        expect(component.sideNavBarOpened).toBe(false)
    })

    test('should unsubscribe from observables on destroy', () => {
        // Create spies for subscription unsubscribe methods
        const spy1 = jest.fn()
        const spy2 = jest.fn()

        // Set up component subscriptions
        component.defaultSideNavBarOpenedSubscription = { unsubscribe: spy1 } as any
        component.searchResultsSubscription = { unsubscribe: spy2 } as any

        // Call ngOnDestroy
        component.ngOnDestroy()

        // Check if unsubscribe was called
        expect(spy1).toHaveBeenCalled()
        expect(spy2).toHaveBeenCalled()
    })
})