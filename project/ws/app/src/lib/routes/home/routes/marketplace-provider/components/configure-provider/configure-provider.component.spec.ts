import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute } from '@angular/router'
import { BehaviorSubject, of } from 'rxjs'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'

import { ConfigureProviderComponent } from './configure-provider.component'
import { MarketplaceService } from '../../services/marketplace.service'
import { NavigationExternalService } from '../../../../../../../../../../../src/app/services/navigation-external.service'
import { MARKETPLACE_CONFIGURE_PROVIDERS_MENU } from '../../models/menu.model'

describe('ConfigureProviderComponent', () => {
  let component: ConfigureProviderComponent
  let fixture: ComponentFixture<ConfigureProviderComponent>
  let marketPlaceSvc: any

  beforeEach(() => {
    marketPlaceSvc = {
      currentMenuItem: new BehaviorSubject<any>(0),
      newProviderAdded: new BehaviorSubject<any>(null),
      providerSettingsSaved: new BehaviorSubject<boolean>(false),
      getProviderDetails: jest.fn().mockReturnValue(of({ result: { id: '1' } })),
    }
    TestBed.configureTestingModule({
      declarations: [ConfigureProviderComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { data: of({ providerDetails: { data: { result: { id: '1' } } } }), queryParams: of({}) } },
        { provide: MatSnackBar, useValue: { open: jest.fn(), openFromComponent: jest.fn() } },
        { provide: MarketplaceService, useValue: marketPlaceSvc },
        { provide: NavigationExternalService, useValue: { breadcrumnItems: new BehaviorSubject<any>([]) } },
        { provide: ConfigurationsService, useValue: { userRoles: new Set(['spv_admin']) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    fixture = TestBed.createComponent(ConfigureProviderComponent)
    component = fixture.componentInstance
    // ngAfterViewInit updates activeMenuItem, so skip the dev-mode checkNoChanges pass
    fixture.detectChanges(false)
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should set the first menu item as active after view init', () => {
    expect(component.activeMenuItem).toBe(MARKETPLACE_CONFIGURE_PROVIDERS_MENU[0].slug)
  })

  it('should update active menu on activeMenuItemEvent', () => {
    component.activeMenuItemEvent({ activeMenuItem: { slug: 'abc' } })
    expect(component.activeMenuItem).toBe('abc')
    expect(component.currentMenuDetails).toEqual({ slug: 'abc' })
  })

  describe('Provider settings saved', () => {
    it('should not count as saved while the provider has no saved settings', () => {
      expect(marketPlaceSvc.providerSettingsSaved.value).toBe(false)
    })

    it('should count as saved once the provider details carry a saved licence type and over all limit', () => {
      marketPlaceSvc.getProviderDetails.mockReturnValue(
        of({ result: { id: '1', data: { licenseType: 'Course', overAllLimit: 40000 } } }),
      )
      component.getProviderDetails(true)
      expect(marketPlaceSvc.providerSettingsSaved.value).toBe(true)
    })

    it('should not count as saved when only part of the provider settings is saved', () => {
      marketPlaceSvc.getProviderDetails.mockReturnValue(of({ result: { id: '1', data: { licenseType: 'Course' } } }))
      component.getProviderDetails(true)
      expect(marketPlaceSvc.providerSettingsSaved.value).toBe(false)
    })

    it('should be forgotten when the provider page is left', () => {
      marketPlaceSvc.providerSettingsSaved.next(true)
      component.ngOnDestroy()
      expect(marketPlaceSvc.providerSettingsSaved.value).toBe(false)
    })

    it('should forget the provider onboarded here when the page is left', () => {
      marketPlaceSvc.newProviderAdded.next('p1')
      component.ngOnDestroy()
      expect(marketPlaceSvc.newProviderAdded.value).toBeNull()
    })

    it('should open Provider Settings from the Access Settings page', () => {
      component.openProviderSettings()
      expect(component.activeMenuItem).toBe('provider_settings')
      expect(marketPlaceSvc.currentMenuItem.value.slug).toBe('provider_settings')
    })
  })

  describe('Opening a tab from the link (?tab=)', () => {
    // the tab the page opens on for a user with these roles (lower case, as ConfigurationsService keeps them)
    const openTab = (tab: string, userRoles: Set<string> | null) => {
      const page = new ConfigureProviderComponent(
        { data: of({}), queryParams: of({ tab }) } as any,
        {} as any,
        marketPlaceSvc,
        { breadcrumnItems: new BehaviorSubject<any>([]) } as any,
        { userRoles } as any,
      )
      page.ngAfterViewInit()
      return page.activeMenuItem
    }

    it('should open Access Settings and Licence Notifications for an SPV admin', () => {
      expect(openTab('access_settings', new Set(['spv_admin']))).toBe('access_settings')
      expect(openTab('licence_notifications', new Set(['spv_admin']))).toBe('licence_notifications')
      expect(marketPlaceSvc.currentMenuItem.value.slug).toBe('licence_notifications')
    })

    it('should keep a user who is not an SPV admin on Provider Details', () => {
      expect(openTab('access_settings', new Set(['mdo_admin']))).toBe('provider_details')
      expect(openTab('licence_notifications', null)).toBe('provider_details')
      expect(marketPlaceSvc.currentMenuItem.value.slug).toBe('provider_details')
    })

    it('should still open the other tabs for a user who is not an SPV admin', () => {
      expect(openTab('provider_settings', new Set(['mdo_admin']))).toBe('provider_settings')
    })
  })
})
