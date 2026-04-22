import { FormBuilder } from '@angular/forms'
import { of, throwError } from 'rxjs'
import { BulkUploadCoursesComponent } from './bulk-upload-courses.component'
import { SimpleChanges } from '@angular/core'

const mockMarketPlaceSvc = {
  updateProvider: jest.fn(),
  uploadContent: jest.fn(),
  downloadAssetFile: jest.fn(),
}

const mockSnackBar = {
  openFromComponent: jest.fn(),
}

const mockDialog = {
  open: jest.fn().mockReturnValue({ close: jest.fn() }),
}

const mockActivateRoute = {
  data: of({
    pageData: {
      data: {
        trasformContentJson: [
          {
            spec: { 'Course Name': 'name', 'Course Id': 'id' },
            requiredList: ['Course Name'],
          }
        ],
        transformContentViaApiAuthentication: {},
        bulkUploadCourse: { sampleFileDownloadLink: 'http://sample.com/file.csv' }
      }
    }
  }),
  snapshot: { data: { pageData: { data: { bulkUploadCourse: {} } } } },
}

function createComponent() {
  const fb = new FormBuilder()
  const component = new BulkUploadCoursesComponent(
    mockMarketPlaceSvc as any,
    fb,
    mockSnackBar as any,
    mockDialog as any,
    mockActivateRoute as any,
  )
  return component
}

describe('BulkUploadCoursesComponent', () => {
  let component: BulkUploadCoursesComponent

  beforeEach(() => {
    jest.clearAllMocks()
    component = createComponent()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('should set configurationData from route snapshot', () => {
      component.ngOnInit()
      expect(component.configurationData).toBeDefined()
    })
  })

  describe('ngOnChanges', () => {
    it('should update providerDetalsBeforUpdate when providerDetails changes', () => {
      const details = { id: '1', data: { partnerCode: 'ABC' }, trasformContentJson: null }
      const changes: SimpleChanges = {
        providerDetails: {
          currentValue: details,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      }
      component.ngOnChanges(changes)
      expect(component.providerDetalsBeforUpdate).toEqual(details)
    })

    it('should initialize transformation controls when transformation type is set', () => {
      const spy = jest.spyOn(component, 'initializTransforamtionControls')
      component.transformationType = 'trasformContentJson'
      component.ngOnChanges({
        providerDetails: {
          currentValue: { id: '1', data: {} },
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      })
      expect(spy).toHaveBeenCalled()
    })
  })

  describe('getRoutesData', () => {
    it('should set providerConfiguration from route data', () => {
      expect(component.providerConfiguration).toBeDefined()
    })
  })

  describe('initializTransforamtionControls', () => {
    it('should create form controls for each spec key', () => {
      component.initializTransforamtionControls()
      expect(component.transFormContentKeysAndControls.length).toBeGreaterThan(0)
    })

    it('should add required validator for required keys', () => {
      component.initializTransforamtionControls()
      const courseNameControl = component.transforamtionForm.get('CourseName')
      expect(courseNameControl).toBeDefined()
    })
  })

  describe('onFileInputChange', () => {
    it('should call onDropHandler when files are present', () => {
      const spy = jest.spyOn(component, 'onDropHandler')
      const mockFile = new File([''], 'test.csv', { type: 'text/csv' })
      const event = { target: { files: [mockFile], value: '' } }
      component.onFileInputChange(event)
      expect(spy).toHaveBeenCalledWith(mockFile)
    })

    it('should not call onDropHandler when no files', () => {
      const spy = jest.spyOn(component, 'onDropHandler')
      component.onFileInputChange({ target: { files: [], value: '' } })
      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('onDropHandler', () => {
    it('should return early if file is falsy', () => {
      component.onDropHandler(null as any)
      expect(component.contentFileUploaded).toBe(false)
    })

    it('should show error for unsupported file type', () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' })
      component.onDropHandler(file)
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
      expect(component.contentFileUploaded).toBe(false)
    })

    it('should show error for file too large', () => {
      const largeFile = { name: 'big.csv', size: 200 * 1024 * 1024, type: 'text/csv' } as File
      component.onDropHandler(largeFile)
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })

    it('should set contentFileUploaded for valid CSV file', () => {
      const file = new File(['col1,col2\nval1,val2'], 'test.csv', { type: 'text/csv' })
      component.onDropHandler(file)
      expect(component.contentFileUploaded).toBe(true)
      expect(component.fileName).toBe('test.csv')
    })

    it('should set contentFileUploaded for valid XLSX file', () => {
      const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      component.onDropHandler(file)
      expect(component.contentFileUploaded).toBe(true)
    })
  })

  describe('getHeaderArray', () => {
    it('should return cleaned header array from csv records', () => {
      const records = ['"Col1","Col2","Col3"', 'val1,val2,val3']
      const headers = component.getHeaderArray(records)
      expect(headers).toEqual(['Col1', 'Col2', 'Col3'])
    })
  })

  describe('onSelectChange', () => {
    it('should filter available headers based on selected values', () => {
      component.uploadedFileHeadersList = ['Col1', 'Col2', 'Col3']
      component.transforamtionForm.addControl('ctrl1', new (require('@angular/forms').FormControl)('Col1'))
      component.onSelectChange()
      expect(component.availableHeadrsList).toEqual(['Col2', 'Col3'])
    })
  })

  describe('upDateTransforamtionDetails', () => {
    beforeEach(() => {
      component.providerDetalsBeforUpdate = { id: '1', data: {} }
      component.initializTransforamtionControls()
    })

    it('should show error when form is invalid', () => {
      component.transforamtionForm.setErrors({ required: true })
      component.upDateTransforamtionDetails()
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })

    it('should call updateProvider when form is valid', () => {
      mockMarketPlaceSvc.updateProvider.mockReturnValue(of({ result: 'ok' }))
      // Make form valid by filling required controls
      Object.keys(component.transforamtionForm.controls).forEach(key => {
        component.transforamtionForm.get(key)?.setValue('value')
      })
      component.upDateTransforamtionDetails()
      expect(mockMarketPlaceSvc.updateProvider).toHaveBeenCalled()
    })

    it('should show error message when updateProvider fails', () => {
      const error = { error: { params: { errMsg: 'Update failed' } } }
      mockMarketPlaceSvc.updateProvider.mockReturnValue(throwError(() => error))
      Object.keys(component.transforamtionForm.controls).forEach(key => {
        component.transforamtionForm.get(key)?.setValue('value')
      })
      component.upDateTransforamtionDetails()
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })
  })

  describe('sendProviderDetailsUpdateEvent', () => {
    it('should emit loadProviderDetails and set transformationsUpdated', () => {
      component.loadProviderDetails.emit = jest.fn()
      component.sendProviderDetailsUpdateEvent()
      expect(component.transformationsUpdated).toBe(true)
      expect(component.loadProviderDetails.emit).toHaveBeenCalledWith(true)
    })
  })

  describe('removeFile', () => {
    it('should reset file-related state', () => {
      component.contentFileUploaded = true
      component.transformationsUpdated = true
      component.contentFile = {} as File
      component.availableHeadrsList = ['Col1']
      component.removeFile()
      expect(component.contentFileUploaded).toBe(false)
      expect(component.transformationsUpdated).toBe(false)
      expect(component.contentFile).toBeUndefined()
      expect(component.availableHeadrsList).toEqual([])
    })
  })

  describe('getUploadHeader', () => {
    it('should return "Upload Bulk Courses" for bulkUploadCourses type', () => {
      component.transformationType = 'bulkUploadCourses'
      expect(component.getUploadHeader).toBe('Upload Bulk Courses')
    })
  })

  describe('getUpdateBtnText', () => {
    it('should return "Update Transform Content" when transformation already exists', () => {
      component.transformationType = 'trasformContentJson'
      component.providerDetalsBeforUpdate = { trasformContentJson: [{}] }
      expect(component.getUpdateBtnText).toBe('Update Transform Content')
    })

    it('should return "Save Transform Content" when no transformation exists', () => {
      component.transformationType = 'trasformContentJson'
      component.providerDetalsBeforUpdate = {}
      expect(component.getUpdateBtnText).toBe('Save Transform Content')
    })
  })

  describe('uploadFile', () => {
    it('should show error when no file selected', () => {
      component.contentFile = undefined
      component.uploadFile()
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })

    it('should show message when file uploaded but transformations not updated', () => {
      component.contentFile = new File([''], 'test.csv')
      component.transformationsUpdated = false
      component.transformationType = 'trasformContentJson'
      component.providerDetalsBeforUpdate = {}
      component.uploadFile()
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })
  })

  describe('uploadContent', () => {
    it('should call marketPlaceSvc.uploadContent and show success', () => {
      jest.useFakeTimers()
      mockMarketPlaceSvc.uploadContent.mockReturnValue(of({ result: 'ok' }))
      component.dialogRef = { close: jest.fn() }
      component.providerDetails = { id: 'pid' }
      const formData = new FormData()
      component.uploadContent(formData, 'ABC')
      jest.runAllTimers()
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
      jest.useRealTimers()
    })

    it('should handle error from uploadContent', () => {
      const error = { error: { params: { errmsg: 'Upload failed' } } }
      mockMarketPlaceSvc.uploadContent.mockReturnValue(throwError(() => error))
      component.providerDetails = { id: 'pid' }
      const formData = new FormData()
      component.uploadContent(formData, 'ABC')
      expect(component.executed).toBe(false)
    })
  })

  describe('showSnackBar', () => {
    it('should call snackBar.openFromComponent', () => {
      component.showSnackBar('Test message', 'success')
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })
  })

  describe('downloadSampleFile', () => {
    it('should call marketPlaceSvc.downloadAssetFile', () => {
      component.configurationData = { bulkUploadCourse: { sampleFileDownloadLink: 'http://link.com' } }
      component.downloadSampleFile()
      expect(mockMarketPlaceSvc.downloadAssetFile).toHaveBeenCalled()
    })
  })
})

