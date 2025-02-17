import { Component, OnInit, OnDestroy, AfterViewInit, EventEmitter, Output } from '@angular/core'

import { HttpErrorResponse } from '@angular/common/http'
import { ActivatedRoute } from '@angular/router'
// tslint:disable-next-line
import _ from 'lodash'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import { IBulkUploadDesignationList } from '../../interface/interface'
import { MatDialog } from '@angular/material/dialog'
import { PageEvent } from '@angular/material/paginator'
import { MatSnackBar } from '@angular/material/snack-bar'
import { UsersService } from '../../../../services/users.service'
import { VerifyOtpComponent } from '../../../../../home/components/verify-otp/verify-otp.component'
import { FileService } from '../../services/upload.service'
import { FileProgressComponent } from '../../../../../home/components/file-progress/file-progress.component'
import { DesignationsService } from '../../services/designations.service'

@Component({
  selector: 'ws-app-bulk-upload',
  templateUrl: './bulk-upload.component.html',
  styleUrls: ['./bulk-upload.component.scss'],
})
export class BulkUploadComponent implements OnInit, OnDestroy, AfterViewInit {
  @Output() closeComponent: EventEmitter<boolean> = new EventEmitter<boolean>();

  lastUploadList: IBulkUploadDesignationList[] = []
  private destroySubject$ = new Subject()
  rootOrgId: any
  bulkUploadFrameworkId = ''
  configSvc: any
  timeLeft = 10 // In Seconds
  interval: any

  showFileError = false
  public fileName: any
  public fileType: any
  fileSelected!: any
  userProfile: any
  userEmailPhone = {
    email: '',
    mobile: ''
  }
  fileUploadDialogInstance: any
  bulkUploadConfig: any

  sizeOptions: number[] = []
  startIndex = 0
  lastIndex: any
  pageSize = 0
  orgId = ''

  constructor(
    private fileService: FileService,
    private matSnackBar: MatSnackBar,
    public dialog: MatDialog,
    private usersService: UsersService,
    private activateRoute: ActivatedRoute,
    private designationsService: DesignationsService
  ) {
    this.configSvc = this.activateRoute.snapshot.data['configService']
    this.rootOrgId = _.get(this.configSvc, 'userProfile.rootOrgId')
    this.userProfile = _.get(this.configSvc, 'userProfileV2')

  }

  ngOnInit() {
    this.getUserDetails()
    this.orgId = _.get(this.activateRoute, 'snapshot.queryParams.roleId', '')
    this.getBulkStatusList()
    this.activateRoute.data.subscribe(data => {
      this.bulkUploadConfig = data.pageData.data.bulkUploadConfig
      this.pageSize = this.bulkUploadConfig.pageSize
      this.sizeOptions = this.bulkUploadConfig.pageSizeOptions
    })
    this.bulkUploadFrameworkId = this.designationsService.frameWorkInfo ? this.designationsService.frameWorkInfo.code : this.bulkUploadFrameworkId
  }

  getUserDetails() {
    this.usersService.getUserDetails(this.userProfile.userId).subscribe({
      next: (result) => {
        if (result) {
          this.userEmailPhone = {
            email: _.get(result, 'result.response.profileDetails.personalDetails.primaryEmail', this.userProfile.email),
            mobile: _.get(result, 'result.response.profileDetails.personalDetails.mobile', this.userProfile.mobile)
          }
        }
      }
    })
  }

  ngAfterViewInit(): void {
    this.lastIndex = this.sizeOptions[0]
  }

  onChangePage(pe: PageEvent) {
    this.startIndex = pe.pageIndex * pe.pageSize
    this.lastIndex = (pe.pageIndex + 1) * pe.pageSize

    // this.startIndex = this.pageIndex
  }

  getBulkStatusList(): void {
    const orgId = this.orgId ? this.orgId : this.rootOrgId
    this.fileService.getBulkDesignationUploadData(orgId)
      .pipe(takeUntil(this.destroySubject$))
      .subscribe((res: any) => {
        this.lastUploadList = res.result.content.sort((a: IBulkUploadDesignationList, b: IBulkUploadDesignationList) =>
          new Date(b.dateCreatedOn).getTime() - new Date(a.dateCreatedOn).getTime())
        // tslint:disable-next-line
      }, (error: HttpErrorResponse) => {
        if (!error.ok) {
          this.matSnackBar.open('Unable to get Bulk status list')
        }
      })
  }

  showFileUploadProgress(): void {
    this.fileUploadDialogInstance = this.dialog.open(FileProgressComponent, {
      data: {},
      disableClose: true,
      panelClass: 'progress-modal',
    })
  }

  handleDownloadFile(listObj: IBulkUploadDesignationList): void {
    const filePath = this.fileService.getBulkDesignationStatus(listObj.fileName)
    this.fileService.downloadWithDispositionName(filePath)
  }

  handleDownloadSampleFile(): void {
    const filePath = this.fileService.downloadBulkUploadSampleFile(this.bulkUploadFrameworkId)
    this.fileService.downloadWithDispositionName(filePath)
  }

  handleFileClick(event: any): void {
    event.target.value = ''
  }

  sendOTP(): void {
    this.generateAndVerifyOTP(this.userEmailPhone.email ? 'email' : 'phone')
  }

  generateAndVerifyOTP(contactType: string, resendFlag?: string): void {
    const postValue = contactType === 'email' ? this.userEmailPhone.email : this.userEmailPhone.mobile
    this.usersService.sendOtp(postValue, contactType)
      .pipe(takeUntil(this.destroySubject$))
      .subscribe((_res: any) => {
        this.matSnackBar.open(`An OTP has been sent to your ${contactType === 'phone' ? 'Mobile number'
          : 'Email address'}, (Valid for 15 min's)`)
        if (!resendFlag) {
          this.verifyOTP(contactType)
        }
        // tslint:disable-next-line
      }, (error: HttpErrorResponse) => {
        if (!error.ok) {
          this.matSnackBar.open(_.get(error, 'error.params.errmsg') || `Unable to send OTP to your ${contactType}, please try again later!`)
        }
      })
  }

  handleOnFileChange(fileList: File[]): void {
    this.showFileError = false
    const file: File = fileList[0]
    if (file) {
      this.fileName = file.name
      this.fileType = file.type
      this.fileSelected = file
      if (this.fileService.validateExcelFile(this.fileType)) {
        this.verifyOTP(this.userEmailPhone.email ? 'email' : 'phone')
        // this.showFileUploadProgress()
        // this.uploadCSVFile()
      } else {
        this.showFileError = true
      }
    }
  }

  verifyOTP(contactType: string): void {
    const dialogRef = this.dialog.open(VerifyOtpComponent, {
      data: { type: contactType, email: this.userEmailPhone.email, mobile: this.userEmailPhone.mobile },
      disableClose: false,
      panelClass: 'common-modal',
    })

    dialogRef.componentInstance.resendOTP.subscribe((_cType: any) => {
      this.generateAndVerifyOTP(_cType, 'resend')
    })

    dialogRef.componentInstance.otpVerified.subscribe((_data: boolean) => {
      this.showFileUploadProgress()
      this.uploadCSVFile()
    })
  }

  uploadCSVFile(): void {
    if (this.fileService.validateExcelFile(this.fileType)) {
      if (this.fileSelected) {
        const formData: FormData = new FormData()
        formData.append('file', this.fileSelected)
        this.fileService.bulkUploadDesignation(this.fileName, formData, this.bulkUploadFrameworkId, this.orgId)
          .pipe(takeUntil(this.destroySubject$))
          .subscribe((_res: any) => {
            this.fileUploadDialogInstance.close()
            this.matSnackBar.open('File uploaded successfully!')
            this.fileName = ''
            this.fileSelected = ''
            this.getBulkStatusList()
            this.startTimer()
            // tslint:disable-next-line
          }, (_err: HttpErrorResponse) => {
            if (!_err.ok) {
              this.fileUploadDialogInstance.close()
              this.matSnackBar.open('Uploading CSV file failed due to some error, please try again later!')
            }
          })
      }
    } else {
      this.showFileError = true
    }
  }

  handleChangePage(_event: PageEvent): void {
    this.pageSize = _event.pageSize
    this.startIndex = (_event.pageIndex) * _event.pageSize
    this.lastIndex = this.startIndex + _event.pageSize
  }

  showMyDesignations() {
    this.closeComponent.emit(true)
  }

  ngOnDestroy(): void {
    this.destroySubject$.unsubscribe()
    if (this.interval) {
      clearInterval(this.interval)
    }
  }

  startTimer() {
    let timeLeft = this.timeLeft
    this.interval = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft = timeLeft - 1
      } else {
        clearInterval(this.interval)
        this.getBulkStatusList()
      }
    }, 1000)
  }

}
