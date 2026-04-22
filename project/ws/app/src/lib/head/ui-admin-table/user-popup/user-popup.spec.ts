import { UserPopupComponent } from './user-popup'
import { MatDialogRef } from '@angular/material/dialog'
import { CreateMDOService } from '../../../routes/home/services/create-mdo.services'
import { MatSnackBar } from '@angular/material/snack-bar'
import { BehaviorSubject } from 'rxjs'

describe('UserPopupComponent', () => {
  let component: UserPopupComponent
  let mockDialogRef: jest.Mocked<MatDialogRef<UserPopupComponent>>
  let mockData: any
  let mockCreateMDOService: Partial<CreateMDOService>
  let mockSnackBar: jest.Mocked<MatSnackBar>
  let adminButtonSubject: BehaviorSubject<any>

  beforeEach(() => {
    // Create mocks for all dependencies
    mockDialogRef = {
      close: jest.fn()
    } as unknown as jest.Mocked<MatDialogRef<UserPopupComponent>>

    mockData = {
      animal: 'test',
      name: 'test',
      data: {}
    }

    // Create a BehaviorSubject for adminButton
    adminButtonSubject = new BehaviorSubject<boolean>(false)

    mockCreateMDOService = {
      adminButton: adminButtonSubject
    }

    mockSnackBar = {
      open: jest.fn()
    } as unknown as jest.Mocked<MatSnackBar>

    // Create component instance with mocked dependencies
    component = new UserPopupComponent(
      mockDialogRef,
      mockData,
      mockCreateMDOService as CreateMDOService,
      mockSnackBar
    )
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('should subscribe to adminButton from CreateMDOService', () => {
      // Act
      component.ngOnInit()

      // Assert - initially the value is false (from our setup)
      expect(component.adminButton).toBeFalsy()

      // Change the value in the behavior subject
      adminButtonSubject.next(true)

      // Assert the component received the new value
      expect(component.adminButton).toBeTruthy()
    })
  })

  describe('onNoClick', () => {
    it('should close the dialog', () => {
      // Act
      component.onNoClick()

      // Assert
      expect(mockDialogRef.close).toHaveBeenCalled()
    })
  })

  describe('markAsComplete', () => {
    it('should show snackbar when adminButton is true', () => {
      // Arrange
      component.adminButton = true

      // Act
      component.markAsComplete()

      // Assert
      expect(mockSnackBar.open).toHaveBeenCalledWith('User already have Admin role')
      expect(mockDialogRef.close).not.toHaveBeenCalled()
    })

    it('should close dialog with selected user when adminButton and currentSelection are false', () => {
      // Arrange
      component.adminButton = false
      component.currentSelection = false
      component.selectedUser = ['testUser']

      // Act
      component.markAsComplete()

      // Assert
      expect(mockDialogRef.close).toHaveBeenCalledWith({
        event: 'close',
        data: component.selectedUser
      })
      expect(component.currentSelection).toBe(true)
      expect(component.dialogRef).toEqual(component.selectedUser)
    })

    it('should not close dialog when currentSelection is true', () => {
      // Arrange
      component.adminButton = false
      component.currentSelection = true

      // Act
      component.markAsComplete()

      // Assert
      expect(mockDialogRef.close).not.toHaveBeenCalled()
    })
  })

  describe('selectedUserFrom', () => {
    it('should splice and push user to selectedUser array (lenght typo always takes else branch)', () => {
      // Note: source has typo `this.selectedUser.lenght` (not `length`),
      // so the if-branch is never reached; always goes to else.
      const mockUser = { row: { id: 1, name: 'Test User' } }
      component.selectedUser = []

      component.selectedUserFrom(mockUser)

      expect(component.selectedUser).toContain(mockUser.row)
      expect(component.selectedUser.length).toBe(1)
    })

    it('should replace existing users in selectedUser array with new user', () => {
      // Arrange
      const mockUser = { row: { id: 2, name: 'New User' } }
      component.selectedUser = [{ id: 1, name: 'Old User' }]
      const spliceMethod = jest.spyOn(component.selectedUser, 'splice')
      const pushMethod = jest.spyOn(component.selectedUser, 'push')

      // Act
      component.selectedUserFrom(mockUser)

      // Assert
      expect(spliceMethod).toHaveBeenCalledWith(0, component.selectedUser.length)
      expect(pushMethod).toHaveBeenCalledWith(mockUser.row)
      expect(component.selectedUser).toContain(mockUser.row)
      expect(component.selectedUser.length).toBe(1)
    })
  })
})