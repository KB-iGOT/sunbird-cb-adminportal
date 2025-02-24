import { Subject } from 'rxjs'
import { BulkUploadComponent } from './bulk-upload.component'
import { FileService } from '../../services/upload.service'
import { UsersService } from '../../../../services/users.service'
import { DesignationsService } from '../../services/designations.service'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute, ParamMap } from '@angular/router'

jest.mock('@angular/material/dialog')
jest.mock('@angular/material/snack-bar')

describe('BulkUploadComponent', () => {
  let component: BulkUploadComponent
  let fileService: jest.Mocked<FileService>
  let usersService: jest.Mocked<UsersService>
  let dialog: jest.Mocked<MatDialog>
  let snackBar: jest.Mocked<MatSnackBar>
  let activatedRoute: Partial<ActivatedRoute>
  let designationsService: Partial<DesignationsService>

  const mockConfigService = {
    userProfile: {
      rootOrgId: 'test-org-id',
    },
    userProfileV2: {
      userId: 'test-user-id',
      email: 'test@example.com',
      mobile: '1234567890',
    }
  }

  jest.mock('@angular/router', () => ({
    ActivatedRouteSnapshot: jest.fn().mockImplementation(() => activatedRoute),
  }))

  beforeEach(() => {
    fileService = {
      getBulkDesignationUploadData: jest.fn(),
      validateExcelFile: jest.fn(),
      bulkUploadDesignation: jest.fn(),
      getBulkDesignationStatus: jest.fn(),
      downloadBulkUploadSampleFile: jest.fn(),
      downloadWithDispositionName: jest.fn(),
    } as any

    usersService = {
      getUserDetails: jest.fn(),
      sendOtp: jest.fn(),
    } as any

    dialog = {
      open: jest.fn(),
    } as any

    snackBar = {
      open: jest.fn(),
    } as any

    activatedRoute = {
      snapshot: {
        url: [],
        component: null,
        title: '',
        routeConfig: null,
        parent: null,
        firstChild: null,
        params: { id: '123' },
        fragment: 'some-fragment',
        outlet: 'primary',
        data: {
          configService: mockConfigService,
        },
        queryParams: {
          roleId: 'test-role-id',
        },
        children: [],  // Child routes, which can be empty if there are no children
        pathFromRoot: [],  // The list of activated route snapshots from the root to this snapshot
        root: null as any,  // root should be a mock or null depending on your use case
        paramMap: { get: jest.fn().mockReturnValue('123') } as unknown as ParamMap,
        queryParamMap: { get: jest.fn().mockReturnValue('test') } as unknown as ParamMap
      },
      data: new Subject(),
    }

    designationsService = {
      frameWorkInfo: {
        code: 'test-framework',
      },
    }

    component = new BulkUploadComponent(
      fileService,
      snackBar,
      dialog,
      usersService,
      activatedRoute as ActivatedRoute,
      designationsService as DesignationsService
    )
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    beforeEach(() => {
      usersService.getUserDetails.mockReturnValue(new Subject())
      fileService.getBulkDesignationUploadData.mockReturnValue(new Subject())
    })

    it('should initialize component properties', () => {
      const mockPageData = {
        data: {
          bulkUploadConfig: {
            pageSize: 10,
            pageSizeOptions: [10, 20, 30],
          },
        },
      };

      (activatedRoute.data as Subject<any>).next(mockPageData)
      component.ngOnInit()

      expect(component.orgId).toBe('test-role-id')
      expect(component.bulkUploadFrameworkId).toBe('test-framework')
      expect(component.pageSize).toBe(10)
      expect(component.sizeOptions).toEqual([10, 20, 30])
    })
  })

  describe('handleOnFileChange', () => {
    it('should validate and process excel file', () => {
      const mockFile = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      fileService.validateExcelFile.mockReturnValue(true)

      const mockDialogRef = {
        componentInstance: {
          resendOTP: new Subject(),
          otpVerified: new Subject(),
        },
      }
      dialog.open.mockReturnValue(mockDialogRef as any)

      component.handleOnFileChange([mockFile])

      expect(component.fileName).toBe('test.xlsx')
      expect(component.fileType).toBe(mockFile.type)
      expect(component.fileSelected).toBe(mockFile)
      expect(component.showFileError).toBeFalsy()
    })

    it('should show error for invalid file type', () => {
      const mockFile = new File([''], 'test.txt', { type: 'text/plain' })
      fileService.validateExcelFile.mockReturnValue(false)

      component.handleOnFileChange([mockFile])

      expect(component.showFileError).toBeTruthy()
    })
  })

  describe('uploadCSVFile', () => {
    it('should upload file successfully', () => {
      const mockFile = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      component.fileSelected = mockFile
      component.fileName = 'test.xlsx'
      component.fileType = mockFile.type

      const uploadSubject = new Subject()
      fileService.validateExcelFile.mockReturnValue(true)
      fileService.bulkUploadDesignation.mockReturnValue(uploadSubject)

      component.fileUploadDialogInstance = { close: jest.fn() }
      component.uploadCSVFile()

      uploadSubject.next({ success: true })

      expect(fileService.bulkUploadDesignation).toHaveBeenCalled()
      expect(component.fileUploadDialogInstance.close).toHaveBeenCalled()
      expect(snackBar.open).toHaveBeenCalledWith('File uploaded successfully!')
    })
  })

  describe('getBulkStatusList', () => {
    it('should fetch and sort bulk upload list', () => {
      const mockResponse = {
        result: {
          content: [
            { dateCreatedOn: '2024-02-24T10:00:00Z' },
            { dateCreatedOn: '2024-02-23T10:00:00Z' },
          ],
        },
      }

      const statusSubject = new Subject()
      fileService.getBulkDesignationUploadData.mockReturnValue(statusSubject)

      component.getBulkStatusList()
      statusSubject.next(mockResponse)

      expect(component.lastUploadList).toHaveLength(2)
      expect(new Date(component.lastUploadList[0].dateCreatedOn).getTime())
        .toBeGreaterThan(new Date(component.lastUploadList[1].dateCreatedOn).getTime())
    })
  })

  describe('handleChangePage', () => {
    it('should update pagination values', () => {
      const pageEvent = {
        pageSize: 20,
        pageIndex: 1,
        length: 100,
      }

      component.handleChangePage(pageEvent)

      expect(component.pageSize).toBe(20)
      expect(component.startIndex).toBe(20)
      expect(component.lastIndex).toBe(40)
    })
  })

  describe('cleanup', () => {
    it('should clear interval and unsubscribe on destroy', () => {
      jest.useFakeTimers()
      component.startTimer()
      component.ngOnDestroy()

      expect(clearInterval).toHaveBeenCalled()
    })
  })
})