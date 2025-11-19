import { Component, OnInit } from '@angular/core'
import { Subscription } from 'rxjs'
// import { MARKETPLACE_CONFIGURE_PROVIDERS_MENU } from '../../constants/menu.constants'
// import { MarketplaceService } from '../../services/marketplace.service'

@Component({
  selector: 'ws-app-configure-provider',
  templateUrl: './configure-provider.component.html',
  styleUrls: ['./configure-provider.component.scss']
})
export class ConfigureProviderComponent implements OnInit {
  opened: boolean = true
  currentMenuDetails: any
  menuSubscription: Subscription = new Subscription()
  activeMenuItem: any

  // constructor(private marketplaceService: MarketplaceService) { }

  ngOnInit(): void {
  }

  activeMenuItemEvent(event: any): void {
    this.currentMenuDetails = event.activeMenuItem
    this.activeMenuItem = event.activeMenuItem.slug
  }

}
