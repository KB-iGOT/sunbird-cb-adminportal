import { Component, ViewChild, ElementRef } from '@angular/core'
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { DatePipe } from '@angular/common'
import { MarketplaceService } from '../../services/marketplace.service'
import * as _ from 'lodash'
import { forkJoin, of } from 'rxjs'
import { mergeMap } from 'rxjs/operators'
import { Router } from '@angular/router'
import { SnackbarComponent } from '@sunbird-cb/consumption'
@Component({
  selector: 'ws-app-provider-details-v2',
  templateUrl: './provider-details-v2.component.html',
  styleUrls: ['./provider-details-v2.component.scss']
})
export class ProviderDetailsV2Component {
  providerDetailsForm: FormGroup
  @ViewChild('logoInput') logoInput?: ElementRef<HTMLInputElement>
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>
  @ViewChild('canvas') canvas?: ElementRef<HTMLCanvasElement>

  logoPreviewUrl: string | ArrayBuffer | null = null
  logoFile: File | null = null
  logoError: string | null = null
  logoTouched = false

  FILE_UPLOAD_MAX_SIZE = 100 * 1024 * 1024
  pdfUploaded = false
  pdfFile: any = null
  uploadedPdfUrl = ''
  fileName = ''
  fileUploadedDate: string | null = ''

  loading = false
  providerId: string | null = null
  providerDetailsBeforeUpdate: any

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe,
    private marketplaceSvc: MarketplaceService,
    private router: Router
  ) {
    this.providerDetailsForm = this.fb.group({
      contentPartnerName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9.\-_$/:\[\] ' !]*$/), Validators.maxLength(70)]],
      partnerCode: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9]*$/), Validators.maxLength(6)]],
      websiteUrl: ['', [Validators.required, Validators.pattern(/^(https?|http):\/\/[^\s/$.?#].[^\s]*$/), Validators.maxLength(1024)]],
      description: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9,\.\-_$/:\[\] ' !]*$/), Validators.maxLength(500)]],
      providerTips: this.fb.array([]),
      partnerAgreement: [''],
      providerLogo: ['']
    })
  }

  get controls() {
    return this.providerDetailsForm.controls
  }

  get providerTipsList(): FormArray {
    return this.providerDetailsForm.get('providerTips') as FormArray
  }

  get getTipsList(): FormArray {
    return this.providerDetailsForm.get('providerTips') as FormArray
  }

  //#region Validation Helpers
  getControlValidation(controlName: string, validator: string): boolean {
    const control = this.providerDetailsForm.get(controlName)
    return !!(control && control.errors && control.errors[validator])
  }

  getTextLength(controlName: string): number {
    const control = this.providerDetailsForm.get(controlName)
    return control && control.value ? control.value.length : 0
  }
  //#endregion

  //#region Provider Tips
  addTips(message = '') {
    this.getTipsList.push(new FormControl(message, Validators.required))
  }

  removeTipAtIndex(index: number) {
    this.getTipsList.removeAt(index)
  }
  //#endregion

  //#region Load & Patch Details
  loadProviderDetails(id: string) {
    this.loading = true
    this.marketplaceSvc.getProviderDetails(id).subscribe({
      next: (data: any) => {
        this.providerDetailsBeforeUpdate = JSON.parse(JSON.stringify(data))
        this.patchProviderDetails(data)
        this.providerId = id
      },
      error: () => this.showSnackBar('Failed to load provider details', 'error'),
      complete: () => { this.loading = false }
    })
  }

  patchProviderDetails(providerDetails: any) {
    this.providerDetailsForm.patchValue({
      contentPartnerName: _.get(providerDetails, 'contentPartnerName', ''),
      partnerCode: _.get(providerDetails, 'partnerCode', ''),
      websiteUrl: _.get(providerDetails, 'websiteUrl', ''),
      description: _.get(providerDetails, 'description', ''),
    })
    this.getTipsList.clear()
    this.logoPreviewUrl = _.get(providerDetails, 'link', '')
    this.uploadedPdfUrl = _.get(providerDetails, 'documentUrl', '')
    this.fileUploadedDate = _.get(providerDetails, 'documentUploadedDate', '')
    if (this.uploadedPdfUrl) {
      this.pdfUploaded = true
      this.fileName = this.getFileName
    }
    _.get(providerDetails, 'providerTips', []).forEach((tip: string) => {
      this.addTips(tip)
    })
  }

  get getFileName() {
    let fileName = ''
    const fileNameWithPrefix = this.uploadedPdfUrl.split('/').pop()
    if (fileNameWithPrefix) {
      fileName = fileNameWithPrefix.includes('_')
        ? fileNameWithPrefix.split('_').slice(1).join('_')
        : fileNameWithPrefix
    }
    return fileName
  }
  //#endregion

  //#region Logo Upload & Cropping
  triggerLogoSelect(): void {
    if (this.logoInput && this.logoInput.nativeElement) {
      this.logoInput.nativeElement.click()
    }
  }

  onLogoSelected(event: Event): void {
    this.logoError = null
    const input = event.target as HTMLInputElement
    if (!input.files || input.files.length === 0) {
      return
    }
    this.onThumbNailSelected(input.files[0])
  }

  onThumbNailSelected(event: any): void {
    this.logoTouched = true
    this.logoFile = event
    const fileName = event.name.replace(/[^A-Za-z0-9_.]/g, '')
    if (this.logoFile) {
      if (fileName.toLowerCase().endsWith('.svg') || fileName.toLowerCase().endsWith('.png')) {
        const fileSizeInKB = this.logoFile.size / 1000
        const minSizeKB = 10
        const maxSizeMB = 2
        const maxSizeKB = maxSizeMB * 1000
        if (fileSizeInKB >= minSizeKB && fileSizeInKB <= maxSizeKB) {
          const reader = new FileReader()
          reader.onload = (e: any) => {
            const img = new Image()
            img.onload = () => {
              this.cropImage(img)
            }
            img.src = e.target.result
          }
          reader.readAsDataURL(this.logoFile)
        } else {
          this.showSnackBar('Please upload image sized between 10 KB and 2 MB', 'error')
          this.logoError = 'Please upload image sized between 10 KB and 2 MB'
        }
      } else {
        this.showSnackBar('Please upload svg or png image', 'error')
        this.logoError = 'Please upload svg or png image'
      }
    }
  }

  cropImage(image: HTMLImageElement): void {
    if (!this.canvas) return
    const canvas = this.canvas.nativeElement
    const ctx = canvas.getContext('2d')

    const aspectRatio = 16 / 9
    let width = image.width
    let height = image.height
    if (width / height > aspectRatio) {
      width = height * aspectRatio
    } else {
      height = width / aspectRatio
    }

    const startX = (image.width - width) / 2
    const startY = (image.height - height) / 2

    canvas.width = width
    canvas.height = height

    if (ctx) {
      ctx.drawImage(image, startX, startY, width, height, 0, 0, width, height)
    }
    canvas.toBlob(blob => {
      if (blob && this.logoFile) {
        this.logoFile = new File([blob], this.logoFile.name, {
          type: 'image/png',
          lastModified: Date.now(),
        })
      }
    }, 'image/png')

    this.logoPreviewUrl = canvas.toDataURL('image/png')
  }

  removeLogo(): void {
    this.logoFile = null
    this.logoPreviewUrl = null
    this.logoError = null
    this.providerDetailsForm.patchValue({ providerLogo: '' })
    if (this.logoInput && this.logoInput.nativeElement) {
      this.logoInput.nativeElement.value = ''
    }
  }
  //#endregion

  //#region PDF Upload
  onDrop(file: File) {
    if (!file) {
      return
    }
    const fileName = file.name.replace(/[^A-Za-z0-9_.]/g, '')
    if (!fileName.toLowerCase().endsWith('.pdf')) {
      this.showSnackBar('Please upload PDF file', 'error')
    } else if (file.size > this.FILE_UPLOAD_MAX_SIZE) {
      this.showSnackBar('file size should not be more than 100 MB', 'error')
    } else {
      this.pdfFile = file
      this.pdfUploaded = true
      this.fileName = file.name
      this.fileUploadedDate = this.datePipe.transform(new Date(), 'dd/MM/yyyy')
    }
  }

  removePdf() {
    this.pdfFile = null
    this.pdfUploaded = false
    this.fileName = ''
    this.uploadedPdfUrl = ''
  }
  //#endregion

  //#region Submit & Save
  submit() {
    this.logoTouched = true
    if (this.providerDetailsForm.valid && this.logoPreviewUrl) {
      this.createContentsToUpload()
    } else {
      this.showSnackBar('Please fill all the mandatory fields with proper data', 'error')
    }
  }

  createContentsToUpload() {
    const resourceCreationSubscriptions: any = []
    this.loading = true

    if (this.logoFile) {
      const formData = new FormData()
      formData.append(
        'content',
        this.logoFile as Blob,
        (this.logoFile as File).name.replace(/[^A-Za-z0-9_.]/g, ''),
      )
      resourceCreationSubscriptions.push(
        this.marketplaceSvc.uploadThumbNail(formData).pipe(
          mergeMap((res: any) => {
            return of({
              fileType: 'thumbnail',
              result: res.result,
            })
          })
        )
      )
    }
    if (this.pdfFile) {
      const formData = new FormData()
      formData.append(
        'content',
        this.pdfFile as Blob,
        (this.pdfFile as File).name.replace(/[^A-Za-z0-9_.]/g, ''),
      )
      resourceCreationSubscriptions.push(
        this.marketplaceSvc.uploadCIOSContract(formData).pipe(
          mergeMap((res: any) => {
            return of({
              fileType: 'ciosFile',
              result: res.result,
            })
          })
        )
      )
    }

    if (resourceCreationSubscriptions.length > 0) {
      forkJoin(resourceCreationSubscriptions).subscribe({
        next: (responses: any) => {
          responses.forEach((response: any) => {
            const createdUrl = _.get(response, 'result.url')
            if (response.fileType === 'thumbnail') {
              this.logoPreviewUrl = createdUrl
            } else if (response.fileType === 'ciosFile') {
              this.uploadedPdfUrl = createdUrl
            }
          })
          if (this.providerId) {
            this.updateProvider()
          } else {
            this.saveProviderDetails()
          }
        },
        error: () => {
          this.loading = false
          this.showSnackBar('File upload failed', 'error')
        },
      })
    } else {
      if (this.providerId) {
        this.updateProvider()
      } else {
        this.saveProviderDetails()
      }
    }
  }

  saveProviderDetails() {
    if (this.providerDetailsForm.valid && this.logoPreviewUrl) {
      const formDetails = this.providerDetailsForm.value
      const formBody: any = {
        websiteUrl: formDetails.websiteUrl,
        isActive: true,
        description: formDetails.description,
        contentPartnerName: formDetails.contentPartnerName,
        providerTips: formDetails.providerTips,
        link: this.logoPreviewUrl,
        partnerCode: formDetails.partnerCode.toUpperCase(),
      }
      if (this.uploadedPdfUrl) {
        formBody['documentUrl'] = this.uploadedPdfUrl
        formBody['documentUploadedDate'] = this.fileUploadedDate
      }

      this.marketplaceSvc.createProvider(formBody).subscribe({
        next: (response: any) => {
          this.loading = false
          if (response) {
            setTimeout(() => {
              const successMsg = 'Successfully Onboarded'
              this.showSnackBar(successMsg, 'success')
            }, 1000)
          }
        },
        error: () => {
          this.loading = false
          this.showSnackBar('Failed to create provider', 'error')
        },
      })
    } else {
      this.showSnackBar('Please fill all the mandatory fields with proper data', 'error')
    }
  }

  updateProvider() {
    if (this.providerDetailsForm.valid && this.logoPreviewUrl && this.providerDetailsBeforeUpdate) {
      const formDetails = this.providerDetailsForm.value
      const updatePayload = JSON.parse(JSON.stringify(this.providerDetailsBeforeUpdate))
      updatePayload['websiteUrl'] = formDetails.websiteUrl
      updatePayload['isActive'] = true
      updatePayload['description'] = formDetails.description
      updatePayload['contentPartnerName'] = formDetails.contentPartnerName
      updatePayload['providerTips'] = formDetails.providerTips
      updatePayload['link'] = this.logoPreviewUrl

      if (this.uploadedPdfUrl) {
        updatePayload['documentUrl'] = this.uploadedPdfUrl
        updatePayload['documentUploadedDate'] = this.fileUploadedDate
      } else {
        delete updatePayload['documentUrl']
        delete updatePayload['documentUploadedDate']
      }

      this.marketplaceSvc.updateProvider(updatePayload).subscribe({
        next: (response: any) => {
          this.loading = false
          if (response) {
            setTimeout(() => {
              const successMsg = 'Provider details updated successfully.'
              this.showSnackBar(successMsg, 'success')
            }, 1000)
          }
        },
        error: () => {
          this.loading = false
          this.showSnackBar('Failed to update provider', 'error')
        },
      })
    } else {
      this.showSnackBar('Please fill all the mandatory fields with proper data', 'error')
    }
  }
  //#endregion

  showSnackBar(message: string, type: 'error' | 'success') {

    this.snackBar.openFromComponent(SnackbarComponent, {
      data: {
        message: message, type: type,
      }, duration: 5000, panelClass: type,
    })
  }

  navigateToProvidersDashboard() {
    this.router.navigateByUrl('/app/home/marketplace-providers')
  }
}
