import { CreateUserV2Component } from './create-userV2.component'
import { TenantAdminService } from '../../../services/tenant-admin.service'
import { of, throwError } from 'rxjs'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { UntypedFormGroup } from '@angular/forms'
import { ElementRef } from '@angular/core'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'

describe('CreateUserV2Component', () => {
    let component: CreateUserV2Component
    let fixture: ComponentFixture<CreateUserV2Component>
    let snackBarMock: jest.Mocked<MatSnackBar>
    let tenantAdminSvcMock: jest.Mocked<TenantAdminService>
    let toastSuccessMock: jest.Mocked<ElementRef>
    let toastErrorMock: jest.Mocked<ElementRef>

    beforeEach(async () => {
        snackBarMock = { open: jest.fn() } as any
        tenantAdminSvcMock = {
            createUser: jest.fn(),
            getUserDepartments: jest.fn(),
        } as any
        toastSuccessMock = { nativeElement: { value: 'Success message' } } as any
        toastErrorMock = { nativeElement: { value: 'Error message' } } as any

        await TestBed.configureTestingModule({
            declarations: [CreateUserV2Component],
            providers: [
                { provide: MatSnackBar, useValue: snackBarMock },
                { provide: TenantAdminService, useValue: tenantAdminSvcMock },
            ],
        }).compileComponents()

        fixture = TestBed.createComponent(CreateUserV2Component)
        component = fixture.componentInstance
        component.toastSuccess = toastSuccessMock
        component.toastError = toastErrorMock

        fixture.detectChanges()
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize form with controls', () => {
        expect(component.createUserForm).toBeInstanceOf(UntypedFormGroup)
        expect(component.createUserForm.controls['fname']).toBeDefined()
        expect(component.createUserForm.controls['lname']).toBeDefined()
        expect(component.createUserForm.controls['email']).toBeDefined()
        expect(component.createUserForm.controls['department']).toBeDefined()
    })

    it('should call getUserDepartments on ngOnInit', () => {
        const getUserDepartmentsSpy = jest.spyOn(component, 'getUserDepartments')
        component.ngOnInit()
        expect(getUserDepartmentsSpy).toHaveBeenCalled()
    })

    it('should unsubscribe on ngOnDestroy', () => {
        component.unseenCtrlSub = { unsubscribe: jest.fn() } as any
        component.ngOnDestroy()
        expect(component.unseenCtrlSub.unsubscribe).toHaveBeenCalled()
    })

    it('should submit form and handle success', () => {
        const formData = { fname: 'John', lname: 'Doe', email: 'john.doe@example.com', department: 'HR' }
        const form = { value: formData, reset: jest.fn() }

        tenantAdminSvcMock.createUser.mockReturnValue(of({}))

        component.onSubmit(form)

        expect(form.reset).toHaveBeenCalled()
        expect(snackBarMock.open).toHaveBeenCalledWith('Success message', 'X', { duration: 5000 })
        expect(component.uploadSaveData).toBe(false)
    })

    it('should submit form and handle error', () => {
        const formData = { fname: 'John', lname: 'Doe', email: 'john.doe@example.com', department: 'HR' }
        const form = { value: formData, reset: jest.fn() }

        const errorResponse = { error: 'Error: Something went wrong' }
        tenantAdminSvcMock.createUser.mockReturnValue(throwError(errorResponse))

        component.onSubmit(form)

        expect(form.reset).not.toHaveBeenCalled()
        expect(snackBarMock.open).toHaveBeenCalledWith('Something went wrong', 'X', { duration: 5000 })
        expect(component.uploadSaveData).toBe(false)
    })

    it('should fetch departments on getUserDepartments success', () => {
        const departments = ['HR', 'Engineering', 'Marketing']
        tenantAdminSvcMock.getUserDepartments.mockReturnValue(Promise.resolve(departments))

        component.getUserDepartments()

        expect(component.fetching).toBe(false)
        expect(component.departments).toEqual(departments)
    })

    it('should handle error in getUserDepartments', () => {
        tenantAdminSvcMock.getUserDepartments.mockReturnValue(Promise.reject('Error fetching departments'))

        component.getUserDepartments()

        expect(component.fetching).toBe(false)
        expect(component.departments).toEqual([])
    })
})
