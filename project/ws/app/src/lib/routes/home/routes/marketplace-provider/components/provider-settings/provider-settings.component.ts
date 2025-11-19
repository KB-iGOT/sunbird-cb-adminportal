import { Component } from '@angular/core'
import { FormBuilder, FormGroup, } from '@angular/forms'

@Component({
  selector: 'ws-app-provider-settings',
  templateUrl: './provider-settings.component.html',
  styleUrls: ['./provider-settings.component.scss']
})
export class ProviderSettingsComponent {
  providerSettingsForm: FormGroup

  constructor(private fb: FormBuilder) {
    this.providerSettingsForm = this.fb.group({
      overAllLimit: [null],
      userWiseLimit: [null],
      concurrentLimit: [null],
      addKarmaPoint: [null],
    })
  }

  get controls() {
    return this.providerSettingsForm.controls
  }
}
