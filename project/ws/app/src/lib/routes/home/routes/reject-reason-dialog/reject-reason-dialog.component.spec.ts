import { UntypedFormGroup } from '@angular/forms'
import { MatDialogRef } from '@angular/material/dialog'
import { RejectReasonDialogComponent } from './reject-reason-dialog.component'

describe('RejectReasonDialogComponent', () => {
    let component: RejectReasonDialogComponent

    const dialogRef: Partial<MatDialogRef<RejectReasonDialogComponent>> = {
        close: jest.fn(),
    }

    beforeEach(() => {
        component = new RejectReasonDialogComponent(
            dialogRef as MatDialogRef<RejectReasonDialogComponent>
        )
        jest.clearAllMocks()
    })

    it('should create a instance of component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize reasonForm as a FormGroup', () => {
        expect(component.reasonForm).toBeInstanceOf(UntypedFormGroup)
        expect(component.reasonForm.controls['reason']).toBeDefined()
    })

    it('should have reason control with required validator', () => {
        const reasonCtrl = component.reasonForm.controls['reason']
        reasonCtrl.setValue('')
        expect(reasonCtrl.hasError('required')).toBe(true)
    })

    it('should have reason control with maxLength 500 validator', () => {
        const reasonCtrl = component.reasonForm.controls['reason']
        reasonCtrl.setValue('a'.repeat(501))
        expect(reasonCtrl.hasError('maxlength')).toBe(true)
    })

    it('should be valid when reason is within 500 chars', () => {
        component.reasonForm.controls['reason'].setValue('Valid reason')
        expect(component.reasonForm.valid).toBe(true)
    })

    it('should call ngOnInit without errors', () => {
        expect(() => component.ngOnInit()).not.toThrow()
    })

    it('should call dialogRef.close with form value on onSubmit', () => {
        component.reasonForm.controls['reason'].setValue('spam content')
        component.onSubmit()
        expect(dialogRef.close).toHaveBeenCalledWith({ reason: 'spam content' })
    })

    it('should call dialogRef.close with no args on onNoClick', () => {
        component.onNoClick()
        expect(dialogRef.close).toHaveBeenCalledWith()
    })
})
