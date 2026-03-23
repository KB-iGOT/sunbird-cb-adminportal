import { Component, Inject, OnInit } from '@angular/core'
import { FormBuilder, FormGroup } from '@angular/forms'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { UsersService } from '../../../users.service'
import { EDITABLE_FIELDS, IUserProfile } from '../../../models/users.models'
import { get } from 'lodash'

@Component({
  standalone: false,
  selector: 'ws-edit-user-details-dialog',
  templateUrl: './edit-user-details-dialog.component.html',
  styleUrls: ['./edit-user-details-dialog.component.scss'],
})
export class EditUserDetailsDialogComponent implements OnInit {
  editForm!: FormGroup
  isLoading = false
  fields = EDITABLE_FIELDS
  user: IUserProfile

  constructor(
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: { user: IUserProfile },
    private dialogRef: MatDialogRef<EditUserDetailsDialogComponent>,
    private usersService: UsersService,
    private snackBar: MatSnackBar,
  ) {
    this.user = data.user
  }

  ngOnInit(): void {
    const controls: { [key: string]: any } = {}
    this.fields.forEach(field => {
      const currentValue = get(this.user, field.path, '') || ''
      controls[field.identifier] = [currentValue]
    })
    this.editForm = this.fb.group(controls)
  }

  onSubmit(): void {
    const changedFields: { [key: string]: any } = {}
    let hasChanges = false

    this.fields.forEach(field => {
      const originalValue = get(this.user, field.path, '') || ''
      const newValue = (this.editForm.get(field.identifier)?.value || '').trim()
      if (newValue !== originalValue) {
        this.setNestedValue(changedFields, field.path, newValue)
        hasChanges = true
      }
    })

    if (!hasChanges) {
      this.snackBar.open('No changes were made', 'X', { duration: 5000 })
      this.dialogRef.close()
      return
    }

    // Handle email duplication at root
    const emailField = this.fields.find(f => f.identifier === 'email')
    if (emailField) {
      const originalEmail = get(this.user, emailField.path, '') || ''
      const newEmail = (this.editForm.get('email')?.value || '').trim()
      if (newEmail !== originalEmail) {
        changedFields['email'] = newEmail
      }
    }

    // Handle phone duplication at root
    const phoneField = this.fields.find(f => f.identifier === 'phone')
    if (phoneField) {
      const originalPhone = get(this.user, phoneField.path, '') || ''
      const newPhone = (this.editForm.get('phone')?.value || '').trim()
      if (newPhone !== originalPhone) {
        changedFields['phone'] = newPhone
      }
    }

    // Strip verifiedKarmayogi from profileDetails
    if (changedFields['profileDetails']) {
      delete changedFields['profileDetails']['verifiedKarmayogi']
      if (changedFields['profileDetails']['professionalDetails']?.length) {
        changedFields['profileDetails']['professionalDetails'].forEach((pd: any) => {
          delete pd['verifiedKarmayogi']
        })
      }
    }

    this.isLoading = true
    this.dialogRef.disableClose = true

    const payload = { request: { userId: this.user.userId, ...changedFields } }

    this.usersService.extPatchUser(payload).subscribe(
      () => {
        this.isLoading = false
        this.snackBar.open('User details updated successfully', 'X', { duration: 5000, panelClass: ['success'] })
        this.dialogRef.close({ success: true })
      },
      (err: any) => {
        this.isLoading = false
        this.dialogRef.disableClose = false
        this.snackBar.open(err?.error?.params?.errmsg || 'Failed to update user details', 'X', { duration: 5000, panelClass: ['error'] })
      },
    )
  }

  onCancel(): void {
    this.dialogRef.close()
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const parts = path.split('.')
    let current = obj
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {}
      }
      current = current[parts[i]]
    }
    current[parts[parts.length - 1]] = value
  }
}
