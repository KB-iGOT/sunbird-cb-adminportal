import { ConfigureProviderComponent } from './configure-provider.component'
import { of, Subject } from 'rxjs'

const mockQueryParams$ = new Subject<any>()
const mockData$ = new Subject<any>()

const mockActivateRoute = {
  queryParams: mockQueryParams$.asObservable(),
  data: mockData$.asObservable(),
}

const mockSnackBar = {
  openFromComponent: jest.fn(),
}

const mockMarketPlaceSvc = {
  currentMenuItem: { next: jest.fn() },
  getProviderDetails: jest.fn(),
}

const mockExternalSvc = {
  breadcrumnItems: { next: jest.fn() },
}

describe('ConfigureProviderComponent', () => {
  let component: ConfigureProviderComponent

  beforeEach(() => {
    jest.clearAllMocks()
    component = new ConfigureProviderComponent(
      mockActivateRoute as any,
      mockSnackBar as any,
      mockMarketPlaceSvc as any,
      mockExternalSvc as any,
    )
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should have correct default property values', () => {
    expect(component.opened).toBe(true)
    expect(component.selectedIndex).toBe(0)
    expect(component.disableCourseCatalog).toBe(true)
    expect(component.providerDetails).toBeUndefined()
  })

  it('should have helpCenterGuide with correct default values', () => {
    expect(component.helpCenterGuide).toBeDefined()
    expect(component.helpCenterGuide.header).toBe('Content Upload Details: Video Guides and Tips')
  })

  it('should have instructionsList with one item by default', () => {
    expect(component.instructionsList).toHaveLength(1)
  })

  it('ngOnInit should call getRoutesData', () => {
    const spy = jest.spyOn(component as any, 'getRoutesData').mockImplementation()
    component.ngOnInit()
    expect(spy).toHaveBeenCalled()
  })

  it('activeMenuItemEvent should update currentMenuDetails and activeMenuItem', () => {
    const event = { activeMenuItem: { slug: 'provider_details', label: 'Provider Details' } }
    component.activeMenuItemEvent(event)
    expect(component.currentMenuDetails).toEqual(event.activeMenuItem)
    expect(component.activeMenuItem).toBe('provider_details')
  })

  it('ngOnDestroy should unsubscribe routeSubscription and clear breadcrumbs', () => {
    const unsubSpy = jest.spyOn(component.routeSubscription, 'unsubscribe')
    component.ngOnDestroy()
    expect(unsubSpy).toHaveBeenCalled()
    expect(mockExternalSvc.breadcrumnItems.next).toHaveBeenCalledWith([])
  })

  it('ngAfterViewInit should set activeMenuItem and call currentMenuItem.next', () => {
    component.ngAfterViewInit()
    expect(component.activeMenuItem).toBe('provider_details')
    expect(mockMarketPlaceSvc.currentMenuItem.next).toHaveBeenCalled()
  })

  it('ngAfterViewInit should update activeMenuItem when tab queryParam matches', () => {
    component.ngAfterViewInit()
    mockQueryParams$.next({ tab: 'sso_integration' })
    expect(component.activeMenuItem).toBe('sso_integration')
  })

  it('ngAfterViewInit should not update activeMenuItem when tab queryParam does not match', () => {
    component.ngAfterViewInit()
    component.activeMenuItem = 'provider_details'
    mockQueryParams$.next({ tab: 'unknown_slug' })
    expect(component.activeMenuItem).toBe('provider_details')
  })

  it('getRoutesData should show snackbar on error in providerDetails', () => {
    jest.spyOn(component as any, 'showSnackBar').mockImplementation()
    component.ngOnInit()
    mockData$.next({ providerDetails: { error: 'Some error' } })
    expect((component as any).showSnackBar).toHaveBeenCalledWith('Some error', 'error')
  })

  it('getRoutesData should set providerDetails when data is returned', () => {
    component.ngOnInit()
    mockData$.next({
      providerDetails: {
        data: {
          result: { id: '123', data: { contentPartnerName: 'TestProvider' } }
        }
      }
    })
    expect(component.disableCourseCatalog).toBe(false)
    expect(component.providerDetails).toEqual({ id: '123', data: { contentPartnerName: 'TestProvider' } })
  })

  it('getRoutesData should update helpCenterGuide when pageData is present', () => {
    const newGuide = { header: 'New Guide', guideNotes: [], helpVideoLink: '/new-video.mp4' }
    component.ngOnInit()
    mockData$.next({
      providerDetails: null,
      pageData: {
        data: {
          configureCertificateGuide: {
            helpCenterGuide: newGuide,
            instructions: ['Instruction 1']
          }
        }
      }
    })
    expect(component.helpCenterGuide).toEqual(newGuide)
    expect(component.instructionsList).toEqual(['Instruction 1'])
  })

  it('getProviderDetails should call marketPlaceSvc.getProviderDetails when providerDetails has id', () => {
    component.providerDetails = { id: 'prov-1' }
    mockMarketPlaceSvc.getProviderDetails.mockReturnValue(of({ result: { id: 'prov-1' } }))
    component.getProviderDetails(true)
    expect(mockMarketPlaceSvc.getProviderDetails).toHaveBeenCalledWith('prov-1')
    expect(component.disableCourseCatalog).toBe(false)
  })

  it('getProviderDetails should not call marketPlaceSvc when providerDetails is null', () => {
    component.providerDetails = null
    component.getProviderDetails(true)
    expect(mockMarketPlaceSvc.getProviderDetails).not.toHaveBeenCalled()
  })

  it('getProviderDetails should not call marketPlaceSvc when event is false', () => {
    component.providerDetails = { id: 'prov-1' }
    component.getProviderDetails(false)
    expect(mockMarketPlaceSvc.getProviderDetails).not.toHaveBeenCalled()
  })

  it('getProviderDetails should show snackbar on error', () => {
    component.providerDetails = { id: 'prov-1' }
    const { throwError } = require('rxjs')
    mockMarketPlaceSvc.getProviderDetails.mockReturnValue(
      throwError({ error: { params: { errMsg: 'Fetch failed' } } })
    )
    jest.spyOn(component as any, 'showSnackBar').mockImplementation()
    component.getProviderDetails(true)
    expect((component as any).showSnackBar).toHaveBeenCalledWith('Fetch failed', 'error')
  })

  it('showSnackBar should call snackBar.openFromComponent', () => {
    ; (component as any).showSnackBar('Test message', 'error')
    expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
  })
})
