import { Component, OnInit } from '@angular/core'
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
  divisionList: string[] = []
  organisationList: string[] = []

  selectedDivision = ''
  selectedOrganisation = ''
  searchText = ''

  originalData: any[] = []
  constructor(
    public dialog: MatDialog,
    private activeRoute: ActivatedRoute,
    private configSvc: ConfigurationsService,
    private designationApprovalSvc: DesignationApprovalService,
    private dialogue: MatDialog,
    private snackBar: MatSnackBar,
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
    this.approvalRequestCount = { pending: 0, approved: 0, rejected: 0 }
    this.designationApprovalSvc.getApprovalList().subscribe((approvalRequest: any) => {
      this.setApprovalListData(approvalRequest)
    })
  }

  setApprovalListData(eventObj: any) {
    console.log('eventObj', eventObj)
    console.log('this.currentFilter', this.currentFilter)
    if (eventObj !== undefined) {
      const data: any = eventObj.items
      const divisionSet = new Set<string>()
      const organisationSet = new Set<string>()
      this.originalData = []

      this.data = []
      if (data) {
        Object.keys(data).forEach((index: any) => {
          const obj = data[index]

          const eventDataObj = {
            identifier: obj.id,
            designationName: obj.designation_name.substring(0, 100),
            createdOn: this.allEventDateFormat(obj.created_at),
            status: obj.status,
            organisation: obj.organisation,
            division: obj.division,
            email: obj.email
          }
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

            this.data.push(eventDataObj)

          }
          if (obj.status?.toLowerCase() === this.currentFilter?.toLowerCase()) {
            this.originalData.push(eventDataObj)
          }
        })
        this.divisionList = Array.from(divisionSet)
        this.organisationList = Array.from(organisationSet)

        this.data = [...this.originalData]
      }
      console.log('this.data', this.data)
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
          this.designationApprovalSvc.getOrgRead({ organisationId: $event.row.organisation_id }).subscribe((orgData: any) => {
            if (orgData?.result?.response?.frameworkid) {
              req['frameworkid'] = orgData?.result?.response?.frameworkid
            }

            this.designationApprovalSvc.approveRequest(req).subscribe((response: any) => {
              if (response && response.status === 'approved') {
                this.openSnackbar('Request is successfully approved.')
                this.currentFilter = 'approved'
                this.fetchApprovalRequests(this.currentFilter)
              } else {
                this.openSnackbar('Error while approving the request')
              }
            })
          })

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
    this.data = this.originalData.filter((item: any) => {

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
  }

  clearFilters() {
    this.searchText = ''
    this.selectedDivision = ''
    this.selectedOrganisation = ''

    this.data = [...this.originalData]
  }
}
