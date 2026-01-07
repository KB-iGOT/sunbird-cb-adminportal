import { Component, Input, OnInit } from '@angular/core'
import { trigger, state, style, transition, animate } from '@angular/animations'
import { environment } from '../../../../../../../../../../../src/environments/environment'
import * as _ from 'lodash'
import { DemoVideoPopupComponent } from '../../../../components/demo-video-popup/demo-video-popup.component'
import { MatDialog } from '@angular/material/dialog'

@Component({
  selector: 'ws-app-help-center-guide-v2',
  templateUrl: './help-center-guide-v2.component.html',
  styleUrls: ['./help-center-guide-v2.component.scss'],
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({
        height: '0',
        overflow: 'hidden',
        opacity: 0
      })),
      state('expanded', style({
        height: '*',
        opacity: 1
      })),
      transition('collapsed <=> expanded', [
        animate('300ms ease-in-out')
      ])
    ])
  ]
})
export class HelpCenterGuideComponentV2 implements OnInit {

  @Input() helpCenterGuide: any

  showTopSection = false
  playVideo = false
  showDetailToggle = false


  constructor(
    private dialog: MatDialog
  ) { }

  ngOnInit() {
  }

  openVideoPopup() {
    const url = `${environment.karmYogiPath}${_.get(this.helpCenterGuide, 'helpVideoLink')}`
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

  callResizeEvent(_event: any) {
    if (document.querySelector('.flex')) {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'))
      }, 100)
    }
  }

}
