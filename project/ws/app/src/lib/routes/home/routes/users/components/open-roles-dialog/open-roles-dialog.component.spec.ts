import { OpenRolesDialogComponent } from './open-roles-dialog.component'
import { SystemRolesManagementService } from '../../../../services/system-roles-management.service'
import { IManageUser } from './system-roles-management.model'
import { MatDialogRef } from '@angular/material/dialog'

describe('OpenRolesDialogComponent', () => {
    let component: OpenRolesDialogComponent
    let mockDialogRef: jest.Mocked<MatDialogRef<OpenRolesDialogComponent>>
    let mockRolesSvc: jest.Mocked<SystemRolesManagementService>
    let mockData: any

    beforeEach(() => {
        // Mock MatDialogRef
        mockDialogRef = {
            close: jest.fn()
        } as any

        // Mock SystemRolesManagementService
        mockRolesSvc = {
            manageUser: jest.fn()
        } as any

        // Mock dialog data
        mockData = {
            userId: 'test-user-123',
            rolesData: {
                'admin': { isSelected: false, hasRole: true },
                'editor': { isSelected: true, hasRole: false },
                'viewer': { isSelected: true, hasRole: true },
                'moderator': { isSelected: false, hasRole: false }
            }
        }

        // Create component instance
        component = new OpenRolesDialogComponent(
            mockDialogRef,
            mockData,
            mockRolesSvc
        )
    })

    describe('Constructor', () => {
        it('should initialize component properties correctly', () => {
            expect(component.userId).toBe('test-user-123')
            expect(component.rolesHash).toEqual(mockData.rolesData)
            expect(component.roleList).toEqual(['admin', 'editor', 'viewer', 'moderator'])
            expect(component.processing).toBe(false)
            expect(component.addError).toBe(false)
            expect(component.removeError).toBe(false)
            expect(component.updatedRole).toEqual([])
            expect(component.promiseArray).toEqual([])
        })
    })

    describe('ngOnInit', () => {
        it('should call ngOnInit without errors', () => {
            expect(() => component.ngOnInit()).not.toThrow()
        })
    })

    describe('close', () => {
        it('should close dialog without data', () => {
            component.close()
            expect(mockDialogRef.close).toHaveBeenCalledWith()
        })
    })

    describe('changeRole', () => {
        beforeEach(() => {
            jest.clearAllMocks()
        })

        it('should initialize arrays and flags correctly at start', async () => {
            mockRolesSvc.manageUser.mockResolvedValue(undefined)

            await component.changeRole()

            expect(component.addRole).toEqual([])
            expect(component.removeRole).toEqual([])
            expect(component.updatedRole).toEqual([])
            expect(component.promiseArray).toEqual([])
        })

        it('should identify roles to add and remove correctly', async () => {
            mockRolesSvc.manageUser.mockResolvedValue(undefined)

            await component.changeRole()

            // editor: isSelected=true, hasRole=false -> should be added
            // admin: isSelected=false, hasRole=true -> should be removed
            expect(component.addRole).toContain('editor')
            expect(component.removeRole).toContain('admin')
            expect(component.addRole).not.toContain('viewer') // already has role
            expect(component.removeRole).not.toContain('moderator') // doesn't have role
        })

        it('should call manageUser service for adding roles', async () => {
            mockRolesSvc.manageUser.mockResolvedValue(undefined)

            await component.changeRole()

            const expectedAddBody: IManageUser = {
                users: ['test-user-123'],
                operation: 'add',
                roles: ['editor']
            }

            expect(mockRolesSvc.manageUser).toHaveBeenCalledWith(expectedAddBody)
        })

        it('should call manageUser service for removing roles', async () => {
            mockRolesSvc.manageUser.mockResolvedValue(undefined)

            await component.changeRole()

            const expectedRemoveBody: IManageUser = {
                users: ['test-user-123'],
                operation: 'remove',
                roles: ['admin']
            }

            expect(mockRolesSvc.manageUser).toHaveBeenCalledWith(expectedRemoveBody)
        })

        it('should update rolesHash when adding roles succeeds', async () => {
            mockRolesSvc.manageUser.mockResolvedValue(undefined)

            await component.changeRole()

            expect(component.rolesHash['editor'].hasRole).toBe(true)
        })

        it('should update rolesHash when removing roles succeeds', async () => {
            mockRolesSvc.manageUser.mockResolvedValue(undefined)

            await component.changeRole()

            expect(component.rolesHash['admin'].hasRole).toBe(false)
        })

        it('should set addError when adding roles fails', async () => {
            mockRolesSvc.manageUser
                .mockResolvedValueOnce(undefined) // for remove operation
                .mockRejectedValueOnce(new Error('Add failed')) // for add operation

            await component.changeRole()

            expect(component.addError).toBe(true)
            expect(component.removeError).toBe(false)
        })

        it('should set removeError when removing roles fails', async () => {
            mockRolesSvc.manageUser
                .mockRejectedValueOnce(new Error('Remove failed')) // for add operation
                .mockResolvedValueOnce(undefined) // for remove operation

            await component.changeRole()

            expect(component.addError).toBe(false)
            expect(component.removeError).toBe(true)
        })

        it('should set both errors when both operations fail', async () => {
            mockRolesSvc.manageUser.mockRejectedValue(new Error('Operation failed'))

            await component.changeRole()

            expect(component.addError).toBe(true)
            expect(component.removeError).toBe(true)
        })

        it('should set processing to true during operation and false after completion', async () => {
            let processingDuringOperation: boolean = true

            mockRolesSvc.manageUser.mockImplementation(() => {
                processingDuringOperation = component.processing
                return Promise.resolve()
            })

            const changeRolePromise = component.changeRole()

            // Check that processing is set to true immediately
            expect(component.processing).toBe(true)

            await changeRolePromise

            expect(processingDuringOperation).toBe(true)
            expect(component.processing).toBe(false)
        })

        it('should build updatedRole list correctly after operations', async () => {
            mockRolesSvc.manageUser.mockResolvedValue(undefined)

            await component.changeRole()

            // After successful operations:
            // admin: hasRole=false (removed)
            // editor: hasRole=true (added)
            // viewer: hasRole=true (unchanged)
            // moderator: hasRole=false (unchanged)
            expect(component.updatedRole).toEqual(expect.arrayContaining(['editor', 'viewer']))
            expect(component.updatedRole).not.toContain('admin')
            expect(component.updatedRole).not.toContain('moderator')
        })

        it('should close dialog with correct data structure', async () => {
            mockRolesSvc.manageUser.mockResolvedValue(undefined)

            await component.changeRole()

            expect(mockDialogRef.close).toHaveBeenCalledWith({
                wid: 'test-user-123',
                newRoles: expect.any(Array),
                addingError: false,
                removingError: false
            })
        })

        it('should not call manageUser when no roles to add or remove', async () => {
            // Set up data where no changes are needed
            component.rolesHash = {
                'admin': { isSelected: true, hasRole: true },
                'editor': { isSelected: false, hasRole: false }
            }
            component.roleList = ['admin', 'editor']

            await component.changeRole()

            expect(mockRolesSvc.manageUser).not.toHaveBeenCalled()
            expect(component.promiseArray).toHaveLength(0)
        })

        it('should handle only add operation when no roles to remove', async () => {
            component.rolesHash = {
                'editor': { isSelected: true, hasRole: false }
            }
            component.roleList = ['editor']
            mockRolesSvc.manageUser.mockResolvedValue(undefined)

            await component.changeRole()

            expect(mockRolesSvc.manageUser).toHaveBeenCalledTimes(1)
            expect(mockRolesSvc.manageUser).toHaveBeenCalledWith({
                users: ['test-user-123'],
                operation: 'add',
                roles: ['editor']
            })
        })

        it('should handle only remove operation when no roles to add', async () => {
            component.rolesHash = {
                'admin': { isSelected: false, hasRole: true }
            }
            component.roleList = ['admin']
            mockRolesSvc.manageUser.mockResolvedValue(undefined)

            await component.changeRole()

            expect(mockRolesSvc.manageUser).toHaveBeenCalledTimes(1)
            expect(mockRolesSvc.manageUser).toHaveBeenCalledWith({
                users: ['test-user-123'],
                operation: 'remove',
                roles: ['admin']
            })
        })
    })

    describe('Error handling edge cases', () => {
        it('should handle partial failures correctly', async () => {
            mockRolesSvc.manageUser
                .mockResolvedValueOnce(undefined) // add succeeds
                .mockRejectedValueOnce(new Error('Remove failed')) // remove fails

            await component.changeRole()

            expect(component.addError).toBe(false)
            expect(component.removeError).toBe(true)
            expect(component.rolesHash['editor'].hasRole).toBe(true) // add operation succeeded
            expect(component.rolesHash['admin'].hasRole).toBe(true) // remove operation failed, so still has role
        })
    })
})