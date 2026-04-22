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
  })

  describe('sendProviderDetailsUpdateEvent', () => {
    it('should emit loadProviderDetails', () => {
      component.loadProviderDetails.emit = jest.fn()
      component.sendProviderDetailsUpdateEvent()
      expect(component.loadProviderDetails.emit).toHaveBeenCalledWith(true)
    })
  })

  describe('showSnackBar', () => {
    it('should call snackBar.openFromComponent', () => {
      component.showSnackBar('Test', 'success')
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })
  })
})

