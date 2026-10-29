import { NO_ERRORS_SCHEMA } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { Router, ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'
import { ProfileV2Service } from '../../../home/services/home.servive'
import { ProfileV2UtillService } from '../../services/home-utill.service'
import { UsersService } from '../../services/users.service'
import { RolesUsersComponent } from './roles-users.component'

describe('RolesUsersComponent', () => {
    let component: RolesUsersComponent

    const usersSvc: Partial<UsersService> = {}
    const router: Partial<Router> = {}
    const profileUtilSvc: Partial<ProfileV2UtillService> = {}
    const route: Partial<ActivatedRoute> = {}
    const profile: Partial<ProfileV2Service> = {}
    const usersService: Partial<UsersService> = {}

    beforeAll(() => {
        component = new RolesUsersComponent(
            usersSvc as UsersService,
            router as Router,
            profileUtilSvc as ProfileV2UtillService,
            route as ActivatedRoute,
            profile as ProfileV2Service,
            usersService as UsersService
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
            const usersServiceMock = { getAllRoleUsers: jest.fn(() => of({})) }
            TestBed.configureTestingModule({
                declarations: [RolesUsersComponent],
                providers: [
                    { provide: UsersService, useValue: usersServiceMock },
                    { provide: Router, useValue: { url: '/app/home/roles-users', navigate: jest.fn() } },
                    { provide: ProfileV2UtillService, useValue: {} },
                    {
                        provide: ActivatedRoute,
                        useValue: {
                            snapshot: { parent: { data: { configService: { unMappedUser: { rootOrg: { orgName: 'Org' } } } } } },
                            queryParams: of({ role: 'MDO_ADMIN', orgID: 'org-1' }),
                        },
                    },
                    { provide: ProfileV2Service, useValue: {} },
                ],
                schemas: [NO_ERRORS_SCHEMA],
            })
        })

        it('should keep the header link in the natural tab order (tabindex 0)', () => {
            const fixture = TestBed.createComponent(RolesUsersComponent)
            fixture.detectChanges()
            const header: HTMLElement = fixture.nativeElement.querySelector('#rolescs > div[role="link"]')

            expect(header).toBeTruthy()
            expect(header.getAttribute('tabindex')).toBe('0')
            expect(fixture.nativeElement.querySelector('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])')).toBeNull()
        })
    })
})
