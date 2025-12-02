import { Component } from '@angular/core'

@Component({
  selector: 'ws-app-bulk-upload-courses',
  templateUrl: './bulk-upload-courses.component.html',
  styleUrls: ['./bulk-upload-courses.component.scss']
})
export class BulkUploadCoursesComponent {
  uploadedFile: File | null = null

  onDropHandler(file: File): void {
    if (!file) {
      return
    }

    if (!this.isValidFileType(file)) {
      console.error('Invalid file type. Only CSV files are allowed.')
      alert('Invalid file type. Only CSV files are allowed.')
      return
    }

    // Validate file size (400 MB = 400 * 1024 * 1024 bytes)
    const maxFileSize = 400 * 1024 * 1024
    if (file.size > maxFileSize) {
      console.error(`File size exceeds 400 MB limit. Current size: ${this.formatFileSize(file.size)}`)
      alert(`File size exceeds 400 MB limit. Current size: ${this.formatFileSize(file.size)}`)
      return
    }

    // Store the file
    this.uploadedFile = file
    console.log(`File uploaded successfully: ${file.name}`)
  }

  private isValidFileType(file: File): boolean {
    const validTypes = ['text/csv', 'application/vnd.ms-excel']
    const validExtensions = ['.csv']

    // Check MIME type
    if (validTypes.includes(file.type)) {
      return true
    }

    const fileName = file.name.toLowerCase()
    return validExtensions.some(ext => fileName.endsWith(ext))
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }
}
