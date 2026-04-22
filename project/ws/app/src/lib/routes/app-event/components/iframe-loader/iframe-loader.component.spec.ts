
import { DomSanitizer } from '@angular/platform-browser'
import { ActivatedRoute } from '@angular/router'
import { BehaviorSubject } from 'rxjs'
import { EventService } from '../../services/event.service'
import { EiframeUrl } from '../../interfaces/event-details.model'
import { IframeLoaderComponent } from './iframe-loader.component'

describe('IframeLoaderComponent', () => {
    let component: IframeLoaderComponent
    let mockDomSanitizer: jest.Mocked<Partial<DomSanitizer>>
    let mockActivatedRoute: any
    let mockAppEventSvc: any
    let bannerisEnabled: BehaviorSubject<boolean>

    beforeEach(() => {
        bannerisEnabled = new BehaviorSubject<boolean>(true)

        mockDomSanitizer = {
            bypassSecurityTrustResourceUrl: jest.fn().mockReturnValue('safe-url'),
        }

        mockActivatedRoute = {
            snapshot: {
                paramMap: {
                    get: jest.fn(),
                },
            },
        }

        mockAppEventSvc = {
            bannerisEnabled,
        }

        component = new IframeLoaderComponent(
            mockDomSanitizer as unknown as DomSanitizer,
            mockActivatedRoute as ActivatedRoute,
            mockAppEventSvc as EventService
        )
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should create an instance of component', () => {
        expect(component).toBeTruthy()
    })

    it('should have null iframeSrc and iframeUrl initially', () => {
        expect(component.iframeSrc).toBeNull()
        expect(component.iframeUrl).toBeNull()
        expect(component.iframeType).toBeNull()
    })

    describe('ngOnInit', () => {
        it('should disable banner on init', () => {
            mockActivatedRoute.snapshot.paramMap.get.mockReturnValue(null)
            component.ngOnInit()
            expect(bannerisEnabled.getValue()).toBe(false)
        })

        it('should set iframeUrl and iframeSrc for QUIZ type', () => {
            mockActivatedRoute.snapshot.paramMap.get.mockReturnValue(EiframeUrl.QUIZ)
            component.ngOnInit()
            expect(component.iframeType).toBe(EiframeUrl.QUIZ)
            expect(component.iframeUrl).toBe('https://igot-gov.in')
            expect(mockDomSanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith('https://igot-gov.in')
            expect(component.iframeSrc).toBe('safe-url')
        })

        it('should set iframeUrl and iframeSrc for WEBEX type', () => {
            mockActivatedRoute.snapshot.paramMap.get.mockReturnValue(EiframeUrl.WEBEX)
            component.ngOnInit()
            expect(component.iframeType).toBe(EiframeUrl.WEBEX)
            expect(component.iframeUrl).toBe('https://igot-gov.in')
            expect(mockDomSanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith('https://igot-gov.in')
            expect(component.iframeSrc).toBe('safe-url')
        })

        it('should set iframeUrl and iframeSrc for VR type', () => {
            mockActivatedRoute.snapshot.paramMap.get.mockReturnValue(EiframeUrl.VR)
            component.ngOnInit()
            expect(component.iframeType).toBe(EiframeUrl.VR)
            expect(component.iframeUrl).toBe('https://igot-gov.in')
            expect(mockDomSanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith('https://igot-gov.in')
            expect(component.iframeSrc).toBe('safe-url')
        })

        it('should set iframeSrc to null for unknown iframe type', () => {
            mockActivatedRoute.snapshot.paramMap.get.mockReturnValue('unknown')
            component.ngOnInit()
            expect(component.iframeType).toBe('unknown')
            expect(component.iframeUrl).toBeNull()
            expect(mockDomSanitizer.bypassSecurityTrustResourceUrl).not.toHaveBeenCalled()
            expect(component.iframeSrc).toBeNull()
        })

        it('should set iframeSrc to null when paramMap returns null', () => {
            mockActivatedRoute.snapshot.paramMap.get.mockReturnValue(null)
            component.ngOnInit()
            expect(component.iframeType).toBeNull()
            expect(component.iframeUrl).toBeNull()
            expect(component.iframeSrc).toBeNull()
        })
    })
})
