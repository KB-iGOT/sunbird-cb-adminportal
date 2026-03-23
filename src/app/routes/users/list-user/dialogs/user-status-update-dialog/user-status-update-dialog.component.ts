import { Component, Inject } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { UsersService } from '../../../users.service'
import { IOrganization, IUserProfile } from '../../../models/users.models'

@Component({
  standalone: false,
  selector: 'ws-user-status-update-dialog',
  templateUrl: './user-status-update-dialog.component.html',
  styleUrls: ['./user-status-update-dialog.component.scss'],
})
export class UserStatusUpdateDialogComponent {
  user: IUserProfile
  isLoading = false
  selectedOrg: IOrganization | null = null

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { user: IUserProfile },
    private dialogRef: MatDialogRef<UserStatusUpdateDialogComponent>,
    private usersService: UsersService,
    private snackBar: MatSnackBar,
  ) {
    this.user = data.user
  }

  get userName(): string {
    return this.user.profileDetails?.personalDetails?.firstname || this.user.firstName || ''
  }

  onOrgSelected(org: IOrganization): void {
    this.selectedOrg = org
  }

  onOrgCleared(): void {
    this.selectedOrg = null
  }

  onConfirm(): void {
    if (!this.selectedOrg) { return }

    this.isLoading = true
    this.dialogRef.disableClose = true

    const payload = {
      request: {
        userId: this.user.userId,
        channel: this.selectedOrg.channel,
        forceMigration: true,
        softDeleteOldOrg: true,
        notifyMigration: false,
      },
    }

    this.usersService.migrateUser(payload).subscribe(
      () => {
        this.isLoading = false
        this.snackBar.open('User reassigned successfully', 'X', { duration: 5000, panelClass: ['success'] })
        this.dialogRef.close({ success: true })
      },
      (err: any) => {
        this.isLoading = false
        this.dialogRef.disableClose = false
        this.snackBar.open(err?.error?.params?.errmsg || 'Failed to reassign user', 'X', { duration: 5000, panelClass: ['error'] })
      },
    )
  }

  onCancel(): void {
    this.dialogRef.close()
  }
}
