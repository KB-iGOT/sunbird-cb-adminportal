import { AllRequestComponent } from './all-request.component'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Router } from '@angular/router'
import { RequestServiceService } from '../request-service.service'
import { of } from 'rxjs'

jest.mock('@angular/router')
jest.mock('@angular/material/dialog')
jest.mock('@angular/material/snack-bar')
jest.mock('../request-service.service')

describe('AllRequestComponent', () => {
    let component: AllRequestComponent
    let mockDialog: MatDialog
    let mockSnackBar: MatSnackBar
    let mockRouter: Router
    let mockRequestService: RequestServiceService

    beforeEach(() => {
        mockDialog = new MatDialog(null as any, null as any, null as any, null as any, null as any, null as any, null as any, null as any) as unknown as MatDialog
        mockSnackBar = new MatSnackBar(null as any, null as any, null as any, null as any, null as any, null as any) as unknown as MatSnackBar
        mockRouter = {
            navigate: jest.fn(),
        } as unknown as Router
        mockRequestService = {
            getRequestList: jest.fn(),
            markAsInvalid: jest.fn(),
        } as unknown as RequestServiceService

        component = new AllRequestComponent(
            {} as any, // DomSanitizer
            mockRouter,
            mockRequestService,
            mockSnackBar,
            mockDialog,
        )
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should call getRequestList on ngOnInit', () => {
        const spy = jest.spyOn(component, 'getRequestList')
        component.ngOnInit()
        expect(spy).toHaveBeenCalled()
    })

    it('should set statusCards correctly in getStatusCount', () => {
        // const mockResponse = {
        //     facets: {
        //         status: [
        //             { value: 'Assigned', count: 5 },
        //             { value: 'Invalid', count: 3 },
        //         ],
        //     },
        // }
        //mockRequestService.getRequestList.mockReturnValue(of(mockResponse))

        component.getStatusCount()

        expect(component.statusCards.length).toBe(5)
        expect(component.statusCards).toEqual(expect.arrayContaining([
            expect.objectContaining({ value: 'Assigned', count: 5 }),
            expect.objectContaining({ value: 'Invalid', count: 3 }),
        ]))
    })

    it('should call handleClick and open assign popup when status is not InProgress', () => {
        const mockItem = { status: 'Assigned' }
        const spy = jest.spyOn(component, 'openAssignlistPopup')

        component.handleClick(mockItem)

        expect(spy).toHaveBeenCalledWith(mockItem)
    })

    it('should not call openAssignlistPopup if status is InProgress', () => {
        const mockItem = { status: 'InProgress' }
        const spy = jest.spyOn(component, 'openAssignlistPopup')

        component.handleClick(mockItem)

        expect(spy).not.toHaveBeenCalled()
    })

    it('should navigate on openAssignlistPopup after dialog is closed', () => {
        const mockItem = { demand_id: 123 }
        const spyOpenDialog = jest.spyOn(mockDialog, 'open').mockReturnValue({
            afterClosed: () => of({ data: 'confirmed' }),
        } as any)

        const spyGetRequestList = jest.spyOn(component, 'getRequestList')
        const spySnackBar = jest.spyOn(mockSnackBar, 'open')

        component.openAssignlistPopup(mockItem)

        expect(spyOpenDialog).toHaveBeenCalled()
        expect(spyGetRequestList).toHaveBeenCalled()
        expect(spySnackBar).toHaveBeenCalledWith('Assigned submitted Successfully')
    })

    it('should call invalidContent when confirmation popup returns "confirmed"', () => {
        const mockItem = { demand_id: 123 }
        const spyConfirmationDialog = jest.spyOn(mockDialog, 'open').mockReturnValue({
            afterClosed: () => of('confirmed'),
        } as any)
        const spyInvalidContent = jest.spyOn(component, 'invalidContent')

        component.showConformationPopUp(mockItem, 'invalidContent')

        expect(spyConfirmationDialog).toHaveBeenCalled()
        expect(spyInvalidContent).toHaveBeenCalledWith(mockItem)
    })

    it('should sanitize html correctly', () => {
        const dirtyHtml = '<div><script>alert("XSS")</script></div>'
        const sanitizedHtml = component.sanitizeHtml(dirtyHtml)
        expect(sanitizedHtml).toBeTruthy()
    })

    it('should return correct CSS class for status', () => {
        expect(component.getStatusClass('Assigned')).toBe('status-assigned')
        expect(component.getStatusClass('Invalid')).toBe('status-invalid')
        expect(component.getStatusClass('Unassigned')).toBe('status-unassigned')
        expect(component.getStatusClass('Fulfill')).toBe('status-fullfill')
        expect(component.getStatusClass('InProgress')).toBe('status-inprogress')
        expect(component.getStatusClass('Unknown')).toBe('')
    })
})
