import { Component, Inject } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Clipboard } from '@angular/cdk/clipboard'
import { UsersService } from '../../../users.service'
import { IUserProfile } from '../../../models/users.models'

@Component({
  standalone: false,
  selector: 'ws-password-reset-dialog',
  templateUrl: './password-reset-dialog.component.html',
  styleUrls: ['./password-reset-dialog.component.scss'],
})
export class PasswordResetDialogComponent {
  user: IUserProfile
  isLoading = false
  resetLink = ''
  isCopied = false
  notificationMethod = 'email'

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { user: IUserProfile },
    private dialogRef: MatDialogRef<PasswordResetDialogComponent>,
    private usersService: UsersService,
    private snackBar: MatSnackBar,
    private clipboard: Clipboard,
  ) {
    this.user = data.user
  }

  get userEmail(): string {
    return this.user.profileDetails?.personalDetails?.primaryEmail || this.user.email || ''
  }

  get userName(): string {
    return this.user.profileDetails?.personalDetails?.firstname || this.user.firstName || ''
  }

  onConfirm(): void {
    this.isLoading = true
    this.dialogRef.disableClose = true

    const payload = {
      request: {
        userId: this.user.userId,
        type: 'email',
        key: this.userEmail,
      },
    }

    this.usersService.resetPassword(payload).subscribe(
      (res: any) => {
        this.isLoading = false
        this.resetLink = res?.result?.link || res?.result?.resetLink || ''
        if (this.resetLink) {
          this.snackBar.open('Password reset link generated', 'X', { duration: 5000, panelClass: ['success'] })
        } else {
          this.snackBar.open('Password reset successful', 'X', { duration: 5000, panelClass: ['success'] })
        }
      },
      (err: any) => {
        this.isLoading = false
        this.dialogRef.disableClose = false
        this.snackBar.open(err?.error?.params?.errmsg || 'Failed to reset password', 'X', { duration: 5000, panelClass: ['error'] })
      },
    )
  }

  copyLink(): void {
    if (this.resetLink) {
      this.clipboard.copy(this.resetLink)
      this.isCopied = true
      this.snackBar.open('Link copied to clipboard', 'X', { duration: 3000 })
      setTimeout(() => { this.isCopied = false }, 2000)
    }
  }

  onClose(): void {
    this.dialogRef.close()
  }
}
