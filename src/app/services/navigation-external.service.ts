import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { BehaviorSubject, fromEvent } from 'rxjs'
import { NAVIGATION_DATA_INCOMING } from '../models/mobile-events.model'
import { BackBreadcrumb } from '../models/tnc.model'

@Injectable({
  providedIn: 'root',
})
export class NavigationExternalService {
  breadcrumnItems: BehaviorSubject<BackBreadcrumb[]> = new BehaviorSubject<BackBreadcrumb[]>([])

  dummy = 1
  constructor(private router: Router) {
    fromEvent(document, NAVIGATION_DATA_INCOMING).subscribe((event: CustomEventInit) => {
      this.navigateTo(event.detail.url, event.detail.params)
    })
  }
  init() {
    this.dummy += 1
  }
  navigateTo(url: string, params?: any) {
    const newParams = params || {}
    newParams.ref = encodeURIComponent(newParams.ref || this.router.url.replace(/ref=[^&]*&?/, '').replace(/\?$/, ''))
    this.router.navigate([url], { queryParams: newParams })
  }
}
