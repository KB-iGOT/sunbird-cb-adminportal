import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { FormBuilder, FormGroup } from '@angular/forms'
import {
  IOrganization,
  SEARCH_FIELD_MAPPINGS,
  SearchType,
  USER_STATUS_OPTIONS,
  UserStatus,
} from '../../models/users.models'

export interface ISearchParams {
  searchType: SearchType
  searchQuery: string
  userStatus: UserStatus
  selectedOrg: IOrganization | null
}

@Component({
  standalone: false,
  selector: 'ws-search-panel',
  templateUrl: './search-panel.component.html',
  styleUrls: ['./search-panel.component.scss'],
})
export class SearchPanelComponent implements OnInit {
  @Input() initialSearchType: SearchType = 'name'
  @Input() initialSearchQuery = ''
  @Input() initialUserStatus: UserStatus = 'active'
  @Output() search = new EventEmitter<ISearchParams>()
  @Output() clear = new EventEmitter<void>()

  searchForm!: FormGroup
  searchTypes = SEARCH_FIELD_MAPPINGS
  userStatusOptions = USER_STATUS_OPTIONS
  selectedOrg: IOrganization | null = null
  validationError = ''

  // Role options for role-based search
  availableRoles: string[] = []

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.searchForm = this.fb.group({
      searchType: [this.initialSearchType],
      searchQuery: [this.initialSearchQuery],
      userStatus: [this.initialUserStatus],
    })
  }

  get currentSearchType(): SearchType {
    return this.searchForm.get('searchType')?.value
  }

  get currentMapping() {
    return SEARCH_FIELD_MAPPINGS.find(m => m.type === this.currentSearchType)
  }

  get showOrgSelector(): boolean {
    return this.currentSearchType === 'name' || this.currentSearchType === 'roles'
  }

  get showTextInput(): boolean {
    return this.currentSearchType !== 'roles'
  }

  get canSearch(): boolean {
    if (this.validationError) { return false }
    const query = (this.searchForm.get('searchQuery')?.value || '').trim()
    if (this.currentSearchType === 'roles') {
      return query.length > 0 || this.selectedOrg !== null
    }
    return query.length > 0
  }

  getSearchHint(): string {
    if (this.currentSearchType === 'name') { return 'Enter a Name above to search.' }
    if (this.currentSearchType === 'roles') { return 'Enter a Role name or select an Organisation.' }
    const label = this.currentMapping?.label || 'value'
    return `Enter a ${label} to search.`
  }

  getExample(): string {
    const ex: Record<string, string> = {
      email: 'user@example.com',
      phone: '9876543210',
      userId: '8a32bf99-080a-4a1a-...',
    }
    return ex[this.currentSearchType] || ''
  }

  onSearchTypeChange(): void {
    this.searchForm.get('searchQuery')?.setValue('')
    this.validationError = ''
    this.selectedOrg = null
  }

  onOrgSelected(org: IOrganization): void {
    this.selectedOrg = org
  }

  onOrgCleared(): void {
    this.selectedOrg = null
  }

  validateInput(): void {
    const mapping = this.currentMapping
    const query = this.searchForm.get('searchQuery')?.value || ''
    if (mapping?.validation && query) {
      this.validationError = mapping.validation.test(query) ? '' : (mapping.validationMsg || 'Invalid input')
    } else {
      this.validationError = ''
    }
  }

  onSearch(): void {
    this.validateInput()
    if (this.validationError) { return }

    const formVal = this.searchForm.value
    this.search.emit({
      searchType: formVal.searchType,
      searchQuery: (formVal.searchQuery || '').trim(),
      userStatus: formVal.userStatus,
      selectedOrg: this.selectedOrg,
    })
  }

  onClear(): void {
    this.searchForm.patchValue({
      searchType: 'name',
      searchQuery: '',
      userStatus: 'active',
    })
    this.selectedOrg = null
    this.validationError = ''
    this.clear.emit()
  }

  setSearchParams(searchType: SearchType, searchQuery: string): void {
    this.searchForm.patchValue({ searchType, searchQuery })
  }
}
