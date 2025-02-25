import { PositionsNewComponent } from './positions-new.component'
import { of } from 'rxjs'
// Mocks for dependencies
const mockSnackBar = {
  open: jest.fn()
}

const mockRouter = {
  navigate: jest.fn(),
  getCurrentNavigation: jest.fn().mockReturnValue({ extras: { state: { row: { firstName: 'John', email: 'john@example.com', mobile: '1234567890', position: 'Manager', description: 'Test Description', wfId: '1234' } } } })
}

const mockActivatedRoute = {}

const mockPositionService = {
  approveNewPosition: jest.fn().mockReturnValue(of({}))
}

const mockDialog = {
  open: jest.fn().mockReturnValue({
    afterClosed: jest.fn().mockReturnValue(of(true))
  })
}

describe('PositionsNewComponent', () => {
  let component: PositionsNewComponent

  beforeEach(() => {
    component = new PositionsNewComponent(
      mockSnackBar as any,
      mockRouter as any,
      mockActivatedRoute as any,
      mockPositionService as any,
      mockDialog as any
    )
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should initialize positionForm with the correct values', () => {
    expect(component.positionForm).toBeDefined()
    expect(component.positionForm.controls['fullname'].value).toBe('John')
    expect(component.positionForm.controls['email'].value).toBe('john@example.com')
    expect(component.positionForm.controls['mobile'].value).toBe('1234567890')
    expect(component.positionForm.controls['position'].value).toBe('Manager')
    expect(component.positionForm.controls['description'].value).toBe('Test Description')
  })

  it('should open dialog and approve position when form is submitted', () => {
    // Simulate the submit
    component.onSubmit()

    // Check if the dialog was opened
    expect(mockDialog.open).toHaveBeenCalled()

    // Simulate the dialog close with a positive response
    const dialogRef = mockDialog.open()
    dialogRef.afterClosed().subscribe(() => {
      expect(mockPositionService.approveNewPosition).toHaveBeenCalledWith({
        state: 'IN_PROGRESS',
        action: 'APPROVE',
        serviceName: 'position',
        wfId: '6945db82-b74b-4ad8-8ce2-fef0cdc54515',
        applicationId: '12345',
        userId: '12345',
        actorUserId: '12345',
        deptName: 'DEPT OF ANIMAL PROTECTION',
        updateFieldValues: [
          {
            toValue: { position: 'Secretery General' },
            fieldKey: 'position',
            description: 'Secretery General',
            firstName: 'Manas',
            email: 'manas.swain@tarento.com',
            mobile: '9078011660',
          }
        ]
      })
      expect(mockSnackBar.open).toHaveBeenCalledWith('Success!', 'X', { duration: 5000 })
      expect(mockRouter.navigate).toHaveBeenCalledWith(['active-positions'], { relativeTo: mockActivatedRoute })
    })
  })

  it('should open dialog and cancel when form is submitted and dialog response is false', () => {
    // Change the behavior of dialog to return false
    mockDialog.open.mockReturnValueOnce({
      afterClosed: jest.fn().mockReturnValue(of(false))
    })

    // Simulate the submit
    component.onSubmit()

    // Check if the dialog was opened
    expect(mockDialog.open).toHaveBeenCalled()

    // Simulate the dialog close with a negative response
    const dialogRef = mockDialog.open()
    dialogRef.afterClosed().subscribe(() => {
      expect(mockSnackBar.open).toHaveBeenCalledWith('Cancelled', 'X', { duration: 5000 })
      expect(component.positionForm.pristine).toBe(true)  // Form should be reset
    })
  })

  it('should call openSnackbar with correct arguments', () => {
    // component.openSnackbar('Test Message')
    expect(mockSnackBar.open).toHaveBeenCalledWith('Test Message', 'X', { duration: 5000 })
  })
})
