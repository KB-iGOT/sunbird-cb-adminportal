import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule, Routes } from '@angular/router'
import { DesignationsComponent } from './components/designations/designations.component'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatPaginatorModule } from '@angular/material/paginator'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatSelectModule } from '@angular/material/select'
import { MatTableModule } from '@angular/material/table'
import { UIORGTableModule } from '@sunbird-cb/collection'
import { PageResolve, PipeOrderByModule } from '@sunbird-cb/utils-v2'
import { BulkUploadComponent } from './components/bulk-upload/bulk-upload.component'
import { MatTooltipModule } from '@angular/material/tooltip'
import { ConfigResolveService } from '../../../home/resolvers/config-resolver.service'
import { ImportDesignationComponent } from './components/import-designation/import-designation.component'
import { FileService } from './services/upload.service'
import { OtpService } from './services/otp.service'
import { VerifyOtpComponent } from '../../../home/components/verify-otp/verify-otp.component'
import { MatRadioModule } from '@angular/material/radio'
const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: DesignationsComponent,
    data: {
      pageId: '',
      module: '',
      pageType: 'feature',
      pageKey: 'my_designations',
    },
    resolve: {
      configService: ConfigResolveService,
      pageData: PageResolve,
    },
  },
  {
    path: 'import-designation',
    pathMatch: 'full',
    data: {
      pageId: '',
      module: '',
      pageType: 'feature',
      pageKey: 'my_designations',
    },
    component: ImportDesignationComponent,
    resolve: {
      configService: ConfigResolveService,
      pageData: PageResolve,
    },
  },
  // {
  //   path: 'bulk-upload',
  //   pathMatch: 'full',
  //   data: {
  //     pageId: 'home/odcs-mapping',
  //     module: 'odcs-mapping',
  //     pageType: 'feature',
  //     pageKey: 'my_designations',
  //   },
  //   component: BulkUploadComponent,
  //   resolve: {
  //     configService: ConfigResolveService,
  //     pageData: PageResolve,
  //   },
  // },
]

@NgModule({
  declarations: [
    DesignationsComponent,
    ImportDesignationComponent,
    BulkUploadComponent,
    VerifyOtpComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    MatIconModule,
    MatCardModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    UIORGTableModule,
    MatPaginatorModule,
    MatDialogModule,
    PipeOrderByModule,
    MatTooltipModule,
    MatRadioModule,
  ],

  exports: [
    RouterModule,
    DesignationsComponent,
    ImportDesignationComponent,
    BulkUploadComponent,
  ],
  providers: [
    FileService,
    OtpService,
  ],
})
export class DesignationModule { }
