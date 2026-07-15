import { Injectable } from '@angular/core'
import { MatIconRegistry } from '@angular/material/icon'
import { DomSanitizer } from '@angular/platform-browser'
import { Subject } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class GlobalEventsService {

  private loaderSubject = new Subject<boolean>()
  loaderState$ = this.loaderSubject.asObservable()

  constructor(
    private iconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
  ) {
    this.registerIcons()
  }

  private registerIcons(): void {
    this.iconRegistry.addSvgIcon(
      'frac',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/Frac.svg')
    )

    this.iconRegistry.addSvgIcon(
      'users',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/users.svg')
    )

    this.iconRegistry.addSvgIcon(
      'frac-no-connection',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/Frac_NoConnection.svg')
    )

    this.iconRegistry.addSvgIcon(
      'download-icon',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/download_icon.svg')
    )
  }

  setLoaderState(isLoading: boolean) {
    this.loaderSubject.next(isLoading)
  }
}
