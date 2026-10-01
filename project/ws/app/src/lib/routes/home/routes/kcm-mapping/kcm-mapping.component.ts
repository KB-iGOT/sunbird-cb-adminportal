import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core'
import { environment } from '../../../../../../../../../src/environments/environment'
import { ActivatedRoute } from '@angular/router'
import { MatDialog } from '@angular/material/dialog'
import { DemoVideoPopupComponent } from '../../components/demo-video-popup/demo-video-popup.component'
import * as _ from 'lodash'

@Component({
    selector: 'ws-app-kcm-mapping',
    templateUrl: './kcm-mapping.component.html',
    styleUrls: ['./kcm-mapping.component.scss'],
    standalone: false,
})
export class KCMMappingComponent implements OnInit, AfterViewInit {
  @ViewChild('kcmTaxonomyView') kcmTaxonomyView?: ElementRef<HTMLElement>
  environmentVal: any
  taxonomyConfig: any
  taxonomyViewHeight = 500
  showTopSection = false
  kcmConfig: any
  videoLink = ''
  constructor(
    private activateRoute: ActivatedRoute,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.environmentVal = environment
    this.environmentVal.frameworkName = environment.KCMframeworkName
    // this.environmentVal.url = `https://localhost:3000`
    this.activateRoute.data.subscribe(data => {
      this.kcmConfig = data.pageData.data
      this.kcmConfig.defaultKCMConfig[0].frameworkId = environment.KCMframeworkName
      this.taxonomyConfig = [...this.kcmConfig.defaultKCMConfig, ...this.kcmConfig.frameworkConfig]
      this.videoLink = _.get(this.kcmConfig, 'topsection.guideVideo.url')
    })
  }

  ngAfterViewInit() {
    this.onWindowResize()
  }

  @HostListener('window:resize')
  onWindowResize() {
    requestAnimationFrame(() => {
      const taxonomyRect = this.kcmTaxonomyView?.nativeElement.getBoundingClientRect()

      if (!taxonomyRect) {
        return
      }

      const footerHeight = document.querySelector<HTMLElement>('ws-app-footer')?.getBoundingClientRect().height ?? 0
      this.taxonomyViewHeight = Math.max(0, Math.floor(window.innerHeight - taxonomyRect.top - footerHeight))
    })
  }

  callResizeEvent(_event: any) {
    setTimeout(() => window.dispatchEvent(new Event('resize')), 100)
  }

  openVideoPopup() {
    const url = `${environment.karmYogiPath}${this.videoLink}`
    this.dialog.open(DemoVideoPopupComponent, {
      data: {
        videoLink: url,
      },
      disableClose: true,
      width: '50%',
      height: '60%',
      panelClass: 'overflow-visable',
    })
  }

}
