import { Component, OnInit, ChangeDetectorRef } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { ActivatedRoute } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import moment from 'moment'
/* tslint:disable */
import * as _ from 'lodash'
import { DesignationApprovalService } from '../services/designation-approval.service'
import { DialogConfirmComponent } from '../../../../../../../../../../src/app/component/dialog-confirm/dialog-confirm.component'
import { MatSnackBar } from '@angular/material/snack-bar'
import { RejectRequestFormComponent } from '../../reject-request-form/reject-request-form.component'
import { LoaderService } from '../../../services/loader.service'

@Component({
  selector: 'ws-app-designation-approval-list',
  templateUrl: './designation-approval-list.component.html',
  styleUrls: ['./designation-approval-list.component.scss'],
  standalone: false
})
export class DesignationApprovalListComponent implements OnInit {
  currentUser!: string | null
  configService: any
  department: any
  departmentID: any
  tabledata: any = []
  data: any = []
  currentFilter = 'pending'
  approvalRequestCount: any = { pending: 0, approved: 0, rejected: 0 }
  totalApprovalCount: number = 0
  divisionList: string[] = []
  organisationList: string[] = []

  selectedDivision = ''
  selectedOrganisation = ''
  searchText = ''
  currentPageSize = 20
  currentPageIndex = 0
  isLoading = false
  originalData: any[] = []
  allCurrentFilterData: any[] = []
  isAllCurrentFilterDataLoaded = false
  private readonly filterDataFetchPageSize = 100
  constructor(
    public dialog: MatDialog,
    private activeRoute: ActivatedRoute,
    private configSvc: ConfigurationsService,
    private designationApprovalSvc: DesignationApprovalService,
    private dialogue: MatDialog,
    private snackBar: MatSnackBar,
    private changeDetectorRef: ChangeDetectorRef,
    private loaderService: LoaderService
  ) {

    this.configService = this.activeRoute.snapshot.data.configService
    console.log('this.configService', this.configService)
    if (this.configSvc.userProfile) {
      this.currentUser = this.configSvc.userProfile && this.configSvc.userProfile.userId
      this.department = this.configSvc.userProfile && this.configSvc.userProfile.departmentName
      this.departmentID = this.configSvc.userProfile && this.configSvc.userProfile.rootOrgId
    } else {
      if (_.get(this.activeRoute, 'snapshot.data.configService.userProfile.rootOrgId')) {
        this.departmentID = _.get(this.activeRoute, 'snapshot.data.configService.userProfile.rootOrgId')
      }
      if (_.get(this.activeRoute, 'snapshot.data.configService.userProfile.departmentName')) {
        this.department = _.get(this.activeRoute, 'snapshot.data.configService.userProfile.departmentName')
        _.set(this.department, 'snapshot.data.configService.userProfile.departmentName', this.department ? this.department : '')
      }
      if (_.get(this.activeRoute, 'snapshot.data.configService.userProfile.userId')) {
        this.currentUser = _.get(this.activeRoute, 'snapshot.data.configService.userProfile.userId')
      }
      if (this.configService.userProfile && this.configService.userProfile.departmentName) {
        this.configService.userProfile.departmentName = this.department
      }
    }

  }

  ngOnInit() {
    this.tabledata = {
      actions: [],
      columns: [
        { displayName: 'Created On', key: 'createdOn' },
        { displayName: 'Designation Name', key: 'designationName' },
        { displayName: 'Organisation', key: 'organisation' },
        { displayName: 'Division', key: 'division' },
        { displayName: 'Email', key: 'email' },
        { displayName: 'Status', key: 'status' },
      ],
      needCheckBox: false,
      needHash: false,
      needUserMenus: true,
    }
    this.fetchApprovalRequests()

  }

  fetchApprovalRequests(tab?: string) {
    if (tab) {
      this.currentFilter = tab
    }
    // const now = moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSSZZ')
    // let requestObj: any

    // switch (this.currentFilter) {
    //   case 'upcoming':
    //     requestObj = {
    //       locale: ['en'],
    //       request: {
    //         query: '',
    //         limit: 20,
    //         offset: 0,
    //         filters: {
    //           status: ['Live'],
    //           contentType: 'Event',
    //           createdFor: this.departmentID,
    //           endDateTime: { '>=': now },
    //         },
    //         sort_by: { lastUpdatedOn: 'desc' },
    //       },
    //     }
    //     break
    //   case 'past':
    //     requestObj = {
    //       locale: ['en'],
    //       request: {
    //         query: '',
    //         limit: 20,
    //         offset: 0,
    //         filters: {
    //           status: ['Live'],
    //           contentType: 'Event',
    //           createdFor: this.departmentID,
    //           endDateTime: { '<': now },
    //         },
    //         sort_by: { lastUpdatedOn: 'desc' },
    //       },
    //     }
    //     break
    //   case 'archive':
    //     requestObj = {
    //       locale: ['en'],
    //       query: '',
    //       request: {
    //         query: '',
    //         filters: {
    //           status: ['Retired'],
    //           contentType: 'Event',
    //           createdFor: this.departmentID,
    //         },
    //         sort_by: { lastUpdatedOn: 'desc' },
    //       },
    //     }
    //     break
    // }
    if (this.hasActiveFilters()) {
      if (this.isAllCurrentFilterDataLoaded) {
        this.applyFiltersOnLoadedData()
      } else {
        this.loadAllDataForFilters()
      }
      return
    }

    this.approvalRequestCount = { pending: 0, approved: 0, rejected: 0 }
    this.isLoading = true
    this.loaderService.changeLoaderState(true)
    const offset = this.currentPageIndex * this.currentPageSize
    this.designationApprovalSvc.getApprovalList(this.currentPageSize, offset, this.currentFilter).subscribe((approvalRequest: any) => {
      this.setApprovalListData(approvalRequest)

      this.isLoading = false
      this.loaderService.changeLoaderState(false)

    })
  }

  private hasActiveFilters() {
    return !!(this.searchText || this.selectedDivision || this.selectedOrganisation)
  }

  private loadAllDataForFilters() {
    this.isLoading = true
    this.loaderService.changeLoaderState(true)
    this.allCurrentFilterData = []

    const fetchPage = (pageIndex: number) => {
      const offset = pageIndex * this.filterDataFetchPageSize
      this.designationApprovalSvc.getApprovalList(this.filterDataFetchPageSize, offset, this.currentFilter).subscribe((approvalRequest: any) => {
        const mappedData = this.mapApprovalItems(_.get(approvalRequest, 'items', []))
        this.allCurrentFilterData = this.allCurrentFilterData.concat(mappedData)

        const totalItems = _.get(approvalRequest, 'pagination.total_items', this.allCurrentFilterData.length)
        const hasMoreData = this.allCurrentFilterData.length < totalItems && mappedData.length > 0

        if (hasMoreData) {
          fetchPage(pageIndex + 1)
          return
        }

        this.isAllCurrentFilterDataLoaded = true
        this.updateFilterOptions(this.allCurrentFilterData)
        this.applyFiltersOnLoadedData()
        this.isLoading = false
        this.loaderService.changeLoaderState(false)
      }, () => {
        this.isLoading = false
        this.loaderService.changeLoaderState(false)
      })
    }

    fetchPage(0)
  }

  private updateFilterOptions(sourceData: any[]) {
    const divisionSet = new Set<string>()
    const organisationSet = new Set<string>()

    sourceData.forEach(item => {
      if (item.division) {
        divisionSet.add(item.division)
      }
      if (item.organisation) {
        organisationSet.add(item.organisation)
      }
    })

    this.divisionList = Array.from(divisionSet)
    this.organisationList = Array.from(organisationSet)
  }

  private applyFiltersOnLoadedData() {
    const filteredData = this.allCurrentFilterData.filter((item: any) => {
      const searchMatch =
        !this.searchText ||
        item.designationName?.toLowerCase().includes(this.searchText.toLowerCase()) ||
        item.email?.toLowerCase().includes(this.searchText.toLowerCase())

      const divisionMatch =
        !this.selectedDivision ||
        item.division === this.selectedDivision

      const organisationMatch =
        !this.selectedOrganisation ||
        item.organisation === this.selectedOrganisation

      return searchMatch && divisionMatch && organisationMatch
    })

    this.totalApprovalCount = filteredData.length

    const startIndex = this.currentPageIndex * this.currentPageSize
    const endIndex = startIndex + this.currentPageSize
    this.originalData = filteredData
    this.data = filteredData.slice(startIndex, endIndex)
  }

  private mapApprovalItems(items: any[]) {
    return items.map((obj: any) => ({
      identifier: obj.id,
      designationName: obj.designation_name ? obj.designation_name.substring(0, 100) : '',
      createdOn: this.allEventDateFormat(obj.created_at),
      status: obj.status,
      organisation: obj.organisation,
      division: obj.division,
      email: obj.email,
      reviewer_comments: obj.reviewer_comments ? obj.reviewer_comments : 'No Reason Found',
    }))
  }

  setApprovalListData(eventObj: any) {

    if (eventObj !== undefined) {
      const data = this.mapApprovalItems(_.get(eventObj, 'items', []))
      const divisionSet = new Set<string>()
      const organisationSet = new Set<string>()
      this.originalData = []

      this.data = []
      if (data) {
        Object.keys(data).forEach((index: any) => {
          const obj = data[index]
          if (obj.status?.toLowerCase() === 'pending') {
            this.approvalRequestCount.pending += 1
          } else if (obj.status?.toLowerCase() === 'approved') {
            this.approvalRequestCount.approved += 1
          } else if (obj.status?.toLowerCase() === 'rejected') {
            this.approvalRequestCount.rejected += 1
          }
          // dropdown values
          if (obj.division) {
            divisionSet.add(obj.division)
          }

          if (obj.organisation) {
            organisationSet.add(obj.organisation)
          }
          if (obj.status?.toLowerCase() === this.currentFilter?.toLowerCase()) {

            this.data.push(obj)

          }
          if (obj.status?.toLowerCase() === this.currentFilter?.toLowerCase()) {
            this.originalData.push(obj)
          }
        })

        if (this.currentPageIndex === 0) {
          this.divisionList = Array.from(divisionSet)
          this.organisationList = Array.from(organisationSet)
        }

        this.data = [...this.originalData]

        // Extract total count from API response if available
        if (eventObj.pagination.total_items !== undefined) {
          this.totalApprovalCount = eventObj.pagination.total_items
        } else if (eventObj.totalCount !== undefined) {
          this.totalApprovalCount = eventObj.pagination.total_items
        } else {
          // Fallback: use the count from the current response
          // Note: This will only show the current page count if API doesn't return total
          this.totalApprovalCount = this.data.length + (this.currentPageIndex * this.currentPageSize)
        }
      }
      console.log('this.data', this.data)
      this.changeDetectorRef.markForCheck()
    }
  }

  customDateFormat(date: string, time: string) {
    const fTime = time.split("+")
    const datetimetest = moment(`${date}T${fTime[0]}`).toISOString()
    const format = 'DD-MM-YYYY'
    const readableDateMonth = moment(datetimetest).format(format)
    const finalDateTimeValue = `${readableDateMonth}`
    return finalDateTimeValue
  }

  filter(key: string) {
    this.currentFilter = key
    this.currentPageIndex = 0
    this.isAllCurrentFilterDataLoaded = false
    this.allCurrentFilterData = []

    this.searchText = ''
    this.selectedDivision = ''
    this.selectedOrganisation = ''
    this.fetchApprovalRequests(key)
  }

  allEventDateFormat(datetime: any) {
    const date = new Date(datetime).getDate()
    const year = new Date(datetime).getFullYear()
    const month = new Date(datetime).getMonth()
    const hours = new Date(datetime).getHours()
    const minutes = new Date(datetime).getMinutes()
    const seconds = new Date(datetime).getSeconds()
    const formatedDate = new Date(year, month, date, hours, minutes, seconds, 0)
    const format = 'DD-MM-YYYY'
    const readableDateMonth = moment(formatedDate).format(format)
    const finalDateTimeValue = `${readableDateMonth}`
    return finalDateTimeValue
  }

  formatTimeAmPm(futureDate: any) {
    let hours = futureDate.getHours()
    let minutes = futureDate.getMinutes()
    const ampm = hours >= 12 ? 'pm' : 'am'
    hours = hours % 12
    hours = hours ? hours : 12
    minutes = minutes < 10 ? `0${minutes}` : minutes
    const strTime = `${hours}:${minutes} ${ampm}`
    return strTime
  }



  menuActions($event: { action: string, row: any }) {
    if ($event.action === 'approve') {
      const dialogRef = this.dialogue.open(DialogConfirmComponent, {
        height: 'auto',
        width: '25%',
        data: {
          title: 'Confirmation',
          bodyHTML: `Are you sure you want to approve this request.`,
        },
      })
      dialogRef.afterClosed().subscribe((response: any) => {
        if (response) {
          let req: any = {
            id: $event.row.identifier,
          }
          // this.designationApprovalSvc.getOrgRead({ organisationId: $event.row.organisation_id }).subscribe((orgData: any) => {
          //   if (orgData?.result?.response?.frameworkid) {
          //     req['frameworkid'] = orgData?.result?.response?.frameworkid
          //   }

          this.designationApprovalSvc.approveRequest(req).subscribe((response: any) => {
            if (response && response.status === 'approved') {
              this.openSnackbar('Request is successfully approved.')
              this.currentFilter = 'approved'
              this.currentPageIndex = 0
              this.fetchApprovalRequests(this.currentFilter)
            } else {
              this.openSnackbar('Error while approving the request')
            }
          })
          // })

        }
      })
    } else if ($event.action === 'reject') {
      console.log($event.row)
      // const dialogRef = this.dialogue.open(DialogConfirmComponent, {
      //   height: 'auto',
      //   width: '25%',
      //   data: {
      //     title: 'Confirmation',
      //     bodyHTML: `Are you sure you want to reject this request.`,
      //   },
      // })
      // dialogRef.afterClosed().subscribe((response: any) => {
      //   if (response) {
      //     let req: any = {
      //       id: $event.row.identifier,
      //     }
      //     this.designationApprovalSvc.rejectRequest(req).subscribe((response: any) => {
      //       if (response && response.status === 'rejected') {
      //         this.openSnackbar('Request is successfully rejected.')
      //         this.currentFilter = 'rejected'
      //         this.fetchApprovalRequests(this.currentFilter)
      //       } else {
      //         this.openSnackbar('Error while rejecting the request')
      //       }
      //     })
      //   }
      // })

      const dialogRef = this.dialog.open(RejectRequestFormComponent, {
        width: '750px',
        maxWidth: '90vw',
        data: $event.row,
        panelClass: 'publish-request-popup',
        minHeight: '400px',          // Set minimum height
        maxHeight: '90vh',           // Prevent it from going beyond viewport
        disableClose: true // Optional: prevent closing with outside click
      })

      dialogRef.afterClosed().subscribe(response => {
        if (response === 'success') {
          this.currentFilter = 'rejected'
          this.currentPageIndex = 0
          this.fetchApprovalRequests(this.currentFilter)
        }
      })
    }
  }

  private openSnackbar(primaryMsg: string, duration: number = 5000) {
    this.snackBar.open(primaryMsg, 'X', {
      duration,
    })
  }

  canArchive(objData: any) {
    const sTime = objData.startTime.split('+')[0]
    const eTime = objData.endTime.split('+')[0]
    const msDate = Math.floor(moment(`${objData.startDate}T${sTime}`).valueOf() / 1000)
    const meDate = Math.floor(moment(`${objData.endDate}T${eTime}`).valueOf() / 1000)
    const cDate = Math.floor(moment(new Date()).valueOf() / 1000)
    return !(cDate >= msDate && cDate <= meDate)
  }

  applyFilters() {
    this.currentPageIndex = 0
    this.fetchApprovalRequests()
  }

  onPageChange(event: { pageIndex: number; pageSize: number }) {
    this.currentPageIndex = event.pageIndex
    this.currentPageSize = event.pageSize

    if (this.hasActiveFilters()) {
      this.applyFiltersOnLoadedData()
      return
    }

    this.fetchApprovalRequests()
  }

  clearFilters() {
    this.searchText = ''
    this.selectedDivision = ''
    this.selectedOrganisation = ''
    this.currentPageIndex = 0
    this.isAllCurrentFilterDataLoaded = false
    this.allCurrentFilterData = []

    this.fetchApprovalRequests()
  }
}
