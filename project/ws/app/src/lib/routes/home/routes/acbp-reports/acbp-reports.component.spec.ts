import { AcbpReportsComponent } from './acbp-reports.component'
import { AcbpReportsService } from './acbp-reports.service'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { DatePipe } from '@angular/common'
import { of, throwError } from 'rxjs'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'

// Mock environment
jest.mock('../../../../../../../../../src/environments/environment', () => ({
    environment: {
        spvPath: 'http://test-path'
    }
}))

describe('AcbpReportsComponent', () => {
    let component: AcbpReportsComponent
    let acbpReportsServiceMock: jest.Mocked<AcbpReportsService>
    let configServiceMock: jest.Mocked<ConfigurationsService>
    let datePipeMock: jest.Mocked<DatePipe>
    let snackBarMock: jest.Mocked<MatSnackBar>
    let dialogMock: jest.Mocked<MatDialog>
    let xhrMock: any

    // Sample data for tests
    const mockBuckets = [
        { key: 'report1.csv', name: 'Report 1', enable: true },
        { key: 'report2.csv', name: 'Report 2', enable: true },
        { key: 'report3.csv', name: 'Report 3', enable: false }
    ]

    const mockReportContent = {
        'report1.csv': { lastModified: '2023-01-15T12:30:00Z' },
        'report2.csv': { lastModified: '2023-01-16T14:45:00Z' }
    }

    beforeEach(() => {
        // Set up XMLHttpRequest mock
        xhrMock = {
            open: jest.fn(),
            send: jest.fn(),
            readyState: 4,
            status: 200,
            setReadyState: function (state: number) {
                this.readyState = state
                if (this.onreadystatechange) this.onreadystatechange()
            },
            setStatus: function (status: number) {
                this.status = status
            }
        }

        // global.XMLHttpRequest = jest.fn().mockImplementation(() => xhrMock)
        global.window = Object.create(window)
        Object.defineProperty(window, 'location', {
            value: { href: '' },
            writable: true
        })

        // Create mocks for all dependencies
        acbpReportsServiceMock = {
            getAcbpContent: jest.fn(),
            getAcbpReportContnet: jest.fn()
        } as unknown as jest.Mocked<AcbpReportsService>

        configServiceMock = {
            userProfile: { userId: 'test-user-123' }
        } as unknown as jest.Mocked<ConfigurationsService>

        datePipeMock = {
            transform: jest.fn()
        } as unknown as jest.Mocked<DatePipe>

        snackBarMock = {
            open: jest.fn()
        } as unknown as jest.Mocked<MatSnackBar>

        dialogMock = {} as jest.Mocked<MatDialog>

        // Mock return values
        acbpReportsServiceMock.getAcbpContent.mockReturnValue(of({
            reports: { buckets: mockBuckets }
        }))

        acbpReportsServiceMock.getAcbpReportContnet.mockReturnValue(of(mockReportContent))

        datePipeMock.transform.mockImplementation((date, format) => {
            if (format === 'yyyy-MM-dd') return '2023-01-15'
            if (format === 'dd/MM/yyyy, h:mm a') return '15/01/2023, 12:30 PM'
            return date as string
        })

        // Create component instance with mocked dependencies
        component = new AcbpReportsComponent(
            dialogMock,
            configServiceMock,
            acbpReportsServiceMock,
            datePipeMock,
            snackBarMock
        )

        // Mock setTimeout
        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.clearAllMocks()
        jest.useRealTimers()
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize with the current user ID', () => {
        expect(component.currentUser).toBe('test-user-123')
    })

    it('should set up table configurations on init', () => {
        component.ngOnInit()
        expect(component.tabledata).toBeDefined()
        expect(component.tabledata.columns.length).toBe(3)
        expect(component.tabledata.actions.length).toBe(1)
    })

    it('should fetch ACBP content and initialize table data on ngOnInit', () => {
        datePipeMock.transform.mockReturnValueOnce('2023-01-15')
        component.ngOnInit()

        expect(acbpReportsServiceMock.getAcbpContent).toHaveBeenCalled()
        expect(acbpReportsServiceMock.getAcbpReportContnet).toHaveBeenCalledWith('2023-01-15')
        expect(component.buckets).toEqual(mockBuckets)
        jest.runAllTimers()
    })

    it('should update table data when getTableData is called', () => {
        component.buckets = mockBuckets
        component.getTableData('2023-01-15')

        expect(acbpReportsServiceMock.getAcbpReportContnet).toHaveBeenCalledWith('2023-01-15')
        expect(component.displayLoader).toBe(false)
        expect(component.reportSectionData.length).toBe(2) // Only enabled buckets

        // Verify the data structure
        expect(component.reportSectionData[0]).toEqual({
            reportName: 'Report 1',
            reportType: 'Detailed data report',
            lastUpdateOn: '15/01/2023, 12:30 PM',
            downloadUrl: '2023-01-15',
            bucketKey: 'report1.csv'
        })
    })

    it('should handle error when fetching report content', () => {
        component.buckets = mockBuckets
        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()

        acbpReportsServiceMock.getAcbpReportContnet.mockReturnValue(throwError(() => new Error('Test error')))
        component.getTableData('2023-01-15')

        expect(component.displayLoader).toBe(false)
        expect(consoleLogSpy).toHaveBeenCalled()
        expect(component.reportSectionData.length).toBe(0)
    })

    it('should update date and fetch new data when updateDate is called', () => {
        const mockEvent = { value: new Date('2023-02-10') }
        const spy = jest.spyOn(component, 'getTableData')

        component.updateDate(mockEvent)

        expect(spy).toHaveBeenCalledWith('2023-02-10')
    })

    it('should show snackbar when trying to download unavailable report', () => {
        const mockRow = { downloadUrl: '', bucketKey: 'report1.csv' }
        component.downloadFile({ row: mockRow })

        expect(snackBarMock.open).toHaveBeenCalledWith('Report is not available.', 'X', { duration: 2000 })
    })

    it('should download report when downloadFile is called with valid data', () => {
        const mockRow = { downloadUrl: '2023-01-15', bucketKey: 'report1.csv' }
        const spy = jest.spyOn(component, 'downloadReport')

        component.downloadFile({ row: mockRow })

        expect(spy).toHaveBeenCalledWith(mockRow)
    })

    it('should create correct download URL and initiate download', async () => {
        const mockRow = { downloadUrl: '2023-01-15', bucketKey: 'report1.csv' }

        await component.downloadReport(mockRow)

        const expectedUrl = 'http://test-path/apis/proxies/v8/storage/v1/spvReport/report1/2023-01-15/report1.csv'
        expect(xhrMock.open).toHaveBeenCalledWith('GET', expectedUrl)
        expect(xhrMock.send).toHaveBeenCalled()

        // Simulate XHR completion
        xhrMock.setReadyState(4)

        expect(window.location.href).toBe(expectedUrl)
    })

    it('should not update window.location if XHR fails', async () => {
        const mockRow = { downloadUrl: '2023-01-15', bucketKey: 'report1.csv' }
        window.location.href = 'initial-url'

        await component.downloadReport(mockRow)

        // Simulate XHR failure
        xhrMock.setStatus(404)
        xhrMock.setReadyState(4)

        expect(window.location.href).toBe('initial-url')
    })

    it('should not update window.location if XHR is not complete', async () => {
        const mockRow = { downloadUrl: '2023-01-15', bucketKey: 'report1.csv' }
        window.location.href = 'initial-url'

        await component.downloadReport(mockRow)

        // Simulate XHR in progress
        xhrMock.setReadyState(2)

        expect(window.location.href).toBe('initial-url')
    })
})