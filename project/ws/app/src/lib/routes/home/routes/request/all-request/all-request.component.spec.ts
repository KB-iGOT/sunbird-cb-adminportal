import { AllRequestComponent, statusValue } from './all-request.component'
import { MatTableDataSource } from '@angular/material/table'
import { of } from 'rxjs'

describe('AllRequestComponent', () => {
    let component: AllRequestComponent
    let mockSanitizer: any
    let mockRouter: any
    let mockRequestService: any
    let mockSnackBar: any
    let mockDialog: any

    beforeEach(() => {
        // Mock DomSanitizer
        mockSanitizer = {
            bypassSecurityTrustHtml: jest.fn().mockReturnValue('sanitized-html')
        }

        // Mock Router
        mockRouter = {
            navigate: jest.fn()
        }

        // Mock RequestServiceService
        mockRequestService = {
            getRequestList: jest.fn(),
            markAsInvalid: jest.fn()
        }

        // Mock MatSnackBar
        mockSnackBar = {
            open: jest.fn()
        }

        // Mock MatDialog
        mockDialog = {
            open: jest.fn().mockReturnValue({
                afterClosed: jest.fn().mockReturnValue(of({ data: 'confirmed' }))
            })
        }

        // Create component instance
        component = new AllRequestComponent(
            mockSanitizer,
            mockRouter,
            mockRequestService,
            mockSnackBar,
            mockDialog
        )
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('Constructor and Initialization', () => {
        it('should create component with initial values', () => {
            expect(component).toBeDefined()
            expect(component.sideNavBarOpenedMain).toBe(true)
            expect(component.screenSizeIsLtMedium).toBe(false)
            expect(component.pageNo).toBe(0)
            expect(component.pageSize).toBe(10)
            expect(component.requestListData).toEqual([])
            expect(component.isUnassigned).toBe(false)
            expect(component.isAssigned).toBe(false)
            expect(component.inProgress).toBe(false)
            expect(component.invalid).toBe(false)
            expect(component.displayedColumns).toEqual([
                'RequestId', 'title', 'requestedBy', 'requestType',
                'requestStatus', 'assignee', 'requestedOn', 'interests', 'action'
            ])
            expect(component.statusCards).toEqual([])
            expect(component.statusKey).toBe(statusValue)
        })
    })

    describe('ngOnInit', () => {
        it('should call getRequestList and getStatusCount', () => {
            jest.spyOn(component, 'getRequestList').mockImplementation()
            jest.spyOn(component, 'getStatusCount').mockImplementation()

            component.ngOnInit()

            expect(component.getRequestList).toHaveBeenCalled()
            expect(component.getStatusCount).toHaveBeenCalled()
        })
    })

    describe('sanitizeHtml', () => {
        it('should sanitize HTML content', () => {
            const htmlContent = '<div>test</div>'

            const result = component.sanitizeHtml(htmlContent)

            expect(mockSanitizer.bypassSecurityTrustHtml).toHaveBeenCalledWith(htmlContent)
            expect(result).toBe('sanitized-html')
        })
    })

    describe('getStatusCount', () => {
        it('should get status count and process facets', () => {
            const mockResponse = {
                facets: {
                    status: [
                        { value: 'Assigned', count: 5 },
                        { value: 'Invalid', count: 2 }
                    ]
                }
            }
            mockRequestService.getRequestList.mockReturnValue(of(mockResponse))

            component.getStatusCount()

            expect(mockRequestService.getRequestList).toHaveBeenCalledWith({
                filterCriteriaMap: {},
                requestedFields: ['status'],
                orderBy: 'createdOn',
                orderDirection: 'ASC',
                facets: ['status']
            })

            expect(component.statusCards).toEqual([
                { value: 'Assigned', count: 5, message: 'Total number of requests assigned' },
                { value: 'Invalid', count: 2, message: 'Total number of Invalid requests' },
                { value: 'Unassigned', count: 0 },
                { value: 'InProgress', count: 0 },
                { value: 'Fulfill', count: 0 }
            ])
        })

        it('should handle empty facets response', () => {
            const mockResponse = {}
            mockRequestService.getRequestList.mockReturnValue(of(mockResponse))

            component.getStatusCount()

            expect(mockRequestService.getRequestList).toHaveBeenCalled()
        })

        it('should handle missing status facets', () => {
            const mockResponse = { facets: {} }
            mockRequestService.getRequestList.mockReturnValue(of(mockResponse))

            component.getStatusCount()

            expect(mockRequestService.getRequestList).toHaveBeenCalled()
        })
    })

    describe('getRequestList', () => {
        it('should get request list and process data', () => {
            const mockResponse = {
                data: [
                    {
                        demand_id: 1,
                        status: 'Unassigned',
                        assignedProvider: { providerName: 'Provider 1' }
                    },
                    {
                        demand_id: 2,
                        status: 'Assigned',
                        assignedProvider: { providerName: 'Provider 2' }
                    },
                    {
                        demand_id: 3,
                        status: 'Inprogress'
                    },
                    {
                        demand_id: 4,
                        status: 'invalid'
                    }
                ],
                totalCount: 4
            }
            mockRequestService.getRequestList.mockReturnValue(of(mockResponse))

            component.getRequestList()

            expect(mockRequestService.getRequestList).toHaveBeenCalledWith({
                filterCriteriaMap: {},
                requestedFields: [],
                facets: [],
                pageNumber: 0,
                pageSize: 10,
                orderBy: 'createdOn',
                orderDirection: 'ASC'
            })

            expect(component.requestListData).toEqual(mockResponse.data)
            expect(component.requestCount).toBe(4)
            expect(component.isUnassigned).toBe(true)
            expect(component.isAssigned).toBe(true)
            expect(component.inProgress).toBe(true)
            expect(component.invalid).toBe(true)
            expect(component.dataSource).toBeInstanceOf(MatTableDataSource)
        })

        it('should handle empty data response', () => {
            const mockResponse = {}
            mockRequestService.getRequestList.mockReturnValue(of(mockResponse))

            component.getRequestList()

            expect(mockRequestService.getRequestList).toHaveBeenCalled()
        })
    })

    describe('getStatusClass', () => {
        it('should return correct CSS class for each status', () => {
            expect(component.getStatusClass('Unassigned')).toBe('status-unassigned')
            expect(component.getStatusClass('Assigned')).toBe('status-assigned')
            expect(component.getStatusClass('Invalid')).toBe('status-invalid')
            expect(component.getStatusClass('Fulfill')).toBe('status-fullfill')
            expect(component.getStatusClass('InProgress')).toBe('status-inprogress')
            expect(component.getStatusClass('Unknown')).toBe('')
        })
    })

    describe('handleClick', () => {
        it('should call onClickMenu when status is valid for assignment', () => {
            jest.spyOn(component, 'onClickMenu').mockImplementation()
            const element = { status: 'Unassigned' }

            component.handleClick(element)

            expect(component.onClickMenu).toHaveBeenCalledWith(element, 'assignContent')
        })

        it('should not call onClickMenu for InProgress status', () => {
            jest.spyOn(component, 'onClickMenu').mockImplementation()
            const element = { status: 'InProgress' }

            component.handleClick(element)

            expect(component.onClickMenu).not.toHaveBeenCalled()
        })

        it('should not call onClickMenu for Invalid status (statusKey.invalid)', () => {
            jest.spyOn(component, 'onClickMenu').mockImplementation()
            const element = { status: statusValue.invalid } // 'Invalid'

            component.handleClick(element)

            expect(component.onClickMenu).not.toHaveBeenCalled()
        })

        it('should not call onClickMenu for fulfill status', () => {
            jest.spyOn(component, 'onClickMenu').mockImplementation()
            const element = { status: 'Fulfill' }

            component.handleClick(element)

            expect(component.onClickMenu).not.toHaveBeenCalled()
        })

        it('should not call onClickMenu when status is empty', () => {
            jest.spyOn(component, 'onClickMenu').mockImplementation()
            const element = { status: '' }

            component.handleClick(element)

            expect(component.onClickMenu).not.toHaveBeenCalled()
        })

        it('should not call onClickMenu when status is undefined', () => {
            jest.spyOn(component, 'onClickMenu').mockImplementation()
            const element = {}

            component.handleClick(element)

            expect(component.onClickMenu).not.toHaveBeenCalled()
        })
    })

    describe('getPointerEventsStyle', () => {
        it('should return auto pointer events for valid statuses', () => {
            const element = { status: 'Unassigned' }
            const result = component.getPointerEventsStyle(element)
            expect(result).toEqual({ 'pointer-events': 'auto' })
        })

        it('should return none pointer events for InProgress status', () => {
            const element = { status: 'InProgress' }
            const result = component.getPointerEventsStyle(element)
            expect(result).toEqual({ 'pointer-events': 'none' })
        })

        it('should return none pointer events for Invalid status (statusKey.invalid)', () => {
            const element = { status: statusValue.invalid } // 'Invalid'
            const result = component.getPointerEventsStyle(element)
            expect(result).toEqual({ 'pointer-events': 'none' })
        })

        it('should return none pointer events for fulfill status', () => {
            const element = { status: 'Fulfill' }
            const result = component.getPointerEventsStyle(element)
            expect(result).toEqual({ 'pointer-events': 'none' })
        })
    })

    describe('onClickMenu', () => {
        beforeEach(() => {
            jest.spyOn(component, 'showConformationPopUp').mockImplementation()
            jest.spyOn(component, 'openAssignlistPopup').mockImplementation()
            jest.spyOn(component, 'openSingleReassignPopup').mockImplementation()
        })

        it('should navigate to request details for viewContent action', () => {
            const item = { demand_id: 123 }

            component.onClickMenu(item, 'viewContent')

            expect(component.queryParams).toEqual({ id: 123, name: 'view' })
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/request-details'], { queryParams: component.queryParams })
        })

        it('should show confirmation popup for invalidContent action', () => {
            const item = { demand_id: 123 }

            component.onClickMenu(item, 'invalidContent')

            expect(component.showConformationPopUp).toHaveBeenCalledWith(item, 'invalidContent')
        })

        it('should open assign list popup for assignContent action', () => {
            const item = { demand_id: 123 }

            component.onClickMenu(item, 'assignContent')

            expect(component.openAssignlistPopup).toHaveBeenCalledWith(item)
        })

        it('should open assign list popup for reAssignContent with Broadcast type', () => {
            const item = { demand_id: 123, requestType: 'Broadcast' }

            component.onClickMenu(item, 'reAssignContent')

            expect(component.openAssignlistPopup).toHaveBeenCalledWith(item)
        })

        it('should open single reassign popup for reAssignContent with non-Broadcast type', () => {
            const item = { demand_id: 123, requestType: 'Individual' }

            component.onClickMenu(item, 'reAssignContent')

            expect(component.openSingleReassignPopup).toHaveBeenCalledWith(item)
        })

        it('should navigate to request details for copyContent action', () => {
            const item = { demand_id: 123 }

            component.onClickMenu(item, 'copyContent')

            expect(component.queryParams).toEqual({ id: 123, name: 'copy' })
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/request-details'], { queryParams: component.queryParams })
        })
    })

    describe('openSingleReassignPopup', () => {
        it('should open single reassign popup and handle success response', (done) => {
            const item = { demand_id: 123 }
            const mockDialogRef = {
                afterClosed: jest.fn().mockReturnValue(of({ data: 'confirmed' }))
            }
            mockDialog.open.mockReturnValue(mockDialogRef)
            jest.spyOn(component, 'getRequestList').mockImplementation()

            component.openSingleReassignPopup(item)

            expect(mockDialog.open).toHaveBeenCalledWith(expect.any(Function), {
                disableClose: false,
                width: '90%',
                height: '70vh',
                data: item,
                autoFocus: false
            })

            setTimeout(() => {
                expect(component.getRequestList).toHaveBeenCalled()
                expect(mockSnackBar.open).toHaveBeenCalledWith('Re-assign submitted Successfully')
                done()
            }, 1100)
        })

        it('should handle cancelled response', () => {
            const item = { demand_id: 123 }
            const mockDialogRef = {
                afterClosed: jest.fn().mockReturnValue(of({ data: 'cancelled' }))
            }
            mockDialog.open.mockReturnValue(mockDialogRef)

            component.openSingleReassignPopup(item)

            expect(mockDialog.open).toHaveBeenCalled()
        })
    })

    describe('navigateToDetails', () => {
        it('should navigate to demand details form', () => {
            const id = 123

            component.navigateToDetails(id)

            expect(component.queryParams).toEqual({ id: 123, name: 'view' })
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/author/cbp/demand-details-form'], { queryParams: component.queryParams })
        })
    })

    describe('onChangePage', () => {
        it('should update pagination and reload data', () => {
            jest.spyOn(component, 'getRequestList').mockImplementation()
            const event = { pageIndex: 2, pageSize: 20 }

            component.onChangePage(event)

            expect(component.pageNo).toBe(2)
            expect(component.pageSize).toBe(20)
            expect(component.getRequestList).toHaveBeenCalled()
        })
    })

    describe('showConformationPopUp', () => {
        it('should show confirmation popup for invalidContent and handle confirmation', () => {
            const selectedRow = { demand_id: 123 }
            const mockDialogRef = {
                afterClosed: jest.fn().mockReturnValue(of('confirmed'))
            }
            mockDialog.open.mockReturnValue(mockDialogRef)
            jest.spyOn(component, 'invalidContent').mockImplementation()

            component.showConformationPopUp(selectedRow, 'invalidContent')

            expect(mockDialog.open).toHaveBeenCalledWith(expect.any(Function), {
                disableClose: true,
                data: {
                    type: 'conformation',
                    icon: 'radio_on',
                    title: 'Are you sure you want to mark this as invalid.',
                    subTitle: '',
                    primaryAction: 'Yes',
                    secondaryAction: 'No'
                },
                autoFocus: false
            })

            expect(component.invalidContent).toHaveBeenCalledWith(selectedRow)
        })

        it('should show confirmation popup for publishContent', () => {
            const selectedRow = { demand_id: 123 }
            const mockDialogRef = {
                afterClosed: jest.fn().mockReturnValue(of('cancelled'))
            }
            mockDialog.open.mockReturnValue(mockDialogRef)

            component.showConformationPopUp(selectedRow, 'publishContent')

            expect(mockDialog.open).toHaveBeenCalledWith(expect.any(Function), {
                disableClose: true,
                data: {
                    type: 'conformation',
                    icon: 'radio_on',
                    title: 'Are you sure you want to publish the plan?',
                    subTitle: '',
                    primaryAction: 'Yes',
                    secondaryAction: 'No'
                },
                autoFocus: false
            })
        })

        it('should handle cancellation', () => {
            const selectedRow = { demand_id: 123 }
            const mockDialogRef = {
                afterClosed: jest.fn().mockReturnValue(of('cancelled'))
            }
            mockDialog.open.mockReturnValue(mockDialogRef)
            jest.spyOn(component, 'invalidContent').mockImplementation()

            component.showConformationPopUp(selectedRow, 'invalidContent')

            expect(component.invalidContent).not.toHaveBeenCalled()
        })
    })

    describe('invalidContent', () => {
        it('should mark content as invalid and reload data', (done) => {
            const row = { demand_id: 123 }
            const mockResponse = { success: true }
            mockRequestService.markAsInvalid.mockReturnValue(of(mockResponse))
            jest.spyOn(component, 'getRequestList').mockImplementation()

            component.invalidContent(row)

            expect(mockRequestService.markAsInvalid).toHaveBeenCalledWith({
                demand_id: 123,
                newStatus: 'Invalid'
            })

            setTimeout(() => {
                expect(component.invalidRes).toBe(mockResponse)
                expect(component.getRequestList).toHaveBeenCalled()
                expect(mockSnackBar.open).toHaveBeenCalledWith('Marked as Invalid')
                done()
            }, 1100)
        })

        it('should call markAsInvalid service', () => {
            const row = { demand_id: 123 }
            mockRequestService.markAsInvalid.mockReturnValue(of(null)) // null is falsy, skip inner block

            component.invalidContent(row)
            expect(mockRequestService.markAsInvalid).toHaveBeenCalled()
        })
    })

    describe('openAssignlistPopup', () => {
        it('should open assign list popup and handle success response', (done) => {
            const item = { demand_id: 123 }
            const mockDialogRef = {
                afterClosed: jest.fn().mockReturnValue(of({ data: 'confirmed' }))
            }
            mockDialog.open.mockReturnValue(mockDialogRef)
            jest.spyOn(component, 'getRequestList').mockImplementation()

            component.openAssignlistPopup(item)

            expect(mockDialog.open).toHaveBeenCalledWith(expect.any(Function), {
                disableClose: true,
                width: '90%',
                height: '70vh',
                data: item,
                autoFocus: false
            })

            setTimeout(() => {
                expect(component.getRequestList).toHaveBeenCalled()
                expect(mockSnackBar.open).toHaveBeenCalledWith('Assigned submitted Successfully')
                done()
            }, 1100)
        })

        it('should handle cancelled response', () => {
            const item = { demand_id: 123 }
            const mockDialogRef = {
                afterClosed: jest.fn().mockReturnValue(of({ data: 'cancelled' }))
            }
            mockDialog.open.mockReturnValue(mockDialogRef)

            component.openAssignlistPopup(item)

            expect(mockDialog.open).toHaveBeenCalled()
        })
    })
})