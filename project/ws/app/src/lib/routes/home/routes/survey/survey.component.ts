import { Component, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import lodash from 'lodash'
import { SurveyApiService } from './survey-api/survey-api.service'
import { SolutionSurveyUploadComponent } from '../../components/solution-survey-upload/solution-survey-upload.component'
import { environment } from '../../../../../../../../../src/environments/environment'
import { ActivatedRoute } from '@angular/router'
// import { ActivatedRoute, Router } from '@angular/router'

// import { ConfigurationsService } from '@sunbird-cb/utils'
// import { ConfigurationsService, EventService } from '@sunbird-cb/utils'
// import * as moment from 'moment'
/* tslint:disable */

// import { EventsService } from '../services/events.service'
// import { DialogConfirmComponent } from '../../../../../../../../../../src/app/component/dialog-confirm/dialog-confirm.component'
// import { MatSnackBar } from '@angular/material'
// import { TelemetryEvents } from '../model/telemetry.event.model'

@Component({
  selector: 'ws-app-survey',
  templateUrl: './survey.component.html',
  styleUrls: ['./survey.component.scss']
})
export class SurveyComponent implements OnInit {
  currentUser!: string | null
  configService: any
  department: any
  departmentID: any
  tabledata: any = []
  eventData: any = []
  data: any = []
  currentFilter = 'upcoming'
  slugForSolutionPortal = 'validation/template/template-selection'
  constructor(
    public dialog: MatDialog,
    private activeRoute: ActivatedRoute,
    // private configSvc: ConfigurationsService,
    private surveyApiService: SurveyApiService
  ) {

    this.configService = this.activeRoute.snapshot.data.configService
    // if (this.configSvc.userProfile) {
    //   this.currentUser = this.configSvc.userProfile && this.configSvc.userProfile.userId
    //   this.department = this.configSvc.userProfile && this.configSvc.userProfile.departmentName
    //   this.departmentID = this.configSvc.userProfile && this.configSvc.userProfile.rootOrgId
    // } else {
    //   if (_.get(this.activeRoute, 'snapshot.data.configService.userProfile.rootOrgId')) {
    //     this.departmentID = _.get(this.activeRoute, 'snapshot.data.configService.userProfile.rootOrgId')
    //   }
    //   if (_.get(this.activeRoute, 'snapshot.data.configService.userProfile.departmentName')) {
    //     this.department = _.get(this.activeRoute, 'snapshot.data.configService.userProfile.departmentName')
    //     _.set(this.department, 'snapshot.data.configService.userProfile.departmentName', this.department ? this.department : '')
    //   }
    //   if (_.get(this.activeRoute, 'snapshot.data.configService.userProfile.userId')) {
    //     this.currentUser = _.get(this.activeRoute, 'snapshot.data.configService.userProfile.userId')
    //   }
    //   if (this.configService.userProfile && this.configService.userProfile.departmentName) {
    //     this.configService.userProfile.departmentName = this.department
    //   }
    // }

  }

  ngOnInit() {
    this.tabledata = {
      actions: [{ icon: 'file_copy', label: 'Copy', name: 'ViewCount', type: 'link' }],
      columns: [
        { displayName: 'Survey Id', key: 'SOLUTION_ID', defaultValue: 'NA' },
        { displayName: 'Survey Name', key: 'SOLUTION_NAME', defaultValue: 'NA' },
        { displayName: 'Start Date', key: 'START_DATE', datePipe: true },
        { displayName: 'End Date', key: 'END_DATE', datePipe: true },

      ],
      needCheckBox: false,
      needHash: false,
      needUserMenus: false,
      sortColumn: false,
      sortState: 'asc',
      actionColumnName: 'Actions',
    }
    this.getSurveysData()
  }

  onCreateClick() {
    const url = `${environment.karmYogiPath}/${this.slugForSolutionPortal}`
    let dialogRef = this.dialog.open(SolutionSurveyUploadComponent, {
      data: {
        surveyFileUploadUrl: url,
      },
      disableClose: true,
      width: '95%',
      height: '95%',
      panelClass: 'overflow-visable',
    })
    dialogRef.afterClosed().subscribe(() => {
      this.getSurveysData()
    })
    dialogRef.backdropClick().subscribe(() => {
      // Close the dialog
      dialogRef.close()
    })

  }

  getSurveysData() {
    const reqPayLoad = { "resourceType": "Survey" }
    this.surveyApiService.getSurveyResults(reqPayLoad).subscribe((response: any) => {
      console.log('response', response.SolutionList)
      if (response && response.status === 200) {
        if (response && response.SolutionList && response.SolutionList.length) {
          this.data = response.SolutionList
        } else {
          this.data = []
        }
      }
    })
  }

}