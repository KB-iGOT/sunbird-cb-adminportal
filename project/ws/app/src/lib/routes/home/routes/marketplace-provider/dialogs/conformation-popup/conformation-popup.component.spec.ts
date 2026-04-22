import { ConformationPopupComponent } from './conformation-popup.component'
import { FormBuilder } from '@angular/forms'

const mockDialogRef = {
  close: jest.fn(),
}

describe('ConformationPopupComponent', () => {
  let component: ConformationPopupComponent
  const fb = new FormBuilder()

  function createComponent(data: any) {
    return new ConformationPopupComponent(mockDialogRef as any, data, fb)
  }

  beforeEach(() => {
    jest.clearAllMocks()
    component = createComponent({ dialogType: 'confirm', title: 'Test' })
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should set dialogDetails from injected data', () => {
    expect(component.dialogDetails).toEqual({ dialogType: 'confirm', title: 'Test' })
  })

  it('ngOnInit should not call initializeInputForm when dialogType is not input', () => {
    const spy = jest.spyOn(component, 'initializeInputForm').mockImplementation()
    component.ngOnInit()
    expect(spy).not.toHaveBeenCalled()
  })

  it('ngOnInit should call initializeInputForm when dialogType is input', () => {
    component = createComponent({ dialogType: 'input' })
    const spy = jest.spyOn(component, 'initializeInputForm').mockImplementation()
    component.ngOnInit()
    expect(spy).toHaveBeenCalled()
  })

  it('initializeInputForm should create inputForm with inputValue control', () => {
    component.initializeInputForm()
    expect(component.inputForm).toBeDefined()
    expect(component.inputForm.get('inputValue')).toBeTruthy()
    expect(component.inputForm.get('inputValue')?.value).toBe('')
  })

  it('initializeInputForm should add required validator when inputDetails.required is true', () => {
    component.dialogDetails = { dialogType: 'input', inputDetails: { required: true } }
    component.initializeInputForm()
    const control = component.inputForm.get('inputValue')
    control?.setValue('')
    expect(control?.invalid).toBe(true)
  })

  it('initializeInputForm should not add required validator when inputDetails.required is false', () => {
    component.dialogDetails = { dialogType: 'input', inputDetails: { required: false } }
    component.initializeInputForm()
    const control = component.inputForm.get('inputValue')
    control?.setValue('')
    expect(control?.valid).toBe(true)
  })

  it('initializeInputForm should patch initial value when inputDetails.value is provided', () => {
    component.dialogDetails = { dialogType: 'input', inputDetails: { value: 'prefilled' } }
    component.initializeInputForm()
    expect(component.inputForm.get('inputValue')?.value).toBe('prefilled')
  })

  it('closePopup should close dialog with event when dialogType is not input', () => {
    component.closePopup(false)
    expect(mockDialogRef.close).toHaveBeenCalledWith(false)
  })

  it('closePopup should close dialog with true when dialogType is not input', () => {
    component.closePopup(true)
    expect(mockDialogRef.close).toHaveBeenCalledWith(true)
  })

  it('closePopup should close dialog with result and form value when dialogType is input and form is valid', () => {
    component = createComponent({ dialogType: 'input', inputDetails: { required: false } })
    component.ngOnInit()
    component.inputForm.patchValue({ inputValue: 'my-value' })

    component.closePopup(true)
    expect(mockDialogRef.close).toHaveBeenCalledWith({ result: true, value: 'my-value' })
  })

  it('closePopup should mark form as touched and not close when dialogType is input and form is invalid', () => {
    component = createComponent({ dialogType: 'input', inputDetails: { required: true } })
    component.ngOnInit()
    component.inputForm.patchValue({ inputValue: '' })

    component.closePopup(true)
    expect(mockDialogRef.close).not.toHaveBeenCalled()
    expect(component.inputForm.touched).toBe(true)
  })

  it('closePopup should close dialog with event=false when dialogType is input', () => {
    component = createComponent({ dialogType: 'input', inputDetails: { required: false } })
    component.ngOnInit()
    component.closePopup(false)
    expect(mockDialogRef.close).toHaveBeenCalledWith(false)
  })
})
