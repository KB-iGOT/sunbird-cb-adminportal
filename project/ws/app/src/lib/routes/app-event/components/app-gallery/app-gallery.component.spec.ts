
import { ActivatedRoute } from '@angular/router'
import { of, Subject } from 'rxjs'
import { ValueService } from '@sunbird-cb/utils-v2'
import { AppGalleryComponent } from './app-gallery.component'

describe('AppGalleryComponent', () => {
    let component: AppGalleryComponent
    let mockActivatedRoute: jest.Mocked<ActivatedRoute>
    let mockValueService: jest.Mocked<ValueService>
    let isLtMediumSubject: Subject<boolean>

    beforeEach(() => {
        // Create subjects for observables
        isLtMediumSubject = new Subject<boolean>()

        // Create mock services
        mockActivatedRoute = {
            data: of({})
        } as any

        mockValueService = {
            isLtMedium$: isLtMediumSubject.asObservable()
        } as any

        // Create component instance
        component = new AppGalleryComponent(mockActivatedRoute, mockValueService)
    })

    afterEach(() => {
        // Clean up subscriptions
        if (component.screenSubscription) {
            component.screenSubscription.unsubscribe()
        }
        isLtMediumSubject.complete()
    })

    describe('Component Initialization', () => {
        it('should create component with default values', () => {
            expect(component).toBeDefined()
            expect(component.data).toBeUndefined()
            expect(component.imageData).toEqual([
                ['https://www.gstatic.com/webp/gallery/5.webp', 'https://www.gstatic.com/webp/gallery/1.webp'],
                ['https://www.gstatic.com/webp/gallery/3.webp', 'https://www.gstatic.com/webp/gallery/4.webp']
            ])
            expect(component.imageGallery).toEqual([])
            expect(component.error).toBe(false)
            expect(component.screenSubscription).toBeNull()
            expect(component.noOfCol).toBe(2)
            expect(component.isOpened).toBe(false)
            expect(component.currentIndex).toBe(0)
        })
    })

    describe('ngOnInit', () => {
        it('should set noOfCol to 1 when isLtMedium is true', () => {
            component.ngOnInit()

            isLtMediumSubject.next(true)

            expect(component.noOfCol).toBe(1)
            expect(component.screenSubscription).toBeDefined()
        })

        it('should set noOfCol to 2 when isLtMedium is false', () => {
            component.ngOnInit()

            isLtMediumSubject.next(false)

            expect(component.noOfCol).toBe(2)
        })

        it('should handle route data with eventdata successfully', () => {
            const mockData = {
                eventdata: {
                    data: {
                        Home: { title: 'Test Home' },
                        Gallery: [['image1.jpg', 'image2.jpg']]
                    }
                }
            }

            mockActivatedRoute.data = of(mockData)

            component.ngOnInit()

            expect(component.data).toEqual({ title: 'Test Home' })
            expect(component.imageData).toEqual([['image1.jpg', 'image2.jpg']])
            expect(component.error).toBe(false)
        })

        it('should set error to true when eventdata is missing', () => {
            const mockData = {}

            mockActivatedRoute.data = of(mockData)

            component.ngOnInit()

            expect(component.error).toBe(true)
            expect(component.data).toBeUndefined()
        })

        it('should set error to true when eventdata has error', () => {
            const mockData = {
                eventdata: {
                    error: 'Some error occurred'
                }
            }

            mockActivatedRoute.data = of(mockData)

            component.ngOnInit()

            expect(component.error).toBe(true)
        })

        it('should set error to true when eventdata.data is missing', () => {
            const mockData = {
                eventdata: {}
            }

            mockActivatedRoute.data = of(mockData)

            component.ngOnInit()

            expect(component.error).toBe(true)
        })
    })

    describe('ngOnDestroy', () => {
        it('should unsubscribe from screenSubscription when it exists', () => {
            component.ngOnInit()
            const unsubscribeSpy = jest.spyOn(component.screenSubscription!, 'unsubscribe')

            component.ngOnDestroy()

            expect(unsubscribeSpy).toHaveBeenCalled()
        })

        it('should not throw error when screenSubscription is null', () => {
            component.screenSubscription = null

            expect(() => component.ngOnDestroy()).not.toThrow()
        })
    })

    describe('slideTo method', () => {
        beforeEach(() => {
            component.imageGallery = ['image1.jpg', 'image2.jpg', 'image3.jpg']
        })

        it('should set currentIndex to given index when within bounds', () => {
            component.slideTo(1)
            expect(component.currentIndex).toBe(1)

            component.slideTo(2)
            expect(component.currentIndex).toBe(2)

            component.slideTo(0)
            expect(component.currentIndex).toBe(0)
        })

        it('should set currentIndex to 0 when index equals imageGallery length', () => {
            component.slideTo(3) // imageGallery.length = 3
            expect(component.currentIndex).toBe(0)
        })

        it('should handle negative indices correctly', () => {
            component.slideTo(-1)
            expect(component.currentIndex).toBe(2) // imageGallery.length + (-1) = 3 + (-1) = 2

            component.slideTo(-2)
            expect(component.currentIndex).toBe(1) // imageGallery.length + (-2) = 3 + (-2) = 1
        })

        it('should handle out of bounds positive indices', () => {
            component.slideTo(5)
            expect(component.currentIndex).toBe(8) // imageGallery.length + 5 = 3 + 5 = 8
        })

        it('should work with empty imageGallery', () => {
            component.imageGallery = []

            component.slideTo(0)
            expect(component.currentIndex).toBe(0)

            component.slideTo(-1)
            expect(component.currentIndex).toBe(-1)
        })
    })

    describe('openGallery method', () => {
        it('should set isOpened to true and update imageGallery when provided', () => {
            const testImages = ['test1.jpg', 'test2.jpg']

            component.openGallery(true, testImages)

            expect(component.isOpened).toBe(true)
            expect(component.imageGallery).toEqual(testImages)
        })

        it('should set isOpened to false', () => {
            component.isOpened = true

            component.openGallery(false)

            expect(component.isOpened).toBe(false)
        })

        it('should not update imageGallery when imageArray is not provided', () => {
            const originalGallery = ['original1.jpg']
            component.imageGallery = originalGallery

            component.openGallery(true)

            expect(component.isOpened).toBe(true)
            expect(component.imageGallery).toEqual(originalGallery)
        })

        it('should not update imageGallery when imageArray is empty', () => {
            const originalGallery = ['original1.jpg']
            component.imageGallery = originalGallery

            component.openGallery(true, [])

            expect(component.isOpened).toBe(true)
            expect(component.imageGallery).toEqual(originalGallery)
        })

        it('should update imageGallery when imageArray has items', () => {
            component.imageGallery = ['original1.jpg']
            const newImages = ['new1.jpg', 'new2.jpg']

            component.openGallery(true, newImages)

            expect(component.imageGallery).toEqual(newImages)
        })
    })

    describe('Integration tests', () => {
        it('should handle complete workflow with screen size changes and route data', () => {
            // Setup route data
            const mockData = {
                eventdata: {
                    data: {
                        Home: { title: 'Gallery Home' },
                        Gallery: [['gallery1.jpg', 'gallery2.jpg']]
                    }
                }
            }
            mockActivatedRoute.data = of(mockData)

            // Initialize component
            component.ngOnInit()

            // Verify initial state
            expect(component.data).toEqual({ title: 'Gallery Home' })
            expect(component.imageData).toEqual([['gallery1.jpg', 'gallery2.jpg']])
            expect(component.error).toBe(false)

            // Test screen size changes
            isLtMediumSubject.next(true)
            expect(component.noOfCol).toBe(1)

            isLtMediumSubject.next(false)
            expect(component.noOfCol).toBe(2)

            // Test gallery operations
            const galleryImages = ['img1.jpg', 'img2.jpg', 'img3.jpg']
            component.openGallery(true, galleryImages)
            expect(component.isOpened).toBe(true)
            expect(component.imageGallery).toEqual(galleryImages)

            // Test sliding
            component.slideTo(1)
            expect(component.currentIndex).toBe(1)

            // Cleanup
            component.ngOnDestroy()
        })
    })
})