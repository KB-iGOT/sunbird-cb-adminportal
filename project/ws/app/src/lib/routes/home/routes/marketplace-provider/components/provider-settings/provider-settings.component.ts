import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { HttpErrorResponse } from '@angular/common/http'
import * as _ from 'lodash'
import { MarketplaceService } from '../../services/marketplace.service'
import { LoaderService } from '../../../../services/loader.service'

@Component({
  selector: 'ws-app-provider-settings',
  templateUrl: './provider-settings.component.html',
  styleUrls: ['./provider-settings.component.scss']
})
export class ProviderSettingsComponent implements OnChanges {
  providerSettingsForm!: FormGroup
  @Input() providerDetails?: any
  @Output() loadProviderDetails = new EventEmitter<Boolean>()

  providerDetailsBeforeUpdate: any

  constructor(
    private fb: FormBuilder,
    private marketPlaceSvc: MarketplaceService,
    private snackBar: MatSnackBar,
    private loaderService: LoaderService
  ) {
    this.initializeForm()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.providerDetails && changes.providerDetails.currentValue) {
      this.providerDetailsBeforeUpdate = JSON.parse(JSON.stringify(changes.providerDetails.currentValue))
      this.patchProviderSettings(changes.providerDetails.currentValue)
    }
  }

  initializeForm() {
    this.providerSettingsForm = this.fb.group({
      overAllLimit: [null, [Validators.required, Validators.pattern(/^[0-9]*$/)]],
      userWiseLimit: [null, [Validators.pattern(/^[0-9]*$/)]],
      isUserWiseLimitEnabled: [false],
      concurrentLimit: [null, [Validators.pattern(/^[0-9]*$/)]],
      isConcurrentLimitEnabled: [false],
      karmaPoints: [null, [Validators.pattern(/^[0-9]*$/)]],
      addKarmaPointEnabled: [false],
    })

    this.controls['isUserWiseLimitEnabled'].valueChanges.subscribe((value) => {
      if (value) {
        this.controls['userWiseLimit'].setValidators([Validators.required, Validators.pattern(/^[0-9]*$/)])
        this.controls['userWiseLimit'].enable()

      } else {
        this.controls['userWiseLimit'].clearValidators()
        this.controls['userWiseLimit'].disable()

      }
      this.controls['userWiseLimit'].updateValueAndValidity()
    })

    this.controls['isConcurrentLimitEnabled'].valueChanges.subscribe((value) => {
      if (value) {
        this.controls['concurrentLimit'].setValidators([Validators.required, Validators.pattern(/^[0-9]*$/)])
        this.controls['concurrentLimit'].enable()

      } else {
        this.controls['concurrentLimit'].clearValidators()
        this.controls['concurrentLimit'].disable()

      }
      this.controls['concurrentLimit'].updateValueAndValidity()
    })

    this.controls['addKarmaPointEnabled'].valueChanges.subscribe((value) => {
      if (value) {
        this.controls['karmaPoints'].setValidators([Validators.required, Validators.pattern(/^[0-9]*$/)])
        this.controls['karmaPoints'].enable()

      } else {
        this.controls['karmaPoints'].clearValidators()
        this.controls['karmaPoints'].disable()

      }
      this.controls['karmaPoints'].updateValueAndValidity()
    })
  }

  patchProviderSettings(providerDetails: any) {
    this.providerSettingsForm.patchValue({
      overAllLimit: _.get(providerDetails, 'data.overAllLimit', null),
      userWiseLimit: _.get(providerDetails, 'data.userWiseLimit', null),
      isUserWiseLimitEnabled: _.get(providerDetails, 'data.isUserWiseLimitEnabled', false),
      concurrentLimit: _.get(providerDetails, 'data.concurrentLimit', null),
      isConcurrentLimitEnabled: _.get(providerDetails, 'data.isConcurrentLimitEnabled', false),
      karmaPoints: _.get(providerDetails, 'data.karmaPoints', null),
      addKarmaPointEnabled: _.get(providerDetails, 'data.addKarmaPointEnabled', false),
    })
  }

  get controls() {
    return this.providerSettingsForm.controls
  }

  submit() {
    if (this.providerFormGroup.valid) {
      if (this.providerDetails && this.providerDetails.id) {
        this.updateProviderSettings()
      } else {
        this.createProviderSettings()
      }
    } else {
      this.showSnackBar('Please fill all the mandatory fields with proper data')
    }
  }

  createProviderSettings() {
    this.loaderService.changeLoad.next(true)
    const formDetails = this.providerSettingsForm.getRawValue()
    const formBody: any = {
      overAllLimit: formDetails.overAllLimit,
      userWiseLimit: formDetails.isUserWiseLimitEnabled ? formDetails.userWiseLimit : null,
      isUserWiseLimitEnabled: formDetails.isUserWiseLimitEnabled,
      concurrentLimit: formDetails.isConcurrentLimitEnabled ? formDetails.concurrentLimit : null,
      isConcurrentLimitEnabled: formDetails.isConcurrentLimitEnabled,
      karmaPoints: formDetails.addKarmaPointEnabled ? formDetails.karmaPoints : null,
      addKarmaPointEnabled: formDetails.addKarmaPointEnabled,
    }

    this.marketPlaceSvc.createProvider(formBody).subscribe({
      next: (response: any) => {
        this.loaderService.changeLoad.next(false)
        if (response) {
          const successMsg = 'Provider settings saved successfully'
          this.showSnackBar(successMsg)
          this.sendDetailsUpdateEvent()
        }
      },
      error: (error: HttpErrorResponse) => {
        this.loaderService.changeLoad.next(false)
        const errmsg = _.get(error, 'error.params.errMsg', 'Something went wrong, please try again later')
        this.showSnackBar(errmsg)
      },
    })
  }

  updateProviderSettings() {
    this.loaderService.changeLoad.next(true)
    const formDetails = this.providerSettingsForm.getRawValue()

    this.providerDetailsBeforeUpdate['data']['overAllLimit'] = formDetails.overAllLimit
    this.providerDetailsBeforeUpdate['data']['userWiseLimit'] = formDetails.userWiseLimit
    this.providerDetailsBeforeUpdate['data']['isUserWiseLimitEnabled'] = formDetails.isUserWiseLimitEnabled
    this.providerDetailsBeforeUpdate['data']['concurrentLimit'] = formDetails.concurrentLimit
    this.providerDetailsBeforeUpdate['data']['isConcurrentLimitEnabled'] = formDetails.isConcurrentLimitEnabled
    this.providerDetailsBeforeUpdate['data']['karmaPoints'] = formDetails.karmaPoints
    this.providerDetailsBeforeUpdate['data']['addKarmaPointEnabled'] = formDetails.addKarmaPointEnabled

    this.marketPlaceSvc.updateProvider(this.providerDetailsBeforeUpdate).subscribe({
      next: (response: any) => {
        this.loaderService.changeLoad.next(false)
        if (response) {
          const successMsg = 'Provider settings updated successfully'
          this.showSnackBar(successMsg)
          this.sendDetailsUpdateEvent()
        }
      },
      error: (error: HttpErrorResponse) => {
        this.loaderService.changeLoad.next(false)
        const errmsg = _.get(error, 'error.params.errMsg', 'Something went wrong, please try again later')
        this.showSnackBar(errmsg)
      },
    })
  }

  sendDetailsUpdateEvent() {
    this.loadProviderDetails.emit(true)
  }

  showSnackBar(message: string) {
    this.snackBar.open(message)
  }

  private get providerFormGroup(): FormGroup {
    return this.providerSettingsForm
  }
}
