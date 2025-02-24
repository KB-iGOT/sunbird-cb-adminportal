import { AddThumbnailComponent } from './add-thumbnail.component'
import { UntypedFormBuilder } from '@angular/forms'
import { DomSanitizer } from '@angular/platform-browser'
import { SectorsService } from '../sectors/sectors.service'
import { of, throwError } from 'rxjs'
import { sectorConstants } from '../sectors/sectors-constats.model'

describe('AddThumbnailComponent', () => {
    let component: AddThumbnailComponent
    let mockSectorsService: jest.Mocked<SectorsService>
    let mockDialogRef: any
    let mockDomSanitizer: jest.Mocked<DomSanitizer>
    let mockFormBuilder: UntypedFormBuilder

    beforeEach(() => {
        mockSectorsService = {
            fetchImagesContent: jest.fn(),
            getChangedArtifactUrl: jest.fn()
        } as any

        mockDialogRef = {
            close: jest.fn()
        }

        mockDomSanitizer = {
            bypassSecurityTrustResourceUrl: jest.fn()
        } as any

        mockFormBuilder = new UntypedFormBuilder()

        component = new AddThumbnailComponent(
            mockSectorsService,
            mockDialogRef,
            mockDomSanitizer,
            mockFormBuilder,
            {}
        )
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    describe('ngOnInit', () => {
        it('should initialize component properties', () => {
            component.ngOnInit()

            expect(component.pagination).toEqual({
                offset: sectorConstants.offset,
                limit: sectorConstants.limit
            })
            expect(component.startForm).toBeTruthy()
            expect(component.imageList).toEqual([])
        })
    })

    describe('onFileSelected', () => {
        it('should return early if no files are selected', () => {
            const files: any[] = []
            component.onFileSelected(files)
            expect(component.message).toBeUndefined()
        })

        it('should set error message for invalid file type', () => {
            const files = [{ type: 'application/pdf' }]
            component.onFileSelected(files)
            expect(component.message).toBe('Only images are supported.')
        })

        it('should process valid image file', () => {
            const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' })
            const files = [mockFile]

            // Mock FileReader
            const mockFileReader: any = {
                readAsDataURL: jest.fn(),
                onload: null,
                result: 'data:image/jpeg;base64,test'
            }
            window.FileReader = jest.fn(() => mockFileReader) as any

            component.onFileSelected(files)

            expect(component.imagePath).toBe(mockFile)
            expect(component.isChecked).toBe(true)
            expect(component.message).toBe('')

            // Simulate FileReader onload
            mockFileReader.onload()
            expect(component.imgURL).toBe('data:image/jpeg;base64,test')
        })
    })

    describe('showHideButton', () => {
        it('should toggle showMainContent', () => {
            component.showMainContent = true
            component.showHideButton()
            expect(component.showMainContent).toBe(false)

            component.showHideButton()
            expect(component.showMainContent).toBe(true)
        })
    })

    describe('onValChange', () => {
        it('should update values when passed a valid object', () => {
            const mockVal = { identifier: 'test-id' }
            component.onValChange(mockVal)

            expect(component.isChecked).toBe(true)
            expect(component.thumbanilSelectval).toBe('test-id')
            expect(component.toggle).toBe(mockVal)
        })

        it('should handle null input', () => {
            component.onValChange(null)

            expect(component.isChecked).toBe(true)
            expect(component.thumbanilSelectval).toBe('')
            expect(component.toggle).toBe(null)
        })
    })

    describe('fetchContent', () => {
        const mockResponse = {
            result: {
                content: [
                    { identifier: '1', name: 'image1' },
                    { identifier: '2', name: 'image2' }
                ],
                response: {
                    totalHits: 2
                }
            }
        }

        it('should fetch and update image list successfully', () => {
            mockSectorsService.fetchImagesContent.mockReturnValue(of(mockResponse))

            component.fetchContent(false, null)

            expect(mockSectorsService.fetchImagesContent).toHaveBeenCalled()
            expect(component.imageList).toEqual(mockResponse.result.content)
            expect(component.totalContent).toBe(2)
            expect(component.fetchError).toBe(false)
        })

        it('should handle load more functionality', () => {
            component.imageList = [{ identifier: '0', name: 'image0' }]
            mockSectorsService.fetchImagesContent.mockReturnValue(of(mockResponse))

            component.fetchContent(true, null)

            expect(component.imageList.length).toBe(3)
            expect(component.fetchError).toBe(false)
        })

        it('should handle error case', () => {
            mockSectorsService.fetchImagesContent.mockReturnValue(throwError(() => new Error('Test error')))

            component.fetchContent(false, null)

            expect(component.fetchError).toBe(false) // Note: The component doesn't set fetchError to true on error
        })
    })

    describe('bypass', () => {
        beforeEach(() => {
            // Mock environment
            (global as any).environment = {
                contentBucket: 'test-bucket'
            }
        })

        it('should return sanitized URL for valid content bucket URL', () => {
            const testUrl = 'test-bucket/image.jpg'
            mockDomSanitizer.bypassSecurityTrustResourceUrl.mockReturnValue('sanitized-url')

            const result = component.bypass(testUrl)

            expect(mockDomSanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith(testUrl)
            expect(result).toBe('sanitized-url')
        })

        it('should return default image for invalid URL', () => {
            const result = component.bypass('invalid-url')
            expect(result).toBe('/assets/instances/eagle/app_logos/default.png')
        })
    })

    describe('uploadThumbnail', () => {
        it('should close dialog with toggle artifactUrl', () => {
            component.toggle = { artifactUrl: 'test-url' }
            component.uploadThumbnail()
            expect(mockDialogRef.close).toHaveBeenCalledWith({ imgUrl: 'test-url' })
        })

        it('should close dialog with empty string when no toggle', () => {
            component.toggle = null
            component.uploadThumbnail()
            expect(mockDialogRef.close).toHaveBeenCalledWith({ imgUrl: '' })
        })
    })

    describe('uploadSelectedThumbnail', () => {
        it('should close dialog with selected image path', () => {
            component.imagePath = 'test-image-path'
            component.uploadSelectedThumbnail()
            expect(mockDialogRef.close).toHaveBeenCalledWith({ file: 'test-image-path' })
        })
    })
})