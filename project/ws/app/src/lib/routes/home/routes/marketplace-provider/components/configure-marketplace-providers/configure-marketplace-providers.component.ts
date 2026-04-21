import { Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import * as _ from 'lodash'
import { MarketplaceService } from '../../services/marketplace.service'
import { MatSnackBar } from '@angular/material/snack-bar'
import { HttpErrorResponse } from '@angular/common/http'

@Component({
    selector: 'ws-app-configure-marketplace-providers',
    templateUrl: './configure-marketplace-providers.component.html',
    styleUrls: ['./configure-marketplace-providers.component.scss'],
    standalone: false
})
export class ConfigureMarketplaceProvidersComponent implements OnInit {

  widgetData = {
    titles: [
      { title: 'Marketplace Providers', url: '/app/home/marketplace-providers', path: '/app/home/marketplace-providers' },
      { title: 'Onboard Provider', url: 'none' },
      { title: 'Configure', url: 'none' },
    ],
  }
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

  getTablesData() { }

  showSnackBar(message: string) {
    this.snackBar.open(message)
  }

}
