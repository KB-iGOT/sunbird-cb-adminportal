import { Component, Inject } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { TopicsService } from '../topics.service'

export interface CreateTopicData {
  mode: 'create' | 'edit'
  topic?: {
    categoryId?: string
    categoryName: string
    description?: string
  }
}

@Component({
  selector: 'ws-app-create-topic-dialog',
  templateUrl: './create-topic-dialog.component.html',
  styleUrls: ['./create-topic-dialog.component.scss']
})
export class CreateTopicDialogComponent {
  topicForm!: FormGroup
  isLoading = false;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private topicsService: TopicsService,
    public dialogRef: MatDialogRef<CreateTopicDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CreateTopicData
  ) {
    this.isEditMode = data.mode === 'edit'
    this.initializeForm()
  }

  private initializeForm(): void {
    this.topicForm = this.fb.group({
      categoryName: [
        this.data.topic?.categoryName || '',
        [Validators.required, Validators.minLength(3), Validators.maxLength(100)]
      ],
      description: [
        this.data.topic?.description || '',
        [Validators.required, Validators.minLength(10), Validators.maxLength(500)]
      ]
    })
  }

  onSubmit(): void {
    if (this.topicForm.valid) {
      this.isLoading = true
      const formValue = this.topicForm.value

      const topicData = {
        categoryName: formValue.categoryName.trim(),
        description: formValue.description.trim()
      }

      if (this.isEditMode && this.data.topic?.categoryId) {
        // For edit mode - you'll need to implement update API
        this.updateTopic(this.data.topic.categoryId, topicData)
      } else {
        // Create mode
        this.createTopic(topicData)
      }
    } else {
      this.markFormGroupTouched()
    }
  }

  private createTopic(topicData: { categoryName: string; description: string }): void {
    this.topicsService.createTopic(topicData).subscribe({
      next: (response) => {
        this.isLoading = false
        this.dialogRef.close({ success: true, data: response })
      },
      error: (error) => {
        this.isLoading = false
        console.error('Error creating topic:', error)
        // You can add more sophisticated error handling here
      }
    })
  }

  private updateTopic(categoryId: string, topicData: { categoryName: string; description: string }): void {
    // Implement update functionality when API is available
    console.log('Update topic:', categoryId, topicData)
    this.isLoading = false
    this.dialogRef.close({ success: true, updated: true })
  }

  private markFormGroupTouched(): void {
    Object.keys(this.topicForm.controls).forEach(key => {
      const control = this.topicForm.get(key)
      control?.markAsTouched()
    })
  }

  onCancel(): void {
    this.dialogRef.close({ success: false })
  }

  getErrorMessage(fieldName: string): string {
    const control = this.topicForm.get(fieldName)
    if (control?.hasError('required')) {
      return `${this.getFieldDisplayName(fieldName)} is required`
    }
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength']?.requiredLength
      return `${this.getFieldDisplayName(fieldName)} must be at least ${minLength} characters`
    }
    if (control?.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength']?.requiredLength
      return `${this.getFieldDisplayName(fieldName)} must not exceed ${maxLength} characters`
    }
    return ''
  }

  private getFieldDisplayName(fieldName: string): string {
    const fieldNames: { [key: string]: string } = {
      categoryName: 'Category Name',
      description: 'Description'
    }
    return fieldNames[fieldName] || fieldName
  }
}
