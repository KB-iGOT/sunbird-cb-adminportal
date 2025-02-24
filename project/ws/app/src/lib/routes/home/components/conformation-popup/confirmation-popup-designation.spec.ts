import { ConformationPopupDesignationComponent } from './conformation-popup-designation.component'
import { MatDialogRef } from '@angular/material/dialog'

describe('ConformationPopupDesignationComponent', () => {
  let component: ConformationPopupDesignationComponent
  let mockDialogRef: MatDialogRef<ConformationPopupDesignationComponent>
  let mockData: any

  beforeEach(() => {
    // Mock MatDialogRef
    mockDialogRef = { close: jest.fn() } as any

    // Mock dialog data
    mockData = { title: 'Test Title', description: 'Test Description' }

    // Manually instantiate the component
    component = new ConformationPopupDesignationComponent(mockDialogRef, mockData)
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should initialize dialogDetails with injected data', () => {
    expect(component.dialogDetails).toEqual(mockData)
  })

  it('should close the dialog on closePopup call', () => {
    const mockEvent = { action: 'close' }
    component.closePopup(mockEvent)

    // Expect the close method on MatDialogRef to be called with the event
    expect(mockDialogRef.close).toHaveBeenCalledWith(mockEvent)
  })
})
