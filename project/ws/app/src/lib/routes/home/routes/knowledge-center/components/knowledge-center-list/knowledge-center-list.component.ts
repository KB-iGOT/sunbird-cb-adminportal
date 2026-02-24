import { Component, OnInit } from '@angular/core'
import { FormControl } from '@angular/forms'
import { MatTableDataSource } from '@angular/material/table'
import { PageChangeEmitter } from '@sunbird-cb/consumption'
import { Router } from '@angular/router'
import * as _ from 'lodash'
import { DeveloperDocService } from '../../services/developer-doc.service'

interface MenuItem {
  label: string
  action: string
  icon?: string
}

interface Article {
  id?: string
  title?: string
  summary?: string
  category?: string
  lastUpdated?: Date | string
  status?: string
  visibility?: string
  type?: string
  createdBy?: string
  updatedBy?: string
  createdOn?: string
  updatedOn?: string
  [key: string]: any
}

@Component({
  selector: 'ws-app-knowledge-center-list',
  templateUrl: './knowledge-center-list.component.html',
  styleUrls: ['./knowledge-center-list.component.scss'],
  standalone: false,
})
export class KnowledgeCenterListComponent implements OnInit {
  // Form controls
  searchControl = new FormControl()

  // Table properties
  displayedColumns: string[] = []
  dataSource!: MatTableDataSource<any>
  columnsList: any[] = []
  tableColumns: any[] = []

  // Table data properties
  articlesList: Article[] = []

  // Sorting properties
  sortField: string = ''
  sortDirection: 'asc' | 'desc' = 'asc'

  // Pagination properties
  paginationSize: number = 10
  currentPage: number = 0
  totalItemsCount: number = 0
  pageSizeOptions: number[] = [10, 20, 50, 100]
  showPagination: boolean = true
  paginationDetails: any

  // UI properties
  noDataMessage: string = 'No articles found'
  searchQuery: string = ''
  showLoader: boolean = false

  // Menu items for action dropdown
  menuItems: MenuItem[] = [
    { label: 'View', action: 'view', icon: 'visibility' },
    { label: 'Edit', action: 'edit', icon: 'edit' },
    { label: 'Delete', action: 'delete', icon: 'delete' },
  ]

  // Table configuration
  tableData: any = {
    columns: [
      {
        displayName: 'Title / Summary',
        key: 'title',
        cellType: 'text',
        imageKey: null,
      },
      {
        displayName: 'Category',
        key: 'category',
        cellType: 'text',
      },
      {
        displayName: 'Status',
        key: 'status',
        cellType: 'status',
      },
      {
        displayName: 'Type',
        key: 'type',
        cellType: 'text',
      },
      {
        displayName: 'Updated On',
        key: 'updatedOn',
        cellType: 'text',
      },
    ]
  }

  constructor(
    private developerDocService: DeveloperDocService,
    private router: Router
  ) {
    this.dataSource = new MatTableDataSource<any>([])
  }

  ngOnInit(): void {
    this.initializeTable()
    this.loadArticles()
  }

  private initializeTable(): void {
    if (this.tableData && this.tableData.columns) {
      this.noDataMessage = _.get(this.tableData, 'noDataMessage', 'No articles found')
      this.getColumnConfiguration()
    }
  }

  /**
   * Get column configuration
   */
  private getColumnConfiguration(): void {
    this.columnsList = []
    this.displayedColumns = []
    const columns = JSON.parse(JSON.stringify(this.tableData.columns))

    // Add action column
    const actionColumn = { displayName: 'Actions', key: 'actions', cellType: 'menu' }
    columns.push(actionColumn)

    this.tableColumns = columns
    this.columnsList = columns
    this.displayedColumns = _.map(columns, c => c.key)
  }

  private loadArticles(): void {
    this.showLoader = true
    const formBody = {
      filterCriteriaMap: {
        showUnderDeveloperDocs: true,
        type: 'CATEGORY'
      },
      requestedFields: [],
      pageNumber: this.currentPage,
      pageSize: this.paginationSize,
      facets: []
    }

    this.developerDocService.getArticles(formBody).subscribe(
      (response: any) => {
        if (response && response.data) {
          // Transform API response to article format
          this.articlesList = response.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            summary: item.summary,
            category: item.type,
            status: item.status,
            type: item.type,
            createdBy: item.createdBy,
            updatedBy: item.updatedBy,
            createdOn: item.createdOn,
            updatedOn: item.updatedOn,
          }))

          this.totalItemsCount = response.totalCount || 0
          this.dataSource = new MatTableDataSource<any>(this.articlesList)
        } else {
          this.articlesList = []
          this.dataSource = new MatTableDataSource<any>([])
        }
        this.showLoader = false
      },
      (error: any) => {
        console.error('Error loading articles:', error)
        this.showLoader = false
        this.dataSource = new MatTableDataSource<any>([])
      }
    )
  }

  onSearchInput(): void {
    const searchValue = this.searchControl.value ? this.searchControl.value.toLowerCase() : ''

    if (searchValue) {
      const filteredData = this.articlesList.filter(article => {
        return (
          article.title?.toLowerCase().includes(searchValue) ||
          article.summary?.toLowerCase().includes(searchValue) ||
          article.category?.toLowerCase().includes(searchValue) ||
          article.status?.toLowerCase().includes(searchValue) ||
          JSON.stringify(article).toLowerCase().includes(searchValue)
        )
      })
      this.dataSource = new MatTableDataSource<any>(filteredData)
    } else {
      this.dataSource = new MatTableDataSource<any>(this.articlesList)
    }

    this.searchQuery = searchValue
  }

  /**
   * Handle sort change
   */
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
    this.currentPage = event.currentPage
    this.paginationSize = event.limit

    this.paginationDetails = {
      pageSize: event.limit,
      totalCount: this.totalItemsCount,
      currentPage: event.currentPage,
      previousPage: event.previousPage,
      limit: event.limit,
    }

    // Reload articles with new pagination
    this.loadArticles()
  }

  /**
   * Handle action menu click
   */
  takeAction(action: string, article: Article): void {
    switch (action) {
      case 'view':
      case 'edit':
        this.router.navigate(['/app/home/knowledge-center/developer-doc'], {
          queryParams: { id: article.id, mode: action }
        })
        break
      case 'delete':
        this.deleteArticle(article)
        break
      default:
        console.warn(`Unknown action: ${action}`)
    }
  }

  private deleteArticle(article: Article): void {
    if (confirm(`Are you sure you want to delete "${article.title}"?`)) {
      this.articlesList = this.articlesList.filter(a => a.id !== article.id)
      this.loadArticles()
    }
  }

  addNewArticle(): void {
    this.router.navigate(['/app/home/knowledge-center/developer-doc'])
  }

  capitalizeText(text: string): string {
    if (!text) return ''
    return text?.charAt(0)?.toUpperCase() + text.slice(1)?.toLowerCase()
  }
}
