import { PublicAboutComponent } from './public-about.component'
import { BreakpointObserver } from '@angular/cdk/layout'
import { DomSanitizer } from '@angular/platform-browser'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'

describe('PublicAboutComponent', () => {
  let component: PublicAboutComponent
  let breakpointObserverMock: Partial<BreakpointObserver>
  let domSanitizerMock: Partial<DomSanitizer>
  let configSvcMock: any
  let activateRouteMock: Partial<ActivatedRoute>

  beforeEach(() => {
    // Create mock objects
    breakpointObserverMock = {
      observe: jest.fn().mockReturnValue(of({ matches: false })),
    }

    domSanitizerMock = {
      bypassSecurityTrustStyle: jest.fn((style: string) => style), // return the style directly
      bypassSecurityTrustResourceUrl: jest.fn((url: string) => url), // return the URL directly
    }

    configSvcMock = {
      instanceConfig: {
        logos: {
          aboutHeader: 'headerLogoUrl',
          aboutFooter: 'footerLogoUrl',
          app: '',
          appTransparent: '',
          company: '',
          developedBy: '',
          poweredBy: '',
          landingLogo: ''
        },
      },
      pageNavBar: {},
    }

    activateRouteMock = {
      data: of({
        pageData: {
          data: {
            banner: {
              videoLink: 'https://example.com/video.mp4',
            },
          },
        },
      }),
    }

    // Initialize component
    component = new PublicAboutComponent(
      breakpointObserverMock as BreakpointObserver,
      domSanitizerMock as DomSanitizer,
      configSvcMock as ConfigurationsService,
      activateRouteMock as ActivatedRoute
    )
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should set videoLink correctly when banner videoLink is provided', () => {
    component.ngOnInit()

    expect(domSanitizerMock.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith(
      'https://example.com/video.mp4'
    )
    expect(component.videoLink).toBe('https://example.com/video.mp4')
  })

  it('should set header and footer banners on ngOnInit', () => {
    component.ngOnInit()

    expect(domSanitizerMock.bypassSecurityTrustStyle).toHaveBeenCalledWith(
      `url('headerLogoUrl')`
    )
    expect(domSanitizerMock.bypassSecurityTrustStyle).toHaveBeenCalledWith(
      `url('footerLogoUrl')`
    )

    expect(component.headerBanner).toBe('url(\'headerLogoUrl\')')
    expect(component.footerBanner).toBe('url(\'footerLogoUrl\')')
  })

  it('should unsubscribe from subscriptionAbout on ngOnDestroy', () => {
    const unsubscribeMock = jest.fn()
    // component.subscriptionAbout = { unsubscribe: unsubscribeMock } as any
    component.ngOnDestroy()

    expect(unsubscribeMock).toHaveBeenCalled()
  })

  it('should set isSmallScreen$ observable value correctly', (done) => {
    component.isSmallScreen$.subscribe((isSmallScreen) => {
      expect(isSmallScreen).toBe(false)
      done()
    })
  })
})
