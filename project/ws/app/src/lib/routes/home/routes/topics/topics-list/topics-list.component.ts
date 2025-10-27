import { Component, OnInit, OnDestroy } from '@angular/core'
import { FormControl } from '@angular/forms'
import { MatTableDataSource } from '@angular/material/table'
import { PageEvent } from '@angular/material/paginator'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Subject } from 'rxjs'
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators'
import { TopicsService, Topic, TopicsSearchRequest } from '../topics.service'
import { CreateTopicDialogComponent, CreateTopicData } from '../create-topic-dialog/create-topic-dialog.component'

@Component({
  selector: 'ws-app-topics-list',
  templateUrl: './topics-list.component.html',
  styleUrls: ['./topics-list.component.scss']
})
export class TopicsListComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['categoryId', 'categoryName', 'actions'];
  dataSource = new MatTableDataSource<Topic>([]);
  searchControl = new FormControl('');

  // Pagination
  totalCount = 0;
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions = [5, 10, 20, 50];

  // Loading state
  isLoading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private topicsService: TopicsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.setupSearch()
    this.loadTopics()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.pageIndex = 0 // Reset to first page on search
        this.loadTopics()
      })
  }

  loadTopics(): void {
    this.isLoading = true

    const searchRequest: TopicsSearchRequest = {
      filterCriteriaMap: {
        status: 'active'
      },
      requestedFields: ['categoryId', 'categoryName'],
      pageNumber: this.pageIndex,
      pageSize: this.pageSize
    }

    // Add search filter if search term exists
    const searchTerm = this.searchControl.value?.trim()
    if (searchTerm) {
      searchRequest.filterCriteriaMap.categoryName = searchTerm
    }

    this.topicsService.searchTopics(searchRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          debugger
          // Handle different possible response structures
          if (response && response.result && response.result.search_results) {
            this.dataSource.data = response.result.search_results.data || []
            this.totalCount = response.result.count || 0
          } else if (response && Array.isArray(response)) {
            // Fallback if response is directly an array
            this.dataSource.data = response
            this.totalCount = response.length
          } else {
            this.dataSource.data = []
            this.totalCount = 0
          }
          this.isLoading = false
        },
        error: (error) => {
          console.error('Error loading topics:', error)
          this.dataSource.data = []
          this.totalCount = 0
          this.isLoading = false
        }
      })
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex
    this.pageSize = event.pageSize
    this.loadTopics()
  }

  clearSearch(): void {
    this.searchControl.setValue('')
  }

  addTopic(): void {
    const dialogData: CreateTopicData = {
      mode: 'create'
    }

    const dialogRef = this.dialog.open(CreateTopicDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: dialogData,
      disableClose: true
    })

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.snackBar.open('Topic created successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        })
        // Refresh the list
        this.loadTopics()
      }
    })
  }

  editTopic(topic: Topic): void {
    const dialogData: CreateTopicData = {
      mode: 'edit',
      topic: {
        categoryId: topic.categoryId,
        categoryName: topic.categoryName,
        description: topic.status || '' // You might need to fetch full topic details
      }
    }

    const dialogRef = this.dialog.open(CreateTopicDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: dialogData,
      disableClose: true
    })

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.snackBar.open('Topic updated successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        })
        // Refresh the list
        this.loadTopics()
      }
    })
  }

  deleteTopic(topic: Topic): void {
    const confirmMessage = `Are you sure you want to delete the topic "${topic.categoryName}"? This action cannot be undone.`

    if (confirm(confirmMessage)) {
      // TODO: Implement delete API call when available
      console.log('Delete topic:', topic)
      this.snackBar.open('Delete functionality will be implemented when API is available', 'Close', {
        duration: 3000,
        panelClass: ['info-snackbar']
      })
    }
  }
}
