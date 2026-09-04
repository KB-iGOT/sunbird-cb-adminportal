import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { HttpErrorResponse } from '@angular/common/http'
import * as _ from 'lodash'
import { MarketplaceService } from '../../services/marketplace.service'
import { LoaderService } from '../../../../services/loader.service'

@Component({
  selector: 'ws-app-provider-settings',
  templateUrl: './provider-settings.component.html',
  styleUrls: ['./provider-settings.component.scss'],
  standalone: false
})
export class ProviderSettingsComponent implements OnChanges, OnInit {
  providerSettingsForm!: FormGroup
  @Input() providerDetails?: any
  @Output() loadProviderDetails = new EventEmitter<Boolean>()

  providerDetailsBeforeUpdate: any
  licenseTypeList = [
    { displayName: 'User', value: 'User' },
    { displayName: 'Course', value: 'Course' },
  ]
  overAllLimitMessage = ''
  licenseConsumedCount = 0
  groupsList: string[] = []

  constructor(
    private fb: FormBuilder,
    private marketPlaceSvc: MarketplaceService,
    private snackBar: MatSnackBar,
    private loaderService: LoaderService
  ) {
    this.initializeForm()
  }

  ngOnInit(): void {
    this.getGroupsList()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.providerDetails && changes.providerDetails.currentValue) {
      this.providerDetailsBeforeUpdate = JSON.parse(JSON.stringify(changes.providerDetails.currentValue))
      this.patchProviderSettings(changes.providerDetails.currentValue)
    }
  }

  initializeForm() {
    this.providerSettingsForm = this.fb.group({
      licenseType: ['User', [Validators.required]],
      overAllLimit: [{ value: null, disabled: true }, [Validators.min(1), Validators.max(100000000), Validators.required]],
      userWiseLimit: [null,],
      isUserWiseLimitEnabled: [false],
      concurrentLimit: [null,],
      isConcurrentLimitEnabled: [false],
      karmaPoints: [null,],
      addKarmaPointEnabled: [false],
      group: [{ value: null, disabled: true }],
      karmaPointsExemptionEnabled: [false],
    })

    this.controls['isConcurrentLimitEnabled'].valueChanges.subscribe((value) => {
      if (value) {
        if (this.controls['userWiseLimit'].enabled) {
          this.controls['concurrentLimit'].setValidators(
            [Validators.required, Validators.min(1), Validators.max(this.controls['userWiseLimit'].value)]
          )
        } else {
          this.controls['concurrentLimit'].setValidators(
            [Validators.required, Validators.min(1), Validators.max(this.controls['overAllLimit'].value)]
          )
        }
        this.controls['concurrentLimit'].enable()

      } else {
        this.controls['concurrentLimit'].clearValidators()
        this.controls['concurrentLimit'].disable()

      }
      this.controls['concurrentLimit'].updateValueAndValidity()
    })

    this.controls['overAllLimit'].valueChanges.subscribe((value) => {
      if (value) {
        if (!this.controls['userWiseLimit'].enabled && this.controls['concurrentLimit'].enabled) {
          this.controls['concurrentLimit'].setValidators(
            [Validators.required, Validators.min(1), Validators.max(this.controls['overAllLimit'].value)]
          )
          this.controls['concurrentLimit'].updateValueAndValidity()
        }
      }
    })


    this.controls['isUserWiseLimitEnabled'].valueChanges.subscribe((value) => {
      if (value) {
        this.controls['userWiseLimit'].setValidators([Validators.required, Validators.min(1), Validators.max(100000000)])
        this.controls['userWiseLimit'].enable()
        this.controls['userWiseLimit'].updateValueAndValidity()

      } else {
        this.controls['userWiseLimit'].clearValidators()
        this.controls['userWiseLimit'].disable()
        this.controls['userWiseLimit'].updateValueAndValidity()

        // Reset concurrent limit validators to use  when user wise limit is disabled
        if (!this.controls['userWiseLimit'].enabled && this.controls['concurrentLimit'].enabled) {
          this.controls['concurrentLimit'].setValidators(
            [Validators.required, Validators.min(1), Validators.max(this.controls['overAllLimit'].value)]
          )
          this.controls['concurrentLimit'].updateValueAndValidity()
        }
      }
    })

    this.controls['userWiseLimit'].valueChanges.subscribe((value) => {
      if (value) {
        this.controls['concurrentLimit'].setValidators(
          [Validators.required, Validators.min(1), Validators.max(this.controls['userWiseLimit'].value)]
        )
        this.controls['concurrentLimit'].updateValueAndValidity()
      }
    })

    this.controls['addKarmaPointEnabled'].valueChanges.subscribe((value) => {
      if (value) {
        this.controls['karmaPoints'].setValidators(
          [Validators.required, Validators.min(2), Validators.max(10000)]
        )
        this.controls['karmaPoints'].enable()

      } else {
        this.controls['karmaPoints'].clearValidators()
        this.controls['karmaPoints'].disable()

      }
      this.controls['karmaPoints'].updateValueAndValidity()
    })

    this.controls['karmaPointsExemptionEnabled'].valueChanges.subscribe((value) => {
      if (value) {
        this.controls['group'].setValidators([Validators.required])
        this.controls['group'].enable()

      } else {
        this.controls['group'].clearValidators()
        this.controls['group'].reset(null)
        this.controls['group'].disable()

      }
      this.controls['group'].updateValueAndValidity()
    })

    this.onLicenseTypeChange(this.controls['licenseType'].value)
  }

  getGroupsList() {
    this.marketPlaceSvc.getGroupsList().subscribe({
      next: (response: any) => {
        this.groupsList = _.get(response, 'result.response', [])
      },
      error: () => {
        this.groupsList = []
      },
    })
  }

  patchProviderSettings(providerDetails: any) {
    const licenseType = _.get(providerDetails, 'data.licenseType', null)
    this.licenseConsumedCount = _.get(providerDetails, 'data.licenseConsumedCount', 0)

    this.providerSettingsForm.patchValue({
      licenseType: licenseType || 'User',
      overAllLimit: _.get(providerDetails, 'data.overAllLimit', null) || null,
      userWiseLimit: _.get(providerDetails, 'data.userWiseLimit', null),
      isUserWiseLimitEnabled: _.get(providerDetails, 'data.isUserWiseLimitEnabled', false),
      concurrentLimit: _.get(providerDetails, 'data.concurrentLimit', null),
      isConcurrentLimitEnabled: _.get(providerDetails, 'data.isConcurrentLimitEnabled', false),
      karmaPoints: _.get(providerDetails, 'data.karmaPoints', null),
      addKarmaPointEnabled: _.get(providerDetails, 'data.addKarmaPointEnabled', false),
      group: _.get(providerDetails, 'data.karmaPointsExemption.group', null),
      karmaPointsExemptionEnabled: _.get(providerDetails, 'data.karmaPointsExemptionEnabled', false),
    })

    if (licenseType) {
      this.controls['licenseType'].disable()
    } else {
      this.controls['licenseType'].enable()
    }
    this.onLicenseTypeChange(this.controls['licenseType'].value)
  }

  get controls() {
    return this.providerSettingsForm.controls
  }

  onLicenseTypeChange(licenseType: string) {
    if (licenseType) {
      this.overAllLimitMessage = licenseType === 'User'
        ? 'Maximum total users allowed across all learners for this provider.'
        : 'Maximum total course enrolments allowed across all learners for this provider.'
      this.controls['overAllLimit'].enable()
    } else {
      this.overAllLimitMessage = ''
      this.controls['overAllLimit'].disable()
    }

    const minLimit = this.licenseConsumedCount > 0 ? this.licenseConsumedCount : 1
    this.controls['overAllLimit'].setValidators(
      [Validators.required, Validators.min(minLimit), Validators.max(100000000)]
    )
    this.controls['overAllLimit'].updateValueAndValidity()
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
      licenseType: formDetails.licenseType,
      overAllLimit: formDetails.overAllLimit,
      isUserWiseLimitEnabled: formDetails.isUserWiseLimitEnabled,
      isConcurrentLimitEnabled: formDetails.isConcurrentLimitEnabled,
      addKarmaPointEnabled: formDetails.addKarmaPointEnabled,
      karmaPointsExemptionEnabled: formDetails.karmaPointsExemptionEnabled,
    }

    if (formDetails.isUserWiseLimitEnabled && (formDetails.userWiseLimit || formDetails.userWiseLimit === 0)) {
      formBody.userWiseLimit = formDetails.userWiseLimit
    }

    if (formDetails.isConcurrentLimitEnabled && (formDetails.concurrentLimit || formDetails.userWiseLimit === 0)) {
      formBody.concurrentLimit = formDetails.concurrentLimit
    }

    if (formDetails.addKarmaPointEnabled && (formDetails.karmaPoints || formDetails.userWiseLimit === 0)) {
      formBody.karmaPoints = formDetails.karmaPoints
    }

    if (formDetails.karmaPointsExemptionEnabled && formDetails.group && formDetails.group.length) {
      formBody.karmaPointsExemption = { group: formDetails.group }
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

    this.providerDetailsBeforeUpdate['data']['licenseType'] = formDetails.licenseType
    this.providerDetailsBeforeUpdate['data']['overAllLimit'] = formDetails.overAllLimit
    this.providerDetailsBeforeUpdate['data']['isUserWiseLimitEnabled'] = formDetails.isUserWiseLimitEnabled
    this.providerDetailsBeforeUpdate['data']['isConcurrentLimitEnabled'] = formDetails.isConcurrentLimitEnabled
    this.providerDetailsBeforeUpdate['data']['addKarmaPointEnabled'] = formDetails.addKarmaPointEnabled
    this.providerDetailsBeforeUpdate['data']['karmaPointsExemptionEnabled'] = formDetails.karmaPointsExemptionEnabled

    if (formDetails.karmaPointsExemptionEnabled && formDetails.group && formDetails.group.length) {
      this.providerDetailsBeforeUpdate['data']['karmaPointsExemption'] = { group: formDetails.group }
    }

    if (formDetails.userWiseLimit || formDetails.userWiseLimit === 0) {
      this.providerDetailsBeforeUpdate['data']['userWiseLimit'] = formDetails.userWiseLimit
    }

    if (formDetails.concurrentLimit || formDetails.concurrentLimit === 0) {
      this.providerDetailsBeforeUpdate['data']['concurrentLimit'] = formDetails.concurrentLimit
    }

    if (formDetails.karmaPoints || formDetails.karmaPoints === 0) {
      this.providerDetailsBeforeUpdate['data']['karmaPoints'] = formDetails.karmaPoints
    }

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