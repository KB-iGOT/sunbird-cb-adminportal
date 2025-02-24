import { ContentUploadComponent } from './content-upload.component'
import { MarketplaceService } from '../../services/marketplace.service'
import { DatePipe } from '@angular/common'
import { MatSnackBar } from '@angular/material/snack-bar'
import { of, throwError } from 'rxjs'
import { ElementRef } from '@angular/core'

describe('ContentUploadComponent', () => {
    let component: ContentUploadComponent
    let marketplaceServiceMock: jest.Mocked<MarketplaceService>
    let datePipeMock: jest.Mocked<DatePipe>
    let snackBarMock: jest.Mocked<MatSnackBar>

    beforeEach(() => {
        // Create mocks for dependencies
        marketplaceServiceMock = {
            getContentList: jest.fn(),
            getCoursesList: jest.fn(),
            deleteUnPublishedCourses: jest.fn(),
            downloadLogs: jest.fn(),
        } as any

        datePipeMock = {
            transform: jest.fn(),
        } as any

        snackBarMock = {
            open: jest.fn(),
        } as any

        // Initialize component with mocks
        component = new ContentUploadComponent(
            marketplaceServiceMock,
            datePipeMock,
            snackBarMock
        )

        // Set up common test data
        component.providerDetails = {
            id: '123',
            trasformContentJson: true,
            data: {
                partnerCode: 'TEST_PARTNER'
            }
        }

        // Mock ViewChild
        component.fileInput = {
            nativeElement: {} as HTMLInputElement
        } as ElementRef<HTMLInputElement>
    })

    describe('initialization', () => {
        it('should create', () => {
            expect(component).toBeTruthy()
        })

        it('should initialize tables on ngOnInit', () => {
            const getTablesDataSpy = jest.spyOn(component, 'getTablesData')
            component.ngOnInit()
            expect(getTablesDataSpy).toHaveBeenCalled()
        })

        it('should initialize table data when providerDetails changes', () => {
            const tableDataInitSpy = jest.spyOn(component, 'tableDataInitialzation')
            component.ngOnChanges({
                providerDetails: {
                    currentValue: { id: '123' },
                    firstChange: true,
                    previousValue: null,
                    isFirstChange: () => true
                }
            })
            expect(tableDataInitSpy).toHaveBeenCalled()
        })
    })

    describe('getContentList', () => {
        const mockContentResponse = [{
            status: 'success',
            fileName: 'test.csv',
            initiatedOn: '2024-02-24T10:00:00',
            completedOn: '2024-02-24T10:05:00',
            gcpfileName: 'test-gcp.csv'
        }]

        it('should fetch and format content list successfully', () => {
            marketplaceServiceMock.getContentList.mockReturnValue(of(mockContentResponse))
            datePipeMock.transform.mockReturnValue('24 Feb 2024 10:00 AM')

            component.getContentList()

            expect(marketplaceServiceMock.getContentList).toHaveBeenCalledWith('123')
            expect(component.uploadedContentList.length).toBe(1)
            // expect(component.uploadedContentList[0].status).toBe('Live')
        })

        it('should handle error in content list fetch', () => {
            const errorResponse = {
                error: {
                    params: {
                        errMsg: 'Test error'
                    }
                }
            }
            marketplaceServiceMock.getContentList.mockReturnValue(throwError(() => errorResponse))

            component.getContentList()

            expect(snackBarMock.open).toHaveBeenCalledWith('Test error')
            //expect(component.showUploadedStatusLoader).toBeFalse()
        })
    })

    describe('getPublishedCoursesList', () => {
        const mockPublishedCoursesResponse = {
            totalCount: 1,
            data: [{
                externalId: '1',
                name: 'Test Course',
                appIcon: 'test.jpg',
                source: 'Test',
                isActive: true,
                publishedOn: '2024-02-24',
                createdDate: '2024-02-24'
            }]
        }

        beforeEach(() => {
            component.publishedCoursesTablePaginationDetails = {
                pageIndex: 0,
                pageSize: 20
            }
        })

        it('should fetch and format published courses successfully', () => {
            marketplaceServiceMock.getCoursesList.mockReturnValue(of(mockPublishedCoursesResponse))
            datePipeMock.transform.mockReturnValue('Feb 24, 2024')

            component.getPublishedCoursesList()

            expect(marketplaceServiceMock.getCoursesList).toHaveBeenCalled()
            expect(component.publishedCoursesList.length).toBe(1)
            expect(component.publishedCoursesTablePaginationDetails.totalCount).toBe(1)
        })

        it('should handle error in published courses fetch', () => {
            const errorResponse = {
                error: {
                    params: {
                        errMsg: 'Test error'
                    }
                }
            }
            marketplaceServiceMock.getCoursesList.mockReturnValue(throwError(() => errorResponse))

            component.getPublishedCoursesList()

            expect(snackBarMock.open).toHaveBeenCalledWith('Test error')
            // expect(component.showPublishedCoursesLoader).toBeFalse()
        })
    })

    describe('getUnPublishedCoursesList', () => {
        const mockUnpublishedCoursesResponse = {
            totalCount: 1,
            data: [{
                externalId: '1',
                name: 'Test Course',
                appIcon: 'test.jpg',
                source: 'Test',
                isActive: false,
                createdDate: '2024-02-24'
            }]
        }

        beforeEach(() => {
            component.unPublishedCoursesTablePaginationDetails = {
                pageIndex: 0,
                pageSize: 20
            }
        })

        it('should fetch and format unpublished courses successfully', () => {
            marketplaceServiceMock.getCoursesList.mockReturnValue(of(mockUnpublishedCoursesResponse))
            datePipeMock.transform.mockReturnValue('Feb 24, 2024')

            component.getUnPublishedCoursesList()

            expect(marketplaceServiceMock.getCoursesList).toHaveBeenCalled()
            expect(component.unPublishedCoursesList.length).toBe(1)
            expect(component.unPublishedCoursesTablePaginationDetails.totalCount).toBe(1)
        })

        it('should handle error in unpublished courses fetch', () => {
            const errorResponse = {
                error: {
                    params: {
                        errMsg: 'Test error'
                    }
                }
            }
            marketplaceServiceMock.getCoursesList.mockReturnValue(throwError(() => errorResponse))

            component.getUnPublishedCoursesList()

            expect(snackBarMock.open).toHaveBeenCalledWith('Test error')
            //expect(component.showUnpublishedCoursesLoader).toBeFalse()
        })
    })

    describe('content events', () => {
        describe('deletedSelectedCourses', () => {
            it('should delete single course successfully', () => {
                const event = {
                    rows: { id: '1' }
                }
                marketplaceServiceMock.deleteUnPublishedCourses.mockReturnValue(of(true))

                component.deletedSelectedCourses(event)

                expect(marketplaceServiceMock.deleteUnPublishedCourses).toHaveBeenCalledWith({
                    partnerCode: 'TEST_PARTNER',
                    externalId: ['1']
                })
                expect(snackBarMock.open).toHaveBeenCalledWith('Selected course is deleted successfully')
            })

            it('should delete multiple courses successfully', () => {
                const event = {
                    rows: [{ id: '1' }, { id: '2' }]
                }
                marketplaceServiceMock.deleteUnPublishedCourses.mockReturnValue(of(true))

                component.deletedSelectedCourses(event)

                expect(marketplaceServiceMock.deleteUnPublishedCourses).toHaveBeenCalledWith({
                    partnerCode: 'TEST_PARTNER',
                    externalId: ['1', '2']
                })
                expect(snackBarMock.open).toHaveBeenCalledWith('Selected courses are deleted successfully')
            })

            it('should show error message when no courses selected', () => {
                const event = {
                    rows: []
                }

                component.deletedSelectedCourses(event)

                expect(snackBarMock.open).toHaveBeenCalledWith('Please select course to delete.')
            })
        })

        describe('downloadLog', () => {
            it('should download log file successfully', () => {
                const blob = new Blob(['test'], { type: 'text/csv' })
                marketplaceServiceMock.downloadLogs.mockReturnValue(of(blob))

                // Mock URL.createObjectURL and URL.revokeObjectURL
                const createObjectURL = jest.fn()
                const revokeObjectURL = jest.fn()
                global.URL.createObjectURL = createObjectURL
                global.URL.revokeObjectURL = revokeObjectURL

                // Mock document.createElement
                const mockAnchor = {
                    href: '',
                    download: '',
                    click: jest.fn()
                }
                document.createElement = jest.fn().mockReturnValue(mockAnchor)

                component.downloadLog('test-gcp.csv', 'test.xlsx')

                expect(marketplaceServiceMock.downloadLogs).toHaveBeenCalledWith('test-gcp.csv')
                expect(mockAnchor.click).toHaveBeenCalled()
                expect(snackBarMock.open).toHaveBeenCalledWith('Logs Downloaded Successfully.')
            })

            it('should handle download error', () => {
                const errorResponse = {
                    error: {
                        params: {
                            errMsg: 'Download failed'
                        }
                    }
                }
                marketplaceServiceMock.downloadLogs.mockReturnValue(throwError(() => errorResponse))

                component.downloadLog('test-gcp.csv', 'test.xlsx')

                expect(snackBarMock.open).toHaveBeenCalledWith('Download failed')
            })
        })
    })

    describe('pagination and search', () => {
        it('should handle page change for published courses', () => {
            const event = {
                pageIndex: 1,
                pageSize: 20
            }
            const getPublishedCoursesListSpy = jest.spyOn(component, 'getPublishedCoursesList')

            component.pageChange(event, 'published')

            expect(component.publishedCoursesTablePaginationDetails).toEqual(event)
            expect(getPublishedCoursesListSpy).toHaveBeenCalled()
        })

        it('should handle page change for unpublished courses', () => {
            const event = {
                pageIndex: 1,
                pageSize: 20
            }
            const getUnPublishedCoursesListSpy = jest.spyOn(component, 'getUnPublishedCoursesList')

            component.pageChange(event, 'notPublished')

            expect(component.unPublishedCoursesTablePaginationDetails).toEqual(event)
            expect(getUnPublishedCoursesListSpy).toHaveBeenCalled()
        })

        it('should handle search for published courses', () => {
            const searchKey = 'test'
            const getPublishedCoursesListSpy = jest.spyOn(component, 'getPublishedCoursesList')

            component.searchCourses(true, searchKey)

            expect(component.publishedCoursesSerachKey).toBe(searchKey)
            expect(getPublishedCoursesListSpy).toHaveBeenCalled()
        })

        it('should handle search for unpublished courses', () => {
            const searchKey = 'test'
            const getUnPublishedCoursesListSpy = jest.spyOn(component, 'getUnPublishedCoursesList')

            component.searchCourses(false, searchKey)

            expect(component.unPublishedCoursesSearchKey).toBe(searchKey)
            expect(getUnPublishedCoursesListSpy).toHaveBeenCalled()
        })
    })
})