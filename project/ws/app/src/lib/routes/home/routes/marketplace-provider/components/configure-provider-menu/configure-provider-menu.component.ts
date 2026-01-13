import { Component, EventEmitter, OnInit, Output } from '@angular/core'
import { MARKETPLACE_CONFIGURE_PROVIDERS_MENU } from '../../models/menu.model'
import { MarketplaceService } from '../../services/marketplace.service'
import { ActivatedRoute } from '@angular/router'

@Component({
  selector: 'ws-app-configure-provider-menu',
  templateUrl: './configure-provider-menu.component.html',
  styleUrls: ['./configure-provider-menu.component.scss']
})
export class ConfigureProviderMenuComponent implements OnInit {
  @Output() activeMenu = new EventEmitter<any>();
  activeItem: any
  MENU_ITEMS = MARKETPLACE_CONFIGURE_PROVIDERS_MENU
  canOnlyView = false
  constructor(private marketplaceService: MarketplaceService, private activatedRoute: ActivatedRoute) {
    this.canOnlyView = this.activatedRoute.snapshot.queryParams.status === 'PENDING'
    if (this.canOnlyView) {
      this.MENU_ITEMS = this.MENU_ITEMS.filter(item => item.slug === 'provider_details')
    }
    this.marketplaceService.currentMenuItem.subscribe(menuItem => {
      this.activeItem = menuItem
    })
  }

  ngOnInit(): void {
  }

  trackByFn(_index: number, item: any): number {
    return item.id
  }

  setActiveItem(item: any) {
    this.activeItem = item
    this.activeMenu.emit({ activeMenuItem: this.activeItem })
  }
}
