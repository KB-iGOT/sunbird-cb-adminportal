import { CreateUserComponent } from './create-user.component'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { CreateUserService } from './create-user.service'
import { SystemRolesManagementService } from '../../../services/system-roles-management.service'
import { Router, ActivatedRoute } from '@angular/router'
import { MatSnackBar } from '@angular/material/snack-bar'
import { of, throwError } from 'rxjs'

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

        component.ngOnInit()
    })

    afterEach(() => {
        jest.clearAllMocks()
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

    it('should validate password correctly when passwords match', () => {
        component.registerUser.controls.password.setValue('password123')
        component.registerUser.controls.cpassword.setValue('password123')
        expect(component.registerUser.errors).toBeNull()
    })

    it('should fail password validation when passwords do not match', () => {
        component.registerUser.controls.password.setValue('password123')
        component.registerUser.controls.cpassword.setValue('differentPassword')
        expect(component.registerUser.errors).toEqual({ mustMatch: true })
    })

    it('should return null from validator when passwordType is GeneratePassword', () => {
        component.passwordType = 'GeneratePassword'
        component.registerUser.controls.password.setValue('any')
        component.registerUser.controls.cpassword.setValue('other')
        // re-trigger validation
        component.registerUser.updateValueAndValidity()
        expect(component.registerUser.errors).toBeNull()
    })

    it('should generate password when onGeneratePassword is called', () => {
        const mockEvent = { preventDefault: jest.fn() }
        component.onGeneratePassword(mockEvent)
        expect(mockEvent.preventDefault).toHaveBeenCalled()
        expect(component.registerUser.controls.password.value).toBeTruthy()
    })

    it('should reset selectedSystemRoles when generating password', () => {
        component.selectedSystemRoles = ['admin']
        component.rolesHash = [{ role: 'admin', about: '', selected: true }]
        const mockEvent = { preventDefault: jest.fn() }
        component.onGeneratePassword(mockEvent)
        expect(component.selectedSystemRoles).toEqual([])
    })

    it('should add role to selectedSystemRoles when checked', () => {
        const mockEvent = { checked: true, source: { value: 'admin' } }
        component.selectedUser(mockEvent)
        expect(component.selectedSystemRoles).toContain('admin')
    })

    it('should remove role from selectedSystemRoles when unchecked', () => {
        component.selectedSystemRoles = ['admin']
        const mockEvent = { checked: false, source: { value: 'admin' } }
        component.selectedUser(mockEvent)
        expect(component.selectedSystemRoles).not.toContain('admin')
    })

    it('should reset selected roles correctly', () => {
        component.selectedSystemRoles = ['admin', 'user']
        component.rolesHash = [
            { role: 'admin', about: '', selected: true },
            { role: 'user', about: '', selected: true },
        ]
        component.resetAllCheckedRole()
        expect(component.selectedSystemRoles).toEqual([])
        component.rolesHash.forEach(r => expect(r.selected).toBe(false))
    })

    it('should call onRadioChange and update form validity', () => {
        const updateSpy = jest.spyOn(component.registerUser, 'updateValueAndValidity')
        component.onRadioChange()
        expect(updateSpy).toHaveBeenCalled()
    })

    describe('createUser', () => {
        it('should call createUser service and show success snackbar on code 200 with no roles', () => {
            component.registerUser.controls.firstname.setValue('John')
            component.registerUser.controls.emailid.setValue('john@test.com')
            component.registerUser.controls.cpassword.setValue('pass123')
            component.selectedSystemRoles = []
                ; (createUserSvc.createUser as jest.Mock).mockReturnValue(of({ code: 200 }))
            const snackSpy = jest.spyOn(snackBar, 'open')

            component.createUser()

            expect(createUserSvc.createUser).toHaveBeenCalled()
            expect(snackSpy).toHaveBeenCalledWith('User Created Successfully', 'X', { duration: 3000 })
        })

        it('should show snackbar on non-200 response code', () => {
            component.registerUser.controls.firstname.setValue('John')
            component.registerUser.controls.emailid.setValue('john@test.com')
                ; (createUserSvc.createUser as jest.Mock).mockReturnValue(of({ code: 400 }))
            const snackSpy = jest.spyOn(snackBar, 'open')

            component.createUser()

            expect(snackSpy).toHaveBeenCalledWith('Some Error occured', 'X', { duration: 3000 })
        })

        it('should show "User Already Exists" on conflicting email error', () => {
            component.registerUser.controls.firstname.setValue('John')
            component.registerUser.controls.emailid.setValue('john@test.com')
            const error = { error: { message: JSON.stringify({ msg: 'Conflicting Email Found' }) } }
                ; (createUserSvc.createUser as jest.Mock).mockReturnValue(throwError(error))
            const snackSpy = jest.spyOn(snackBar, 'open')

            component.createUser()

            expect(snackSpy).toHaveBeenCalledWith('User Already Exists', 'X', { duration: 3000 })
        })

        it('should show "Error Creating User" on generic error', () => {
            component.registerUser.controls.firstname.setValue('John')
            component.registerUser.controls.emailid.setValue('john@test.com')
            const error = { error: { message: JSON.stringify({ msg: 'Unknown error' }) } }
                ; (createUserSvc.createUser as jest.Mock).mockReturnValue(throwError(error))
            const snackSpy = jest.spyOn(snackBar, 'open')

            component.createUser()

            expect(snackSpy).toHaveBeenCalledWith('Error Creating User', 'X', { duration: 3000 })
        })

        it('should include password in userData when passwordType is UserPassword', () => {
            component.passwordType = 'UserPassword'
            component.registerUser.controls.firstname.setValue('Jane')
            component.registerUser.controls.emailid.setValue('jane@test.com')
            component.registerUser.controls.cpassword.setValue('mypassword')
                ; (createUserSvc.createUser as jest.Mock).mockReturnValue(of({ code: 200 }))

            component.createUser()

            const callArgs = (createUserSvc.createUser as jest.Mock).mock.calls[0][0]
            expect(callArgs.password).toBe('mypassword')
        })
    })
})
