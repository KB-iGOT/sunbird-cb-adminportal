import { NgModule } from '@angular/core'
import { CommonModule, DatePipe } from '@angular/common'
import { CreateMDORoutingModule } from './create-mdo-routing.module'
import { HomeComponent } from './routes/home/home.component'
import { BtnPageBackModuleAdmin, LeftMenuModule, GroupCheckboxModule, ScrollspyLeftMenuModule } from '@sunbird-cb/collection'
import { HomeModule } from '../home/home.module'
import { RouterModule } from '@angular/router'
import { UsersComponent } from './routes/users/users.component'
import { UsersService } from './services/users.service'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatChipsModule } from '@angular/material/chips'
import { MatOptionModule } from '@angular/material/core'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MatDialogModule } from '@angular/material/dialog'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatListModule } from '@angular/material/list'
import { MatPaginatorModule } from '@angular/material/paginator'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatRadioModule } from '@angular/material/radio'
import { MatSelectModule } from '@angular/material/select'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { MatCardModule } from '@angular/material/card'
import { RolesAccessComponent } from '../access/routes/roles-access/roles-access.component'
import { SbUiResolverModule } from '@sunbird-cb/resolver-v2'
import { UIAdminTableModule } from '../../head/ui-admin-table/ui-admin-table.module'
import { MentorManageComponent } from './mentor-manage/mentor-manage.component'
import { SearchComponent } from './search/search.component'
import { UserCardComponent } from './user-cards/user-card.component'
import { AvatarPhotoModule } from './avatar-photo/avatar-photo.module'
import { PipeOrderByModule } from '../home/pipes/pipe-order-by/pipe-order-by.module'
import { LoaderService } from '../home/services/loader.service'
import { GradeSettingComponent } from './routes/grade-setting/grade-setting.component'
import { DesignationModule } from './routes/designation/designation.module'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { UserBulkTransferComponent } from '../home/routes/user-bulk-transfer/user-bulk-transfer.component'

@NgModule({
  declarations: [
    HomeComponent, UsersComponent, RolesAccessComponent, MentorManageComponent, SearchComponent, UserCardComponent,
    GradeSettingComponent, UserBulkTransferComponent,
  ],
  imports: [CommonModule, CreateMDORoutingModule, BtnPageBackModuleAdmin, LeftMenuModule, SbUiResolverModule,
    MatSidenavModule, MatIconModule, MatProgressSpinnerModule, GroupCheckboxModule, HomeModule, RouterModule,
    UIAdminTableModule, MatCardModule, ScrollspyLeftMenuModule, FormsModule, MatSelectModule, MatChipsModule,
    MatDatepickerModule, MatAutocompleteModule, MatExpansionModule, MatSlideToggleModule, MatOptionModule,
    MatFormFieldModule, MatPaginatorModule, MatListModule, MatRadioModule, MatDialogModule, ReactiveFormsModule,
    PipeOrderByModule, AvatarPhotoModule, DesignationModule, MatSnackBarModule, MatCheckboxModule],
  exports: [
    UsersComponent, RolesAccessComponent, MentorManageComponent, SearchComponent, UserCardComponent, AvatarPhotoModule,
    DesignationModule,
  ],
  providers: [UsersService, LoaderService, DatePipe],
})
export class CreateMDOModule { }
