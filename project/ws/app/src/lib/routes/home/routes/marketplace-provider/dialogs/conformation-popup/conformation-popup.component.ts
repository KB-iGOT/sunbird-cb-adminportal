import { Component, Inject, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'

@Component({
    selector: 'ws-app-conformation-popup',
    templateUrl: './conformation-popup.component.html',
    styleUrls: ['./conformation-popup.component.scss'],
    standalone: false,
})
export class ConformationPopupComponent implements OnInit {

  dialogDetails: any
  inputForm!: FormGroup

  constructor(
    private dialogRef: MatDialogRef<ConformationPopupComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any,
    private fb: FormBuilder
  ) {
    this.dialogDetails = this.data
  }

  ngOnInit() {
    if (this.dialogDetails?.dialogType === 'input') {
      this.initializeInputForm()
    }
  }

  initializeInputForm() {
    this.inputForm = this.fb.group({
      inputValue: [''],
    })

    if (this.dialogDetails?.inputDetails?.required) {
      this.inputForm.get('inputValue')?.setValidators([Validators.required])
      this.inputForm.get('inputValue')?.updateValueAndValidity()
    }

    // Set initial value if provided in dialog data
    if (this.dialogDetails?.inputDetails?.value) {
      this.inputForm.patchValue({
        inputValue: this.dialogDetails.inputDetails.value,
      })
    }
  }

  closePopup(event: any) {
    // If dialog type is input, include the form value
    if (this.dialogDetails?.dialogType === 'input' && event) {
      if (this.inputForm.invalid) {
        this.inputForm.markAllAsTouched()
        return
      }
      const formValue = this.inputForm.get('inputValue')?.value

      if (typeof event === 'boolean') {
        // Return boolean along with form value
        this.dialogRef.close({ result: event, value: formValue })
      } else {
        this.dialogRef.close({ result: event, value: formValue })
      }
    } else {
      this.dialogRef.close(event)
    }
  }

}
