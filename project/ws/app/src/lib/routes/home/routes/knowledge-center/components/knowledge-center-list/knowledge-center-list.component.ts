import { Component, OnInit, OnChanges, SimpleChanges } from '@angular/core'
import { MatTableDataSource } from '@angular/material/table'
import { PageChangeEmitter } from '@sunbird-cb/consumption'
import * as _ from 'lodash'

interface MenuItem {
  label: string
  action: string
  icon?: string
}

interface Article {
  id?: string
  title: string
  author: string
  category: string
  lastUpdated: Date
  status: 'Draft' | 'Published' | 'Archived'
  visibility: 'Public' | 'Private' | 'Internal'
}

@Component({
  selector: 'ws-app-knowledge-center-list',
  templateUrl: './knowledge-center-list.component.html',
  styleUrls: ['./knowledge-center-list.component.scss'],
  standalone: false,
})
export class KnowledgeCenterListComponent implements OnInit, OnChanges {
  // Table data properties
  articlesList: Article[] = []
  dataSource!: MatTableDataSource<Article>
  displayedColumns: string[] = ['title', 'category', 'lastUpdated', 'status', 'visibility', 'actions']

  // Sorting properties
  sortField: string = 'lastUpdated'
  sortDirection: 'asc' | 'desc' = 'desc'

  // Pagination properties
  paginationSize: number = 10
  currentPage: number = 0
  totalItemsCount: number = 0
  pageSizeOptions: number[] = [5, 10, 20, 50]
  showPagination: boolean = true

  // UI properties
  noDataMessage: string = 'No articles found'

  // Menu items for action dropdown
  menuItems: MenuItem[] = [
    { label: 'View', action: 'view', icon: 'visibility' },
    { label: 'Edit', action: 'edit', icon: 'edit' },
    { label: 'Delete', action: 'delete', icon: 'delete' },
  ]

  constructor() {
    this.dataSource = new MatTableDataSource<Article>([])
  }

  ngOnInit(): void {
    this.initializeTable()
    this.loadArticles()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.articlesList) {
      this.loadArticles()
    }
  }

  /**
   * Initialize table data
   */
  private initializeTable(): void {
    // Sample data - replace with API call
    this.articlesList = [
      {
        id: '1',
        title: 'Getting Started with Angular',
        author: 'John Doe',
        category: 'Web Development',
        lastUpdated: new Date('2024-02-20'),
        status: 'Published',
        visibility: 'Public',
      },
      {
        id: '2',
        title: 'TypeScript Best Practices',
        author: 'Jane Smith',
        category: 'Programming',
        lastUpdated: new Date('2024-02-18'),
        status: 'Published',
        visibility: 'Public',
      },
      {
        id: '3',
        title: 'Advanced Routing Techniques',
        author: 'Mike Johnson',
        category: 'Web Development',
        lastUpdated: new Date('2024-02-15'),
        status: 'Draft',
        visibility: 'Private',
      },
      {
        id: '4',
        title: 'State Management with NGRX',
        author: 'Sarah Williams',
        category: 'Angular',
        lastUpdated: new Date('2024-02-10'),
        status: 'Published',
        visibility: 'Internal',
      },
      {
        id: '5',
        title: 'RESTful API Design',
        author: 'Robert Brown',
        category: 'Backend',
        lastUpdated: new Date('2024-02-05'),
        status: 'Archived',
        visibility: 'Public',
      },
    ]

    this.loadArticles()
  }

  /**
   * Load articles into table
   */
  private loadArticles(): void {
    if (this.articlesList && this.articlesList.length > 0) {
      // Sort data on load
      const sortedData = _.orderBy(this.articlesList, [this.sortField], [this.sortDirection])
      this.dataSource = new MatTableDataSource<Article>(sortedData)
      this.totalItemsCount = this.articlesList.length
    } else {
      this.dataSource = new MatTableDataSource<Article>([])
      this.totalItemsCount = 0
    }
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

  /**
   * Sort table data
   */
  private sortData(): void {
    const sorted = _.orderBy(this.dataSource.data, [this.sortField], [this.sortDirection])
    this.dataSource = new MatTableDataSource<Article>(sorted)
  }

  /**
   * Handle pagination change
   */
  onPageChange(event: PageChangeEmitter): void {
    this.currentPage = event.currentPage
    this.paginationSize = event.limit

    // You can emit this to parent or call API with pagination details
    console.log('Page changed:', {
      pageSize: event.limit,
      currentPage: event.currentPage,
      previousPage: event.previousPage,
    })
  }

  /**
   * Handle action menu click
   */
  takeAction(action: string, article: Article): void {
    console.log(`Action: ${action}`, article)

    switch (action) {
      case 'view':
        this.viewArticle(article)
        break
      case 'edit':
        this.editArticle(article)
        break
      case 'delete':
        this.deleteArticle(article)
        break
      default:
        console.warn(`Unknown action: ${action}`)
    }
  }

  /**
   * View article
   */
  private viewArticle(article: Article): void {
    console.log('Viewing article:', article)
    // TODO: Navigate to view page or open dialog
  }

  /**
   * Edit article
   */
  private editArticle(article: Article): void {
    console.log('Editing article:', article)
    // TODO: Navigate to edit page or open dialog
  }

  /**
   * Delete article
   */
  private deleteArticle(article: Article): void {
    if (confirm(`Are you sure you want to delete "${article.title}"?`)) {
      console.log('Deleting article:', article)
      // TODO: Call API to delete article and refresh table
      this.articlesList = this.articlesList.filter(a => a.id !== article.id)
      this.loadArticles()
    }
  }

  /**
   * Add new article
   */
  addNewArticle(): void {
    console.log('Add new article clicked')
    // TODO: Navigate to create article page or open dialog
  }
}
