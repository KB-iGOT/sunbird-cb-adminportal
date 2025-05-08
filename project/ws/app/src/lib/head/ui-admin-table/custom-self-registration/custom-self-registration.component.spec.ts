import { CustomSelfRegistrationComponent } from './custom-self-registration.component'
import { FormBuilder } from '@angular/forms'
import { CreateMDOService } from '../create-mdo.services'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Clipboard } from '@angular/cdk/clipboard'
import { MatDialog } from '@angular/material/dialog'
import { EventService } from '@sunbird-cb/utils'
import { of, throwError } from 'rxjs'
import { InfoModalComponent } from '../../info-modal/info-modal.component'

// Mock file-saver module
jest.mock('file-saver', () => ({
  saveAs: jest.fn()
}))

describe('CustomSelfRegistrationComponent', () => {
  let component: CustomSelfRegistrationComponent
  let formBuilderMock: jest.Mocked<FormBuilder>
  let createMdoServiceMock: jest.Mocked<CreateMDOService>
  let snackbarMock: jest.Mocked<MatSnackBar>
  let clipboardMock: jest.Mocked<Clipboard>
  let dialogMock: jest.Mocked<MatDialog>
  let eventsServiceMock: jest.Mocked<EventService>
  let formGroupMock: any
  let dialogCloseRef: any

  beforeEach(() => {
    // Create mocks for all dependencies
    formGroupMock = {
      get: jest.fn().mockReturnValue({
        setValue: jest.fn()
      }),
      controls: {
        startDate: { value: new Date() },
        endDate: { value: new Date() }
      }
    }

    formBuilderMock = {
      group: jest.fn().mockReturnValue(formGroupMock),
    } as unknown as jest.Mocked<FormBuilder>

    createMdoServiceMock = {
      getListOfRegisteedLinks: jest.fn().mockReturnValue(of({})),
      generateSelfRegistrationQRCode: jest.fn().mockReturnValue(of({}))
    } as unknown as jest.Mocked<CreateMDOService>

    snackbarMock = {
      open: jest.fn()
    } as unknown as jest.Mocked<MatSnackBar>

    clipboardMock = {
      copy: jest.fn()
    } as unknown as jest.Mocked<Clipboard>

    dialogCloseRef = { close: jest.fn() }
    dialogMock = {
      open: jest.fn().mockReturnValue(dialogCloseRef)
    } as unknown as jest.Mocked<MatDialog>

    eventsServiceMock = {
      raiseInteractTelemetry: jest.fn()
    } as unknown as jest.Mocked<EventService>

    // Initialize the component with mocked dependencies
    component = new CustomSelfRegistrationComponent(
      formBuilderMock,
      createMdoServiceMock,
      snackbarMock,
      clipboardMock,
      dialogMock,
      eventsServiceMock
    )

    // Mock initialData
    component.initialData = {
      orgId: 'test-org-id',
      orgName: 'Test Organization'
    }

    // Spy on document.body.classList methods
    jest.spyOn(document.body.classList, 'add')
    jest.spyOn(document.body.classList, 'remove')

    // Mock window.open
    global.window.open = jest.fn()

    // Mock implementation of getlistOfRegisterationLinks to prevent actual call during ngOnInit
    component.getlistOfRegisterationLinks = jest.fn()

    // Initialize component
    component.ngOnInit()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should add overflow-hidden class on init', () => {
    expect(document.body.classList.add).toHaveBeenCalledWith('overflow-hidden')
  })

  it('should remove overflow-hidden class on destroy', () => {
    component.ngOnDestroy()
    expect(document.body.classList.remove).toHaveBeenCalledWith('overflow-hidden')
  })

  it('should initialize form on ngOnInit', () => {
    // Clear the mock to see the real calls
    component.getlistOfRegisterationLinks = jest.fn()

    // Call the real ngOnInit
    component.ngOnInit()

    expect(formBuilderMock.group).toHaveBeenCalledWith({
      startDate: ['', expect.any(Array)],
      endDate: ['', expect.any(Array)]
    })
    expect(component.getlistOfRegisterationLinks).toHaveBeenCalled()
  })

  it('should check registration status correctly for future date', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 1)
    expect(component.checkRegistrationStatus(futureDate)).toBe(true)
  })

  it('should check registration status correctly for past date', () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 1)
    expect(component.checkRegistrationStatus(pastDate)).toBe(false)
  })

  it('should check registration status correctly for null date', () => {
    expect(component.checkRegistrationStatus(null)).toBe(true)
  })

  it('should emit buttonClick event when closeNaveBar is called', () => {
    jest.spyOn(component.buttonClick, 'emit')
    component.closeNaveBar()
    expect(component.buttonClick.emit).toHaveBeenCalledWith({ action: 'close' })
  })

  it('should update form and state when links exist in getlistOfRegisterationLinks', () => {
    const mockResponse = {
      result: {
        qrCodeDataForOrg: [
          {
            startDate: '2023-01-01',
            endDate: '2023-12-31',
            url: 'https://test-url.com',
            qrCodeImagePath: 'portal/path/to/image.png',
            qrLogoPath: 'portal/path/to/logo.png',
            numberOfUsersOnboarded: 5,
            status: 'active'
          }
        ]
      }
    }

    // Restore the real implementation for this test
    component.getlistOfRegisterationLinks = CustomSelfRegistrationComponent.prototype.getlistOfRegisterationLinks

    createMdoServiceMock.getListOfRegisteedLinks.mockReturnValue(of(mockResponse))
    component.getlistOfRegisterationLinks()

    expect(component.registeredLinksList).toEqual(mockResponse.result.qrCodeDataForOrg)
    expect(component.latestRegisteredData).toEqual(mockResponse.result.qrCodeDataForOrg[0])
    expect(component.customRegistrationLinks).toEqual({
      registrationLink: 'https://test-url.com',
      qrRegistrationLink: 'spv/path/to/image.png',
      qrRegistrationLogoPath: 'spv/path/to/logo.png',
    })
    expect(component.numberOfUsersOnboarded).toBe(5)
    expect(component.initialData.QRGenerated).toBe(true)
  })

  it('should handle empty response correctly in getlistOfRegisterationLinks', () => {
    const mockEmptyResponse = {
      result: {
        qrCodeDataForOrg: []
      }
    }

    // Restore the real implementation for this test
    component.getlistOfRegisterationLinks = CustomSelfRegistrationComponent.prototype.getlistOfRegisterationLinks

    createMdoServiceMock.getListOfRegisteedLinks.mockReturnValue(of(mockEmptyResponse))
    component.getlistOfRegisterationLinks()

    expect(component.customRegistrationLinks).toBeUndefined()
    expect(component.initialData.QRGenerated).toBe(false)
  })

  it('should handle error gracefully in getlistOfRegisterationLinks', () => {
    // Restore the real implementation for this test
    component.getlistOfRegisterationLinks = CustomSelfRegistrationComponent.prototype.getlistOfRegisterationLinks

    createMdoServiceMock.getListOfRegisteedLinks.mockReturnValue(throwError(() => new Error('Test error')))

    expect(() => {
      component.getlistOfRegisterationLinks()
    }).not.toThrow()
  })

  it('should generate QR code successfully', () => {
    // Setup form for this test
    component.selfRegistrationForm = {
      controls: {
        startDate: { value: new Date('2023-01-01') },
        endDate: { value: new Date('2023-12-31') }
      }
    } as any

    const mockResponse = {
      responseCode: 'OK',
      result: {
        registrationLink: 'https://test-link.com',
        qrRegistrationLink: 'portal/path/to/qr.png',
        qrCodeLogoPath: 'portal/path/to/logo.png'
      }
    }

    createMdoServiceMock.generateSelfRegistrationQRCode.mockReturnValue(of(mockResponse))

    component.generateQRCodeLink()

    expect(dialogMock.open).toHaveBeenCalledWith(
      InfoModalComponent,
      expect.objectContaining({
        data: { type: 'generate-link-loader' },
        disableClose: true
      })
    )

    expect(createMdoServiceMock.generateSelfRegistrationQRCode).toHaveBeenCalledWith({
      registrationStartDate: expect.any(Number),
      registrationEndDate: expect.any(Number),
      orgId: 'test-org-id'
    })

    expect(component.customRegistrationLinks).toEqual({
      registrationLink: 'https://test-link.com',
      qrRegistrationLink: 'spv/path/to/qr.png',
      qrRegistrationLogoPath: 'spv/path/to/logo.png'
    })

    expect(component.initialData.QRGenerated).toBe(true)
    expect(component.isLoading).toBe(false)
    expect(dialogCloseRef.close).toHaveBeenCalled()
  })

  it('should handle error message in response when generating QR code', () => {
    // Setup form for this test
    component.selfRegistrationForm = {
      controls: {
        startDate: { value: new Date('2023-01-01') },
        endDate: { value: new Date('2023-12-31') }
      }
    } as any

    const mockErrorResponse = {
      params: {
        errmsg: 'Something went wrong'
      }
    }

    createMdoServiceMock.generateSelfRegistrationQRCode.mockReturnValue(of(mockErrorResponse))

    component.generateQRCodeLink()

    expect(snackbarMock.open).toHaveBeenCalledWith('Something went wrong', '', { duration: 3000 })
    expect(component.isLoading).toBe(false)
    expect(dialogCloseRef.close).toHaveBeenCalled()
  })

  it('should handle empty response when generating QR code', () => {
    // Setup form for this test
    component.selfRegistrationForm = {
      controls: {
        startDate: { value: new Date('2023-01-01') },
        endDate: { value: new Date('2023-12-31') }
      }
    } as any

    const mockEmptyResponse = {
      responseCode: 'NOT_OK',
      result: {}
    }

    createMdoServiceMock.generateSelfRegistrationQRCode.mockReturnValue(of(mockEmptyResponse))

    component.generateQRCodeLink()

    expect(snackbarMock.open).toHaveBeenCalledWith(
      "Oops! We couldn't generate the link or QR code.Please try again",
      '',
      { duration: 3000 }
    )
    expect(component.isLoading).toBe(false)
    expect(dialogCloseRef.close).toHaveBeenCalled()
  })

  it('should handle service error when generating QR code', () => {
    // Setup form for this test
    component.selfRegistrationForm = {
      controls: {
        startDate: { value: new Date('2023-01-01') },
        endDate: { value: new Date('2023-12-31') }
      }
    } as any

    createMdoServiceMock.generateSelfRegistrationQRCode.mockReturnValue(throwError(() => new Error('Test error')))

    component.generateQRCodeLink()

    expect(component.isLoading).toBe(false)
    expect(dialogCloseRef.close).toHaveBeenCalled()
  })

  it('should return qrLogoPath when available in getQRCodePath', () => {
    const response = { qrLogoPath: 'portal/path/to/logo.png' }
    expect(component.getQRCodePath(response)).toBe('spv/path/to/logo.png')
  })

  it('should return qrCodeLogoPath when available and qrLogoPath is not in getQRCodePath', () => {
    const response = { qrCodeLogoPath: 'portal/path/to/codelogo.png' }
    expect(component.getQRCodePath(response)).toBe('spv/path/to/codelogo.png')
  })

  it('should return qrCodeImagePath when available and others are not in getQRCodePath', () => {
    const response = { qrCodeImagePath: 'portal/path/to/image.png' }
    expect(component.getQRCodePath(response)).toBe('spv/path/to/image.png')
  })

  it('should return qrRegistrationLink when available and others are not in getQRCodePath', () => {
    const response = { qrRegistrationLink: 'portal/path/to/reglink.png' }
    expect(component.getQRCodePath(response)).toBe('spv/path/to/reglink.png')
  })

  it('should copy link to clipboard', () => {
    component.copyLinkToClipboard('https://test-link.com')
    expect(clipboardMock.copy).toHaveBeenCalledWith('https://test-link.com')
    expect(snackbarMock.open).toHaveBeenCalledWith('Copied!')
  })

  it('should fetch and save QR code when downloading', async () => {
    // Mock the global fetch
    global.fetch = jest.fn().mockResolvedValue({
      blob: jest.fn().mockResolvedValue('blob-data')
    })

    const fileSaverMock = require('file-saver')

    await component.downloadQRCode('https://test-qr.com')

    expect(global.fetch).toHaveBeenCalledWith('https://test-qr.com')
    expect(fileSaverMock.saveAs).toHaveBeenCalledWith('blob-data', 'QRCode.png')
    expect(eventsServiceMock.raiseInteractTelemetry).toHaveBeenCalledWith(
      {
        type: 'click',
        subType: 'download-qr',
        id: 'share-custom-registration-link',
        pageid: '/app/home/directory/organisation'
      },
      {},
    )
  })

  it('should handle download errors gracefully', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

    await component.downloadQRCode('https://test-qr.com')

    expect(global.fetch).toHaveBeenCalledWith('https://test-qr.com')
  })

  it('should open email client with correct link', () => {
    component.sendViaEmail('https://test-link.com')

    expect(eventsServiceMock.raiseInteractTelemetry).toHaveBeenCalledWith(
      {
        type: 'click',
        subType: 'share-on-mail',
        id: 'share-custom-registration-link',
        pageid: '/app/home/directory/organisation'
      },
      {},
    )

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('mailto:?subject='),
      '_self'
    )
  })

  it('should do nothing if link is empty when sending via email', () => {
    component.sendViaEmail('')
    expect(window.open).not.toHaveBeenCalled()
  })

  it('should open WhatsApp with correct link', () => {
    component.sendViaWhatsApp('https://test-link.com')

    expect(eventsServiceMock.raiseInteractTelemetry).toHaveBeenCalledWith(
      {
        type: 'click',
        subType: 'share-on-whatsapp',
        id: 'share-custom-registration-link',
        pageid: '/app/home/directory/organisation'
      },
      {},
    )

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('https://api.whatsapp.com/send?text='),
      '_blank'
    )
  })

  it('should do nothing if link is empty when sending via WhatsApp', () => {
    component.sendViaWhatsApp('')
    expect(window.open).not.toHaveBeenCalled()
  })

  it('should raise telemetry event correctly', () => {
    component.raiseInteractTelementry('test-subtype')

    expect(eventsServiceMock.raiseInteractTelemetry).toHaveBeenCalledWith(
      {
        type: 'click',
        subType: 'test-subtype',
        id: 'share-custom-registration-link',
        pageid: '/app/home/directory/organisation'
      },
      {},
    )
  })
})