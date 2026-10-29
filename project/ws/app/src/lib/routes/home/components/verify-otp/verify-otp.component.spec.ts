import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatRadioChange, MatRadioModule } from '@angular/material/radio'
import { of, throwError } from 'rxjs'

import { VerifyOtpComponent } from './verify-otp.component'
import { OtpService } from '../../../create-mdo/routes/designation/services/otp.service'
import { UsersService } from '../../../create-mdo/services/users.service'

describe('VerifyOtpComponent', () => {
  let component: VerifyOtpComponent
  let fixture: ComponentFixture<VerifyOtpComponent>
  let dialogRef: { close: jest.Mock }
  let matSnackbar: { open: jest.Mock }
  let otpService: { verifyEmailOTP: jest.Mock, verifyOTP: jest.Mock }
  let usersService: { sendOtp: jest.Mock }
  const dialogData = { type: 'email', email: 'user@test.com', mobile: 9999999999 }

  beforeEach(waitForAsync(() => {
    dialogRef = { close: jest.fn() }
    matSnackbar = { open: jest.fn() }
    otpService = {
      verifyEmailOTP: jest.fn().mockReturnValue(of({})),
      verifyOTP: jest.fn().mockReturnValue(of({})),
    }
    usersService = { sendOtp: jest.fn().mockReturnValue(of({})) }
    TestBed.configureTestingModule({
      declarations: [VerifyOtpComponent],
      imports: [FormsModule, ReactiveFormsModule, MatRadioModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatSnackBar, useValue: matSnackbar },
        { provide: OtpService, useValue: otpService },
        { provide: UsersService, useValue: usersService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents()
  }))

  beforeEach(() => {
    jest.useFakeTimers()
    fixture = TestBed.createComponent(VerifyOtpComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    fixture.destroy()
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(component.otpSelectionForm.get('otpType')!.value).toBe('')
  })

  it('should render the "Send OTP to" heading as a span instead of a label', () => {
    const heading: HTMLElement = fixture.nativeElement.querySelector('.mobile-wrapper .mat-title-1')
    expect(heading).toBeTruthy()
    expect(heading.tagName).toBe('SPAN')
    expect(heading.textContent!.trim()).toBe('Send OTP to')
    expect(heading.getAttribute('aria-label')).toBe('Send OTP to')
    expect(fixture.nativeElement.querySelector('.mobile-wrapper > label')).toBeNull()
  })

  it('should decrement the timer every second and update the timer div', () => {
    component.timerDiv = { nativeElement: { innerHTML: '' } }
    jest.advanceTimersByTime(1000)
    expect(component.timeLeft).toBe(149)
    expect(component.timerDiv.nativeElement.innerHTML).toBe('2m: 29s')
  })

  it('should show resend OTP once the timer runs out', () => {
    component.timeLeft = 1
    jest.advanceTimersByTime(2000)
    expect(component.timeLeft).toBe(0)
    expect(component.showResendOTP).toBe(true)
  })

  it('should close the dialog on handleCloseModal', () => {
    component.handleCloseModal()
    expect(dialogRef.close).toHaveBeenCalled()
  })

  it('should reset the timer and emit resendOTP on handleResendOTP', () => {
    const emitSpy = jest.spyOn(component.resendOTP, 'emit')
    component.timeLeft = 0
    component.showResendOTP = true
    component.handleResendOTP()
    expect(component.timeLeft).toBe(150)
    expect(component.showResendOTP).toBe(false)
    expect(emitSpy).toHaveBeenCalledWith('email')
  })

  it('should verify email OTP when email type is selected', () => {
    const emitSpy = jest.spyOn(component.otpVerified, 'emit')
    component.otpTypeSelectedValue = 'email'
    component.otpEntered = '123456'
    component.handleVerifyOTP()
    expect(otpService.verifyEmailOTP).toHaveBeenCalledWith('123456', 'user@test.com')
    expect(otpService.verifyOTP).not.toHaveBeenCalled()
    expect(dialogRef.close).toHaveBeenCalled()
    expect(emitSpy).toHaveBeenCalledWith(true)
  })

  it('should verify mobile OTP when phone type is selected', () => {
    const emitSpy = jest.spyOn(component.otpVerified, 'emit')
    component.otpTypeSelectedValue = 'phone'
    component.otpEntered = '123456'
    component.handleVerifyOTP()
    expect(otpService.verifyOTP).toHaveBeenCalledWith(123456, 9999999999)
    expect(otpService.verifyEmailOTP).not.toHaveBeenCalled()
    expect(dialogRef.close).toHaveBeenCalled()
    expect(emitSpy).toHaveBeenCalledWith(true)
  })

  it('should show a snackbar when email OTP verification fails', () => {
    otpService.verifyEmailOTP.mockReturnValue(throwError({ ok: false }))
    component.verifyEmailOTP()
    expect(matSnackbar.open).toHaveBeenCalledWith('Unable to verify OTP, please try again later!')
    expect(dialogRef.close).not.toHaveBeenCalled()
  })

  it('should show a snackbar when mobile OTP verification fails', () => {
    otpService.verifyOTP.mockReturnValue(throwError({ ok: false }))
    component.verifyMobileOTP()
    expect(matSnackbar.open).toHaveBeenCalledWith('Unable to verify OTP, please try again later!')
    expect(dialogRef.close).not.toHaveBeenCalled()
  })

  it('should send OTP to email and switch to OTP entry on sendOtp', () => {
    component.otpSelectionForm.setValue({ otpType: 'email' })
    component.sendOtp()
    expect(usersService.sendOtp).toHaveBeenCalledWith('user@test.com', 'email')
    expect(matSnackbar.open).toHaveBeenCalledWith('An OTP has been sent to your Email address, (Valid for 15 min\'s)')
    expect(component.otpTypeSelected).toBe(true)
    expect(component.otpTypeSelectedValue).toBe('email')
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.mobile-wrapper')).toBeNull()
  })

  it('should send OTP to mobile number for phone type', () => {
    component.generateAndVerifyOTP('phone')
    expect(usersService.sendOtp).toHaveBeenCalledWith(9999999999, 'phone')
    expect(matSnackbar.open).toHaveBeenCalledWith('An OTP has been sent to your Mobile number, (Valid for 15 min\'s)')
  })

  it('should show the API error message when sending OTP fails', () => {
    usersService.sendOtp.mockReturnValue(throwError({ ok: false, error: { params: { errmsg: 'Limit exceeded' } } }))
    component.generateAndVerifyOTP('email')
    expect(matSnackbar.open).toHaveBeenCalledWith('Limit exceeded')
  })

  it('should show a fallback message when sending OTP fails without an error message', () => {
    usersService.sendOtp.mockReturnValue(throwError({ ok: false }))
    component.generateAndVerifyOTP('phone')
    expect(matSnackbar.open).toHaveBeenCalledWith('Unable to send OTP to your phone, please try again later!')
  })

  it('should not change state on radioChange', () => {
    component.radioChange({ value: 'email' } as MatRadioChange)
    expect(component.otpTypeSelected).toBe(false)
  })

  it('should clear the interval on destroy', () => {
    const clearSpy = jest.spyOn(global, 'clearInterval')
    component.ngOnDestroy()
    expect(clearSpy).toHaveBeenCalledWith(component.interval)
  })
})
