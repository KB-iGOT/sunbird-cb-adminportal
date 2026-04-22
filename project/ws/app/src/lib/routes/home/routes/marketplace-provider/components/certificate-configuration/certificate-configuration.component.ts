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
import { jsPDF } from 'jspdf'

@Component({
  selector: 'ws-app-certificate-configuration',
  templateUrl: './certificate-configuration.component.html',
  styleUrls: ['./certificate-configuration.component.scss'],
  standalone: false
})
export class CertificateConfigurationComponent implements OnChanges {
  @Input() providerDetails: any
  @Output() loadProviderDetails = new EventEmitter<any>()

  @ViewChild('logoFileInput') logoFileInput!: ElementRef
  @ViewChild('certificateFileInput') certificateFileInput!: ElementRef

  FILE_UPLOAD_MAX_SIZE: number = 100 * 1024 * 1024
  FILE_UPLOAD_MAX_SIZE_LOGO: number = 1 * 1024 * 1024 * 1024

  private readonly TARGET_HEIGHT = 73;
  private readonly TARGET_Y_CENTER = 104;
  private readonly TARGET_X_START = 1050;

  contentFile: any
  certificateUrl = ''
  safeCertificateUrl: SafeResourceUrl | null = null
  fileName = ''
  dialogRef: any
  providerDetalsBeforUpdate: any
  certificateUploaded = false
  executed = false

  providerForm!: FormGroup

  logoUploaded = false
  logoFileName = ''
  logoUploadedDate = ''
  selectedLogoImage: string | ArrayBuffer | null = null

  certificateFileName = ''
  certificateUploadedDate = ''

  allowedFileTypes = '.jpg,.jpeg,.png'
  allowedMimeTypes = ['.svg', 'image/svg+xml']
  defaultCertificateTemplateUrl = '/assets/images/sample/Course_completion_certificate_New4.svg'
  constructor(
    private marketPlaceSvc: MarketplaceService,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    public sanitizer: DomSanitizer
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
      providerName: [this.providerDetalsBeforUpdate?.data?.contentPartnerName || '', Validators.required]
    })
  }

  setExistingCertificate() {
    if (this.providerDetalsBeforUpdate?.certificateTemplateUrl?.trim()) {
      this.certificateUploaded = true
      this.certificateUrl = this.generatePublicUrl(this.providerDetalsBeforUpdate.certificateTemplateUrl)
      this.fileName = this.getImageName(this.providerDetalsBeforUpdate.certificateTemplateUrl)
      this.safeCertificateUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.certificateUrl) // NOSONAR

      const modifiedUrl = this.updateBaseOfUrl(this.certificateUrl)
      fetch(modifiedUrl)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], this.fileName, { type: 'image/svg+xml' })
          this.contentFile = file
        })
        .catch(() => {
          this.showSnackBar('Failed to load existing certificate', 'error')
          this.contentFile = undefined
        })

    }
  }

  updateBaseOfUrl(url: string): string {
    const parsedUrl = new URL(url)
    return `${parsedUrl.protocol}//${environment.sitePath}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`
  }

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
      this.showSnackBar('Please upload a file less than 100 MB.', 'error')
    } else {
      this.contentFile = file
      this.certificateUrl = URL.createObjectURL(file)
      this.safeCertificateUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.certificateUrl) // NOSONAR
      this.certificateUploaded = true

      // If logo is already uploaded, merge it with certificate
      if (this.logoUploaded && this.selectedLogoImage) {
        this.mergeLogo()
      }
    }
  }

  private handleFileUpload(file: File, uploadType: 'logo'): void {
    if (!this.isValidFile(file)) {
      this.showSnackBar('Please upload a valid file.', 'error')
      return
    }

    if (file.size > this.FILE_UPLOAD_MAX_SIZE_LOGO) {
      this.showSnackBar('Please upload a file less than 1 GB.', 'error')
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

        // If certificate is already uploaded, merge logo with certificate
        if (this.certificateUploaded && this.contentFile) {
          this.mergeLogo()
        }
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
    this.safeCertificateUrl = null
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

  // Merges the uploaded logo with the certificate template
  private mergeLogo(): void {
    try {
      const certificateReader = new FileReader()
      certificateReader.onload = (certEvent) => {
        const certificateSvgContent = certEvent.target?.result as string

        // If selectedLogoImage is a data URL, we need to convert it
        if (typeof this.selectedLogoImage === 'string' && this.selectedLogoImage.startsWith('data:')) {
          // Extract the base64 content and decode it
          const base64Content = this.selectedLogoImage.split(',')[1]
          const binaryString = atob(base64Content)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          const logoBlob = new Blob([bytes])
          const logoReader = new FileReader()
          logoReader.onload = (logoEvent) => {
            this.processMergeLogo(certificateSvgContent, logoEvent.target?.result as string)
          }
          logoReader.readAsText(logoBlob)
        }
      }
      certificateReader.readAsText(this.contentFile)
    } catch (error: any) {
      this.showSnackBar(`Error processing files: ${error.message}`, 'error')
    }
  }

  // Process the actual logo merge operation
  private processMergeLogo(certificateSvgContent: string, logoSvgContent: string): void {
    try {
      // Update certificate with logo
      const updatedCertificateSvg = this.updateCertificateWithLogo(
        certificateSvgContent,
        logoSvgContent
      )

      // Create a new blob with the updated SVG content
      const updatedBlob = new Blob([updatedCertificateSvg], { type: 'image/svg+xml' })
      this.contentFile = new File(
        [updatedBlob],
        this.fileName || 'certificate.svg',
        { type: 'image/svg+xml' }
      )

      // Update certificate preview URL
      this.certificateUrl = URL.createObjectURL(updatedBlob)
      this.safeCertificateUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.certificateUrl) // NOSONAR

    } catch (error: any) { }
  }

  // Extracts the logo and places it at the ProvidersLogo_Placement location in the certificate
  private updateCertificateWithLogo(certificateSvgContent: string, logoSvgContent: string): string {
    const parser = new DOMParser()
    const certDoc = parser.parseFromString(certificateSvgContent, 'image/svg+xml')

    // Check for parsing errors in certificate
    if (certDoc.querySelector('parsererror')) {
      this.showSnackBar('Error parsing certificate SVG', 'error')
      return ''
    }

    // Find the ProvidersLogo_Placement group
    let logoGroup = certDoc.getElementById('ProvidersLogo_Placement')
    if (!logoGroup) {
      logoGroup = certDoc.querySelector('[id="ProvidersLogo_Placement"]')
    }
    if (!logoGroup) {
      // Try partial match if id not exact
      logoGroup = certDoc.querySelector('g[id*="ProvidersLogo_Placement"]')
    }

    if (!logoGroup) {
      this.showSnackBar('Could not find ProvidersLogo_Placement group in the certificate SVG', 'error')
      return ''
    }

    // Parse the new logo SVG
    const logoDoc = parser.parseFromString(logoSvgContent, 'image/svg+xml')
    if (logoDoc.querySelector('parsererror')) {
      this.showSnackBar('Error parsing logo SVG', 'error')
      return ''
    }

    const logoSvg = logoDoc.querySelector('svg')
    if (!logoSvg) {
      this.showSnackBar('Invalid logo SVG structure: No <svg> tag found', 'error')
      return ''
    }

    // Create a new group for the logo
    const newLogoGroup = certDoc.createElementNS('http://www.w3.org/2000/svg', 'g')
    newLogoGroup.setAttribute('id', 'ProvidersLogo_Placement')

    // --- Dimension Extraction & Alignment Logic ---
    const viewBox = logoSvg.getAttribute('viewBox')
    let minX = 0, minY = 0, logoWidth = 100, logoHeight = 100

    if (viewBox) {
      const vbParts = viewBox.split(/[\s,]+/).map(parseFloat)
      if (vbParts.length >= 4) {
        minX = vbParts[0]
        minY = vbParts[1]
        logoWidth = vbParts[2]
        logoHeight = vbParts[3]
      }
    } else {
      // Fallback to width/height attributes if viewBox is missing
      const wAttr = logoSvg.getAttribute('width')
      const hAttr = logoSvg.getAttribute('height')

      // Attempt to parse pixel values, ignoring 'px'
      logoWidth = wAttr ? parseFloat(wAttr) : 100
      logoHeight = hAttr ? parseFloat(hAttr) : 100
    }

    // 1. Calculate Scale to match target height
    if (logoHeight === 0) logoHeight = 100
    const scale = this.TARGET_HEIGHT / logoHeight

    // 2. Calculate Translate X
    // Rendered Left = (minX * scale) + tx => tx = TargetLeft - (minX * scale)
    const tx = this.TARGET_X_START - (minX * scale)

    // 3. Calculate Translate Y
    // Rendered Center Y = ((minY + height/2) * scale) + ty => ty = TargetCenterY - (LocalCenterY * scale)
    const localCenterY = minY + (logoHeight / 2)
    const ty = this.TARGET_Y_CENTER - (localCenterY * scale)

    const newTransform = `translate(${tx.toFixed(2)}, ${ty.toFixed(2)}) scale(${scale.toFixed(4)})`
    newLogoGroup.setAttribute('transform', newTransform)

    // We clone nodes to avoid modifying the parsed source logic references directly during iteration
    const logoChildren = Array.from(logoSvg.childNodes)

    for (const child of logoChildren) {
      if (child.nodeType === 1) {
        const importedNode = certDoc.importNode(child, true) as Element

        if (importedNode.tagName.toLowerCase() === 'svg') {
          if (!importedNode.getAttribute('width')) {
            importedNode.setAttribute('width', logoWidth.toString())
          }
          if (!importedNode.getAttribute('height')) {
            importedNode.setAttribute('height', logoHeight.toString())
          }
          if (!importedNode.getAttribute('viewBox') && viewBox) {
            importedNode.setAttribute('viewBox', viewBox)
          }
        }

        newLogoGroup.appendChild(importedNode)
      }
    }

    if (logoGroup.parentNode) {
      logoGroup.parentNode.replaceChild(newLogoGroup, logoGroup)
    }

    const serializer = new XMLSerializer()
    return serializer.serializeToString(certDoc)
  }


  downloadPDF() {
    if (this.certificateUploaded && this.contentFile) {
      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) return

        canvas.width = img.width
        canvas.height = img.height

        ctx.drawImage(img, 0, 0)

        const imgData = canvas.toDataURL('image/png')

        const pdf = new jsPDF({
          orientation: img.width > img.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [img.width, img.height]
        })

        pdf.addImage(imgData, 'PNG', 0, 0, img.width, img.height)
        pdf.save(this.fileName?.replace('.svg', '.pdf') || 'certificate.pdf')
      }

      img.onerror = () => {
        this.showSnackBar('Failed to load certificate', 'error')
      }

      img.src = this.certificateUrl
    } else {
      this.showSnackBar('No certificate available for download', 'error')
    }
  }


  useDefaultTemplate() {
    if (!this.defaultCertificateTemplateUrl) {
      this.showSnackBar('Default certificate template not found', 'error')
      return
    }

    fetch(this.defaultCertificateTemplateUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'CourseCertificate_Template.svg', { type: 'image/svg+xml' })
        this.contentFile = file
        this.fileName = file.name

        this.certificateUrl = URL.createObjectURL(file)
        this.safeCertificateUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.certificateUrl) // NOSONAR
        this.certificateUploaded = true

        if (this.logoUploaded && this.selectedLogoImage) {
          this.mergeLogo()
        }
      })
      .catch(() => {
        this.showSnackBar('Failed to load default certificate template', 'error')
      })
  }

}
