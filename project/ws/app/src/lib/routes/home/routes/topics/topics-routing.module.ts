
import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'
import { ConfigResolveService } from '../../resolvers/config-resolver.service'
import { TopicsListComponent } from './topics-list/topics-list.component'

const routes: Routes = [
  {
    path: '',
    component: TopicsListComponent,
    resolve: {
      configService: ConfigResolveService,
    },
    data: {
      pageId: '',
      module: '',
      pageType: 'feature',
      pageKey: 'directory',
    },
  },
]
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [
  ],
})
export class TopicsRoutingModule { }
