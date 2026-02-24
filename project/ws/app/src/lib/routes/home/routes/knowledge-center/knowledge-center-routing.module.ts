import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { KnowledgeCenterListComponent } from './components/knowledge-center-list/knowledge-center-list.component'

const routes: Routes = [
  {
    path: '',
    component: KnowledgeCenterListComponent,
    data: {
      pageId: 'home/knowledge-centre/list',
      module: 'KnowledgeCenter',
      pageType: 'feature',
      pageKey: 'KnowledgeCenterList',
    }
  },
  // Add more child routes here as needed
  // {
  //   path: 'view/:id',
  //   component: KnowledgeCenterDetailComponent,
  //   data: {
  //     pageId: 'home/knowledge-centre/view',
  //     module: 'KnowledgeCenter',
  //     pageType: 'feature',
  //     pageKey: 'KnowledgeCenterDetail',
  //   }
  // },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class KnowledgeCenterRoutingModule { }
