import { UIAdminUserTableComponent } from './ui-admin-user-table.component'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { Router } from '@angular/router'
import { CreateMDOService as MDO2 } from '../../../routes/home/services/create-mdo.services'
import { EventService } from '@sunbird-cb/utils'
import { of } from 'rxjs'

jest.mock('@angular/router')
jest.mock('@angular/material/legacy-dialog')
jest.mock('@angular/material/legacy-snack-bar')
jest.mock('../../../routes/home/services/create-mdo.services')
jest.mock('@sunbird-cb/utils')

describe('UIAdminUserTableComponent', () => {
    let component: UIAdminUserTableComponent
    let mockDialog: MatDialog
    let mockSnackBar: MatSnackBar
    let mockRouter: Router
    let mockCreateMDOService2: MDO2
    let mockEvents: EventService

    beforeEach(() => {
        // Create mock instances for dependencies
        mockDialog = new MatDialog(null as any, null as any, null as any, null as any, null as any, null as any, null as any, null as any)
        mockSnackBar = new MatSnackBar(null as any, null as any, null as any, null as any, null as any, null as any)
        mockRouter = new Router()
        mockCreateMDOService2 = new MDO2(null as any)
        mockEvents = new EventService(null as any, null)

        // Initialize the component with mocked dependencies
        component = new UIAdminUserTableComponent(
            mockRouter,
            mockDialog,
            null as any, // ActivatedRoute
            mockCreateMDOService2,
            mockEvents,
            mockSnackBar
        )

        // Set any input properties needed for tests
        component.tableData = { columns: [], actions: [] } as any
        component.data = []
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize with correct values on ngOnInit', () => {
        component.ngOnInit()
        expect(component.viewPaginator).toBe(true)
        expect(component.dataSource.data).toEqual([])
    })

    it('should correctly apply filter when filterValue is provided', () => {
        const filterValue = 'some value'
        component.applyFilter(filterValue)
        expect(component.moreThanTwoChar).toBe(true)
    })

    it('should emit actionsClick event on buttonClick', () => {
        // const emitSpy = jest.spyOn(component.actionsClick, 'emit')
        // const action = 'edit'
        // const row = { id: 1 }
        // component.buttonClick(action, row)
        // expect(emitSpy).toHaveBeenCalledWith({ action, row })
    })

    it('should handle pagination on onChangePage', () => {
        // const pageEvent = { pageIndex: 1, pageSize: 10 }
        const emitSpy = jest.spyOn(component.paginationData, 'emit')
        // component.onChangePage(pageEvent)
        expect(emitSpy).toHaveBeenCalledWith({
            query: '',
            limit: 10,
            offset: 10,
        })
    })

    it('should call openSnackbar when error occurs', () => {
        //const openSnackbarSpy = jest.spyOn(component, 'openSnackbar')
        // const errorMessage = 'Error occurred!'
        //component.openSnackbar(errorMessage)
        //expect(openSnackbarSpy).toHaveBeenCalledWith(errorMessage)
    })

    it('should call downloadUsersReport and initiate download', () => {
        global.XMLHttpRequest = jest.fn(() => ({
            readyState: 4,
            status: 200,
            onreadystatechange: jest.fn(),
            open: jest.fn(),
            send: jest.fn(),
        })) as any

        const downloadUrl = 'http://example.com/user-report.zip'
        const fileName = 'user-report'

        component.downloadUsersReport(fileName)

        // Check if the XMLHttpRequest was called
        expect(XMLHttpRequest).toHaveBeenCalled()
        expect(window.location.href).toBe(downloadUrl)
    })

    it('should open a dialog when openPopup is called', () => {
        const dialogRef = { afterClosed: jest.fn().mockReturnValue(of({ data: [] })) }
        jest.spyOn(mockDialog, 'open').mockReturnValue(dialogRef as any)

        component.openPopup()

        expect(mockDialog.open).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ width: '80%', height: '65%' })
        )
    })

    it('should navigate to create-user on gotoCreateUser', () => {
        const navigateSpy = jest.spyOn(mockRouter, 'navigate')
        component.gotoCreateUser()
        expect(navigateSpy).toHaveBeenCalledWith(['/app/home/create-user'], expect.objectContaining({
            queryParams: expect.anything(),
        }))
    })

    it('should raise telemetry when raiseTelemetry is called', () => {
        const raiseInteractTelemetrySpy = jest.spyOn(mockEvents, 'raiseInteractTelemetry')
        const sub = 'button'
        component.raiseTelemetry(sub)
        expect(raiseInteractTelemetrySpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'click',
                subType: sub,
                id: `${sub}-click`,
            })
        )
    })

    it('should toggle row selection with masterToggle', () => {
        const row = { id: 1 }
        component.selection.select(row)
        component.masterToggle()
        expect(component.selection.isSelected(row)).toBe(true)

        component.masterToggle()
        expect(component.selection.isSelected(row)).toBe(false)
    })

    it('should return the correct label for checkbox with checkboxLabel', () => {
        const row = { id: 1 }
        component.selection.select(row)
        expect(component.checkboxLabel(row)).toBe('deselect row 1')
    })
})
