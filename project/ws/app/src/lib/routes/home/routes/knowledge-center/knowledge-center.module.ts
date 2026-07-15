import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { HttpClientModule } from '@angular/common/http'
import { CKEditorModule } from '@ckeditor/ckeditor5-angular'

// Angular Material Modules
import { MatTableModule } from '@angular/material/table'
import { MatIconModule } from '@angular/material/icon'
import { MatMenuModule } from '@angular/material/menu'
import { MatButtonModule } from '@angular/material/button'
import { MatSortModule } from '@angular/material/sort'
import { MatPaginatorModule } from '@angular/material/paginator'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatTooltipModule } from '@angular/material/tooltip'
import { MatCardModule } from '@angular/material/card'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatDialogModule } from '@angular/material/dialog'

// Sunbird CB Modules
import { DialogComponentsModule, PaginationModule } from '@sunbird-cb/consumption'

// Routing
import { KnowledgeCenterRoutingModule } from './knowledge-center-routing.module'

// Components
import { DeveloperDocCreationComponent } from './components/developer-doc-creation/developer-doc-creation.component'
import { KnowledgeCenterListComponent } from './components/knowledge-center-list/knowledge-center-list.component'
import { PlainCkeditorComponent } from './components/plain-ckeditor/plain-ckeditor.component'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { BreadcrumbsOrgModule } from '@sunbird-cb/collection'
import { LoaderService } from '../../services/loader.service'

@NgModule({
  declarations: [
    DeveloperDocCreationComponent,
    KnowledgeCenterListComponent,
    PlainCkeditorComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    KnowledgeCenterRoutingModule,
    BreadcrumbsOrgModule,
    CKEditorModule,
    MatTableModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatCardModule,
    MatExpansionModule,
    MatDialogModule,
    PaginationModule,
    MatSnackBarModule,
    DialogComponentsModule,
  ],
  providers: [LoaderService],
})
export class KnowledgeCenterModule { }
