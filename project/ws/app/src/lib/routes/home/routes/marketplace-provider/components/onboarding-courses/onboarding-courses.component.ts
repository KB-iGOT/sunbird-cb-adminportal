import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core'
import { MarketplaceService } from '../../services/marketplace.service'
import { map } from 'rxjs/operators'
import * as _ from 'lodash'
import { DatePipe } from '@angular/common'
import { HttpErrorResponse } from '@angular/common/http'
import { MatSnackBar } from '@angular/material/snack-bar'
import { SnackbarComponent } from '@sunbird-cb/consumption'

@Component({
    selector: 'ws-app-onboarding-courses',
    templateUrl: './onboarding-courses.component.html',
    styleUrls: ['./onboarding-courses.component.scss'],
    providers: [DatePipe],
    standalone: false
})
export class OnboardingCoursesComponent implements OnInit, OnChanges {
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>

  @Input() providerDetails: any
  @Output() loadProviderDetails = new EventEmitter<any>()

  addCoursesFlag: boolean = false

  // Upload Status Tab
  contentTableData: any
  uploadedContentList: any[] = []
  showUploadedStatusLoader = false
  contenetMenuItems: { icon: string; btnText: string; action: string }[] = []

  // Published Courses Tab
  publishedCoursesTableData: any
  publishedCoursesList: any[] = []
  showPublishedCoursesLoader = false
  publishedCoursesSerachKey = ''
  publishedCoursesTablePaginationDetails: any

  // Not Published Courses Tab
  unPublishedCoursesTableData: any
  unPublishedCoursesList: any[] = []
  showUnpublishedCoursesLoader = false
  unpublishedCoursesMenuItems: { icon: string; btnText: string; action: string }[] = []
  unPublishedCoursesSearchKey = ''
  unPublishedCoursesTablePaginationDetails: any

  defaultPagination = {
    currentPage: 1,
    pageSize: 20,
    totalCount: 20,
    paginationSize: 10,
    paginationSizeOptions: [10, 20, 50, 100]
  }

  delayTabLoad = true
  openedTab = ''

  constructor(
    private marketPlaceSvc: MarketplaceService,
    private datePipe: DatePipe,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.tableDataInitialization()
    if (this.providerDetails) {
      this.getTablesData()
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.providerDetails && changes.providerDetails.currentValue) {
      this.tableDataInitialization()
      this.getTablesData()
    }
  }

  tableDataInitialization(): void {
    this.contentTableData = {
      columns: [
        { displayName: 'File Name', key: 'name', cellType: 'text' },
        { displayName: 'File Status', key: 'status', cellType: 'status' },
        { displayName: 'Initiated On', key: 'intiatedOn', cellType: 'text' },
        { displayName: 'Completed On', key: 'completedOn', cellType: 'text' },
      ],
      needCheckBox: false,
      showDeleteAll: false,
      showSearchBox: false,
      showPagination: false,
    }
    this.contenetMenuItems = [
      {
        icon: '',
        btnText: 'Download Log',
        action: 'downloadLog',
      },
    ]

    this.unPublishedCoursesTableData = {
      columns: [
        { displayName: 'Course name', key: 'courseName', cellType: 'text', imageKey: 'courseImg', cellClass: 'text-overflow-elipse' },
        { displayName: 'Source', key: 'source', cellType: 'text' },
        { displayName: 'Listed On', key: 'listedOn', cellType: 'text' },
      ],
      needCheckBox: true,
      showDeleteAll: true,
    }
    this.unpublishedCoursesMenuItems = [
      {
        icon: '',
        btnText: 'Delete',
        action: 'delete',
      },
    ]
    this.setPagination('notPublished', this.defaultPagination)

    this.publishedCoursesTableData = {
      columns: [
        { displayName: 'Course name', key: 'courseName', cellType: 'text', imageKey: 'courseImg', cellClass: 'text-overflow-elipse' },
        { displayName: 'Source', key: 'source', cellType: 'text' },
        { displayName: 'Published On', key: 'publishedOn', cellType: 'text' },
        { displayName: 'Listed On', key: 'listedOn', cellType: 'text' },
      ],
      needCheckBox: false,
      showDeleteAll: false,
    }
    this.setPagination('published', this.defaultPagination)

    this.delayTabLoad = false
  }

  getTablesData(): void {
    this.getContentList()
    this.getPublishedCoursesList()
    this.getUnPublishedCoursesList()
  }

  getContentList(): void {
    if (this.providerDetails && this.providerDetails.id) {
      this.showUploadedStatusLoader = true
      this.marketPlaceSvc.getContentList(this.providerDetails.id)
        .pipe(map((response: any) => {
          return this.formateContentList(response)
        }))
        .subscribe({
          next: (result: any) => {
            this.showUploadedStatusLoader = false
            this.uploadedContentList = result
          },
          error: (error: HttpErrorResponse) => {
            this.showUploadedStatusLoader = false
            const errmsg = _.get(error, 'error.params.errMsg', 'Something went wrong please try again')
            this.showSnackBar(errmsg, 'error')
          },
        })
    }
  }

  formateContentList(response: any): any {
    let formatedList: any = []
    if (response) {
      formatedList = response
        .sort((a: any, b: any) => {
          const dateA = new Date(a.initiatedOn)
          const dateB = new Date(b.initiatedOn)
          return dateB.getTime() - dateA.getTime()
        })
        .map((element: any) => {
          return {
            status: element.status === 'success' ? 'Live' :
              element.status === 'InProgress' ? 'In Progress' : 'Failed',
            name: element.fileName,
            intiatedOn: this.datePipe.transform(new Date(element.initiatedOn), 'dd MMM yyyy hh:mm a'),
            completedOn: this.datePipe.transform(new Date(element.completedOn), 'dd MMM yyyy hh:mm a'),
            gcpfileName: element.gcpfileName,
          }
        })
    }
    return formatedList
  }

  getPublishedCoursesList(): void {
    if (_.get(this.providerDetails, 'data.partnerCode')) {
      this.showPublishedCoursesLoader = true
      this.publishedCoursesList = []
      const formBody = {
        filterCriteriaMap: {
          partnerCode: _.get(this.providerDetails, 'data.partnerCode'),
          status: ['live'],
        },
        pageNumber: this.publishedCoursesTablePaginationDetails.currentPage - 1,
        pageSize: this.publishedCoursesTablePaginationDetails.pageSize,
        searchString: this.publishedCoursesSerachKey,
      }
      this.marketPlaceSvc.getCoursesList(formBody)
        .pipe(map((response: any) => {
          const formatedData = {
            totalCount: _.get(response, 'totalCount', 0),
            formatedList: this.formateCoursesList(_.get(response, 'data', [])),
          }
          return formatedData
        }))
        .subscribe({
          next: (result: any) => {
            this.publishedCoursesList = result.formatedList
            this.publishedCoursesTablePaginationDetails.totalCount = result.totalCount
            this.showPublishedCoursesLoader = false
          },
          error: (error: HttpErrorResponse) => {
            const errmsg = _.get(error, 'error.params.errMsg', 'Something went wrong please try again')
            this.showPublishedCoursesLoader = false
            const message = _.get(error, 'error.message')
            if (!(error.status === 400 && message.includes('index_not_found_exception'))) {
              this.showSnackBar(errmsg, 'error')
            }
          },
        })
    }
  }

  getUnPublishedCoursesList(): void {
    if (_.get(this.providerDetails, 'data.partnerCode')) {
      this.showUnpublishedCoursesLoader = true
      this.unPublishedCoursesList = []
      const formBody = {
        filterCriteriaMap: {
          status: ['draft', 'notInitiated'],
          partnerCode: _.get(this.providerDetails, 'data.partnerCode'),
        },
        pageNumber: this.unPublishedCoursesTablePaginationDetails.currentPage - 1,
        pageSize: this.unPublishedCoursesTablePaginationDetails.pageSize,
        searchString: this.unPublishedCoursesSearchKey,
      }
      this.marketPlaceSvc.getCoursesList(formBody)
        .pipe(map((response: any) => {
          const formatedData = {
            totalCount: _.get(response, 'totalCount', 0),
            formatedList: this.formateCoursesList(_.get(response, 'data', [])),
          }
          return formatedData
        }))
        .subscribe({
          next: (result: any) => {
            this.unPublishedCoursesList = result.formatedList
            this.unPublishedCoursesTablePaginationDetails.totalCount = result.totalCount
            this.showUnpublishedCoursesLoader = false
          },
          error: (error: HttpErrorResponse) => {
            const errmsg = _.get(error, 'error.params.errMsg', 'Something went wrong please try again')
            this.showUnpublishedCoursesLoader = false
            const message = _.get(error, 'error.message')
            if (!(error.status === 400 && message.includes('index_not_found_exception'))) {
              this.showSnackBar(errmsg, 'error')
            }
          },
        })
    }
  }

  formateCoursesList(response: any[]): any {
    const formatedList: any = []
    response.forEach((course: any) => {
      const publishedOnDate = new Date(_.get(course, 'publishedOn'))
      const formateCourse = {
        id: _.get(course, 'externalId', ''),
        courseName: _.get(course, 'name', ''),
        courseImg: _.get(course, 'appIcon', ''),
        source: _.get(course, 'source', ''),
        courseStatus: course.isActive ? 'Published' : 'Not Published',
        publishedOn: isNaN(publishedOnDate.getTime()) ? 'N/A'
          : this.datePipe.transform(publishedOnDate, 'MMM dd, yyyy'),
        listedOn: course.createdDate ? (this.datePipe.transform(new Date(course.createdDate), 'MMM dd, yyyy')) : 'N/A',
        isActive: course.isActive,
        isChecked: false,
      }
      formatedList.push(formateCourse)
    })
    return formatedList
  }

  setPagination(tableType: string, pagination: any): void {
    switch (tableType) {
      case 'published':
        this.publishedCoursesTablePaginationDetails = JSON.parse(JSON.stringify(pagination))
        break
      case 'notPublished':
        this.unPublishedCoursesTablePaginationDetails = JSON.parse(JSON.stringify(pagination))
        break
    }
  }

  searchCourses(publishedCourses: boolean, searchKey: string): void {
    if (publishedCourses) {
      this.publishedCoursesSerachKey = searchKey
      this.setPagination('published', this.defaultPagination)
      this.getPublishedCoursesList()
    } else {
      this.unPublishedCoursesSearchKey = searchKey
      this.setPagination('notPublished', this.defaultPagination)
      this.getUnPublishedCoursesList()
    }
  }

  pageChange(event: any, courseType: string): void {
    if (courseType === 'published') {
      this.publishedCoursesTablePaginationDetails = event
      this.getPublishedCoursesList()
    } else if (courseType === 'notPublished') {
      this.unPublishedCoursesTablePaginationDetails = event
      this.getUnPublishedCoursesList()
    }
  }

  contentEvents(event: any): void {
    if (event && event.action) {
      switch (event.action) {
        case 'delete':
          this.deletedSelectedCourses(event)
          break
        case 'downloadLog':
          if (event.rows.gcpfileName) {
            this.downloadLog(event.rows.gcpfileName, event.rows.name)
          }
          break
        case 'refresh':
          this.getTablesData()
          break
      }
    }
  }

  showSnackBar(message: string, type: 'error' | 'success') {
    this.snackBar.openFromComponent(SnackbarComponent, {
      data: {
        message: message, type: type,
      }, duration: 5000, panelClass: type,
    })
  }

  addCourses(): void {
    this.addCoursesFlag = true
  }

  actionHandler(event: any): void {
    if (event.action === 'goBack') {
      this.addCoursesFlag = false
      this.getTablesData()
    }
  }

  deletedSelectedCourses(event: any) {
    if (event && event.rows && event.rows.length !== 0) {
      const formBody = {
        partnerCode: _.get(this.providerDetails, 'data.partnerCode'),
        externalId: event.rows.length ? event.rows.map((item: any) => item.id) : [event.rows.id],
      }
      this.marketPlaceSvc.deleteUnPublishedCourses(formBody).subscribe({
        next: (res: any) => {
          if (res) {
            const msg = event.rows.length && event.rows.length > 1
              ? 'Selected courses are deleted successfully' : 'Selected course is deleted successfully'
            this.showSnackBar(msg, 'success')
            setTimeout(() => {
              this.getUnPublishedCoursesList()
            }, 2000)
          }
        },
        error: (error: HttpErrorResponse) => {
          const errmsg = _.get(error, 'error.params.errMsg', 'Some thing went wrong please try again')
          this.showSnackBar(errmsg, 'error')
        },
      })
    } else {
      this.showSnackBar('Please select course to delete.', 'error')
    }
  }

  downloadLog(gcpfileName: string, fileName: string) {
    this.marketPlaceSvc.downloadLogs(gcpfileName)
      .subscribe({
        next: (res: Blob) => {
          if (res) {
            this.downloadBlob(res, fileName)
          }
        },
        error: (error: HttpErrorResponse) => {
          const errmsg = _.get(error, 'error.params.errMsg', 'Some thing went wrong please try again')
          this.showSnackBar(errmsg, 'error')
        },
      })
  }

  downloadBlob(blob: Blob, fileName: string) {
    // Create a temporary URL for the Blob object
    const blobUrl = window.URL.createObjectURL(blob)

    // Create an anchor element and simulate a click to start the download
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = `${fileName}`.replace('xlsx', 'csv')
    link.click()
    window.URL.revokeObjectURL(blobUrl)
    this.showSnackBar('Logs Downloaded Successfully.', 'success')
  }
}
