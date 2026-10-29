import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { BehaviorSubject, of } from 'rxjs'

import { ConfigureProviderMenuComponent } from './configure-provider-menu.component'
import { MarketplaceService } from '../../services/marketplace.service'

describe('ConfigureProviderMenuComponent', () => {
  let component: ConfigureProviderMenuComponent
  let fixture: ComponentFixture<ConfigureProviderMenuComponent>
  let marketplaceService: any

  beforeEach(() => {
    marketplaceService = {
      currentMenuItem: new BehaviorSubject<any>(0),
      newProviderAdded: new BehaviorSubject<any>(null),
    }
    TestBed.configureTestingModule({
      declarations: [ConfigureProviderMenuComponent],
      providers: [
        { provide: MarketplaceService, useValue: marketplaceService },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
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
    expect(steps.map(step => step.textContent!.trim())).toEqual(component.MENU_ITEMS.map(item => item.label))

    steps[0].click()
    fixture.detectChanges()

    expect(spy).toHaveBeenCalledWith({ activeMenuItem: component.MENU_ITEMS[0] })
    expect(steps[0].classList.contains('active')).toBe(true)
  })

  it('should only expose provider details when the provider is pending', () => {
    const pendingMenu = new ConfigureProviderMenuComponent(
      marketplaceService,
      { queryParams: of({ status: 'PENDING' }) } as any,
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
})
