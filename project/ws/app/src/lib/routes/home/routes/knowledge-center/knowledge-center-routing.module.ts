import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { KnowledgeCenterListComponent } from './components/knowledge-center-list/knowledge-center-list.component'
import { DeveloperDocCreationComponent } from './components/developer-doc-creation/developer-doc-creation.component'

const routes: Routes = [
  {
    path: '',
    component: KnowledgeCenterListComponent,
    data: {
      pageId: 'home/knowledge-centre/list',
      module: 'KnowledgeCenter',
      pageType: 'feature',
      pageKey: 'KnowledgeCenterList',
    },
  },
  {
    path: 'developer-doc',
    component: DeveloperDocCreationComponent,
    data: {
      // pageId: 'home/knowledge-centre/developer-doc',
      // module: 'KnowledgeCenter',
      // pageType: 'feature',
      // pageKey: 'DeveloperDocCreation',
      load: ['ckeditor'],
    },
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class KnowledgeCenterRoutingModule { }
