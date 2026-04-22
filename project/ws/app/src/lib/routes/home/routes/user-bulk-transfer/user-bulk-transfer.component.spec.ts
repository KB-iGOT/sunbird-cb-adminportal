import { UserBulkTransferComponent } from './user-bulk-transfer.component'
import { of, throwError } from 'rxjs'
import { PageEvent } from '@angular/material/paginator'

const mockFileService = {
  statusOfBulkUserTransfer: jest.fn(),
  validateFile: jest.fn(),
  downloadSampleBulkUserTransferFile: jest.fn(),
  uploadBulkUserTransfer: jest.fn(),
}

const mockMatSnackBar = { open: jest.fn() }

const mockRouter = {
  snapshot: {
    parent: {
      data: {
        configService: {
          unMappedUser: {
            rootOrg: { rootOrgId: 'root-org-1' },
            profileDetails: {
              personalDetails: { primaryEmail: 'test@test.com', mobile: '9999999999' }
            }
          }
        }
      }
    },
    data: {}
  }
}

const mockDialogRef = {
  close: jest.fn(),
  componentInstance: {
    resendOTP: { subscribe: jest.fn((cb: any) => cb('email')) },
    otpVerified: { subscribe: jest.fn() },
  },
  afterClosed: jest.fn().mockReturnValue(of(null)),
}

const mockDialog = {
  open: jest.fn().mockReturnValue(mockDialogRef),
}

const mockUsersService = {
  sendOtp: jest.fn(),
}

const mockOrgHieService = {
  getOrgData: jest.fn().mockReturnValue({ rootOrgId: 'root-org-1' }),
  getParentOrgData: jest.fn().mockReturnValue({ orgHierarchyFrameworkStatus: 'completed', orgHierarchyFrameworkId: 'fw-1' }),
}

describe('UserBulkTransferComponent', () => {
  let component: UserBulkTransferComponent

  beforeEach(() => {
    jest.clearAllMocks()
    mockFileService.statusOfBulkUserTransfer.mockReturnValue(of({ result: { content: [] } }))
    component = new UserBulkTransferComponent(
      mockFileService as any,
      mockMatSnackBar as any,
      mockRouter as any,
      mockDialog as any,
      mockUsersService as any,
      mockOrgHieService as any,
    )
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should have correct default property values', () => {
    expect(component.lastUploadList).toEqual([])
    expect(component.sizeOptions).toEqual([10, 20])
    expect(component.startIndex).toBe(0)
    expect(component.pageSize).toBe(10)
    expect(component.showFileError).toBe(false)
  })

  it('ngOnInit should call getBulkStatusList', () => {
    const spy = jest.spyOn(component, 'getBulkStatusList').mockImplementation()
    component.ngOnInit()
    expect(spy).toHaveBeenCalled()
  })

  it('ngOnInit should set rootOrgId from router snapshot when selectedOrgData is not present', () => {
    component.ngOnInit()
    expect(component['rootOrgId']).toBe('root-org-1')
  })

  it('ngOnInit with selectedOrgData should use roleId as rootOrgId', () => {
    component.selectedOrgData = { roleId: 'role-org-1' }
    component.ngOnInit()
    expect(component['rootOrgId']).toBe('role-org-1')
  })

  it('ngAfterViewInit should set lastIndex to first size option', () => {
    component.ngAfterViewInit()
    expect(component.lastIndex).toBe(10)
  })

  it('onChangePage should update startIndex and lastIndex', () => {
    const pe = { pageIndex: 1, pageSize: 10 } as PageEvent
    component.onChangePage(pe)
    expect(component.startIndex).toBe(10)
    expect(component.lastIndex).toBe(20)
  })

  it('getBulkStatusList should sort and set lastUploadList on success', () => {
    const content = [
      { dateCreatedOn: '2024-01-02' },
      { dateCreatedOn: '2024-01-03' },
      { dateCreatedOn: '2024-01-01' },
    ]
    mockFileService.statusOfBulkUserTransfer.mockReturnValue(of({ result: { content } }))
    component.getBulkStatusList()
    expect(component.lastUploadList[0].dateCreatedOn).toBe('2024-01-03')
  })

  it('getBulkStatusList should show snackbar on error', () => {
    mockFileService.statusOfBulkUserTransfer.mockReturnValue(throwError({ ok: false }))
    component.getBulkStatusList()
    expect(mockMatSnackBar.open).toHaveBeenCalledWith('Unable to get Bulk status list')
  })

  it('showFileUploadProgress should open dialog', () => {
    component.showFileUploadProgress()
    expect(mockDialog.open).toHaveBeenCalled()
  })

  it('handleDownloadFile should open file path in new tab', () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation()
    component.handleDownloadFile({ fileName: 'test.xlsx' })
    expect(openSpy).toHaveBeenCalledWith(
      '/apis/proxies/v8/user/v1/org-migration/bulk-upload/result/test.xlsx',
      '_blank'
    )
    openSpy.mockRestore()
  })

  it('handleDownloadSampleFile should call downloadSampleBulkUserTransferFile when framework status is completed', () => {
    component['parentOrgData'] = { orgHierarchyFrameworkStatus: 'completed', orgHierarchyFrameworkId: 'fw-1' }
    component.handleDownloadSampleFile()
    expect(mockFileService.downloadSampleBulkUserTransferFile).toHaveBeenCalledWith('orgUserBulkTransferSample.xlsx', 'fw-1')
  })

  it('handleDownloadSampleFile should show snackbar when framework status is not completed', () => {
    component['parentOrgData'] = { orgHierarchyFrameworkStatus: 'pending' }
    component.handleDownloadSampleFile()
    expect(mockMatSnackBar.open).toHaveBeenCalledWith(
      'Please complete the framework setup of parent organisation to download the sample file'
    )
  })

  it('handleFileClick should reset file input value', () => {
    const mockEvent = { target: { value: 'test.xlsx' } }
    component.handleFileClick(mockEvent)
    expect(mockEvent.target.value).toBe('')
  })

  it('handleOnFileChange should set showFileError when file is invalid', () => {
    mockFileService.validateFile.mockReturnValue(false)
    const mockFile = new File(['content'], 'test.csv', { type: 'text/csv' })
    const mockEvent = { target: { files: [mockFile] } }
    component['userProfile'] = { primaryEmail: 'test@test.com' }
    component.handleOnFileChange(mockEvent)
    expect(component.showFileError).toBe(true)
  })

  it('handleOnFileChange should do nothing when no files selected', () => {
    const mockEvent = { target: { files: [] } }
    component.handleOnFileChange(mockEvent)
    expect(component.showFileError).toBe(false)
  })

  it('handleOnFileChange should reset showFileError and verify valid file', () => {
    mockFileService.validateFile.mockReturnValue(true)
    const mockFile = new File(['content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const mockEvent = { target: { files: [mockFile] } }
    component['userProfile'] = { primaryEmail: 'test@test.com' }
    jest.spyOn(component, 'verifyOTP').mockImplementation()
    component.handleOnFileChange(mockEvent)
    expect(component.showFileError).toBe(false)
  })

  it('sendOTP should call generateAndVerifyOTP with email when primaryEmail is set', () => {
    component['userProfile'] = { primaryEmail: 'test@test.com', mobile: null }
    const spy = jest.spyOn(component, 'generateAndVerifyOTP').mockImplementation()
    component.sendOTP()
    expect(spy).toHaveBeenCalledWith('email')
  })

  it('sendOTP should call generateAndVerifyOTP with phone when no primaryEmail', () => {
    component['userProfile'] = { primaryEmail: null, mobile: '9999999999' }
    const spy = jest.spyOn(component, 'generateAndVerifyOTP').mockImplementation()
    component.sendOTP()
    expect(spy).toHaveBeenCalledWith('phone')
  })

  it('generateAndVerifyOTP should call usersService.sendOtp and open verifyOTP dialog on success', () => {
    component['userProfile'] = { primaryEmail: 'test@test.com', mobile: '9999999999' }
    mockUsersService.sendOtp.mockReturnValue(of({}))
    jest.spyOn(component, 'verifyOTP').mockImplementation()
    component.generateAndVerifyOTP('email')
    expect(mockUsersService.sendOtp).toHaveBeenCalledWith('test@test.com', 'email')
    expect(mockMatSnackBar.open).toHaveBeenCalled()
  })

  it('generateAndVerifyOTP should not call verifyOTP when resendFlag is provided', () => {
    component['userProfile'] = { primaryEmail: 'test@test.com', mobile: '9999999999' }
    mockUsersService.sendOtp.mockReturnValue(of({}))
    const verifySpy = jest.spyOn(component, 'verifyOTP').mockImplementation()
    component.generateAndVerifyOTP('email', 'resend')
    expect(verifySpy).not.toHaveBeenCalled()
  })

  it('generateAndVerifyOTP should show snackbar on error', () => {
    component['userProfile'] = { primaryEmail: 'test@test.com', mobile: '9999999999' }
    mockUsersService.sendOtp.mockReturnValue(throwError({ ok: false, error: { params: { errmsg: 'OTP failed' } } }))
    component.generateAndVerifyOTP('email')
    expect(mockMatSnackBar.open).toHaveBeenCalled()
  })

  it('uploadCSVFile should show error when file is invalid', () => {
    mockFileService.validateFile.mockReturnValue(false)
    component.fileName = 'test.csv'
    component.fileSelected = new File(['content'], 'test.csv')
    component.uploadCSVFile()
    expect(component.showFileError).toBe(true)
  })

  it('uploadCSVFile should upload file on success', () => {
    mockFileService.validateFile.mockReturnValue(true)
    mockFileService.uploadBulkUserTransfer.mockReturnValue(of({}))
    component.fileName = 'test.xlsx'
    component.fileSelected = new File(['content'], 'test.xlsx')
    component['completeOrgData'] = { rootOrgId: 'root-1' }
    component['parentOrgData'] = { orgHierarchyFrameworkId: 'fw-1' }
    component['fileUploadDialogInstance'] = { close: jest.fn() }
    component.uploadCSVFile()
    expect(mockFileService.uploadBulkUserTransfer).toHaveBeenCalled()
    expect(mockMatSnackBar.open).toHaveBeenCalledWith('File uploaded successfully!')
  })

  it('uploadCSVFile should show snackbar on upload error', () => {
    mockFileService.validateFile.mockReturnValue(true)
    mockFileService.uploadBulkUserTransfer.mockReturnValue(throwError({ ok: false }))
    component.fileName = 'test.xlsx'
    component.fileSelected = new File(['content'], 'test.xlsx')
    component['completeOrgData'] = { rootOrgId: 'root-1' }
    component['parentOrgData'] = ''
    component['fileUploadDialogInstance'] = { close: jest.fn() }
    component.uploadCSVFile()
    expect(mockMatSnackBar.open).toHaveBeenCalledWith('Uploading CSV file failed due to some error, please try again later!')
  })

  it('handleChangePage should update pageSize, startIndex and lastIndex', () => {
    const event = { pageIndex: 2, pageSize: 20 } as PageEvent
    component.handleChangePage(event)
    expect(component.pageSize).toBe(20)
    expect(component.startIndex).toBe(40)
    expect(component.lastIndex).toBe(60)
  })

  it('ngOnDestroy should unsubscribe destroySubject$', () => {
    const spy = jest.spyOn(component['destroySubject$'], 'unsubscribe')
    component.ngOnDestroy()
    expect(spy).toHaveBeenCalled()
  })
})
