import { Component, Input } from '@angular/core'
import { BackBreadcrumb } from '../../../../../../../../../src/app/models/tnc.model'
import { Router } from '@angular/router'

@Component({
    selector: 'ws-app-back-breadcrumbs',
    templateUrl: './back-breadcrumbs.component.html',
    styleUrls: ['./back-breadcrumbs.component.scss'],
    standalone: false,
})
export class BackBreadcrumbsComponent {
  @Input() data: BackBreadcrumb[] = []

  constructor(private router: Router) { }

  navigate(crumb: BackBreadcrumb): void {
    if (crumb.route) {
      this.router.navigate([crumb.route])
    }
  }
}
