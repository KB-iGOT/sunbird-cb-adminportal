import { HttpErrorResponse } from '@angular/common/http'
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core'
import { FormBuilder, FormControl, FormGroup } from '@angular/forms'
import { PageEvent } from '@angular/material/paginator'
import { MatSnackBar } from '@angular/material/snack-bar'
import { SnackbarComponent } from '@sunbird-cb/consumption'
import { forkJoin, Observable, of } from 'rxjs'
import { catchError } from 'rxjs/operators'
import * as _ from 'lodash'
import { apiErrorMessage, MarketplaceService } from '../../services/marketplace.service'

// A partner's alert recipient, with the day it was added to the list
export interface IAlertRecipient {
  name: string
  email: string
  addedOn: string
}

const MAX_THRESHOLDS = 5
// what the api allows when it doesn't say
const MAX_RECIPIENTS = 100
// the list comes whole from the api and is paged here, 20 to a page to start with
const RECIPIENT_PAGE_SIZES = [20, 50, 100]
// what a provider starts with until the api gives its thresholds
const DEFAULT_THRESHOLDS = [50, 75, 90, 100]
const EMAIL_PATTERN = /^[\w\-.+]+@([\w-]+\.)+[\w-]{2,}$/

// Licence Notifications: the consumption thresholds of the Over All Limit that send an alert, and the partner's
// recipients of those alerts
@Component({
  selector: 'ws-app-licence-notifications',
  templateUrl: './licence-notifications.component.html',
  styleUrls: ['./licence-notifications.component.scss'],
  standalone: false,
})
export class LicenceNotificationsComponent implements OnChanges {
  @Input() providerDetails?: any

  providerName = ''
  overAllLimit = 0
  consumedCount = 0

  thresholds: number[] = [...DEFAULT_THRESHOLDS]
  // the thresholds as last saved, or as the page opened; one taken off and added back is still one of them
  private savedThresholds: number[] = [...DEFAULT_THRESHOLDS]
  thresholdControl = new FormControl<number | null>(null)
  maxThresholds = MAX_THRESHOLDS
  alertsEnabled = true
  // while Save is being sent
  saving = false

  recipients: IAlertRecipient[] = []
  recipientForm: FormGroup
  maxRecipients = MAX_RECIPIENTS
  pageSizeOptions = RECIPIENT_PAGE_SIZES
  pageSize = RECIPIENT_PAGE_SIZES[0]
  pageIndex = 0

  private savedSignature = ''
  private partnerId = ''

  constructor(private fb: FormBuilder, private snackBar: MatSnackBar, private marketPlaceSvc: MarketplaceService) {
    this.recipientForm = this.fb.group({ name: [''], email: [''] })
    this.savedSignature = this.settingsSignature()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.providerDetails && changes.providerDetails.currentValue) {
      const details = changes.providerDetails.currentValue
      this.providerName = _.get(details, 'data.contentPartnerName', '')
      this.overAllLimit = _.get(details, 'data.overAllLimit', 0) || 0
      this.consumedCount = _.get(details, 'data.licenseConsumedCount', 0) || 0
      // the saved settings are read once for a provider
      const partnerId = _.get(details, 'id', '')
      if (partnerId && partnerId !== this.partnerId) {
        this.partnerId = partnerId
        this.loadSettings()
      }
    }
  }

  get consumedPercent(): number {
    return this.overAllLimit ? this.consumedCount / this.overAllLimit * 100 : 0
  }

  thresholdLicences(threshold: number): number {
    return Math.round(this.overAllLimit * threshold / 100)
  }

  // Up to 5 thresholds, each a whole number from 1 to 100 and set once; told in a toast when Add is pressed
  get thresholdError(): string {
    const value = this.thresholdControl.value
    if (value === null || value === undefined || String(value) === '') {
      return ''
    }
    if (!Number.isInteger(Number(value)) || value < 1 || value > 100) {
      return 'Enter a whole number from 1 to 100.'
    }
    if (this.thresholds.includes(Number(value))) {
      return `${value}% is already a threshold.`
    }
    if (this.thresholds.length >= MAX_THRESHOLDS) {
      return `Up to ${MAX_THRESHOLDS} thresholds. Remove one to add another.`
    }
    return ''
  }

  get isThresholdListFull(): boolean {
    return this.thresholds.length >= MAX_THRESHOLDS
  }

  // The note on crossed thresholds shows only once a new threshold is added that is already crossed (gets its tick);
  // the saved ones never bring it up
  get hasAddedCrossedThreshold(): boolean {
    return this.thresholds.some(threshold => !this.savedThresholds.includes(threshold) && this.isCrossed(threshold))
  }

  // A threshold consumption has reached is crossed (green, with a tick); the others are not reached yet
  isCrossed(threshold: number): boolean {
    return this.consumedPercent >= threshold
  }

  get canAddThreshold(): boolean {
    const value = this.thresholdControl.value
    return this.alertsEnabled && value !== null && value !== undefined && String(value) !== ''
  }

  // A wrong threshold stays in the field, to be corrected
  addThreshold(): void {
    if (!this.canAddThreshold) {
      return
    }
    const error = this.thresholdError
    if (error) {
      this.showToast(error, 'error')
      return
    }
    this.thresholds = _.sortBy([...this.thresholds, Number(this.thresholdControl.value)])
    this.thresholdControl.reset()
  }

  removeThreshold(threshold: number): void {
    this.thresholds = this.thresholds.filter(value => value !== threshold)
  }

  // Hovering a threshold tells whether its alert is sent: a crossed one has sent it, the others are not reached yet
  thresholdTooltip(threshold: number): string {
    return this.isCrossed(threshold) ? 'Alert sent' : 'Not reached yet'
  }

  // The recipients on the page shown, and where that page starts in the list
  get pagedRecipients(): IAlertRecipient[] {
    return this.recipients.slice(this.firstOnPage, this.firstOnPage + this.pageSize)
  }

  get firstOnPage(): number {
    return this.pageIndex * this.pageSize
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex
    this.pageSize = event.pageSize
  }

  // The list holds what the api allows (100) at most, said beside Add
  get isRecipientListFull(): boolean {
    return this.recipients.length >= this.maxRecipients
  }

  // What is wrong with the typed recipient, told in a toast when Add is pressed: the name first, then the e-mail id,
  // which has to be given, valid and not on the list yet
  get recipientError(): string {
    if (!(this.recipientForm.value.name || '').trim()) {
      return 'Enter a name.'
    }
    const email = this.typedEmail
    if (!email || !EMAIL_PATTERN.test(email)) {
      return 'Enter a valid email address.'
    }
    if (this.recipients.some(recipient => recipient.email === email)) {
      return 'That email is already on the list.'
    }
    return ''
  }

  // Add is on until the list is full; what is missing or wrong is told when it is pressed
  get canAddRecipient(): boolean {
    return !this.isRecipientListFull
  }

  // A wrong name or e-mail id stays in the field, to be corrected
  addRecipient(): void {
    if (!this.canAddRecipient) {
      return
    }
    const error = this.recipientError
    if (error) {
      this.showToast(error, 'error')
      return
    }
    this.recipients = [...this.recipients, {
      name: (this.recipientForm.value.name || '').trim(),
      email: this.typedEmail,
      addedOn: new Date().toISOString(),
    }]
    this.recipientForm.reset({ name: '', email: '' })
    // the page the new recipient lands on, at the end of the list
    this.pageIndex = Math.floor((this.recipients.length - 1) / this.pageSize)
  }

  // A name or e-mail id cut short with an ellipsis is shown in full on hover, with a pointer; one that fits gets no
  // tooltip and keeps the arrow
  showFullText(cell: HTMLElement): void {
    const truncated = cell.scrollWidth > cell.clientWidth
    cell.title = truncated ? (cell.textContent || '').trim() : ''
    cell.classList.toggle('truncated', truncated)
  }

  // index is the recipient's place in the whole list; a page left empty steps back to the one before
  removeRecipient(index: number): void {
    this.recipients = this.recipients.filter((_recipient, recipientIndex) => recipientIndex !== index)
    this.pageIndex = Math.min(this.pageIndex, Math.max(Math.ceil(this.recipients.length / this.pageSize) - 1, 0))
  }

  get hasUnsavedChanges(): boolean {
    return this.settingsSignature() !== this.savedSignature
  }

  get canSave(): boolean {
    return !this.saving && this.hasUnsavedChanges
  }

  // Saves the alerts switch, the thresholds (as an array of the percentages) and the recipients
  save(): void {
    if (!this.canSave) {
      return
    }
    this.saving = true
    const signature = this.settingsSignature()
    this.marketPlaceSvc.upsertNotificationSettings({
      partnerId: this.partnerId,
      alertsEnabled: this.alertsEnabled,
      thresholds: this.thresholds,
      recipients: this.recipients.map(({ name, email }) => (name ? { name, email } : { email })),
    }).subscribe({
      next: () => {
        this.saving = false
        this.savedSignature = signature
        this.savedThresholds = [...this.thresholds]
        this.showToast('Licence notifications saved successfully', 'success')
      },
      error: (error: HttpErrorResponse) => {
        this.saving = false
        this.showToast(apiErrorMessage(error), 'error')
      },
    })
  }

  private get typedEmail(): string {
    return (this.recipientForm.value.email || '').trim().toLowerCase()
  }

  // The saved settings, and what is consumed now from the licence totals of the provider access settings read
  private loadSettings(): void {
    forkJoin([
      this.orApiError(this.marketPlaceSvc.readNotificationSettings(this.partnerId)),
      this.orApiError(this.marketPlaceSvc.readProviderAccessSettings(this.partnerId)),
    ]).subscribe(([settings, accessSettings]) => {
      const saved = _.get(settings, 'result') || {}
      // a threshold comes as a number, or as { threshold }
      const items: any[] = saved.thresholds || DEFAULT_THRESHOLDS
      this.thresholds = _.sortBy(items.map(item => Number(_.isObject(item) ? _.get(item, 'threshold') : item)))
      this.savedThresholds = [...this.thresholds]
      this.alertsEnabled = saved.alertsEnabled !== false
      this.maxRecipients = saved.maxRecipients || MAX_RECIPIENTS
      this.recipients = (saved.recipients || []).map((recipient: any) => ({
        name: recipient.name || '',
        email: recipient.email,
        addedOn: recipient.addedOn,
      }))
      this.pageIndex = 0
      this.consumedCount = _.get(accessSettings, 'result.licence.consumed', this.consumedCount)
      this.savedSignature = this.settingsSignature()
    })
  }

  // A read that fails says what the api gives in an error toast, and the page goes on as if nothing were saved
  private orApiError(request: Observable<any>): Observable<any> {
    return request.pipe(catchError(error => {
      this.showToast(apiErrorMessage(error), 'error')
      return of(null)
    }))
  }

  private showToast(message: string, type: 'error' | 'success'): void {
    this.snackBar.openFromComponent(SnackbarComponent, {
      data: { message, type }, duration: 5000, panelClass: [type, 'licence-notifications-toast'],
    })
  }

  private settingsSignature(): string {
    return JSON.stringify([
      this.thresholds,
      this.alertsEnabled,
      this.recipients.map(recipient => [recipient.name, recipient.email]),
    ])
  }
}
