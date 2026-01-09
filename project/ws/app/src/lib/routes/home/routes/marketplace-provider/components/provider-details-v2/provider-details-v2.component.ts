import { Component, ViewChild, ElementRef, Output, Input, EventEmitter, SimpleChanges, OnChanges, OnDestroy } from '@angular/core'
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { DatePipe } from '@angular/common'
import { MarketplaceService } from '../../services/marketplace.service'
import * as _ from 'lodash'
import { forkJoin, of } from 'rxjs'
import { mergeMap, takeWhile } from 'rxjs/operators'
import { Router } from '@angular/router'
import { SnackbarComponent } from '@sunbird-cb/consumption'
import { GlobalEventsService } from '../../../../../../../../../../../src/app/services/global-events.service'
import { NavigationExternalService } from '../../../../../../../../../../../src/app/services/navigation-external.service'
@Component({
  selector: 'ws-app-provider-details-v2',
  templateUrl: './provider-details-v2.component.html',
  styleUrls: ['./provider-details-v2.component.scss']
})
export class ProviderDetailsV2Component implements OnChanges, OnDestroy {
  @Input() providerDetails: any
  @Output() loadProviderDetails = new EventEmitter<Boolean>()

  providerDetailsForm!: FormGroup
  @ViewChild('logoInput') logoInput?: ElementRef<HTMLInputElement>
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>
  @ViewChild('canvas') canvas?: ElementRef<HTMLCanvasElement>

  isActive = true

  logoPreviewUrl: string | ArrayBuffer | null = null
  logoFile: File | null = null
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
    private router: Router,
    private loaderService: GlobalEventsService,
    private externalsvc: NavigationExternalService,
  ) {
    this.initializeForm()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.providerDetails && changes.providerDetails.currentValue) {
      this.providerDetailsBeforeUpdate = JSON.parse(JSON.stringify(changes.providerDetails.currentValue))
      this.providerId = _.get(changes.providerDetails.currentValue, 'data.id', null)
      this.patchProviderDetails(changes.providerDetails.currentValue)

      // Add back button wirh breadcrumbs
      this.externalsvc.breadcrumnItems.next(
        [
          {
            label: 'Content Marketplace',
            route: '/app/home/marketplace-providers',
            active: false
          },
          {
            label: this.providerDetailsBeforeUpdate?.data?.contentPartnerName || 'New Provider',
            active: true
          }
        ]
      )
    }
  }

  ngOnDestroy(): void {
    this.isActive = false
  }

  initializeForm(): void {
    this.providerDetailsForm = this.fb.group({
      contentPartnerName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9.\-_$/:\[\] ' !]*$/), Validators.maxLength(70)]],
      partnerCode: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9]*$/), Validators.maxLength(6)]],
      websiteUrl: ['', [Validators.required, Validators.pattern(/^(https?|http):\/\/[^\s/$.?#].[^\s]*$/), Validators.maxLength(1024)]],
      description: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9,\.\-_$/:\[\] ' !]*$/), Validators.maxLength(500)]],
      providerTips: this.fb.array([]),
      partnerAgreement: [''],
      providerLogo: ['', [Validators.required]]
    })

    this.controls['partnerCode']?.valueChanges.pipe((takeWhile(() => this.isActive))).subscribe((value: string) => {
      if (value) {
        this.providerDetailsForm.get('partnerCode')?.setValue(value.toUpperCase(), { emitEvent: false })
      }
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
  patchProviderDetails(providerDetails: any) {
    this.providerDetailsForm.patchValue({
      contentPartnerName: _.get(providerDetails, 'data.contentPartnerName', ''),
      partnerCode: _.get(providerDetails, 'data.partnerCode', ''),
      websiteUrl: _.get(providerDetails, 'data.websiteUrl', ''),
      description: _.get(providerDetails, 'data.description', ''),
      providerLogo: this.logoPreviewUrl || ''
    })
    this.getTipsList.clear()
    this.logoPreviewUrl = this.marketplaceSvc.convertResourceUrl(_.get(providerDetails, 'data.link', ''))
    this.uploadedPdfUrl = _.get(providerDetails, 'data.documentUrl', '')
    this.fileUploadedDate = _.get(providerDetails, 'data.documentUploadedDate', '')
    if (this.uploadedPdfUrl) {
      this.pdfUploaded = true
      this.fileName = this.getFileName
    }
    _.get(providerDetails, 'data.providerTips', []).forEach((tip: string) => {
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
        }
      } else {
        this.showSnackBar('Please upload svg or png image', 'error')
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
    this.providerDetailsForm.patchValue({ providerLogo: this.logoPreviewUrl })
  }

  removeLogo(): void {
    this.logoFile = null
    this.logoPreviewUrl = null
    this.logoTouched = true
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
      this.loaderService.setLoaderState(true)
      this.createContentsToUpload()
    } else {
      this.providerDetailsForm.get('providerLogo')?.markAsTouched()
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
              this.logoPreviewUrl = this.marketplaceSvc.convertResourceUrl(createdUrl)
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
          this.loaderService.setLoaderState(false)
        },
        complete: () => {
          this.loaderService.setLoaderState(false)
        }
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
          if (response?.params?.status === 'success') {
            this.providerDetailsBeforeUpdate = response?.result
            this.providerId = response?.result?.id
            setTimeout(() => {
              const successMsg = 'Successfully Onboarded'
              this.showSnackBar(successMsg, 'success')
              this.loaderService.setLoaderState(false)

            }, 1000)
          } else {
            this.showSnackBar(response?.params?.errMsg || 'Failed to create provider', 'error')
            this.loaderService.setLoaderState(false)
          }
        },
        error: (error: any) => {
          this.loading = false
          this.showSnackBar(error?.error?.params?.errMsg || 'Failed to create provider', 'error')
          this.loaderService.setLoaderState(false)
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
      updatePayload['data']['websiteUrl'] = formDetails.websiteUrl
      updatePayload['data']['isActive'] = true
      updatePayload['data']['description'] = formDetails.description
      updatePayload['data']['contentPartnerName'] = formDetails.contentPartnerName
      updatePayload['data']['providerTips'] = formDetails.providerTips
      updatePayload['data']['link'] = this.logoPreviewUrl
      updatePayload['data']['partnerCode'] = formDetails.partnerCode.toUpperCase()

      if (this.uploadedPdfUrl) {
        updatePayload['data']['documentUrl'] = this.uploadedPdfUrl
        updatePayload['data']['documentUploadedDate'] = this.fileUploadedDate
      } else {
        delete updatePayload['data']['documentUrl']
        delete updatePayload['data']['documentUploadedDate']
      }

      this.marketplaceSvc.updateProvider(updatePayload).subscribe({
        next: (response: any) => {
          this.loading = false
          if (response) {
            setTimeout(() => {
              this.sendDetailsUpdateEvent()
              const successMsg = 'Provider details updated successfully.'
              this.showSnackBar(successMsg, 'success')
              this.loaderService.setLoaderState(false)

            }, 1000)
          }
        },
        error: () => {
          this.loading = false
          this.showSnackBar('Failed to update provider', 'error')
          this.loaderService.setLoaderState(false)
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

  sendDetailsUpdateEvent() {
    this.loadProviderDetails.emit(true)
  }

}
