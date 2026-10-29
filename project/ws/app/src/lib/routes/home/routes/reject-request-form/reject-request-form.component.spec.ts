import { FormBuilder } from '@angular/forms'
import { of, Subject, throwError } from 'rxjs'
import { RejectRequestFormComponent } from './reject-request-form.component'

describe('RejectRequestFormComponent', () => {
  let component: RejectRequestFormComponent
  let mockDialogRef: any
  let mockDesignationSvc: any
  let mockSnackBar: any

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => { })
    jest.spyOn(console, 'error').mockImplementation(() => { })
    mockDialogRef = { close: jest.fn() }
    mockDesignationSvc = { rejectRequest: jest.fn() }
    mockSnackBar = { open: jest.fn() }
    component = new RejectRequestFormComponent(
      mockDialogRef,
      { identifier: 'req-1' },
      new FormBuilder(),
      mockDesignationSvc,
      mockSnackBar,
    )
    component.ngOnInit()
  })

  afterEach(() => jest.restoreAllMocks())

  it('should create and initialise the form', () => {
    expect(component).toBeTruthy()
    expect(component.rejectRequestForm.get('rejection_comment')).toBeTruthy()
    expect(component.rejectRequestForm.valid).toBe(false)
  })

  it('should treat whitespace-only comment as invalid', () => {
    component.rejectRequestForm.patchValue({ rejection_comment: '   ' })
    expect(component.rejectRequestForm.valid).toBe(false)
  })

  it('should close dialog on cancel and close', () => {
    component.cancelForm()
    component.closeDialog()
    expect(mockDialogRef.close).toHaveBeenCalledTimes(2)
  })

  it('should not call service when form is invalid', () => {
    component.rejectRequest()
    expect(mockDesignationSvc.rejectRequest).not.toHaveBeenCalled()
    expect(component.rejectRequestForm.get('rejection_comment').touched).toBe(true)
  })

  it('should reject request and close dialog on success', () => {
    mockDesignationSvc.rejectRequest.mockReturnValue(of({ status: 'rejected' }))
    component.rejectRequestForm.patchValue({ rejection_comment: '  Not valid  ' })
    component.rejectRequest()
    expect(mockDesignationSvc.rejectRequest).toHaveBeenCalledWith({ id: 'req-1', reviewer_comments: 'Not valid' })
    expect(mockSnackBar.open).toHaveBeenCalledWith('Request rejected successfully', 'X', {
      duration: 3000,
      panelClass: ['snackbar-success'],
    })
    expect(mockDialogRef.close).toHaveBeenCalledWith('success')
    expect(component.loading).toBe(false)
  })

  it('should show API error message on failure', () => {
    mockDesignationSvc.rejectRequest.mockReturnValue(throwError({ error: { detail: 'Already rejected' } }))
    component.rejectRequestForm.patchValue({ rejection_comment: 'reason' })
    component.rejectRequest()
    expect(mockSnackBar.open).toHaveBeenCalledWith('Already rejected', 'X', {
      duration: 5000,
      panelClass: ['snackbar-error'],
    })
    expect(mockDialogRef.close).not.toHaveBeenCalled()
    expect(component.loading).toBe(false)
  })

  it('should show default error message when none provided', () => {
    mockDesignationSvc.rejectRequest.mockReturnValue(throwError({}))
    component.rejectRequestForm.patchValue({ rejection_comment: 'reason' })
    component.rejectRequest()
    expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to reject request', 'X', expect.any(Object))
  })

  it('should fall back to the API message when no detail is provided', () => {
    mockDesignationSvc.rejectRequest.mockReturnValue(throwError({ error: { message: 'Server unavailable' } }))
    component.rejectRequestForm.patchValue({ rejection_comment: 'reason' })
    component.rejectRequest()
    expect(mockSnackBar.open).toHaveBeenCalledWith('Server unavailable', 'X', {
      duration: 5000,
      panelClass: ['snackbar-error'],
    })
  })

  it('should keep loading while the reject request is in flight', () => {
    const response$ = new Subject<any>()
    mockDesignationSvc.rejectRequest.mockReturnValue(response$)
    component.rejectRequestForm.patchValue({ rejection_comment: 'reason' })

    component.rejectRequest()
    expect(component.loading).toBe(true)
    expect(mockDialogRef.close).not.toHaveBeenCalled()

    response$.next({ status: 'rejected' })
    response$.complete()
    expect(component.loading).toBe(false)
    expect(mockDialogRef.close).toHaveBeenCalledWith('success')
  })
})
