
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router'
import { RolesService } from '../../services/roles.service'
import { UsersService } from '../../services/users.service'
import { RolesAccessComponent } from './roles-access.component'
import { of } from 'rxjs'

describe('RolesAccessComponent', () => {
    let component: RolesAccessComponent

    const router: Partial<Router> = {}
    const activeRoute: Partial<ActivatedRoute> = {
        snapshot: {
            parent: {
                params: { batch: '12', id: '1' },
                paramMap: convertToParamMap({ contentId: '1234' }),
                data: {
                    configService: {
                        unMappedUser: {
                            roles: ['PUBLIC', 'STATE_ADMIN'],
                        },

                    },
                },
            },
            params: { id: '1', formId: '123' },
            paramMap: convertToParamMap({ contentId: '1234' }),
            queryParams: of({ roleId: 'testRoleId' }),
        } as any,
        queryParams: of({ someParam: 'initialValue' }),
    }
    const usersService: Partial<UsersService> = {
        getAllKongUsers: jest.fn(() => of({
            res: {
                result: {
                    response: {
                        content: 'sample content',
                    },
                },
            },
        })),
    }
    const roleservice: Partial<RolesService> = {}

    beforeAll(() => {
        component = new RolesAccessComponent(
            router as Router,
            activeRoute as ActivatedRoute,
            usersService as UsersService,
            roleservice as RolesService
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
                declarations: [RolesAccessComponent],
                providers: [
                    { provide: Router, useValue: { navigate: jest.fn() } },
                    { provide: ActivatedRoute, useValue: activeRoute },
                    {
                        provide: UsersService,
                        useValue: { getAllKongUsers: jest.fn(() => of({ result: { response: { content: [] } } })) },
                    },
                    {
                        provide: RolesService,
                        useValue: {
                            getAllRoles: jest.fn(() => of({ result: { response: { value: JSON.stringify({ orgTypeList: [] }) } } })),
                        },
                    },
                ],
                schemas: [NO_ERRORS_SCHEMA],
            })
        })

        it('should keep the header link in the natural tab order (tabindex 0)', () => {
            const fixture = TestBed.createComponent(RolesAccessComponent)
            fixture.detectChanges()
            const header: HTMLElement = fixture.nativeElement.querySelector('#rolescs > div[role="link"]')

            expect(header).toBeTruthy()
            expect(header.getAttribute('tabindex')).toBe('0')
            expect(fixture.nativeElement.querySelector('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])')).toBeNull()
        })
    })
})
