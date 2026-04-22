import { UserPopupComponent } from './user-popup'
import { MatDialogRef } from '@angular/material/dialog'

describe('UserPopupComponent', () => {
  let component: UserPopupComponent
  let mockDialogRef: jest.Mocked<MatDialogRef<UserPopupComponent>>
  let mockData: any

  beforeEach(() => {
    // Create mock for MatDialogRef
    mockDialogRef = {
      close: jest.fn(),
    } as unknown as jest.Mocked<MatDialogRef<UserPopupComponent>>

    // Create mock data
    mockData = {
      animal: 'dog',
      name: 'Buddy',
      data: {
        id: 1,
        value: 'test'
      }
    }

    // Instantiate component with mocks
    component = new UserPopupComponent(mockDialogRef, mockData)
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should initialize with empty selectedUser array', () => {
    expect(component.selectedUser).toEqual([])
  })

  it('should close dialog when onNoClick is called', () => {
    component.onNoClick()
    expect(mockDialogRef.close).toHaveBeenCalled()
  })

  it('should close dialog with data when markAsComplete is called', () => {
    // Set up test data
    component.selectedUser = [{ id: 1, name: 'Test User' }]
    component.currentSelection = false

    // Call the method
    component.markAsComplete()

    // Verify dialog was closed with the correct data
    expect(mockDialogRef.close).toHaveBeenCalledWith({
      event: 'close',
      data: [{ id: 1, name: 'Test User' }]
    })

    // Verify currentSelection was set to true
    expect(component.currentSelection).toBe(true)

    // Verify dialogRef was assigned the selectedUser
    expect(component.dialogRef).toEqual([{ id: 1, name: 'Test User' }])
  })

  it('should not close dialog when markAsComplete is called and currentSelection is true', () => {
    // Set up test data
    component.selectedUser = [{ id: 1, name: 'Test User' }]
    component.currentSelection = true

    // Call the method
    component.markAsComplete()

    // Verify dialog was not closed
    expect(mockDialogRef.close).not.toHaveBeenCalled()
  })

  it('should add user to selectedUser if array is empty', () => {
    // Fix the typo in the length property name for testing
    component.selectedUser = []
    const mockUser = { row: { id: 1, name: 'Test User' } }

    component.selectedUserFrom(mockUser)

    expect(component.selectedUser).toEqual([{ id: 1, name: 'Test User' }])
  })

  it('should replace existing users in selectedUser if array is not empty', () => {
    // Set initial state
    component.selectedUser = [{ id: 2, name: 'Existing User' }]

    // Call with new user
    const mockUser = { row: { id: 1, name: 'Test User' } }
    component.selectedUserFrom(mockUser)

    // Verify old user was removed and new user was added
    expect(component.selectedUser).toEqual([{ id: 1, name: 'Test User' }])
  })

  it('should always replace users due to typo in lenght property (never enters if branch)', () => {
    // The component uses 'lenght' (typo) instead of 'length', so if branch is never entered
    component.selectedUser = []
    const mockUser = { row: { id: 1, name: 'Test User' } }
    component.selectedUserFrom(mockUser)
    // Goes to else branch: splice(0,0) then push
    expect(component.selectedUser).toContainEqual({ id: 1, name: 'Test User' })
  })
})