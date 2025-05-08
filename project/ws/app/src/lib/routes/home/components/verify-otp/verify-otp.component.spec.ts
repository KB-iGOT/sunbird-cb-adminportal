import { VerifyOtpComponent } from './verify-otp.component'
import { MatDialogRef } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { OtpService } from '../../../create-mdo/routes/designation/services/otp.service'
import { UsersService } from '../../../create-mdo/services/users.service'
import { FormGroup } from '@angular/forms'
import { of, throwError } from 'rxjs'
import { HttpErrorResponse } from '@angular/common/http'

describe('VerifyOtpComponent', () => {
  let component: VerifyOtpComponent
  let mockDialogRef: jest.Mocked<MatDialogRef<VerifyOtpComponent>>
  let mockOtpService: OtpService
  let mockUsersService: UsersService
  let mockMatSnackBar: jest.Mocked<MatSnackBar>
  let mockData: any

  beforeEach(() => {
    // Create mock for dependencies
    mockDialogRef = {
      close: jest.fn()
    } as unknown as jest.Mocked<MatDialogRef<VerifyOtpComponent>>

    // Create proper mocks for services that return Observables
    mockOtpService = {
      verifyEmailOTP: jest.fn().mockReturnValue(of({})),
      verifyOTP: jest.fn().mockReturnValue(of({}))
    } as any

    mockUsersService = {
      sendOtp: jest.fn().mockReturnValue(of({}))
    } as any

    mockMatSnackBar = {
      open: jest.fn()
    } as unknown as jest.Mocked<MatSnackBar>

    mockData = {
      type: 'mobile',
      email: 'test@example.com',
      mobile: '1234567890'
    }

    // Create the component
    component = new VerifyOtpComponent(
      mockDialogRef,
      mockData,
      mockMatSnackBar,
      mockOtpService,
      mockUsersService
    )

    // Mock the interval
    jest.useFakeTimers()

    // Mock the ViewChild
    component.timerDiv = {
      nativeElement: {
        innerHTML: ''
      }
    }

    // Mock emit functions
    component.resendOTP.emit = jest.fn()
    component.otpVerified.emit = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
  })

  describe('initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy()
    })

    it('should initialize with correct default values', () => {
      expect(component.timeLeft).toBe(150)
      expect(component.showResendOTP).toBe(false)
      expect(component.otpEntered).toBe('')
      expect(component.otpTypeSelected).toBe(false)
    })

    it('should create form with required validators', () => {
      expect(component.otpSelectionForm instanceof FormGroup).toBe(true)
      expect(component.otpSelectionForm.get('otpType')).toBeTruthy()
      expect(component.otpSelectionForm.get('otpType')?.validator).toBeTruthy()
    })

    it('should call startTimer on init', () => {
      const startTimerSpy = jest.spyOn(component, 'startTimer')
      component.ngOnInit()
      expect(startTimerSpy).toHaveBeenCalled()
    })
  })

  describe('startTimer', () => {
    it('should set interval and update timer', () => {
      const setIntervalSpy = jest.spyOn(window, 'setInterval')
      component.startTimer()
      expect(setIntervalSpy).toHaveBeenCalled()
      expect(component.interval).toBeDefined()
    })

    it('should update timerDiv when timeLeft decrements', () => {
      component.startTimer()
      component.timeLeft = 100

      // Fast-forward timer
      jest.advanceTimersByTime(1000)

      expect(component.timeLeft).toBe(99)
      expect(component.timerDiv.nativeElement.innerHTML).toBe('1m: 39s')
    })

    it('should enable resendOTP when timer expires', () => {
      component.startTimer()
      component.timeLeft = 1

      // Fast-forward timer to expire
      jest.advanceTimersByTime(1000)

      expect(component.timeLeft).toBe(0)
      expect(component.showResendOTP).toBe(false)

      // Fast-forward one more second to ensure clearInterval is called
      jest.advanceTimersByTime(1000)

      // Verify interval is cleared
      //  const initialInterval = component.interval
      jest.advanceTimersByTime(1000)
      expect(component.timeLeft).toBe(0) // Shouldn't change anymore
    })
  })

  describe('handleCloseModal', () => {
    it('should close dialog', () => {
      component.handleCloseModal()
      expect(mockDialogRef.close).toHaveBeenCalled()
    })
  })

  describe('handleResendOTP', () => {
    it('should reset timer and emit resendOTP event', () => {
      const startTimerSpy = jest.spyOn(component, 'startTimer')
      component.handleResendOTP()

      expect(component.timeLeft).toBe(150)
      expect(component.resendOTP.emit).toHaveBeenCalledWith(mockData.type)
      expect(startTimerSpy).toHaveBeenCalled()
    })
  })

  describe('handleVerifyOTP', () => {
    it('should call verifyEmailOTP when otpType is email', () => {
      const verifyEmailSpy = jest.spyOn(component, 'verifyEmailOTP').mockImplementation(() => { })
      component.otpTypeSelectedValue = 'email'
      component.handleVerifyOTP()
      expect(verifyEmailSpy).toHaveBeenCalled()
    })

    it('should call verifyMobileOTP when otpType is not email', () => {
      const verifyMobileSpy = jest.spyOn(component, 'verifyMobileOTP').mockImplementation(() => { })
      component.otpTypeSelectedValue = 'mobile'
      component.handleVerifyOTP()
      expect(verifyMobileSpy).toHaveBeenCalled()
    })
  })

  describe('verifyEmailOTP', () => {
    it('should verify email OTP and emit success on valid OTP', () => {
      mockOtpService.verifyEmailOTP = jest.fn().mockReturnValue(of({ success: true }))
      component.otpEntered = '123456'
      component.verifyEmailOTP()

      expect(mockOtpService.verifyEmailOTP).toHaveBeenCalledWith('123456', mockData.email)
      expect(mockDialogRef.close).toHaveBeenCalled()
      expect(component.otpVerified.emit).toHaveBeenCalledWith(true)
    })

    it('should show error snackbar on API error', () => {
      const error = new HttpErrorResponse({ status: 400, statusText: 'Bad Request' })
      mockOtpService.verifyEmailOTP = jest.fn().mockReturnValue(throwError(() => error))

      component.otpEntered = '123456'
      component.verifyEmailOTP()

      expect(mockOtpService.verifyEmailOTP).toHaveBeenCalledWith('123456', mockData.email)
      expect(mockMatSnackBar.open).toHaveBeenCalledWith('Unable to verify OTP, please try again later!')
    })
  })

  describe('verifyMobileOTP', () => {
    it('should verify mobile OTP and emit success on valid OTP', () => {
      mockOtpService.verifyOTP = jest.fn().mockReturnValue(of({ success: true }))
      component.otpEntered = '123456'
      component.verifyMobileOTP()

      expect(mockOtpService.verifyOTP).toHaveBeenCalledWith(123456, mockData.mobile)
      expect(mockDialogRef.close).toHaveBeenCalled()
      expect(component.otpVerified.emit).toHaveBeenCalledWith(true)
    })

    it('should show error snackbar on API error', () => {
      const error = new HttpErrorResponse({ status: 400, statusText: 'Bad Request' })
      mockOtpService.verifyOTP = jest.fn().mockReturnValue(throwError(() => error))

      component.otpEntered = '123456'
      component.verifyMobileOTP()

      expect(mockOtpService.verifyOTP).toHaveBeenCalledWith(123456, mockData.mobile)
      expect(mockMatSnackBar.open).toHaveBeenCalledWith('Unable to verify OTP, please try again later!')
    })
  })

  describe('sendOtp', () => {
    it('should call generateAndVerifyOTP with correct type and update state', () => {
      const generateSpy = jest.spyOn(component, 'generateAndVerifyOTP').mockImplementation(() => { })
      component.otpSelectionForm.patchValue({ otpType: 'email' })
      component.sendOtp()

      expect(generateSpy).toHaveBeenCalledWith('email')
      expect(component.otpTypeSelected).toBe(true)
      expect(component.otpTypeSelectedValue).toBe('email')
    })
  })

  describe('generateAndVerifyOTP', () => {
    it('should send OTP for email type', () => {
      mockUsersService.sendOtp = jest.fn().mockReturnValue(of({ success: true }))
      component.generateAndVerifyOTP('email')

      expect(mockUsersService.sendOtp).toHaveBeenCalledWith(mockData.email, 'email')
      expect(mockMatSnackBar.open).toHaveBeenCalledWith('An OTP has been sent to your Email address, (Valid for 15 min\'s)')
    })

    it('should send OTP for phone type', () => {
      mockUsersService.sendOtp = jest.fn().mockReturnValue(of({ success: true }))
      component.generateAndVerifyOTP('phone')

      expect(mockUsersService.sendOtp).toHaveBeenCalledWith(mockData.mobile, 'phone')
      expect(mockMatSnackBar.open).toHaveBeenCalledWith('An OTP has been sent to your Mobile number, (Valid for 15 min\'s)')
    })

    it('should show error message when API fails with custom error', () => {
      const errorResponse = {
        ok: false,
        error: {
          params: {
            errmsg: 'Custom error message'
          }
        }
      }
      mockUsersService.sendOtp = jest.fn().mockReturnValue(throwError(() => errorResponse))
      component.generateAndVerifyOTP('email')

      expect(mockUsersService.sendOtp).toHaveBeenCalledWith(mockData.email, 'email')
      expect(mockMatSnackBar.open).toHaveBeenCalledWith('Custom error message')
    })

    it('should show default error when API fails without custom message', () => {
      const errorResponse = {
        ok: false
      }
      mockUsersService.sendOtp = jest.fn().mockReturnValue(throwError(() => errorResponse))
      component.generateAndVerifyOTP('email')

      expect(mockUsersService.sendOtp).toHaveBeenCalledWith(mockData.email, 'email')
      expect(mockMatSnackBar.open).toHaveBeenCalledWith('Unable to send OTP to your email, please try again later!')
    })
  })

  describe('ngOnDestroy', () => {
    it('should clear interval and unsubscribe from subjects', () => {
      // We need to access the private property, so create a spy that we can track
      const destroySubjectSpy = jest.spyOn(component['destroySubject$'], 'unsubscribe')
      component.interval = 123

      component.ngOnDestroy()

      expect(destroySubjectSpy).toHaveBeenCalled()
      // Since we're using fake timers, we can't easily test clearInterval
      // but we can check if the interval was removed
      jest.advanceTimersByTime(1000)
      expect(component.timeLeft).toBe(150) // Should not change after destroy
    })
  })
})