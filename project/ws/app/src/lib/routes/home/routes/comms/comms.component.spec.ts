import { CommsComponent } from './comms.component'
import { MatDialog } from '@angular/material/dialog'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { CommsService } from './comms.service'
import { MatSnackBar } from '@angular/material/snack-bar'
import { DatePipe } from '@angular/common'
import { of } from 'rxjs'

describe('CommsComponent', () => {
    let component: CommsComponent
    let mockDialog: MatDialog
    let mockConfigSvc: ConfigurationsService
    let mockCommsService: CommsService
    let mockSnackBar: MatSnackBar
    let mockDatePipe: DatePipe

    beforeEach(() => {
        mockDialog = { open: jest.fn() } as any
        mockConfigSvc = { userProfile: { userId: 'test-user' } } as any
        mockCommsService = { getCommsContent: jest.fn(), getCommsReportContnet: jest.fn() } as any
        mockSnackBar = { open: jest.fn() } as any
        mockDatePipe = { transform: jest.fn().mockReturnValue('02/24/2025') } as any

        component = new CommsComponent(
            mockDialog,
            mockConfigSvc,
            mockCommsService,
            mockDatePipe,
            mockSnackBar,
        )
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize component properties on ngOnInit', () => {
        jest.spyOn(mockCommsService, 'getCommsContent').mockReturnValue(of({ comms: { buckets: [] } }))
        component.ngOnInit()

        expect(component.currentUser).toBe('test-user')
        expect(component.todayDate).toBeInstanceOf(Date)
        expect(component.maxDate).toBeInstanceOf(Date)
        expect(component.tabledata).toEqual({
            columns: [
                { displayName: 'Criteria', key: 'criteria' },
                { displayName: 'Last updated on', key: 'lastUpdateOn' },
            ],
            needCheckBox: false,
            needHash: false,
            sortColumn: 'Criteria',
            sortState: 'asc',
            needUserMenus: false,
            actionColumnName: 'Action',
            actions: [{ icon: '', label: 'Download', name: 'DownloadFile', type: 'Standard', disabled: false }],
        })
    })

    it('should call getTableData when commsContent is fetched', () => {
        const mockBuckets = [{ enable: true, key: 'key1', name: 'Bucket 1' }]
        jest.spyOn(mockCommsService, 'getCommsContent').mockReturnValue(of({ comms: { buckets: mockBuckets } }))
        jest.spyOn(mockCommsService, 'getCommsReportContnet').mockReturnValue(of({}))
        const spyGetTableData = jest.spyOn(component, 'getTableData')

        component.ngOnInit()
        expect(spyGetTableData).toHaveBeenCalledWith('2025-02-24') // Date format based on the mock datePipe return value
    })

    it('should update table data when getTableData is called', () => {
        component.buckets = [{ enable: true, key: 'key1', name: 'Bucket 1' }]
        const mockResponse = { key1: { lastModified: '2025-02-24T10:00:00' } }
        jest.spyOn(mockCommsService, 'getCommsReportContnet').mockReturnValue(of(mockResponse))

        component.getTableData('2025-02-24')
        expect(component.reportSectionData).toEqual([
            { criteria: 'Bucket 1', lastUpdateOn: '24/02/2025, 10:00 am', downloadUrl: '2025-02-24', bucketKey: 'key1' },
        ])
    })

    it('should handle error gracefully in getTableData', () => {
        const consoleLogSpy = jest.spyOn(console, 'log')
        jest.spyOn(mockCommsService, 'getCommsReportContnet').mockReturnValue(of(new Error('Failed')))

        component.getTableData('2025-02-24')
        expect(consoleLogSpy).toHaveBeenCalledWith(new Error('Failed'))
    })

    it('should call snackBar when downloadFile is invoked without a downloadUrl', () => {
        const mockEvent = { row: { downloadUrl: '' } }
        component.downloadFile(mockEvent)
        expect(mockSnackBar.open).toHaveBeenCalledWith('Report is not available.', 'X', { duration: 2000 })
    })

    it('should invoke downloadReport when downloadFile is called with a valid downloadUrl', () => {
        const mockEvent = { row: { downloadUrl: '2025-02-24', bucketKey: 'key1.csv' } }
        const spyDownloadReport = jest.spyOn(component, 'downloadReport')
        component.downloadFile(mockEvent)
        expect(spyDownloadReport).toHaveBeenCalledWith(mockEvent.row)
    })

    it('should update table data when updateDate is called', () => {
        const spyGetTableData = jest.spyOn(component, 'getTableData')
        component.updateDate({ value: '2025-02-24' })
        expect(spyGetTableData).toHaveBeenCalledWith('2025-02-24')
    })

    it('should download report', () => {
        const row = { bucketKey: 'key1.csv', downloadUrl: '2025-02-24' }
        const xhrMock = {
            open: jest.fn(),
            send: jest.fn(),
            onreadystatechange: jest.fn(),
            readyState: 4,
            status: 200,
        }
        // global.XMLHttpRequest = jest.fn().mockImplementation(() => xhrMock)

        const spyLocationHref = jest.spyOn(window.location, 'href', 'set')
        component.downloadReport(row)

        expect(xhrMock.open).toHaveBeenCalledWith('GET', 'https://your-environment-url/spvReport/key1/2025-02-24/key1.csv')
        expect(xhrMock.send).toHaveBeenCalled()
        xhrMock.onreadystatechange()
        expect(spyLocationHref).toHaveBeenCalledWith('https://your-environment-url/spvReport/key1/2025-02-24/key1.csv')
    })
})
