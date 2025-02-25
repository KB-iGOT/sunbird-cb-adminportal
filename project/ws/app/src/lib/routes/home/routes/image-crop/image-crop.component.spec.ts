import { ImageCropComponent } from './image-crop.component'
import { ValueService } from './value.service'
import { ConfigurationsService } from '../../services/configurations.service'
import { sectorConstants } from '../sectors/sectors-constats.model'
import { MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'

describe('ImageCropComponent', () => {
  let component: ImageCropComponent
  let dialogRefMock: MatDialogRef<ImageCropComponent>
  let snackBarMock: MatSnackBar
  let valueServiceMock: ValueService
  let configServiceMock: ConfigurationsService

  beforeEach(() => {
    dialogRefMock = { close: jest.fn(), updateSize: jest.fn() } as unknown as MatDialogRef<ImageCropComponent>
    snackBarMock = { open: jest.fn() } as unknown as MatSnackBar
    valueServiceMock = { isXSmall$: { subscribe: jest.fn() } } as unknown as ValueService
    configServiceMock = { instanceConfig: { logos: { defaultContent: 'default-logo.png' } } } as unknown as ConfigurationsService

    // Initialize component
    component = new ImageCropComponent(
      dialogRefMock,
      configServiceMock,
      snackBarMock,
      valueServiceMock,
      {
        isRoundCrop: false,
        imageFile: new File([''], 'image.png'),
        height: 200,
        width: 200,
        imageFileName: 'image.png'
      }
    )
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should change to default image', () => {
    const event = { target: { src: '' } }
    component.changeToDefaultImg(event)
    expect(event.target.src).toBe('default-logo.png')
  })

  it('should update dialog size based on isXSmall$', () => {
    const subscribeMock = jest.fn((callback) => {
      callback(true) // simulate the subscription behavior
    })
    // valueServiceMock.isXSmall$.subscribe = subscribeMock

    component.ngOnInit()

    expect(subscribeMock).toHaveBeenCalled()
    expect(dialogRefMock.updateSize).toHaveBeenCalledWith('90%')
  })

  it('should call openSnackBar with correct message when thumbnail size is correct', () => {
    const spySnackBar = jest.spyOn(snackBarMock, 'open')
    component.thumbnailSizeDetection() // Call this directly since FileReader is async

    expect(spySnackBar).toHaveBeenCalledWith('Image is of the required dimensions of the thumbnail, croping is not available!', 'X', {
      duration: sectorConstants.duration,
    })
  })

  it('should call croppingImage and close the dialog with cropped image file', () => {
    component.cropimageFile = new File([''], 'cropped-image.png')
    component.croppingImage()

    expect(dialogRefMock.close).toHaveBeenCalledWith(component.cropimageFile)
  })

  it('should call close on dialogRef when close method is triggered', () => {
    component.close()
    expect(dialogRefMock.close).toHaveBeenCalled()
  })

  it('should rotate image when rotateLeft is called', () => {
    component.canvasRotation = 0
    component.rotateLeft()

    expect(component.canvasRotation).toBe(-1)
    expect(component.transform.flipH).toBe(undefined) // Transform flip should flip after rotation
    expect(component.transform.flipV).toBe(undefined)
  })

  it('should rotate image when rotateRight is called', () => {
    component.canvasRotation = 0
    component.rotateRight()

    expect(component.canvasRotation).toBe(1)
    expect(component.transform.flipH).toBe(undefined) // Transform flip should flip after rotation
    expect(component.transform.flipV).toBe(undefined)
  })

  it('should zoom when zoom method is called', () => {
    const event = { value: 1.5 }
    component.zoom(event)

    expect(component.resetValue).toBe(false)
    expect(component.transform.scale).toBe(1.5)
  })

  it('should reset transform and rotation when reset is called', () => {
    component.reset()

    expect(component.resetValue).toBe(true)
    expect(component.canvasRotation).toBe(0)
    expect(component.transform).toEqual({})
  })

  it('should set isNotOfRequiredSize to true if image is smaller than required size', () => {
    const smallFile = new File([''], 'small-image.png')
    component.imageFile = smallFile
    component.opHeight = 500
    component.opWidth = 500

    component.thumbnailSizeDetection() // Manually trigger this

    expect(component.isNotOfRequiredSize).toBe(true)
  })
})
