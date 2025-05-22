import { ProviderDetailsComponent } from './provider-details.component'
import { FormBuilder, FormArray, FormControl } from '@angular/forms'
import { Router } from '@angular/router'
import { MarketplaceService } from '../../services/marketplace.service'
import { MatSnackBar } from '@angular/material/snack-bar'
import { DatePipe } from '@angular/common'
import { LoaderService } from '../../../../services/loader.service'
import { of, throwError } from 'rxjs'
import { HttpErrorResponse } from '@angular/common/http'
import { SimpleChanges } from '@angular/core'

// Mock lodash
jest.mock('lodash', () => ({
  get: jest.fn(),
}))

describe('ProviderDetailsComponent', () => {
  let component: ProviderDetailsComponent
  let mockFormBuilder: jest.Mocked<FormBuilder>
  let mockRouter: jest.Mocked<Router>
  let mockMarketplaceService: jest.Mocked<MarketplaceService>
  let mockSnackBar: jest.Mocked<MatSnackBar>
  let mockDatePipe: jest.Mocked<DatePipe>
  let mockLoaderService: jest.Mocked<LoaderService>

  beforeEach(() => {
    // Mock FormBuilder
    mockFormBuilder = {
      group: jest.fn(),
      array: jest.fn(),
    } as any

    // Mock Router
    mockRouter = {
      navigate: jest.fn(),
      navigateByUrl: jest.fn(),
    } as any

    // Mock MarketplaceService
    mockMarketplaceService = {
      uploadThumbNail: jest.fn(),
      uploadCIOSContract: jest.fn(),
      createProvider: jest.fn(),
      updateProvider: jest.fn(),
    } as any

    // Mock MatSnackBar
    mockSnackBar = {
      open: jest.fn(),
    } as any

    // Mock DatePipe
    mockDatePipe = {
      transform: jest.fn(),
    } as any

    // Mock LoaderService
    mockLoaderService = {
      changeLoad: {
        next: jest.fn(),
      },
    } as any

    // Mock FormGroup and FormArray
    const mockFormGroup = {
      patchValue: jest.fn(),
      get: jest.fn(),
      controls: {
        partnerCode: {
          disable: jest.fn(),
        },
      },
      get valid() { return this._valid },
      set valid(value) { this._valid = value },
      _valid: true,
      value: {
        contentPartnerName: 'Test Provider',
        partnerCode: 'TEST01',
        websiteUrl: 'https://test.com',
        description: 'Test description',
        providerTips: ['tip1', 'tip2'],
      },
    }

    const mockFormArray = {
      clear: jest.fn(),
      push: jest.fn(),
      removeAt: jest.fn(),
    }

    mockFormBuilder.group.mockReturnValue(mockFormGroup as any)
    mockFormBuilder.array.mockReturnValue(mockFormArray as any)

    component = new ProviderDetailsComponent(
      mockFormBuilder,
      mockRouter,
      mockMarketplaceService,
      mockSnackBar,
      mockDatePipe,
      mockLoaderService
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Constructor and Initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy()
    })

    it('should initialize form group with correct structure', () => {
      expect(mockFormBuilder.group).toHaveBeenCalledWith({
        contentPartnerName: expect.any(FormControl),
        partnerCode: expect.any(FormControl),
        websiteUrl: expect.any(FormControl),
        description: expect.any(FormControl),
        providerTips: expect.any(FormArray),
      })
    })

    it('should set helpCenterGuide properties', () => {
      expect(component.helpCenterGuide.header).toBe('Provider Details: Video Guides and Tips')
      expect(component.helpCenterGuide.guideNotes).toHaveLength(2)
      expect(component.helpCenterGuide.helpVideoLink).toContain('CIOS_Updated_demo.mp4')
    })

    it('should initialize file upload properties', () => {
      expect(component.FILE_UPLOAD_MAX_SIZE).toBe(100 * 1024 * 1024)
      expect(component.logoTouched).toBe(false)
      expect(component.pdfUploaded).toBe(false)
    })
  })

  describe('ngOnChanges', () => {
    it('should patch provider details when providerDetails changes', () => {
      const mockProviderDetails = {
        currentValue: {
          data: {
            contentPartnerName: 'Test Provider',
            partnerCode: 'TEST01',
            websiteUrl: 'https://test.com',
            description: 'Test description',
            link: 'https://test.com/logo.png',
            documentUrl: 'https://test.com/doc.pdf',
            documentUploadedDate: '01/01/2024',
            providerTips: ['tip1', 'tip2'],
          },
        },
      }

      const changes: SimpleChanges = {
        // providerDetails: mockProviderDetails,
      }

      const lodashGet = require('lodash').get
      lodashGet.mockImplementation((obj: any, path: string, defaultValue?: any) => {
        const keys = path.split('.')
        let result = obj
        for (const key of keys) {
          result = result?.[key]
        }
        return result !== undefined ? result : defaultValue
      })

      jest.spyOn(component, 'patchProviderDetails')

      component.ngOnChanges(changes)

      expect(component.patchProviderDetails).toHaveBeenCalledWith(mockProviderDetails.currentValue)
      expect(component.providerDetalsBeforUpdate).toEqual(mockProviderDetails.currentValue)
    })
  })

  describe('patchProviderDetails', () => {
    it('should patch form values correctly', () => {
      const mockProviderDetails = {
        data: {
          contentPartnerName: 'Test Provider',
          partnerCode: 'TEST01',
          websiteUrl: 'https://test.com',
          description: 'Test description',
          link: 'https://test.com/logo.png',
          providerTips: ['tip1', 'tip2'],
        },
      }

      const lodashGet = require('lodash').get
      lodashGet.mockImplementation((obj: any, path: string, defaultValue?: any) => {
        const keys = path.split('.')
        let result = obj
        for (const key of keys) {
          result = result?.[key]
        }
        return result !== undefined ? result : defaultValue
      })

      const mockFormArray = {
        clear: jest.fn(),
        push: jest.fn(),
      }

      jest.spyOn(component, 'getTipsList', 'get').mockReturnValue(mockFormArray as any)
      jest.spyOn(component, 'addTips')

      component.patchProviderDetails(mockProviderDetails)

      expect(component.providerFormGroup.patchValue).toHaveBeenCalledWith({
        contentPartnerName: 'Test Provider',
        partnerCode: 'TEST01',
        websiteUrl: 'https://test.com',
        description: 'Test description',
      })

      expect(component.providerFormGroup.controls.partnerCode.disable).toHaveBeenCalled()
      expect(mockFormArray.clear).toHaveBeenCalled()
      expect(component.addTips).toHaveBeenCalledTimes(2)
      expect(component.imageUrl).toBe('https://test.com/logo.png')
    })
  })

  describe('getFileName', () => {
    it('should extract filename from URL with prefix', () => {
      component.uploadedPdfUrl = 'https://test.com/prefix_actualfile.pdf'
      const result = component.getFileName
      expect(result).toBe('actualfile.pdf')
    })

    it('should return filename without prefix if no underscore', () => {
      component.uploadedPdfUrl = 'https://test.com/actualfile.pdf'
      const result = component.getFileName
      expect(result).toBe('actualfile.pdf')
    })

    it('should return empty string if no filename', () => {
      component.uploadedPdfUrl = 'https://test.com/'
      const result = component.getFileName
      expect(result).toBe('')
    })
  })

  describe('getControlValidation', () => {
    it('should return true if control has specified error', () => {
      const mockControl = {
        errors: { required: true },
      }

      component.providerFormGroup.get = jest.fn().mockReturnValue(mockControl)

      const result = component.getControlValidation('contentPartnerName', 'required')
      expect(result).toBe(true)
    })

    it('should return false if control has no errors', () => {
      const mockControl = {
        errors: null,
      }

      component.providerFormGroup.get = jest.fn().mockReturnValue(mockControl)

      const result = component.getControlValidation('contentPartnerName', 'required')
      expect(result).toBe(false)
    })

    it('should return false if control does not exist', () => {
      component.providerFormGroup.get = jest.fn().mockReturnValue(null)

      const result = component.getControlValidation('nonexistent', 'required')
      expect(result).toBe(false)
    })
  })

  describe('Tips Management', () => {
    let mockFormArray: any

    beforeEach(() => {
      mockFormArray = {
        push: jest.fn(),
        removeAt: jest.fn(),
      }
      component.providerFormGroup.get = jest.fn().mockReturnValue(mockFormArray)
    })

    it('should add tips with message', () => {
      component.addTips('test tip')
      expect(mockFormArray.push).toHaveBeenCalledWith(expect.any(FormControl))
    })

    it('should add tips without message', () => {
      component.addTips()
      expect(mockFormArray.push).toHaveBeenCalledWith(expect.any(FormControl))
    })

    it('should remove tip at specific index', () => {
      component.removeTipAtIndex(1)
      expect(mockFormArray.removeAt).toHaveBeenCalledWith(1)
    })
  })

  describe('getTextLength', () => {
    it('should return length of control value', () => {
      const lodashGet = require('lodash').get
      lodashGet.mockReturnValue(10)

      const result = component.getTextLength('contentPartnerName')
      expect(result).toBe(10)
    })

    it('should return 0 if no value', () => {
      const lodashGet = require('lodash').get
      lodashGet.mockReturnValue(0)

      const result = component.getTextLength('contentPartnerName')
      expect(result).toBe(0)
    })
  })

  describe('onThumbNailSelected', () => {
    it('should process valid PNG file', () => {
      const mockFile = {
        name: 'test.png',
        size: 500000, // 500KB
      }

      // Mock FileReader
      const mockFileReader = {
        onload: jest.fn(),
        readAsDataURL: jest.fn(),
        result: 'data:image/png;base64,test',
      }

      global.FileReader = jest.fn(() => mockFileReader) as any

      jest.spyOn(component, 'showSnackBar')

      component.onThumbNailSelected(mockFile)

      expect(component.logoTouched).toBe(true)
      expect(component.thumbnailFile).toBe(mockFile)
      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(mockFile)
    })

    it('should show error for invalid file type', () => {
      const mockFile = {
        name: 'test.jpg',
        size: 500000,
      }

      jest.spyOn(component, 'showSnackBar')

      component.onThumbNailSelected(mockFile)

      expect(component.showSnackBar).toHaveBeenCalledWith('Please upload svg or png image')
    })

    it('should show error for file size too small', () => {
      const mockFile = {
        name: 'test.png',
        size: 200000, // 200KB
      }

      jest.spyOn(component, 'showSnackBar')

      component.onThumbNailSelected(mockFile)

      expect(component.showSnackBar).toHaveBeenCalledWith('Please upload image sized between 300 KB and 2 MB')
    })

    it('should show error for file size too large', () => {
      const mockFile = {
        name: 'test.png',
        size: 3000000, // 3MB
      }

      jest.spyOn(component, 'showSnackBar')

      component.onThumbNailSelected(mockFile)

      expect(component.showSnackBar).toHaveBeenCalledWith('Please upload image sized between 300 KB and 2 MB')
    })
  })

  describe('cropImage', () => {
    it('should crop image to 16:9 aspect ratio', () => {
      const mockImage = {
        width: 1920,
        height: 1080,
      } as HTMLImageElement

      const mockCanvas = {
        nativeElement: {
          width: 0,
          height: 0,
          getContext: jest.fn().mockReturnValue({
            drawImage: jest.fn(),
          }),
          toBlob: jest.fn((callback) => {
            callback(new Blob(['test'], { type: 'image/png' }))
          }),
          toDataURL: jest.fn().mockReturnValue('data:image/png;base64,test'),
        },
      }

      component.canvas = mockCanvas as any
      component.thumbnailFile = { name: 'test.png' } as File

      component.cropImage(mockImage)

      expect(mockCanvas.nativeElement.width).toBe(1920)
      expect(mockCanvas.nativeElement.height).toBe(1080)
      expect(component.imageUrl).toBe('data:image/png;base64,test')
    })
  })

  describe('onDrop', () => {
    it('should accept valid PDF file', () => {
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      Object.defineProperty(mockFile, 'size', { value: 50 * 1024 * 1024 }) // 50MB

      mockDatePipe.transform.mockReturnValue('22/05/2025')

      component.onDrop(mockFile)

      expect(component.pdfFile).toBe(mockFile)
      expect(component.pdfUploaded).toBe(true)
      expect(component.fileName).toBe('test.pdf')
      expect(component.fileUploadedDate).toBe('22/05/2025')
    })

    it('should reject non-PDF file', () => {
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' })

      jest.spyOn(component, 'showSnackBar')

      component.onDrop(mockFile)

      expect(component.showSnackBar).toHaveBeenCalledWith('Please upload PDF file')
    })

    it('should reject file larger than 100MB', () => {
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      Object.defineProperty(mockFile, 'size', { value: 150 * 1024 * 1024 }) // 150MB

      jest.spyOn(component, 'showSnackBar')

      component.onDrop(mockFile)

      expect(component.showSnackBar).toHaveBeenCalledWith('file size should not be more than 100 MB')
    })
  })

  describe('removePdf', () => {
    it('should reset PDF related properties', () => {
      component.pdfFile = new File(['test'], 'test.pdf')
      component.pdfUploaded = true
      component.fileName = 'test.pdf'
      component.uploadedPdfUrl = 'https://test.com/test.pdf'

      component.removePdf()

      expect(component.pdfFile).toBeNull()
      expect(component.pdfUploaded).toBe(false)
      expect(component.fileName).toBe('')
      expect(component.uploadedPdfUrl).toBe('')
    })
  })

  describe('submit', () => {
    it('should call createContentsToUpload if form is valid and imageUrl exists', () => {
      (component.providerFormGroup as any)._valid = true
      component.imageUrl = 'https://test.com/image.png'

      jest.spyOn(component, 'createContentsToUpload')

      component.submit()

      expect(component.logoTouched).toBe(true)
      expect(component.createContentsToUpload).toHaveBeenCalled()
    })

    it('should not call createContentsToUpload if form is invalid', () => {
      (component.providerFormGroup as any)._valid = false
      component.imageUrl = 'https://test.com/image.png'

      jest.spyOn(component, 'createContentsToUpload')

      component.submit()

      expect(component.createContentsToUpload).not.toHaveBeenCalled()
    })
  })

  describe('saveProviderDetails', () => {
    beforeEach(() => {
      (component.providerFormGroup as any)._valid = true
      component.imageUrl = 'https://test.com/image.png'
      component.thumbNailUrl = 'https://test.com/thumb.png'
    })

    it('should create provider successfully', () => {
      const mockResponse = {
        result: { id: '123' },
      }

      mockMarketplaceService.createProvider.mockReturnValue(of(mockResponse))
      jest.spyOn(component, 'showSnackBar')

      component.saveProviderDetails()

      expect(mockMarketplaceService.createProvider).toHaveBeenCalled()
      expect(mockLoaderService.changeLoad.next).toHaveBeenCalledWith(false)
    })

    it('should handle error response', () => {
      const mockError = new HttpErrorResponse({
        error: { params: { errMsg: 'Test error' } },
      })

      mockMarketplaceService.createProvider.mockReturnValue(throwError(mockError))
      jest.spyOn(component, 'showSnackBar')

      component.saveProviderDetails()

      expect(component.showSnackBar).toHaveBeenCalledWith('Test error')
      expect(mockLoaderService.changeLoad.next).toHaveBeenCalledWith(false)
    })

    it('should handle validation error for website URL', () => {
      const mockError = new HttpErrorResponse({
        error: { params: { errMsg: 'Validation error(s): \n$.websiteUrl: invalid URL' } },
      })

      mockMarketplaceService.createProvider.mockReturnValue(throwError(mockError))
      jest.spyOn(component, 'showSnackBar')

      component.saveProviderDetails()

      expect(component.showSnackBar).toHaveBeenCalledWith('Please provide a valid URL for the website')
    })

    it('should show error if form is invalid', () => {
      (component.providerFormGroup as any)._valid = false
      jest.spyOn(component, 'showSnackBar')

      component.saveProviderDetails()

      expect(component.showSnackBar).toHaveBeenCalledWith('Please fill all the mandator fields with proper data')
    })
  })

  describe('upDateProviderDetails', () => {
    beforeEach(() => {
      (component.providerFormGroup as any)._valid = true
      component.imageUrl = 'https://test.com/image.png'
      component.providerDetalsBeforUpdate = { data: {} }
    })

    it('should update provider successfully', () => {
      const mockResponse = { success: true }

      mockMarketplaceService.updateProvider.mockReturnValue(of(mockResponse))
      jest.spyOn(component, 'showSnackBar')
      jest.spyOn(component, 'sendDetailsUpdateEvent')

      component.upDateProviderDetails()

      expect(mockMarketplaceService.updateProvider).toHaveBeenCalled()
      expect(mockLoaderService.changeLoad.next).toHaveBeenCalledWith(false)
    })

    it('should handle error response', () => {
      const mockError = new HttpErrorResponse({
        error: { params: { errMsg: 'Update failed' } },
      })

      mockMarketplaceService.updateProvider.mockReturnValue(throwError(mockError))
      jest.spyOn(component, 'showSnackBar')

      component.upDateProviderDetails()

      expect(component.showSnackBar).toHaveBeenCalledWith('Update failed')
    })
  })

  describe('Navigation Methods', () => {
    it('should navigate to providers dashboard', () => {
      component.navigateToProvidersDashboard()
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app/home/marketplace-providers')
    })

    it('should emit details update event', () => {
      jest.spyOn(component.loadProviderDetails, 'emit')

      component.sendDetailsUpdateEvent()

      expect(component.loadProviderDetails.emit).toHaveBeenCalledWith(true)
    })
  })

  describe('showSnackBar', () => {
    it('should open snack bar with message', () => {
      const message = 'Test message'

      component.showSnackBar(message)

      expect(mockSnackBar.open).toHaveBeenCalledWith(message)
    })
  })

  describe('createContentsToUpload', () => {
    it('should handle file uploads successfully', () => {
      component.thumbnailFile = new File(['test'], 'thumb.png')
      component.pdfFile = new File(['test'], 'doc.pdf')

      const mockThumbnailResponse = {
        result: { url: 'https://storage.googleapis.com/igot/bucket/thumb.png' },
      }
      const mockPdfResponse = {
        result: { url: 'https://storage.googleapis.com/igot/bucket/doc.pdf' },
      }

      mockMarketplaceService.uploadThumbNail.mockReturnValue(of(mockThumbnailResponse))
      mockMarketplaceService.uploadCIOSContract.mockReturnValue(of(mockPdfResponse))

      jest.spyOn(component, 'saveProviderDetails');

      // Mock environment
      (global as any).environment = {
        karmYogiPath: 'https://api.test.com',
      }

      component.createContentsToUpload()

      expect(mockLoaderService.changeLoad.next).toHaveBeenCalledWith(true)
      expect(mockMarketplaceService.uploadThumbNail).toHaveBeenCalled()
      expect(mockMarketplaceService.uploadCIOSContract).toHaveBeenCalled()
    })

    it('should handle upload error', () => {
      component.thumbnailFile = new File(['test'], 'thumb.png')

      const mockError = new HttpErrorResponse({
        error: { params: { errMsg: 'Upload failed' } },
      })

      mockMarketplaceService.uploadThumbNail.mockReturnValue(throwError(mockError))
      jest.spyOn(component, 'showSnackBar')

      component.createContentsToUpload()

      expect(component.showSnackBar).toHaveBeenCalledWith('Upload failed')
      expect(mockLoaderService.changeLoad.next).toHaveBeenCalledWith(false)
    })

    it('should call upDateProviderDetails when no files to upload and provider exists', () => {
      component.thumbnailFile = null
      component.pdfFile = null
      component.providerDetails = { id: '123' }

      jest.spyOn(component, 'upDateProviderDetails')

      component.createContentsToUpload()

      expect(component.upDateProviderDetails).toHaveBeenCalled()
    })
  })
})