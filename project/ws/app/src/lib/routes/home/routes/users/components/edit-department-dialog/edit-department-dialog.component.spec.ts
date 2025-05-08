import { EditDepartmentDialogComponent } from './edit-department-dialog.component'
import { of, throwError } from 'rxjs'
import { UntypedFormGroup } from '@angular/forms'

describe('EditDepartmentDialogComponent', () => {
    let component: EditDepartmentDialogComponent
    let mockDialogRef: any
    let mockData: any
    let mockTenantAdminService: any
    let mockSnackBar: any
    let mockElementRef: any

    beforeEach(() => {
        // Mock dependencies
        mockDialogRef = {
            close: jest.fn()
        }

        mockData = {
            department: 'Engineering',
            userId: 'user123'
        }

        mockTenantAdminService = {
            getUserDepartments: jest.fn().mockResolvedValue(['Engineering', 'Marketing', 'HR']),
            updateUserDepartment: jest.fn().mockReturnValue(of({}))
        }

        mockSnackBar = {
            open: jest.fn()
        }

        mockElementRef = {
            nativeElement: { value: 'Success message' }
        }

        // Create component instance with mocked dependencies
        component = new EditDepartmentDialogComponent(
            mockDialogRef,
            mockData,
            mockTenantAdminService,
            mockSnackBar
        )

        // Mock ViewChild references
        component['toastSuccess'] = mockElementRef
        component['toastError'] = { nativeElement: { value: 'Error message' } }

        // Spy on component methods
        jest.spyOn(component, 'getUserDepartments')
        jest.spyOn(component, 'changeDepartment')
        jest.spyOn(component as any, 'openSnackbar')
    })

    test('should create the component', () => {
        expect(component).toBeTruthy()
    })

    test('should initialize with correct user department', () => {
        expect(component.userDepartment).toBe('Engineering')
    })

    test('should create form with required department control', () => {
        expect(component.editForm).toBeTruthy()
        expect(component.editForm.get('department')).toBeTruthy()
        expect(component.editForm.get('department')?.validator).toBeTruthy()
    })

    test('ngOnInit should call getUserDepartments', () => {
        component.ngOnInit()
        expect(component.getUserDepartments).toHaveBeenCalled()
    })

    test('getUserDepartments should fetch departments and update form', async () => {
        component.processing = false

        await component.getUserDepartments()

        expect(mockTenantAdminService.getUserDepartments).toHaveBeenCalled()
        expect(component.departments).toEqual(['Engineering', 'Marketing', 'HR'])
        expect(component.editForm.get('department')?.value).toBe('Engineering')
        expect(component.processing).toBe(false)
    })

    test('getUserDepartments should handle error and set processing to false', async () => {
        mockTenantAdminService.getUserDepartments.mockRejectedValue(new Error('Failed to get departments'))
        component.processing = true

        await component.getUserDepartments()

        expect(component.processing).toBe(false)
    })

    test('changeDepartment should update user department and close dialog on success', () => {
        const formValue = { department: 'Marketing' }
        const mockForm = { value: formValue } as UntypedFormGroup

        component.changeDepartment(mockForm)

        expect(mockTenantAdminService.updateUserDepartment).toHaveBeenCalledWith({
            ...formValue,
            userId: 'user123'
        })

        expect(mockDialogRef.close).toHaveBeenCalledWith({
            department: 'Marketing',
            userId: 'user123'
        })

        expect(component['openSnackbar']).toHaveBeenCalledWith('Success message')
        expect(component.processing).toBe(false)
    })

    test('changeDepartment should handle error and display error message', () => {
        const errorResponse = { error: 'Error:Department update failed' }
        mockTenantAdminService.updateUserDepartment.mockReturnValue(throwError(() => errorResponse))

        const formValue = { department: 'Marketing' }
        const mockForm = { value: formValue } as UntypedFormGroup

        component.changeDepartment(mockForm)

        expect(component['openSnackbar']).toHaveBeenCalledWith('Department update failed')
        expect(component.processing).toBe(true)
    })

    test('close should call dialogRef.close', () => {
        component.close()
        expect(mockDialogRef.close).toHaveBeenCalled()
    })

    test('openSnackbar should call snackBar.open with correct parameters', () => {
        component['openSnackbar']('Test message', 3000)

        expect(mockSnackBar.open).toHaveBeenCalledWith('Test message', 'X', {
            duration: 3000
        })
    })

    test('openSnackbar should use default duration when not specified', () => {
        component['openSnackbar']('Test message')

        expect(mockSnackBar.open).toHaveBeenCalledWith('Test message', 'X', {
            duration: 5000
        })
    })
})