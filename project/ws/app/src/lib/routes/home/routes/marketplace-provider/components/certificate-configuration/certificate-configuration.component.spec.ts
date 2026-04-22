import { FormBuilder } from '@angular/forms'
import { of, throwError } from 'rxjs'
import { CertificateConfigurationComponent } from './certificate-configuration.component'

const mockMarketPlaceSvc = {
  uploadThumbNail: jest.fn(),
  updateProvider: jest.fn(),
}

const mockSnackBar = { openFromComponent: jest.fn() }

const mockDialog = {
  open: jest.fn().mockReturnValue({ close: jest.fn() }),
}

const mockSanitizer = {
  bypassSecurityTrustResourceUrl: jest.fn().mockReturnValue('safe-url'),
}

function createComponent() {
  const fb = new FormBuilder()
  return new CertificateConfigurationComponent(
    mockMarketPlaceSvc as any,
    fb,
    mockSnackBar as any,
    mockDialog as any,
    mockSanitizer as any,
  )
}

describe('CertificateConfigurationComponent', () => {
  let component: CertificateConfigurationComponent

  beforeEach(() => {
    jest.clearAllMocks()
    component = createComponent()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('initializeForm', () => {
    it('should create providerForm with providerName control', () => {
      expect(component.providerForm).toBeDefined()
      expect(component.providerForm.get('providerName')).toBeDefined()
    })

    it('should populate providerName from providerDetalsBeforUpdate when available', () => {
      component.providerDetalsBeforUpdate = { data: { contentPartnerName: 'MyProvider' } }
      component.initializeForm()
      expect(component.providerForm.get('providerName')?.value).toBe('MyProvider')
    })

    it('should use empty string when providerDetalsBeforUpdate is not set', () => {
      component.providerDetalsBeforUpdate = undefined
      component.initializeForm()
      expect(component.providerForm.get('providerName')?.value).toBe('')
    })
  })

  describe('ngOnChanges', () => {
    it('should update providerDetalsBeforUpdate and re-init form on changes', () => {
      const details = {
        data: { contentPartnerName: 'TestProvider' },
        certificateTemplateUrl: '  '
      }
      component.ngOnChanges({
        providerDetails: {
          currentValue: details,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      })
      expect(component.providerDetalsBeforUpdate).toBeDefined()
      expect(component.providerForm.get('providerName')?.value).toBe('TestProvider')
    })

    it('should call setExistingCertificate when providerDetails changes with valid certificateTemplateUrl', () => {
      jest.spyOn(component, 'setExistingCertificate').mockImplementation(() => { })
      const details = {
        data: { contentPartnerName: 'P' },
        certificateTemplateUrl: 'https://storage.googleapis.com/igot/bucket/cert.svg'
      }
      component.ngOnChanges({
        providerDetails: {
          currentValue: details,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      })
      expect(component.setExistingCertificate).toHaveBeenCalled()
    })

    it('should not update when providerDetails has no currentValue', () => {
      component.ngOnChanges({
        providerDetails: {
          currentValue: null,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      })
      expect(component.providerDetalsBeforUpdate).toBeUndefined()
    })
  })

  describe('setExistingCertificate', () => {
    it('should set certificateUploaded=false when certificateTemplateUrl is blank', () => {
      component.providerDetalsBeforUpdate = { certificateTemplateUrl: '   ', data: {} }
      component.setExistingCertificate()
      expect(component.certificateUploaded).toBe(false)
    })

    it('should set certificateUploaded=true and use sanitizer when url is valid', () => {
      global.fetch = jest.fn().mockResolvedValue({
        blob: () => Promise.resolve(new Blob(['<svg/>'], { type: 'image/svg+xml' }))
      }) as any
      component.providerDetalsBeforUpdate = {
        certificateTemplateUrl: 'https://storage.googleapis.com/igot/bucket/abc_cert.svg',
        data: {}
      }
      component.setExistingCertificate()
      expect(component.certificateUploaded).toBe(true)
      expect(mockSanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalled()
    })
  })

  describe('updateBaseOfUrl', () => {
    it('should replace origin with sitePath', () => {
      const url = 'https://original.host.com/path/to/file.svg'
      const result = component.updateBaseOfUrl(url)
      expect(result).toContain('/path/to/file.svg')
    })
  })

  describe('generatePublicUrl', () => {
    it('should transform Google Storage URL to karma yogi path', () => {
      const googleUrl = 'https://storage.googleapis.com/igot/bucket/path/to/file.svg'
      const result = component.generatePublicUrl(googleUrl)
      expect(result).toContain('content-store')
    })

    it('should return url unchanged if not a google storage URL', () => {
      const url = 'https://other.example.com/file.svg'
      const result = component.generatePublicUrl(url)
      expect(result).toBe(url)
    })
  })

  describe('getImageName', () => {
    it('should return filename after underscore', () => {
      const url = 'https://host/path/abc_filename.svg'
      expect(component.getImageName(url)).toBe('filename.svg')
    })

    it('should return full filename when no underscore', () => {
      const url = 'https://host/path/filename.svg'
      expect(component.getImageName(url)).toBe('filename.svg')
    })

    it('should return url unchanged for falsy input', () => {
      expect(component.getImageName('')).toBe('')
    })
  })

  describe('onDropLogo', () => {
    it('should handle File object directly', () => {
      const file = new File(['<svg/>'], 'logo.svg', { type: 'image/svg+xml' })
      const spyHandleUpload = jest.spyOn(component as any, 'handleFileUpload').mockImplementation(() => { })
      component.onDropLogo(file)
      expect(spyHandleUpload).toHaveBeenCalledWith(file, 'logo')
    })

    it('should handle event with files array', () => {
      const file = new File(['<svg/>'], 'logo.svg', { type: 'image/svg+xml' })
      const spyHandleUpload = jest.spyOn(component as any, 'handleFileUpload').mockImplementation(() => { })
      component.onDropLogo({ files: [file] })
      expect(spyHandleUpload).toHaveBeenCalledWith(file, 'logo')
    })

    it('should not call handleFileUpload when no file in event', () => {
      const spyHandleUpload = jest.spyOn(component as any, 'handleFileUpload').mockImplementation(() => { })
      component.onDropLogo({ files: [] })
      expect(spyHandleUpload).not.toHaveBeenCalled()
    })
  })

  describe('onDropCertificate', () => {
    it('should show error for non-SVG file', () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' })
      component.onDropCertificate(file)
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
      expect(component.certificateUploaded).toBe(false)
    })

    it('should show error for oversized SVG file', () => {
      const file = { name: 'test.svg', size: 200 * 1024 * 1024 } as File
      component.onDropCertificate(file)
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })

    it('should set certificateUploaded for valid SVG', () => {
      URL.createObjectURL = jest.fn().mockReturnValue('blob:url')
      const file = new File(['<svg></svg>'], 'cert.svg', { type: 'image/svg+xml' })
      component.onDropCertificate(file)
      expect(component.certificateUploaded).toBe(true)
      expect(component.contentFile).toBe(file)
    })

    it('should call mergeLogo if logo already uploaded when valid SVG dropped', () => {
      URL.createObjectURL = jest.fn().mockReturnValue('blob:url')
      component.logoUploaded = true
      component.selectedLogoImage = 'data:image/svg+xml;base64,PHN2Zy8+'
      const spyMergeLogo = jest.spyOn(component as any, 'mergeLogo').mockImplementation(() => { })
      const file = new File(['<svg></svg>'], 'cert.svg', { type: 'image/svg+xml' })
      component.onDropCertificate(file)
      expect(spyMergeLogo).toHaveBeenCalled()
    })
  })

  describe('handleFileUpload (via onDropLogo)', () => {
    it('should show error for invalid file type', () => {
      const file = new File(['data'], 'logo.png', { type: 'image/png' })
      component.onDropLogo(file)
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })

    it('should show error for file exceeding size limit', () => {
      const file = { name: 'logo.svg', size: 2 * 1024 * 1024 * 1024, type: 'image/svg+xml' } as File
      component.onDropLogo(file)
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })

    it('should read valid SVG logo and set logo state', () => {
      const mockReadAsDataURL = jest.fn()
      const mockFileReader = {
        onload: null as any,
        readAsDataURL: mockReadAsDataURL,
        result: 'data:image/svg+xml;base64,test',
      }
      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as any)

      const file = new File(['<svg/>'], 'logo.svg', { type: 'image/svg+xml' })
      component.onDropLogo(file)

      // Trigger the onload callback
      mockFileReader.onload({ target: { result: 'data:image/svg+xml;base64,test' } })

      expect(component.logoUploaded).toBe(true)
      expect(component.logoFileName).toBe('logo.svg')
      expect(component.selectedLogoImage).toBe('data:image/svg+xml;base64,test')
    })

    it('should call mergeLogo when certificate is already uploaded during logo upload', () => {
      const spyMergeLogo = jest.spyOn(component as any, 'mergeLogo').mockImplementation(() => { })
      component.certificateUploaded = true
      component.contentFile = new File(['<svg/>'], 'cert.svg', { type: 'image/svg+xml' })

      const mockFileReader = {
        onload: null as any,
        readAsDataURL: jest.fn(),
      }
      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as any)

      const file = new File(['<svg/>'], 'logo.svg', { type: 'image/svg+xml' })
      component.onDropLogo(file)
      mockFileReader.onload({ target: { result: 'data:image/svg+xml;base64,test' } })

      expect(spyMergeLogo).toHaveBeenCalled()
    })
  })

  describe('removeLogoImage', () => {
    it('should clear logo state', () => {
      component.logoUploaded = true
      component.logoFileName = 'logo.svg'
      component.selectedLogoImage = 'data:image/svg+xml;base64,'
      component.removeLogoImage()
      expect(component.logoUploaded).toBe(false)
      expect(component.logoFileName).toBe('')
      expect(component.selectedLogoImage).toBeNull()
    })

    it('should clear logoFileInput nativeElement value when ref exists', () => {
      const mockNative = { value: 'something' }
        ; (component as any).logoFileInput = { nativeElement: mockNative }
      component.removeLogoImage()
      expect(mockNative.value).toBeNull()
    })
  })

  describe('removeCertificateImage', () => {
    it('should clear certificate state', () => {
      component.certificateUploaded = true
      component.contentFile = new File([''], 'cert.svg')
      component.certificateUrl = 'blob:url'
      component.removeCertificateImage()
      expect(component.certificateUploaded).toBe(false)
      expect(component.contentFile).toBeUndefined()
      expect(component.certificateUrl).toBe('')
    })

    it('should clear certificateFileInput nativeElement value when ref exists', () => {
      const mockNative = { value: 'something' }
        ; (component as any).certificateFileInput = { nativeElement: mockNative }
      component.removeCertificateImage()
      expect(mockNative.value).toBeNull()
    })
  })

  describe('uploadFile', () => {
    it('should show error when no content file', () => {
      component.contentFile = undefined
      component.uploadFile()
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })

    it('should open dialog and call uploadCertificate when file present', () => {
      const file = new File(['<svg></svg>'], 'cert.svg', { type: 'image/svg+xml' })
      component.contentFile = file
      mockMarketPlaceSvc.uploadThumbNail.mockReturnValue(of({ result: { url: 'http://url' } }))
      mockMarketPlaceSvc.updateProvider.mockReturnValue(of({ result: 'ok' }))
      component.providerDetalsBeforUpdate = { data: {} }
      component.dialogRef = { close: jest.fn() }
      component.uploadFile()
      expect(mockDialog.open).toHaveBeenCalled()
    })
  })

  describe('uploadCertificate', () => {
    it('should call updateProvider after upload success', () => {
      jest.useFakeTimers()
      mockMarketPlaceSvc.uploadThumbNail.mockReturnValue(of({ result: { url: 'http://cert.svg' } }))
      mockMarketPlaceSvc.updateProvider.mockReturnValue(of({ result: 'ok' }))
      component.providerDetalsBeforUpdate = { data: {} }
      component.dialogRef = { close: jest.fn() }
      component.uploadCertificate(new FormData())
      expect(mockMarketPlaceSvc.updateProvider).toHaveBeenCalled()
      jest.useRealTimers()
    })
  })

  describe('upDateTransforamtionDetails', () => {
    it('should show success snack bar on updateProvider success', () => {
      jest.useFakeTimers()
      mockMarketPlaceSvc.updateProvider.mockReturnValue(of({ result: 'ok' }))
      component.providerDetalsBeforUpdate = { data: {} }
      component.loadProviderDetails.emit = jest.fn()
      component.upDateTransforamtionDetails()
      jest.runAllTimers()
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
      expect(component.loadProviderDetails.emit).toHaveBeenCalledWith(true)
      jest.useRealTimers()
    })

    it('should show error on updateProvider failure', () => {
      const error = { error: { params: { errMsg: 'Update failed' } } }
      mockMarketPlaceSvc.updateProvider.mockReturnValue(throwError(() => error))
      component.providerDetalsBeforUpdate = { certificateTemplateUrl: 'url', data: {} }
      component.contentFile = new File([''], 'cert.svg')
      component.upDateTransforamtionDetails()
      expect(component.providerDetalsBeforUpdate.certificateTemplateUrl).toBe('')
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })

    it('should show error from default message when errMsg not present', () => {
      mockMarketPlaceSvc.updateProvider.mockReturnValue(throwError(() => ({})))
      component.providerDetalsBeforUpdate = { data: {} }
      component.upDateTransforamtionDetails()
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })
  })

  describe('sendProviderDetailsUpdateEvent', () => {
    it('should emit loadProviderDetails', () => {
      component.loadProviderDetails.emit = jest.fn()
      component.sendProviderDetailsUpdateEvent()
      expect(component.loadProviderDetails.emit).toHaveBeenCalledWith(true)
    })
  })

  describe('openFileUploadPopup', () => {
    it('should open dialog with correct data', () => {
      component.openFileUploadPopup('imageLoader', 'Uploading...')
      expect(mockDialog.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ data: expect.objectContaining({ dialogType: 'imageLoader' }) })
      )
    })
  })

  describe('showSnackBar', () => {
    it('should call snackBar.openFromComponent with success', () => {
      component.showSnackBar('Test', 'success')
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })

    it('should call snackBar.openFromComponent with error', () => {
      component.showSnackBar('Error msg', 'error')
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })
  })

  describe('downloadPDF', () => {
    it('should show error when no certificate is uploaded', () => {
      component.certificateUploaded = false
      component.contentFile = undefined
      component.downloadPDF()
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })

    it('should create an img element when certificate is uploaded', () => {
      URL.createObjectURL = jest.fn().mockReturnValue('blob:test')
      component.certificateUploaded = true
      component.contentFile = new File(['<svg/>'], 'cert.svg', { type: 'image/svg+xml' })
      component.certificateUrl = 'blob:test'
      component.fileName = 'cert.svg'

      const mockImg = {
        crossOrigin: '',
        onload: null as any,
        onerror: null as any,
        src: '',
      }
      jest.spyOn(document, 'createElement').mockReturnValue(mockImg as any)

      component.downloadPDF()

      expect(mockImg.crossOrigin).toBe('anonymous')
      expect(mockImg.src).toBe('blob:test')
    })

    it('should show error when image load fails', () => {
      component.certificateUploaded = true
      component.contentFile = new File(['<svg/>'], 'cert.svg', { type: 'image/svg+xml' })
      component.certificateUrl = 'blob:test'
      component.fileName = 'cert.svg'

      const mockImg: any = { crossOrigin: '', onload: null, onerror: null, src: '' }
      jest.spyOn(document, 'createElement').mockReturnValue(mockImg)

      component.downloadPDF()
      mockImg.onerror()

      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })
  })

  describe('useDefaultTemplate', () => {
    it('should fetch default template and set certificate state', async () => {
      URL.createObjectURL = jest.fn().mockReturnValue('blob:default')
      global.fetch = jest.fn().mockResolvedValue({
        blob: () => Promise.resolve(new Blob(['<svg/>'], { type: 'image/svg+xml' }))
      }) as any

      await component.useDefaultTemplate()

      expect(component.certificateUploaded).toBe(true)
      expect(component.fileName).toBe('CourseCertificate_Template.svg')
    })

    it('should show error when default template fetch fails', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as any
      await component.useDefaultTemplate()
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })

    it('should call mergeLogo if logo is already uploaded', async () => {
      URL.createObjectURL = jest.fn().mockReturnValue('blob:default')
      global.fetch = jest.fn().mockResolvedValue({
        blob: () => Promise.resolve(new Blob(['<svg/>'], { type: 'image/svg+xml' }))
      }) as any
      component.logoUploaded = true
      component.selectedLogoImage = 'data:image/svg+xml;base64,PHN2Zy8+'
      const spyMergeLogo = jest.spyOn(component as any, 'mergeLogo').mockImplementation(() => { })

      await component.useDefaultTemplate()

      expect(spyMergeLogo).toHaveBeenCalled()
    })

    it('should show error when defaultCertificateTemplateUrl is empty', () => {
      ; (component as any).defaultCertificateTemplateUrl = ''
      component.useDefaultTemplate()
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })
  })
})

