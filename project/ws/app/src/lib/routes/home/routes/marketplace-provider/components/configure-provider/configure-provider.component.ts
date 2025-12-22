import { Component, OnInit } from '@angular/core'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute } from '@angular/router'
import { Subscription } from 'rxjs'
import { MarketplaceService } from '../../services/marketplace.service'
import { HttpErrorResponse } from '@angular/common/http'
import * as _ from 'lodash'

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

  constructor(
    private activateRoute: ActivatedRoute,
    private snackBar: MatSnackBar,
    private marketPlaceSvc: MarketplaceService
  ) {
  }
  activeMenuItemEvent(event: any): void {
    this.currentMenuDetails = event.activeMenuItem
    this.activeMenuItem = event.activeMenuItem.slug
  }

  ngOnInit() {
    this.getRoutesData()
  }

  getRoutesData() {
    this.activateRoute.data.subscribe(data => {
      if (data.providerDetails && data.providerDetails.data) {
        this.disableCourseCatalog = false
        this.providerDetails = data.providerDetails.data.result
      }
      if (_.get(data, 'pageData.data.configureCertificateGuide')) {
        this.helpCenterGuide = _.get(data, 'pageData.data.configureCertificateGuide.helpCenterGuide', this.helpCenterGuide)
        this.instructionsList = _.get(data, 'pageData.data.configureCertificateGuide.instructions', this.instructionsList)
      }
    })
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
          this.showSnackBar(errmsg)
        },
      })
    }
  }

  showSnackBar(message: string) {
    this.snackBar.open(message)
  }

}
