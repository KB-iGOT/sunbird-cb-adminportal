import { Component, inject } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'

@Component({
    selector: 'ws-app-loading-popup',
    templateUrl: './loading-popup.component.html',
    styleUrls: ['./loading-popup.component.scss'],
    standalone: false,
})
export class LoadingPopupComponent {
  public data = inject(MAT_DIALOG_DATA)
  constructor(
    private dialogRef: MatDialogRef<LoadingPopupComponent>,
  ) { }

  closePopup(event: any) {
    this.dialogRef.close(event)
  }
}
