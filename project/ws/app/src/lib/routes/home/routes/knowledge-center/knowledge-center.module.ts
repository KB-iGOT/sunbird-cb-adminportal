import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'

// Angular Material Modules
import { MatTableModule } from '@angular/material/table'
import { MatIconModule } from '@angular/material/icon'
import { MatMenuModule } from '@angular/material/menu'
import { MatButtonModule } from '@angular/material/button'
import { MatSortModule } from '@angular/material/sort'
import { MatPaginatorModule } from '@angular/material/paginator'

// Sunbird CB Modules
import { PaginationModule } from '@sunbird-cb/consumption'

// Routing
import { KnowledgeCenterRoutingModule } from './knowledge-center-routing.module'

// Components
import { DeveloperDocCreationComponent } from './components/developer-doc-creation/developer-doc-creation.component'
import { KnowledgeCenterListComponent } from './components/knowledge-center-list/knowledge-center-list.component'

@NgModule({
  declarations: [
    DeveloperDocCreationComponent,
    KnowledgeCenterListComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    KnowledgeCenterRoutingModule,
    MatTableModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatSortModule,
    MatPaginatorModule,
    PaginationModule,
  ],
})
export class KnowledgeCenterModule { }
