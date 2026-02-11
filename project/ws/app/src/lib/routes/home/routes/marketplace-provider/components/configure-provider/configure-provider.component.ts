import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute } from '@angular/router'
import { Subscription } from 'rxjs'
import { MarketplaceService } from '../../services/marketplace.service'
import { HttpErrorResponse } from '@angular/common/http'
import * as _ from 'lodash'
import { MARKETPLACE_CONFIGURE_PROVIDERS_MENU } from '../../models/menu.model'
import { NavigationExternalService } from '../../../../../../../../../../../src/app/services/navigation-external.service'
import { SnackbarComponent } from '@sunbird-cb/consumption'

@Component({
    selector: 'ws-app-configure-provider',
    templateUrl: './configure-provider.component.html',
    styleUrls: ['./configure-provider.component.scss'],
    standalone: false
})
export class ConfigureProviderComponent implements OnInit, OnDestroy, AfterViewInit {
  opened: boolean = true
  currentMenuDetails: any
  menuSubscription: Subscription = new Subscription()
  activeMenuItem: any

  routerParams: any
  selectedIndex = 0
  providerDetails: any
  disableCourseCatalog = true

  helpCenterGuide = {
    header: 'Content Upload Details: Video Guides and Tips',
    guideNotes: [
      `Upload the certificate using a SVG file.`,
    ],
    helpVideoLink: `/assets/public/content/guide-videos/CIOS_Updated_demo.mp4`,
  }

  instructionsList = [
    'Please ensure the Certificate file is named correctly'
  ]

  routeSubscription: Subscription = new Subscription()
  constructor(
    private activateRoute: ActivatedRoute,
    private snackBar: MatSnackBar,
    private marketPlaceSvc: MarketplaceService,
    private externalsvc: NavigationExternalService,
  ) {
  }

  activeMenuItemEvent(event: any): void {
    this.currentMenuDetails = event.activeMenuItem
    this.activeMenuItem = event.activeMenuItem.slug
  }

  ngOnInit() {
    this.getRoutesData()
  }

  ngAfterViewInit(): void {
    this.activeMenuItem = MARKETPLACE_CONFIGURE_PROVIDERS_MENU[0].slug
    this.marketPlaceSvc.currentMenuItem.next(MARKETPLACE_CONFIGURE_PROVIDERS_MENU[0])

    this.routeSubscription.add(
      this.activateRoute.queryParams.subscribe(params => {
        this.routerParams = params
        if (params['tab']) {
          const menuItem = MARKETPLACE_CONFIGURE_PROVIDERS_MENU.find(item => item.slug === params['tab'])
          if (menuItem) {
            this.activeMenuItem = menuItem.slug
            this.marketPlaceSvc.currentMenuItem.next(menuItem)
          }
        }
      })
    )
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe()
      this.externalsvc.breadcrumnItems.next([])
    }
  }

  getRoutesData() {
    this.routeSubscription.add(
      this.activateRoute.data.subscribe(data => {
        if (data.providerDetails && data.providerDetails.error) {
          this.showSnackBar(data.providerDetails.error, 'error')
        }
        if (data.providerDetails && data.providerDetails.data) {
          this.disableCourseCatalog = false
          this.providerDetails = data.providerDetails.data.result
        }
        if (_.get(data, 'pageData.data.configureCertificateGuide')) {
          this.helpCenterGuide = _.get(data, 'pageData.data.configureCertificateGuide.helpCenterGuide', this.helpCenterGuide)
          this.instructionsList = _.get(data, 'pageData.data.configureCertificateGuide.instructions', this.instructionsList)
        }

        this.externalsvc.breadcrumnItems.next(
          [
            {
              label: 'Content Marketplace',
              route: '/app/home/marketplace-providers',
              active: false
            },
            {
              label: this.providerDetails?.data?.contentPartnerName || 'New Provider',
              active: true
            }
          ]
        )
      })
    )
  }

  getProviderDetails(event: any) {
    if (this.providerDetails && this.providerDetails.id && event) {
      const providerId = this.providerDetails.id
      this.providerDetails = null
      this.marketPlaceSvc.getProviderDetails(providerId).subscribe({
        next: (responce: any) => {
          this.disableCourseCatalog = false
          this.providerDetails = responce.result
        },
        error: (error: HttpErrorResponse) => {
          const errmsg = _.get(error, 'error.params.errMsg', 'Something went worng, please try again later')
          this.showSnackBar(errmsg, 'error')
        },
      })
    }
  }


  showSnackBar(message: string, type: 'error' | 'success') {
    this.snackBar.openFromComponent(SnackbarComponent, {
      data: {
        message: message, type: type,
      }, duration: 5000, panelClass: type,
    })
  }

}
