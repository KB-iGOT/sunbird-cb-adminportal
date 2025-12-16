import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { Clipboard } from '@angular/cdk/clipboard'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { MarketplaceService } from '../../services/marketplace.service'
import { SsoConfiguration } from '../../models/configure-provider.model'
import { MatSnackBar } from '@angular/material/snack-bar'
import { SnackbarComponent } from '@sunbird-cb/consumption'
import { GlobalEventsService } from '../../../../../../../../../../../src/app/services/global-events.service'

@Component({
  selector: 'ws-app-sso-configure-settings',
  templateUrl: './sso-configure-settings.component.html',
  styleUrls: ['./sso-configure-settings.component.scss']
})
export class SsoConfigureSettingsComponent implements OnInit {
  @Input() providerDetails: any
  @Output() loadSSODetails = new EventEmitter<any>()

  callbackUrlCopied = false
  redirectUrlCopied = false
  testSSOConnectionVisible = false

  ssoProtocolsList = [{
    name: 'SAML', value: 'saml'
  }]
  ssoSettingsForm!: FormGroup

  acsUrl = new FormControl('')
  ssoTestUrl = new FormControl('')
  status = new FormControl(false)

  SSOConfigurationData: SsoConfiguration | null = null
  constructor(private clipboard: Clipboard, private formBuilder: FormBuilder, private marketplaceService: MarketplaceService, private snackBar: MatSnackBar,
    private loaderService: GlobalEventsService

  ) {
    this.initializeForm()
  }

  ngOnInit(): void {
    this.fetchSSOSettings()
  }

  initializeForm() {
    this.ssoSettingsForm = this.formBuilder.group({
      clientId: ['', [Validators.required]],
      partnerName: ['', [Validators.required]],
      ssoProtocol: ['saml', [Validators.required]],
      ssoUrl: ['', [Validators.required]],
      emailAttribute: ['', [Validators.required]],
      firstNameAttribute: ['', [Validators.required]],
      lastNameAttribute: ['', [Validators.required]],
      userIdAttribute: ['', [Validators.required]],
    })
  }

  copy(type: string, value: string) {
    this.clipboard.copy(value)
    switch (type) {
      case 'callback':
        this.callbackUrlCopied = true
        setTimeout(() => this.callbackUrlCopied = false, 1000)
        break
      case 'redirect':
        this.redirectUrlCopied = true
        setTimeout(() => this.redirectUrlCopied = false, 1000)
        break

    }
  }

  fetchSSOSettings() {
    if (this.providerDetails && this.providerDetails.id) {
      this.loaderService.setLoaderState(true)

      this.marketplaceService.getSSOConfiguration(this.providerDetails.id).subscribe({
        next: (response: any) => {
          if (response && response.params?.status === 'success' && Object.keys(response?.result?.ssoData || {}).length > 0) {
            this.SSOConfigurationData = response?.result?.ssoData
            this.loadSSODetails.emit(this.SSOConfigurationData)
            this.ssoSettingsForm.patchValue({
              clientId: this.SSOConfigurationData?.clientId,
              partnerName: this.SSOConfigurationData?.partnerName,
              ssoProtocol: this.SSOConfigurationData?.ssoProtocol,
              ssoUrl: this.SSOConfigurationData?.ssoUrl,
              emailAttribute: this.SSOConfigurationData?.emailAttribute,
              firstNameAttribute: this.SSOConfigurationData?.firstNameAttribute,
              lastNameAttribute: this.SSOConfigurationData?.lastNameAttribute,
              userIdAttribute: this.SSOConfigurationData?.userIdAttribute,
            })

            this.status.setValue(this.SSOConfigurationData?.status || false)
            this.acsUrl.setValue(this.SSOConfigurationData?.acsUrl || '')
            this.ssoTestUrl.setValue(this.SSOConfigurationData?.ssoTestUrl || '')
          }
          this.loaderService.setLoaderState(false)

        }, error: () => {
          this.loaderService.setLoaderState(false)
        }
      })
    }
  }

  createSSOConfigurations() {
    if (this.ssoSettingsForm.invalid) {
      return
    }
    this.loaderService.setLoaderState(true)
    const payload = {
      ...this.ssoSettingsForm.value,
      status: this.status.value,
      acsUrl: this.acsUrl.value,
      ssoTestUrl: this.ssoTestUrl.value
    }

    this.marketplaceService.createSSOConfiguration(this.providerDetails.id, payload).subscribe({
      next: (response: any) => {
        if (response && response.params?.status === 'success') {
          this.fetchSSOSettings()
          this.showSnackBar('SSO Configuration created successfully', 'success')
        } else {
          this.showSnackBar(response?.params?.errmsg || 'Failed to create SSO Configuration', 'error')
        }
        this.loaderService.setLoaderState(false)
      }, error: () => {
        this.loaderService.setLoaderState(false)
      }
    })
  }

  updateSSOConfigurations() {
    if (this.ssoSettingsForm.invalid) {
      return
    }
    this.loaderService.setLoaderState(true)

    const payload = {
      ...this.ssoSettingsForm.value,
      status: this.status.value,
      acsUrl: this.acsUrl.value,
      ssoTestUrl: this.ssoTestUrl.value,
      ssoId: this.SSOConfigurationData?.ssoId || '',
      configuration: this.SSOConfigurationData?.configuration || '',
    }

    this.marketplaceService.updateSSOConfiguration(this.providerDetails.id, payload).subscribe({
      next: (response: any) => {
        if (response && response.params?.status === 'success') {
          this.fetchSSOSettings()
          this.showSnackBar('SSO Configuration updated successfully', 'success')
        } else {
          this.showSnackBar(response?.params?.errmsg || 'Failed to create SSO Configuration', 'error')
        }
        this.loaderService.setLoaderState(false)

      }, error: () => {
        this.loaderService.setLoaderState(false)
      }
    })
  }

  updateCreateSSO() {
    if (this.SSOConfigurationData) {
      this.updateSSOConfigurations()
    } else {
      this.createSSOConfigurations()
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
