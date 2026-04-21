import { UIDiscussionPostComponent } from './discussion-post.component'
import { RejectPublishService } from '../reject-publish.service'
import { LoggerService } from '@sunbird-cb/utils-v2'
import { MatDialog } from '@angular/material/dialog'
import { of } from 'rxjs'
import { SimpleChange, SimpleChanges } from '@angular/core'
import { MatTableDataSource } from '@angular/material/table'

// Mock dependencies
jest.mock('../reject-publish.service')
jest.mock('@sunbird-cb/utils-v2')

describe('UIDiscussionPostComponent', () => {
    let component: UIDiscussionPostComponent
    let rejectPublishService: jest.Mocked<RejectPublishService>
    let loggerService: jest.Mocked<LoggerService>
    let dialogMock: jest.Mocked<MatDialog>

    // Sample data for testing
    const mockTableData = { headers: ['id', 'text', 'timestamp'] }
    const mockData = [
        { id: '1', text: 'Test post 1', timestamp: '1612345678', profaneString: 'bad', published: false },
        { id: '2', text: 'Test post 2', timestamp: '1612345679', profaneString: 'worse', published: false }
    ]
    const mockCategories = { payload: ['Category1', 'Category2'] }

    beforeEach(() => {
        // Create mocks
        rejectPublishService = {
            getCategories: jest.fn().mockReturnValue(of(mockCategories)),
            publishData: jest.fn().mockReturnValue(of({ success: true }))
        } as unknown as jest.Mocked<RejectPublishService>

        loggerService = {
            info: jest.fn()
        } as unknown as jest.Mocked<LoggerService>

        dialogMock = {
            open: jest.fn().mockReturnValue({
                afterClosed: jest.fn().mockReturnValue(of({
                    id: '1',
                    profaneStrings: ['bad'],
                    category: { Category1: true, Category2: false },
                    comment: 'This is inappropriate'
                }))
            })
        } as unknown as jest.Mocked<MatDialog>

        // Create component instance with mocked dependencies
        component = new UIDiscussionPostComponent(loggerService, rejectPublishService, dialogMock)

        // Mock MatPaginator
        component.paginator = {
            firstPage: jest.fn()
        } as any

        // Initialize with test data
        component.tableData = mockTableData
        // component.data = mockData
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize with correct default values', () => {
        expect(component.AI).toBe('AI_flagged')
        expect(component.USER).toBe('User_flagged')
        expect(component.SYSTEM).toBe('system_flagged')
        expect(component.content).toBe('TEXT')
        expect(component.pageSize).toBe(20)
        expect(component.pageSizeOptions).toEqual([20, 30, 40])
        expect(component.needCreate).toBe(true)
    })

    it('should initialize dataSource, paginator and fetch categories on ngOnInit', () => {
        // Invoke ngOnInit lifecycle hook
        component.ngOnInit()

        // Verify dataSource initialization
        expect(component.dataSource.data).toBe(mockData)

        // Verify category fetching
        expect(rejectPublishService.getCategories).toHaveBeenCalled()
        expect(component.category).toEqual(mockCategories.payload)
    })

    it('should update data source when input changes', () => {
        // Create SimpleChanges object
        const changes: SimpleChanges = {
            tableData: new SimpleChange(null, mockTableData, true),
            data: new SimpleChange(null, mockData, true)
        }

        // Invoke ngOnChanges lifecycle hook
        component.ngOnChanges(changes)

        // Verify changes
        expect(component.tableData).toBe(mockTableData)
        expect(component.dataSource.data).toBe(mockData)
        expect(component.length).toBe(mockData.length)
        expect(component.paginator.firstPage).toHaveBeenCalled()
    })

    it('should get correct short name from full name', () => {
        expect(component.getShortName('John Doe')).toBe('JD')
        expect(component.getShortName('Jane Mary Smith')).toBe('JMS')
    })

    it('should return correct timeframe for hour', () => {
        expect(component.timeframe(0)).toBe('AM')
        expect(component.timeframe(11)).toBe('AM')
        expect(component.timeframe(12)).toBe('PM')
        expect(component.timeframe(23)).toBe('PM')
    })

    it('should convert timestamp to formatted date string', () => {
        // Let's use a fixed date for testing
        // June 15, 2021 10:30 AM
        const timestamp = 1623746400000
        const result = component.convertTimestamptoDate(timestamp)

        // This would produce "15 Jun, 2021 - 10:30 AM"
        expect(result).toContain('Jun')
        expect(result).toContain('2021')
        expect(result.includes('AM') || result.includes('PM')).toBeTruthy()
    })

    it('should publish data correctly', () => {
        // Setup spy on dataSource
        component.dataSource = new MatTableDataSource(mockData)

        // Call publish method
        component.publish('1')

        // Verify correct item was removed from data source
        expect(component.dataSource.data.length).toBe(mockData.length - 1)
        expect(component.dataSource.data.some((item: any) => item.id === '1')).toBeFalsy()

        // Verify service was called with correct data
        expect(rejectPublishService.publishData).toHaveBeenCalledWith(
            expect.objectContaining({
                feedbackList: expect.arrayContaining([
                    expect.objectContaining({
                        id: '1',
                        published: true,
                        classification: 'SFW'
                    })
                ])
            })
        )

        // Verify logger was called
        expect(loggerService.info).toHaveBeenCalled()
    })

    it('should open dialog and process rejection correctly', () => {
        // Setup dataSource
        component.dataSource = new MatTableDataSource(mockData)

        // Call openDialog method
        component.openDialog('1', 'Test post 1', 'bad')

        // Verify dialog was opened with correct params
        expect(dialogMock.open).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                data: expect.objectContaining({
                    id: '1',
                    text: 'Test post 1',
                    profaneString: 'bad'
                })
            })
        )

        // Verify item was removed from data source
        expect(component.dataSource.data.length).toBe(mockData.length - 1)

        // Verify service was called with correctly transformed data
        expect(rejectPublishService.publishData).toHaveBeenCalledWith(
            expect.objectContaining({
                feedbackList: expect.arrayContaining([
                    expect.objectContaining({
                        id: '1',
                        classification: 'NSFW',
                        reason: ['Category1']
                    })
                ])
            })
        )
    })

    it('should log data in openDialog2', () => {
        component.openDialog2('1', 'Test text', 'bad word')
        expect(loggerService.info).toHaveBeenCalledWith('Test text', '1', 'bad word')
    })
})