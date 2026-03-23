import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ReactiveFormsModule, FormsModule } from '@angular/forms'

// Material Modules
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatChipsModule } from '@angular/material/chips'
import { MatDialogModule } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatMenuModule } from '@angular/material/menu'
import { MatPaginatorModule } from '@angular/material/paginator'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatSelectModule } from '@angular/material/select'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { MatTableModule } from '@angular/material/table'
import { MatTabsModule } from '@angular/material/tabs'
import { MatTooltipModule } from '@angular/material/tooltip'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatListModule } from '@angular/material/list'
import { ClipboardModule } from '@angular/cdk/clipboard'

// Routing
import { UsersRoutingModule } from './users-routing.module'

// Shared components
import { OrganizationSelectorComponent } from './shared/organization-selector/organization-selector.component'
import { DesignationSelectorComponent } from './shared/designation-selector/designation-selector.component'
import { HelpDialogComponent } from './shared/help-dialog/help-dialog.component'

// List User page
import { ListUserComponent } from './list-user/list-user.component'
import { SearchPanelComponent } from './list-user/search-panel/search-panel.component'
import { UsersTableComponent } from './list-user/users-table/users-table.component'
import { UserActionsMenuComponent } from './list-user/user-actions-menu/user-actions-menu.component'

// Dialogs
import { CreateUserDialogComponent } from './list-user/dialogs/create-user-dialog/create-user-dialog.component'
import { EditUserDetailsDialogComponent } from './list-user/dialogs/edit-user-details-dialog/edit-user-details-dialog.component'
import { EditPrimaryDetailsDialogComponent } from './list-user/dialogs/edit-primary-details-dialog/edit-primary-details-dialog.component'
import { RoleAssignmentDialogComponent } from './list-user/dialogs/role-assignment-dialog/role-assignment-dialog.component'
import { PasswordResetDialogComponent } from './list-user/dialogs/password-reset-dialog/password-reset-dialog.component'
import { UserMigrationDialogComponent } from './list-user/dialogs/user-migration-dialog/user-migration-dialog.component'
import { UserStatusUpdateDialogComponent } from './list-user/dialogs/user-status-update-dialog/user-status-update-dialog.component'



@NgModule({
  declarations: [
    // Shared
    OrganizationSelectorComponent,
    DesignationSelectorComponent,
    HelpDialogComponent,

    // List User
    ListUserComponent,
    SearchPanelComponent,
    UsersTableComponent,
    UserActionsMenuComponent,

    // Dialogs
    CreateUserDialogComponent,
    EditUserDetailsDialogComponent,
    EditPrimaryDetailsDialogComponent,
    RoleAssignmentDialogComponent,
    PasswordResetDialogComponent,
    UserMigrationDialogComponent,
    UserStatusUpdateDialogComponent,


  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    UsersRoutingModule,

    // Material
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatTableModule,
    MatTabsModule,
    MatTooltipModule,
    MatAutocompleteModule,
    MatListModule,
    ClipboardModule,
  ],
})
export class UsersModule { }
