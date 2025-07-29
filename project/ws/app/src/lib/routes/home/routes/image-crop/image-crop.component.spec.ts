import { of } from 'rxjs'
import { ImageCropComponent } from './image-crop.component'
// import { ImageCroppedEvent } from 'ngx-image-cropper'

// Mock sectorConstants
jest.mock('../sectors/sectors-constats.model', () => ({
  sectorConstants: {
    duration: 3000
  }
}))

// Mock global functions
global.atob = jest.fn()
// global.ArrayBuffer = jest.fn()
// global.Uint8Array = jest.fn()

// Mock Blob constructor
global.Blob = jest.fn().mockImplementation((parts, options) => {
  const blob = {
    size: parts ? parts.reduce((acc: number, part: any) => acc + (part.length || part.byteLength || 0), 0) : 1024,
    type: options?.type || 'application/octet-stream',
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024)),
    stream: jest.fn(),
    text: jest.fn().mockResolvedValue(''),
    slice: jest.fn()
  }
  // Make it look like a real Blob for instanceof checks
  Object.setPrototypeOf(blob, Blob.prototype)
  return blob
})

// Mock File constructor to extend Blob
global.File = jest.fn().mockImplementation((parts, name, options) => {
  const file = {
    ...(new (global.Blob as any)(parts, options)),
    name: name || 'test.jpg',
    lastModified: Date.now(),
    webkitRelativePath: '',
    constructor: File
  }
  // Make it look like a real File for instanceof checks
  Object.setPrototypeOf(file, File.prototype)
  return file
})

// Global FileReader mock instance
let mockFileReaderInstance: any

// Mock FileReader constructor with static properties
const FileReaderMock: any = jest.fn().mockImplementation(() => {
  mockFileReaderInstance = {
    readAsDataURL: jest.fn(),
    readAsText: jest.fn(),
    readAsArrayBuffer: jest.fn(),
    readAsBinaryString: jest.fn(),
    abort: jest.fn(),
    onload: null,
    onerror: null,
    onabort: null,
    onloadstart: null,
    onloadend: null,
    onprogress: null,
    result: null,
    error: null,
    readyState: 0,
    EMPTY: 0,
    LOADING: 1,
    DONE: 2
  }
  return mockFileReaderInstance
})

// Add static properties to the constructor
FileReaderMock.EMPTY = 0
FileReaderMock.LOADING = 1
FileReaderMock.DONE = 2
FileReaderMock.prototype = FileReader.prototype

global.FileReader = FileReaderMock as any

// Mock Image constructor
global.Image = jest.fn()

describe('ImageCropComponent', () => {
  let component: ImageCropComponent
  let mockDialogRef: any
  let mockConfigSvc: any
  let mockSnackBar: any
  let mockValueSvc: any
  let mockData: any

  beforeEach(() => {
    // Reset the FileReader mock
    jest.clearAllMocks()

    // Mock dependencies
    mockDialogRef = {
      close: jest.fn(),
      updateSize: jest.fn()
    }

    mockConfigSvc = {
      instanceConfig: {
        logos: {
          defaultContent: 'default-image-url'
        }
      }
    }

    mockSnackBar = {
      open: jest.fn()
    }

    mockValueSvc = {
      isXSmall$: of(false)
    }

    // Create a proper mock file that extends File prototype
    const mockFile = new (global.File as any)(['test content'], 'test.jpg', { type: 'image/jpeg' })

    mockData = {
      isRoundCrop: false,
      imageFile: mockFile,
      height: 200,
      width: 300,
      imageFileName: 'test.jpg'
    }

    // Create component instance manually
    component = new ImageCropComponent(
      mockDialogRef,
      mockConfigSvc,
      mockSnackBar,
      mockValueSvc,
      mockData
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Constructor', () => {
    beforeEach(() => {
      // Mock thumbnailSizeDetection to avoid FileReader issues during construction
      jest.spyOn(ImageCropComponent.prototype, 'thumbnailSizeDetection').mockImplementation(() => { })
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should initialize with imageFile from data', () => {
      expect(component.imageFile).toBe(mockData.imageFile)
    })

    it('should initialize with fileName from data', () => {
      expect(component.fileName).toBe(mockData.imageFileName)
    })

    it('should set opHeight and opWidth when not round crop', () => {
      expect(component.opHeight).toBe(mockData.height)
      expect(component.opWidth).toBe(mockData.width)
    })

    it('should not set dimensions for round crop', () => {
      const roundCropData = { ...mockData, isRoundCrop: true }
      const roundCropComponent = new ImageCropComponent(
        mockDialogRef,
        mockConfigSvc,
        mockSnackBar,
        mockValueSvc,
        roundCropData
      )
      expect(roundCropComponent.opHeight).toBeUndefined()
      expect(roundCropComponent.opWidth).toBeUndefined()
    })

    it('should handle missing imageFile', () => {
      const dataWithoutFile = { ...mockData }
      delete dataWithoutFile.imageFile
      const componentWithoutFile = new ImageCropComponent(
        mockDialogRef,
        mockConfigSvc,
        mockSnackBar,
        mockValueSvc,
        dataWithoutFile
      )
      expect(componentWithoutFile.imageFile).toBeUndefined()
    })

    it('should handle missing fileName', () => {
      const dataWithoutFileName = { ...mockData }
      delete dataWithoutFileName.imageFileName
      const componentWithoutFileName = new ImageCropComponent(
        mockDialogRef,
        mockConfigSvc,
        mockSnackBar,
        mockValueSvc,
        dataWithoutFileName
      )
      expect(componentWithoutFileName.fileName).toBe('')
    })

    it('should handle missing height in data', () => {
      const dataWithoutHeight = { ...mockData }
      delete dataWithoutHeight.height
      const componentWithoutHeight = new ImageCropComponent(
        mockDialogRef,
        mockConfigSvc,
        mockSnackBar,
        mockValueSvc,
        dataWithoutHeight
      )
      expect(componentWithoutHeight.opHeight).toBeUndefined()
    })

    it('should handle missing width in data', () => {
      const dataWithoutWidth = { ...mockData }
      delete dataWithoutWidth.width
      const componentWithoutWidth = new ImageCropComponent(
        mockDialogRef,
        mockConfigSvc,
        mockSnackBar,
        mockValueSvc,
        dataWithoutWidth
      )
      expect(componentWithoutWidth.opWidth).toBeUndefined()
    })
  })

  describe('ngOnInit', () => {
    beforeEach(() => {
      // Mock thumbnailSizeDetection to avoid FileReader issues in ngOnInit tests
      jest.spyOn(component, 'thumbnailSizeDetection').mockImplementation(() => { })
    })

    it('should call thumbnailSizeDetection', () => {
      const spy = jest.spyOn(component, 'thumbnailSizeDetection')
      component.ngOnInit()
      expect(spy).toHaveBeenCalled()
    })

    it('should subscribe to isXSmall$ and update dialog size when isXSmall is true', () => {
      mockValueSvc.isXSmall$ = of(true)
      component.ngOnInit()
      expect(component.isXSmall).toBe(true)
      expect(mockDialogRef.updateSize).toHaveBeenCalledWith('90%')
    })

    it('should subscribe to isXSmall$ and update dialog size when isXSmall is false', () => {
      mockValueSvc.isXSmall$ = of(false)
      component.ngOnInit()
      expect(component.isXSmall).toBe(false)
      expect(mockDialogRef.updateSize).toHaveBeenCalledWith('70%')
    })
  })

  describe('changeToDefaultImg', () => {
    it('should set default image source', () => {
      const mockEvent = {
        target: {
          src: ''
        }
      }
      component.changeToDefaultImg(mockEvent)
      expect(mockEvent.target.src).toBe('default-image-url')
    })

    it('should handle missing instanceConfig', () => {
      mockConfigSvc.instanceConfig = null
      const mockEvent = {
        target: {
          src: ''
        }
      }
      component.changeToDefaultImg(mockEvent)
      expect(mockEvent.target.src).toBe('')
    })
  })

  describe('imageCropped', () => {
    it('should process cropped image event', () => {
      const mockEvent: any = {
        base64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/',
        file: null,
        blob: null,
        height: 100,
        width: 100,
        cropperPosition: { x1: 0, y1: 0, x2: 100, y2: 100 },
        imagePosition: { x1: 0, y1: 0, x2: 100, y2: 100 },
        offsetImagePosition: { x1: 0, y1: 0, x2: 100, y2: 100 }
      }

      const mockBlob = new (global.Blob as any)(['test'], { type: 'image/jpeg' })
      const mockFile = new (global.File as any)([mockBlob], 'test.jpg', { type: 'image/jpeg' })

      jest.spyOn(component, 'b64toBlob').mockReturnValue(mockBlob);
      (global.File as jest.Mock).mockReturnValue(mockFile)

      component.imageCropped(mockEvent)

      expect(component.imageFileBase64).toBe(mockEvent.base64)
      expect(component.cropimageFile).toBe(mockFile)
    })
  })

  describe('openSnackBar', () => {
    it('should open snack bar with message and correct duration', () => {
      const message = 'Test message'
      component.openSnackBar(message)
      expect(mockSnackBar.open).toHaveBeenCalledWith(message, 'X', {
        duration: 3000 // sectorConstants.duration
      })
    })
  })

  describe('continueToImageCrop', () => {
    it('should set isNotOfRequiredSize to false', () => {
      component.isNotOfRequiredSize = true
      component.continueToImageCrop()
      expect(component.isNotOfRequiredSize).toBe(false)
    })
  })

  describe('thumbnailSizeDetection', () => {
    let mockImage: any

    beforeEach(() => {
      // Reset FileReader mock for each test
      jest.clearAllMocks()

      mockImage = {
        onload: null,
        onerror: null,
        src: '',
        width: 0,
        height: 0,
        complete: false,
        naturalWidth: 0,
        naturalHeight: 0
      };

      (global.Image as jest.Mock).mockImplementation(() => mockImage)
    })

    it('should detect image of required dimensions and show snackbar for non-round crop', (done) => {
      component.isRoundCrop = false
      component.opHeight = 200
      component.opWidth = 300

      const openSnackBarSpy = jest.spyOn(component, 'openSnackBar')

      // Start the detection process
      component.thumbnailSizeDetection()

      // Verify FileReader was called
      expect(mockFileReaderInstance.readAsDataURL).toHaveBeenCalledWith(component.imageFile)

      // Simulate FileReader onload event
      mockFileReaderInstance.result = 'data:image/jpeg;base64,test'

      // Set up Image onload to complete after dimensions are set
      mockImage.onload = () => {
        try {
          expect(component.width).toBe(300)
          expect(component.height).toBe(200)
          expect(openSnackBarSpy).toHaveBeenCalledWith(
            'Image is of the required dimensions of the thumbnail, croping is not available!'
          )
          done()
        } catch (error) {
          done(error)
        }
      }

      // Trigger FileReader onload
      if (mockFileReaderInstance.onload) {
        mockFileReaderInstance.onload()
      }

      // Simulate image loading with exact required dimensions
      mockImage.width = 300
      mockImage.height = 200

      // Trigger image onload - this should trigger the early return due to exact match
      if (mockImage.onload) {
        mockImage.onload()
      }
    })

    it('should set isNotOfRequiredSize when image is smaller than required', (done) => {
      component.isRoundCrop = false
      component.opHeight = 200
      component.opWidth = 300
      component.isNotOfRequiredSize = false

      component.thumbnailSizeDetection()

      // Set up Image onload
      mockImage.onload = () => {
        try {
          expect(component.isNotOfRequiredSize).toBe(true)
          done()
        } catch (error) {
          done(error)
        }
      }

      // Trigger FileReader onload
      if (mockFileReaderInstance.onload) {
        mockFileReaderInstance.onload()
      }

      // Simulate image loading with smaller dimensions
      mockImage.width = 100
      mockImage.height = 100

      // Trigger image onload
      if (mockImage.onload) {
        mockImage.onload()
      }
    })

    it('should set isNotOfRequiredSize when image height is smaller than required', (done) => {
      component.isRoundCrop = false
      component.opHeight = 200
      component.opWidth = 300
      component.isNotOfRequiredSize = false

      component.thumbnailSizeDetection()

      mockImage.onload = () => {
        try {
          expect(component.isNotOfRequiredSize).toBe(true)
          done()
        } catch (error) {
          done(error)
        }
      }

      // Trigger FileReader onload
      if (mockFileReaderInstance.onload) {
        mockFileReaderInstance.onload()
      }

      // Width is fine, but height is too small
      mockImage.width = 300
      mockImage.height = 150

      if (mockImage.onload) {
        mockImage.onload()
      }
    })

    it('should set isNotOfRequiredSize when image width is smaller than required', (done) => {
      component.isRoundCrop = false
      component.opHeight = 200
      component.opWidth = 300
      component.isNotOfRequiredSize = false

      component.thumbnailSizeDetection()

      mockImage.onload = () => {
        try {
          expect(component.isNotOfRequiredSize).toBe(true)
          done()
        } catch (error) {
          done(error)
        }
      }

      // Trigger FileReader onload
      if (mockFileReaderInstance.onload) {
        mockFileReaderInstance.onload()
      }

      // Height is fine, but width is too small
      mockImage.width = 250
      mockImage.height = 200

      if (mockImage.onload) {
        mockImage.onload()
      }
    })

    it('should not check dimensions for round crop', (done) => {
      component.isRoundCrop = true
      component.isNotOfRequiredSize = false

      component.thumbnailSizeDetection()

      mockImage.onload = () => {
        try {
          // For round crop, dimensions shouldn't matter
          expect(component.isNotOfRequiredSize).toBe(false)
          done()
        } catch (error) {
          done(error)
        }
      }

      // Trigger FileReader onload
      if (mockFileReaderInstance.onload) {
        mockFileReaderInstance.onload()
      }

      // Even with small dimensions, should not set isNotOfRequiredSize for round crop
      mockImage.width = 50
      mockImage.height = 50

      if (mockImage.onload) {
        mockImage.onload()
      }
    })

    it('should handle image dimensions larger than required without setting isNotOfRequiredSize', (done) => {
      component.isRoundCrop = false
      component.opHeight = 200
      component.opWidth = 300
      component.isNotOfRequiredSize = false

      const openSnackBarSpy = jest.spyOn(component, 'openSnackBar')

      component.thumbnailSizeDetection()

      mockImage.onload = () => {
        try {
          expect(component.isNotOfRequiredSize).toBe(false)
          expect(openSnackBarSpy).not.toHaveBeenCalled()
          done()
        } catch (error) {
          done(error)
        }
      }

      // Trigger FileReader onload
      if (mockFileReaderInstance.onload) {
        mockFileReaderInstance.onload()
      }

      // Larger dimensions should be fine
      mockImage.width = 400
      mockImage.height = 300

      if (mockImage.onload) {
        mockImage.onload()
      }
    })

    it('should store image dimensions in component properties', (done) => {
      component.thumbnailSizeDetection()

      mockImage.onload = () => {
        try {
          expect(component.width).toBe(500)
          expect(component.height).toBe(400)
          done()
        } catch (error) {
          done(error)
        }
      }

      // Trigger FileReader onload
      if (mockFileReaderInstance.onload) {
        mockFileReaderInstance.onload()
      }

      // Set specific dimensions
      mockImage.width = 500
      mockImage.height = 400

      if (mockImage.onload) {
        mockImage.onload()
      }
    })

    it('should handle exact dimensions and return early with snackbar message', (done) => {
      component.isRoundCrop = false
      component.opHeight = 100
      component.opWidth = 100

      const openSnackBarSpy = jest.spyOn(component, 'openSnackBar')

      component.thumbnailSizeDetection()

      // Mock the early return scenario
      mockImage.onload = () => {
        try {
          // When dimensions are exact, it should show snackbar and return
          expect(openSnackBarSpy).toHaveBeenCalledWith(
            'Image is of the required dimensions of the thumbnail, croping is not available!'
          )
          done()
        } catch (error) {
          done(error)
        }
      }

      if (mockFileReaderInstance.onload) {
        mockFileReaderInstance.onload()
      }

      // Set exact required dimensions
      mockImage.width = 100
      mockImage.height = 100

      if (mockImage.onload) {
        mockImage.onload()
      }
    })
  })

  describe('b64toBlob', () => {
    it('should convert base64 to blob', () => {
      const dataURI = 'data:image/jpeg;base64,dGVzdA=='
      const mockByteString = 'test'
      const mockArrayBuffer = new ArrayBuffer(4)
      // const mockUint8Array = [116, 101, 115, 116] // 'test' as char codes
      const mockBlob = new (global.Blob as any)([mockArrayBuffer], { type: 'image/jpeg' });

      (global.atob as jest.Mock).mockReturnValue(mockByteString);
      // (global.ArrayBuffer as jest.Mock).mockReturnValue(mockArrayBuffer);
      // (global.Uint8Array as jest.Mock).mockReturnValue(mockUint8Array);
      (global.Blob as jest.Mock).mockReturnValue(mockBlob)

      // Mock string methods
      const charCodeAtMock = jest.fn()
        .mockReturnValueOnce(116) // 't'
        .mockReturnValueOnce(101) // 'e'
        .mockReturnValueOnce(115) // 's'
        .mockReturnValueOnce(116) // 't'

      Object.defineProperty(mockByteString, 'length', { value: 4 })
      Object.defineProperty(mockByteString, 'charCodeAt', { value: charCodeAtMock })

      const result = component.b64toBlob(dataURI)

      expect(global.atob).toHaveBeenCalledWith('dGVzdA==')
      expect(global.ArrayBuffer).toHaveBeenCalledWith(4)
      expect(global.Uint8Array).toHaveBeenCalledWith(mockArrayBuffer)
      expect(result).toBe(mockBlob)
    })
  })

  describe('base64ImageToBlob', () => {
    it('should convert base64 image to file', () => {
      const str = 'data:image/png;base64,dGVzdA=='
      const mockByteString = 'test'
      const mockArrayBuffer = new ArrayBuffer(4)
      //  const mockUint8Array = [116, 101, 115, 116] // 'test' as char codes
      const mockBlob = new (global.Blob as any)([mockArrayBuffer], { type: 'image/png' })
      const mockFile = new (global.File as any)([mockBlob], 'test.jpg', { type: 'image/png' });

      (global.atob as jest.Mock).mockReturnValue(mockByteString);
      // (global.ArrayBuffer as jest.Mock).mockReturnValue(mockArrayBuffer);
      // (global.Uint8Array as jest.Mock).mockReturnValue(mockUint8Array);
      (global.Blob as jest.Mock).mockReturnValue(mockBlob);
      (global.File as jest.Mock).mockReturnValue(mockFile)

      // Mock string methods
      const charCodeAtMock = jest.fn()
        .mockReturnValueOnce(116)
        .mockReturnValueOnce(101)
        .mockReturnValueOnce(115)
        .mockReturnValueOnce(116)

      Object.defineProperty(mockByteString, 'length', { value: 4 })
      Object.defineProperty(mockByteString, 'charCodeAt', { value: charCodeAtMock })

      component.fileName = 'test.jpg'
      const result = component.base64ImageToBlob(str)

      expect(global.atob).toHaveBeenCalledWith('dGVzdA==')
      expect(result).toBe(mockFile)
    })
  })

  describe('flipAfterRotate', () => {
    it('should flip transform values after rotate', () => {
      component.transform = { flipH: true, flipV: false };
      (component as any).flipAfterRotate()
      expect(component.transform.flipH).toBe(false)
      expect(component.transform.flipV).toBe(true)
    })

    it('should handle undefined flip values', () => {
      component.transform = {};
      (component as any).flipAfterRotate()
      expect(component.transform.flipH).toBeUndefined()
      expect(component.transform.flipV).toBeUndefined()
    })
  })

  describe('rotateLeft', () => {
    it('should rotate left and flip', () => {
      component.canvasRotation = 0
      const flipSpy = jest.spyOn(component as any, 'flipAfterRotate')
      component.rotateLeft()
      expect(component.canvasRotation).toBe(-1)
      expect(flipSpy).toHaveBeenCalled()
    })
  })

  describe('rotateRight', () => {
    it('should rotate right and flip', () => {
      component.canvasRotation = 0
      const flipSpy = jest.spyOn(component as any, 'flipAfterRotate')
      component.rotateRight()
      expect(component.canvasRotation).toBe(1)
      expect(flipSpy).toHaveBeenCalled()
    })
  })

  describe('flipHorizontal', () => {
    it('should toggle horizontal flip', () => {
      component.transform = { flipH: false }
      component.flipHorizontal()
      expect(component.transform.flipH).toBe(true)
    })

    it('should toggle from true to false', () => {
      component.transform = { flipH: true }
      component.flipHorizontal()
      expect(component.transform.flipH).toBe(false)
    })

    it('should handle undefined flipH', () => {
      component.transform = {}
      component.flipHorizontal()
      expect(component.transform.flipH).toBe(true)
    })
  })

  describe('zoom', () => {
    it('should set scale transform and reset resetValue', () => {
      const event = { value: 1.5 }
      component.resetValue = true
      component.zoom(event)
      expect(component.resetValue).toBe(false)
      expect(component.transform.scale).toBe(1.5)
    })
  })

  describe('croppingImage', () => {
    it('should close dialog with cropped image file', () => {
      const mockFile = new (global.File as any)(['test'], 'test.jpg', { type: 'image/jpeg' })
      component.cropimageFile = mockFile
      component.croppingImage()
      expect(mockDialogRef.close).toHaveBeenCalledWith(mockFile)
    })
  })

  describe('reset', () => {
    it('should reset all transform values', () => {
      component.resetValue = false
      component.canvasRotation = 90
      component.transform = { scale: 2, flipH: true }

      component.reset()

      expect(component.resetValue).toBe(true)
      expect(component.canvasRotation).toBe(0)
      expect(component.transform).toEqual({})
    })
  })

  describe('close', () => {
    it('should close dialog without data', () => {
      component.close()
      expect(mockDialogRef.close).toHaveBeenCalledWith()
    })
  })
})