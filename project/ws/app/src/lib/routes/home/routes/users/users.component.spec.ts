import { UsersComponent } from './users.component'
import { ActivatedRoute } from '@angular/router'
import { SystemRolesManagementService } from '../../services/system-roles-management.service'
import { TenantAdminService } from '../../services/tenant-admin.service'
import { of, } from 'rxjs'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'

jest.mock('@angular/material/snack-bar')
jest.mock('@angular/material/dialog')
jest.mock('@angular/router')
jest.mock('../../services/system-roles-management.service')
jest.mock('../../services/tenant-admin.service')

describe('UsersComponent', () => {
    let component: UsersComponent
    let snackBar: MatSnackBar
    let dialog: MatDialog
    let activatedRoute: ActivatedRoute
    let rolesSvc: SystemRolesManagementService
    let tenantAdminSvc: TenantAdminService

    beforeEach(() => {
        snackBar = new MatSnackBar(null as any, null as any, null as any, null as any, null as any, null as any)  // Mock instance
        dialog = new MatDialog(null as any, null as any, null as any, null as any, null as any, null as any, null as any, null as any) // Mock instance
        activatedRoute = {
            parent: {
                parent: {
                    data: of({
                        featureData: {
                            data: {
                                roleList: {
                                    admin: {},
                                    user: {},
                                },
                            },
                        },
                    }),
                },
            },
        } as any
        rolesSvc = new SystemRolesManagementService(null as any)
        tenantAdminSvc = new TenantAdminService(null as any)



        component = new UsersComponent(snackBar, dialog, activatedRoute, rolesSvc, tenantAdminSvc)
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize role list from route data', () => {
        component.ngOnInit()
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
        const user = { wid: '123', department_name: '', email: '', first_name: '', last_name: '', root_org: '', }
        const mockRoles = { user_roles: ['admin'], default_roles: [] }
        const spyCheckUser = jest.spyOn(rolesSvc, 'checkUser').mockReturnValue(of(mockRoles))
        const spyEmit = jest.spyOn(component.selectedUser, 'emit')

        component.addUser(user)

        expect(spyCheckUser).toHaveBeenCalledWith(user.wid)
        expect(component.userDetails[user.wid].roles).toEqual(['admin'])
        expect(spyEmit).toHaveBeenCalledWith(user)
    })

    it('should handle error when adding user', () => {
        const user = { wid: '123', department_name: '', email: '', first_name: '', last_name: '', root_org: '', }
        //const spyCheckUser = jest.spyOn(rolesSvc, 'checkUser').mockReturnValue(throwError('Error'))

        component.addUser(user)

        expect(component.isAdding).toBe(false)
    })

    it('should remove a user from userDetails', () => {
        const user = { wid: '123', department_name: '', email: '', first_name: '', last_name: '', root_org: '', }
        component.userDetails[user.wid] = { roles: ['admin'] }
        component.userIds = ['123']

        component.removeUser(user)

        expect(component.userDetails[user.wid]).toBeUndefined()
        expect(component.userIds).not.toContain(user.wid)
    })

    it('should open roles dialog and handle dialog close with new roles', () => {
        const wid = '123'
        const mockRoles = { admin: { isSelected: false, hasRole: false, about: '' } }
        component.rolesHash = mockRoles
        const dialogRef = {
            afterClosed: jest.fn().mockReturnValue(of({ wid, newRoles: ['admin'], addingError: false, removingError: false })),
        }
        const spyOpen = jest.spyOn(dialog, 'open').mockReturnValue(dialogRef as any)
        const spySnackBar = jest.spyOn(snackBar, 'open')

        component.openDialog(wid)

        expect(spyOpen).toHaveBeenCalled()
        expect(spySnackBar).toHaveBeenCalledWith('Changes Saved', 'X', { duration: 2000 })
    })

    it('should open department dialog and update user department', () => {
        const wid = '123'
        const department = 'HR'
        const dialogRef = {
            afterClosed: jest.fn().mockReturnValue(of({ userId: wid, department: 'Finance' })),
        }
        const spyOpen = jest.spyOn(dialog, 'open').mockReturnValue(dialogRef as any)

        component.openDepartmentDialog(wid, department)

        expect(spyOpen).toHaveBeenCalled()
        expect(component.userDetails[wid].department_name).toBe('Finance')
    })
})
