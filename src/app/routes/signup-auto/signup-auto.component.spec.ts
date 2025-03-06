import { SignupAutoComponent } from './signup-auto.component'
import { of, throwError } from 'rxjs'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { SignupAutoService } from './signup-auto.service'
import { ActivatedRoute } from '@angular/router'

describe('SignupAutoComponent', () => {
  let component: SignupAutoComponent
  let snackBarMock: jest.Mocked<MatSnackBar>
  let signupAutoServiceMock: jest.Mocked<SignupAutoService>
  let activatedRouteMock: jest.Mocked<ActivatedRoute>

  beforeEach(() => {
    // Mock the MatSnackBar
    snackBarMock = {
      open: jest.fn(),
    } as any

    // Mock the SignupAutoService
    signupAutoServiceMock = {
      signup: jest.fn(),
    } as any

    // Mock ActivatedRoute with 'id' param
    activatedRouteMock = {
      paramMap: of({ get: jest.fn().mockReturnValue('123') }),
    } as any

    // Create an instance of the component with mocked dependencies
    component = new SignupAutoComponent(
      snackBarMock,
      signupAutoServiceMock,
      activatedRouteMock,
    )
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should call signup method on ngOnInit and set uniqueId from route', () => {
    const spy = jest.spyOn(component, 'signup')
    component.ngOnInit()
    expect(spy).toHaveBeenCalledWith('123')
    expect(component.uniqueId).toBe('123')
  })

  it('should set fetching to true and call signupAutoService.signup on signup', () => {
    signupAutoServiceMock.signup.mockReturnValue(of({ msg: '1005:Success', email: 'test@example.com' }))
    component.signup('123')
    expect(component.fetching).toBe(true)
    expect(signupAutoServiceMock.signup).toHaveBeenCalledWith('123')
  })

  it('should update message and call openSnackbar on successful signup', () => {
    signupAutoServiceMock.signup.mockReturnValue(of({ msg: '1005:Success', email: 'test@example.com' }))
    component.signup('123')

    // Check message
    expect(component.msg).toBe('You have been registered successfully on the platform with email test@example.com. Please check your email')

    // Check if snackbar was called
    expect(snackBarMock.open).toHaveBeenCalledWith(component.msg, 'X', { duration: 5000 })
  })

  it('should handle error in signup and show error message', () => {
    const errorResponse = { error: { msg: 'Some error' } }
    signupAutoServiceMock.signup.mockReturnValue(throwError(() => errorResponse))
    component.signup('123')

    // Check if the fetching flag is set to false after error
    expect(component.fetching).toBe(false)

    // Check error message
    expect(component.msg).toBe('Something went wrong please try again later!!')

    // Check if snackbar was called with the error message
    expect(snackBarMock.open).toHaveBeenCalledWith(errorResponse.error.msg, 'X', { duration: 5000 })
  })

  it('should call openSnackbar with correct message for each response code', () => {
    const testCases = [
      { responseCode: '1001', expectedMsg: 'Something went wrong, please contact administrator' },
      { responseCode: '1002', expectedMsg: 'Registered email address is not valid, so please contact administrator' },
      { responseCode: '1003', expectedMsg: 'You have been already registered successfully on the platform with email test@example.com. Please check your email' },
      { responseCode: '1004', expectedMsg: 'You have been already registered successfully on the platform. If you have trouble logging in please contact administrator' },
      { responseCode: '1005', expectedMsg: 'You have been registered successfully on the platform with email test@example.com. Please check your email' },
      { responseCode: 'unknown', expectedMsg: 'Something went wrong, please contact administrator' },
    ]

    testCases.forEach(({ responseCode, expectedMsg }) => {
      signupAutoServiceMock.signup.mockReturnValue(of({ msg: `${responseCode}:Success`, email: 'test@example.com' }))
      component.signup('123')
      expect(component.msg).toBe(expectedMsg)
      expect(snackBarMock.open).toHaveBeenCalledWith(expectedMsg, 'X', { duration: 5000 })
    })
  })
})
