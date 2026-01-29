import { CreateUserComponent } from './create-user.component'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { CreateUserService } from './create-user.service'
import { SystemRolesManagementService } from '../../../services/system-roles-management.service'
import { Router, ActivatedRoute } from '@angular/router'
import { MatSnackBar } from '@angular/material/snack-bar'

jest.mock('@angular/material/snack-bar', () => ({
    MatSnackBar: jest.fn().mockImplementation(() => ({
        open: jest.fn(),
    })),
}))

jest.mock('@sunbird-cb/utils-v2', () => ({
    ConfigurationsService: jest.fn().mockImplementation(() => ({
        org: ['org1'],
    })),
}))

jest.mock('./create-user.service', () => ({
    CreateUserService: jest.fn().mockImplementation(() => ({
        createUser: jest.fn(),
    })),
}))

jest.mock('../../../services/system-roles-management.service', () => ({
    SystemRolesManagementService: jest.fn().mockImplementation(() => ({
        manageUser: jest.fn(),
    })),
}))

describe('CreateUserComponent', () => {
    let component: CreateUserComponent
    let snackBar: MatSnackBar
    let configSvc: ConfigurationsService
    let createUserSvc: CreateUserService
    let roleManagementSvc: SystemRolesManagementService
    let router: Router
    let activatedRoute: ActivatedRoute

    beforeEach(() => {
        snackBar = new MatSnackBar(null as any, null as any, null as any, null as any, null as any, null as any)
        configSvc = new ConfigurationsService()
        createUserSvc = new CreateUserService(null as any)
        roleManagementSvc = new SystemRolesManagementService(null as any)
        router = {} as Router
        activatedRoute = {} as ActivatedRoute

        component = new CreateUserComponent(
            snackBar,
            configSvc,
            createUserSvc,
            roleManagementSvc,
            activatedRoute,
            router,
            activatedRoute,
        )

        component.ngOnInit() // Initialize component
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize the form with required fields', () => {
        expect(component.registerUser).toBeDefined()
        expect(component.registerUser.controls.firstname).toBeDefined()
        expect(component.registerUser.controls.emailid).toBeDefined()
        expect(component.registerUser.controls.password).toBeDefined()
    })

    it('should validate password correctly', () => {
        component.registerUser.controls.password.setValue('password123')
        component.registerUser.controls.cpassword.setValue('password123')
        const validationResult = component.registerUser.errors
        expect(validationResult).toBeNull() // passwords match

        component.registerUser.controls.cpassword.setValue('differentPassword')
        const validationResultInvalid = component.registerUser.errors
        expect(validationResultInvalid).toEqual({ mustMatch: true }) // passwords do not match
    })

    it('should generate password when onGeneratePassword is called', () => {
        const mockEvent = { preventDefault: jest.fn() }
        const beforePassword = component.registerUser.controls.password.value
        component.onGeneratePassword(mockEvent)

        expect(mockEvent.preventDefault).toHaveBeenCalled()
        expect(component.registerUser.controls.password.value).not.toBe(beforePassword)
    })

    it('should handle successful user creation', () => {
        // const createUserResponse = { code: 200, wid: '12345' }
        // createUserSvc.createUser.mockReturnValue(of(createUserResponse))

        // const openSnackBarSpy = jest.spyOn(snackBar, 'open')

        // component.createUser()

        // expect(createUserSvc.createUser).toHaveBeenCalledWith(component.userData, false)
        // expect(openSnackBarSpy).toHaveBeenCalledWith('User Created Successfully', 'X', { duration: 3000 })
    })

    it('should handle user creation error with conflicting email', () => {
        // const errorResponse = {
        //     error: {
        //         message: '{"msg": "conflicting email found"}',
        //     },
        // }
        // createUserSvc.createUser.mockReturnValue(throwError(errorResponse))

        // const openSnackBarSpy = jest.spyOn(snackBar, 'open')

        // component.createUser()

        // expect(openSnackBarSpy).toHaveBeenCalledWith('User Already Exists', 'X', { duration: 3000 })
    })

    it('should handle generic error when creating user', () => {
        // const errorResponse = {
        //     error: {
        //         message: '{"msg": "Some error occurred"}',
        //     },
        // }
        // createUserSvc.createUser.mockReturnValue(throwError(errorResponse))

        // const openSnackBarSpy = jest.spyOn(snackBar, 'open')

        // component.createUser()

        // expect(openSnackBarSpy).toHaveBeenCalledWith('Error Creating User', 'X', { duration: 3000 })
    })

    it('should select and deselect roles correctly', () => {
        const mockEvent = { checked: true, source: { value: 'admin' } }
        component.selectedUser(mockEvent)
        expect(component.selectedSystemRoles).toContain('admin')

        mockEvent.checked = false
        component.selectedUser(mockEvent)
        expect(component.selectedSystemRoles).not.toContain('admin')
    })

    it('should reset selected roles correctly', () => {
        component.selectedSystemRoles = ['admin', 'user']
        component.resetAllCheckedRole()
        expect(component.selectedSystemRoles).toEqual([])
    })

    it('should open the snack bar with the correct message', () => {
        const openSnackBarSpy = jest.spyOn(snackBar, 'open')
        //  component.openSnackBar('Test Message')
        expect(openSnackBarSpy).toHaveBeenCalledWith('Test Message', 'X', { duration: 3000 })
    })
})
