import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute } from '@angular/router'
import { MarketplaceService } from '../../services/marketplace.service'
import * as _ from 'lodash'
import { ConformationPopupComponent } from '../../dialogs/conformation-popup/conformation-popup.component'
import { HttpErrorResponse } from '@angular/common/http'
import * as XLSX from 'xlsx'
import { SnackbarComponent } from '@sunbird-cb/consumption'

@Component({
  selector: 'ws-app-bulk-upload-courses',
  templateUrl: './bulk-upload-courses.component.html',
  styleUrls: ['./bulk-upload-courses.component.scss']
})
export class BulkUploadCoursesComponent implements OnInit, OnChanges {

  //#region (global variables)
  //#region (view child, input and output)
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>

  @Input() providerDetails?: any
  @Input() transformationType = 'trasformContentJson'

  @Output() loadProviderDetails = new EventEmitter<boolean>()
  //#endregion

  FILE_UPLOAD_MAX_SIZE: number = 100 * 1024 * 1024
  contentFile: any
  contentFileUploaded = false
  fileName = ''
  dialogRef: any
  certificateUrl = ''

  //#region (transformation variables)
  transforamtionForm!: FormGroup
  providerDetalsBeforUpdate: any
  transFormContentKeysAndControls: {
    lable: string,
    controlName: string,
    path: string
  }[] = []
  transformationsUpdated = false
  providerConfiguration: any
  executed = false
  uploadedFileHeadersList: string[] = []
  availableHeadrsList: string[] = []
  //#endregion
  //#endregion

  constructor(
    private marketPlaceSvc: MarketplaceService,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private activateRoute: ActivatedRoute
  ) {
    this.getRoutesData()
    this.transforamtionForm = this.formBuilder.group({})
  }

  getRoutesData() {
    this.activateRoute.data.subscribe(data => {
      if (data.pageData.data) {
        this.providerConfiguration = data.pageData.data
      }
    })
  }

  //#endregion

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.providerDetails &&
      changes.providerDetails.currentValue) {
      this.providerDetalsBeforUpdate = JSON.parse(JSON.stringify(changes.providerDetails.currentValue))
    }

    if (this.transformationType && this.transFormContentKeysAndControls.length < 1) {
      this.initializTransforamtionControls()
    }
  }

  initializTransforamtionControls() {
    this.transforamtionForm = this.formBuilder.group({})
    let trasformationJson: any = {}
    if (this.transformationType === 'trasformContentJson') {
      trasformationJson = _.get(this.providerConfiguration, 'trasformContentJson[0].spec')
    }

    if (trasformationJson) {
      Object.entries(trasformationJson).forEach(([key, path]) => {
        const transFormContentKeysAndControl: {
          lable: string,
          controlName: string,
          path: string
        } = {
          lable: key,
          controlName: key.replace(' ', ''),
          path: path as string,
        }
        this.transforamtionForm.addControl(key.replace(' ', ''), new FormControl('', Validators.required))
        this.transFormContentKeysAndControls.push(transFormContentKeysAndControl)
      })
    }
  }

  ngOnInit(): void {
  }

  //#region (contain browsing file and related events to get drop down list)
  onDropHandler(file: File) {
    if (!file) {
      return
    }

    this.fileName = file.name.replace(/[^A-Za-z0-9_.]/g, '')
    if (!(this.fileName.toLowerCase().endsWith('.csv') || this.fileName.toLowerCase().endsWith('.xlsx'))) {
      this.showSnackBar('Unsupported File Format. Please upload a CSV or XLSX file.', 'error')
      return
    }
    if (file.size > this.FILE_UPLOAD_MAX_SIZE) {
      this.showSnackBar('Please upload a file less than 100 MB', 'error')
      return
    }
    this.contentFile = file
    this.contentFileUploaded = true
    if (this.fileName.toLowerCase().endsWith('.csv')) {
      this.getCsvHeaders(file)
    } else if (this.fileName.toLowerCase().endsWith('.xlsx')) {
      this.getXLSXHeaders(file)
    }
  }

  getXLSXHeaders(file: File) { // get headers to show in drop downs
    const reader = new FileReader()
    reader.onload = (e: any) => {
      const data = e.target.result
      const workbook = XLSX.read(data, { type: 'binary' })

      const firstSheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[firstSheetName]

      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) // `header: 1` returns array of rows

      if (jsonData && jsonData.length > 0) {
        this.uploadedFileHeadersList = jsonData[0] as string[] // The first row is the header
        this.availableHeadrsList = JSON.parse(JSON.stringify(this.uploadedFileHeadersList))
      }
    }
    reader.readAsBinaryString(file)
  }

  getCsvHeaders(file: any) {
    const reader = new FileReader()
    reader.readAsText(file)
    reader.onload = () => {
      const csvData = reader.result
      const csvRecordsArray = (<string>csvData).split(/\r\n|\n/)
      this.uploadedFileHeadersList = this.getHeaderArray(csvRecordsArray)
      this.availableHeadrsList = JSON.parse(JSON.stringify(this.uploadedFileHeadersList))
    }
    const that = this.showSnackBar
    reader.onerror = function () {
      that('Please upload proper csv file', 'error')
    }
  }

  getHeaderArray(csvRecordsArr: any) {
    const headers = (<string>csvRecordsArr[0]).split(',')
    const headerArray = []
    for (let j = 0; j < headers.length; j = j + 1) {
      headerArray.push(headers[j])
    }
    return headerArray
  }
  //#endregion

  onSelectChange() { // To remove selected header from headers list so that user can't select again
    const selectedValues = Object.values(this.transforamtionForm.value)
    this.availableHeadrsList = this.uploadedFileHeadersList.filter(value => !selectedValues.includes(value))
  }

  upDateTransforamtionDetails() {
    this.providerDetalsBeforUpdate['data']['isActive'] = true
    const hasTransformationAlready = this.providerDetalsBeforUpdate[this.transformationType] ? true : false
    this.transforamtionForm.markAllAsTouched()
    if (this.transforamtionForm.valid) {
      if (this.transformationType !== 'certificateTemplateUrl') {
        const trasformContentSpec: any = {} // contains mapped transform spec for db
        const specValues = this.transforamtionForm.value
        this.transFormContentKeysAndControls.forEach((transFormContent: any) => {
          trasformContentSpec[specValues[transFormContent.controlName]] = transFormContent.path
        })

        if (hasTransformationAlready && _.get(this.providerDetalsBeforUpdate, `${this.transformationType}[0].spec`)) {
          this.providerDetalsBeforUpdate[this.transformationType]['0']['spec'] = trasformContentSpec
        } else {
          const trasformContentJson = this.providerConfiguration.trasformContentJson
          trasformContentJson[0]['spec'] = trasformContentSpec
          this.providerDetalsBeforUpdate[this.transformationType] = trasformContentJson
        }
      }
      this.marketPlaceSvc.updateProvider(this.providerDetalsBeforUpdate).subscribe({
        next: (responce: any) => {
          if (responce) {
            setTimeout(() => {
              let successMsg = 'Saved Successfully'
              if (this.transformationType === 'trasformContentJson') {
                successMsg = hasTransformationAlready ? 'Transform Content updated successfully.' : 'Transform Content saved successfully.'
              }
              this.showSnackBar(successMsg, 'success')
              this.sendProviderDetailsUpdateEvent()
            }, 1000)
          }
        },
        error: (error: HttpErrorResponse) => {
          const errmsg = _.get(error, 'error.params.errMsg', 'Something went wrong, please try again later')
          this.showSnackBar(errmsg, 'error')
        },
      })

    } else {
      const message = 'Please provide all mandatory fields'
      this.showSnackBar(message, 'error')
    }
  }

  sendProviderDetailsUpdateEvent() { // send event to parent to get updated data so that childs get updated detail
    this.transformationsUpdated = true
    this.loadProviderDetails.emit(true)
  }

  removeFile() {
    this.contentFileUploaded = false
    this.transformationsUpdated = false
    this.contentFile = undefined
    this.availableHeadrsList = []
    this.transforamtionForm.reset()
    this.markFormAsUntouched()
    this.transforamtionForm.markAsUntouched()
    this.transforamtionForm.updateValueAndValidity()
  }

  private markFormAsUntouched() {
    Object.keys(this.transforamtionForm.controls).forEach(control => {
      const formControl = this.transforamtionForm.controls[control]
      formControl.markAsUntouched()
      formControl.updateValueAndValidity()
      formControl.markAsPristine()
    })
  }

  get getUploadHeader(): string {
    let header = 'Upload Bulk Courses'
    if (this.transformationType === 'bulkUploadCourses') {
      header = 'Upload Bulk Courses'
    }
    return header
  }

  get getUpdateBtnText(): string {
    let btnText = ''
    if (this.transformationType === 'trasformContentJson') {
      if (this.providerDetalsBeforUpdate.trasformContentJson) {
        btnText = 'Update Transform Content'
      } else {
        btnText = 'Save Transform Content'
      }
    }
    return btnText
  }

  uploadFile() {
    this.executed = true
    if (this.contentFile && (this.transformationsUpdated)) {
      const popupMessage = `File processing`
      let dialogType = 'csvLoader'
      if (this.contentFile.name.toLowerCase().endsWith('.csv')) {
        dialogType = 'csvLoader'
      } else if (this.contentFile.name.toLowerCase().endsWith('.xlsx')) {
        dialogType = 'csvLoader'
      }
      this.openFileUploadPopup(dialogType, popupMessage)
      const formData = new FormData()
      formData.append(
        'content',
        this.contentFile as Blob,
        (this.contentFile as File).name.replace(/[^A-Za-z0-9_.]/g, ''),
      )
      const partnerCode = _.get(this.providerDetails, 'data.partnerCode')
      switch (this.transformationType) {
        case 'trasformContentJson':
          this.uploadContent(formData, partnerCode)
          break
      }

    } else if (!this.contentFile) {
      this.showSnackBar('Please upload a file to import', 'error')
    } else {
      let message = ''
      if (this.transformationType === 'trasformContentJson') {
        message = this.providerDetalsBeforUpdate.trasformContentJson ? 'Please update transform content' : 'Please add transform content'
      }
      this.showSnackBar(message, 'error')
    }
  }

  uploadContent(formData: any, partnerCode: string) {
    this.marketPlaceSvc.uploadContent(formData, partnerCode, this.providerDetails.id)
      .subscribe({
        next: (res: any) => {
          this.executed = false
          if (res) {
            setTimeout(() => {
              this.showSnackBar('File imported successfully', 'success')
              this.removeFile()
              this.dialogRef.close()
            }, 1000)
          }
        },
        error: (error: HttpErrorResponse) => {
          this.executed = false
          this.transformationsUpdated = false
          this.contentFileUploaded = false
          const errmsg = _.get(error, 'error.params.errmsg', 'Something went wrong while uploading. Please try again')
          this.dialogRef.close()
          this.showSnackBar(errmsg, 'error')
        },
      })
  }

  openFileUploadPopup(dialogType: string, message: string) {
    const dialogData = {
      dialogType,
      descriptions: [
        {
          messages: [
            {
              msgClass: '',
              msg: message,
            },
          ],
        },
      ],
    }
    this.dialogRef = this.dialog.open(ConformationPopupComponent, {
      data: dialogData,
      autoFocus: false,
      width: '956px',
      maxWidth: '80vw',
      maxHeight: '90vh',
      height: '427px',
      disableClose: true,
    })
  }

  showSnackBar(message: string, type: 'error' | 'success' = 'success') {
    this.snackBar.openFromComponent(SnackbarComponent, {
      data: {
        message: message, type: type,
      }, duration: 5000, panelClass: type,
    })
  }

}
