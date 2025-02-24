
import { MatDialogRef } from '@angular/material/dialog'
import { ConfirmationBoxComponent } from './confirmation.box.component'

describe('ConfirmationBoxComponent', () => {
  let component: ConfirmationBoxComponent
  let dialogRefMock: MatDialogRef<ConfirmationBoxComponent>

  beforeEach(() => {
    // Create a mock MatDialogRef
    dialogRefMock = {
      close: jest.fn(),
    } as unknown as MatDialogRef<ConfirmationBoxComponent> // Type casting to avoid error

    // Create the component instance
    component = new ConfirmationBoxComponent(
      { type: 'confirmation' }, // Mocked MAT_DIALOG_DATA
      dialogRefMock
    )
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should close the modal when closeModal is called', () => {
    component.closeModal()
    expect(dialogRefMock.close).toHaveBeenCalled()
  })

  it('should close the modal with "confirmed" when performAction is called with confirmation data', () => {
    const data = { type: 'confirmation' }
    component.performAction(data)
    expect(dialogRefMock.close).toHaveBeenCalledWith('confirmed')
  })

  it('should not close the modal if performAction is called with non-confirmation data', () => {
    const data = { type: 'other' }
    component.performAction(data)
    expect(dialogRefMock.close).not.toHaveBeenCalled()
  })
})
