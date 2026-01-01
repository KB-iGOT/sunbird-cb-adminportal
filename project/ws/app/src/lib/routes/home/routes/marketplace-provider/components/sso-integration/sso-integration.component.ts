import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core'
import { SsoConfigureSettingsComponent } from '../sso-configure-settings/sso-configure-settings.component'
import { SsoConfiguration } from '../../models/configure-provider.model'
import { MatDialog } from '@angular/material/dialog'
import { LoadingPopupComponent } from '../../dialogs/loading-popup/loading-popup.component'
import { MarketplaceService } from '../../services/marketplace.service'
import { HttpErrorResponse } from '@angular/common/http'
import { SnackbarComponent } from '@sunbird-cb/consumption'
import { MatSnackBar } from '@angular/material/snack-bar'
import * as _ from 'lodash'


@Component({
  selector: 'ws-app-sso-integration',
  templateUrl: './sso-integration.component.html',
  styleUrls: ['./sso-integration.component.scss']
})
export class SsoIntegrationComponent implements OnInit {
  @Input() providerDetails: any
  @Output() loadProviderDetails = new EventEmitter<any>()

  @ViewChild('ssoConfigurationSettings') ssoConfigurationSettings!: SsoConfigureSettingsComponent
  ssoConfigurations: SsoConfiguration | null = null

  helpCenterGuide = {
    header: 'Note:- Content Upload Details: Video Guides and Tips.',
    guideNotes: [],
    helpVideoLink: `/assets/public/content/guide-videos/CIOS_Updated_demo.mp4`,
  }

  constructor(private dialog: MatDialog, private marketplaceService: MarketplaceService, private snackBar: MatSnackBar,) { }

  ngOnInit(): void {
    console.log(this.providerDetails)
  }

  updateCreateSSO() {
    if (this.ssoConfigurationSettings) {
      if (this.ssoConfigurationSettings.SSOConfigurationData) {
        this.ssoConfigurationSettings.updateSSOConfigurations()
      } else {
        this.ssoConfigurationSettings.createSSOConfigurations()
      }
    }
  }

  loadSSODetails(event: any) {
    this.ssoConfigurations = event
    this.loadProviderDetails.emit({ ...this.providerDetails, ssoDetails: event })
  }

  testSsoUrl() {
    const payload = {
      ...this.providerDetails,
      data: {
        ...this.providerDetails.data,
        isActive: true,
        isAuthenticate: true
      }
    }

    if (payload?.data?.contactName) {
      delete payload?.data?.contactName
    }

    const dialogRef = this.dialog.open(LoadingPopupComponent, {
      autoFocus: false,
      width: "345px",
      height: "164px",
      maxWidth: '80vw',
      maxHeight: '90vh',
      disableClose: true,
      data: {
        title: 'Testing SSO Connection',
        subtitle: 'Wait a second, Its processing….'
      }
    })

    this.marketplaceService.updateProvider(payload).subscribe({
      next: (response: any) => {
        if (response) {
          setTimeout(() => {
            dialogRef.close()
            this.loadProviderDetails.emit(true)
          }, 1000)
        }
      },
      error: (error: HttpErrorResponse) => {
        dialogRef.close()
        const errmsg = _.get(error, 'error.params.errMsg', 'Something went wrong, please try again later')
        this.showSnackBar(errmsg, 'error')
      },
    })
  }

  showSnackBar(message: string, type: 'error' | 'success') {
    this.snackBar.openFromComponent(SnackbarComponent, {
      data: {
        message: message, type: type,
      }, duration: 5000, panelClass: type,
    })
  }
}
