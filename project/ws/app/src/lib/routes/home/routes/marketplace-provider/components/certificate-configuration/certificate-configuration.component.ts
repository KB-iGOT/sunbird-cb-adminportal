import { Component, EventEmitter, Input, Output, ViewChild, ElementRef, OnChanges, SimpleChanges } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'
import { MarketplaceService } from '../../services/marketplace.service'
import * as _ from 'lodash'
import { ConformationPopupComponent } from '../../dialogs/conformation-popup/conformation-popup.component'
import { HttpErrorResponse } from '@angular/common/http'
import { environment } from '../../../../../../../../../../../src/environments/environment'
import { SnackbarComponent } from '@sunbird-cb/consumption'

@Component({
  selector: 'ws-app-certificate-configuration',
  templateUrl: './certificate-configuration.component.html',
  styleUrls: ['./certificate-configuration.component.scss']
})
export class CertificateConfigurationComponent implements OnChanges {
  @Input() providerDetails: any
  @Output() loadProviderDetails = new EventEmitter<any>()

  @ViewChild('logoFileInput') logoFileInput!: ElementRef
  @ViewChild('certificateFileInput') certificateFileInput!: ElementRef

  FILE_UPLOAD_MAX_SIZE: number = 100 * 1024 * 1024
  contentFile: any
  certificateUrl = ''
  fileName = ''
  dialogRef: any
  providerDetalsBeforUpdate: any
  certificateUploaded = false
  executed = false

  providerForm!: FormGroup

  constructor(
    private marketPlaceSvc: MarketplaceService,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private sanitizer: DomSanitizer
  ) {
    this.initializeForm()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.providerDetails && changes.providerDetails.currentValue) {
      this.providerDetalsBeforUpdate = JSON.parse(JSON.stringify(changes.providerDetails.currentValue))
      this.initializeForm()
      this.setExistingCertificate()
    }
  }

  initializeForm() {
    this.providerForm = this.formBuilder.group({
      providerName: [this.providerDetalsBeforUpdate?.data?.name || '', Validators.required]
    })
  }

  setExistingCertificate() {
    if (this.providerDetalsBeforUpdate?.certificateTemplateUrl) {
      this.certificateUploaded = true
      this.certificateUrl = this.generatePublicUrl(this.providerDetalsBeforUpdate.certificateTemplateUrl)
      this.fileName = this.getImageName(this.providerDetalsBeforUpdate.certificateTemplateUrl)
    }
  }

  // Logo upload state
  logoUploaded = false
  logoFileName = ''
  logoUploadedDate = ''
  selectedLogoImage: string | ArrayBuffer | null = null

  // Certificate template upload state
  certificateFileName = ''
  certificateUploadedDate = ''

  // Allowed file types
  allowedFileTypes = '.jpg,.jpeg,.png'
  allowedMimeTypes = ['image/jpeg', 'image/png']

  onDropLogo(event: any): void {
    const file = event instanceof File ? event : event.files?.[0]
    if (file) {
      this.handleFileUpload(file, 'logo')
    }
  }

  onDropCertificate(file: File) {
    this.fileName = file.name.replace(/[^A-Za-z0-9_.]/g, '')
    if (!this.fileName.toLowerCase().endsWith('.svg')) {
      this.showSnackBar('Unsupported File Format. Please upload a SVG file.', 'error')
    } else if (file.size > this.FILE_UPLOAD_MAX_SIZE) {
      this.showSnackBar('Please upload a file less than 100 MB', 'error')
    } else {
      this.contentFile = file
      this.certificateUrl = URL.createObjectURL(file)
      this.certificateUploaded = true
    }
  }

  private handleFileUpload(file: File, uploadType: 'logo'): void {
    if (!this.isValidFile(file)) {
      return
    }

    const fileName = file.name
    const uploadedDate = new Date().toLocaleDateString()

    // Read file as data URL for preview
    const reader = new FileReader()
    reader.onload = (event) => {
      const imageData = event.target?.result

      if (uploadType === 'logo') {
        this.logoFileName = fileName
        this.logoUploadedDate = uploadedDate
        this.logoUploaded = true
        this.selectedLogoImage = imageData || null
      }
    }
    reader.readAsDataURL(file)
  }

  private isValidFile(file: File): boolean {
    return this.allowedMimeTypes.includes(file.type)
  }

  removeLogoImage(): void {
    this.logoUploaded = false
    this.logoFileName = ''
    this.logoUploadedDate = ''
    this.selectedLogoImage = null
    if (this.logoFileInput) {
      this.logoFileInput.nativeElement.value = null
    }
  }

  removeCertificateImage(): void {
    this.certificateUploaded = false
    this.contentFile = undefined
    this.certificateUrl = ''
    this.fileName = ''
    if (this.certificateFileInput) {
      this.certificateFileInput.nativeElement.value = null
    }
  }

  generatePublicUrl(googleUrl: string): string {
    const urlToReplace = 'https://storage.googleapis.com/igot'
    let url = googleUrl
    if (googleUrl && googleUrl.startsWith(urlToReplace)) {
      const urlSplice = googleUrl.slice(urlToReplace.length).split('/')
      url = `${environment.karmYogiPath}/content-store/${urlSplice.slice(1).join('/')}`
    }
    return url
  }

  getImageName(url: string): string {
    if (url) {
      const lastSlashIndex = url.lastIndexOf('/')
      const imageWithPrefix = url.slice(lastSlashIndex + 1)
      const firstUnderscoreIndex = imageWithPrefix.indexOf('_')
      if (firstUnderscoreIndex !== -1) {
        return imageWithPrefix.slice(firstUnderscoreIndex + 1)
      }

      return imageWithPrefix
    }
    return url
  }

  uploadFile() {
    this.executed = true
    if (this.contentFile) {
      const popupMessage = 'Certificate uploading'
      const dialogType = 'imageLoader'
      this.openFileUploadPopup(dialogType, popupMessage)
      const formData = new FormData()
      formData.append(
        'content',
        this.contentFile as Blob,
        (this.contentFile as File).name.replace(/[^A-Za-z0-9_.]/g, ''),
      )
      this.uploadCertificate(formData)
    } else {
      this.showSnackBar('Please upload a Certificate', 'error')
    }
  }

  uploadCertificate(formData: any) {
    this.marketPlaceSvc.uploadThumbNail(formData).subscribe({
      next: responce => {
        const createdUrl = _.get(responce, 'result.url')
        this.providerDetalsBeforUpdate['certificateTemplateUrl'] = createdUrl
        this.fileName = ''
        this.upDateTransforamtionDetails()
        this.dialogRef.close()
      },
    })
  }

  upDateTransforamtionDetails() {
    this.marketPlaceSvc.updateProvider(this.providerDetalsBeforUpdate).subscribe({
      next: (responce: any) => {
        if (responce) {
          setTimeout(() => {
            const successMsg = 'Certificate saved successfully.'
            this.showSnackBar(successMsg, 'success')
            this.sendProviderDetailsUpdateEvent()
          }, 1000)
        }
      },
      error: (error: HttpErrorResponse) => {
        if (this.contentFile) {
          this.providerDetalsBeforUpdate['certificateTemplateUrl'] = ''
        }
        const errmsg = _.get(error, 'error.params.errMsg', 'Something went wrong, please try again later')
        this.showSnackBar(errmsg, 'error')
      },
    })
  }

  sendProviderDetailsUpdateEvent() {
    this.loadProviderDetails.emit(true)
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

  showSnackBar(message: string, type: 'error' | 'success') {
    this.snackBar.openFromComponent(SnackbarComponent, {
      data: {
        message: message, type: type,
      }, duration: 5000, panelClass: type,
    })
  }

  getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url)
  }

}
