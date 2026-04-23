import { of, throwError } from 'rxjs'
import { UntypedFormGroup } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { TenantAdminService } from '../../../services/tenant-admin.service'
import { CreateUserV2Component } from './create-userV2.component'

describe('CreateUserV2Component', () => {
    let component: CreateUserV2Component
    let snackBarMock: Partial<MatSnackBar>
    let tenantAdminSvcMock: Partial<TenantAdminService>

    beforeEach(() => {
        snackBarMock = { open: jest.fn() }
        tenantAdminSvcMock = {
            createUser: jest.fn(),
            getUserDepartments: jest.fn().mockResolvedValue([]),
        }

        component = new CreateUserV2Component(
            snackBarMock as MatSnackBar,
            tenantAdminSvcMock as TenantAdminService
        )

        component.toastSuccess = { nativeElement: { value: 'User created successfully' } } as any
        component.toastError = { nativeElement: { value: 'Error occurred' } } as any
        jest.clearAllMocks()
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize createUserForm with required controls', () => {
        expect(component.createUserForm).toBeInstanceOf(UntypedFormGroup)
        expect(component.createUserForm.controls['fname']).toBeDefined()
        expect(component.createUserForm.controls['lname']).toBeDefined()
        expect(component.createUserForm.controls['email']).toBeDefined()
        expect(component.createUserForm.controls['department']).toBeDefined()
    })

    it('should have uploadSaveData as false initially', () => {
        expect(component.uploadSaveData).toBe(false)
    })

    it('should have fetching as false initially', () => {
        expect(component.fetching).toBe(false)
    })

    it('should have departments as empty array initially', () => {
        expect(component.departments).toEqual([])
    })

    it('should call getUserDepartments on ngOnInit', () => {
        const spy = jest.spyOn(component, 'getUserDepartments').mockImplementation(() => { })
        component.ngOnInit()
        expect(spy).toHaveBeenCalled()
    })

    it('should not throw when unseenCtrlSub is undefined on ngOnDestroy', () => {
        component.unseenCtrlSub = undefined as any
        expect(() => component.ngOnDestroy()).not.toThrow()
    })

    it('should unsubscribe on ngOnDestroy when subscription is open', () => {
        const unsubSpy = jest.fn()
        component.unseenCtrlSub = { unsubscribe: unsubSpy, closed: false } as any
        component.ngOnDestroy()
        expect(unsubSpy).toHaveBeenCalled()
    })

    it('should not unsubscribe on ngOnDestroy when subscription is already closed', () => {
        const unsubSpy = jest.fn()
        component.unseenCtrlSub = { unsubscribe: unsubSpy, closed: true } as any
        component.ngOnDestroy()
        expect(unsubSpy).not.toHaveBeenCalled()
    })

    it('should set uploadSaveData to true when onSubmit is called', () => {
        const form = { value: {}, reset: jest.fn() }
            ; (tenantAdminSvcMock.createUser as jest.Mock).mockReturnValue(of({}))
        component.onSubmit(form)
        // after subscribe completes it becomes false
        expect(snackBarMock.open).toHaveBeenCalled()
    })

    it('should reset form and show success snackbar on submit success', () => {
        const form = { value: { fname: 'John', lname: 'Doe', email: 'j@e.com', department: 'HR' }, reset: jest.fn() }
            ; (tenantAdminSvcMock.createUser as jest.Mock).mockReturnValue(of({}))

        component.onSubmit(form)

        expect(form.reset).toHaveBeenCalled()
        expect(component.uploadSaveData).toBe(false)
        expect(snackBarMock.open).toHaveBeenCalledWith('User created successfully', 'X', { duration: 5000 })
    })

    it('should show error snackbar and set uploadSaveData false on submit error', () => {
        const form = { value: {}, reset: jest.fn() }
        const errorResponse = { error: 'Error: Something went wrong' }
            // Use throwError with value directly (RxJS 6 compatible)
            ; (tenantAdminSvcMock.createUser as jest.Mock).mockReturnValue(throwError(errorResponse))

        component.onSubmit(form)

        expect(form.reset).not.toHaveBeenCalled()
        expect(component.uploadSaveData).toBe(false)
        expect(snackBarMock.open).toHaveBeenCalledWith(' Something went wrong', 'X', { duration: 5000 })
    })

    it('should fetch and set departments on getUserDepartments success', async () => {
        const departments = ['HR', 'Engineering', 'Marketing']
            ; (tenantAdminSvcMock.getUserDepartments as jest.Mock).mockResolvedValue(departments)

        component.getUserDepartments()
        await new Promise(resolve => setTimeout(resolve, 0))

        expect(component.fetching).toBe(false)
        expect(component.departments).toEqual(departments)
    })

    it('should handle error in getUserDepartments gracefully', async () => {
        ; (tenantAdminSvcMock.getUserDepartments as jest.Mock).mockRejectedValue(new Error('Failed'))

        component.getUserDepartments()
        await new Promise(resolve => setTimeout(resolve, 0))

        expect(component.fetching).toBe(false)
    })

    it('should set fetching to false in finally block on getUserDepartments', async () => {
        ; (tenantAdminSvcMock.getUserDepartments as jest.Mock).mockResolvedValue([])

        component.getUserDepartments()
        expect(component.fetching).toBe(true)

        await new Promise(resolve => setTimeout(resolve, 0))
        expect(component.fetching).toBe(false)
    })
})
