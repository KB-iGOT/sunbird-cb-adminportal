import { BulkUploadComponent } from './bulk-upload.component'
import { of, throwError, Subject } from 'rxjs'
import { HttpErrorResponse } from '@angular/common/http'
import { PageEvent } from '@angular/material/paginator'

// Mock dependencies
const mockFileService = {
  getBulkDesignationUploadData: jest.fn(),
  getBulkDesignationStatus: jest.fn(),
  downloadWithDispositionName: jest.fn(),
  downloadBulkUploadSampleFile: jest.fn(),
  validateExcelFile: jest.fn(),
  bulkUploadDesignation: jest.fn()
}

const mockMatSnackBar = {
  open: jest.fn()
}

const mockDialog = {
  open: jest.fn().mockReturnValue({
    componentInstance: {
      resendOTP: new Subject(),
      otpVerified: new Subject()
    },
    close: jest.fn()
  })
}

const mockUsersService = {
  getUserDetails: jest.fn(),
  sendOtp: jest.fn()
}

const mockActivatedRoute = {
  snapshot: {
    data: {
      configService: {
        userProfile: { rootOrgId: 'root123' },
        userProfileV2: { userId: 'user123', email: 'test@test.com', mobile: '1234567890' }
      }
    },
    queryParams: { roleId: 'role123' }
  },
  data: of({
    pageData: {
      data: {
        bulkUploadConfig: {
          pageSize: 10,
          pageSizeOptions: [5, 10, 25, 50]
        }
      }
    }
  })
}

const mockDesignationsService = {
  frameWorkInfo: { code: 'framework123' }
}

describe('BulkUploadComponent', () => {
  let component: BulkUploadComponent
  let mockCloseComponentEmit: jest.SpyInstance

  beforeEach(() => {
    // Create component instance
    component = new BulkUploadComponent(
      mockFileService as any,
      mockMatSnackBar as any,
      mockDialog as any,
      mockUsersService as any,
      mockActivatedRoute as any,
      mockDesignationsService as any
    )

    // Mock the EventEmitter
    mockCloseComponentEmit = jest.spyOn(component.closeComponent, 'emit')

    // Reset all mocks
    jest.clearAllMocks()
  })

  afterEach(() => {
    // Clear intervals if any
    if (component.interval) {
      clearInterval(component.interval)
    }
  })

  describe('Constructor', () => {
    it('should initialize component with correct values', () => {
      expect(component.configSvc).toBeDefined()
      expect(component.rootOrgId).toBe('root123')
      expect(component.userProfile).toEqual({ userId: 'user123', email: 'test@test.com', mobile: '1234567890' })
    })
  })

  describe('ngOnInit', () => {
    it('should initialize component correctly', () => {
      const getUserDetailsSpy = jest.spyOn(component, 'getUserDetails')
      const getBulkStatusListSpy = jest.spyOn(component, 'getBulkStatusList')

      component.ngOnInit()

      expect(getUserDetailsSpy).toHaveBeenCalled()
      expect(component.orgId).toBe('role123')
      expect(getBulkStatusListSpy).toHaveBeenCalled()
      expect(component.pageSize).toBe(10)
      expect(component.sizeOptions).toEqual([5, 10, 25, 50])
      expect(component.bulkUploadFrameworkId).toBe('framework123')
    })

    it('should handle missing frameWorkInfo', () => {
      mockDesignationsService.frameWorkInfo = { code: '' }
      component.bulkUploadFrameworkId = 'default'
      component.ngOnInit()
      expect(component.bulkUploadFrameworkId).toBe('default')
    })
  })

  describe('getUserDetails', () => {
    it('should get user details successfully', () => {
      const mockUserDetails = {
        result: {
          response: {
            profileDetails: {
              personalDetails: {
                primaryEmail: 'newemail@test.com',
                mobile: '9876543210'
              }
            }
          }
        }
      }

      mockUsersService.getUserDetails.mockReturnValue(of(mockUserDetails))

      component.getUserDetails()

      expect(mockUsersService.getUserDetails).toHaveBeenCalledWith('user123')
      expect(component.userEmailPhone).toEqual({
        email: 'newemail@test.com',
        mobile: '9876543210'
      })
    })

    it('should handle missing user details gracefully', () => {
      mockUsersService.getUserDetails.mockReturnValue(of(null))
      component.getUserDetails()
      expect(mockUsersService.getUserDetails).toHaveBeenCalled()
    })

    it('should use default values when user details are incomplete', () => {
      const mockUserDetails = {
        result: {
          response: {
            profileDetails: {
              personalDetails: {}
            }
          }
        }
      }

      mockUsersService.getUserDetails.mockReturnValue(of(mockUserDetails))
      component.getUserDetails()

      expect(component.userEmailPhone).toEqual({
        email: 'test@test.com',
        mobile: '1234567890'
      })
    })
  })

  describe('ngAfterViewInit', () => {
    it('should set lastIndex correctly', () => {
      component.sizeOptions = [5, 10, 25]
      component.ngAfterViewInit()
      expect(component.lastIndex).toBe(5)
    })
  })

  describe('onChangePage', () => {
    it('should update pagination correctly', () => {
      const pageEvent: PageEvent = {
        pageIndex: 2,
        pageSize: 10,
        length: 100
      }

      component.onChangePage(pageEvent)

      expect(component.startIndex).toBe(20)
      expect(component.lastIndex).toBe(30)
    })
  })

  describe('getBulkStatusList', () => {
    it('should get bulk status list successfully with orgId', () => {
      const mockResponse = {
        result: {
          content: [
            { dateCreatedOn: '2023-01-02', fileName: 'file2.xlsx' },
            { dateCreatedOn: '2023-01-01', fileName: 'file1.xlsx' }
          ]
        }
      }

      mockFileService.getBulkDesignationUploadData.mockReturnValue(of(mockResponse))
      component.orgId = 'org123'

      component.getBulkStatusList()

      expect(mockFileService.getBulkDesignationUploadData).toHaveBeenCalledWith('org123')
      expect(component.lastUploadList).toEqual([
        { dateCreatedOn: '2023-01-02', fileName: 'file2.xlsx' },
        { dateCreatedOn: '2023-01-01', fileName: 'file1.xlsx' }
      ])
    })

    it('should use rootOrgId when orgId is not available', () => {
      const mockResponse = { result: { content: [] } }
      mockFileService.getBulkDesignationUploadData.mockReturnValue(of(mockResponse))
      component.orgId = ''

      component.getBulkStatusList()

      expect(mockFileService.getBulkDesignationUploadData).toHaveBeenCalledWith('root123')
    })

    it('should handle error when getting bulk status list', () => {
      const error = new HttpErrorResponse({ status: 500, statusText: 'Server Error' })
      // error.ok = false
      mockFileService.getBulkDesignationUploadData.mockReturnValue(throwError(error))

      component.getBulkStatusList()

      expect(mockMatSnackBar.open).toHaveBeenCalledWith('Unable to get Bulk status list')
    })

    it('should not show error when error.ok is true', () => {
      const error = new HttpErrorResponse({ status: 200, statusText: 'OK' })
      //error.ok = true
      mockFileService.getBulkDesignationUploadData.mockReturnValue(throwError(error))

      component.getBulkStatusList()

      expect(mockMatSnackBar.open).not.toHaveBeenCalled()
    })
  })

  describe('showFileUploadProgress', () => {
    it('should open file progress dialog', () => {
      component.showFileUploadProgress()

      expect(mockDialog.open).toHaveBeenCalledWith(expect.anything(), {
        data: {},
        disableClose: true,
        panelClass: 'progress-modal',
      })
      expect(component.fileUploadDialogInstance).toBeDefined()
    })
  })

  describe('handleDownloadFile', () => {
    it('should download file', () => {
      const listObj = { fileName: 'test.xlsx' } as any
      const mockFilePath = 'path/to/file'
      mockFileService.getBulkDesignationStatus.mockReturnValue(mockFilePath)

      component.handleDownloadFile(listObj)

      expect(mockFileService.getBulkDesignationStatus).toHaveBeenCalledWith('test.xlsx')
      expect(mockFileService.downloadWithDispositionName).toHaveBeenCalledWith(mockFilePath)
    })
  })

  describe('handleDownloadSampleFile', () => {
    it('should download sample file', () => {
      const mockFilePath = 'path/to/sample'
      mockFileService.downloadBulkUploadSampleFile.mockReturnValue(mockFilePath)
      component.bulkUploadFrameworkId = 'framework123'

      component.handleDownloadSampleFile()

      expect(mockFileService.downloadBulkUploadSampleFile).toHaveBeenCalledWith('framework123')
      expect(mockFileService.downloadWithDispositionName).toHaveBeenCalledWith(mockFilePath)
    })
  })

  describe('handleFileClick', () => {
    it('should clear file input value', () => {
      const mockEvent = {
        target: { value: 'test.xlsx' }
      }

      component.handleFileClick(mockEvent)

      expect(mockEvent.target.value).toBe('')
    })
  })

  describe('sendOTP', () => {
    it('should send OTP to email when email is available', () => {
      const generateAndVerifyOTPSpy = jest.spyOn(component, 'generateAndVerifyOTP')
      component.userEmailPhone.email = 'test@test.com'

      component.sendOTP()

      expect(generateAndVerifyOTPSpy).toHaveBeenCalledWith('email')
    })

    it('should send OTP to phone when email is not available', () => {
      const generateAndVerifyOTPSpy = jest.spyOn(component, 'generateAndVerifyOTP')
      component.userEmailPhone.email = ''

      component.sendOTP()

      expect(generateAndVerifyOTPSpy).toHaveBeenCalledWith('phone')
    })
  })

  describe('generateAndVerifyOTP', () => {
    it('should generate and verify OTP for email successfully', () => {
      const verifyOTPSpy = jest.spyOn(component, 'verifyOTP')
      mockUsersService.sendOtp.mockReturnValue(of({}))
      component.userEmailPhone.email = 'test@test.com'

      component.generateAndVerifyOTP('email')

      expect(mockUsersService.sendOtp).toHaveBeenCalledWith('test@test.com', 'email')
      expect(mockMatSnackBar.open).toHaveBeenCalledWith('An OTP has been sent to your Email address, (Valid for 15 min\'s)')
      expect(verifyOTPSpy).toHaveBeenCalledWith('email')
    })

    it('should generate and verify OTP for phone successfully', () => {
      const verifyOTPSpy = jest.spyOn(component, 'verifyOTP')
      mockUsersService.sendOtp.mockReturnValue(of({}))
      component.userEmailPhone.mobile = '1234567890'

      component.generateAndVerifyOTP('phone')

      expect(mockUsersService.sendOtp).toHaveBeenCalledWith('1234567890', 'phone')
      expect(mockMatSnackBar.open).toHaveBeenCalledWith('An OTP has been sent to your Mobile number, (Valid for 15 min\'s)')
      expect(verifyOTPSpy).toHaveBeenCalledWith('phone')
    })

    it('should not call verifyOTP when resendFlag is provided', () => {
      const verifyOTPSpy = jest.spyOn(component, 'verifyOTP')
      mockUsersService.sendOtp.mockReturnValue(of({}))
      component.userEmailPhone.email = 'test@test.com'

      component.generateAndVerifyOTP('email', 'resend')

      expect(verifyOTPSpy).not.toHaveBeenCalled()
    })

    it('should handle OTP generation error with custom message', () => {
      const error = new HttpErrorResponse({
        status: 400,
        error: { params: { errmsg: 'Custom error message' } }
      })
      // error.ok = false
      mockUsersService.sendOtp.mockReturnValue(throwError(error))

      component.generateAndVerifyOTP('email')

      expect(mockMatSnackBar.open).toHaveBeenCalledWith('Custom error message')
    })

    it('should handle OTP generation error with default message', () => {
      const error = new HttpErrorResponse({ status: 500 })
      // error.ok = false
      mockUsersService.sendOtp.mockReturnValue(throwError(error))

      component.generateAndVerifyOTP('phone')

      expect(mockMatSnackBar.open).toHaveBeenCalledWith('Unable to send OTP to your phone, please try again later!')
    })

    it('should not show error when error.ok is true', () => {
      const error = new HttpErrorResponse({ status: 200 })
      //  error.ok = true
      mockUsersService.sendOtp.mockReturnValue(throwError(error))

      component.generateAndVerifyOTP('email')

      expect(mockMatSnackBar.open).not.toHaveBeenCalled()
    })
  })

  describe('handleOnFileChange', () => {
    it('should handle valid Excel file', () => {
      const mockFile = new File(['content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const verifyOTPSpy = jest.spyOn(component, 'verifyOTP')
      mockFileService.validateExcelFile.mockReturnValue(true)
      component.userEmailPhone.email = 'test@test.com'

      component.handleOnFileChange([mockFile])

      expect(component.showFileError).toBe(false)
      expect(component.fileName).toBe('test.xlsx')
      expect(component.fileType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      expect(component.fileSelected).toBe(mockFile)
      expect(verifyOTPSpy).toHaveBeenCalledWith('email')
    })

    it('should handle valid file and use phone when email not available', () => {
      const mockFile = new File(['content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const verifyOTPSpy = jest.spyOn(component, 'verifyOTP')
      mockFileService.validateExcelFile.mockReturnValue(true)
      component.userEmailPhone.email = ''

      component.handleOnFileChange([mockFile])

      expect(verifyOTPSpy).toHaveBeenCalledWith('phone')
    })

    it('should handle invalid file type', () => {
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' })
      mockFileService.validateExcelFile.mockReturnValue(false)

      component.handleOnFileChange([mockFile])

      expect(component.showFileError).toBe(true)
      expect(component.fileName).toBe('test.txt')
      expect(component.fileType).toBe('text/plain')
      expect(component.fileSelected).toBe(mockFile)
    })

    it('should handle empty file list', () => {
      component.handleOnFileChange([])
      expect(component.showFileError).toBe(false)
    })
  })

  describe('verifyOTP', () => {
    it('should open verify OTP dialog and handle resend', () => {
      const mockDialogRef = {
        componentInstance: {
          resendOTP: new Subject(),
          otpVerified: new Subject()
        }
      }
      mockDialog.open.mockReturnValue(mockDialogRef)
      const generateAndVerifyOTPSpy = jest.spyOn(component, 'generateAndVerifyOTP')

      component.verifyOTP('email')

      expect(mockDialog.open).toHaveBeenCalledWith(expect.anything(), {
        data: { type: 'email', email: component.userEmailPhone.email, mobile: component.userEmailPhone.mobile },
        disableClose: false,
        panelClass: 'common-modal',
      })

      // Simulate resend OTP
      mockDialogRef.componentInstance.resendOTP.next('email')
      expect(generateAndVerifyOTPSpy).toHaveBeenCalledWith('email', 'resend')
    })

    it('should handle OTP verification success', () => {
      const mockDialogRef = {
        componentInstance: {
          resendOTP: new Subject(),
          otpVerified: new Subject()
        }
      }
      mockDialog.open.mockReturnValue(mockDialogRef)
      const showFileUploadProgressSpy = jest.spyOn(component, 'showFileUploadProgress')
      const uploadCSVFileSpy = jest.spyOn(component, 'uploadCSVFile')

      component.verifyOTP('phone')

      // Simulate OTP verification success
      mockDialogRef.componentInstance.otpVerified.next(true)
      expect(showFileUploadProgressSpy).toHaveBeenCalled()
      expect(uploadCSVFileSpy).toHaveBeenCalled()
    })
  })

  describe('uploadCSVFile', () => {
    beforeEach(() => {
      component.fileUploadDialogInstance = { close: jest.fn() }
    })

    it('should upload CSV file successfully', () => {
      const mockFile = new File(['content'], 'test.xlsx')
      component.fileSelected = mockFile
      component.fileName = 'test.xlsx'
      component.fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      component.bulkUploadFrameworkId = 'framework123'
      component.orgId = 'org123'

      mockFileService.validateExcelFile.mockReturnValue(true)
      mockFileService.bulkUploadDesignation.mockReturnValue(of({}))
      const getBulkStatusListSpy = jest.spyOn(component, 'getBulkStatusList')
      const startTimerSpy = jest.spyOn(component, 'startTimer')

      component.uploadCSVFile()

      expect(mockFileService.bulkUploadDesignation).toHaveBeenCalledWith(
        'test.xlsx',
        expect.any(FormData),
        'framework123',
        'org123'
      )
      expect(component.fileUploadDialogInstance.close).toHaveBeenCalled()
      expect(mockMatSnackBar.open).toHaveBeenCalledWith('File uploaded successfully!')
      expect(component.fileName).toBe('')
      expect(component.fileSelected).toBe('')
      expect(getBulkStatusListSpy).toHaveBeenCalled()
      expect(startTimerSpy).toHaveBeenCalled()
    })

    it('should handle upload error', () => {
      const mockFile = new File(['content'], 'test.xlsx')
      component.fileSelected = mockFile
      component.fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

      mockFileService.validateExcelFile.mockReturnValue(true)
      const error = new HttpErrorResponse({ status: 500 })
      //  error.ok = false
      mockFileService.bulkUploadDesignation.mockReturnValue(throwError(error))

      component.uploadCSVFile()

      expect(component.fileUploadDialogInstance.close).toHaveBeenCalled()
      expect(mockMatSnackBar.open).toHaveBeenCalledWith('Uploading CSV file failed due to some error, please try again later!')
    })

    it('should not upload when upload error.ok is true', () => {
      const mockFile = new File(['content'], 'test.xlsx')
      component.fileSelected = mockFile
      component.fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

      mockFileService.validateExcelFile.mockReturnValue(true)
      const error = new HttpErrorResponse({ status: 200 })
      //  error.ok = true
      mockFileService.bulkUploadDesignation.mockReturnValue(throwError(error))

      component.uploadCSVFile()

      expect(component.fileUploadDialogInstance.close).not.toHaveBeenCalled()
      expect(mockMatSnackBar.open).not.toHaveBeenCalled()
    })

    it('should show error when file validation fails', () => {
      component.fileType = 'text/plain'
      mockFileService.validateExcelFile.mockReturnValue(false)

      component.uploadCSVFile()

      expect(component.showFileError).toBe(true)
    })

    it('should not upload when no file is selected', () => {
      component.fileSelected = null
      component.fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      mockFileService.validateExcelFile.mockReturnValue(true)

      component.uploadCSVFile()

      expect(mockFileService.bulkUploadDesignation).not.toHaveBeenCalled()
    })
  })

  describe('handleChangePage', () => {
    it('should handle page change event', () => {
      const pageEvent: PageEvent = {
        pageIndex: 1,
        pageSize: 25,
        length: 100
      }

      component.handleChangePage(pageEvent)

      expect(component.pageSize).toBe(25)
      expect(component.startIndex).toBe(25)
      expect(component.lastIndex).toBe(50)
    })
  })

  describe('showMyDesignations', () => {
    it('should emit closeComponent event', () => {
      component.showMyDesignations()
      expect(mockCloseComponentEmit).toHaveBeenCalledWith(true)
    })
  })

  describe('ngOnDestroy', () => {
    it('should unsubscribe and clear interval', () => {
      const unsubscribeSpy = jest.spyOn(component.destroySubject$, 'unsubscribe')
      component.interval = setInterval(() => { }, 1000)
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval')

      component.ngOnDestroy()

      expect(unsubscribeSpy).toHaveBeenCalled()
      expect(clearIntervalSpy).toHaveBeenCalledWith(component.interval)
    })

    it('should handle ngOnDestroy when no interval exists', () => {
      const unsubscribeSpy = jest.spyOn(component.destroySubject$, 'unsubscribe')
      component.interval = null

      component.ngOnDestroy()

      expect(unsubscribeSpy).toHaveBeenCalled()
    })
  })

  describe('startTimer', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should start timer and call getBulkStatusList after timeout', () => {
      const getBulkStatusListSpy = jest.spyOn(component, 'getBulkStatusList')
      component.timeLeft = 2

      component.startTimer()

      // Fast forward time
      jest.advanceTimersByTime(3000)

      expect(getBulkStatusListSpy).toHaveBeenCalled()
    })

    it('should decrement timeLeft correctly', () => {
      component.timeLeft = 3
      component.startTimer()

      // Advance by 1 second
      jest.advanceTimersByTime(1000)

      // The timer should still be running
      expect(component.interval).toBeTruthy()
    })
  })
})