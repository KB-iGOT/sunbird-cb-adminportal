import { Component, EventEmitter, Input, Output } from '@angular/core'

@Component({
  selector: 'ws-app-sso-integration',
  templateUrl: './sso-integration.component.html',
  styleUrls: ['./sso-integration.component.scss']
})
export class SsoIntegrationComponent {
  @Input() providerDetails: any
  @Output() loadProviderDetails = new EventEmitter<any>()
}
