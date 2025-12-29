import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core'
import { FormControl } from '@angular/forms'
import { MatCheckboxChange } from '@angular/material/checkbox'
import { MatTableDataSource } from '@angular/material/table'
import { PageChangeEmitter } from '@sunbird-cb/consumption'
import * as _ from 'lodash'

@Component({
  selector: 'ws-app-courses-list-table',
  templateUrl: './courses-list-table.component.html',
  styleUrls: ['./courses-list-table.component.scss']
})
export class CoursesListTableComponent implements OnInit, OnChanges {
  @Input() coursesList: any[] = []
  @Input() tableData: any = {}
  @Input() paginationDetails: any
  @Input() menuItems: any[] = []
  @Input() showDefaultMenu: boolean = false
  @Output() actionTriggered = new EventEmitter<{ action: string; rows: any }>()
  @Output() searchKey = new EventEmitter<string>()
  @Output() pageChange = new EventEmitter<any>()

  // Form controls
  searchControl = new FormControl()

  // Table properties
  displayedColumns: string[] = []
  dataSource!: MatTableDataSource<any>
  columnsList: any[] = []
  tableColumns: any[] = []

  // Search and Filter properties
  searchQuery: string = ''
  noDataMessage = 'No data found'

  // Sort properties
  sortField: string = ''
  sortDirection: 'asc' | 'desc' = 'asc'

  // Pagination properties
  pageSizeOptions: number[] = [10, 20, 50, 100]
  paginationSize: number = 10
  currentPage: number = 0
  totalItemsCount: number = 0

  // UI Properties
  showSearchBox = true
  showPagination = true
  showDeleteAll = false
  needCheckBox = false
  allSelected = false
  selectedRowData: any[] = []
  showLoader = false
  showAcceptRejectMenu = false

  constructor() {
    this.dataSource = new MatTableDataSource<any>([])
  }

  ngOnInit(): void {
    this.initializeTable()
    this.loadCourses()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.coursesList) {
      this.loadCourses()
    }
    if (changes.tableData) {
      this.initializeTable()
    }
    if (changes.paginationDetails) {
      this.updatePaginationDetails()
    }
  }

  private initializeTable(): void {
    if (this.tableData && this.tableData.columns) {
      this.showSearchBox = _.get(this.tableData, 'showSearchBox', true)
      this.showDeleteAll = _.get(this.tableData, 'showDeleteAll', false)
      this.showPagination = _.get(this.tableData, 'showPagination', true)
      this.needCheckBox = _.get(this.tableData, 'needCheckBox', false)
      this.showAcceptRejectMenu = _.get(this.tableData, 'acceptRejectMenu', false)
      this.noDataMessage = _.get(this.tableData, 'noDataMessage', 'No data found')
      this.getColumnConfiguration()
    }
  }

  private getColumnConfiguration(): void {
    this.columnsList = []
    this.displayedColumns = []
    const columns = JSON.parse(JSON.stringify(this.tableData.columns))

    if (this.needCheckBox) {
      const selectColumn = { displayName: '', key: 'select', cellType: 'select' }
      columns.splice(0, 0, selectColumn)
    }

    if (this.showDefaultMenu || this.menuItems.length > 0) {
      const menuColumn = { displayName: 'Actions', key: 'menu', cellType: 'menu' }
      columns.push(menuColumn)
    }

    if (this.showAcceptRejectMenu) {
      const acceptRejectColumn = { displayName: 'Action', key: 'acceptReject', cellType: 'acceptReject' }
      columns.push(acceptRejectColumn)
    }

    this.tableColumns = columns
    this.columnsList = columns
    this.displayedColumns = _.map(columns, c => c.key)
  }

  private loadCourses(): void {
    if (this.coursesList && this.coursesList.length > 0) {
      this.dataSource = new MatTableDataSource<any>(this.coursesList)
      this.totalItemsCount = this.coursesList.length
      this.updatePaginationDetails()
    } else {
      this.dataSource = new MatTableDataSource<any>([])
      this.totalItemsCount = 0
    }
  }

  private updatePaginationDetails(): void {
    if (this.paginationDetails) {
      this.currentPage = this.paginationDetails.currentPage || 0
      this.paginationSize = this.paginationDetails.pageSize || 10
      this.totalItemsCount = this.paginationDetails.totalCount || this.coursesList.length
    }
  }

  onSearchInput(): void {
    const searchValue = this.searchControl.value ? this.searchControl.value.toLowerCase() : ''

    if (searchValue) {
      const filteredData = this.coursesList.filter(course => {
        // Search across all string fields in the course object
        return (
          course.name?.toLowerCase().includes(searchValue) ||
          course.courseName?.toLowerCase().includes(searchValue) ||
          course.source?.toLowerCase().includes(searchValue) ||
          course.status?.toLowerCase().includes(searchValue) ||
          JSON.stringify(course).toLowerCase().includes(searchValue)
        )
      })
      this.dataSource = new MatTableDataSource<any>(filteredData)
    } else {
      this.dataSource = new MatTableDataSource<any>(this.coursesList)
    }

    this.searchKey.emit(searchValue)
  }

  onSortChange(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'
    } else {
      this.sortField = field
      this.sortDirection = 'asc'
    }
    this.sortData()
  }

  private sortData(): void {
    const sorted = _.orderBy(this.dataSource.data, [this.sortField], [this.sortDirection])
    this.dataSource = new MatTableDataSource<any>(sorted)
  }

  onPageChange(event: PageChangeEmitter): void {
    // Extract pagination details from ws-widget-pagination PageChangeEmitter
    this.pageChange.emit({
      pageSize: event.limit,
      totalCount: this.paginationDetails?.totalCount,
      currentPage: event.currentPage,
      previousPage: event.previousPage,
      limit: event.limit,
    })
  }

  selectAll(event: MatCheckboxChange): void {
    this.allSelected = event.checked
    this.selectedRowData = []
    this.dataSource.filteredData.forEach((course: any) => {
      course['isChecked'] = this.allSelected
      if (this.allSelected) {
        this.selectedRowData.push(course)
      }
    })
  }

  onCheckboxChange(event: MatCheckboxChange, course: any): void {
    course.isChecked = event.checked
    if (event.checked) {
      this.selectedRowData.push(course)
    } else {
      this.selectedRowData = this.selectedRowData.filter((c: any) => c.id !== course.id)
    }
    this.allSelected = this.selectedRowData.length === this.dataSource.filteredData.length
  }

  deleteAllSelected(): void {
    if (this.selectedRowData.length > 0) {
      this.actionTriggered.emit({ action: 'delete', rows: this.selectedRowData })
    }
  }

  takeAction(action: string, data: any): void {
    this.actionTriggered.emit({ action, rows: data })
  }

  capitalizeText(text: string): string {
    if (!text) return ''
    return text?.charAt(0)?.toUpperCase() + text.slice(1)?.toLowerCase()
  }
}
