import { Component, OnInit, OnDestroy } from '@angular/core'
import { FormControl } from '@angular/forms'
import { MatTableDataSource } from '@angular/material/table'
import { PageChangeEmitter } from '@sunbird-cb/consumption'
import { Router } from '@angular/router'
import * as _ from 'lodash'
import { debounceTime, map } from 'rxjs/operators'
import { Subject, Subscription } from 'rxjs'
import { DeveloperDocService } from '../../services/developer-doc.service'
import { MatSnackBar } from '@angular/material/snack-bar'

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
export class KnowledgeCenterListComponent implements OnInit, OnDestroy {
  // Form controls
  searchControl = new FormControl()

  // Search properties
  searchSubject$ = new Subject<string>()
  searchSubscription: Subscription | null = null
  articleApiSubscription: Subscription | null = null

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
  currentPage: number = 1
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
    { label: 'View', action: 'view', icon: '' },
    { label: 'Edit', action: 'edit', icon: '' },
    { label: 'Delete', action: 'delete', icon: '' },
  ]

  // Table configuration
  tableData: any = {
    columns: [
      {
        displayName: 'Title',
        key: 'title',
        cellType: 'text',
      },
      {
        displayName: 'Category',
        key: 'categoryName',
        cellType: 'text',
      },
      {
        displayName: 'Status',
        key: 'status',
        cellType: 'status',
      },
      {
        displayName: 'Visibility',
        key: 'visibility',
        cellType: 'text',
      },
    ]
  }

  constructor(
    private developerDocService: DeveloperDocService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<any>([])
  }

  ngOnInit(): void {
    this.initializeTable()
    this.setupSearchListener()
    this.loadArticles()
  }

  ngOnDestroy(): void {
    // Unsubscribe from search and article API calls
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe()
    }
    if (this.articleApiSubscription) {
      this.articleApiSubscription.unsubscribe()
    }
    this.searchSubject$.complete()
  }

  private initializeTable(): void {
    if (this.tableData && this.tableData.columns) {
      this.noDataMessage = _.get(this.tableData, 'noDataMessage', 'No articles found')
      this.getColumnConfiguration()
    }
  }

  private setupSearchListener(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe()
    }

    this.searchSubscription = this.searchControl.valueChanges
      .pipe(debounceTime(2000))
      .subscribe((searchValue: string) => {
        this.currentPage = 1
        this.onSearchInput(searchValue)
      })
  }

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

  private loadArticles(searchString: string = ''): void {
    this.showLoader = true

    // Cancel any existing API call
    if (this.articleApiSubscription) {
      this.articleApiSubscription.unsubscribe()
    }

    // Build form body with proper structure
    const formBody: any = {
      filterCriteriaMap: {
        type: ['subcategory'],
      },
      pageNumber: this.currentPage - 1,
      pageSize: this.paginationSize,
      orderBy: 'createdOn',
      orderDirection: 'desc',
      requestedFields: [
        'type',
        'title',
        'status',
        'isPublic',
        'createdOn',
        'createdBy',
        'updatedBy',
        'updatedOn',
        'subCategoryId',
        'categoryId'
      ]
    }

    if (searchString) {
      formBody.searchString = searchString
    }

    this.articleApiSubscription = this.developerDocService.getArticles(formBody)
      .pipe(
        map((response: any) => {
          // Extract all needed data from response
          const data = _.get(response, 'result.data', [])
          const totalCount = _.get(response, 'result.totalCount', 0)
          const userDetails = _.get(response, 'result.userDetails', [])
          const categoryDetails = _.get(response, 'result.categoryDetails', [])

          return {
            data: data.map((item: any) => {
              // Get createdBy and categoryId with null checks
              const createdBy = _.get(item, 'createdBy', null)
              const categoryId = _.get(item, 'categoryId', null)

              // Find matching user and category records
              const creator = createdBy ? _.find(userDetails, { user_id: createdBy }) : null
              const category = categoryId ? _.find(categoryDetails, { id: categoryId }) : null

              return {
                ...item,
                status: _.get(item, 'status', '').toUpperCase() === 'ARCHIVED' ? 'DELETED' : _.get(item, 'status', ''),
                visibility: _.get(item, 'isPublic', false) ? 'Public' : 'Members',
                ...(creator && { creatorName: _.get(creator, 'first_name', '') }),
                ...(category && { categoryName: _.get(category, 'title', '') }),
              }
            }),
            totalCount,
          }
        })
      )
      .subscribe(
        (transformedResponse: any) => {
          const data = _.get(transformedResponse, 'data', [])
          const totalCount = _.get(transformedResponse, 'totalCount', 0)

          if (data && Array.isArray(data)) {
            this.articlesList = data
            this.totalItemsCount = totalCount
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
          this.articlesList = []
          this.dataSource = new MatTableDataSource<any>([])
        }
      )
  }

  onSearchInput(searchValue?: string): void {
    const value = searchValue !== undefined ? searchValue : (this.searchControl.value || '')
    const trimmedSearch = value.trim().toLowerCase()

    this.searchQuery = trimmedSearch

    if (!trimmedSearch) {
      this.currentPage = 1
      this.loadArticles()
      return
    }

    if (trimmedSearch.length < 3 && trimmedSearch.length !== 0) {
      this.articlesList = []
      this.dataSource = new MatTableDataSource<any>([])
      return
    }

    this.currentPage = 1
    this.loadArticles(trimmedSearch)
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
    this.currentPage = _.get(event, 'currentPage', 1)
    this.paginationSize = _.get(event, 'limit', 10)

    this.paginationDetails = {
      pageSize: _.get(event, 'limit', 10),
      totalCount: this.totalItemsCount,
      currentPage: _.get(event, 'currentPage', 1),
      previousPage: _.get(event, 'previousPage', 1),
      limit: _.get(event, 'limit', 10),
    }

    this.loadArticles(this.searchQuery)
  }

  /**
   * Handle action menu click
   */
  takeAction(action: string, article: Article): void {
    switch (action) {
      case 'view':
      case 'edit':
        this.router.navigate(['/app/home/knowledge-center/developer-doc'], {
          queryParams: { id: article.subCategoryId, mode: action }
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
    // if (confirm(`Are you sure you want to delete "${_.get(article, 'title', 'this article')}"`)) {
    //   this.articlesList = this.articlesList.filter(a => a.id !== article.id)
    //   this.loadArticles(this.searchQuery)
    // }
    if (article.subCategoryId) {
      this.developerDocService.deleteSubCategory(article.subCategoryId).subscribe(
        () => {
          this.snackBar.open('Article deleted successfully')
          this.loadArticles(this.searchQuery)
        },
        (error: any) => {
          if (error) {
            this.snackBar.open('Something went wrong while deleting the article, please try again ')
          }
        }
      )
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
