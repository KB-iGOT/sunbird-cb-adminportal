import { Directive, NO_ERRORS_SCHEMA } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, Router } from '@angular/router'
import { ValueService } from '@sunbird-cb/utils-v2'
import { KnowledgeComponent } from './knowledge.component'
import { SearchServService } from '../../services/search-serv.service'
import { of, Subject } from 'rxjs'

@Directive({ selector: 'mat-menu', exportAs: 'matMenu', standalone: false })
class MatMenuStubDirective { }

describe('KnowledgeComponent', () => {
    let component: KnowledgeComponent
    let mockActivatedRoute: any
    let mockRouter: any
    let mockValueService: any
    let mockSearchService: any
    let queryParamMapSubject: Subject<any>
    let isLtMediumSubject: Subject<boolean>

    beforeEach(() => {
        queryParamMapSubject = new Subject()
        isLtMediumSubject = new Subject()

        // Mock ActivatedRoute
        mockActivatedRoute = {
            queryParamMap: queryParamMapSubject.asObservable(),
            parent: {}
        }

        // Mock Router
        mockRouter = {
            navigate: jest.fn()
        }

        // Mock ValueService
        mockValueService = {
            isLtMedium$: isLtMediumSubject.asObservable()
        }

        // Mock SearchServService
        mockSearchService = {
            formatFilterForSearch: jest.fn().mockReturnValue('mockFilter'),
            updateSelectedFiltersSet: jest.fn().mockReturnValue({
                filterSet: new Set(['filter1']),
                filterReset: true
            }),
            fetchSearchDataDocs: jest.fn().mockReturnValue(of({
                count: 2,
                filters: {},
                hits: [{ id: '1' }, { id: '2' }]
            })),
            setTilesDocs: jest.fn().mockReturnValue([{ id: '1', title: 'Doc 1' }, { id: '2', title: 'Doc 2' }]),
            formatKhubFilters: jest.fn().mockReturnValue([]),
            handleFilters: jest.fn().mockReturnValue({
                filtersRes: [{ displayName: 'Type', content: [] }]
            })
        }

        // Create component instance
        component = new KnowledgeComponent(
            mockActivatedRoute,
            mockRouter,
            mockValueService,
            mockSearchService
        )

        // Spy on the getResults method
        jest.spyOn(component, 'getResults').mockImplementation(() => { })
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize with default values', () => {
        expect(component.searchRequestStatus).toBe('none')
        expect(component.routeComp).toBe('knowledge')
        expect(component.filtersResetAble).toBe(false)
        expect(component.selectedFilterSet).toEqual(new Set())
        expect(component.knowledgeData).toEqual([])
        expect(component.noContent).toBe(false)
    })

    it('should set sideNavBarOpened based on screen size', () => {
        component.ngOnInit()

        // Simulate screen size change
        isLtMediumSubject.next(true)
        expect(component.screenSizeIsLtMedium).toBe(true)
        expect(component.sideNavBarOpened).toBe(false)

        isLtMediumSubject.next(false)
        expect(component.screenSizeIsLtMedium).toBe(false)
        expect(component.sideNavBarOpened).toBe(true)
    })

    it('should handle query params with search query', () => {
        component.ngOnInit()

        // Simulate query params with search query
        queryParamMapSubject.next({
            has: jest.fn(key => key === 'q'),
            get: jest.fn(key => key === 'q' ? 'test query' : null)
        })

        expect(component.searchRequest.query).toBe('test query')
        expect(component.searchObj.searchQuery).toBe('test query')
        expect(component.getResults).toHaveBeenCalled()
    })

    it('should handle query params with filters', () => {
        component.ngOnInit()

        const mockFilters = { contentType: ['pdf'] }

        // Simulate query params with filters
        queryParamMapSubject.next({
            has: jest.fn(key => key === 'f'),
            get: jest.fn(key => key === 'f' ? JSON.stringify(mockFilters) : null)
        })

        expect(component.searchRequest.filters).toEqual(mockFilters)
        expect(mockSearchService.formatFilterForSearch).toHaveBeenCalledWith(mockFilters)
        expect(component.getResults).toHaveBeenCalled()
    })

    it('should handle query params with sort', () => {
        component.ngOnInit()

        // Simulate query params with sort
        queryParamMapSubject.next({
            has: jest.fn(key => key === 'sort'),
            get: jest.fn(key => key === 'sort' ? 'desc' : null)
        })

        expect(component.searchRequest.sort).toBe('desc')
        expect(component.getResults).toHaveBeenCalled()
    })

    it('should call removeFilters correctly', () => {
        component.removeFilters()

        expect(mockRouter.navigate).toHaveBeenCalledWith(
            [],
            {
                queryParams: { f: null },
                queryParamsHandling: 'merge',
                relativeTo: mockActivatedRoute.parent
            }
        )
    })

    it('should call sortOrder correctly', () => {
        component.sortOrder('asc')

        expect(mockRouter.navigate).toHaveBeenCalledWith(
            [],
            {
                queryParams: { sort: 'asc' },
                queryParamsHandling: 'merge',
                relativeTo: mockActivatedRoute.parent
            }
        )
    })

    it('should update sideNavBarOpened when closeFilter is called', () => {
        component.closeFilter(false)
        expect(component.sideNavBarOpened).toBe(false)

        component.closeFilter(true)
        expect(component.sideNavBarOpened).toBe(true)
    })

    it('should unsubscribe from observables on ngOnDestroy', () => {
        // Setup subscriptions
        component.ngOnInit()

        // Create spies for unsubscribe methods
        const searchResultsUnsubscribeSpy = jest.fn()
        const defaultSideNavBarOpenedUnsubscribeSpy = jest.fn()

        // Mock the subscriptions
        component.searchResultsSubscription = { unsubscribe: searchResultsUnsubscribeSpy } as any
        component.defaultSideNavBarOpenedSubscription = { unsubscribe: defaultSideNavBarOpenedUnsubscribeSpy } as any

        // Trigger destroy
        component.ngOnDestroy()

        // Verify unsubscribe was called
        expect(searchResultsUnsubscribeSpy).toHaveBeenCalled()
        expect(defaultSideNavBarOpenedUnsubscribeSpy).toHaveBeenCalled()
    })

    describe('View More button template', () => {
        beforeEach(() => {
            TestBed.configureTestingModule({
                declarations: [KnowledgeComponent, MatMenuStubDirective],
                providers: [
                    { provide: ActivatedRoute, useValue: mockActivatedRoute },
                    { provide: Router, useValue: mockRouter },
                    { provide: ValueService, useValue: { isLtMedium$: of(false) } },
                    { provide: SearchServService, useValue: mockSearchService },
                ],
                schemas: [NO_ERRORS_SCHEMA],
            })
        })

        it('should render the View More button without an accesskey and load more results on click', () => {
            const fixture = TestBed.createComponent(KnowledgeComponent)
            const instance = fixture.componentInstance
            const getResultsSpy = jest.spyOn(instance, 'getResults').mockImplementation(() => { })
            instance.knowledgeData = [{ id: '1', title: 'Doc 1' } as any]
            instance.searchRequestStatus = 'hasMore'
            fixture.detectChanges()

            const button: HTMLButtonElement = Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button'))
                .find(btn => (btn.textContent || '').includes('View More')) as HTMLButtonElement

            expect(button).toBeTruthy()
            expect(button.hasAttribute('accesskey')).toBe(false)
            expect(fixture.nativeElement.querySelector('[accesskey]')).toBeNull()

            button.click()
            expect(getResultsSpy).toHaveBeenCalled()
        })
    })
})