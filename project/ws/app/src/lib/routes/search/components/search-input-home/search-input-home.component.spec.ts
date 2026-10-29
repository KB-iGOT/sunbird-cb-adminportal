import { Directive, NO_ERRORS_SCHEMA } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, Router } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { SearchServService } from '../../services/search-serv.service'
import { SearchInputHomeComponent } from './search-input-home.component'
import { of } from 'rxjs'
import { readFileSync } from 'fs'
import { join } from 'path'

@Directive({ selector: 'mat-autocomplete', exportAs: 'matAutocomplete', standalone: false })
class MatAutocompleteStubDirective { }

@Directive({ selector: 'mat-menu', exportAs: 'matMenu', standalone: false })
class MatMenuStubDirective { }

describe('SearchInputHomeComponent', () => {
    let component: SearchInputHomeComponent

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
    const route: Partial<ActivatedRoute> = {}

    beforeAll(() => {
        component = new SearchInputHomeComponent(
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
                declarations: [SearchInputHomeComponent, MatAutocompleteStubDirective, MatMenuStubDirective],
                providers: [
                    { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {}, data: {} }, queryParamMap: of() } },
                    { provide: Router, useValue: { navigate: jest.fn() } },
                    {
                        provide: SearchServService,
                        useValue: {
                            getLanguageSearchIndex: jest.fn(() => 'en'),
                            getSearchConfig: jest.fn(() => new Promise(() => { })),
                        },
                    },
                    { provide: ConfigurationsService, useValue: {} },
                ],
                schemas: [NO_ERRORS_SCHEMA],
            })
            // the real template contains a stray `="search content"` attribute with an empty name, which jsdom
            // cannot create, so only that fragment is stripped before rendering the actual markup
            const template = readFileSync(join(__dirname, 'search-input-home.component.html'), 'utf8').replace('"="search content"', '"')
            TestBed.overrideTemplate(SearchInputHomeComponent, template)
        })

        it('should render the search combobox without an accesskey', () => {
            const fixture = TestBed.createComponent(SearchInputHomeComponent)
            fixture.detectChanges()
            const input: HTMLInputElement = fixture.nativeElement.querySelector('input[role="combobox"]')

            expect(input).toBeTruthy()
            expect(input.hasAttribute('accesskey')).toBe(false)
            expect(fixture.nativeElement.querySelector('[accesskey]')).toBeNull()
        })
    })
})
