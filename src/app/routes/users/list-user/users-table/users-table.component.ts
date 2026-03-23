import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core'
import { MatPaginator, PageEvent } from '@angular/material/paginator'
import { MatTableDataSource } from '@angular/material/table'
import { IUserProfile } from '../../models/users.models'
import { UserAction } from '../user-actions-menu/user-actions-menu.component'

@Component({
  standalone: false,
  selector: 'ws-users-table',
  templateUrl: './users-table.component.html',
  styleUrls: ['./users-table.component.scss'],
})
export class UsersTableComponent {
  @Input() set users(value: IUserProfile[]) {
    this.dataSource.data = value || []
  }
  @Input() totalCount = 0
  @Input() pageSize = 10
  @Input() pageIndex = 0
  @Input() loading = false

  @Output() pageChange = new EventEmitter<PageEvent>()
  @Output() actionSelected = new EventEmitter<{ action: UserAction; user: IUserProfile }>()

  @ViewChild(MatPaginator) paginator!: MatPaginator

  displayedColumns = ['name', 'email', 'phone', 'organization', 'status', 'roles', 'actions']
  dataSource = new MatTableDataSource<IUserProfile>([])
  pageSizeOptions = [10, 25, 50]

  getUserName(user: IUserProfile): string {
    return user.profileDetails?.personalDetails?.firstname || user.firstName || 'N/A'
  }

  getUserEmail(user: IUserProfile): string {
    return user.profileDetails?.personalDetails?.primaryEmail || user.email || 'N/A'
  }

  getUserPhone(user: IUserProfile): string {
    return user.profileDetails?.personalDetails?.mobile || user.phone || 'N/A'
  }

  getUserRoles(user: IUserProfile): string[] {
    if (user.organisations?.length) {
      const allRoles: string[] = []
      user.organisations.forEach(org => {
        if (org.roles) {
          allRoles.push(...org.roles)
        }
      })
      return [...new Set(allRoles)]
    }
    return user.roles || []
  }

  getStatusLabel(user: IUserProfile): string {
    if (user.status === 1) { return 'Active' }
    if (user.status === 0) { return 'Inactive' }
    return 'Unknown'
  }

  getStatusClass(user: IUserProfile): string {
    if (user.status === 1) { return 'active' }
    if (user.status === 0) { return 'inactive' }
    return 'unknown'
  }

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event)
  }

  onUserAction(event: { action: UserAction; user: IUserProfile }): void {
    this.actionSelected.emit(event)
  }
}
