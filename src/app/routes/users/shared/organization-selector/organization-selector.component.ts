import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core'
import { FormControl } from '@angular/forms'
import { Subject, of } from 'rxjs'
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators'
import { UsersService } from '../../users.service'
import { IOrganization } from '../../models/users.models'

@Component({
  standalone: false,
  selector: 'ws-organization-selector',
  templateUrl: './organization-selector.component.html',
  styleUrls: ['./organization-selector.component.scss'],
})
export class OrganizationSelectorComponent implements OnInit, OnDestroy {
  @Input() label = 'Organization'
  @Input() required = false
  @Input() selectedOrg: IOrganization | null = null
  @Output() orgSelected = new EventEmitter<IOrganization>()
  @Output() orgCleared = new EventEmitter<void>()

  searchControl = new FormControl('')
  filteredOrgs: IOrganization[] = []
  isLoading = false
  private destroy$ = new Subject<void>()

  constructor(private usersService: UsersService) { }

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
      switchMap((value: any) => {
        if (typeof value === 'string') {
          this.isLoading = true
          // Search with query (even empty string loads initial orgs)
          return this.usersService.searchOrganizations(value)
        }
        this.filteredOrgs = []
        return of([])
      }),
    ).subscribe((orgs: IOrganization[]) => {
      this.filteredOrgs = orgs
      this.isLoading = false
    })

    if (this.selectedOrg) {
      this.searchControl.setValue(this.selectedOrg.orgName)
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  displayFn(org: IOrganization): string {
    return org ? org.orgName || '' : ''
  }

  onOptionSelected(org: IOrganization): void {
    this.selectedOrg = org
    this.orgSelected.emit(org)
  }

  onFocus(): void {
    // Load initial orgs when user clicks on the field if none are loaded
    if (this.filteredOrgs.length === 0 && !this.isLoading) {
      this.isLoading = true
      this.usersService.searchOrganizations('').subscribe(
        (orgs: IOrganization[]) => {
          this.filteredOrgs = orgs
          this.isLoading = false
        },
        () => {
          this.isLoading = false
        },
      )
    }
  }

  clear(): void {
    this.searchControl.setValue('')
    this.selectedOrg = null
    this.filteredOrgs = []
    this.orgCleared.emit()
  }
}
