import { SignupComponent } from './signup.component'
import { SignupService } from './signup.service'
import { of, Subscription, throwError } from 'rxjs'

// Mock dependencies
jest.mock('./signup.service')

describe('SignupComponent', () => {
  let component: SignupComponent
  let mockSignupService: jest.Mocked<SignupService>
  let mockSnackBar: any
  let mockElementRef: any

  beforeEach(() => {
    // Create mock for MatSnackBar
    mockSnackBar = {
      open: jest.fn()
    }

    // Create mock for ElementRef
    mockElementRef = {
      nativeElement: {
        value: 'Success message'
      }
    }

    // Create mock for SignupService
    mockSignupService = {
      signup: jest.fn()
    } as unknown as jest.Mocked<SignupService>

    // Initialize component with mocks
    component = new SignupComponent(
      mockSnackBar,
      mockSignupService
    )

    // Mock ViewChild properties
    component['toastSuccess'] = mockElementRef
    component['toastError'] = mockElementRef
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should initialize form with required controls', () => {
    expect(component.signupForm).toBeDefined()
    expect(component.signupForm.get('fname')).toBeDefined()
    expect(component.signupForm.get('lname')).toBeDefined()
    expect(component.signupForm.get('email')).toBeDefined()
    expect(component.signupForm.get('code')).toBeDefined()
  })

  it('should validate fname as required', () => {
    const fnameControl = component.signupForm.get('fname')
    expect(fnameControl?.valid).toBeFalsy()

    fnameControl?.setValue('John')
    expect(fnameControl?.valid).toBeTruthy()

    fnameControl?.setValue('')
    expect(fnameControl?.valid).toBeFalsy()
    expect(fnameControl?.errors?.['required']).toBeTruthy()
  })

  it('should validate lname as required', () => {
    const lnameControl = component.signupForm.get('lname')
    expect(lnameControl?.valid).toBeFalsy()

    lnameControl?.setValue('Doe')
    expect(lnameControl?.valid).toBeTruthy()

    lnameControl?.setValue('')
    expect(lnameControl?.valid).toBeFalsy()
    expect(lnameControl?.errors?.['required']).toBeTruthy()
  })

  it('should validate email format', () => {
    const emailControl = component.signupForm.get('email')
    expect(emailControl?.valid).toBeFalsy()

    emailControl?.setValue('test@example.com')
    expect(emailControl?.valid).toBeTruthy()

    emailControl?.setValue('invalid-email')
    expect(emailControl?.valid).toBeFalsy()
    expect(emailControl?.errors?.['email']).toBeTruthy()
  })

  it('should validate code as required', () => {
    const codeControl = component.signupForm.get('code')
    expect(codeControl?.valid).toBeFalsy()

    codeControl?.setValue('123456')
    expect(codeControl?.valid).toBeTruthy()

    codeControl?.setValue('')
    expect(codeControl?.valid).toBeFalsy()
    expect(codeControl?.errors?.['required']).toBeTruthy()
  })

  describe('onSubmit', () => {
    let mockForm: any

    beforeEach(() => {
      mockForm = {
        value: {
          fname: 'John',
          lname: 'Doe',
          email: 'john.doe@example.com',
          code: '123456'
        },
        reset: jest.fn()
      }
    })

    it('should call signup service and handle success', () => {
      mockSignupService.signup.mockReturnValue(of({}))

      component.onSubmit(mockForm)

      expect(component.uploadSaveData).toBe(true)
      expect(mockSignupService.signup).toHaveBeenCalledWith(mockForm.value)

      // After observable completes
      expect(mockForm.reset).toHaveBeenCalled()
      expect(component.uploadSaveData).toBe(false)
      expect(mockSnackBar.open).toHaveBeenCalledWith('Success message', 'X', { duration: 5000 })
    })

    it('should handle error from signup service', () => {
      const errorResponse = { error: 'Error:Something went wrong' }
      mockSignupService.signup.mockReturnValue(throwError(() => errorResponse))

      component.onSubmit(mockForm)

      expect(component.uploadSaveData).toBe(true)
      expect(mockSignupService.signup).toHaveBeenCalledWith(mockForm.value)

      // After observable errors
      expect(mockForm.reset).not.toHaveBeenCalled()
      expect(component.uploadSaveData).toBe(false)
      expect(mockSnackBar.open).toHaveBeenCalledWith('Something went wrong', 'X', { duration: 5000 })
    })
  })

  describe('ngOnDestroy', () => {
    it('should unsubscribe from unseenCtrlSub if it exists and is not closed', () => {
      component.unseenCtrlSub = {
        closed: false,
        unsubscribe: jest.fn()
      } as unknown as Subscription

      component.ngOnDestroy()

      expect(component.unseenCtrlSub.unsubscribe).toHaveBeenCalled()
    })

    it('should not try to unsubscribe if unseenCtrlSub is undefined', () => {
      component.unseenCtrlSub = undefined as any

      // This should not throw an error
      expect(() => component.ngOnDestroy()).not.toThrow()
    })

    it('should not try to unsubscribe if unseenCtrlSub is already closed', () => {
      component.unseenCtrlSub = {
        closed: true,
        unsubscribe: jest.fn()
      } as unknown as Subscription

      component.ngOnDestroy()

      expect(component.unseenCtrlSub.unsubscribe).not.toHaveBeenCalled()
    })
  })
})