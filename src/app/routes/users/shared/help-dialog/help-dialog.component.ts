import { Component } from '@angular/core'
import { MatDialogRef } from '@angular/material/dialog'

@Component({
  standalone: false,
  selector: 'ws-help-dialog',
  templateUrl: './help-dialog.component.html',
  styleUrls: ['./help-dialog.component.scss'],
})
export class HelpDialogComponent {

  helpItems = [
    { action: 'Search Users', description: 'Search users by name, email, phone, masked email, masked phone, user ID, or roles. Filter by active/inactive status.' },
    { action: 'Create User', description: 'Create a new user account with name, email, phone, roles, and organization assignment.' },
    { action: 'Edit User Details', description: 'Modify user profile fields such as name, email, phone, external system ID, and external system.' },
    { action: 'Edit Primary Details', description: 'Update the user\'s group and designation. May be restricted by pending workflow requests.' },
    { action: 'Manage User Roles', description: 'Assign or modify roles for a user within their organization.' },
    { action: 'Reset Password', description: 'Generate a password reset link for the user. The link is valid for 72 hours.' },
    { action: 'Migrate User', description: 'Transfer a user to a different organization with options for force migration and soft delete.' },
    { action: 'Reassign User', description: 'Reassign users with profile status "NOT-MY-USER" to the correct organization.' },
    { action: 'View Full Details', description: 'Navigate to the full user detail page with all profile information and management options.' },
  ]

  constructor(private dialogRef: MatDialogRef<HelpDialogComponent>) { }

  close(): void {
    this.dialogRef.close()
  }
}
