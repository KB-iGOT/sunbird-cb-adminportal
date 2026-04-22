import { UsersComponent } from './users.component'
import { ActivatedRoute } from '@angular/router'
import { SystemRolesManagementService } from '../../services/system-roles-management.service'
import { TenantAdminService } from '../../services/tenant-admin.service'
import { of } from 'rxjs'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'

describe('UsersComponent', () => {
    let component: UsersComponent
    let snackBar: Partial<MatSnackBar>
    let dialog: Partial<MatDialog>
    let activatedRoute: Partial<ActivatedRoute>
    let rolesSvc: Partial<SystemRolesManagementService>
    let tenantAdminSvc: Partial<TenantAdminService>

    beforeEach(() => {
        snackBar = { open: jest.fn() }
        dialog = { open: jest.fn() }
        tenantAdminSvc = {
            getUserDepartments: jest.fn().mockResolvedValue([{ department_name: 'IT' }]),
        }
        rolesSvc = {
            checkUser: jest.fn().mockReturnValue(of({ user_roles: ['admin'], default_roles: [] })),
        }
        activatedRoute = {
            parent: {
                parent: {
                    data: of({
                        featureData: {
                            data: {
                                roleList: {
                                    admin: 'Admin Role',
                                    user: 'User Role',
                                },
                            },
                        },
                    }),
                },
            },
        } as any

        component = new UsersComponent(
            snackBar as MatSnackBar,
            dialog as MatDialog,
            activatedRoute as ActivatedRoute,
            rolesSvc as SystemRolesManagementService,
            tenantAdminSvc as TenantAdminService,
        )
        jest.clearAllMocks()
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize role list from route data', () => {
        expect(component.roleList).toEqual(['admin', 'user'])
        expect(Object.keys(component.rolesHash)).toEqual(['admin', 'user'])
    })

    it('should call getUserDepartments on ngOnInit', async () => {
        const spy = jest.spyOn(tenantAdminSvc, 'getUserDepartments').mockResolvedValue([{ department_name: 'IT' }])
        await component.getUserDepartments()
        expect(spy).toHaveBeenCalled()
        expect(component.departments).toEqual(['IT'])
    })

    it('should add a user and emit selectedUser event', () => {
        const user = { wid: '123', department_name: '', email: '', first_name: '', last_name: '', root_org: '' }
            ; (rolesSvc.checkUser as jest.Mock).mockReturnValue(of({ user_roles: ['admin'], default_roles: [] }))
        const spyEmit = jest.spyOn(component.selectedUser, 'emit')

        component.addUser(user)

        expect(rolesSvc.checkUser).toHaveBeenCalledWith(user.wid)
        expect(component.userDetails[user.wid].roles).toEqual(['admin'])
        expect(spyEmit).toHaveBeenCalledWith(user)
    })

    it('should set isAdding to false on addUser error', () => {
        const user = { wid: '999', department_name: '', email: '', first_name: '', last_name: '', root_org: '' }
            ; (rolesSvc.checkUser as jest.Mock).mockReturnValue(of({ user_roles: [], default_roles: [] }))
        component.addUser(user)
        expect(component.isAdding).toBe(false)
    })

    it('should remove a user from userDetails', () => {
        const user = { wid: '123', department_name: '', email: '', first_name: '', last_name: '', root_org: '' }
        component.userDetails[user.wid] = { roles: ['admin'] }
        component.userIds = ['123']

        component.removeUser(user)

        expect(component.userDetails[user.wid]).toBeUndefined()
        expect(component.userIds).not.toContain(user.wid)
    })

    it('should not throw when removing non-existent user', () => {
        const user = { wid: 'non-existent', department_name: '', email: '', first_name: '', last_name: '', root_org: '' }
        expect(() => component.removeUser(user)).not.toThrow()
    })

    it('should open roles dialog and show success snackbar on close', () => {
        const wid = '123'
        component.rolesHash = { admin: { isSelected: false, hasRole: false, about: 'Admin Role' } }
        component.roleList = ['admin']
        component.userDetails[wid] = { roles: [] }
        const dialogRef = {
            afterClosed: jest.fn().mockReturnValue(of({ wid, newRoles: ['admin'], addingError: false, removingError: false })),
        }
            ; (dialog.open as jest.Mock).mockReturnValue(dialogRef)

        component.openDialog(wid)

        expect(dialog.open).toHaveBeenCalled()
        expect(snackBar.open).toHaveBeenCalledWith('Changes Saved', 'X', { duration: 2000 })
    })

    it('should show addingError snackbar when addingError is true', () => {
        const wid = '123'
        component.rolesHash = { admin: { isSelected: false, hasRole: false, about: '' } }
        component.roleList = ['admin']
        component.userDetails[wid] = { roles: [] }
        const dialogRef = {
            afterClosed: jest.fn().mockReturnValue(of({ wid, newRoles: [], addingError: true, removingError: false })),
        }
            ; (dialog.open as jest.Mock).mockReturnValue(dialogRef)

        component.openDialog(wid)

        expect(snackBar.open).toHaveBeenCalledWith('Error Occured adding roles', 'X', { duration: 2000 })
    })

    it('should show removingError snackbar when removingError is true', () => {
        const wid = '123'
        component.rolesHash = { admin: { isSelected: false, hasRole: false, about: '' } }
        component.roleList = ['admin']
        component.userDetails[wid] = { roles: [] }
        const dialogRef = {
            afterClosed: jest.fn().mockReturnValue(of({ wid, newRoles: [], addingError: false, removingError: true })),
        }
            ; (dialog.open as jest.Mock).mockReturnValue(dialogRef)

        component.openDialog(wid)

        expect(snackBar.open).toHaveBeenCalledWith('Error Occured removing roles', 'X', { duration: 2000 })
    })

    it('should show both errors snackbar when both are true', () => {
        const wid = '123'
        component.rolesHash = { admin: { isSelected: false, hasRole: false, about: '' } }
        component.roleList = ['admin']
        component.userDetails[wid] = { roles: [] }
        const dialogRef = {
            afterClosed: jest.fn().mockReturnValue(of({ wid, newRoles: [], addingError: true, removingError: true })),
        }
            ; (dialog.open as jest.Mock).mockReturnValue(dialogRef)

        component.openDialog(wid)

        expect(snackBar.open).toHaveBeenCalledWith('Error Occured', 'X', { duration: 2000 })
    })

    it('should open department dialog and update user department', () => {
        const wid = '123'
        const department = 'HR'
        component.userDetails[wid] = { department_name: 'HR' }
        const dialogRef = {
            afterClosed: jest.fn().mockReturnValue(of({ userId: wid, department: 'Finance' })),
        }
            ; (dialog.open as jest.Mock).mockReturnValue(dialogRef)

        component.openDepartmentDialog(wid, department)

        expect(dialog.open).toHaveBeenCalled()
        expect(component.userDetails[wid].department_name).toBe('Finance')
    })

    it('should emit selectedUser event from seletedUserFun', () => {
        const spyEmit = jest.spyOn(component.selectedUser, 'emit')
        const data = { wid: 'abc' }
        component.seletedUserFun(data)
        expect(spyEmit).toHaveBeenCalledWith(data)
    })
})
