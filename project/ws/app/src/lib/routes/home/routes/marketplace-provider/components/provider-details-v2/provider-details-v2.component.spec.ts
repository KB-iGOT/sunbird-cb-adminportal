import { FormBuilder } from '@angular/forms'
import { of, throwError } from 'rxjs'
import { ProviderDetailsV2Component } from './provider-details-v2.component'

const mockSnackBar = { openFromComponent: jest.fn() }
const mockDatePipe = { transform: jest.fn().mockReturnValue('01 Jan 2024') }
const mockRouter = { navigate: jest.fn(), navigateByUrl: jest.fn() }
const mockLoaderService = { setLoaderState: jest.fn() }
const mockExternalsvc = { breadcrumnItems: { next: jest.fn() } }
const mockActivatedRoute = {
  snapshot: { queryParams: { status: '' } }
}
const mockDialog = {
  open: jest.fn().mockReturnValue({ afterClosed: () => of(true) })
}

const mockMarketplaceSvc = {
  createProvider: jest.fn(),
  updateProvider: jest.fn(),
  uploadThumbNail: jest.fn(),
  uploadCIOSContract: jest.fn(),
  convertResourceUrl: jest.fn().mockReturnValue('http://logo.url'),
  newProviderAdded: { next: jest.fn() },
}

function createComponent() {
  const fb = new FormBuilder()
  return new ProviderDetailsV2Component(
    fb,
    mockSnackBar as any,
    mockDatePipe as any,
    mockMarketplaceSvc as any,
    mockRouter as any,
    mockLoaderService as any,
    mockExternalsvc as any,
    mockActivatedRoute as any,
    mockDialog as any,
  )
}

describe('ProviderDetailsV2Component', () => {
  let component: ProviderDetailsV2Component

  beforeEach(() => {
    jest.clearAllMocks()
    component = createComponent()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('should set isPendingProvider from query params', () => {
      (mockActivatedRoute.snapshot.queryParams as any).status = 'PENDING'
      component.ngOnInit()
      expect(component.isPendingProvider).toBe(true)
    })

    it('should set isPendingProvider to false when status is not PENDING', () => {
      (mockActivatedRoute.snapshot.queryParams as any).status = ''
      component.ngOnInit()
      expect(component.isPendingProvider).toBe(false)
    })
  })

  describe('ngOnDestroy', () => {
    it('should set isActive to false', () => {
      component.ngOnDestroy()
      expect(component.isActive).toBe(false)
    })
  })

  describe('ngOnChanges', () => {
    it('should patch provider details and breadcrumbs when providerDetails changes', () => {
      const details = {
        data: {
          id: '123', contentPartnerName: 'Test Provider', partnerCode: 'TP',
          websiteUrl: 'https://test.com', description: 'A test provider',
          providerTips: ['Tip1'], link: 'http://logo',
          contactName: '', email: '', phone: '',
          documentUrl: '', documentUploadedDate: ''
        }
      }
      mockMarketplaceSvc.convertResourceUrl.mockReturnValue('http://logo.url')
      component.ngOnChanges({
        providerDetails: {
          currentValue: details,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      })
      expect(mockExternalsvc.breadcrumnItems.next).toHaveBeenCalled()
      expect(component.providerDetailsBeforeUpdate).toBeDefined()
    })

    it('should not patch if providerDetails not in changes', () => {
      const spy = jest.spyOn(component, 'patchProviderDetails')
      component.ngOnChanges({})
      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('initializeForm', () => {
    it('should create form with required controls', () => {
      expect(component.providerDetailsForm).toBeDefined()
      expect(component.controls['contentPartnerName']).toBeDefined()
      expect(component.controls['websiteUrl']).toBeDefined()
    })
  })

  describe('controls getter', () => {
    it('should return form controls', () => {
      expect(component.controls).toBe(component.providerDetailsForm.controls)
    })
  })

  describe('getTipsList getter', () => {
    it('should return providerTips FormArray', () => {
      expect(component.getTipsList).toBeDefined()
    })
  })

  describe('disableAddTips getter', () => {
    it('should return true when isPendingProvider', () => {
      component.isPendingProvider = true
      expect(component.disableAddTips).toBe(true)
    })

    it('should return true when max tips reached', () => {
      component.isPendingProvider = false
      for (let i = 0; i < 10; i++) {
        component.addTips('tip')
      }
      expect(component.disableAddTips).toBe(true)
    })
  })

  describe('addTips', () => {
    it('should add a tip to the FormArray', () => {
      component.addTips('Tip text')
      expect(component.getTipsList.length).toBe(1)
    })
  })

  describe('removeTipAtIndex', () => {
    it('should remove tip at given index', () => {
      component.addTips('Tip 1')
      component.addTips('Tip 2')
      component.removeTipAtIndex(0)
      expect(component.getTipsList.length).toBe(1)
    })
  })

  describe('getControlValidation', () => {
    it('should return true when control has specific error', () => {
      component.controls['contentPartnerName'].setValue('')
      component.controls['contentPartnerName'].markAsTouched()
      const result = component.getControlValidation('contentPartnerName', 'required')
      expect(result).toBe(true)
    })
  })

  describe('getTextLength', () => {
    it('should return text length of control value', () => {
      component.controls['description'].setValue('hello')
      expect(component.getTextLength('description')).toBe(5)
    })

    it('should return 0 if control has no value', () => {
      expect(component.getTextLength('description')).toBe(0)
    })
  })

  describe('getFileName getter', () => {
    it('should extract filename from URL', () => {
      component.uploadedPdfUrl = 'http://host/path/abc_filename.pdf'
      expect(component.getFileName).toBe('filename.pdf')
    })
    it('should return filename without underscore prefix', () => {
      component.uploadedPdfUrl = 'http://host/path/simplefile.pdf'
      expect(component.getFileName).toBe('simplefile.pdf')
    })
  })

  describe('removeLogo', () => {
    it('should clear logo state', () => {
      component.logoFile = new File([], 'logo.png')
      component.logoPreviewUrl = 'data:image/png;base64,'
      component.removeLogo()
      expect(component.logoFile).toBeNull()
      expect(component.logoPreviewUrl).toBeNull()
    })
  })

  describe('onDrop', () => {
    it('should return early if file is falsy', () => {
      component.onDrop(null as any)
      expect(component.pdfUploaded).toBe(false)
    })

    it('should show error for non-PDF file', () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' })
      component.onDrop(file)
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })

    it('should show error for oversized file', () => {
      const file = { name: 'big.pdf', size: 200 * 1024 * 1024 } as File
      component.onDrop(file)
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })

    it('should set pdf state for valid PDF file', () => {
      const file = new File(['content'], 'valid.pdf', { type: 'application/pdf' })
      component.onDrop(file)
      expect(component.pdfUploaded).toBe(true)
      expect(component.pdfFile).toBe(file)
    })
  })

  describe('removePdf', () => {
    it('should clear PDF state', () => {
      component.pdfUploaded = true
      component.pdfFile = {} as File
      component.removePdf()
      expect(component.pdfUploaded).toBe(false)
      expect(component.pdfFile).toBeNull()
    })
  })

  describe('submit', () => {
    it('should show error when form is invalid', () => {
      component.submit()
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })

    it('should call createContentsToUpload when form is valid and logo is set', () => {
      const spy = jest.spyOn(component, 'createContentsToUpload').mockImplementation(() => { })
      component.logoPreviewUrl = 'data:image/png;base64,'
      component.providerDetailsForm.patchValue({
        contentPartnerName: 'TestProvider',
        partnerCode: 'TP01',
        websiteUrl: 'https://test.com',
        description: 'Desc test',
        providerLogo: 'url',
      })
      component.submit()
      expect(spy).toHaveBeenCalled()
    })
  })

  describe('saveProviderDetails', () => {
    it('should call createProvider on success', () => {
      component.logoPreviewUrl = 'http://logo'
      component.providerDetailsForm.patchValue({
        contentPartnerName: 'Provider', partnerCode: 'ABC',
        websiteUrl: 'https://p.com', description: 'desc',
        providerLogo: 'http://logo', providerTips: [],
      })
      mockMarketplaceSvc.createProvider.mockReturnValue(of({ params: { status: 'success' }, result: { id: 'new-id' } }))
      component.saveProviderDetails()
      expect(mockMarketplaceSvc.createProvider).toHaveBeenCalled()
    })

    it('should show error on createProvider failure', () => {
      component.logoPreviewUrl = 'http://logo'
      component.providerDetailsForm.patchValue({
        contentPartnerName: 'Provider', partnerCode: 'ABC',
        websiteUrl: 'https://p.com', description: 'desc',
        providerLogo: 'http://logo', providerTips: [],
      })
      mockMarketplaceSvc.createProvider.mockReturnValue(throwError(() => ({ error: { params: { errMsg: 'Create failed' } } })))
      component.saveProviderDetails()
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })
  })

  describe('updateProvider', () => {
    beforeEach(() => {
      component.logoPreviewUrl = 'http://logo'
      component.providerDetailsBeforeUpdate = { data: { partnerCode: 'TP' } }
      component.providerDetailsForm.patchValue({
        contentPartnerName: 'Provider', partnerCode: 'ABC',
        websiteUrl: 'https://p.com', description: 'desc',
        providerLogo: 'http://logo', providerTips: [],
      })
    })

    it('should call marketplaceSvc.updateProvider on success', () => {
      jest.useFakeTimers()
      mockMarketplaceSvc.updateProvider.mockReturnValue(of({ result: 'ok' }))
      component.loadProviderDetails.emit = jest.fn()
      component.updateProvider()
      jest.runAllTimers()
      expect(mockMarketplaceSvc.updateProvider).toHaveBeenCalled()
      jest.useRealTimers()
    })

    it('should show error on updateProvider failure', () => {
      mockMarketplaceSvc.updateProvider.mockReturnValue(throwError(() => ({})))
      component.updateProvider()
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })
  })

  describe('sendDetailsUpdateEvent', () => {
    it('should emit loadProviderDetails', () => {
      component.loadProviderDetails.emit = jest.fn()
      component.sendDetailsUpdateEvent()
      expect(component.loadProviderDetails.emit).toHaveBeenCalledWith(true)
    })
  })

  describe('navigateToProvidersDashboard', () => {
    it('should navigate to providers dashboard', () => {
      component.navigateToProvidersDashboard()
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app/home/marketplace-providers')
    })
  })

  describe('showSnackBar', () => {
    it('should call snackBar.openFromComponent', () => {
      component.showSnackBar('Test message', 'success')
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })
  })
})

