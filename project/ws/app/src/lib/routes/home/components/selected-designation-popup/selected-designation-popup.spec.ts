import { SelectedDesignationPopupComponent } from './selected-designation-popup.component'
import { MatDialogRef } from '@angular/material/dialog'

describe('SelectedDesignationPopupComponent', () => {
  let component: SelectedDesignationPopupComponent
  let mockDialogRef: MatDialogRef<SelectedDesignationPopupComponent>
  let mockDialogData: any

  beforeEach(() => {
    // Mock the MatDialogRef
    mockDialogRef = { close: jest.fn() } as unknown as MatDialogRef<SelectedDesignationPopupComponent>

    // Mock the dialog data that will be injected via MAT_DIALOG_DATA
    mockDialogData = [
      { id: 1, name: 'Designation 1' },
      { id: 2, name: 'Designation 2' },
    ]

    // Create an instance of the component with mocked dependencies
    component = new SelectedDesignationPopupComponent(mockDialogRef, mockDialogData)
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should initialize with selectedDesignationsList from dialogData', () => {
    expect(component.selectedDesignationsList).toEqual(mockDialogData)
  })

  it('should remove a selected designation when removeSelectedDesignation is called', () => {
    const index = 0
    component.removeSelectedDesignation(index)

    // Check that the removed item is pushed into removedDesignationsList
    expect(component.removedDesignationsList).toEqual([mockDialogData[index]])

    // Check that the item is removed from selectedDesignationsList
    expect(component.selectedDesignationsList).toEqual([mockDialogData[1]])
  })

  it('should close the dialog and pass the removed designations when updateList is called', () => {
    // Prepare data for removed designations
    const removedDesignations = [{ id: 1, name: 'Designation 1' }]
    component.removedDesignationsList = removedDesignations

    // Call updateList method
    component.updateList()

    // Check that the close method was called on dialogRef
    expect(mockDialogRef.close).toHaveBeenCalledWith(removedDesignations)
  })
})
