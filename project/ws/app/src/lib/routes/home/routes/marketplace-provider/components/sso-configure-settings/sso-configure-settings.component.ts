import { Component } from '@angular/core'
import { Clipboard } from '@angular/cdk/clipboard'

@Component({
  selector: 'ws-app-sso-configure-settings',
  templateUrl: './sso-configure-settings.component.html',
  styleUrls: ['./sso-configure-settings.component.scss']
})
export class SsoConfigureSettingsComponent {
  callbackUrlCopied = false
  metadataUrlCopied = false
  entityIdCopied = false
  constructor(private clipboard: Clipboard) { }

  copy(type: string, value: string) {
    this.clipboard.copy(value)
    switch (type) {
      case 'callback':
        this.callbackUrlCopied = true
        setTimeout(() => this.callbackUrlCopied = false, 1000)
        break
      case 'metadata':
        this.metadataUrlCopied = true
        setTimeout(() => this.metadataUrlCopied = false, 1000)
        break
      case 'entityId':
        this.entityIdCopied = true
        setTimeout(() => this.entityIdCopied = false, 1000)
        break

    }
  }
}
