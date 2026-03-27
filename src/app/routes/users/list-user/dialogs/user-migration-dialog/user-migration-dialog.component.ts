import { Component, Inject, OnInit } from '@angular/core'
import { FormBuilder, FormGroup } from '@angular/forms'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { UsersService } from '../../../users.service'
import { IMigrateUserPayload, IOrganization, IUserProfile } from '../../../models/users.models'

@Component({
  standalone: false,
  selector: 'ws-user-migration-dialog',
  templateUrl: './user-migration-dialog.component.html',
  styleUrls: ['./user-migration-dialog.component.scss'],
})
export class UserMigrationDialogComponent implements OnInit {
  user: IUserProfile
  migrationForm!: FormGroup
  isLoading = false
  selectedOrg: IOrganization | null = null
  validationError = ''

  constructor(
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: { user: IUserProfile },
    private dialogRef: MatDialogRef<UserMigrationDialogComponent>,
    private usersService: UsersService,
    private snackBar: MatSnackBar,
  ) {
    this.user = data.user
  }

  ngOnInit(): void {
    this.migrationForm = this.fb.group({
      forceMigration: [true],
      softDeleteOldOrg: [true],
      notifyMigration: [false],
    })
  }

  onOrgSelected(org: IOrganization): void {
    this.selectedOrg = org
    this.validationError = ''

    // Validate: user must not already be in the target org
    if (this.user.channel && org.channel && this.user.channel === org.channel) {
      this.validationError = 'User is already in the selected organization'
    }
  }

  onOrgCleared(): void {
    this.selectedOrg = null
    this.validationError = ''
  }

  get isFormValid(): boolean {
    return !!this.selectedOrg && !this.validationError
  }

  get userName(): string {
    return this.user.profileDetails?.personalDetails?.firstname || this.user.firstName || ''
  }

  onConfirm(): void {
    if (!this.isFormValid || !this.selectedOrg) { return }

    this.isLoading = true
    this.dialogRef.disableClose = true

    const formVal = this.migrationForm.value
    const payload: IMigrateUserPayload = {
      userId: this.user.userId,
      channel: this.selectedOrg.channel,
      forceMigration: formVal.forceMigration,
      softDeleteOldOrg: formVal.softDeleteOldOrg,
      notifyMigration: formVal.notifyMigration,
    }

    this.usersService.migrateUser({ request: payload }).subscribe(
      () => {
        this.isLoading = false
        this.snackBar.open('User migrated successfully', 'X', { duration: 5000, panelClass: ['success'] })
        this.dialogRef.close({ success: true })
      },
      (err: any) => {
        this.isLoading = false
        this.dialogRef.disableClose = false
        this.snackBar.open(err?.error?.params?.errmsg || 'Failed to migrate user', 'X', { duration: 5000, panelClass: ['error'] })
      },
    )
  }

  onCancel(): void {
    this.dialogRef.close()
  }
}
