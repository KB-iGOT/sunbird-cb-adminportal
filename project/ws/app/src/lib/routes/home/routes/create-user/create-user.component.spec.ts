import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute, Router } from '@angular/router'
import { EventService } from '@sunbird-cb/utils-v2'
import { of, throwError } from 'rxjs'
import { CreateUserComponent } from './create-user.component'
import { CreateMDOService } from '../../services/create-mdo.services'
import { DirectoryService } from '../../services/directory.services'
import { ProfileV2UtillService } from '../../services/home-utill.service'
import { UsersService } from '../../services/users.service'

describe('CreateUserComponent', () => {
    let component: CreateUserComponent
    let mockUsersService: any
    let mockMatSnackBar: any
    let mockRouter: any
    let mockDirectoryService: any
    let mockCreateMDOService: any
    let mockProfileUtilSvc: any
    let mockEvents: any
    let mockActivatedRoute: any

    beforeEach(() => {
        mockUsersService = {
            createUser: jest.fn(),
            searchMDOLeaders: jest.fn().mockReturnValue(of({ result: { response: { count: 2 } } })),
        }
        mockMatSnackBar = { open: jest.fn() }
        mockRouter = {
            navigate: jest.fn(),
            getCurrentNavigation: jest.fn().mockReturnValue(null),
        }
        mockDirectoryService = {
            getOrgTypeList$: jest.fn().mockReturnValue(of({
                orgTypeList: [
                    { name: 'SPV', roles: ['PUBLIC', 'MDO_ADMIN'] },
                    { name: 'CBP', roles: ['CBP_ADMIN'] },
                ],
            })),
            getOrgTypeConfig$: jest.fn().mockReturnValue(of({ fields: [] })),
        }
        mockCreateMDOService = { assignAdminToDepartment: jest.fn() }
        mockProfileUtilSvc = { transformToEmail: jest.fn((e: string) => e) }
        mockEvents = { raiseInteractTelemetry: jest.fn() }
        mockActivatedRoute = {
            queryParams: of({
                id: '1',
                orgName: 'OrgName',
                subOrgType: 'SPV',
                redirectionPath: '/app/home/',
            }),
            snapshot: {
                queryParams: {
                    createDept: JSON.stringify({ depName: 'DeptName', depType: 'SPV' }),
                },
                data: {
                    configService: { unMappedUser: { rootOrg: { orgName: 'TestOrg' } } },
                },
            },
        }

        component = TestBed.runInInjectionContext(() => new CreateUserComponent(
            mockActivatedRoute,
            mockRouter,
            mockMatSnackBar,
            mockDirectoryService,
            mockCreateMDOService,
            mockProfileUtilSvc,
            mockUsersService,
            mockEvents,
        ))
    })

    it('should create the component and initialize values', () => {
        expect(component).toBeDefined()
        expect(component.createUserForm).toBeDefined()
        expect(component.createUserForm.controls['fname']).toBeDefined()
        expect(component.deptId).toBe('1')
        expect(component.currentDept).toBe('SPV')
    })

    it('should call getMdoLeader from query params subscription in constructor', () => {
        expect(mockUsersService.searchMDOLeaders).toHaveBeenCalledWith('1')
        expect(component.mdoLeadersCount).toBe(2)
    })

    it('should load roles for the current department on init', () => {
        component.ngOnInit()
        expect(mockDirectoryService.getOrgTypeList$).toHaveBeenCalled()
        expect(mockDirectoryService.getOrgTypeConfig$).toHaveBeenCalled()
        expect(component.roles).toEqual(['PUBLIC', 'MDO_ADMIN'])
        expect((component.dropdownSettings as any).idField).toBe('id')
    })

    it('should validate email and set emailLengthVal', () => {
        component.emailVerification('test@domain.com')
        expect(component.emailLengthVal).toBe(false)

        const invalidEmail = `${'a'.repeat(65)}@domain.com`
        component.emailVerification(invalidEmail)
        expect(component.emailLengthVal).toBe(true)
    })

    it('should accept valid emails in the email control', () => {
        const emailControl = component.createUserForm.controls['email']
        const validEmails = ['john.doe@gov.in', 'ab@b.co', 'a-b_c.d@x-y.z.com']
        validEmails.forEach(email => {
            emailControl.setValue(email)
            expect(emailControl.hasError('pattern')).toBe(false)
        })
    })

    it('should reject invalid emails in the email control', () => {
        const emailControl = component.createUserForm.controls['email']
        const invalidEmails = ['a@b.co', '.ab@x.com', 'ab.@x.com', 'ab@-x.com', 'ab@x-.com', 'ab@x.comma', 'ab@x', 'abx.com']
        invalidEmails.forEach(email => {
            emailControl.setValue(email)
            expect(emailControl.hasError('pattern')).toBe(true)
        })
    })

    it('should reject a long invalid email quickly', () => {
        const emailControl = component.createUserForm.controls['email']
        const start = Date.now()
        emailControl.setValue(`${'a'.repeat(50000)}!`)
        expect(emailControl.hasError('pattern')).toBe(true)
        expect(Date.now() - start).toBeLessThan(1000)
    })

    const form = {
        value: {
            email: 'test@domain.com',
            fname: 'John',
            mobileNumber: '1234567890',
            role: ['PUBLIC'],
            dept: 'DeptName',
            deptId: 'DeptID',
        },
    }

    it('should call onSubmit and handle success', () => {
        mockUsersService.createUser.mockReturnValue(of({ userId: '12345' }))
        component.createUserForm.patchValue({ role: ['PUBLIC'] })

        component.onSubmit(form)

        expect(mockEvents.raiseInteractTelemetry).toHaveBeenCalled()
        expect(component.displayLoader).toBe(false)
        expect(component.disableCreateButton).toBe(false)
        expect(mockMatSnackBar.open).toHaveBeenCalledWith('User created successfully!', 'X', { duration: 5000 })
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/users'])
    })

    it('should call onSubmit and handle error', () => {
        mockUsersService.createUser.mockReturnValue(
            throwError(({
                error: { params: { errmsg: 'This phone is already registered with an existing user' } },
            }))
        )
        component.createUserForm.patchValue({ role: ['PUBLIC'] })

        component.onSubmit(form)

        expect(component.displayLoader).toBe(false)
        expect(component.disableCreateButton).toBe(false)
        expect(mockMatSnackBar.open).toHaveBeenCalledWith('This Phone is already registered with an existing User', 'X', {
            duration: 5000,
        })
    })

    it('should block onSubmit when MDO_LEADER already allocated', () => {
        component.createUserForm.patchValue({ role: ['MDO_LEADER'] })
        component.onSubmit(form)
        expect(mockUsersService.createUser).not.toHaveBeenCalled()
        expect(component.displayLoader).toBe(false)
        expect(mockMatSnackBar.open).toHaveBeenCalled()
    })

    it('should handle item select', () => {
        component.onItemSelect([{ id: 1, deptName: 'Dept1' }])
        expect(component.selectedDept).toEqual([{ id: 1, deptName: 'Dept1' }])
    })

    it('should toggle user roles', () => {
        component.modifyUserRoles('MDO_LEADER')
        expect(component.userRoles.has('MDO_LEADER')).toBe(true)

        component.modifyUserRoles('MDO_LEADER')
        expect(component.userRoles.has('MDO_LEADER')).toBe(false)
    })

    describe('template', () => {
        let fixture: ComponentFixture<CreateUserComponent>

        beforeEach(async () => {
            // the outer beforeEach already instantiated the test module via runInInjectionContext
            TestBed.resetTestingModule()
            await TestBed.configureTestingModule({
                declarations: [CreateUserComponent],
                providers: [
                    { provide: ActivatedRoute, useValue: mockActivatedRoute },
                    { provide: Router, useValue: mockRouter },
                    { provide: MatSnackBar, useValue: mockMatSnackBar },
                    { provide: DirectoryService, useValue: mockDirectoryService },
                    { provide: CreateMDOService, useValue: mockCreateMDOService },
                    { provide: ProfileV2UtillService, useValue: mockProfileUtilSvc },
                    { provide: UsersService, useValue: mockUsersService },
                    { provide: EventService, useValue: mockEvents },
                ],
                schemas: [NO_ERRORS_SCHEMA],
            }).compileComponents()

            fixture = TestBed.createComponent(CreateUserComponent)
            fixture.detectChanges()
        })

        it('should render the "User details" heading as a span, not a label', () => {
            const heading: HTMLElement = fixture.nativeElement.querySelector('span.heading')
            expect(heading).toBeTruthy()
            expect(heading.textContent!.trim()).toBe('User details')
            expect(fixture.nativeElement.querySelector('label.heading')).toBeNull()
        })

        it('should keep the field labels as labels associated with their inputs', () => {
            const fullNameLabel: HTMLLabelElement = fixture.nativeElement.querySelector('label[for="fname"]')
            expect(fullNameLabel).toBeTruthy()
            expect(fullNameLabel.textContent!.trim()).toBe('Full name')
            expect(fixture.nativeElement.querySelector('#fname')).toBeTruthy()
            expect(fixture.nativeElement.querySelector('label[for="mobileNumber"]')).toBeTruthy()
        })
    })
})
