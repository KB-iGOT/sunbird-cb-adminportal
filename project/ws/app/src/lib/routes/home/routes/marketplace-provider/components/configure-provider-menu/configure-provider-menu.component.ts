import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core'
import { MARKETPLACE_CONFIGURE_PROVIDERS_MENU } from '../../models/menu.model'
import { MarketplaceService } from '../../services/marketplace.service'
import { ActivatedRoute } from '@angular/router'
import { Subscription } from 'rxjs'

@Component({
  selector: 'ws-app-configure-provider-menu',
  templateUrl: './configure-provider-menu.component.html',
  styleUrls: ['./configure-provider-menu.component.scss']
})
export class ConfigureProviderMenuComponent implements OnInit, OnDestroy {
  @Output() activeMenu = new EventEmitter<any>();
  activeItem: any
  MENU_ITEMS = MARKETPLACE_CONFIGURE_PROVIDERS_MENU
  canOnlyView = false
  subscription: Subscription = new Subscription()
  constructor(private marketplaceService: MarketplaceService, private activatedRoute: ActivatedRoute) {
    this.canOnlyView = this.activatedRoute.snapshot.queryParams.status === 'PENDING'
    if (this.canOnlyView) {
      this.MENU_ITEMS = this.MENU_ITEMS.filter(item => item.slug === 'provider_details')
    }

    this.subscription.add(
      this.marketplaceService.currentMenuItem.subscribe(menuItem => {
        this.activeItem = menuItem
      })
    )

    this.subscription.add(
      this.marketplaceService.newProviderAdded.subscribe(providerId => {
        if (providerId) {
          this.MENU_ITEMS = this.MENU_ITEMS.map(items => {
            if (items.slug !== 'provider_details') {
              items.disabled = false
            }
            return items
          })
        }
      })
    )
  }

  ngOnInit(): void {
    if (!this.activatedRoute.snapshot.queryParams?.id) {
      this.MENU_ITEMS = this.MENU_ITEMS.map(items => {
        if (items.slug !== 'provider_details') {
          items.disabled = true
        }
        return items
      })
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }

  trackByFn(_index: number, item: any): number {
    return item.id
  }

  setActiveItem(item: any) {
    this.activeItem = item
    this.activeMenu.emit({ activeMenuItem: this.activeItem })
  }
}
