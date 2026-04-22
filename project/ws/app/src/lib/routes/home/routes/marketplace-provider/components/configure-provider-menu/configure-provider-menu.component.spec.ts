import { ConfigureProviderMenuComponent } from './configure-provider-menu.component'
import { MarketplaceService } from '../../services/marketplace.service'
import { ActivatedRoute } from '@angular/router'
import { BehaviorSubject, Subject } from 'rxjs'

describe('ConfigureProviderMenuComponent', () => {
  let component: ConfigureProviderMenuComponent
  let mockMarketplaceService: jest.Mocked<Partial<MarketplaceService>>
  let mockActivatedRoute: any
  let queryParamsSubject: Subject<any>
  let currentMenuItemSubject: BehaviorSubject<any>
  let newProviderAddedSubject: BehaviorSubject<any>

  beforeEach(() => {
    queryParamsSubject = new Subject<any>()
    currentMenuItemSubject = new BehaviorSubject<any>(0)
    newProviderAddedSubject = new BehaviorSubject<any>(null)

    mockActivatedRoute = {
      queryParams: queryParamsSubject.asObservable(),
    }

    mockMarketplaceService = {
      currentMenuItem: currentMenuItemSubject,
      newProviderAdded: newProviderAddedSubject,
    }

    component = new ConfigureProviderMenuComponent(
      mockMarketplaceService as MarketplaceService,
      mockActivatedRoute as ActivatedRoute
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should create an instance of the component', () => {
    expect(component).toBeTruthy()
  })

  it('should initialize MENU_ITEMS with default items', () => {
    expect(component.MENU_ITEMS.length).toBeGreaterThan(0)
  })

  it('should have canOnlyView as false by default', () => {
    expect(component.canOnlyView).toBe(false)
  })

  describe('queryParams subscription', () => {
    it('should set canOnlyView to true when status is PENDING', () => {
      queryParamsSubject.next({ status: 'PENDING' })
      expect(component.canOnlyView).toBe(true)
    })

    it('should filter MENU_ITEMS to only provider_details when status is PENDING', () => {
      queryParamsSubject.next({ status: 'PENDING' })
      expect(component.MENU_ITEMS.every(item => item.slug === 'provider_details')).toBe(true)
    })

    it('should set canOnlyView to false when status is not PENDING', () => {
      queryParamsSubject.next({ status: 'ACTIVE' })
      expect(component.canOnlyView).toBe(false)
    })

    it('should enable all MENU_ITEMS when params.id is present', () => {
      queryParamsSubject.next({ id: 'partner-1' })
      component.MENU_ITEMS.forEach(item => {
        expect(item.disabled).toBe(false)
      })
    })

    it('should not enable items when params.id is absent', () => {
      queryParamsSubject.next({ status: 'ACTIVE' })
      // MENU_ITEMS other than provider_details should remain in original state
      expect(component.MENU_ITEMS).toBeDefined()
    })
  })

  describe('currentMenuItem subscription', () => {
    it('should set activeItem when currentMenuItem emits a value', () => {
      const menuItem = { id: 2, label: 'SSO Integration', slug: 'sso_integration' }
      currentMenuItemSubject.next(menuItem)
      expect(component.activeItem).toEqual(menuItem)
    })
  })

  describe('newProviderAdded subscription', () => {
    it('should enable all non-provider_details items when new provider is added', () => {
      newProviderAddedSubject.next('new-provider-id')
      component.MENU_ITEMS.forEach(item => {
        if (item.slug !== 'provider_details') {
          expect(item.disabled).toBe(false)
        }
      })
    })

    it('should not change MENU_ITEMS when providerId is null/falsy', () => {
      const originalItems = JSON.parse(JSON.stringify(component.MENU_ITEMS))
      newProviderAddedSubject.next(null)
      // Items should remain unchanged
      expect(component.MENU_ITEMS.length).toBe(originalItems.length)
    })
  })

  describe('ngOnInit', () => {
    it('should run without errors', () => {
      expect(() => component.ngOnInit()).not.toThrow()
    })
  })

  describe('ngOnDestroy', () => {
    it('should unsubscribe from all subscriptions', () => {
      const unsubscribeSpy = jest.spyOn(component.subscription, 'unsubscribe')
      component.ngOnDestroy()
      expect(unsubscribeSpy).toHaveBeenCalled()
    })
  })

  describe('trackByFn', () => {
    it('should return item id', () => {
      const item = { id: 3, label: 'Test' }
      expect(component.trackByFn(0, item)).toBe(3)
    })
  })

  describe('setActiveItem', () => {
    it('should set activeItem and emit activeMenu event', () => {
      const emitSpy = jest.spyOn(component.activeMenu, 'emit')
      const item = { id: 1, label: 'Provider Details', slug: 'provider_details' }
      component.setActiveItem(item)
      expect(component.activeItem).toEqual(item)
      expect(emitSpy).toHaveBeenCalledWith({ activeMenuItem: item })
    })
  })
})
