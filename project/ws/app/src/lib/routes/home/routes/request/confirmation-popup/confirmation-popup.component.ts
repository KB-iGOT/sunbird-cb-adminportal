import { Component, Inject, OnInit } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'

@Component({
    selector: 'ws-app-confirmation-popup',
    templateUrl: './confirmation-popup.component.html',
    styleUrls: ['./confirmation-popup.component.scss'],
    standalone: false
})
export class ConfirmationPopupComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<ConfirmationPopupComponent>
  ) { }

  ngOnInit() {
  }

  closeModal() {
    this.dialogRef.close()
  }

  performAction(data: any) {
    if (data && data.type === 'conformation') {
      this.dialogRef.close('confirmed')
    } else {
      this.dialogRef.close()
      // this.tpdsSvc.trainingPlanCategoryChangeEvent.next(data)
    }
  }

}
