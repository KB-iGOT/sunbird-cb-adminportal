import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { Component, Inject, NO_ERRORS_SCHEMA } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { MatRadioModule } from '@angular/material/radio'

/**
 * discussion-popup-image.component.html has no backing component class
 * (the original DialogOverviewExampleDialogImage is commented out in
 * discussion-post.component.ts), so this host mirrors that class to
 * render and verify the template.
 */
@Component({
  selector: 'ws-test-discussion-popup-image',
  templateUrl: './discussion-popup-image.component.html',
  standalone: false,
})
class DiscussionPopupImageHostComponent {
  imageChangedEvent: any = ''
  croppedImage: any = ''
  favoriteSeason: any
  playerName: any
  Tags: string[] = []

  constructor(
    public dialogRef: MatDialogRef<DiscussionPopupImageHostComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  fileChangeEvent(event: any): void {
    this.imageChangedEvent = event
  }

  imageCropped(event: any) {
    this.croppedImage = event.base64
  }

  onNoClick(): void {
    this.dialogRef.close()
  }
}

describe('discussion-popup-image.component.html', () => {
  let component: DiscussionPopupImageHostComponent
  let fixture: ComponentFixture<DiscussionPopupImageHostComponent>
  let dialogRef: { close: jest.Mock }
  const dialogData = {
    id: '1',
    text: 'https://example.com/image.png',
    seasons: ['NSFW Image', 'Gore Image', 'Other'],
  }

  beforeEach(waitForAsync(() => {
    dialogRef = { close: jest.fn() }
    TestBed.configureTestingModule({
      declarations: [DiscussionPopupImageHostComponent],
      imports: [FormsModule, MatRadioModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(DiscussionPopupImageHostComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should render the reason heading as a span referenced by the radio group aria-labelledby', () => {
    const radioGroup: HTMLElement = fixture.nativeElement.querySelector('mat-radio-group.example-radio-group')
    const labelId = radioGroup.getAttribute('aria-labelledby')
    expect(labelId).toBe('example-radio-group-label')
    const heading: HTMLElement = fixture.nativeElement.querySelector(`#${labelId}`)
    expect(heading).toBeTruthy()
    expect(heading.tagName).toBe('SPAN')
    expect(heading.textContent!.replace(/\s+/g, ' ').trim()).toBe('Please chose a reason for rejecting this content.')
  })

  it('should render a radio button for each rejection reason', () => {
    const radios = fixture.nativeElement.querySelectorAll('mat-radio-button.example-radio-button')
    expect(radios.length).toBe(3)
    expect(radios[0].textContent.trim()).toBe('NSFW Image')
    expect(radios[2].textContent.trim()).toBe('Other')
  })

  it('should close the dialog when Cancel is clicked', () => {
    const cancelButton: HTMLButtonElement = fixture.nativeElement.querySelector('button.class-2')
    cancelButton.click()
    expect(dialogRef.close).toHaveBeenCalled()
  })

  it('should store the cropped image and the image change event', () => {
    component.imageCropped({ base64: 'data:image/png;base64,abc' })
    expect(component.croppedImage).toBe('data:image/png;base64,abc')
    const event = { target: {} }
    component.fileChangeEvent(event)
    expect(component.imageChangedEvent).toBe(event)
  })
})
