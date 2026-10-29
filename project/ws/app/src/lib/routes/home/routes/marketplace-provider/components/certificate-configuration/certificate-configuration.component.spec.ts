import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { FormBuilder, ReactiveFormsModule } from '@angular/forms'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { of } from 'rxjs'

import { CertificateConfigurationComponent } from './certificate-configuration.component'
import { MarketplaceService } from '../../services/marketplace.service'

describe('CertificateConfigurationComponent', () => {
  let component: CertificateConfigurationComponent
  let fixture: ComponentFixture<CertificateConfigurationComponent>

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CertificateConfigurationComponent],
      imports: [ReactiveFormsModule],
      providers: [
        FormBuilder,
        {
          provide: MarketplaceService,
          useValue: {
            updateProvider: jest.fn().mockReturnValue(of({})),
            uploadThumbNail: jest.fn().mockReturnValue(of({})),
          },
        },
        { provide: MatSnackBar, useValue: { open: jest.fn(), openFromComponent: jest.fn() } },
        { provide: MatDialog, useValue: { open: jest.fn().mockReturnValue({ afterClosed: () => of(false), close: jest.fn() }) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    fixture = TestBed.createComponent(CertificateConfigurationComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('file picker triggers', () => {
    const getTrigger = (inputId: string): HTMLElement => {
      const input: HTMLInputElement = fixture.nativeElement.querySelector(`#${inputId}`)
      return input.parentElement!.querySelector('.meta-text-1') as HTMLElement
    }

    it.each(['logoFileInput', 'certificateFileInput'])('should expose the %s trigger as a focusable button', inputId => {
      const trigger = getTrigger(inputId)
      expect(trigger.getAttribute('role')).toBe('button')
      expect(trigger.getAttribute('tabindex')).toBe('0')
    })

    it.each(['logoFileInput', 'certificateFileInput'])('should click the trigger and open %s on Enter', inputId => {
      const trigger = getTrigger(inputId)
      const input: HTMLInputElement = fixture.nativeElement.querySelector(`#${inputId}`)
      const clickSpy = jest.spyOn(trigger, 'click')
      const inputClickSpy = jest.spyOn(input, 'click').mockImplementation(() => { })
      const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true })

      trigger.dispatchEvent(event)

      expect(clickSpy).toHaveBeenCalled()
      expect(inputClickSpy).toHaveBeenCalled()
      expect(event.defaultPrevented).toBe(true)
    })

    it('should click the trigger on Space and ignore other keys', () => {
      const trigger = getTrigger('logoFileInput')
      jest.spyOn(fixture.nativeElement.querySelector('#logoFileInput'), 'click').mockImplementation(() => { })
      const clickSpy = jest.spyOn(trigger, 'click')

      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', cancelable: true }))
      expect(clickSpy).not.toHaveBeenCalled()

      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', cancelable: true }))
      expect(clickSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('onDropCertificate', () => {
    const originalCreateObjectURL = URL.createObjectURL

    beforeEach(() => {
      URL.createObjectURL = jest.fn().mockReturnValue('blob:http://localhost/certificate-id')
    })

    afterEach(() => {
      URL.createObjectURL = originalCreateObjectURL
    })

    it('should use the plain blob url for the preview of an svg file', () => {
      const file = new File(['<svg></svg>'], 'certificate.svg', { type: 'image/svg+xml' })
      component.onDropCertificate(file)
      expect(component.certificateUploaded).toBe(true)
      expect(component.certificateUrl).toBe('blob:http://localhost/certificate-id')
      expect(component.safeCertificateUrl).toBe('blob:http://localhost/certificate-id')
    })

    it('should reject a non-svg file without setting a preview', () => {
      const file = new File(['data'], 'certificate.png', { type: 'image/png' })
      component.onDropCertificate(file)
      expect(component.safeCertificateUrl).toBeNull()
      expect(URL.createObjectURL).not.toHaveBeenCalled()
    })
  })
})
