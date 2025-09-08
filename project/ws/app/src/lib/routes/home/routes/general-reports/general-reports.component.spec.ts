import { GeneralReportsComponent } from './general-reports.component'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { GeneralReportsService } from './general-reports.service'
import { DatePipe } from '@angular/common'
import { of, throwError } from 'rxjs'
import { sectorConstants } from '../sectors/sectors-constats.model'
import _ from 'lodash'

describe('GeneralReportsComponent', () => {
    let component: GeneralReportsComponent
    let mockDialog: MatDialog
    let mockConfigSvc: ConfigurationsService
    let mockGeneralReportsService: jest.Mocked<GeneralReportsService> // Use jest.Mocked for correct typing
    let mockDatePipe: DatePipe
    let mockSnackBar: MatSnackBar

    beforeEach(() => {
        // Mock services
        mockDialog = { open: jest.fn() } as unknown as MatDialog
        mockConfigSvc = { userProfile: { userId: 'testUser' } } as unknown as ConfigurationsService

        // Mock GeneralReportsService methods as jest.fn()
        mockGeneralReportsService = {
            getContent: jest.fn(),
            getReportContnet: jest.fn(),
        } as any // Correctly type the mocked service

        mockDatePipe = { transform: jest.fn() } as unknown as DatePipe
        mockSnackBar = { open: jest.fn() } as unknown as MatSnackBar

        // Initialize the component
        component = new GeneralReportsComponent(
            mockDialog,
            mockConfigSvc,
            mockGeneralReportsService,
            mockDatePipe,
            mockSnackBar,
        )
    })

    it('should initialize with correct data', () => {
        const mockBuckets = [
            { key: 'bucket1', name: 'Report 1', enable: true },
            { key: 'bucket2', name: 'Report 2', enable: false },
        ]
        mockGeneralReportsService.getContent.mockReturnValue(of({ reports: { buckets: mockBuckets } }))

        const mockTodayDate = new Date()
        const mockMaxDate = new Date()
        // mockDatePipe.transform.mockReturnValue('2025-02-25')

        component.ngOnInit()

        // Verify method calls
        expect(mockGeneralReportsService.getContent).toHaveBeenCalled()
        expect(component.todayDate).toEqual(mockTodayDate)
        expect(component.maxDate).toEqual(mockMaxDate)
    })

    it('should populate table data correctly when reports are fetched', () => {
        const mockBuckets = [
            { key: 'bucket1', name: 'Report 1', enable: true },
            { key: 'bucket2', name: 'Report 2', enable: false },
        ]
        mockGeneralReportsService.getContent.mockReturnValue(of({ reports: { buckets: mockBuckets } }))
        mockGeneralReportsService.getReportContnet.mockReturnValue(of({
            bucket1: { lastModified: new Date() },
            bucket2: { lastModified: new Date() }
        }))

        component.ngOnInit()

        // Check that table data is populated
        expect(component.reportSectionData.length).toBe(1) // Only bucket1 is enabled
        expect(component.reportSectionData[0].reportName).toBe('Report 1')
    })

    it('should handle error when getContent fails', () => {
        mockGeneralReportsService.getContent.mockReturnValue(throwError({ statusText: 'Error' }))

        component.ngOnInit()

        expect(mockSnackBar.open).toHaveBeenCalledWith('Error', 'X', { duration: sectorConstants.duration })
    })

    it('should update table data when date is changed', () => {
        const mockBuckets = [
            { key: 'bucket1', name: 'Report 1', enable: true },
        ]
        mockGeneralReportsService.getContent.mockReturnValue(of({ reports: { buckets: mockBuckets } }))
        mockGeneralReportsService.getReportContnet.mockReturnValue(of({
            bucket1: { lastModified: new Date() },
        }))

        component.updateDate({ value: '2025-02-25' })

        expect(mockGeneralReportsService.getReportContnet).toHaveBeenCalledWith('2025-02-25')
    })

    it('should handle error when getReportContnet fails', () => {
        mockGeneralReportsService.getReportContnet.mockReturnValue(throwError({ statusText: 'Error' }))

        component.getTableData('2025-02-25')

        expect(mockSnackBar.open).toHaveBeenCalledWith('Error', 'X', { duration: sectorConstants.duration })
    })

    it('should call downloadReport when report is available', () => {
        const row = { downloadUrl: 'some-url', bucketKey: 'bucket1.zip' }
        const downloadSpy = jest.spyOn(component, 'downloadReport')

        component.downloadFile({ row })

        expect(downloadSpy).toHaveBeenCalledWith(row)
    })

    it('should show snackbar when report is not available to download', () => {
        const row = { downloadUrl: '' }

        component.downloadFile({ row })

        expect(mockSnackBar.open).toHaveBeenCalledWith('Report is not available.', 'X', { duration: sectorConstants.duration })
    })
})
