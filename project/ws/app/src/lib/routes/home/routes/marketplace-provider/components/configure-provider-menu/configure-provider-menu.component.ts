import { Component, EventEmitter, OnInit, Output } from '@angular/core'
import { MARKETPLACE_CONFIGURE_PROVIDERS_MENU } from '../../constants/menu.constants'
// import { MarketplaceService } from '../../services/marketplace.service'

@Component({
  selector: 'ws-app-configure-provider-menu',
  templateUrl: './configure-provider-menu.component.html',
  styleUrls: ['./configure-provider-menu.component.scss']
})
export class ConfigureProviderMenuComponent implements OnInit {
  @Output() activeMenu = new EventEmitter<any>();

  activeItem: any
  MENU_ITEMS = MARKETPLACE_CONFIGURE_PROVIDERS_MENU

  constructor() {
    this.activeItem = this.MENU_ITEMS[4]
  }


  ngOnInit(): void {

    this.activeMenu.emit({ activeMenuItem: this.activeItem })
  }

  trackByFn(_index: number, item: any): number {
    return item.id
  }

  setActiveItem(item: any) {
    this.activeItem = item
    this.activeMenu.emit({ activeMenuItem: this.activeItem })
  }
}
