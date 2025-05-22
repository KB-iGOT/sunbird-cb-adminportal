import { TransformationsComponent } from './transformations.component'
import { FormBuilder, FormControl, FormGroup } from '@angular/forms'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute } from '@angular/router'
import { MarketplaceService } from '../../services/marketplace.service'
import { of, throwError } from 'rxjs'
import { HttpErrorResponse } from '@angular/common/http'
import * as XLSX from 'xlsx'

// Mock external dependencies
jest.mock('lodash', () => ({
  get: jest.fn((obj, path, defaultValue) => {
    const keys = path.split('.')
    let result = obj
    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key]
      } else {
        return defaultValue
      }
    }
    return result
  })
}))

jest.mock('xlsx', () => ({
  read: jest.fn(),
  utils: {
    sheet_to_json: jest.fn()
  }
}))

describe('TransformationsComponent', () => {
  let component: TransformationsComponent
  let mockMarketplaceService: jest.Mocked<MarketplaceService>
  let mockFormBuilder: FormBuilder
  let mockSnackBar: jest.Mocked<MatSnackBar>
  let mockDialog: jest.Mocked<MatDialog>
  let mockActivatedRoute: jest.Mocked<ActivatedRoute>

  beforeEach(() => {
    // Mock global objects
    global.URL = {
      createObjectURL: jest.fn().mockReturnValue('blob:mock-url'),
      revokeObjectURL: jest.fn()
    } as any

    // Mock FileReader
    const mockFileReader = {
      readAsText: jest.fn(),
      readAsBinaryString: jest.fn(),
      onload: null,
      onerror: null,
      result: null
    }
    global.FileReader = jest.fn(() => mockFileReader) as any;

    // Mock environment
    (global as any).environment = {
      karmYogiPath: 'https://test-karma-yogi.com'
    }

    // Create mocks
    mockMarketplaceService = {
      updateProvider: jest.fn(),
      uploadContent: jest.fn(),
      uploadProgress: jest.fn(),
      uploadThumbNail: jest.fn()
    } as any

    mockFormBuilder = new FormBuilder()

    mockSnackBar = {
      open: jest.fn()
    } as any

    mockDialog = {
      open: jest.fn().mockReturnValue({
        close: jest.fn()
      })
    } as any

    mockActivatedRoute = {
      data: of({
        pageData: {
          data: {
            trasformContentJson: [{
              spec: {
                'Course Name': 'courseName',
                'Course ID': 'courseId'
              }
            }],
            transformProgressJson: [{
              spec: {
                'User ID': 'userId',
                'Progress': 'progress'
              }
            }]
          }
        }
      })
    } as any

    // Create component instance
    component = new TransformationsComponent(
      mockMarketplaceService,
      mockFormBuilder,
      mockSnackBar,
      mockDialog,
      mockActivatedRoute
    )

    // Set up basic component state
    component.transformationType = 'trasformContentJson'
    component.providerDetails = {
      id: 'test-id',
      data: {
        partnerCode: 'TEST_PARTNER'
      }
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
  })

  describe('Constructor and Initialization', () => {
    it('should create component instance', () => {
      expect(component).toBeDefined()
    })

    it('should initialize with correct default values', () => {
      expect(component.transforamtionType).toBe('viaForm')
      expect(component.contentFileUploaded).toBe(false)
      expect(component.fileName).toBe('')
      expect(component.transformationsUpdated).toBe(false)
      expect(component.executed).toBe(false)
      expect(component.uploadedFileHeadersList).toEqual([])
      expect(component.availableHeadrsList).toEqual([])
    })

    it('should get routes data on initialization', () => {
      expect(component.providerConfiguration).toBeDefined()
      expect(component.providerConfiguration.trasformContentJson).toBeDefined()
    })
  })

  describe('ngOnChanges', () => {
    it('should set providerDetalsBeforUpdate when providerDetails changes', () => {
      const changes = {
        providerDetails: {
          currentValue: { id: 'test', name: 'Test Provider' }
        }
      } as any

      component.ngOnChanges(changes)

      expect(component.providerDetalsBeforUpdate).toEqual(changes.providerDetails.currentValue)
    })

    it('should initialize transformation controls when transformationType is set', () => {
      const spy = jest.spyOn(component, 'initializTransforamtionControls')
      component.transformationType = 'trasformContentJson'
      component.transFormContentKeysAndControls = []

      component.ngOnChanges({} as any)

      expect(spy).toHaveBeenCalled()
    })
  })

  describe('initializTransforamtionControls', () => {
    beforeEach(() => {
      component.providerDetalsBeforUpdate = {
        trasformContentJson: [{ spec: {} }],
        certificateTemplateUrl: 'test-url'
      }
    })

    it('should initialize transformation form for trasformContentJson', () => {
      component.transformationType = 'trasformContentJson'
      component.initializTransforamtionControls()

      expect(component.transformationSpecForm).toBeInstanceOf(FormControl)
      expect(component.transforamtionForm).toBeInstanceOf(FormGroup)
    })

    it('should initialize transformation form for transformProgressJson', () => {
      component.transformationType = 'transformProgressJson'
      component.initializTransforamtionControls()

      expect(component.transformationSpecForm).toBeInstanceOf(FormControl)
      expect(component.transforamtionForm).toBeInstanceOf(FormGroup)
    })

    it('should handle certificate template URL initialization', () => {
      component.transformationType = 'certificateTemplateUrl'
      const spy = jest.spyOn(component, 'generatePublicUrl')
      const getImageNameSpy = jest.spyOn(component, 'getImageName')

      component.initializTransforamtionControls()

      expect(component.contentFileUploaded).toBe(true)
      expect(spy).toHaveBeenCalledWith('test-url')
      expect(getImageNameSpy).toHaveBeenCalledWith('test-url')
    })
  })

  describe('generatePublicUrl', () => {
    it('should generate public URL for Google Storage URLs', () => {
      const googleUrl = 'https://storage.googleapis.com/igot/bucket/path/file.jpg'

      const result = component.generatePublicUrl(googleUrl)

      expect(result).toBe('https://test-karma-yogi.com/content-store/path/file.jpg')
    })

    it('should return original URL if not a Google Storage URL', () => {
      const normalUrl = 'https://example.com/file.jpg'
      const result = component.generatePublicUrl(normalUrl)

      expect(result).toBe(normalUrl)
    })
  })

  describe('getImageName', () => {
    it('should extract image name from URL with prefix', () => {
      const url = 'https://example.com/path/prefix_image.jpg'
      const result = component.getImageName(url)

      expect(result).toBe('image.jpg')
    })

    it('should return filename if no underscore found', () => {
      const url = 'https://example.com/path/image.jpg'
      const result = component.getImageName(url)

      expect(result).toBe('image.jpg')
    })

    it('should return original URL if empty', () => {
      const result = component.getImageName('')
      expect(result).toBe('')
    })
  })

  describe('onDrop', () => {
    it('should handle CSV file drop successfully', () => {
      const file = new File(['content'], 'test.csv', { type: 'text/csv' })
      const spy = jest.spyOn(component, 'getCsvHeaders').mockImplementation(() => { })

      component.transformationType = 'trasformContentJson'
      component.onDrop(file)

      expect(component.fileName).toBe('test.csv')
      expect(component.contentFile).toBe(file)
      expect(component.contentFileUploaded).toBe(true)
      expect(spy).toHaveBeenCalledWith(file)
    })

    it('should handle XLSX file drop successfully', () => {
      const file = new File(['content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const spy = jest.spyOn(component, 'getXLSXHeaders').mockImplementation(() => { })

      component.transformationType = 'trasformContentJson'
      component.onDrop(file)

      expect(component.fileName).toBe('test.xlsx')
      expect(component.contentFile).toBe(file)
      expect(component.contentFileUploaded).toBe(true)
      expect(spy).toHaveBeenCalledWith(file)
    })

    it('should handle SVG file drop for certificate template', () => {
      const file = new File(['content'], 'certificate.svg', { type: 'image/svg+xml' })

      component.transformationType = 'certificateTemplateUrl'
      component.onDrop(file)

      expect(component.fileName).toBe('certificate.svg')
      expect(component.contentFile).toBe(file)
      expect(component.contentFileUploaded).toBe(true)
      expect(component.certificateUrl).toBe('blob:mock-url')
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(file)
    })

    it('should show error for unsupported file format', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      const spy = jest.spyOn(component, 'showSnackBar')

      component.transformationType = 'trasformContentJson'
      component.onDrop(file)

      expect(spy).toHaveBeenCalledWith('Unsupported File Format. Please upload a CSV or XLSX file.')
    })

    it('should show error for file size exceeding limit', () => {
      const largeFile = new File(['x'.repeat(101 * 1024 * 1024)], 'large.csv', { type: 'text/csv' })
      const spy = jest.spyOn(component, 'showSnackBar')

      component.transformationType = 'trasformContentJson'
      component.onDrop(largeFile)

      expect(spy).toHaveBeenCalledWith('Please upload a file less than 100 MB')
    })
  })

  describe('getXLSXHeaders', () => {
    it('should extract headers from XLSX file', () => {
      const file = new File(['content'], 'test.xlsx')
      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: {
          Sheet1: {}
        }
      }
      const mockHeaders = ['Name', 'Email', 'Phone'];

      (XLSX.read as jest.Mock).mockReturnValue(mockWorkbook);
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([mockHeaders])

      // Get the FileReader instance that will be created
      const mockFileReader = (global.FileReader as unknown as jest.Mock).mock.results[0]?.value || {
        readAsBinaryString: jest.fn(),
        onload: null
      }

      component.getXLSXHeaders(file)

      // Simulate file reader load event
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: 'mock-data' } })
      }

      expect(component.uploadedFileHeadersList).toEqual(mockHeaders)
      expect(component.availableHeadrsList).toEqual(mockHeaders)
    })
  })

  describe('getCsvHeaders', () => {
    it('should extract headers from CSV file', () => {
      const file = new File(['Name,Email,Phone\nJohn,john@example.com,123'], 'test.csv')

      // Get the FileReader instance that will be created
      const mockFileReader = (global.FileReader as unknown as jest.Mock).mock.results[0]?.value || {
        readAsText: jest.fn(),
        onload: null,
        onerror: null,
        result: 'Name,Email,Phone\nJohn,john@example.com,123'
      }

      component.getCsvHeaders(file)

      // Simulate file reader load event
      if (mockFileReader.onload) {
        mockFileReader.onload()
      }

      expect(component.uploadedFileHeadersList).toEqual(['Name', 'Email', 'Phone'])
      expect(component.availableHeadrsList).toEqual(['Name', 'Email', 'Phone'])
    })

    it('should handle CSV read error', () => {
      const file = new File(['invalid'], 'test.csv')
      const showSnackBarSpy = jest.spyOn(component, 'showSnackBar')

      // Get the FileReader instance that will be created
      const mockFileReader = (global.FileReader as unknown as jest.Mock).mock.results[0]?.value || {
        readAsText: jest.fn(),
        onload: null,
        onerror: null
      }

      component.getCsvHeaders(file)

      // Simulate file reader error event
      if (mockFileReader.onerror) {
        mockFileReader.onerror()
      }

      expect(showSnackBarSpy).toHaveBeenCalledWith('Please upload proper csv file')
    })
  })

  describe('onSelectChange', () => {
    it('should filter available headers based on selected values', () => {
      component.uploadedFileHeadersList = ['Name', 'Email', 'Phone', 'Address']
      component.transforamtionForm = mockFormBuilder.group({
        field1: ['Name'],
        field2: ['Email']
      })

      component.onSelectChange()

      expect(component.availableHeadrsList).toEqual(['Phone', 'Address'])
    })
  })

  describe('upDateTransforamtionDetails', () => {
    beforeEach(() => {
      component.providerDetalsBeforUpdate = {
        data: { isActive: false },
        trasformContentJson: [{ spec: {} }]
      }
      component.transforamtionForm = mockFormBuilder.group({
        field1: ['value1', { validators: [] }]
      })
      component.transformationSpecForm = new FormControl({})
    })

    it('should update transformation details successfully via form', () => {
      jest.useFakeTimers()

      component.transforamtionType = 'viaForm'
      component.transformationType = 'trasformContentJson'
      component.transFormContentKeysAndControls = [{
        lable: 'Field 1',
        controlName: 'field1',
        path: 'path1'
      }]

      mockMarketplaceService.updateProvider.mockReturnValue(of({ success: true }))
      const showSnackBarSpy = jest.spyOn(component, 'showSnackBar')
      const sendProviderDetailsUpdateEventSpy = jest.spyOn(component, 'sendProviderDetailsUpdateEvent')

      component.upDateTransforamtionDetails()

      // Fast-forward time
      jest.advanceTimersByTime(1100)

      expect(mockMarketplaceService.updateProvider).toHaveBeenCalled()
      expect(showSnackBarSpy).toHaveBeenCalledWith('Transform Content saved successfully.')
      expect(sendProviderDetailsUpdateEventSpy).toHaveBeenCalled()

      jest.useRealTimers()
    })

    it('should handle update error', () => {
      component.transforamtionType = 'viaForm'
      const error = new HttpErrorResponse({
        error: { params: { errMsg: 'Update failed' } }
      })

      mockMarketplaceService.updateProvider.mockReturnValue(throwError(() => error))
      const showSnackBarSpy = jest.spyOn(component, 'showSnackBar')

      component.upDateTransforamtionDetails()

      expect(showSnackBarSpy).toHaveBeenCalledWith('Update failed')
    })

    it('should show validation error for invalid form', () => {
      component.transforamtionType = 'viaForm'
      component.transforamtionForm = mockFormBuilder.group({
        field1: ['', { validators: [(control: any) => control.value ? null : { required: true }] }]
      })

      const showSnackBarSpy = jest.spyOn(component, 'showSnackBar')

      component.upDateTransforamtionDetails()

      expect(showSnackBarSpy).toHaveBeenCalledWith('Please provide all mandatory fields')
    })
  })

  describe('uploadFile', () => {
    beforeEach(() => {
      component.contentFile = new File(['content'], 'test.csv')
      component.transformationsUpdated = true
      component.providerDetails = {
        id: 'test-id',
        data: { partnerCode: 'TEST' }
      }
    })

    it('should upload content file successfully', () => {
      component.transformationType = 'trasformContentJson'
      const uploadContentSpy = jest.spyOn(component, 'uploadContent').mockImplementation(() => { })
      const openFileUploadPopupSpy = jest.spyOn(component, 'openFileUploadPopup').mockImplementation(() => { })

      component.uploadFile()

      expect(component.executed).toBe(true)
      expect(openFileUploadPopupSpy).toHaveBeenCalledWith('csvLoader', 'File processing')
      expect(uploadContentSpy).toHaveBeenCalled()
    })

    it('should upload progress file successfully', () => {
      component.transformationType = 'transformProgressJson'
      const uploadProgressSpy = jest.spyOn(component, 'uploadProgress').mockImplementation(() => { })
      const openFileUploadPopupSpy = jest.spyOn(component, 'openFileUploadPopup').mockImplementation(() => { })

      component.uploadFile()

      expect(openFileUploadPopupSpy).toHaveBeenCalledWith('csvLoader', 'File processing')
      expect(uploadProgressSpy).toHaveBeenCalled()
    })

    it('should upload certificate file successfully', () => {
      component.transformationType = 'certificateTemplateUrl'
      component.contentFile = new File(['content'], 'cert.svg')
      component.transformationsUpdated = false // Certificate doesn't require transformationsUpdated

      const uploadCertificateSpy = jest.spyOn(component, 'uploadCertificate').mockImplementation(() => { })
      const openFileUploadPopupSpy = jest.spyOn(component, 'openFileUploadPopup').mockImplementation(() => { })

      component.uploadFile()

      expect(openFileUploadPopupSpy).toHaveBeenCalledWith('imageLoader', 'Certificate uploading')
      expect(uploadCertificateSpy).toHaveBeenCalled()
    })

    it('should show error when no file is uploaded', () => {
      component.contentFile = undefined
      const showSnackBarSpy = jest.spyOn(component, 'showSnackBar')

      component.uploadFile()

      expect(showSnackBarSpy).toHaveBeenCalledWith('Please upload a file to import')
    })

    it('should show error when transformations are not updated', () => {
      component.transformationsUpdated = false
      component.transformationType = 'trasformContentJson'
      component.providerDetalsBeforUpdate = {}
      const showSnackBarSpy = jest.spyOn(component, 'showSnackBar')

      component.uploadFile()

      expect(showSnackBarSpy).toHaveBeenCalledWith('Please add transform content')
    })
  })

  describe('uploadContent', () => {
    it('should upload content successfully', () => {
      jest.useFakeTimers()

      const formData = new FormData()
      const partnerCode = 'TEST'

      mockMarketplaceService.uploadContent.mockReturnValue(of({ success: true }))
      const showSnackBarSpy = jest.spyOn(component, 'showSnackBar')
      const removeFileSpy = jest.spyOn(component, 'removeFile').mockImplementation(() => { })

      component.dialogRef = { close: jest.fn() }
      component.loadTablesData = { emit: jest.fn() } as any

      component.uploadContent(formData, partnerCode)

      // Fast-forward time
      jest.advanceTimersByTime(1100)

      expect(component.executed).toBe(false)
      expect(showSnackBarSpy).toHaveBeenCalledWith('File imported successfully')
      expect(removeFileSpy).toHaveBeenCalled()
      expect(component.dialogRef.close).toHaveBeenCalled()
      expect(component.loadTablesData.emit).toHaveBeenCalledWith(true)

      jest.useRealTimers()
    })

    it('should handle upload content error', () => {
      const formData = new FormData()
      const partnerCode = 'TEST'
      const error = new HttpErrorResponse({
        error: { params: { errmsg: 'Upload failed' } }
      })

      mockMarketplaceService.uploadContent.mockReturnValue(throwError(() => error))
      const showSnackBarSpy = jest.spyOn(component, 'showSnackBar')

      component.dialogRef = { close: jest.fn() }

      component.uploadContent(formData, partnerCode)

      expect(component.executed).toBe(false)
      expect(component.transformationsUpdated).toBe(false)
      expect(component.contentFileUploaded).toBe(false)
      expect(showSnackBarSpy).toHaveBeenCalledWith('Upload failed')
      expect(component.dialogRef.close).toHaveBeenCalled()
    })
  })

  describe('uploadProgress', () => {
    it('should upload progress successfully', () => {
      jest.useFakeTimers()

      const formData = new FormData()
      const partnerCode = 'TEST'

      mockMarketplaceService.uploadProgress.mockReturnValue(of({ success: true }))
      const showSnackBarSpy = jest.spyOn(component, 'showSnackBar')

      component.dialogRef = { close: jest.fn() }
      component.loadTablesData = { emit: jest.fn() } as any

      component.uploadProgress(formData, partnerCode)

      // Fast-forward time
      jest.advanceTimersByTime(1100)

      expect(component.executed).toBe(false)
      expect(showSnackBarSpy).toHaveBeenCalledWith('File imported successfully')
      expect(component.transformationsUpdated).toBe(false)
      expect(component.contentFileUploaded).toBe(false)
      expect(component.dialogRef.close).toHaveBeenCalled()
      expect(component.loadTablesData.emit).toHaveBeenCalledWith(true)

      jest.useRealTimers()
    })

    it('should handle upload progress error', () => {
      const formData = new FormData()
      const partnerCode = 'TEST'
      const error = new HttpErrorResponse({
        error: { params: { errmsg: 'Progress upload failed' } }
      })

      mockMarketplaceService.uploadProgress.mockReturnValue(throwError(() => error))
      const showSnackBarSpy = jest.spyOn(component, 'showSnackBar')

      component.dialogRef = { close: jest.fn() }

      component.uploadProgress(formData, partnerCode)

      expect(component.executed).toBe(false)
      expect(component.transformationsUpdated).toBe(false)
      expect(component.contentFileUploaded).toBe(false)
      expect(showSnackBarSpy).toHaveBeenCalledWith('Progress upload failed')
      expect(component.dialogRef.close).toHaveBeenCalled()
    })
  })

  describe('uploadCertificate', () => {
    it('should upload certificate successfully', () => {
      const formData = new FormData()
      const response = { result: { url: 'https://example.com/cert.svg' } }

      mockMarketplaceService.uploadThumbNail.mockReturnValue(of(response))
      const upDateTransforamtionDetailsSpy = jest.spyOn(component, 'upDateTransforamtionDetails').mockImplementation(() => { })

      component.dialogRef = { close: jest.fn() }
      component.providerDetalsBeforUpdate = {}

      component.uploadCertificate(formData)

      expect(component.providerDetalsBeforUpdate.certificateTemplateUrl).toBe('https://example.com/cert.svg')
      expect(component.fileName).toBe('')
      expect(upDateTransforamtionDetailsSpy).toHaveBeenCalled()
      expect(component.dialogRef.close).toHaveBeenCalled()
    })
  })

  describe('removeFile', () => {
    it('should reset file-related properties', () => {
      component.contentFileUploaded = true
      component.transformationsUpdated = true
      component.contentFile = new File([''], 'test.csv')
      component.availableHeadrsList = ['header1', 'header2']
      component.transforamtionForm = mockFormBuilder.group({
        field1: ['value1']
      })

      const markFormAsUntouchedSpy = jest.spyOn(component as any, 'markFormAsUntouched').mockImplementation(() => { })

      component.removeFile()

      expect(component.contentFileUploaded).toBe(false)
      expect(component.transformationsUpdated).toBe(false)
      expect(component.contentFile).toBeUndefined()
      expect(component.availableHeadrsList).toEqual([])
      expect(markFormAsUntouchedSpy).toHaveBeenCalled()
    })
  })

  describe('Getter methods', () => {
    describe('getUploadHeader', () => {
      it('should return correct header for trasformContentJson', () => {
        component.transformationType = 'trasformContentJson'
        expect(component.getUploadHeader).toBe('Upload Course Catalog')
      })

      it('should return correct header for transformProgressJson', () => {
        component.transformationType = 'transformProgressJson'
        expect(component.getUploadHeader).toBe('Upload Course Progress')
      })

      it('should return correct header for certificateTemplateUrl', () => {
        component.transformationType = 'certificateTemplateUrl'
        expect(component.getUploadHeader).toBe('Upload Course Certificate')
      })
    })

    describe('getUpdateBtnText', () => {
      it('should return save text for new trasformContentJson', () => {
        component.transformationType = 'trasformContentJson'
        component.providerDetalsBeforUpdate = {}
        expect(component.getUpdateBtnText).toBe('Save Transform Content')
      })

      it('should return update text for existing trasformContentJson', () => {
        component.transformationType = 'trasformContentJson'
        component.providerDetalsBeforUpdate = { trasformContentJson: [{}] }
        expect(component.getUpdateBtnText).toBe('Update Transform Content')
      })

      it('should return save text for new transformProgressJson', () => {
        component.transformationType = 'transformProgressJson'
        component.providerDetalsBeforUpdate = {}
        expect(component.getUpdateBtnText).toBe('Save Transform Progress')
      })

      it('should return update text for existing transformProgressJson', () => {
        component.transformationType = 'transformProgressJson'
        component.providerDetalsBeforUpdate = { transformProgressJson: [{}] }
        expect(component.getUpdateBtnText).toBe('Update Transform Progress')
      })
    })
  })

  describe('Helper methods', () => {
    describe('openFileUploadPopup', () => {
      it('should open dialog with correct configuration', () => {
        const dialogType = 'csvLoader'
        const message = 'Test message'

        component.openFileUploadPopup(dialogType, message)

        expect(mockDialog.open).toHaveBeenCalledWith(
          expect.any(Function),
          expect.objectContaining({
            data: expect.objectContaining({
              dialogType,
              descriptions: expect.arrayContaining([
                expect.objectContaining({
                  messages: expect.arrayContaining([
                    expect.objectContaining({
                      msg: message
                    })
                  ])
                })
              ])
            }),
            autoFocus: false,
            width: '956px',
            maxWidth: '80vw',
            maxHeight: '90vh',
            height: '427px',
            disableClose: true
          })
        )
      })
    })

    describe('showSnackBar', () => {
      it('should call snackBar.open with message', () => {
        const message = 'Test message'
        component.showSnackBar(message)

        expect(mockSnackBar.open).toHaveBeenCalledWith(message)
      })
    })

    describe('sendProviderDetailsUpdateEvent', () => {
      it('should emit loadProviderDetails event', () => {
        component.loadProviderDetails = { emit: jest.fn() } as any

        component.sendProviderDetailsUpdateEvent()

        expect(component.transformationsUpdated).toBe(true)
        expect(component.loadProviderDetails.emit).toHaveBeenCalledWith(true)
      })
    })

    describe('getHeaderArray', () => {
      it('should parse CSV headers correctly', () => {
        const csvRecordsArr = ['Name,Email,Phone', 'John,john@example.com,123']
        const result = component.getHeaderArray(csvRecordsArr)

        expect(result).toEqual(['Name', 'Email', 'Phone'])
      })
    })
  })
})