import { Directive, NO_ERRORS_SCHEMA } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { SearchServService } from '../../services/search-serv.service'
import { SearchInputComponent } from './search-input.component'
import { of } from 'rxjs'
import { readFileSync } from 'fs'
import { join } from 'path'

@Directive({ selector: 'mat-autocomplete', exportAs: 'matAutocomplete', standalone: false })
class MatAutocompleteStubDirective { }

@Directive({ selector: 'mat-menu', exportAs: 'matMenu', standalone: false })
class MatMenuStubDirective { }

describe('SearchInputComponent', () => {
    let component: SearchInputComponent

    const activated: Partial<ActivatedRoute> = {
        snapshot: {
            parent: {
                data: {
                    configSvc: {
                        userProfile: {
                            userId: 'sampleId',
                        },
                        unMappedUser: {
                            roles: ['PUBLIC', 'STATE_ADMIN'],
                        },
                    },
                },
            },
            params: of({ tab: 'verified' }),
            queryParams: of({ roleId: 'testRoleId' }),
        } as any,
        params: of({ tab: 'verified' }),
        queryParams: of({ roleId: 'testRoleId' }),
    }
    const router: Partial<Router> = {}
    const searchServSvc: Partial<SearchServService> = {
        getLanguageSearchIndex: jest.fn(),
    }
    const configSvc: Partial<ConfigurationsService> = {}
    const route: Partial<ActivatedRoute> = {
        snapshot: {
            parent: {
                data: {
                    configSvc: {
                        userProfile: {
                            userId: 'sampleId',
                        },
                        unMappedUser: {
                            roles: ['PUBLIC', 'STATE_ADMIN'],
                        },
                    },
                },
            },
            params: of({ tab: 'verified' }),
            queryParams: of({ roleId: 'testRoleId' }),
            data: {
                searchPageData: {
                    data: {
                        search: {
                            isAutoCompleteAllowed: true,
                        },
                    },
                },
            },
        } as any,
        params: of({ tab: 'verified' }),
        queryParams: of({ roleId: 'testRoleId' }),
    }

    beforeAll(() => {
        component = new SearchInputComponent(
            activated as ActivatedRoute,
            router as Router,
            searchServSvc as SearchServService,
            configSvc as ConfigurationsService,
            route as ActivatedRoute
        )
    })

    beforeEach(() => {
        jest.clearAllMocks()
        jest.resetAllMocks()
    })

    it('should create a instance of component', () => {
        expect(component).toBeTruthy()
    })

    describe('template', () => {
        beforeEach(() => {
            TestBed.configureTestingModule({
                declarations: [SearchInputComponent, MatAutocompleteStubDirective, MatMenuStubDirective],
                providers: [
                    {
                        provide: ActivatedRoute,
                        useValue: {
                            snapshot: {
                                queryParams: { q: 'angular' },
                                data: { searchPageData: { data: { search: { isAutoCompleteAllowed: false, languageSearch: ['en'] } } } },
                            },
                            queryParamMap: of(convertToParamMap({ q: 'angular' })),
                        },
                    },
                    { provide: Router, useValue: { navigate: jest.fn() } },
                    { provide: SearchServService, useValue: { getLanguageSearchIndex: jest.fn(() => 'en') } },
                    { provide: ConfigurationsService, useValue: {} },
                ],
                schemas: [NO_ERRORS_SCHEMA],
            })
            // the real template contains a stray `="search content"` attribute with an empty name, which jsdom
            // cannot create, so only that fragment is stripped before rendering the actual markup
            const template = readFileSync(join(__dirname, 'search-input.component.html'), 'utf8').replace('"="search content"', '"')
            TestBed.overrideTemplate(SearchInputComponent, template)
        })

        it('should render the search input without an accesskey', () => {
            const fixture = TestBed.createComponent(SearchInputComponent)
            fixture.detectChanges()
            const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="search"]')

            expect(input).toBeTruthy()
            expect(input.hasAttribute('accesskey')).toBe(false)
            expect(fixture.nativeElement.querySelector('[accesskey]')).toBeNull()
        })
    })
})
