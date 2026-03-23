import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { UsersService } from '../../../users.service'
import { IUserProfile } from '../../../models/users.models'

@Component({
  standalone: false,
  selector: 'ws-role-assignment-dialog',
  templateUrl: './role-assignment-dialog.component.html',
  styleUrls: ['./role-assignment-dialog.component.scss'],
})
export class RoleAssignmentDialogComponent implements OnInit {
  user: IUserProfile
  availableRoles: string[] = []
  selectedRoles: string[] = []
  initialRoles: string[] = []
  isLoading = false
  isFetchingRoles = true
  mdoLeaderWarning = ''

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { user: IUserProfile },
    private dialogRef: MatDialogRef<RoleAssignmentDialogComponent>,
    private usersService: UsersService,
    private configSvc: ConfigurationsService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {
    this.user = data.user
  }

  ngOnInit(): void {
    this.initializeRoles()
    this.loadAvailableRoles()
  }

  private initializeRoles(): void {
    // Use the target user's own organisation roles, not the admin's
    const userOrg = this.user.organisations?.[0]
    if (userOrg?.roles?.length) {
      this.selectedRoles = [...userOrg.roles]
    } else if (this.user.roles?.length) {
      this.selectedRoles = [...this.user.roles]
    } else {
      this.selectedRoles = ['PUBLIC']
    }
    this.initialRoles = [...this.selectedRoles]
  }

  loadAvailableRoles(): void {
    this.usersService.fetchIgotRoles().subscribe(
      (roles: string[]) => {
        this.availableRoles = roles
        this.isFetchingRoles = false
        this.cdr.detectChanges()
      },
      () => {
        this.snackBar.open('Failed to load available roles', 'X', { duration: 5000 })
        this.isFetchingRoles = false
        this.cdr.detectChanges()
      },
    )
  }

  toggleRole(role: string): void {
    const idx = this.selectedRoles.indexOf(role)
    if (idx > -1) {
      this.selectedRoles.splice(idx, 1)
    } else {
      this.selectedRoles.push(role)
    }

    // MDO_LEADER warning logic
    if (role === 'MDO_LEADER') {
      this.checkMdoLeaderConflict()
    } else {
      if (!this.selectedRoles.includes('MDO_LEADER')) {
        this.mdoLeaderWarning = ''
      }
    }
  }

  isRoleSelected(role: string): boolean {
    return this.selectedRoles.includes(role)
  }

  private checkMdoLeaderConflict(): void {
    const isMdoLeaderSelected = this.selectedRoles.includes('MDO_LEADER')
    const wasMdoLeaderInitially = this.initialRoles.includes('MDO_LEADER')

    if (isMdoLeaderSelected && !wasMdoLeaderInitially) {
      const rootOrgId = this.user.rootOrgId || (this.configSvc.userProfile as any)?.rootOrgId || ''
      const payload = {
        request: {
          fields: [],
          facets: [],
          limit: 1,
          filters: {
            status: 1,
            rootOrgId,
            'organisations.roles': ['MDO_LEADER'],
          },
          offset: 0,
        },
      }

      this.usersService.getUsers(payload).subscribe(
        (res: any) => {
          const count = res?.result?.response?.count || 0
          if (count > 0) {
            this.mdoLeaderWarning = `Another user already holds the MDO_LEADER role in this organization. Assigning it here may cause conflicts.`
          }
        },
      )
    } else {
      this.mdoLeaderWarning = ''
    }
  }

  onSave(): void {
    if (this.selectedRoles.length === 0) {
      this.snackBar.open('At least one role must be selected', 'X', { duration: 5000 })
      return
    }

    this.isLoading = true
    this.dialogRef.disableClose = true

    // Use the target user's own org ID
    const orgId = this.user.rootOrgId ||
      this.user.organisations?.[0]?.organisationId ||
      (this.configSvc.userProfile as any)?.rootOrgId || ''

    const payload = {
      request: {
        userId: this.user.userId,
        organisationId: orgId,
        roles: this.selectedRoles,
      },
    }

    this.usersService.modifyUserRoles(payload).subscribe(
      () => {
        this.isLoading = false
        this.snackBar.open('User roles updated successfully', 'X', { duration: 5000, panelClass: ['success'] })
        this.dialogRef.close({ success: true })
      },
      (err: any) => {
        this.isLoading = false
        this.dialogRef.disableClose = false
        this.snackBar.open(err?.error?.params?.errmsg || 'Failed to update user roles', 'X', { duration: 5000, panelClass: ['error'] })
      },
    )
  }

  onCancel(): void {
    this.dialogRef.close()
  }
}
