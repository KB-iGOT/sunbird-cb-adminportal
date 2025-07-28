import { BulkUploadOrgComponent } from './bulk-upload-org.component'
import { OrgHierarchyService } from '../services/org-hierarchy.service'
import { GlobalEventsService } from '../../../../../../../../src/app/services/global-events.service'

import { of, throwError } from 'rxjs'
import { MatDialogRef } from '@angular/material/dialog'
import { MatLegacySnackBar } from '@angular/material/legacy-snack-bar'

describe('BulkUploadOrgComponent', () => {
  let component: BulkUploadOrgComponent
  let mockDialogRef: jest.Mocked<MatDialogRef<BulkUploadOrgComponent>>
  let mockOrgHieService: jest.Mocked<OrgHierarchyService>
  let mockLoaderService: jest.Mocked<GlobalEventsService>
  let mockSnackbar: jest.Mocked<MatLegacySnackBar>
  let mockData: any

  beforeEach(() => {
    // Create mock objects
    mockDialogRef = {
      close: jest.fn()
    } as any

    mockOrgHieService = {
      downloadSampleTemplate: jest.fn(),
      uploadFreameworkTemplate: jest.fn(),
      getBulkuploadProgress: jest.fn(),
      downloadFileLog: jest.fn()
    } as any

    mockLoaderService = {
      setLoaderState: jest.fn()
    } as any

    mockSnackbar = {
      open: jest.fn()
    } as any

    mockData = {
      bulkUploadConfig: {
        frameworkData: {
          orgHierarchyFrameworkId: 'org123_framework456'
        }
      }
    }

    // Create component instance
    component = new BulkUploadOrgComponent(
      mockDialogRef,
      mockData,
      mockOrgHieService,
      mockLoaderService,
      mockSnackbar
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('ngOnInit', () => {
    it('should initialize bulkUploadConfig from data', () => {
      component.ngOnInit()

      expect(component.bulkUploadConfig).toEqual(mockData.bulkUploadConfig)
    })

    it('should call getBulkuploadPrgressData when bulkUploadConfig exists', () => {
      jest.spyOn(component, 'getBulkuploadPrgressData').mockImplementation()

      component.ngOnInit()

      expect(component.getBulkuploadPrgressData).toHaveBeenCalled()
    })

    it('should handle missing bulkUploadConfig', () => {
      mockData.bulkUploadConfig = null
      component = new BulkUploadOrgComponent(
        mockDialogRef,
        mockData,
        mockOrgHieService,
        mockLoaderService,
        mockSnackbar
      )

      jest.spyOn(component, 'getBulkuploadPrgressData').mockImplementation()

      component.ngOnInit()

      expect(component.bulkUploadConfig).toEqual({})
      expect(component.getBulkuploadPrgressData).not.toHaveBeenCalled()
    })
  })

  describe('handleDownloadSampleFile', () => {
    it('should download sample file successfully', async () => {
      const mockFileData = { success: true }
      mockOrgHieService.downloadSampleTemplate.mockReturnValue(
        of(mockFileData) as any
      )

      await component.handleDownloadSampleFile()

      expect(mockLoaderService.setLoaderState).toHaveBeenCalledWith(true)
      expect(mockOrgHieService.downloadSampleTemplate).toHaveBeenCalledWith('org123_framework456')
      expect(mockSnackbar.open).toHaveBeenCalledWith('Download successfully')
    })

    it('should handle download error with error message', async () => {
      const mockError = {
        error: {
          params: {
            errMsg: 'Download failed'
          }
        }
      }
      mockOrgHieService.downloadSampleTemplate.mockReturnValue(
        throwError(mockError) as any
      )

      await component.handleDownloadSampleFile()

      expect(mockLoaderService.setLoaderState).toHaveBeenCalledWith(true)
      expect(mockLoaderService.setLoaderState).toHaveBeenCalledWith(false)
      expect(mockSnackbar.open).toHaveBeenCalledWith('Download failed')
    })

    it('should handle download error without error message', async () => {
      const mockError = { error: {} }
      mockOrgHieService.downloadSampleTemplate.mockReturnValue(
        throwError(mockError) as any
      )

      await component.handleDownloadSampleFile()

      expect(mockLoaderService.setLoaderState).toHaveBeenCalledWith(false)
    })

    it('should not proceed if frameworkData is missing', async () => {
      component.bulkUploadConfig = {}

      await component.handleDownloadSampleFile()

      expect(mockOrgHieService.downloadSampleTemplate).not.toHaveBeenCalled()
      expect(mockLoaderService.setLoaderState).not.toHaveBeenCalled()
    })
  })

  describe('handleFileClick', () => {
    it('should reset file input value', () => {
      const mockEvent = {
        target: {
          value: 'test-file.xlsx'
        }
      }

      component.handleFileClick(mockEvent)

      expect(mockEvent.target.value).toBe('')
    })
  })

  describe('onFileSelected', () => {
    let mockFile: File
    let mockEvent: any

    beforeEach(() => {
      mockFile = new File(['test'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      mockEvent = {
        target: {
          files: [mockFile]
        }
      }
    })

    it('should upload valid file', () => {
      jest.spyOn(component, 'uploadExcelFile').mockImplementation()
      jest.spyOn(component, 'isValidExcelFile').mockReturnValue(true)

      component.onFileSelected(mockEvent)

      expect(component.uploadExcelFile).toHaveBeenCalledWith(mockFile)
    })

    it('should show error for invalid file type', () => {
      jest.spyOn(component, 'showMessage').mockImplementation()
      jest.spyOn(component, 'isValidExcelFile').mockReturnValue(false)

      component.onFileSelected(mockEvent)

      expect(component.showMessage).toHaveBeenCalledWith('Please select a valid Excel file (.xlsx)')
    })

    it('should show error for file size exceeding 5MB', () => {
      const largeMockFile = {
        ...mockFile,
        size: 6 * 1024 * 1024 // 6MB
      } as File
      mockEvent.target.files = [largeMockFile]

      jest.spyOn(component, 'showMessage').mockImplementation()
      jest.spyOn(component, 'isValidExcelFile').mockReturnValue(true)

      component.onFileSelected(mockEvent)

      expect(component.showMessage).toHaveBeenCalledWith('File size should not exceed 5MB')
    })

    it('should do nothing if no file is selected', () => {
      mockEvent.target.files = []
      jest.spyOn(component, 'uploadExcelFile').mockImplementation()

      component.onFileSelected(mockEvent)

      expect(component.uploadExcelFile).not.toHaveBeenCalled()
    })
  })

  describe('uploadExcelFile', () => {
    let mockFile: File

    beforeEach(() => {
      mockFile = new File(['test'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
    })

    it('should upload file successfully', async () => {
      const mockResponse = {
        result: {
          fileName: 'uploaded-file.xlsx'
        }
      }
      mockOrgHieService.uploadFreameworkTemplate.mockReturnValue(
        of(mockResponse) as any
      )
      jest.spyOn(component, 'getBulkuploadPrgressData').mockImplementation()

      await component.uploadExcelFile(mockFile)

      expect(mockLoaderService.setLoaderState).toHaveBeenCalledWith(true)
      expect(mockLoaderService.setLoaderState).toHaveBeenCalledWith(false)
      expect(component.getBulkuploadPrgressData).toHaveBeenCalled()
      expect(mockSnackbar.open).toHaveBeenCalledWith('File uploaded successfully. Please check after 5 minutes for the results.')
    })

    it('should handle upload error with error message', async () => {
      const mockError = {
        error: {
          params: {
            errMsg: 'Upload failed'
          }
        }
      }
      mockOrgHieService.uploadFreameworkTemplate.mockReturnValue(
        throwError(mockError) as any
      )

      await component.uploadExcelFile(mockFile)

      expect(mockLoaderService.setLoaderState).toHaveBeenCalledWith(true)
      expect(mockLoaderService.setLoaderState).toHaveBeenCalledWith(false)
      expect(mockSnackbar.open).toHaveBeenCalledWith('Upload failed')
    })

    it('should create FormData with file and framework data', async () => {
      const mockResponse = { result: { fileName: 'test.xlsx' } }
      mockOrgHieService.uploadFreameworkTemplate.mockReturnValue(
        of(mockResponse) as any
      )

      await component.uploadExcelFile(mockFile)

      expect(mockOrgHieService.uploadFreameworkTemplate).toHaveBeenCalledWith(
        expect.any(FormData),
        component.bulkUploadConfig.frameworkData
      )
    })
  })

  describe('showMessage', () => {
    it('should display message with close button and duration', () => {
      const message = 'Test message'

      component.showMessage(message)

      expect(mockSnackbar.open).toHaveBeenCalledWith(message, 'Close', {
        duration: 5000
      })
    })
  })

  describe('isValidExcelFile', () => {
    it('should return true for valid Excel file', () => {
      const validFile = new File(['test'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const result = component.isValidExcelFile(validFile)

      expect(result).toBe(true)
    })

    it('should return false for invalid file type', () => {
      const invalidFile = new File(['test'], 'test.txt', {
        type: 'text/plain'
      })

      const result = component.isValidExcelFile(invalidFile)

      expect(result).toBe(false)
    })

    it('should log file type to console', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      const file = new File(['test'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      component.isValidExcelFile(file)

      expect(consoleSpy).toHaveBeenCalledWith('File type: ', ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
      consoleSpy.mockRestore()
    })
  })

  describe('getBulkuploadPrgressData', () => {
    it('should fetch progress data successfully', () => {
      const mockResponse = {
        params: {
          status: 'successful'
        },
        result: {
          content: [
            { id: 1, fileName: 'file1.xlsx' },
            { id: 2, fileName: 'file2.xlsx' }
          ]
        }
      }
      mockOrgHieService.getBulkuploadProgress.mockReturnValue(
        of(mockResponse) as any
      )

      component.getBulkuploadPrgressData()

      expect(mockLoaderService.setLoaderState).toHaveBeenCalledWith(true)
      expect(mockLoaderService.setLoaderState).toHaveBeenCalledWith(false)
      expect(mockOrgHieService.getBulkuploadProgress).toHaveBeenCalledWith('org123')
      expect(component.lastUploadList).toEqual(mockResponse.result.content)
    })

    it('should handle unsuccessful response', () => {
      const mockResponse = {
        params: {
          status: 'failed'
        }
      }
      mockOrgHieService.getBulkuploadProgress.mockReturnValue(
        of(mockResponse) as any
      )

      component.getBulkuploadPrgressData()

      expect(component.lastUploadList).toEqual([])
      expect(mockSnackbar.open).toHaveBeenCalledWith('No progress data found')
    })

    it('should handle error response', () => {
      const mockError = { error: 'Network error' }
      mockOrgHieService.getBulkuploadProgress.mockReturnValue(
        throwError(mockError) as any
      )

      component.getBulkuploadPrgressData()

      expect(component.lastUploadList).toEqual([])
      expect(mockLoaderService.setLoaderState).toHaveBeenCalledWith(false)
      expect(mockSnackbar.open).toHaveBeenCalledWith('Error fetching progress data')
    })

    it('should use empty string when orgId is not available', () => {
      component.bulkUploadConfig = {
        frameworkData: {
          orgHierarchyFrameworkId: 'invalidformat'
        }
      }
      mockOrgHieService.getBulkuploadProgress.mockReturnValue(
        of({ params: { status: 'successful' }, result: { content: [] } }) as any
      )

      component.getBulkuploadPrgressData()

      expect(mockOrgHieService.getBulkuploadProgress).toHaveBeenCalledWith('')
    })
  })

  describe('handleDownloadFile', () => {
    it('should download file successfully', () => {
      const mockItem = { fileName: 'test-file.xlsx' }
      const mockBlob = new Blob(['file content'])
      mockOrgHieService.downloadFileLog.mockReturnValue(
        of(mockBlob) as any
      )

      // Mock DOM methods
      const mockUrl = 'blob:mock-url'
      const mockAnchor = {
        href: '',
        download: '',
        click: jest.fn()
      }

      jest.spyOn(window.URL, 'createObjectURL').mockReturnValue(mockUrl)
      jest.spyOn(window.URL, 'revokeObjectURL').mockImplementation()
      jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any)

      component.handleDownloadFile(mockItem)

      expect(mockLoaderService.setLoaderState).toHaveBeenCalledWith(true)
      expect(mockLoaderService.setLoaderState).toHaveBeenCalledWith(false)
      expect(mockOrgHieService.downloadFileLog).toHaveBeenCalledWith('test-file.xlsx')
      expect(mockAnchor.href).toBe(mockUrl)
      expect(mockAnchor.download).toBe('test-file.xlsx')
      expect(mockAnchor.click).toHaveBeenCalled()
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl)
    })

    it('should handle download error', () => {
      const mockItem = { fileName: 'test-file.xlsx' }
      const mockError = { error: 'Download failed' }
      mockOrgHieService.downloadFileLog.mockReturnValue(
        throwError(mockError) as any
      )

      component.handleDownloadFile(mockItem)

      expect(mockLoaderService.setLoaderState).toHaveBeenCalledWith(true)
      expect(mockLoaderService.setLoaderState).toHaveBeenCalledWith(false)
      expect(mockSnackbar.open).toHaveBeenCalledWith('Error downloading file')
    })

    it('should show error when no fileName is provided', () => {
      const mockItem = {}

      component.handleDownloadFile(mockItem)

      expect(mockSnackbar.open).toHaveBeenCalledWith('No file name provided for download')
      expect(mockOrgHieService.downloadFileLog).not.toHaveBeenCalled()
    })

    it('should show error when item is null', () => {
      component.handleDownloadFile(null)

      expect(mockSnackbar.open).toHaveBeenCalledWith('No file name provided for download')
      expect(mockOrgHieService.downloadFileLog).not.toHaveBeenCalled()
    })
  })

  describe('Component Properties', () => {
    it('should initialize with undefined properties', () => {
      const freshComponent = new BulkUploadOrgComponent(
        mockDialogRef,
        {},
        mockOrgHieService,
        mockLoaderService,
        mockSnackbar
      )

      expect(freshComponent.bulkUploadConfig).toBeUndefined()
      expect(freshComponent.lastUploadList).toBeUndefined()
    })
  })
})