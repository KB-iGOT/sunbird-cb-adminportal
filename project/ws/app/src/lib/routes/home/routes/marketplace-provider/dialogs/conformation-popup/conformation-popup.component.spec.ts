import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { FormBuilder, ReactiveFormsModule } from '@angular/forms'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'

import { ConformationPopupComponent } from './conformation-popup.component'

describe('ConformationPopupComponent', () => {
  let component: ConformationPopupComponent
  let fixture: ComponentFixture<ConformationPopupComponent>
  let dialogRef: { close: jest.Mock }
  let dialogData: any

  function createComponent() {
    fixture = TestBed.createComponent(ConformationPopupComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  beforeEach(waitForAsync(() => {
    dialogRef = { close: jest.fn() }
    dialogData = { dialogType: 'warning', descriptions: [] }
    TestBed.configureTestingModule({
      declarations: [ConformationPopupComponent],
      imports: [ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useFactory: () => dialogData },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents()
  }))

  it('should create', () => {
    createComponent()
    expect(component).toBeTruthy()
  })

  it('should close dialog with the event for non-input dialogs', () => {
    createComponent()
    component.closePopup(true)
    expect(dialogRef.close).toHaveBeenCalledWith(true)
  })

  it('should initialize input form and close with value for input dialogs', () => {
    dialogData = { dialogType: 'input', inputDetails: { required: true, value: 'abc' } }
    createComponent()
    expect(component.inputForm.get('inputValue')?.value).toBe('abc')
    component.closePopup(true)
    expect(dialogRef.close).toHaveBeenCalledWith({ result: true, value: 'abc' })
  })

  it('should close with result and value for a non-boolean event in input dialogs', () => {
    dialogData = { dialogType: 'input', inputDetails: { required: true, value: 'abc' } }
    createComponent()
    component.closePopup('confirm')
    expect(dialogRef.close).toHaveBeenCalledWith({ result: 'confirm', value: 'abc' })
  })

  it('should not close when required input is empty', () => {
    dialogData = { dialogType: 'input', inputDetails: { required: true } }
    createComponent()
    component.closePopup(true)
    expect(dialogRef.close).not.toHaveBeenCalled()
  })
})
