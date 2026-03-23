import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core'
import { FormControl } from '@angular/forms'
import { Subject } from 'rxjs'
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators'

@Component({
  standalone: false,
  selector: 'ws-designation-selector',
  templateUrl: './designation-selector.component.html',
  styleUrls: ['./designation-selector.component.scss'],
})
export class DesignationSelectorComponent implements OnInit, OnDestroy {
  @Input() label = 'Designation'
  @Input() required = false
  @Input() disabled = false
  @Input() designations: string[] = []
  @Input() selectedDesignation = ''
  @Output() designationSelected = new EventEmitter<string>()

  searchControl = new FormControl('')
  filteredDesignations: string[] = []
  private destroy$ = new Subject<void>()

  ngOnInit(): void {
    this.filteredDesignations = this.designations.slice()

    if (this.selectedDesignation) {
      this.searchControl.setValue(this.selectedDesignation)
    }

    if (this.disabled) {
      this.searchControl.disable()
    }

    this.searchControl.valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe((value: any) => {
      if (typeof value === 'string') {
        this.filteredDesignations = this.designations.filter(d =>
          d.toLowerCase().includes(value.toLowerCase()),
        )
      }
    })
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  onOptionSelected(designation: string): void {
    this.selectedDesignation = designation
    this.designationSelected.emit(designation)
  }

  clear(): void {
    this.searchControl.setValue('')
    this.selectedDesignation = ''
    this.filteredDesignations = this.designations.slice()
  }
}
