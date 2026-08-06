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
    {
      action: 'Search Users',
      description: [
        'Search users by name, email, phone, or role. When searching by Role, select a role from the dropdown.',
        'Optionally filter by organisation and active/inactive status.',
      ].join(' '),
    },
    { action: 'Create User', description: 'Create a new user account with name, email, phone, roles, and organisation assignment.' },
    {
      action: 'Edit User Details',
      description: [
        'Modify personal details (name, email, phone, external system), professional details (group, designation),',
        'and cadre/civil service information in a single dialog.',
      ].join(' '),
    },
    { action: 'Manage User Roles', description: 'Assign or modify roles for a user within their organisation.' },
    { action: 'Reset Password', description: 'Generate a password reset link for the user. The link is valid for 72 hours.' },
    {
      action: 'Migrate User',
      description: 'Transfer a user to a different organisation with options for force migration and soft delete.',
    },
  ]

  constructor(private dialogRef: MatDialogRef<HelpDialogComponent>) { }

  close(): void {
    this.dialogRef.close()
  }
}
