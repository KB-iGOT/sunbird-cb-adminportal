import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { BehaviorSubject, of } from 'rxjs'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'

import { ConfigureProviderMenuComponent } from './configure-provider-menu.component'
import { MarketplaceService } from '../../services/marketplace.service'

describe('ConfigureProviderMenuComponent', () => {
  let component: ConfigureProviderMenuComponent
  let fixture: ComponentFixture<ConfigureProviderMenuComponent>
  let marketplaceService: any
  // the logged in user, an SPV admin unless a test says otherwise; ConfigurationsService keeps roles in lower case
  let configSvc: any

  beforeEach(() => {
    marketplaceService = {
      currentMenuItem: new BehaviorSubject<any>(0),
      newProviderAdded: new BehaviorSubject<any>(null),
    }
    configSvc = { userRoles: new Set(['spv_admin']) }
    TestBed.configureTestingModule({
      declarations: [ConfigureProviderMenuComponent],
      providers: [
        { provide: MarketplaceService, useValue: marketplaceService },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
        { provide: ConfigurationsService, useValue: configSvc },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    fixture = TestBed.createComponent(ConfigureProviderMenuComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should track current menu item from service', () => {
    marketplaceService.currentMenuItem.next({ slug: 'x' })
    expect(component.activeItem).toEqual({ slug: 'x' })
  })

  it('should emit active menu on setActiveItem', () => {
    const spy = jest.spyOn(component.activeMenu, 'emit')
    component.setActiveItem({ slug: 'y' })
    expect(spy).toHaveBeenCalledWith({ activeMenuItem: { slug: 'y' } })
  })

  it('should render a step per menu item and emit the clicked item', () => {
    const spy = jest.spyOn(component.activeMenu, 'emit')
    const steps: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('li.step-item'))
    // the label alone, the new tabs carry a NEW badge too
    expect(steps.map(step => step.querySelector('.step-item-label')!.textContent!.trim()))
      .toEqual(component.MENU_ITEMS.map(item => item.label))

    steps[0].click()
    fixture.detectChanges()

    expect(spy).toHaveBeenCalledWith({ activeMenuItem: component.MENU_ITEMS[0] })
    expect(steps[0].classList.contains('active')).toBe(true)
  })

  it('should only expose provider details when the provider is pending', () => {
    const pendingMenu = new ConfigureProviderMenuComponent(
      marketplaceService,
      { queryParams: of({ status: 'PENDING' }) } as any,
      configSvc,
    )
    expect(pendingMenu.canOnlyView).toBe(true)
    expect(pendingMenu.MENU_ITEMS.map(item => item.slug)).toEqual(['provider_details'])
  })

  it('should stop tracking the menu item and return the item id for trackBy after destroy', () => {
    expect(component.trackByFn(0, { id: 3 })).toBe(3)
    component.ngOnDestroy()
    marketplaceService.currentMenuItem.next({ slug: 'z' })
    expect(component.subscription.closed).toBe(true)
    expect(component.activeItem).not.toEqual({ slug: 'z' })
  })

  describe('Access Settings and Licence Notifications', () => {
    const newTabs = ['access_settings', 'licence_notifications']
    const tabs = (menu: ConfigureProviderMenuComponent) =>
      newTabs.map(slug => menu.MENU_ITEMS.find(item => item.slug === slug))

    it('should be the last menu items, flagged as new', () => {
      const lastItems = component.MENU_ITEMS.slice(-2)
      expect(lastItems.map(item => item.slug)).toEqual(newTabs)
      expect(lastItems.every(item => item.isNew)).toBe(true)
    })

    it('should stay disabled while a new provider is being onboarded', () => {
      expect(tabs(component).every(item => item?.disabled)).toBe(true)
    })

    it('should be enabled with the other tabs for an existing provider, Over All Limit set or not', () => {
      const menu = new ConfigureProviderMenuComponent(marketplaceService, { queryParams: of({ id: 'p1' }) } as any, configSvc)
      expect(tabs(menu).every(item => !item?.disabled)).toBe(true)
    })

    it('should be enabled with the other tabs once a new provider is added', () => {
      marketplaceService.newProviderAdded.next('p1')
      expect(tabs(component).every(item => !item?.disabled)).toBe(true)
    })

    it('should be hidden from a user who is not an SPV admin, the other tabs staying as they are', () => {
      const menu = new ConfigureProviderMenuComponent(
        marketplaceService, { queryParams: of({ id: 'p1' }) } as any, { userRoles: new Set(['mdo_admin', 'spv_publisher']) } as any,
      )
      expect(menu.MENU_ITEMS.map(item => item.slug))
        .toEqual(['provider_details', 'sso_integration', 'active_courses', 'configure_certificate', 'provider_settings'])
      expect(menu.MENU_ITEMS.every(item => !item.disabled)).toBe(true)
    })

    it('should be hidden while the roles of the user are not known', () => {
      const menu = new ConfigureProviderMenuComponent(marketplaceService, { queryParams: of({}) } as any, { userRoles: null } as any)
      expect(tabs(menu)).toEqual([undefined, undefined])
    })

    it('should not be drawn in the menu of a user who is not an SPV admin', () => {
      configSvc.userRoles = new Set(['mdo_admin'])
      const menuFixture = TestBed.createComponent(ConfigureProviderMenuComponent)
      menuFixture.detectChanges()
      const labels = Array.from(menuFixture.nativeElement.querySelectorAll('li.step-item .step-item-label'))
        .map((label: any) => label.textContent.trim())
      expect(labels).toEqual(['Provider Details', 'Integration', 'Course Onboarding', 'Configure Certificate', 'Provider Settings'])
      expect(menuFixture.nativeElement.querySelector('.new-badge')).toBeNull()
    })
  })

  it('should keep a new onboarding to Provider Details after an existing provider was opened', () => {
    const existing = new ConfigureProviderMenuComponent(marketplaceService, { queryParams: of({ id: 'p1' }) } as any, configSvc)
    expect(existing.MENU_ITEMS.filter(item => !item.disabled).length).toBe(7)

    const onboarding = new ConfigureProviderMenuComponent(marketplaceService, { queryParams: of({}) } as any, configSvc)
    expect(onboarding.MENU_ITEMS.filter(item => !item.disabled).map(item => item.slug)).toEqual(['provider_details'])
  })
})
