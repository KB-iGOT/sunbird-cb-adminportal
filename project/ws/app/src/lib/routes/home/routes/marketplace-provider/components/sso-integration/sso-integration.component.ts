import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core'
import { SsoConfigureSettingsComponent } from '../sso-configure-settings/sso-configure-settings.component'
import { SsoConfiguration } from '../../models/configure-provider.model'

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

  ngOnInit(): void { }

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
    if (this.ssoConfigurations && this.ssoConfigurations.ssoTestUrl) {
      window.open(this.ssoConfigurations.ssoTestUrl, '_blank')
    }
  }
}
