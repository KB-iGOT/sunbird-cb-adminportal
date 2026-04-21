import { Component, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute, Router } from '@angular/router'
import { RequestServiceService } from '../request-service.service'
import { ConfirmationPopupComponent } from '../confirmation-popup/confirmation-popup.component'

@Component({
    selector: 'ws-app-request-copy-details-v2',
    templateUrl: './request-copy-details-v2.component.html',
    styleUrls: ['./request-copy-details-v2.component.scss'],
    standalone: false
})
export class RequestCopyDetailsV2Component implements OnInit {

  isHideData = false
  currentUser: any
  dialogRefs: any
  demandId: any
  actionBtnName: any
  resData: any

  constructor(
    private activatedRouter: ActivatedRoute,
    private snackBar: MatSnackBar,
    private router: Router,
    public dialog: MatDialog,
    private requestService: RequestServiceService,
  ) {
    this.currentUser = sessionStorage.getItem('idDetails') ? sessionStorage.getItem('idDetails') : ''
  }

  ngOnInit(): void {
    this.activatedRouter.queryParams.subscribe((params: any) => {
      if (params['id']) {
        this.demandId = params.id
        this.actionBtnName = params.name
      }
    })
  }

  submit(request: any) {
    this.showDialogBox('progress')
    this.requestService.createDemand(request).subscribe(res => {
      this.resData = res
      this.dialogRefs.close()
      this.showDialogBox('progress-completed')

      setTimeout(() => {
        this.dialogRefs.close()
        if (this.resData) {
          this.router.navigateByUrl('/app/home/all-request')
          this.snackBar.open('Request submitted successfully ')
        }
      }, 1000)
    },
      (error: any) => {
        this.dialogRefs.close({ error })
        this.snackBar.open('Request Failed')

      }
    )
  }

  showDialogBox(event: any) {
    const dialogData: any = {}
    switch (event) {
      case 'progress':
        dialogData['type'] = 'progress'
        dialogData['icon'] = 'vega'
        dialogData['title'] = 'Processing your request'
        dialogData['subTitle'] = `Wait a second , your request is processing………`
        break
      case 'progress-completed':
        dialogData['type'] = 'progress-completed'
        dialogData['icon'] = 'accept_icon'
        dialogData['title'] = 'Processing your request'
        dialogData['subTitle'] = `Wait a second , your request is processing………`
        dialogData['primaryAction'] = 'Successfully created....'
        break
    }

    this.openDialoagBox(dialogData)
  }

  openDialoagBox(dialogData: any) {
    this.dialogRefs = this.dialog.open(ConfirmationPopupComponent, {
      disableClose: true,
      data: {
        type: dialogData.type,
        icon: dialogData.icon,
        title: dialogData.title,
        subTitle: dialogData.subTitle,
        primaryAction: dialogData.primaryAction,
        secondaryAction: dialogData.secondaryAction,
      },
      autoFocus: false,
    })

    this.dialogRefs.afterClosed().subscribe(() => {
    })
  }


  navigateBack() {
    this.router.navigateByUrl('/app/home/all-request')
  }

}
