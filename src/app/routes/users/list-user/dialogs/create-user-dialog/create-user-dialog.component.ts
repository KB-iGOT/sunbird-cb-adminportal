import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { MatDialogRef } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { UsersService } from '../../../users.service'
import { IOrganization } from '../../../models/users.models'

@Component({
  standalone: false,
  selector: 'ws-create-user-dialog',
  templateUrl: './create-user-dialog.component.html',
  styleUrls: ['./create-user-dialog.component.scss'],
})
export class CreateUserDialogComponent implements OnInit {
  userForm!: FormGroup
  isLoading = false
  selectedOrg: IOrganization | null = null
  selectedRoles: string[] = ['PUBLIC']
  availableRoles: string[] = []

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateUserDialogComponent>,
    private usersService: UsersService,
    private snackBar: MatSnackBar,
  ) { }

  ngOnInit(): void {
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern(/^[a-zA-Z\s.]+$/)]],
      email: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]],
    })
    this.loadRoles()
  }

  private readonly EXCLUDED_ROLES = new Set([
    'CBC_ADMIN', 'CBC_MEMBER', 'DASHBOARD_ADMIN', 'MDO_DASHBOARD_USER',
    'MDO_REPORT_ACCESSOR', 'PROGRAM_INSTRUCTOR', 'STATE_ADMIN', 'SPV_ADMIN', 'SPV_PUBLISHER', 'WAT_MEMBER',
  ])

  loadRoles(): void {
    this.usersService.fetchIgotRoles().subscribe(
      (roles: string[]) => { this.availableRoles = roles.filter(r => !this.EXCLUDED_ROLES.has(r)) },
      () => { this.snackBar.open('Failed to load roles', 'X', { duration: 5000 }) },
    )
  }

  onOrgSelected(org: IOrganization): void {
    this.selectedOrg = org
  }

  onOrgCleared(): void {
    this.selectedOrg = null
  }

  toggleRole(role: string): void {
    const idx = this.selectedRoles.indexOf(role)
    if (idx > -1) {
      if (role === 'PUBLIC') { return }
      this.selectedRoles.splice(idx, 1)
    } else {
      this.selectedRoles.push(role)
    }
  }

  isRoleSelected(role: string): boolean {
    return this.selectedRoles.includes(role)
  }

  get isFormValid(): boolean {
    return this.userForm.valid && !!this.selectedOrg && this.selectedRoles.length > 0
  }

  onSubmit(): void {
    if (!this.isFormValid || !this.selectedOrg) { return }

    this.isLoading = true
    this.dialogRef.disableClose = true

    const formVal = this.userForm.value
    const createPayload = {
      personalDetails: {
        firstName: formVal.firstName.trim(),
        email: formVal.email.trim().toLowerCase(),
        phone: formVal.phone.trim(),
        channel: this.selectedOrg.channel,
        roles: this.selectedRoles,
      },
    }

    this.usersService.createUser(createPayload).subscribe(
      (createRes: any) => {
        const userId = createRes?.userId || createRes?.result?.userId || createRes?.result?.response?.userId
        if (!userId) {
          this.onError('Failed to create user — no user ID returned')
          return
        }

        const orgId = this.selectedOrg!.identifier || this.selectedOrg!.orgId || ''

        this.usersService.assignUserRoles(userId, orgId, this.selectedRoles).subscribe(
          () => {
            const updatePayload = {
              request: {
                userId,
                phone: formVal.phone.trim(),
                firstName: formVal.firstName.trim(),
                profileDetails: {
                  profileStatus: 'VERIFIED',
                  personalDetails: {
                    firstname: formVal.firstName.trim(),
                    primaryEmail: formVal.email.trim().toLowerCase(),
                    mobile: formVal.phone.trim(),
                    phoneVerified: true,
                  },
                  mandatoryFieldsExists: true,
                },
              },
            }

            this.usersService.extPatchUser(updatePayload).subscribe(
              () => {
                this.isLoading = false
                this.snackBar.open('User created successfully', 'X', { duration: 5000, panelClass: ['success'] })
                this.dialogRef.close({ success: true })
              },
              () => {
                this.snackBar.open('User created but profile update failed', 'X', { duration: 5000, panelClass: ['warning'] })
                this.dialogRef.close({ success: true })
              },
            )
          },
          () => {
            this.snackBar.open('User created but role assignment failed', 'X', { duration: 5000, panelClass: ['warning'] })
            this.dialogRef.close({ success: true })
          },
        )
      },
      (err: any) => {
        this.onError(err?.error?.params?.errmsg || 'Failed to create user')
      },
    )
  }

  private onError(msg: string): void {
    this.isLoading = false
    this.dialogRef.disableClose = false
    this.snackBar.open(msg, 'X', { duration: 5000, panelClass: ['error'] })
  }

  onCancel(): void {
    this.dialogRef.close()
  }
}
