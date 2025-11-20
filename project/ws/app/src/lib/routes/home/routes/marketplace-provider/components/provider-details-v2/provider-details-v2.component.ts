import { Component, ViewChild, ElementRef } from '@angular/core'
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { DatePipe } from '@angular/common'

const LOGO_MAX_SIZE_MB = 5
@Component({
  selector: 'ws-app-provider-details-v2',
  templateUrl: './provider-details-v2.component.html',
  styleUrls: ['./provider-details-v2.component.scss']
})
export class ProviderDetailsV2Component {
  providerDetailsForm: FormGroup
  @ViewChild('logoInput') logoInput?: ElementRef<HTMLInputElement>
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>

  logoPreviewUrl: string | ArrayBuffer | null = null
  logoFile: File | null = null
  logoError: string | null = null
  // partnership agreement pdf
  FILE_UPLOAD_MAX_SIZE = 100 * 1024 * 1024
  pdfUploaded = false
  pdfFile: any = null
  uploadedPdfUrl = ''
  fileName = ''
  fileUploadedDate: string | null = ''

  constructor(private fb: FormBuilder, private snackBar: MatSnackBar, private datePipe: DatePipe) {
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

  addTips(message = '') {
    this.getTipsList.push(new FormControl(message, Validators.required))
  }

  removeTipAtIndex(index: number) {
    this.getTipsList.removeAt(index)
  }

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
    const file = input.files[0]
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
    const maxSizeBytes = LOGO_MAX_SIZE_MB * 1024 * 1024

    if (!allowedTypes.includes(file.type)) {
      this.logoError = 'Unsupported file type. Please upload PNG, JPG or SVG.'
      this.clearLogoInput(input)
      return
    }

    if (file.size > maxSizeBytes) {
      this.logoError = `File is too large. Maximum allowed size is ${LOGO_MAX_SIZE_MB}MB.`
      this.clearLogoInput(input)
      return
    }

    this.logoFile = file
    this.providerDetailsForm.patchValue({ providerLogo: file.name })

    const reader = new FileReader()
    reader.onload = () => {
      this.logoPreviewUrl = reader.result
    }
    reader.readAsDataURL(file)
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

  private clearLogoInput(input: HTMLInputElement) {
    input.value = ''
    this.logoFile = null
    this.logoPreviewUrl = null
  }

  onDrop(file: File) {
    if (!file) {
      return
    }
    const fileName = file.name.replace(/[^A-Za-z0-9_.]/g, '')
    if (!fileName.toLowerCase().endsWith('.pdf')) {
      this.showSnackBar('Please upload PDF file')
    } else if (file.size > this.FILE_UPLOAD_MAX_SIZE) {
      this.showSnackBar('file size should not be more than 100 MB')
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

  showSnackBar(message: string) {
    this.snackBar.open(message)
  }
}
