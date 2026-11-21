import { HttpErrorResponse } from '@angular/common/http'
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core'
import { MatIconRegistry } from '@angular/material/icon'
import { MatSnackBar } from '@angular/material/snack-bar'
import { DomSanitizer } from '@angular/platform-browser'
import { ActivatedRoute } from '@angular/router'
import { AccessControlComponent, NsAccessControlConfig } from '@sunbird-cb/access-settings'
import { SnackbarComponent } from '@sunbird-cb/consumption'
import { Observable, of } from 'rxjs'
import { switchMap, tap } from 'rxjs/operators'
import * as _ from 'lodash'
import { ACCESS_SETTINGS_ICONS, SPV_ACCESS_CONTROL_CONFIG } from '../../models/access-settings.model'
import { apiErrorMessage, MarketplaceService } from '../../services/marketplace.service'

// The Save of the library's SPV portal mode: the user groups to upsert (none for No), the enrolment check preference
// chosen and whether it differs from the saved one
interface ISpvSaveEvent {
  userGroup: any
  action?: string
  providerPreference?: boolean
  preferenceChanged?: boolean
}

// Access Settings: the provider access settings of @sunbird-cb/access-settings, in its SPV portal mode. The library draws
// the page and keeps its rules; this tab gives it the provider and its saved settings, and saves what it emits.
@Component({
  selector: 'ws-app-access-settings',
  templateUrl: './access-settings.component.html',
  standalone: false,
})
export class AccessSettingsComponent implements OnChanges {
  @Input() providerDetails?: any
  // asks the page to read the provider again once its enrolment check preference is saved
  @Output() loadProviderDetails = new EventEmitter<boolean>()
  @ViewChild(AccessControlComponent) accessControl?: AccessControlComponent

  // a copy for this page, the library changes its config as it goes
  accessControlConfig: NsAccessControlConfig.IAccessControlConfig = _.cloneDeep(SPV_ACCESS_CONTROL_CONFIG)
  spvProvider?: NsAccessControlConfig.ISpvProvider
  // the result of the provider access settings read: the saved user groups, what each has consumed, the licence totals
  savedSettings: NsAccessControlConfig.ISpvAccessSettings | null = null
  partnerId = ''

  private publishedCourseCount: number | null = null
  // access_settings of marcket_place.json: the most user groups, and what the Unaudited licences info icon says
  private readonly accessSettings: { allowGroupLimit?: number, unauditedlicencesinfo?: string, unauditedlicenceszeroinfo?: string }

  constructor(
    private marketPlaceSvc: MarketplaceService,
    private snackBar: MatSnackBar,
    iconRegistry: MatIconRegistry,
    domSanitizer: DomSanitizer,
    route: ActivatedRoute,
  ) {
    Object.keys(ACCESS_SETTINGS_ICONS).forEach(iconName =>
      iconRegistry.addSvgIconLiteral(iconName, domSanitizer.bypassSecurityTrustHtml(ACCESS_SETTINGS_ICONS[iconName])))
    this.accessSettings = _.get(route.snapshot, 'data.pageData.data.access_settings') || {}
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.providerDetails && changes.providerDetails.currentValue) {
      // the saved settings and the published courses are read once for a provider
      const partnerId = _.get(this.providerDetails, 'id', '')
      if (partnerId && partnerId !== this.partnerId) {
        this.partnerId = partnerId
        this.readSettings()
        this.countPublishedCourses(_.get(this.providerDetails, 'data.partnerCode', ''))
      }
      this.updateProvider()
    }
  }

  // Saves the enrolment check preference on the provider when it changed, then, for Yes, the user groups. A save that
  // fails stops there, and the library is told what the api says.
  onAccessControlData(event: ISpvSaveEvent): void {
    if (event?.action !== NsAccessControlConfig.SPV_SAVE_ACTION) {
      return
    }
    const preference = !!event.providerPreference
    const savePreference: Observable<unknown> = event.preferenceChanged
      ? this.marketPlaceSvc.updateProviderPreference(this.providerDetails, preference).pipe(
        // the page reads the provider again, so it has the preference as saved
        tap(() => this.loadProviderDetails.emit(true)))
      : of(null)
    savePreference.pipe(
      switchMap(() => preference ? this.marketPlaceSvc.upsertProviderAccessSettings(event.userGroup) : of(null)),
    ).subscribe({
      next: () => {
        this.accessControl?.completeSpvSave()
        // the groups this save created are given their ids by the api
        this.readSettings()
      },
      error: (error: HttpErrorResponse) => this.accessControl?.completeSpvSave(apiErrorMessage(error)),
    })
  }

  // The provider as the library takes it: its licences, the preference saved on it and its published courses
  private updateProvider(): void {
    const data = _.get(this.providerDetails, 'data') || {}
    const preference = _.get(data, 'providerPreference')
    this.spvProvider = {
      name: data.contentPartnerName || '',
      licenseType: data.licenseType || '',
      overAllLimit: Number(data.overAllLimit) || 0,
      consumedCount: Number(data.licenseConsumedCount) || 0,
      providerPreference: typeof preference === 'boolean' ? preference : null,
      publishedCourseCount: this.publishedCourseCount,
      userGroupLimit: Number(this.accessSettings.allowGroupLimit) || undefined,
      unauditedLicencesInfo: this.accessSettings.unauditedlicencesinfo,
      unauditedLicencesZeroInfo: this.accessSettings.unauditedlicenceszeroinfo,
    }
  }

  // A read that fails says what the api gives, and the page goes on as if nothing were saved
  private readSettings(): void {
    this.marketPlaceSvc.readProviderAccessSettings(this.partnerId).subscribe({
      next: (response: any) => this.savedSettings = _.get(response, 'result') || null,
      error: (error: HttpErrorResponse) => this.showToast(apiErrorMessage(error)),
    })
  }

  // The same count the published courses of the Courses tab show, read a single row at a time
  private countPublishedCourses(partnerCode: string): void {
    this.publishedCourseCount = null
    if (!partnerCode) {
      return
    }
    const formBody = { filterCriteriaMap: { partnerCode, status: ['live'] }, pageNumber: 0, pageSize: 1, searchString: '' }
    this.marketPlaceSvc.getCoursesList(formBody).subscribe({
      next: (response: any) => {
        this.publishedCourseCount = _.get(response, 'totalCount', null)
        this.updateProvider()
      },
      error: (error: HttpErrorResponse) => this.showToast(apiErrorMessage(error)),
    })
  }

  private showToast(message: string): void {
    this.snackBar.openFromComponent(SnackbarComponent, {
      data: { message, type: 'error' }, duration: 5000, panelClass: ['error', 'access-settings-toast'],
    })
  }
}
