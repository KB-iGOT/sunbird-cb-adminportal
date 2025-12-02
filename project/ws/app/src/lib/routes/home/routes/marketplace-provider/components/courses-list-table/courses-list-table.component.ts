import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core'
import { MatTableDataSource } from '@angular/material/table'
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree'
import { FlatTreeControl } from '@angular/cdk/tree'
import * as _ from 'lodash'
import { FilterNode, FlatFilterNode } from '../../models/configure-provider.model'
import { PageChangeEmitter } from '@sunbird-cb/consumption'

@Component({
  selector: 'ws-app-courses-list-table',
  templateUrl: './courses-list-table.component.html',
  styleUrls: ['./courses-list-table.component.scss']
})
export class CoursesListTableComponent implements OnInit, OnChanges {
  @Input() coursesList: any[] = []
  @Output() actionTriggered = new EventEmitter<{ action: string; data: any }>()

  // Table properties
  displayedColumns: string[] = ['courseName', 'initiatedOn', 'completeOn', 'fileStatus', 'actions']
  dataSource!: MatTableDataSource<any>

  // Search and Filter properties
  searchQuery: string = ''
  sideNavBarOpened: boolean = false
  filters: any[] = []
  selectedfilter: any[] = []

  // Sort properties
  sortField: string = ''
  sortDirection: 'asc' | 'desc' = 'asc'

  // Pagination properties
  paginationSize: number = 10
  paginationSizeOptions: number[] = [10, 20, 50, 100]
  currentPage: number = 1
  totalItemsCount: number = 0

  // Filter tree properties
  filterMenuTreeControl!: FlatTreeControl<FlatFilterNode>
  treeDataSource!: MatTreeFlatDataSource<FilterNode, FlatFilterNode>
  private treeFlattener!: MatTreeFlattener<FilterNode, FlatFilterNode>

  private filterData: FilterNode[] = [
    {
      displayName: 'File Status',
      count: 0,
      children: [
        { displayName: 'Live', count: 0 },
        { displayName: 'Draft', count: 0 },
        { displayName: 'Under Review', count: 0 }
      ]
    }
  ]

  constructor() {
    this.initializeDataSource()
    this.initializeFilterTree()
  }

  ngOnInit(): void {
    this.loadCourses()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.coursesList && !changes.coursesList.firstChange) {
      this.loadCourses()
    }
  }

  private initializeDataSource(): void {
    this.dataSource = new MatTableDataSource<any>([])
  }

  private initializeFilterTree(): void {
    this.treeFlattener = new MatTreeFlattener(
      (node: FilterNode, level: number) => ({
        expandable: !!node.children && node.children.length > 0,
        displayName: node.displayName,
        count: node.count,
        level,
        checked: node.checked || false,
        isDisabled: node.isDisabled || false
      }),
      (node: FlatFilterNode) => node.level,
      (node: FlatFilterNode) => node.expandable,
      (node: FilterNode) => node.children
    )

    this.filterMenuTreeControl = new FlatTreeControl<FlatFilterNode>(
      (node: FlatFilterNode) => node.level,
      (node: FlatFilterNode) => node.expandable
    )

    this.treeDataSource = new MatTreeFlatDataSource(
      this.filterMenuTreeControl,
      this.treeFlattener
    )
    this.treeDataSource.data = this.filterData
  }

  hasChild = (_: number, node: FlatFilterNode) => node.expandable

  loadCourses(): void {
    if (this.coursesList && this.coursesList.length > 0) {
      this.dataSource.data = this.coursesList
      this.totalItemsCount = this.coursesList.length
      this.currentPage = 1
      this.updateFilterCounts()
    }
  }

  private updateFilterCounts(): void {
    // Update filter counts based on current data
    const data = this.dataSource.data
    if (this.filterData[0].children) {
      this.filterData[0].children.forEach(filter => {
        filter.count = data.filter(
          item => item.fileStatus === filter.displayName
        ).length
      })
    }
  }

  onSearchInput(): void {
    const filterValue = this.searchQuery.toLowerCase()
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      return data.courseName.toLowerCase().includes(filter)
    }
    this.dataSource.filter = filterValue
    this.currentPage = 1
    this.totalItemsCount = this.dataSource.filteredData.length
  }

  onSortChange(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'
    } else {
      this.sortField = field
      this.sortDirection = 'asc'
    }
    this.sortTableData()
  }

  private sortTableData(): void {
    const data = this.dataSource.data
    data.sort((a, b) => {
      let aValue = _.get(a, this.sortField)
      let bValue = _.get(b, this.sortField)

      if (aValue instanceof Date) {
        aValue = aValue.getTime()
      }
      if (bValue instanceof Date) {
        bValue = bValue.getTime()
      }

      let comparison = 0
      if (aValue < bValue) {
        comparison = -1
      } else if (aValue > bValue) {
        comparison = 1
      }

      return this.sortDirection === 'asc' ? comparison : comparison * -1
    })

    this.dataSource.data = [...data]
  }

  filterApplyEvent(node: any, event: any, isRemove: boolean = false): void {
    if (isRemove) {
      _.remove(this.selectedfilter, item => item.displayName === node.displayName)
      _.remove(this.filters, item => item.displayName === node.displayName)
      node.checked = false
    } else {
      if (event.checked) {
        this.selectedfilter.push(node)
      } else {
        _.remove(this.selectedfilter, item => item.displayName === node.displayName)
      }
    }
  }

  clearAllFilters(): void {
    this.selectedfilter = []
    this.filters = []
    this.dataSource.data = this.coursesList
    this.treeDataSource.data = this.filterData
    this.updateFilterCounts()
    this.currentPage = 1
    this.totalItemsCount = this.coursesList.length
  }

  applyNewFilter(apply: boolean): void {
    if (apply && this.selectedfilter.length > 0) {
      const selectedStatuses = this.selectedfilter.map(f => f.displayName)
      const filteredData = this.coursesList.filter(item =>
        selectedStatuses.includes(item.fileStatus)
      )
      this.dataSource.data = filteredData
      this.filters = [...this.selectedfilter]
      this.currentPage = 1
      this.totalItemsCount = filteredData.length
      this.closeFilterSidebar()
    }
  }

  openFilterSidebar(): void {
    this.sideNavBarOpened = true
    const headers = document.getElementsByClassName('top-nav-bar')
    if (headers.length > 0) {
      (headers[0] as HTMLElement).style.zIndex = '0'
    }
  }

  closeFilterSidebar(): void {
    this.sideNavBarOpened = false
    const headers = document.getElementsByClassName('top-nav-bar')
    if (headers.length > 0) {
      (headers[0] as HTMLElement).style.zIndex = '1000'
    }
  }

  onPageChange(event: PageChangeEmitter): void {
    // Update pagination properties based on custom pagination component event
    this.currentPage = event.currentPage
    this.paginationSize = event.limit
    // this.searchRequestCourse.request.limit = event.limit
    // this.searchRequestCourse.request.offset = (event.currentPage - 1) * event.limit;
  }

  takeAction(action: string, rowData: any): void {
    this.actionTriggered.emit({ action, data: rowData })
  }

  capitalizeText(text: string): string {
    if (!text) {
      return ''
    }
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
  }
}
