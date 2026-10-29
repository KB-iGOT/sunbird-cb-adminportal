import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { MatChipInputEvent } from '@angular/material/chips'
import { MatCheckboxModule } from '@angular/material/checkbox'

import { DialogTextProfanityComponent } from './discussion-post-popup.component'

describe('DialogTextProfanityComponent (discussion-popup template)', () => {
  let component: DialogTextProfanityComponent
  let fixture: ComponentFixture<DialogTextProfanityComponent>
  let dialogRef: { close: jest.Mock }
  let dialogData: any

  function createComponent() {
    fixture = TestBed.createComponent(DialogTextProfanityComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  beforeEach(waitForAsync(() => {
    dialogRef = { close: jest.fn() }
    dialogData = {
      profaneCategories: ['abuse', 'hate'],
      text: 'some profane text',
      id: '1',
      profaneString: ['bad', 'worse'],
    }
    TestBed.configureTestingModule({
      declarations: [DialogTextProfanityComponent],
      imports: [FormsModule, ReactiveFormsModule, MatCheckboxModule],
      providers: [
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

  it('should build a form control for each profane category', () => {
    createComponent()
    expect(component.profaneGroup.value).toEqual({ abuse: false, hate: false })
  })

  it('should prefill TAGS from profaneString on init', () => {
    createComponent()
    expect(component.TAGS).toEqual(['bad', 'worse'])
  })

  it('should not prefill TAGS when profaneString is empty', () => {
    dialogData = { ...dialogData, profaneString: '' }
    createComponent()
    expect(component.TAGS).toEqual([])
  })

  it('should render the category heading as a span referenced by aria-labelledby', () => {
    createComponent()
    const section: HTMLElement = fixture.nativeElement.querySelector('section.profane-radio-group')
    const labelId = section.getAttribute('aria-labelledby')
    expect(labelId).toBe('profane-category')
    const heading: HTMLElement = fixture.nativeElement.querySelector(`#${labelId}`)
    expect(heading).toBeTruthy()
    expect(heading.tagName).toBe('SPAN')
    expect(heading.textContent!.replace(/\s+/g, ' ').trim()).toBe('Please choose a reason for rejecting this content.')
  })

  it('should render a checkbox for each profane category', () => {
    createComponent()
    const checkboxes = fixture.nativeElement.querySelectorAll('section.profane-radio-group mat-checkbox')
    expect(checkboxes.length).toBe(2)
    expect(checkboxes[0].textContent.trim()).toBe('abuse')
    expect(checkboxes[1].textContent.trim()).toBe('hate')
  })

  it('should add a trimmed non-empty tag and clear the input', () => {
    createComponent()
    const input = { value: 'ugly' } as HTMLInputElement
    component.add({ input, value: 'ugly' } as unknown as MatChipInputEvent)
    expect(component.TAGS).toEqual(['bad', 'worse', 'ugly'])
    expect(input.value).toBe('')
  })

  it('should not add a blank tag', () => {
    createComponent()
    component.add({ input: null, value: '   ' } as unknown as MatChipInputEvent)
    expect(component.TAGS).toEqual(['bad', 'worse'])
  })

  it('should remove an existing tag and ignore unknown tags', () => {
    createComponent()
    component.remove('bad')
    expect(component.TAGS).toEqual(['worse'])
    component.remove('missing')
    expect(component.TAGS).toEqual(['worse'])
  })

  it('should close the dialog on onNoClick', () => {
    createComponent()
    component.onNoClick()
    expect(dialogRef.close).toHaveBeenCalled()
  })
})
