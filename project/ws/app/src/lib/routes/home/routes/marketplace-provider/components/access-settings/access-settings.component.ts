import { HttpErrorResponse } from '@angular/common/http'
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, TemplateRef, ViewChild } from '@angular/core'
import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidationErrors } from '@angular/forms'
import { MatDialog, MatDialogRef } from '@angular/material/dialog'
import { MatIconRegistry } from '@angular/material/icon'
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar'
import { SnackbarComponent } from '@sunbird-cb/consumption'
import { DomSanitizer } from '@angular/platform-browser'
import { ActivatedRoute } from '@angular/router'
import { forkJoin, Observable, of, Subscription } from 'rxjs'
import { catchError, map, switchMap, tap } from 'rxjs/operators'
import * as _ from 'lodash'
import { apiErrorMessage, MarketplaceService } from '../../services/marketplace.service'
import { ConformationPopupComponent } from '../../dialogs/conformation-popup/conformation-popup.component'
import { EntitySelectionDialogComponent, toUserSelection } from '../../dialogs/entity-selection-dialog/entity-selection-dialog.component'
import {
  ACCESS_SETTINGS_ICONS,
  COLUMN_LAYOUT_ENTITIES,
  DEFAULT_UNAUDITED_LICENCES_INFO,
  DEFAULT_UNAUDITED_LICENCES_ZERO_INFO,
  DEFAULT_USER_GROUP_LIMIT,
  ENROLMENT_CHECK_OPTIONS,
  IAccessSettingsState,
  ICadreSelections,
  IDistributionSegment,
  ISelectionDialogData,
  ISelectionItem,
  IUserGroupEntity,
  IUserGroupState,
  LIMITED_SELECTION_ENTITIES,
  MAX_SELECTIONS,
  USER_FILTER_KEYS,
  USER_GROUP_COLOURS,
  USER_GROUP_ENTITIES,
  UserGroupEntity,
  VERIFICATION_STATUS_OPTIONS,
} from '../../models/access-settings.model'

// a user group holds at least 1 licence
const MIN_GROUP_LICENCES = 1

@Component({
  selector: 'ws-app-access-settings',
  templateUrl: './access-settings.component.html',
  styleUrls: ['./access-settings.component.scss'],
  standalone: false,
})
export class AccessSettingsComponent implements OnChanges, OnDestroy {
  @Input() providerDetails?: any
  // asks the page to read the provider again once its enrolment check preference is saved
  @Output() loadProviderDetails = new EventEmitter<boolean>()
  @ViewChild('deleteConfirm', { static: true }) deleteConfirm!: TemplateRef<unknown>
  @ViewChild('saveConfirm', { static: true }) saveConfirm!: TemplateRef<unknown>
  @ViewChild('preferenceChangeConfirm', { static: true }) preferenceChangeConfirm!: TemplateRef<unknown>

  userGroupsForm: FormGroup
  entities: IUserGroupEntity[] = USER_GROUP_ENTITIES
  // the most user groups a provider can have, access_settings.allowGroupLimit of marcket_place.json
  userGroupLimit = DEFAULT_USER_GROUP_LIMIT
  // what the info icon of the Unaudited licences tile says, access_settings.unauditedlicencesinfo of marcket_place.json
  unauditedLicencesInfo = DEFAULT_UNAUDITED_LICENCES_INFO
  // and what it says while there are none, access_settings.unauditedlicenceszeroinfo of marcket_place.json
  unauditedLicencesZeroInfo = DEFAULT_UNAUDITED_LICENCES_ZERO_INFO

  // Required, and left unanswered until it is chosen: user groups are only set here when enrolment is checked here
  enrolmentCheckOptions = ENROLMENT_CHECK_OPTIONS
  checksEnrolmentHere: boolean | null = null

  providerName = ''
  // the provider's published courses, every user group applies to all of them; null until they are counted
  publishedCourseCount: number | null = null
  licenseType = ''
  overAllLimit = 0
  consumedCount = 0
  // Licences used while the enrolment check preference was No, which no user group has a count of (result.licence.unaudited)
  unauditedCount = 0
  // Licences handed to the user groups, and how they split the over all limit
  allocatedToGroups = 0
  segments: IDistributionSegment[] = []
  // the Unaudited licences' share of the bar
  unauditedWidth = 0

  // while Save is being sent
  saving = false
  // Save was pressed while a user group still lacked a condition, which is then said under the group
  saveAttempted = false

  // The settings as last saved, or as the page opened when nothing is saved yet
  private savedState!: IAccessSettingsState
  private savedSignature = ''
  // The enrolment check preference as the provider has it saved (data.providerPreference), null until it is saved.
  // The first save confirms the choice, and a later change of it is confirmed too.
  private savedPreference: boolean | null = null
  // The provider the settings are read for and saved to, and the version of its saved access control
  private partnerId = ''
  private accessControlVersion = 1

  // The users each group matches, read from the user search whenever its conditions change
  private userCounts = new WeakMap<AbstractControl, number>()
  private userCountRequests = new WeakMap<AbstractControl, Subscription>()
  // Asks for the Over All Limit while it isn't set, at the bottom of this tab only
  private overAllLimitToast?: MatSnackBarRef<SnackbarComponent>

  // Groups take from the pool in priority order, so a group may take what the groups before it leave, and never
  // less than the licences its learners have already consumed. Only the group that overflows the pool is flagged,
  // the ones before it keep what they hold.
  private licenceValidator = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value
    if (value === null || value === undefined || value === '') {
      return { required: true }
    }

    // whole numbers from 1 up
    const licences = Number(value)
    if (!Number.isInteger(licences) || licences < MIN_GROUP_LICENCES) {
      return { invalidLicence: true }
    }

    const group = control.parent
    const consumed = group ? this.consumedOf(group) : 0
    if (licences < consumed) {
      return { belowConsumed: { consumed } }
    }
    const available = this.maxLicencesOf(group)
    return licences > available ? { exceedsLimit: { available } } : null
  }

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private marketPlaceSvc: MarketplaceService,
    private snackBar: MatSnackBar,
    iconRegistry: MatIconRegistry,
    domSanitizer: DomSanitizer,
    route: ActivatedRoute,
  ) {
    Object.keys(ACCESS_SETTINGS_ICONS).forEach(iconName =>
      iconRegistry.addSvgIconLiteral(iconName, domSanitizer.bypassSecurityTrustHtml(ACCESS_SETTINGS_ICONS[iconName])))
    const groupLimit = Number(_.get(route.snapshot, 'data.pageData.data.access_settings.allowGroupLimit'))
    if (Number.isInteger(groupLimit) && groupLimit > 0) {
      this.userGroupLimit = groupLimit
    }
    const unauditedInfo = _.get(route.snapshot, 'data.pageData.data.access_settings.unauditedlicencesinfo')
    if (typeof unauditedInfo === 'string' && unauditedInfo.trim()) {
      this.unauditedLicencesInfo = unauditedInfo.trim()
    }
    const unauditedZeroInfo = _.get(route.snapshot, 'data.pageData.data.access_settings.unauditedlicenceszeroinfo')
    if (typeof unauditedZeroInfo === 'string' && unauditedZeroInfo.trim()) {
      this.unauditedLicencesZeroInfo = unauditedZeroInfo.trim()
    }
    this.userGroupsForm = this.fb.group({ userGroups: this.fb.array([]) })
    this.userGroupsForm.valueChanges.subscribe(() => this.updateDistribution())
    this.markSaved()
  }

  get userGroups(): FormArray {
    return this.userGroupsForm.get('userGroups') as FormArray
  }

  // "all 20 SIMPLILEARN courses", without the number while the courses are not counted
  get providerCourses(): string {
    const courses = (word: string) => this.providerName ? `${this.providerName} ${word}` : `${word} of this provider`
    if (!this.publishedCourseCount) {
      return `all ${courses('courses')}`
    }
    return this.publishedCourseCount === 1
      ? `the 1 ${courses('course')}`
      : `all ${this.publishedCourseCount.toLocaleString('en-US')} ${courses('courses')}`
  }

  // Anything changed since the last save, or since the page opened when nothing is saved yet
  get hasUnsavedChanges(): boolean {
    return this.settingsSignature() !== this.savedSignature
  }

  // Save is offered once the Over All Limit is set, something has changed and the enrolment check preference is chosen
  get canOfferSave(): boolean {
    return !this.saving && !!this.overAllLimit && this.hasUnsavedChanges && this.checksEnrolmentHere !== null
  }

  // and saves only once everything required is filled in: when enrolment is checked here, user groups that have
  // conditions, all selecting something, and whose licences fit, together and each
  get canSave(): boolean {
    if (!this.canOfferSave) {
      return false
    }
    return !this.checksEnrolmentHere || (this.userGroups.length > 0 && !this.overAllocatedCount && this.userGroups.controls.every(group => {
      const conditions = (group.get('conditions') as FormArray).controls
      return !!group.get('licences')?.valid && conditions.length > 0
        && conditions.every(condition => !!condition.get('entity')?.value && this.selectedCount(condition) > 0)
    }))
  }

  // The shared pool: what the user groups and the unaudited licences leave of the over all limit
  get unallocatedCount(): number {
    return Math.max(this.overAllLimit - this.allocatedToGroups - this.unauditedCount, 0)
  }

  // How far the groups together, with the unaudited licences, go past the over all limit, shown in place of the
  // unallocated licences
  get overAllocatedCount(): number {
    return Math.max(this.allocatedToGroups + this.unauditedCount - this.overAllLimit, 0)
  }

  // the Unaudited licences' share of the over all limit, one decimal
  get unauditedPercent(): string {
    return (this.overAllLimit ? this.unauditedCount / this.overAllLimit * 100 : 0).toFixed(1)
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.providerDetails && changes.providerDetails.currentValue) {
      const details = changes.providerDetails.currentValue
      this.providerName = _.get(details, 'data.contentPartnerName', '')
      this.countPublishedCourses(_.get(details, 'data.partnerCode', ''))
      this.licenseType = _.get(details, 'data.licenseType', '')
      this.overAllLimit = _.get(details, 'data.overAllLimit', 0) || 0
      this.consumedCount = _.get(details, 'data.licenseConsumedCount', 0) || 0
      this.revalidateLicences()
      this.updateDistribution()
      if (!this.overAllLimit) {
        // duration 0 overrides the app's 5 second default, so the toast stays while this tab is open
        this.overAllLimitToast = this.snackBar.openFromComponent(SnackbarComponent, {
          data: { message: 'Set the Over All Limit in Provider Settings first', type: 'error' }, duration: 0,
          panelClass: ['error', 'over-all-limit-toast'],
        })
      }
      // the saved settings are read once for a provider
      const partnerId = _.get(details, 'id', '')
      if (partnerId && partnerId !== this.partnerId) {
        this.partnerId = partnerId
        this.loadSettings()
      }
    }
  }

  ngOnDestroy(): void {
    this.overAllLimitToast?.dismiss()
  }

  // The saved preference, said beside the question once there is one
  get savedPreferenceTitle(): string {
    return this.enrolmentCheckOptions.find(option => option.value === this.savedPreference)?.title || ''
  }

  // A saved preference switched to the other choice, warned about until it is saved or put back
  get isChangingPreference(): boolean {
    return this.savedPreference !== null && this.checksEnrolmentHere !== this.savedPreference
  }

  conditions(groupIndex: number): FormArray {
    return this.userGroups.at(groupIndex).get('conditions') as FormArray
  }

  // A new group needs licences left to be given: none are while the pool is used up or over-allocated
  get canAddUserGroup(): boolean {
    return this.userGroups.length < this.userGroupLimit && this.unallocatedCount > 0
  }

  // A new, empty group, up to the user group limit, or a saved one put back as it was saved
  addUserGroup(saved?: IUserGroupState): void {
    if (!saved && !this.canAddUserGroup) {
      return
    }
    const group = this.fb.group({
      id: [saved ? saved.id : undefined],
      name: [saved ? saved.name : `User Group ${this.userGroups.length + 1}`],
      // a new group starts empty, to be given at least 1 licence
      licences: [saved ? saved.licences : null, [this.licenceValidator]],
      // enrolments already made against the group, read from the saved access settings once they are saved
      consumed: [saved ? saved.consumed : 0],
      conditions: this.fb.array(saved ? saved.conditions.map(condition => this.createCondition(condition)) : [this.createCondition()]),
    })
    // what one group takes changes what is left for the others
    group.get('licences')?.valueChanges.subscribe(() => this.revalidateLicences())
    group.get('consumed')?.valueChanges.subscribe(() => {
      this.lockConditions(group)
      this.revalidateLicences()
    })
    this.userGroups.push(group)
    this.userCounts.set(group, 0)
    this.lockConditions(group)
    if (saved) {
      this.refreshUserCount(this.userGroups.length - 1)
    }
  }

  groupColour(groupIndex: number): string {
    return USER_GROUP_COLOURS[groupIndex % USER_GROUP_COLOURS.length]
  }

  userCountOf(group: AbstractControl): number {
    return this.userCounts.get(group) || 0
  }

  // while the group's users are being counted
  isCounting(group: AbstractControl): boolean {
    const request = this.userCountRequests.get(group)
    return !!request && !request.closed
  }

  licencesOf(group: AbstractControl): number {
    return Math.max(Number(group.get('licences')?.value) || 0, 0)
  }

  // A number field takes e, + and any number of - for exponents and signs; licences take one - at most, so a
  // negative number is still told it isn't a licence count. A field holding only - reads as empty, but bad input.
  blockSignAndExponentKeys(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement
    const isSecondMinus = event.key === '-' && (input.value.includes('-') || input.validity.badInput)
    if (['e', 'E', '+'].includes(event.key) || isSecondMinus) {
      event.preventDefault()
    }
  }

  licencePercent(group: AbstractControl): string {
    return (this.overAllLimit ? this.licencesOf(group) / this.overAllLimit * 100 : 0).toFixed(1)
  }

  // The most a group can take: what the groups before it in priority order and the unaudited licences leave of the
  // over all limit
  maxLicencesOf(group: AbstractControl | null | undefined): number {
    return Math.max(this.overAllLimit - this.unauditedCount - this.earlierGroupLicences(group), 0)
  }

  availableOf(group: AbstractControl): number {
    return Math.max(this.licencesOf(group) - this.consumedOf(group), 0)
  }

  // How much of its licences a group has consumed, for its progress bar
  consumedPercent(group: AbstractControl): number {
    const licences = this.licencesOf(group)
    return licences ? Math.min(this.consumedOf(group) / licences * 100, 100) : 0
  }

  // Shown once the field has been touched, and again if another group later takes its share of the pool
  licenceErrorMessage(group: AbstractControl): string {
    const control = group.get('licences')
    if (!control || control.valid) {
      return ''
    }
    // what has been used can't be taken back, said even when the licences were not just changed
    if (control.hasError('belowConsumed')) {
      const consumed = control.getError('belowConsumed').consumed.toLocaleString('en-US')
      return `Can't be lower than licences already used (${consumed}). Only unused licences can be removed.`
    }
    if (!(control.dirty || control.touched)) {
      return ''
    }
    if (control.hasError('exceedsLimit')) {
      return `Only ${control.getError('exceedsLimit').available.toLocaleString('en-US')} unallocated licences available`
    }
    if (control.hasError('required')) {
      return 'Enter the licences for this group.'
    }
    return 'Enter a whole number of licences.'
  }

  // Licences beyond the users a group matches can't be used by it. Said once the group selects anyone, so a new
  // group is not warned about while its conditions are being set. A group matching nobody is told that instead.
  idleLicencesWarning(group: AbstractControl): string {
    const licences = this.licencesOf(group)
    const users = this.userCountOf(group)
    if (!this.groupHasSelections(group) || !users || licences <= users) {
      return ''
    }
    const matching = users === 1 ? '1 user matches' : `${users.toLocaleString('en-US')} users match`
    return `${licences.toLocaleString('en-US')} licences allocated but only ${matching} this group. `
      + `${(licences - users).toLocaleString('en-US')} licences may sit idle.`
  }

  // Once what is selected has been counted, a group that matches nobody is warned about; it can still be saved
  matchesNoUsers(group: AbstractControl): boolean {
    return this.groupHasSelections(group) && !this.isCounting(group) && !this.userCountOf(group)
  }

  // A group learners have enrolled through is in use: its conditions are locked and it can't be deleted
  consumedOf(group: AbstractControl): number {
    return Number(group.get('consumed')?.value) || 0
  }

  // The fewest licences a group can hold: 1, or what its learners have already consumed when that is more
  minLicencesOf(group: AbstractControl): number {
    return Math.max(this.consumedOf(group), MIN_GROUP_LICENCES)
  }

  isInUse(group: AbstractControl): boolean {
    return this.consumedOf(group) > 0
  }

  // The conditions of a saved group (one the api has given an id) or of a group in use are locked: they are only
  // shown, and can't be changed, added, deleted or cleared. Its licences can still be changed.
  areConditionsLocked(group: AbstractControl): boolean {
    return !!group.get('id')?.value || this.isInUse(group)
  }

  // A group in use with no licence left: learners matching only this group can't enrol until its allocation is raised
  isExhausted(group: AbstractControl): boolean {
    return this.isInUse(group) && !this.availableOf(group)
  }

  removeUserGroup(groupIndex: number): void {
    const group = this.userGroups.at(groupIndex)
    if (this.isInUse(group)) {
      return
    }
    const removeGroup = () => {
      this.userGroups.removeAt(groupIndex)
      this.userGroups.controls.forEach((control, index) => control.get('name')?.setValue(`User Group ${index + 1}`))
      // the licences of the deleted group are free again
      this.revalidateLicences()
    }

    if (this.groupHasSelections(group)) {
      this.confirmDelete(group.get('name')?.value, removeGroup)
    } else {
      removeGroup()
    }
  }

  resetUserGroup(groupIndex: number): void {
    if (this.areConditionsLocked(this.userGroups.at(groupIndex))) {
      return
    }
    this.conditions(groupIndex).controls.forEach(condition => this.clearCondition(condition))
    this.refreshUserCount(groupIndex)
  }

  addCondition(groupIndex: number): void {
    if (this.canAddCondition(groupIndex)) {
      this.conditions(groupIndex).push(this.createCondition())
    }
  }

  // A group needs a condition with its entity chosen; said under Add New Condition until it has one, also when every
  // condition was deleted
  hasCondition(group: AbstractControl): boolean {
    return (group.get('conditions') as FormArray).controls.some(condition => !!condition.get('entity')?.value)
  }

  // Add New Condition stays disabled until the last condition has a selection, once every entity but User is in use
  // (User is never combined), after users are picked and for a group in use. A group whose every condition was
  // deleted can start again.
  canAddCondition(groupIndex: number): boolean {
    const conditions = this.conditions(groupIndex)
    const lastCondition = conditions.at(conditions.length - 1)
    const combinableEntities = this.entities.filter(entity => entity.value !== UserGroupEntity.User).length
    return (!lastCondition || this.selectedCount(lastCondition) > 0)
      && conditions.length < combinableEntities
      && !this.hasUserCondition(groupIndex)
      && !this.areConditionsLocked(this.userGroups.at(groupIndex))
  }

  removeCondition(groupIndex: number, conditionIndex: number): void {
    if (this.areConditionsLocked(this.userGroups.at(groupIndex))) {
      return
    }
    const conditions = this.conditions(groupIndex)
    const removeCondition = () => {
      conditions.removeAt(conditionIndex)
      this.refreshUserCount(groupIndex)
    }

    if (conditions.at(conditionIndex).get('selections')?.value?.length) {
      this.confirmDelete('this condition', removeCondition)
    } else {
      removeCondition()
    }
  }

  resetCondition(groupIndex: number, conditionIndex: number): void {
    if (this.areConditionsLocked(this.userGroups.at(groupIndex))) {
      return
    }
    this.clearCondition(this.conditions(groupIndex).at(conditionIndex))
    this.refreshUserCount(groupIndex)
  }

  // An entity can be used once in a user group, so the ones taken by the other conditions are not offered. User is
  // offered only while it would be the group's one condition: not once the group has a second condition, unless this
  // condition already holds it.
  availableEntities(groupIndex: number, conditionIndex: number): IUserGroupEntity[] {
    const conditions = this.conditions(groupIndex).controls
    const ownEntity = conditions[conditionIndex]?.get('entity')?.value
    const usedEntities = conditions
      .filter((_condition, index) => index !== conditionIndex)
      .map(condition => condition.get('entity')?.value)
    return this.entities.filter(entity => !usedEntities.includes(entity.value)
      && (entity.value !== UserGroupEntity.User || conditions.length === 1 || ownEntity === UserGroupEntity.User))
  }

  // Cadre is not offered to a group whose services have no cadres, the creation portal leaves it out the same way
  isEntityDisabled(groupIndex: number, entity: string): boolean {
    if (entity !== UserGroupEntity.Cadre) {
      return false
    }
    const services = this.cadreSelectionsOf(this.userGroups.at(groupIndex)).services
    return services.length > 0 && !this.marketPlaceSvc.hasCadres(services)
  }

  onEntityChange(groupIndex: number, conditionIndex: number): void {
    this.conditions(groupIndex).at(conditionIndex).get('selections')?.setValue([])
    this.refreshUserCount(groupIndex)
  }

  // the most a User, Organisation or Designation condition selects, none for the others
  selectionLimitOf(condition: AbstractControl): number {
    return LIMITED_SELECTION_ENTITIES.includes(condition.get('entity')?.value) ? MAX_SELECTIONS : 0
  }

  selectedCount(condition: AbstractControl): number {
    return condition.get('selections')?.value?.length || 0
  }

  manageSelection(groupIndex: number, conditionIndex: number, showSelected = false): void {
    const group = this.userGroups.at(groupIndex)
    const condition = this.conditions(groupIndex).at(conditionIndex)
    const entity = condition.get('entity')?.value
    if (!entity) {
      return
    }

    // the services, cadres and batches offered are narrowed by the group's other picks of them, the users offered
    // by every other condition of the group
    const dialogRef = this.openEntitySelection({
      entity,
      showSelected,
      selected: condition.get('selections')?.value || [],
      entityLabel: this.entities.find(item => item.value === entity)?.label || '',
      narrowBy: this.cadreSelectionsOf(group),
      filters: this.conditionFilters(group, condition),
      // what a saved group or a group in use selects is only shown, it can't be changed
      readOnly: this.areConditionsLocked(group),
    })
    dialogRef.afterClosed().subscribe((selected?: ISelectionItem[]) => {
      if (selected) {
        condition.get('selections')?.setValue(selected)
        this.refreshUserCount(groupIndex)
      }
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
      },
      error: (error: HttpErrorResponse) => {
        this.publishedCourseCount = null
        this.showToast(apiErrorMessage(error), 'error')
      },
    })
  }

  // The entity of a condition can't be changed once the group is saved or in use
  private lockConditions(group: AbstractControl): void {
    const locked = this.areConditionsLocked(group)
    const conditions = group.get('conditions') as FormArray
    conditions.controls.forEach(condition => {
      const entity = condition.get('entity')
      if (locked) {
        entity?.disable({ emitEvent: false })
      } else {
        entity?.enable({ emitEvent: false })
      }
    })
  }

  // What the groups before the given one hold, the priority being the order the groups were created in. A group
  // not in the list yet comes after all of them.
  private earlierGroupLicences(group: AbstractControl | null | undefined): number {
    const controls = this.userGroups.controls
    const index = group ? controls.indexOf(group) : -1
    return controls
      .slice(0, index < 0 ? controls.length : index)
      .reduce((total, earlierGroup) => total + this.licencesOf(earlierGroup), 0)
  }

  private refreshUserCount(groupIndex: number): void {
    const group = this.userGroups.at(groupIndex)
    this.userCountRequests.get(group)?.unsubscribe()

    const filters = this.getUserFilters(group)
    if (!filters) {
      this.userCounts.set(group, 0)
      return
    }

    this.userCountRequests.set(group, this.marketPlaceSvc.getUserCount(filters).subscribe({
      next: (response: any) => this.userCounts.set(group, _.get(response, 'result.response.count', 0)),
      error: (error: HttpErrorResponse) => {
        this.userCounts.set(group, 0)
        this.showToast(apiErrorMessage(error), 'error')
      },
    }))
  }

  // Every condition that has something selected narrows the users of the group, nothing selected means no count
  private getUserFilters(group: AbstractControl): { [key: string]: any } | null {
    const filters = this.conditionFilters(group)
    return Object.keys(filters).length ? { ...filters, status: 1 } : null
  }

  // The user search filters of the conditions of a group, leaving out the one given
  private conditionFilters(group: AbstractControl, skippedCondition?: AbstractControl): { [key: string]: any } {
    const filters: { [key: string]: any } = {}
    const conditions = group.get('conditions') as FormArray
    conditions.controls
      .filter(condition => condition !== skippedCondition)
      .forEach(condition => {
        const entity = condition.get('entity')?.value
        const values = this.selectionValues(condition)
        if (USER_FILTER_KEYS[entity] && values.length) {
          // the batch of a user profile is a year, kept as a number
          filters[USER_FILTER_KEYS[entity]] = entity === UserGroupEntity.Batch ? values.map(Number) : values
        }
      })
    return filters
  }

  // What the group selects of services, cadres and batches, each of them narrows what the other two offer
  private cadreSelectionsOf(group: AbstractControl): ICadreSelections {
    const conditions = group.get('conditions') as FormArray
    const valuesOf = (entity: string) => {
      const condition = conditions.controls.find(control => control.get('entity')?.value === entity)
      return condition ? this.selectionValues(condition) : []
    }
    return {
      services: valuesOf(UserGroupEntity.Service),
      cadres: valuesOf(UserGroupEntity.Cadre),
      batchYears: valuesOf(UserGroupEntity.Batch).map(Number),
    }
  }

  private selectionValues(condition: AbstractControl): string[] {
    const selections: ISelectionItem[] = condition.get('selections')?.value || []
    return selections.map(selection => selection.value)
  }

  // A group whose users are picked one by one takes no further condition, the same as in the creation portal; it is
  // said in place of Add New Condition once User is chosen
  hasUserCondition(groupIndex: number): boolean {
    return this.conditions(groupIndex).controls.some(condition => condition.get('entity')?.value === UserGroupEntity.User)
  }

  // Every popup opens as wide as the creation portal opens it: the Users table widest, the conditions laid out in
  // columns a little narrower, the plain lists narrower still
  private openEntitySelection(data: ISelectionDialogData): MatDialogRef<EntitySelectionDialogComponent> {
    let width = COLUMN_LAYOUT_ENTITIES.includes(data.entity) ? '1032px' : '720px'
    if (data.entity === UserGroupEntity.User) {
      width = '1090px'
    }
    return this.dialog.open(EntitySelectionDialogComponent, {
      data,
      width,
      autoFocus: false,
      maxWidth: '90vw',
      maxHeight: '90vh',
      disableClose: true,
    })
  }

  private revalidateLicences(): void {
    this.userGroups.controls.forEach(group => group.get('licences')?.updateValueAndValidity({ emitEvent: false }))
  }

  private updateDistribution(): void {
    const groups = this.userGroups.controls.map((group, index) => ({
      name: group.get('name')?.value,
      licences: this.licencesOf(group),
      colour: this.groupColour(index),
    }))
    this.allocatedToGroups = groups.reduce((total, group) => total + group.licences, 0)

    // the bar never outgrows the pool, even while a number that does not fit is being typed
    const barTotal = Math.max(this.overAllLimit, this.allocatedToGroups + this.unauditedCount)
    this.unauditedWidth = barTotal ? this.unauditedCount / barTotal * 100 : 0
    this.segments = groups
      .filter(group => group.licences > 0)
      .map(group => ({
        ...group,
        percent: (this.overAllLimit ? group.licences / this.overAllLimit * 100 : 0).toFixed(1),
        width: group.licences / barTotal * 100,
      }))
  }

  // the choice the first save's confirmation names
  get enrolmentCheckChoice() {
    return this.enrolmentCheckOptions.find(option => option.value === this.checksEnrolmentHere)
  }

  // Every user group the first save sends, listed in its confirmation with its licences and conditions, saying which
  // are new or changed since the last save, and the saved ones deleted. A saved group is known by its id, as the
  // groups are numbered again when one is deleted. None are saved with No.
  get userGroupsToSave(): { name: string, detail: string }[] {
    if (!this.checksEnrolmentHere) {
      return []
    }
    const savedGroups = this.savedState.userGroups
    const currentGroups = this.currentState().userGroups
    const savedGroupOf = (group: IUserGroupState) => group.id ? savedGroups.find(saved => saved.id === group.id) : undefined
    const count = (licences: number) => (Number(licences) || 0).toLocaleString('en-US')
    const conditions = (group: IUserGroupState) => group.conditions
      .filter(condition => condition.entity)
      .map(condition => `${this.entities.find(entity => entity.value === condition.entity)?.label} (${condition.selections.length})`)
      .join(', ') || 'no conditions'
    const conditionValues = (group: IUserGroupState) => group.conditions
      .map(condition => [condition.entity, _.sortBy(condition.selections.map(selection => selection.value))])

    const groups = currentGroups.map(group => {
      const saved = savedGroupOf(group)
      if (!saved) {
        return { name: group.name, detail: `New · ${count(group.licences)} licences · ${conditions(group)}` }
      }
      const wasLicences = Number(saved.licences) !== Number(group.licences) ? ` (was ${count(saved.licences)})` : ''
      const conditionsChanged = _.isEqual(conditionValues(saved), conditionValues(group)) ? '' : ' · conditions changed'
      return { name: group.name, detail: `${count(group.licences)} licences${wasLicences} · ${conditions(group)}${conditionsChanged}` }
    })
    const deleted = savedGroups
      .filter(saved => !currentGroups.some(group => group.id && group.id === saved.id))
      .map(saved => ({ name: saved.name, detail: 'Deleted' }))
    return [...groups, ...deleted]
  }

  // Saves the settings as they are now, which is what Reset goes back to. The first save asks to confirm the
  // enrolment check preference, and a save that changes the saved preference asks to confirm the change.
  save(): void {
    if (!this.canSave) {
      // what a user group still lacks is said under it once Save is pressed, and a Yes with no group at all, groups
      // with no condition (one group says it plain, the others are counted as +1, +2), a condition with no field or no
      // value (the first such group is named), an allocation below what is already used (the first such group is
      // named) or licences past the Over All Limit in a toast
      this.saveAttempted = this.canOfferSave
      if (this.canOfferSave && this.checksEnrolmentHere) {
        const withoutCondition = this.userGroups.controls.filter(group => !this.hasCondition(group)).length
        const groupBelowConsumed = this.userGroups.controls.find(group => group.get('licences')?.hasError('belowConsumed'))
        const groupWithoutField = this.userGroups.controls.find(group => (group.get('conditions') as FormArray).controls
          .some(condition => !condition.get('entity')?.value))
        const groupWithoutValue = this.userGroups.controls.find(group => (group.get('conditions') as FormArray).controls
          .some(condition => !!condition.get('entity')?.value && !this.selectedCount(condition)))
        if (!this.userGroups.length) {
          this.showToast('At least one group with one condition is required to save.', 'error')
        } else if (withoutCondition) {
          this.showToast(`Add at least one condition${withoutCondition > 1 ? ` +${withoutCondition - 1}` : ''}`, 'error')
        } else if (groupWithoutField) {
          this.showToast(`Can't save: ${groupWithoutField.get('name')?.value}: select at least one condition.`, 'error')
        } else if (groupWithoutValue) {
          this.showToast(`Can't save: ${groupWithoutValue.get('name')?.value}: every condition needs at least one value.`, 'error')
        } else if (groupBelowConsumed) {
          this.showToast(`Can't save: ${groupBelowConsumed.get('name')?.value}: allocation is below licences already used.`, 'error')
        } else if (this.overAllocatedCount) {
          this.showToast(`Can't save: Over-allocated by ${this.overAllocatedCount.toLocaleString('en-US')}`, 'error')
        }
      }
      return
    }
    if (this.checksEnrolmentHere === this.savedPreference) {
      this.saveSettings()
      return
    }
    const popup = this.savedPreference === null ? this.saveConfirm : this.preferenceChangeConfirm
    this.dialog.open(popup, { width: '520px', maxWidth: '90vw', panelClass: 'access-settings-dialog', autoFocus: false })
      .afterClosed().subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.saveSettings()
        }
      })
  }

  // Discards what changed since the last save, once confirmed
  reset(): void {
    if (this.hasUnsavedChanges) {
      this.confirm('Discard unsaved changes?', () => {
        this.applyState(this.savedState)
        this.saveAttempted = false
      })
    }
  }

  private markSaved(): void {
    this.savedState = this.currentState()
    this.savedSignature = this.settingsSignature()
    this.saveAttempted = false
  }

  // The enrolment check preference is saved on the provider when it is new or changed, then the user groups when
  // enrolment is checked here
  private saveSettings(): void {
    this.saving = true
    const preference = !!this.checksEnrolmentHere
    const savePreference = this.savedPreference === preference
      ? of(null)
      : this.marketPlaceSvc.updateProviderPreference(this.providerDetails, preference).pipe(tap(() => {
        this.savedPreference = preference
        // the page reads the provider again, so it has the preference as saved when this tab is opened again
        this.loadProviderDetails.emit(true)
      }))
    savePreference.pipe(
      switchMap(() => preference
        ? this.marketPlaceSvc.upsertProviderAccessSettings(this.accessControlRequest())
        : of(null)),
    ).subscribe({
      next: () => {
        this.saving = false
        if (!preference) {
          // the user groups aren't saved with No: they stay as last saved, to come back as they were with Yes
          this.applyState({ checksEnrolmentHere: false, userGroups: this.savedState.userGroups })
        }
        this.markSaved()
        this.showToast('Access settings saved successfully', 'success')
        // the groups this save created are given their ids by the api
        this.loadSettings()
      },
      error: (error: HttpErrorResponse) => {
        this.saving = false
        this.showToast(apiErrorMessage(error), 'error')
      },
    })
  }

  // The user groups as the provider access settings api takes them, in priority order
  private accessControlRequest() {
    return {
      partnerId: this.partnerId,
      accessControl: {
        version: this.accessControlVersion,
        userGroups: this.userGroups.controls.map((group, groupIndex) => ({
          ...(group.get('id')?.value ? { userGroupId: group.get('id')?.value } : {}),
          userGroup: groupIndex + 1,
          licenceAllocation: this.licencesOf(group),
          userGroupCriteriaList: (group.get('conditions') as FormArray).controls.map(condition => ({
            criteriaKey: condition.get('entity')?.value,
            criteriaValue: this.selectionValues(condition),
          })),
        })),
      },
    }
  }

  // The saved user groups, what each has consumed and what the provider has consumed, all from the one provider access
  // settings read (result.licence has the provider's totals), and the enrolment check preference the provider keeps,
  // read apart from them
  private loadSettings(): void {
    forkJoin([
      this.orApiError(this.marketPlaceSvc.readProviderAccessSettings(this.partnerId), null),
      this.orApiError(this.marketPlaceSvc.readProviderPreference(this.partnerId), null),
    ]).subscribe(([settings, provider]) => {
      const preference = _.get(provider, 'result.data.providerPreference')
      this.savedPreference = typeof preference === 'boolean' ? preference : null
      this.accessControlVersion = _.get(settings, 'result.accessControl.version') || 1
      this.consumedCount = _.get(settings, 'result.licence.consumed', this.consumedCount)
      this.unauditedCount = Math.max(Number(_.get(settings, 'result.licence.unaudited')) || 0, 0)
      this.revalidateLicences()
      this.updateDistribution()
      this.withSelectionLabels(this.toState(settings)).subscribe(state => {
        this.applyState(state)
        this.markSaved()
      })
    })
  }

  // The api's user groups in priority order (userGroup is the order), as the page keeps them. The api gives a group no
  // name, so it is named by its place, the way a new group is.
  private toState(settings: any): IAccessSettingsState {
    const savedGroups = _.sortBy(_.get(settings, 'result.accessControl.userGroups', []), 'userGroup')
      .filter((group: any) => group.status !== 'DELETED')
    return {
      checksEnrolmentHere: this.savedPreference,
      userGroups: savedGroups.map((group: any, groupIndex: number) => ({
        id: group.userGroupId,
        name: `User Group ${groupIndex + 1}`,
        licences: group.licenceAllocation || 0,
        consumed: group.consumed || 0,
        conditions: (group.userGroupCriteriaList || []).map((criteria: any) => {
          // the api may give a criteria key in any case, the page keeps it as it is saved
          const entity = this.entities.find(item => item.value.toLowerCase() === String(criteria.criteriaKey).toLowerCase())?.value
            || criteria.criteriaKey
          return {
            entity,
            selections: (criteria.criteriaValue || []).map((value: any) => this.toSelection(entity, String(value))),
          }
        }),
      })),
    }
  }

  // A verification status is named the way the page names it, any other value by itself until it is looked up
  private toSelection(entity: string, value: string): ISelectionItem {
    const status = VERIFICATION_STATUS_OPTIONS.find(option => entity === UserGroupEntity.VerificationStatus && option.value === value)
    return status ? { ...status } : { value, label: value }
  }

  // Organisations and users are saved by id, so their names, and the users' details, are looked up to show them
  private withSelectionLabels(state: IAccessSettingsState): Observable<IAccessSettingsState> {
    const conditions = _.flatMap(state.userGroups, group => group.conditions)
    const idsOf = (entity: string) => _.uniq(_.flatMap(
      conditions.filter(condition => condition.entity === entity),
      condition => condition.selections.map(selection => selection.value),
    ))
    const lookUp = (ids: string[], request: () => Observable<any>, toItem: (item: any) => ISelectionItem) => ids.length
      ? this.orApiError(request().pipe(map(response => _.get(response, 'result.response.content', []).map(toItem))), [])
      : of([])
    const toOrganisation = (org: any) => ({ value: org.identifier, label: org.channel })
    const orgIds = idsOf(UserGroupEntity.Organisation)
    const userIds = idsOf(UserGroupEntity.User)
    return forkJoin([
      lookUp(orgIds, () => this.marketPlaceSvc.getOrganisationsByIds(orgIds), toOrganisation),
      lookUp(userIds, () => this.marketPlaceSvc.searchUsers('', { identifier: userIds }, 0, userIds.length), toUserSelection),
    ]).pipe(map(([organisations, users]) => {
      const found = _.keyBy([...organisations, ...users], 'value')
      conditions.forEach(condition => {
        condition.selections = condition.selections.map(selection => found[selection.value] || selection)
      })
      return state
    }))
  }

  // A read that fails says what the api gives in an error toast, and the page goes on with the fallback
  private orApiError<T>(request: Observable<T>, fallback: T): Observable<T> {
    return request.pipe(catchError(error => {
      this.showToast(apiErrorMessage(error), 'error')
      return of(fallback)
    }))
  }

  private showToast(message: string, type: 'error' | 'success'): void {
    this.snackBar.openFromComponent(SnackbarComponent, {
      data: { message, type }, duration: 5000, panelClass: [type, 'access-settings-toast'],
    })
  }

  private currentState(): IAccessSettingsState {
    return _.cloneDeep({
      checksEnrolmentHere: this.checksEnrolmentHere,
      userGroups: this.userGroups.controls.map(group => ({
        id: group.get('id')?.value,
        name: group.get('name')?.value,
        licences: group.get('licences')?.value,
        consumed: this.consumedOf(group),
        conditions: (group.get('conditions') as FormArray).controls
          .map(condition => ({ entity: condition.get('entity')?.value, selections: condition.get('selections')?.value || [] })),
      })),
    })
  }

  // Puts the settings back as they were saved; the access settings api will load saved settings the same way
  private applyState(state: IAccessSettingsState): void {
    this.checksEnrolmentHere = state.checksEnrolmentHere
    this.userGroups.clear()
    _.cloneDeep(state.userGroups).forEach(group => this.addUserGroup(group))
    this.revalidateLicences()
  }

  // What the admin sets, without what is read from the server (user counts, consumed licences), to tell changes by
  private settingsSignature(): string {
    return JSON.stringify([
      this.checksEnrolmentHere,
      this.userGroups.controls.map(group => [
        group.get('licences')?.value,
        (group.get('conditions') as FormArray).controls
          .map(condition => [condition.get('entity')?.value, this.selectionValues(condition)]),
      ]),
    ])
  }

  private createCondition(saved?: { entity: string, selections: ISelectionItem[] }): FormGroup {
    return this.fb.group({
      entity: [saved ? saved.entity : ''],
      conditionType: [{ value: 'is', disabled: true }],
      selections: [saved ? saved.selections : []],
    })
  }

  private clearCondition(condition: AbstractControl): void {
    condition.get('entity')?.setValue('')
    condition.get('selections')?.setValue([])
  }

  private groupHasSelections(group: AbstractControl): boolean {
    return (group.get('conditions') as FormArray).controls.some(condition => this.selectedCount(condition) > 0)
  }

  // the content portal's delete popup, asking about the user group or condition by name
  private confirmDelete(name: string, onConfirm: () => void): void {
    this.dialog.open(this.deleteConfirm, { data: name, width: '470px', panelClass: 'access-settings-dialog', autoFocus: false })
      .afterClosed().subscribe((confirmed: boolean) => {
        if (confirmed) {
          onConfirm()
        }
      })
  }

  // asks the header as a question, with a gap above the buttons
  private confirm(header: string, onConfirm: () => void): void {
    const dialogData = {
      dialogType: 'warning',
      descriptions: [{ header, headerClass: 'flex items-center justify-center text-blue mb-6' }],
      footerClass: 'items-center justify-center',
      buttons: [
        {
          btnText: 'No',
          btnClass: 'btn-outline',
          response: false,
        },
        {
          btnText: 'Yes',
          btnClass: 'btn-full-success',
          response: true,
        },
      ],
    }
    const dialogRef = this.dialog.open(ConformationPopupComponent, {
      panelClass: 'reject-reason',
      data: dialogData,
      autoFocus: false,
      width: '626px',
      maxWidth: '80vw',
      maxHeight: '90vh',
      height: '225px',
      disableClose: true,
    })
    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        onConfirm()
      }
    })
  }
}
