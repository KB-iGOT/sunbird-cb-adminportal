import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'

import { LoadingPopupComponent } from './loading-popup.component'

describe('LoadingPopupComponent', () => {
  let component: LoadingPopupComponent
  let fixture: ComponentFixture<LoadingPopupComponent>
  let dialogRef: { close: jest.Mock }

  beforeEach(() => {
    dialogRef = { close: jest.fn() }
    TestBed.configureTestingModule({
      declarations: [LoadingPopupComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { message: 'Loading' } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    fixture = TestBed.createComponent(LoadingPopupComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should close the dialog with the event', () => {
    component.closePopup(true)
    expect(dialogRef.close).toHaveBeenCalledWith(true)
  })

  it('should render the title and subtitle from the dialog data', () => {
    component.data = { title: 'Uploading courses', subtitle: 'Please wait' }
    fixture.detectChanges()

    const element: HTMLElement = fixture.nativeElement
    expect(element.querySelector('.dialog-title')!.textContent!.trim()).toBe('Uploading courses')
    expect(element.querySelector('.dialog-sub-title')!.textContent!.trim()).toBe('Please wait')
    expect(element.querySelector('img')!.getAttribute('alt')).toBe('loader')
  })

  it('should render empty title and subtitle when the dialog data has none', () => {
    const element: HTMLElement = fixture.nativeElement
    expect(element.querySelector('.dialog-title')!.textContent!.trim()).toBe('')
    expect(element.querySelector('.dialog-sub-title')!.textContent!.trim()).toBe('')
  })
})
