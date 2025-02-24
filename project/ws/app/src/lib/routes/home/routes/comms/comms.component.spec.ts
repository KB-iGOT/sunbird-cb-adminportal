import { CommsComponent } from './comms.component'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { CommsService } from './comms.service'
import { DatePipe } from '@angular/common'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { of, throwError } from 'rxjs'

describe('CommsComponent', () => {
    let component: CommsComponent
    let mockDialog: jest.Mocked<MatDialog>
    let mockConfigService: jest.Mocked<ConfigurationsService>
    let mockCommsService: jest.Mocked<CommsService>
    let mockDatePipe: jest.Mocked<DatePipe>
    let mockSnackBar: jest.Mocked<MatSnackBar>

    beforeEach(() => {
        // Create mock services
        mockDialog = {
            open: jest.fn()
        } as any

        mockConfigService = {
            userProfile: {
                userId: 'test-user-id'
            }
        } as any

        mockCommsService = {
            getCommsContent: jest.fn(),
            getCommsReportContnet: jest.fn()
        } as any

        mockDatePipe = {
            transform: jest.fn()
        } as any

        mockSnackBar = {
            open: jest.fn()
        } as any

        // Initialize component with mock services
        component = new CommsComponent(
            mockDialog,
            mockConfigService,
            mockCommsService,
            mockDatePipe,
            mockSnackBar
        )
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    describe('ngOnInit', () => {
        beforeEach(() => {
            mockDatePipe.transform.mockReturnValue('2024-02-24')
            mockCommsService.getCommsContent.mockReturnValue(of({
                comms: {
                    buckets: [
                        { key: 'bucket1', name: 'Bucket 1', enable: true },
                        { key: 'bucket2', name: 'Bucket 2', enable: false }
                    ]
                }
            }))
            mockCommsService.getCommsReportContnet.mockReturnValue(of({
                bucket1: {
                    lastModified: '2024-02-24T10:00:00'
                }
            }))
        })

        it('should initialize component with correct data', () => {
            component.ngOnInit()

            expect(component.todayDate).toBeTruthy()
            expect(component.maxDate).toBeTruthy()
            expect(component.tabledata).toBeDefined()
            expect(component.tabledata.columns.length).toBe(2)
        })

        it('should fetch comms content and report data', () => {
            component.ngOnInit()

            expect(mockCommsService.getCommsContent).toHaveBeenCalled()
            expect(mockCommsService.getCommsReportContnet).toHaveBeenCalledWith('2024-02-24')
        })
    })

    describe('getTableData', () => {
        beforeEach(() => {
            component.buckets = [
                { key: 'bucket1.csv', name: 'Bucket 1', enable: true }
            ]
            mockDatePipe.transform
                .mockReturnValueOnce('24/02/2024, 10:00 AM')
                .mockReturnValueOnce('2024-02-24')
        })

        it('should update reportSectionData with correct format', () => {
            mockCommsService.getCommsReportContnet.mockReturnValue(of({
                'bucket1.csv': {
                    lastModified: '2024-02-24T10:00:00'
                }
            }))

            component.getTableData('2024-02-24')

            expect(component.displayLoader).toBe(true)
            setTimeout(() => {
                expect(component.reportSectionData).toEqual([{
                    criteria: 'Bucket 1',
                    lastUpdateOn: '24/02/2024, 10:00 AM',
                    downloadUrl: '2024-02-24',
                    bucketKey: 'bucket1.csv'
                }])
                expect(component.displayLoader).toBe(false)
            }, 2000)
        })

        it('should handle error in getCommsReportContnet', () => {
            mockCommsService.getCommsReportContnet.mockReturnValue(throwError(() => new Error('Test error')))

            component.getTableData('2024-02-24')

            expect(component.displayLoader).toBe(true)
            setTimeout(() => {
                expect(component.displayLoader).toBe(false)
            }, 0)
        })
    })

    describe('downloadFile', () => {
        it('should call downloadReport when downloadUrl exists', () => {
            const row = { downloadUrl: '2024-02-24', bucketKey: 'test.csv' }
            const spy = jest.spyOn(component, 'downloadReport')

            component.downloadFile({ row })

            expect(spy).toHaveBeenCalledWith(row)
        })

        it('should show snackbar when downloadUrl does not exist', () => {
            const row = { downloadUrl: '' }

            component.downloadFile({ row })

            expect(mockSnackBar.open).toHaveBeenCalledWith(
                'Report is not available.',
                'X',
                { duration: 2000 }
            )
        })
    })

    describe('updateDate', () => {
        it('should call getTableData with formatted date', () => {
            const mockEvent = { value: new Date('2024-02-24') }
            const spy = jest.spyOn(component, 'getTableData')

            component.updateDate(mockEvent)

            expect(spy).toHaveBeenCalledWith('2024-02-24')
        })
    })

    describe('downloadReport', () => {
        let mockXHR: any

        beforeEach(() => {
            mockXHR = {
                open: jest.fn(),
                send: jest.fn(),
                setRequestHeader: jest.fn(),
            }
            global.XMLHttpRequest = jest.fn(() => mockXHR) as any
            global.window = {
                location: {
                    href: ''
                }
            } as any
        })

        it('should make xhr request with correct url', () => {
            const row = {
                bucketKey: 'test.csv',
                downloadUrl: '2024-02-24'
            }

            component.downloadReport(row)

            expect(mockXHR.open).toHaveBeenCalledWith(
                'GET',
                expect.stringContaining('/storage/v1/spvReport/test/2024-02-24/test.csv')
            )
            expect(mockXHR.send).toHaveBeenCalled()
        })

        it('should update window location on successful response', () => {
            const row = {
                bucketKey: 'test.csv',
                downloadUrl: '2024-02-24'
            }

            component.downloadReport(row)

            // Simulate successful XHR response
            mockXHR.readyState = 4
            mockXHR.status = 200
            mockXHR.onreadystatechange()

            expect(global.window.location.href).toContain('/storage/v1/spvReport/test/2024-02-24/test.csv')
        })
    })
})