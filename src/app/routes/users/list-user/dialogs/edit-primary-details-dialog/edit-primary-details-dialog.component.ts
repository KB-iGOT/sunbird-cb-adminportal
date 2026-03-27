import { Component, Inject, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { UsersService } from '../../../users.service'
import { IPendingRequest, IUserProfile } from '../../../models/users.models'

@Component({
  standalone: false,
  selector: 'ws-edit-primary-details-dialog',
  templateUrl: './edit-primary-details-dialog.component.html',
  styleUrls: ['./edit-primary-details-dialog.component.scss'],
})
export class EditPrimaryDetailsDialogComponent implements OnInit {
  primaryForm!: FormGroup
  isLoading = false
  user: IUserProfile
  groups: string[] = []
  designations: string[] = []
  pendingRequests: IPendingRequest = {}
  isFormDisabled = false
  isGroupDisabled = false
  isDesignationDisabled = false

  constructor(
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: { user: IUserProfile; pendingRequests?: IPendingRequest },
    private dialogRef: MatDialogRef<EditPrimaryDetailsDialogComponent>,
    private usersService: UsersService,
    private snackBar: MatSnackBar,
  ) {
    this.user = data.user
    this.pendingRequests = data.pendingRequests || {}
  }

  ngOnInit(): void {
    const profDetails = this.user.profileDetails?.professionalDetails?.[0]

    this.primaryForm = this.fb.group({
      group: [profDetails?.group || '', Validators.required],
      designation: [profDetails?.designation || '', Validators.required],
    })

    // Apply pending request restrictions
    if (this.pendingRequests.wfTransferRequest) {
      this.isFormDisabled = true
      this.primaryForm.disable()
    } else {
      if (this.pendingRequests.wfProfileGroupRequest) {
        this.isGroupDisabled = true
        this.primaryForm.get('group')?.disable()
      }
      if (this.pendingRequests.wfProfileDesignationRequest) {
        this.isDesignationDisabled = true
        this.primaryForm.get('designation')?.disable()
      }
    }

    this.loadGroups()
  }

  loadGroups(): void {
    this.usersService.fetchGroups().subscribe(
      (res: any) => {
        this.groups = res?.result?.response || res?.result || res || []
      },
      () => { this.snackBar.open('Failed to load groups', 'X', { duration: 5000 }) },
    )
  }

  onDesignationSelected(designation: string): void {
    this.primaryForm.get('designation')?.setValue(designation)
  }

  onSubmit(): void {
    if (this.primaryForm.invalid) { return }

    this.isLoading = true
    this.dialogRef.disableClose = true

    const formVal = this.primaryForm.getRawValue()
    const payload = {
      request: {
        userId: this.user.userId,
        profileDetails: {
          professionalDetails: [{
            group: formVal.group,
            designation: formVal.designation,
          }],
        },
      },
    }

    this.usersService.extPatchUser(payload).subscribe(
      () => {
        this.isLoading = false
        this.snackBar.open('Primary details updated successfully', 'X', { duration: 5000, panelClass: ['success'] })
        this.dialogRef.close({ success: true })
      },
      (err: any) => {
        this.isLoading = false
        this.dialogRef.disableClose = false
        this.snackBar.open(err?.error?.params?.errmsg || 'Failed to update primary details', 'X', { duration: 5000, panelClass: ['error'] })
      },
    )
  }

  onCancel(): void {
    this.dialogRef.close()
  }
}
