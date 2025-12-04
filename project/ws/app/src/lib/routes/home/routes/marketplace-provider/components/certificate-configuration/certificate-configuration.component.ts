import { Component, EventEmitter, Input, Output, ViewChild, ElementRef } from '@angular/core'

@Component({
  selector: 'ws-app-certificate-configuration',
  templateUrl: './certificate-configuration.component.html',
  styleUrls: ['./certificate-configuration.component.scss']
})
export class CertificateConfigurationComponent {
  @Input() providerDetails: any
  @Output() loadProviderDetails = new EventEmitter<any>()

  @ViewChild('logoFileInput') logoFileInput!: ElementRef
  @ViewChild('certificateFileInput') certificateFileInput!: ElementRef

  // Logo upload state
  logoUploaded = false
  logoFileName = ''
  logoUploadedDate = ''
  selectedLogoImage: string | ArrayBuffer | null = null

  // Certificate preview upload state
  certificateUploaded = false
  certificateFileName = ''
  certificateUploadedDate = ''
  selectedCertificateImage: string | ArrayBuffer | null = null

  // Allowed file types
  allowedFileTypes = '.jpg,.jpeg,.png'
  allowedMimeTypes = ['image/jpeg', 'image/png']

  onDropLogo(event: any): void {
    const file = event instanceof File ? event : event.files?.[0]
    if (file) {
      this.handleFileUpload(file, 'logo')
    }
  }

  onDropCertificate(event: any): void {
    const file = event instanceof File ? event : event.files?.[0]
    if (file) {
      this.handleFileUpload(file, 'certificate')
    }
  }

  private handleFileUpload(file: File, uploadType: 'logo' | 'certificate'): void {
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
      } else if (uploadType === 'certificate') {
        this.certificateFileName = fileName
        this.certificateUploadedDate = uploadedDate
        this.certificateUploaded = true
        this.selectedCertificateImage = imageData || null
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
    this.certificateFileName = ''
    this.certificateUploadedDate = ''
    this.selectedCertificateImage = null
    if (this.certificateFileInput) {
      this.certificateFileInput.nativeElement.value = null
    }
  }
}
