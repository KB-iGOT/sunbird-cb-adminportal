import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { UIAdminUserTableComponent } from './user-list/ui-admin-user-table.component'
import { UIUserTablePopUpComponent } from './user-list-popup/ui-user-table-pop-up.component'
import { UIDirectoryTableComponent } from './directory-list/directory-table.component'
import { UIDiscussionPostComponent } from './discussion-list/discussion-post.component'
import { DialogTextProfanityComponent } from './discussion-list/discussion-post-popup.component'
import { MatTableModule } from '@angular/material/table'
import { MatTooltipModule } from '@angular/material/tooltip'
import { MatSortModule } from '@angular/material/sort'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatOptionModule } from '@angular/material/core'
import { MatDialogModule } from '@angular/material/dialog'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { MatIconModule } from '@angular/material/icon'
import { AppButtonModule } from '../app-button/app-button.module'
import { MatMenuModule } from '@angular/material/menu'
import { DefaultThumbnailModule, PipeCountTransformModule, PipeDurationTransformModule, PipeHtmlTagRemovalModule, PipeOrderByModule, PipePartialContentModule } from '@sunbird-cb/utils-v2'
import { BtnChannelAnalyticsModule } from '../btn-channel-analytics/btn-channel-analytics.module'
import { BtnContentFeedbackV2Module } from '../btn-content-feedback-v2/btn-content-feedback-v2.module'
// import { BtnContentLikeModule } from '../btn-content-like/btn-content-like.module'
// import { BtnContentMailMeModule } from '../btn-content-mail-me/btn-content-mail-me.module'
import { MatPaginatorModule } from '@angular/material/paginator'
import { UserPopupComponent } from './user-popup/user-popup'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatRadioModule } from '@angular/material/radio'
import { MatChipsModule } from '@angular/material/chips'
import { ImageCropperModule } from 'ngx-image-cropper'
import { ReverseDateFormatPipe } from './user-list/reverse-date-format.pipe'
import { CreateOrganisationComponent } from './create-organisation/create-organisation.component'
import { MatSidenavModule } from '@angular/material/sidenav'
import { InfoModalModule } from '../info-modal/info-modal.module'
import { CustomSelfRegistrationComponent } from './custom-self-registration/custom-self-registration.component'
// import { BtnPageBackModule } from '../btn-page-back/btn-page-back.module'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { ClipboardModule } from '@angular/cdk/clipboard'
import { LoaderService } from '../../routes/home/services/loader.service'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MAT_DATE_LOCALE } from '@angular/material/core'
import { OrgHierarchyMappingComponent } from './org-hierarchy-mapping/org-hierarchy-mapping/org-hierarchy-mapping.component'
import { TreeHierarchyModule } from '@sunbird-cb/tree-hierarchy'
import { OrgHierarchyService } from './services/org-hierarchy.service'
import { BulkUploadOrgComponent } from './bulk-upload-org/bulk-upload-org.component'
import { MatProgressBarModule } from '@angular/material/progress-bar'
@NgModule({
  declarations: [
    UIAdminUserTableComponent,
    UIDirectoryTableComponent,
    UserPopupComponent,
    UIUserTablePopUpComponent,
    UIDiscussionPostComponent,
    DialogTextProfanityComponent,
    ReverseDateFormatPipe,
    CreateOrganisationComponent,
    CustomSelfRegistrationComponent,
    OrgHierarchyMappingComponent,
    BulkUploadOrgComponent,
  ],
  imports: [
    AppButtonModule,
    CommonModule,
    MatTableModule,
    MatTooltipModule,
    MatSortModule,
    MatCardModule,
    MatIconModule,
    MatMenuModule,
    DefaultThumbnailModule, PipeCountTransformModule,
    PipeDurationTransformModule, PipeHtmlTagRemovalModule,
    PipePartialContentModule,
    BtnChannelAnalyticsModule,
    BtnContentFeedbackV2Module,
    MatPaginatorModule,
    MatDialogModule, MatButtonModule,
    MatCheckboxModule,
    FormsModule,
    MatRadioModule,
    MatInputModule, MatOptionModule, MatSelectModule, ReactiveFormsModule,
    MatChipsModule,
    ImageCropperModule,
    MatSidenavModule,
    InfoModalModule,
    MatDatepickerModule,
    MatSnackBarModule,
    MatProgressBarModule,
    ClipboardModule,
    MatAutocompleteModule,
    // MatRadioButton, MatRadioGroup
    TreeHierarchyModule,
    PipeOrderByModule
  ],
  exports: [
    UIAdminUserTableComponent,
    UIDirectoryTableComponent,
    UIUserTablePopUpComponent,
    UIDiscussionPostComponent,
    ReverseDateFormatPipe,
    OrgHierarchyMappingComponent
  ],
  providers: [
    LoaderService,
    OrgHierarchyService,
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' }]
})
export class UIAdminTableModule { }
