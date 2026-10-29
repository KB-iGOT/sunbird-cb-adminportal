import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { DatePipe } from '@angular/common'
import { FormBuilder } from '@angular/forms'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute, Router } from '@angular/router'
import { BehaviorSubject, of } from 'rxjs'

import { ProviderDetailsV2Component } from './provider-details-v2.component'
import { MarketplaceService } from '../../services/marketplace.service'
import { GlobalEventsService } from '../../../../../../../../../../../src/app/services/global-events.service'
import { NavigationExternalService } from '../../../../../../../../../../../src/app/services/navigation-external.service'

describe('ProviderDetailsV2Component', () => {
  let component: ProviderDetailsV2Component
  let fixture: ComponentFixture<ProviderDetailsV2Component>
  let status: string

  function setup() {
    TestBed.configureTestingModule({
      declarations: [ProviderDetailsV2Component],
      providers: [
        FormBuilder,
        DatePipe,
        { provide: MatSnackBar, useValue: { open: jest.fn(), openFromComponent: jest.fn() } },
        {
          provide: MarketplaceService,
          useValue: {
            changeStatusRegisterProvider: jest.fn().mockReturnValue(of({})),
            convertResourceUrl: jest.fn((url: string) => url),
            createProvider: jest.fn().mockReturnValue(of({})),
            newProviderAdded: new BehaviorSubject<any>(null),
            updateProvider: jest.fn().mockReturnValue(of({})),
            uploadCIOSContract: jest.fn().mockReturnValue(of({})),
            uploadThumbNail: jest.fn().mockReturnValue(of({})),
          },
        },
        { provide: Router, useValue: { navigate: jest.fn() } },
        { provide: GlobalEventsService, useValue: { setLoaderState: jest.fn() } },
        { provide: NavigationExternalService, useValue: { breadcrumnItems: new BehaviorSubject<any>([]) } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: { status } } } },
        { provide: MatDialog, useValue: { open: jest.fn().mockReturnValue({ afterClosed: () => of(false) }) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    fixture = TestBed.createComponent(ProviderDetailsV2Component)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  it('should create', () => {
    status = 'ACTIVE'
    setup()
    expect(component).toBeTruthy()
    expect(component.isPendingProvider).toBe(false)
    expect(component.providerDetailsForm).toBeTruthy()
  })

  it('should mark provider as pending when status query param is PENDING', () => {
    status = 'PENDING'
    setup()
    expect(component.isPendingProvider).toBe(true)
  })

  describe('cropImage', () => {
    let canvasEl: HTMLCanvasElement
    let ctx: { fillStyle: string, fillRect: jest.Mock, drawImage: jest.Mock }

    beforeEach(() => {
      status = 'ACTIVE'
      setup()
      canvasEl = (component.canvas as any).nativeElement
      ctx = { fillStyle: '', fillRect: jest.fn(), drawImage: jest.fn() }
      jest.spyOn(canvasEl, 'getContext').mockReturnValue(ctx as any)
      jest.spyOn(canvasEl, 'toBlob').mockImplementation((cb: BlobCallback) => cb(new Blob(['png'], { type: 'image/png' })))
      jest.spyOn(canvasEl, 'toDataURL').mockReturnValue('data:image/png;base64,cropped')
    })

    it('should draw a landscape image centred vertically on a square canvas', () => {
      const image = { width: 400, height: 200 } as HTMLImageElement
      component.logoFile = new File(['logo'], 'logo.png', { type: 'image/png' })

      component.cropImage(image)

      expect(canvasEl.getContext).toHaveBeenCalledWith('2d')
      expect(canvasEl.width).toBe(800)
      expect(canvasEl.height).toBe(800)
      expect(ctx.fillStyle).toBe('white')
      expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 800, 800)
      expect(ctx.drawImage).toHaveBeenCalledWith(image, 0, 200, 800, 400)
      expect(component.logoFile?.name).toBe('logo.png')
      expect(component.logoFile?.type).toBe('image/png')
      expect(component.logoPreviewUrl).toBe('data:image/png;base64,cropped')
      expect(component.providerDetailsForm.get('providerLogo')?.value).toBe('data:image/png;base64,cropped')
    })

    it('should draw a portrait image centred horizontally on a square canvas', () => {
      const image = { width: 200, height: 400 } as HTMLImageElement

      component.cropImage(image)

      expect(canvasEl.width).toBe(800)
      expect(canvasEl.height).toBe(800)
      expect(ctx.drawImage).toHaveBeenCalledWith(image, 200, 0, 400, 800)
    })

    it('should fill the whole canvas for an already square image', () => {
      const image = { width: 300, height: 300 } as HTMLImageElement

      component.cropImage(image)

      expect(canvasEl.width).toBe(canvasEl.height)
      expect(ctx.drawImage).toHaveBeenCalledWith(image, 0, 0, 800, 800)
    })

    it('should do nothing when the canvas is not available', () => {
      component.canvas = undefined
      component.cropImage({ width: 400, height: 200 } as HTMLImageElement)
      expect(ctx.drawImage).not.toHaveBeenCalled()
      expect(component.logoPreviewUrl).toBeNull()
    })
  })

  describe('partnership agreement upload trigger', () => {
    let trigger: HTMLElement

    beforeEach(() => {
      status = 'ACTIVE'
      setup()
      component.pdfUploaded = false
      fixture.detectChanges()
      trigger = fixture.nativeElement.querySelector('.parnter-ship-agreement .meta-text-1')
    })

    it('should be exposed as a focusable button', () => {
      expect(trigger).toBeTruthy()
      expect(trigger.getAttribute('role')).toBe('button')
      expect(trigger.getAttribute('tabindex')).toBe('0')
    })

    it('should trigger a click when Enter is pressed', () => {
      const clickSpy = jest.spyOn(trigger, 'click').mockImplementation(() => undefined)
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })

      trigger.dispatchEvent(event)

      expect(clickSpy).toHaveBeenCalledTimes(1)
      expect(event.defaultPrevented).toBe(true)
    })

    it('should trigger a click when Space is pressed', () => {
      const clickSpy = jest.spyOn(trigger, 'click').mockImplementation(() => undefined)
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })

      trigger.dispatchEvent(event)

      expect(clickSpy).toHaveBeenCalledTimes(1)
      expect(event.defaultPrevented).toBe(true)
    })

    it('should ignore other keys', () => {
      const clickSpy = jest.spyOn(trigger, 'click').mockImplementation(() => undefined)
      const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true })

      trigger.dispatchEvent(event)

      expect(clickSpy).not.toHaveBeenCalled()
      expect(event.defaultPrevented).toBe(false)
    })
  })
})
