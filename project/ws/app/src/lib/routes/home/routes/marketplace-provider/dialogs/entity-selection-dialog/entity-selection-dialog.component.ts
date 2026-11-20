import { Component, Inject, OnDestroy, OnInit } from '@angular/core'
import { FormControl } from '@angular/forms'
import { MatCheckboxChange } from '@angular/material/checkbox'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar'
import { PageChangeEmitter, SnackbarComponent } from '@sunbird-cb/consumption'
import { Observable, of, Subscription } from 'rxjs'
import { map } from 'rxjs/operators'
import * as _ from 'lodash'
import { MarketplaceService } from '../../services/marketplace.service'
import {
  ALL_SERVICES,
  BATCH_RANGES,
  COLUMN_LAYOUT_ENTITIES,
  IConfigItem,
  ISelectionDialogData,
  ISelectionItem,
  IUserSelection,
  LIMITED_SELECTION_ENTITIES,
  MAX_SELECTIONS,
  UserGroupEntity,
  VERIFICATION_STATUS_OPTIONS,
} from '../../models/access-settings.model'

const PAGE_SIZE = 100

// The years before and after the creation portal batch ranges are grouped under a range of their own
const OPEN_BATCH_RANGES = [
  { label: '', start: -Infinity, end: BATCH_RANGES[0].start - 1 },
  ...BATCH_RANGES,
  { label: '', start: BATCH_RANGES[BATCH_RANGES.length - 1].end + 1, end: Infinity },
]

// The column layout, as the creation portal draws it: A-Z then # for the names that start with no letter,
// seven names to a column under a letter, eight services or years otherwise, and the next page read once the
// columns are scrolled near their end
const LETTERS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), '#']
const LETTER_COLUMN_SIZE = 7
const COLUMN_SIZE = 8
const SCROLL_END_THRESHOLD = 150

const EMAIL_PATTERN = /^[\w\-.]+@([\w-]+\.)+[\w-]{2,4}$/
const MOBILE_PATTERN = /^[6-9]\d{9}$/

const nameKey = (name: string) => (name || '').trim().toLowerCase()
const letterOf = (label: string) => {
  const letter = (label || '').trim().charAt(0).toUpperCase()
  return /^[A-Z]$/.test(letter) ? letter : '#'
}

// Masked the way the user search masks it: the first two characters, then * up to the @
const maskEmail = (email: string): string => {
  const at = email.indexOf('@')
  const name = at < 0 ? email : email.slice(0, at)
  return `${name.slice(0, 2)}${'*'.repeat(Math.max(name.length - 2, 0))}${at < 0 ? '' : email.slice(at)}`
}

// Masked the way the user search masks it: * up to the last four digits
const maskMobile = (mobile: string): string => mobile.length > 4 ? `${'*'.repeat(mobile.length - 4)}${mobile.slice(-4)}` : mobile

// What the Users table shows of a user. The e-mail id and the mobile number are only ever shown masked, as the
// search masks them, and masked here when the search returns them unmasked.
export const toUserSelection = (user: any): IUserSelection => ({
  value: user.userId || user.id || user.identifier,
  label: user.firstName || '',
  email: user.maskedEmail || maskEmail(_.get(user, 'profileDetails.personalDetails.primaryEmail') || user.email || ''),
  mobile: user.maskedPhone || maskMobile(String(_.get(user, 'profileDetails.personalDetails.mobile') || user.phone || '')),
  ministry: user.rootOrgName || '',
})

interface IColumnSection {
  label: string
  columns: ISelectionItem[][]
}

// Picks the selections of a condition. Users are picked from a table, Organisation, Designation, Service, Cadre
// and Batch from the creation portal's columns, Group and Verification Status from a plain list.
@Component({
  selector: 'ws-app-entity-selection-dialog',
  templateUrl: './entity-selection-dialog.component.html',
  styleUrls: ['./entity-selection-dialog.component.scss'],
  standalone: false,
})
export class EntitySelectionDialogComponent implements OnInit, OnDestroy {
  searchControl = new FormControl('', { nonNullable: true })
  items: ISelectionItem[] = []
  selectedItems = new Map<string, ISelectionItem>()
  // "Maximum 500 values", shown when something past the limit is ticked
  private limitToast?: MatSnackBarRef<SnackbarComponent>
  activeTab = 0
  isLoading = false
  hasMore = false
  loadError = false
  // what the server holds of the list, the Users table pages through it
  total = 0
  page = 0

  // Service lists the services of every type, or of the one picked
  serviceTypes: string[] = []
  serviceType = ALL_SERVICES

  // the letter the All tab of Organisation and Designation lists, and the section last jumped to from the bar
  activeLetter = 'A'
  activeSection = ''
  // the Selected tab, taken when it is opened so an item unticked there can be ticked again
  selectedView: ISelectionItem[] = []

  userPageSize = 5
  pageSizeOptions = [5, 10, 25, 100]
  displayedColumns = ['select', 'name', 'email', 'ministry', 'mobile']

  private searchKey = ''
  private itemsRequest?: Subscription

  constructor(
    private dialogRef: MatDialogRef<EntitySelectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ISelectionDialogData,
    private marketPlaceSvc: MarketplaceService,
    private snackBar: MatSnackBar,
  ) { }

  ngOnDestroy(): void {
    this.limitToast?.dismiss()
  }

  ngOnInit(): void {
    this.data.selected.forEach(item => this.selectedItems.set(item.value, item))
    this.selectedView = [...this.data.selected]
    this.activeTab = this.data.showSelected && this.selectedItems.size ? 1 : 0
    this.loadItems()
  }

  get isUser(): boolean {
    return this.data.entity === UserGroupEntity.User
  }

  get layout(): 'users' | 'columns' | 'grid' {
    if (this.isUser) {
      return 'users'
    }
    return COLUMN_LAYOUT_ENTITIES.includes(this.data.entity) ? 'columns' : 'grid'
  }

  // Users, organisations and designations are searched on the server, the other lists are small enough to filter here
  get isServerSideSearch(): boolean {
    return this.isUser || this.data.entity === UserGroupEntity.Organisation || this.data.entity === UserGroupEntity.Designation
  }

  get visibleItems(): ISelectionItem[] {
    const source = this.activeTab === 0 ? this.items : this.selectedView
    const searchKey = this.searchControl.value.trim().toLowerCase()
    // the Users table lists the page as the server returns it
    const filterHere = !this.isUser && (this.activeTab === 1 || !this.isServerSideSearch)
    return filterHere && searchKey ? source.filter(item => item.label.toLowerCase().includes(searchKey)) : source
  }

  get areAllVisibleSelected(): boolean {
    const visibleItems = this.visibleItems
    return visibleItems.length > 0 && visibleItems.every(item => this.selectedItems.has(item.value))
  }

  get isPartlySelected(): boolean {
    return this.visibleItems.some(item => this.isSelected(item)) && !this.areAllVisibleSelected
  }

  // User, Organisation and Designation select at most MAX_SELECTIONS, the others have no limit
  get selectionLimit(): number {
    return LIMITED_SELECTION_ENTITIES.includes(this.data.entity) ? MAX_SELECTIONS : 0
  }

  get isAtLimit(): boolean {
    return !!this.selectionLimit && this.selectedItems.size >= this.selectionLimit
  }

  get isService(): boolean {
    return this.data.entity === UserGroupEntity.Service
  }

  get isBatch(): boolean {
    return this.data.entity === UserGroupEntity.Batch
  }

  // services and cadres are listed as one run of columns, with no bar, the way the creation portal lists them
  get isOneRun(): boolean {
    return this.isService || this.data.entity === UserGroupEntity.Cadre
  }

  // the tabs read All Organisation / Selected Organisation, All Services / Selected Services, All Batches / Selected Batches
  get tabNoun(): string {
    if (this.isService) {
      return 'Services'
    }
    return this.isBatch ? 'Batches' : this.data.entityLabel
  }

  get allTabLabel(): string {
    switch (this.layout) {
      case 'users':
        return 'All Learners'
      case 'columns':
        return `All ${this.tabNoun}`
      default:
        return 'All'
    }
  }

  get selectedTabLabel(): string {
    switch (this.layout) {
      case 'users':
        return `Selected Users (${this.selectedItems.size})`
      case 'columns':
        return `Selected ${this.tabNoun}`
      default:
        return `Selected (${this.selectedItems.size})`
    }
  }

  // the creation portal titles services in the plural, Select Services, and every other entity in the singular; what
  // is only shown is titled by the entity, with (view only), such as Organisation (view only)
  get dialogTitle(): string {
    if (this.data.readOnly) {
      return `${this.isUser ? 'Users' : this.isService ? 'Services' : this.data.entityLabel} (view only)`
    }
    if (this.isUser) {
      return 'Users'
    }
    return this.isService ? 'Select Services' : `Select ${this.data.entityLabel}`
  }

  get searchPlaceholder(): string {
    return this.isUser ? 'Search by Name, Email and Phone Number' : 'Type here to search...'
  }

  get selectionHint(): string {
    switch (this.data.entity) {
      case UserGroupEntity.Organisation:
        return 'Select the Organisations only if the courses of this provider need to be made visible to only selective '
          + 'organisations users.'
      case UserGroupEntity.Designation:
        return 'Select the Designations only if the courses of this provider need to be made visible to only selective designation users.'
      default:
        return ''
    }
  }

  // the creation portal offers no Select All for designations
  get canSelectAll(): boolean {
    return this.data.entity !== UserGroupEntity.Designation
  }

  get batchGroups(): { label: string, items: ISelectionItem[] }[] {
    const visibleItems = this.visibleItems
    return OPEN_BATCH_RANGES
      .map(range => ({
        range,
        items: visibleItems.filter(item => Number(item.value) >= range.start && Number(item.value) <= range.end),
      }))
      .filter(group => group.items.length)
      .map(({ range, items }) => ({ items, label: range.label || this.yearsLabel(items) }))
  }

  // Batches by range, services, cadres and a search result as one run, anything else by its first letter
  get sections(): IColumnSection[] {
    if (this.isBatch) {
      return this.batchGroups.map(group => ({ label: group.label, columns: _.chunk(group.items, COLUMN_SIZE) }))
    }

    const visibleItems = this.visibleItems
    if (this.isOneRun) {
      return visibleItems.length ? [{ label: 'All', columns: _.chunk(visibleItems, COLUMN_SIZE) }] : []
    }
    if (this.activeTab === 0 && this.searchKey) {
      return visibleItems.length ? [{ label: 'All', columns: _.chunk(visibleItems, LETTER_COLUMN_SIZE) }] : []
    }
    const byLetter = _.groupBy(visibleItems, item => letterOf(item.label))
    return LETTERS
      .filter(letter => byLetter[letter])
      .map(letter => ({ label: letter, columns: _.chunk(byLetter[letter], LETTER_COLUMN_SIZE) }))
  }

  // A-Z loads Organisation and Designation a letter at a time, otherwise the bar jumps to the letters or ranges listed.
  // Services and cadres have no bar.
  get barLabels(): string[] {
    if (this.isOneRun) {
      return []
    }
    if (this.isServerSideSearch && this.activeTab === 0) {
      return this.searchKey ? [] : LETTERS
    }
    return this.sections.map(section => section.label)
  }

  get activeBarLabel(): string {
    return this.isServerSideSearch && this.activeTab === 0 ? this.activeLetter : this.activeSection
  }

  trackByValue(_index: number, item: ISelectionItem): string {
    return item.value
  }

  // the sections and their columns are built again on every check, these keep their elements in place
  trackByLabel(_index: number, group: { label: string }): string {
    return group.label
  }

  trackByIndex(index: number): number {
    return index
  }

  onTabChange(index: number): void {
    this.activeTab = index
    if (index === 1) {
      this.selectedView = Array.from(this.selectedItems.values())
    }
  }

  isSelected(item: ISelectionItem): boolean {
    return this.selectedItems.has(item.value)
  }

  // nothing more is ticked once the limit is reached, what is ticked can always be unticked
  // nothing can be ticked or cleared while the selections are only shown
  canToggle(item: ISelectionItem): boolean {
    return !this.data.readOnly && (this.isSelected(item) || !this.isAtLimit)
  }

  // Ticking past the limit is refused with a toast. Returns whether the item was ticked or unticked.
  toggleItem(item: ISelectionItem, checked: boolean): boolean {
    if (this.data.readOnly) {
      return false
    }
    if (checked) {
      if (!this.canToggle(item)) {
        this.showLimitReached()
        return false
      }
      this.selectedItems.set(item.value, item)
    } else {
      this.selectedItems.delete(item.value)
    }
    return true
  }

  // Select All ticks up to the limit, and says so once if some were left out
  toggleAll(checked: boolean): void {
    if (this.data.readOnly) {
      return
    }
    let leftOut = false
    this.visibleItems.forEach(item => {
      if (checked && !this.canToggle(item)) {
        leftOut = true
      } else {
        this.toggleItem(item, checked)
      }
    })
    if (leftOut) {
      this.showLimitReached()
    }
  }

  // A checkbox that was refused is put back to what is selected, as it flips by itself when clicked
  onItemChange(item: ISelectionItem, event: MatCheckboxChange): void {
    if (!this.toggleItem(item, event.checked)) {
      event.source.checked = this.isSelected(item)
    }
  }

  onAllChange(event: MatCheckboxChange): void {
    this.toggleAll(event.checked)
    event.source.checked = this.areAllVisibleSelected
    event.source.indeterminate = this.isPartlySelected
  }

  private showLimitReached(): void {
    this.limitToast = this.snackBar.openFromComponent(SnackbarComponent, {
      data: { message: `Maximum ${this.selectionLimit} values`, type: 'error' },
      duration: 5000,
      panelClass: ['error', 'entity-selection-toast'],
    })
  }

  search(): void {
    // users are searched from the All Learners tab, whichever tab the search is made from
    if (this.isUser) {
      this.onTabChange(0)
    }
    if (this.isServerSideSearch && this.activeTab === 0) {
      this.searchKey = this.searchControl.value.trim()
      this.activeLetter = 'A'
      this.page = 0
      this.items = []
      this.loadItems()
    }
  }

  loadMore(): void {
    this.page += 1
    this.loadItems()
  }

  // the pagination counts its pages from 1
  onPageChange(event: PageChangeEmitter): void {
    this.page = event.currentPage - 1
    this.userPageSize = event.limit
    this.items = []
    this.loadItems()
  }

  onBarClick(label: string): void {
    if (this.isServerSideSearch && this.activeTab === 0) {
      this.activeLetter = label
      this.page = 0
      this.items = []
      this.loadItems()
      return
    }
    this.activeSection = label
    document.getElementById(`selection-section-${label}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
  }

  onColumnsScroll(event: Event): void {
    const columns = event.target as HTMLElement
    const isNearEnd = columns.scrollWidth - (columns.scrollLeft + columns.offsetWidth) < SCROLL_END_THRESHOLD
    if (isNearEnd && this.activeTab === 0 && this.hasMore && !this.isLoading) {
      this.loadMore()
    }
  }

  onServiceTypeChange(serviceType: string): void {
    this.serviceType = serviceType
    this.items = []
    this.loadItems()
  }

  apply(): void {
    this.dialogRef.close(Array.from(this.selectedItems.values()))
  }

  cancel(): void {
    this.dialogRef.close()
  }

  loadItems(): void {
    this.itemsRequest?.unsubscribe()
    this.isLoading = true
    this.loadError = false
    this.itemsRequest = this.fetchItems().subscribe({
      next: (result: { items: ISelectionItem[], total: number }) => {
        this.items = _.uniqBy([...this.items, ...result.items], 'value')
        this.total = result.total
        this.hasMore = this.isServerSideSearch && result.items.length > 0 && this.items.length < result.total
        this.isLoading = false
      },
      error: () => {
        this.loadError = true
        this.isLoading = false
      },
    })
  }

  // A letter is only asked for while nothing is searched. The server has no filter for the names that start
  // with no letter, so # lists from every letter, the way the creation portal does.
  private get startsWith(): string {
    return this.searchKey || this.activeLetter === '#' ? '' : this.activeLetter
  }

  private fetchItems(): Observable<{ items: ISelectionItem[], total: number }> {
    switch (this.data.entity) {
      case UserGroupEntity.User:
        return this.fetchUsers()
      case UserGroupEntity.Organisation:
        return this.marketPlaceSvc.searchOrganisations(this.searchKey, this.page * PAGE_SIZE, PAGE_SIZE, this.startsWith).pipe(
          map((response: any) => ({
            items: _.get(response, 'result.response.content', [])
              .map((org: any) => ({ value: org.identifier, label: org.channel })),
            total: _.get(response, 'result.response.count', 0),
          })),
        )
      case UserGroupEntity.Designation:
        return this.marketPlaceSvc.searchDesignations(this.searchKey, this.page, PAGE_SIZE, this.startsWith).pipe(
          map((response: any) => ({
            items: _.get(response, 'result.result.data', [])
              .map((designation: any) => ({ value: designation.designation, label: designation.designation })),
            total: _.get(response, 'result.result.totalCount', 0),
          })),
        )
      case UserGroupEntity.Group:
        return this.marketPlaceSvc.getGroupsList().pipe(
          map((response: any) => {
            const groups: string[] = _.get(response, 'result.response', [])
            return { items: groups.map(group => ({ value: group, label: group })), total: groups.length }
          }),
        )
      // Services, cadres and batches come from the cadre config, each narrowed by what the group selects of the others
      case UserGroupEntity.Service:
        return this.marketPlaceSvc.loadCadreConfig().pipe(map(() => this.allOf(this.listServices())))
      case UserGroupEntity.Cadre:
        return this.marketPlaceSvc.loadCadreConfig().pipe(map(() =>
          this.allOf(this.toNameItems(this.marketPlaceSvc.getCadres(this.data.narrowBy)))))
      case UserGroupEntity.Batch:
        return this.marketPlaceSvc.loadCadreConfig().pipe(map(() => this.allOf(this.marketPlaceSvc.getBatchYears(this.data.narrowBy)
          .map(year => ({ value: String(year), label: String(year) })))))
      default:
        return of(this.allOf(VERIFICATION_STATUS_OPTIONS))
    }
  }

  // A page of the users the other conditions of the group allow. An e-mail id or a mobile number is looked up in
  // the personal details, anything else is searched as a name.
  private fetchUsers(): Observable<{ items: ISelectionItem[], total: number }> {
    const filters: { [key: string]: any } = { ...this.data.filters, status: 1 }
    let query = this.searchKey
    if (EMAIL_PATTERN.test(this.searchKey)) {
      filters['profileDetails.personalDetails.primaryEmail'] = this.searchKey.toLowerCase()
      query = ''
    } else if (MOBILE_PATTERN.test(this.searchKey)) {
      filters['profileDetails.personalDetails.mobile'] = this.searchKey
      query = ''
    }
    return this.marketPlaceSvc.searchUsers(query, filters, this.page * this.userPageSize, this.userPageSize).pipe(
      map((response: any) => ({
        items: _.get(response, 'result.response.content', []).map(toUserSelection),
        total: _.get(response, 'result.response.count', 0),
      })),
    )
  }

  private allOf(items: ISelectionItem[]): { items: ISelectionItem[], total: number } {
    return { items, total: items.length }
  }

  // State services are not offered on SPV, neither as a type nor under All Services, the way the creation
  // portal leaves them out for an organisation that is not in a state
  private listServices(): ISelectionItem[] {
    const typeNames = this.marketPlaceSvc.getCivilServiceTypeNames()
      .filter(typeName => !this.marketPlaceSvc.isStateServiceType(typeName))
    this.serviceTypes = [ALL_SERVICES, ...typeNames]

    const allowedNames = new Set(this.marketPlaceSvc.getCivilServices(this.data.narrowBy).map(service => nameKey(service.name)))
    const listedTypes = this.serviceType === ALL_SERVICES ? typeNames : [this.serviceType]
    const services = _.flatMap(listedTypes, typeName => this.marketPlaceSvc.getCivilServicesOfType(typeName))
    return this.toNameItems(services.filter(service => allowedNames.has(nameKey(service.name))))
  }

  // Services and cadres are selected by name, lowercased the way the creation portal saves them. The states
  // publish the same names under different ids, so each name is listed once.
  private toNameItems(configItems: IConfigItem[]): ISelectionItem[] {
    return _.uniqBy(configItems.filter(item => item.name), item => nameKey(item.name))
      .map(item => ({ value: item.name.toLowerCase(), label: item.name }))
      .sort((itemA, itemB) => itemA.label.toLowerCase().localeCompare(itemB.label.toLowerCase()))
  }

  private yearsLabel(items: ISelectionItem[]): string {
    const first = items[0].label
    const last = items[items.length - 1].label
    return first === last ? first : `${first}-${last}`
  }
}
