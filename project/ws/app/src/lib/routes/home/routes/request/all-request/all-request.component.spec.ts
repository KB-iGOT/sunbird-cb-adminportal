import { DomSanitizer } from '@angular/platform-browser'
import { Router } from '@angular/router'
import { of } from 'rxjs'
import { AllRequestComponent, statusValue } from './all-request.component'
import { RequestServiceService } from '../request-service.service'
import { AssignListPopupComponent } from '../assign-list-popup/assign-list-popup.component'
import { SingleAssignPopupComponent } from '../single-assign-popup/single-assign-popup.component'
import { ConfirmationPopupComponent } from '../confirmation-popup/confirmation-popup.component'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'

describe('AllRequestComponent', () => {
    let component: AllRequestComponent
    let requestService: jest.Mocked<RequestServiceService>
    let router: jest.Mocked<Router>
    let dialog: jest.Mocked<MatDialog>
    let snackBar: jest.Mocked<MatSnackBar>
    let sanitizer: jest.Mocked<DomSanitizer>

    const mockRequestService = {
        getRequestList: jest.fn(),
        markAsInvalid: jest.fn(),
    }

    const mockRouter = {
        navigate: jest.fn(),
    }

    const mockDialog = {
        open: jest.fn(),
    }

    const mockSnackBar = {
        open: jest.fn(),
    }

    const mockSanitizer = {
        bypassSecurityTrustHtml: jest.fn(),
    }

    beforeEach(() => {
        requestService = mockRequestService as unknown as jest.Mocked<RequestServiceService>
        router = mockRouter as unknown as jest.Mocked<Router>
        dialog = mockDialog as unknown as jest.Mocked<MatDialog>
        snackBar = mockSnackBar as unknown as jest.Mocked<MatSnackBar>
        sanitizer = mockSanitizer as unknown as jest.Mocked<DomSanitizer>

        component = new AllRequestComponent(
            sanitizer,
            router,
            requestService,
            snackBar,
            dialog
        )
    })

    describe('ngOnInit', () => {
        it('should call getRequestList and getStatusCount on initialization', () => {
            const getRequestListSpy = jest.spyOn(component, 'getRequestList')
            const getStatusCountSpy = jest.spyOn(component, 'getStatusCount')

            component.ngOnInit()

            expect(getRequestListSpy).toHaveBeenCalled()
            expect(getStatusCountSpy).toHaveBeenCalled()
        })
    })

    describe('getStatusCount', () => {
        it('should update statusCards with facets data', () => {
            const mockResponse = {
                facets: {
                    status: [
                        { value: 'Assigned', count: 5 },
                        { value: 'Unassigned', count: 3 }
                    ]
                }
            }

            requestService.getRequestList.mockReturnValue(of(mockResponse))

            component.getStatusCount()

            expect(component.statusCards).toContainEqual(
                expect.objectContaining({
                    value: 'Assigned',
                    count: 5,
                    message: 'Total number of requests assigned'
                })
            )
        })

        it('should add missing status values with count 0', () => {
            const mockResponse = {
                facets: {
                    status: [{ value: 'Assigned', count: 5 }]
                }
            }

            requestService.getRequestList.mockReturnValue(of(mockResponse))

            component.getStatusCount()

            expect(component.statusCards).toContainEqual(
                expect.objectContaining({
                    value: 'Invalid',
                    count: 0
                })
            )
        })
    })

    describe('getRequestList', () => {
        it('should update requestListData and dataSource', () => {
            const mockResponse = {
                data: [
                    {
                        demand_id: '1',
                        status: 'Assigned',
                        assignedProvider: { providerName: 'Provider 1' }
                    }
                ],
                totalCount: 1
            }

            requestService.getRequestList.mockReturnValue(of(mockResponse))

            component.getRequestList()

            expect(component.requestListData).toEqual(mockResponse.data)
            expect(component.requestCount).toBe(mockResponse.totalCount)
            expect(component.dataSource).toBeDefined()
        })
    })

    describe('getStatusClass', () => {
        it('should return correct status class', () => {
            expect(component.getStatusClass('Unassigned')).toBe('status-unassigned')
            expect(component.getStatusClass('Assigned')).toBe('status-assigned')
            expect(component.getStatusClass('Invalid')).toBe('status-invalid')
            expect(component.getStatusClass('Fulfill')).toBe('status-fullfill')
            expect(component.getStatusClass('InProgress')).toBe('status-inprogress')
            expect(component.getStatusClass('Unknown')).toBe('')
        })
    })

    describe('handleClick', () => {
        it('should call onClickMenu for valid status', () => {
            const mockElement = {
                status: statusValue.Assigned
            }
            const onClickMenuSpy = jest.spyOn(component, 'onClickMenu')

            component.handleClick(mockElement)

            expect(onClickMenuSpy).toHaveBeenCalledWith(mockElement, 'assignContent')
        })

        it('should not call onClickMenu for invalid status', () => {
            const mockElement = {
                status: statusValue.Inprogress
            }
            const onClickMenuSpy = jest.spyOn(component, 'onClickMenu')

            component.handleClick(mockElement)

            expect(onClickMenuSpy).not.toHaveBeenCalled()
        })
    })

    describe('onClickMenu', () => {
        it('should navigate to request details for viewContent action', () => {
            const mockItem = { demand_id: '1' }

            component.onClickMenu(mockItem, 'viewContent')

            expect(router.navigate).toHaveBeenCalledWith(
                ['/app/home/request-details'],
                { queryParams: { id: '1', name: 'view' } }
            )
        })

        it('should open confirmation popup for invalidContent action', () => {
            const mockItem = { demand_id: '1' }

            component.onClickMenu(mockItem, 'invalidContent')

            expect(dialog.open).toHaveBeenCalledWith(
                ConfirmationPopupComponent,
                expect.any(Object)
            )
        })

        it('should handle reassign for broadcast request type', () => {
            const mockItem = {
                demand_id: '1',
                requestType: 'Broadcast'
            }

            component.onClickMenu(mockItem, 'reAssignContent')

            expect(dialog.open).toHaveBeenCalledWith(
                AssignListPopupComponent,
                expect.any(Object)
            )
        })

        it('should handle reassign for non-broadcast request type', () => {
            const mockItem = {
                demand_id: '1',
                requestType: 'Regular'
            }

            component.onClickMenu(mockItem, 'reAssignContent')

            expect(dialog.open).toHaveBeenCalledWith(
                SingleAssignPopupComponent,
                expect.any(Object)
            )
        })
    })

    describe('invalidContent', () => {
        it('should call markAsInvalid and update request list', () => {
            const mockRow = { demand_id: '1' }
            const mockResponse = { success: true }

            requestService.markAsInvalid.mockReturnValue(of(mockResponse))
            jest.useFakeTimers()

            component.invalidContent(mockRow)

            expect(requestService.markAsInvalid).toHaveBeenCalledWith({
                demand_id: '1',
                newStatus: 'Invalid'
            })
            expect(snackBar.open).toHaveBeenCalledWith('Marked as Invalid')

            jest.advanceTimersByTime(1000)
            expect(requestService.getRequestList).toHaveBeenCalled()
        })
    })

    describe('onChangePage', () => {
        it('should update page parameters and refresh request list', () => {
            const mockEvent = {
                pageIndex: 1,
                pageSize: 20
            }

            component.onChangePage(mockEvent)

            expect(component.pageNo).toBe(1)
            expect(component.pageSize).toBe(20)
            expect(requestService.getRequestList).toHaveBeenCalled()
        })
    })
})