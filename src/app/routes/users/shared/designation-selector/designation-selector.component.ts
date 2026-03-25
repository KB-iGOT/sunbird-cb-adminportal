import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core'
import { FormControl, Validators } from '@angular/forms'
import { Subject, of } from 'rxjs'
import { catchError, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators'
import { UsersService } from '../../users.service'

interface IDesignationOption {
  name: string
  identifier: string
}

@Component({
  standalone: false,
  selector: 'ws-designation-selector',
  templateUrl: './designation-selector.component.html',
  styleUrls: ['./designation-selector.component.scss'],
})
export class DesignationSelectorComponent implements OnInit, OnChanges, OnDestroy {
  @Input() label = 'Designation'
  @Input() required = false
  @Input() disabled = false
  @Input() rootOrgId = ''
  @Input() selectedDesignation = ''
  @Output() designationSelected = new EventEmitter<string>()

  searchControl = new FormControl('')
  filteredOptions: IDesignationOption[] = []
  isLoading = false
  private destroy$ = new Subject<void>()

  constructor(private usersService: UsersService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['disabled']) {
      this.disabled ? this.searchControl.disable() : this.searchControl.enable()
    }
    if (changes['selectedDesignation'] && this.selectedDesignation) {
      this.searchControl.setValue(this.selectedDesignation, { emitEvent: false })
    }
  }

  ngOnInit(): void {
    if (this.required) {
      this.searchControl.setValidators(Validators.required)
      this.searchControl.updateValueAndValidity()
    }
    if (this.selectedDesignation) {
      this.searchControl.setValue(this.selectedDesignation, { emitEvent: false })
    }
    if (this.disabled) { this.searchControl.disable() }

    // Initial load
    this.search('')

    // Debounce user typing
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
      switchMap((value: any) => {
        const query = (typeof value === 'string' ? value : '').trim()
        // If user selected an option (object), skip API call
        if (typeof value === 'object' && value !== null) { return of(null) }
        this.isLoading = true
        return this.usersService.searchMasterDesignations(query, 50, 0).pipe(
          catchError(() => of({ items: [], totalCount: 0 })),
        )
      }),
    ).subscribe((res: any) => {
      if (res !== null) {
        this.filteredOptions = res.items || []
        this.isLoading = false
      }
    })
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private search(query: string): void {
    this.isLoading = true
    this.usersService.searchMasterDesignations(query, 50, 0).pipe(
      catchError(() => of({ items: [], totalCount: 0 })),
      takeUntil(this.destroy$),
    ).subscribe((res: { items: IDesignationOption[]; totalCount: number }) => {
      this.filteredOptions = res.items
      this.isLoading = false
    })
  }

  onOptionSelected(option: IDesignationOption): void {
    this.selectedDesignation = option.name
    this.designationSelected.emit(option.name)
  }

  displayFn(opt: IDesignationOption | string): string {
    if (!opt) { return '' }
    return typeof opt === 'string' ? opt : opt.name
  }

  clear(): void {
    this.searchControl.setValue('', { emitEvent: true })
    this.selectedDesignation = ''
    this.designationSelected.emit('')
  }

  markAsTouched(): void {
    this.searchControl.markAsTouched()
  }

  get placeholder(): string {
    return this.isLoading ? 'Loading...' : 'Type to search designations...'
  }
}
