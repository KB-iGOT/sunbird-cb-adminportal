jest.mock('@angular/core', () => ({
  ...jest.requireActual('@angular/core'),
  inject: jest.fn().mockReturnValue({ title: 'Loading...', status: 'pending' }),
}))

import { LoadingPopupComponent } from './loading-popup.component'
import { MatDialogRef } from '@angular/material/dialog'

describe('LoadingPopupComponent', () => {
  let component: LoadingPopupComponent

  const dialogRef: Partial<MatDialogRef<LoadingPopupComponent>> = {
    close: jest.fn(),
  }

  beforeEach(() => {
    component = new LoadingPopupComponent(
      dialogRef as MatDialogRef<LoadingPopupComponent>
    )
    jest.clearAllMocks()
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should call dialogRef.close with event on closePopup', () => {
    const event = { action: 'confirm' }
    component.closePopup(event)
    expect(dialogRef.close).toHaveBeenCalledWith(event)
  })

  it('should call dialogRef.close with null event on closePopup', () => {
    component.closePopup(null)
    expect(dialogRef.close).toHaveBeenCalledWith(null)
  })

  it('should call dialogRef.close with string event on closePopup', () => {
    component.closePopup('cancel')
    expect(dialogRef.close).toHaveBeenCalledWith('cancel')
  })

  it('should have data set from inject', () => {
    expect(component.data).toEqual({ title: 'Loading...', status: 'pending' })
  })
})
