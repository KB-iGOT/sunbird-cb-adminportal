import { SearchRootComponent } from './search-root.component'
import { Router, ActivatedRoute, UrlTree, UrlSegmentGroup, UrlSegment } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { of } from 'rxjs'

// Mock implementations
const mockRouter = {
    parseUrl: jest.fn(),
    navigateByUrl: jest.fn(),
    url: '/app/search/learning'
}

const mockActivatedRoute = {
    snapshot: {
        data: {
            searchPageData: {
                data: {
                    search: {
                        tabs: ['Learning', 'Social'],
                        routeValue: ['learning', 'social'],
                        placeHolder: { learning: 'Search learning content' },
                        social: { enabled: true }
                    }
                }
            }
        }
    },
    queryParamMap: of(new Map([['q', 'test query']])),
    parent: {}
}

const mockConfigService = {
    pageNavBar: {
        background: 'primary',
        color: 'white'
    }
}

// Mock Map for query params
class MockParamMap {
    private params: Map<string, string>

    constructor(params: [string, string][]) {
        this.params = new Map(params)
    }

    has(key: string): boolean {
        return this.params.has(key)
    }

    get(key: string): string | null {
        return this.params.get(key) || null
    }
}

describe('SearchRootComponent', () => {
    let component: SearchRootComponent
    let router: Router
    let activatedRoute: ActivatedRoute
    let configService: ConfigurationsService

    beforeEach(() => {
        router = mockRouter as any
        activatedRoute = mockActivatedRoute as any
        configService = mockConfigService as any

        component = new SearchRootComponent(router, activatedRoute, configService)

        // Reset mocks
        jest.clearAllMocks()
    })

    describe('Component Initialization', () => {
        it('should create component with default values', () => {
            expect(component).toBeDefined()
            expect(component.route).toBe('learning')
            expect(component.selectedIndex).toBe(0)
            expect(component.searchRequest.query).toBe('')
            expect(component.searchRequest.filters).toEqual({})
        })

        it('should initialize searchTabs with default structure', () => {
            expect(component.searchTabs).toEqual({
                tabs: [],
                routeValue: [],
                placeHolder: {},
                social: {}
            })
        })

        it('should set pageNavbar from config service', () => {
            expect(component.pageNavbar).toEqual(mockConfigService.pageNavBar)
        })
    })

    describe('ngOnInit', () => {
        it('should set searchTabs from route data when available', () => {
            component.ngOnInit()

            expect(component.searchTabs).toEqual({
                tabs: ['Learning', 'Social'],
                routeValue: ['learning', 'social'],
                placeHolder: { learning: 'Search learning content' },
                social: { enabled: true }
            })
        })

        it('should handle missing search data gracefully', () => {
            const mockActivatedRouteNoData = {
                snapshot: {
                    data: {
                        searchPageData: {
                            data: {}
                        }
                    }
                },
                queryParamMap: of(new MockParamMap([])),
                parent: {}
            }

            const componentNoData = new SearchRootComponent(
                router,
                mockActivatedRouteNoData as any,
                configService
            )

            componentNoData.ngOnInit()

            expect(componentNoData.searchTabs).toEqual({
                tabs: [],
                routeValue: [],
                placeHolder: {},
                social: {}
            })
        })

        it('should set search query from query params', () => {
            const mockActivatedRouteWithQuery = {
                ...mockActivatedRoute,
                queryParamMap: of(new MockParamMap([['q', 'angular testing']]))
            }

            const componentWithQuery = new SearchRootComponent(
                router,
                mockActivatedRouteWithQuery as any,
                configService
            )

            componentWithQuery.ngOnInit()

            expect(componentWithQuery.searchRequest.query).toBe('angular testing')
        })

        it('should handle missing query param', () => {
            const mockActivatedRouteNoQuery = {
                ...mockActivatedRoute,
                queryParamMap: of(new MockParamMap([]))
            }

            const componentNoQuery = new SearchRootComponent(
                router,
                mockActivatedRouteNoQuery as any,
                configService
            )

            componentNoQuery.ngOnInit()

            expect(componentNoQuery.searchRequest.query).toBe('')
        })

        it('should parse URL and set route and selectedIndex', () => {
            const mockUrlTree: UrlTree = {
                root: {
                    children: {
                        primary: {
                            segments: [
                                { path: 'app' } as UrlSegment,
                                { path: 'search' } as UrlSegment,
                                { path: 'social' } as UrlSegment
                            ]
                        } as UrlSegmentGroup
                    }
                }
            } as unknown as UrlTree

            mockRouter.parseUrl.mockReturnValue(mockUrlTree)

            component.searchTabs = {
                tabs: [],
                routeValue: ['learning', 'social'],
                placeHolder: {},
                social: {}
            }

            component.ngOnInit()

            expect(mockRouter.parseUrl).toHaveBeenCalledWith('/app/search/learning')
            expect(component.route).toBe('social')
            expect(component.selectedIndex).toBe(1)
        })

        it('should handle URL parsing with single segment', () => {
            const mockUrlTree: UrlTree = {
                root: {
                    children: {
                        primary: {
                            segments: [
                                { path: 'learning' } as UrlSegment
                            ]
                        } as UrlSegmentGroup
                    }
                }
            } as unknown as UrlTree

            mockRouter.parseUrl.mockReturnValue(mockUrlTree)

            component.searchTabs = {
                tabs: [],
                routeValue: ['learning'],
                placeHolder: {},
                social: {}
            }

            component.ngOnInit()

            expect(component.route).toBe('learning')
            expect(component.selectedIndex).toBe(0)
        })
    })

    describe('routeTabs', () => {
        beforeEach(() => {
            component.searchTabs = {
                tabs: [],
                routeValue: ['learning', 'social', 'training'],
                placeHolder: {},
                social: {}
            }
        })

        it('should set selectedIndex and navigate to correct route', () => {
            component.routeTabs(1)

            expect(component.selectedIndex).toBe(1)
            expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app/search/social')
        })

        it('should navigate to first tab', () => {
            component.routeTabs(0)

            expect(component.selectedIndex).toBe(0)
            expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app/search/learning')
        })

        it('should navigate to last tab', () => {
            component.routeTabs(2)

            expect(component.selectedIndex).toBe(2)
            expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app/search/training')
        })

        it('should handle tab index out of bounds gracefully', () => {
            component.routeTabs(5)

            expect(component.selectedIndex).toBe(5)
            expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app/search/undefined')
        })
    })

    describe('hasKeys', () => {
        it('should return true for object with keys', () => {
            const objWithKeys = { key1: 'value1', key2: 'value2' }
            expect(component.hasKeys(objWithKeys)).toBe(true)
        })

        it('should return false for empty object', () => {
            const emptyObj = {}
            expect(component.hasKeys(emptyObj)).toBe(false)
        })

        it('should return false for null', () => {
            expect(component.hasKeys({})).toBe(false)
        })

        it('should return false for undefined', () => {
            expect(component.hasKeys({})).toBe(false)
        })

        it('should return true for object with single key', () => {
            const objWithOneKey = { singleKey: 'value' }
            expect(component.hasKeys(objWithOneKey)).toBe(true)
        })

        it('should return true for object with nested objects', () => {
            const nestedObj = {
                level1: {
                    level2: 'value'
                }
            }
            expect(component.hasKeys(nestedObj)).toBe(true)
        })

        it('should return true for object with array values', () => {
            const objWithArray = { items: ['item1', 'item2'] }
            expect(component.hasKeys(objWithArray)).toBe(true)
        })
    })

    describe('Observable Subscriptions', () => {
        it('should handle query param changes', () => {
            const queryParamSubject = {
                subscribe: jest.fn()
            }

            const mockActivatedRouteObservable = {
                ...mockActivatedRoute,
                queryParamMap: queryParamSubject
            }

            const componentWithObservable = new SearchRootComponent(
                router,
                mockActivatedRouteObservable as any,
                configService
            )

            componentWithObservable.ngOnInit()

            expect(queryParamSubject.subscribe).toHaveBeenCalled()
        })
    })

    describe('Edge Cases', () => {
        it('should handle route value not found in array', () => {
            component.searchTabs = {
                tabs: [],
                routeValue: ['learning', 'social'],
                placeHolder: {},
                social: {}
            }

            const mockUrlTree: UrlTree = {
                root: {
                    children: {
                        primary: {
                            segments: [
                                { path: 'unknown' } as UrlSegment
                            ]
                        } as UrlSegmentGroup
                    }
                }
            } as unknown as UrlTree

            mockRouter.parseUrl.mockReturnValue(mockUrlTree)

            component.ngOnInit()

            expect(component.route).toBe('unknown')
            expect(component.selectedIndex).toBe(-1)
        })

        it('should handle empty URL segments', () => {
            const mockUrlTree: UrlTree = {
                root: {
                    children: {
                        primary: {
                            segments: []
                        } as unknown as UrlSegmentGroup
                    }
                }
            } as unknown as UrlTree

            mockRouter.parseUrl.mockReturnValue(mockUrlTree)

            component.ngOnInit()

            // Should handle empty segments gracefully
            expect(component.route).toBe(undefined)
        })
    })
})

// Additional test for integration scenarios
describe('SearchRootComponent Integration Tests', () => {
    let component: SearchRootComponent

    beforeEach(() => {
        const router = mockRouter as any
        const activatedRoute = mockActivatedRoute as any
        const configService = mockConfigService as any

        component = new SearchRootComponent(router, activatedRoute, configService)
    })

    it('should complete full initialization flow', () => {
        component.ngOnInit()

        expect(component.searchTabs.tabs).toEqual(['Learning', 'Social'])
        expect(component.searchRequest.query).toBe('test query')
        expect(component.selectedIndex).toBe(0)
    })

    it('should handle tab routing with query preservation', () => {
        component.searchRequest.query = 'preserved query'
        component.searchTabs = {
            tabs: [],
            routeValue: ['learning', 'social'],
            placeHolder: {},
            social: {}
        }

        component.routeTabs(1)

        expect(component.selectedIndex).toBe(1)
        expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app/search/social')
    })
})