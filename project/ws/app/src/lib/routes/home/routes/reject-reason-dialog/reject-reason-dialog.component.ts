import { Component, OnInit } from '@angular/core'
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms'
import { MatDialogRef } from '@angular/material/dialog'

@Component({
    selector: 'ws-app-reject-reason-dialog',
    templateUrl: './reject-reason-dialog.component.html',
    styleUrls: ['./reject-reason-dialog.component.scss'],
    standalone: false,
})
export class RejectReasonDialogComponent implements OnInit {
  reasonForm!: UntypedFormGroup

  constructor(public dialogRef: MatDialogRef<RejectReasonDialogComponent>) {
    this.reasonForm = new UntypedFormGroup({
      reason: new UntypedFormControl('', [Validators.required, Validators.maxLength(500)]),
    })
  }

  ngOnInit() {
  }

  onSubmit() {
    // console.log('this.reasonForm.value', this.reasonForm.value)
    this.dialogRef.close(this.reasonForm.value)
  }

  onNoClick(): void {
    this.dialogRef.close()
  }

}
