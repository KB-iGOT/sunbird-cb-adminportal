import { Component, OnInit, OnDestroy } from '@angular/core'
import { FormControl } from '@angular/forms'
import { MatTableDataSource } from '@angular/material/table'
import { PageEvent } from '@angular/material/paginator'
import { Subject } from 'rxjs'
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators'
import { TopicsService, Topic, TopicsSearchRequest } from '../topics.service'

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

  constructor(private topicsService: TopicsService) { }

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
        next: (response) => {
          // Handle different possible response structures
          if (response && response.result) {
            this.dataSource.data = response.result.data || []
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
    // Implement add functionality
    console.log('Add new topic')
  }

  editTopic(topic: Topic): void {
    // Implement edit functionality
    console.log('Edit topic:', topic)
  }

  deleteTopic(topic: Topic): void {
    // Implement delete functionality
    console.log('Delete topic:', topic)
  }
}
