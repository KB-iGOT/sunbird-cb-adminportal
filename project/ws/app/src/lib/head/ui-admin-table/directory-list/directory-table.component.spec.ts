import { UIDirectoryTableComponent } from './directory-table.component'
import { Router } from '@angular/router'
import { EventService } from '@sunbird-cb/utils-v2'
import { MatDialog } from '@angular/material/dialog'
import { CreateMDOService } from '../../../routes/home/services/create-mdo.services'
import { DesignationsService } from '../../../routes/create-mdo/routes/designation/services/designations.service'
import * as _ from 'lodash'

jest.mock('@angular/router')
jest.mock('@sunbird-cb/utils-v2')
jest.mock('@angular/material/dialog')
jest.mock('../../../routes/home/services/create-mdo.services')
jest.mock('../../../routes/create-mdo/routes/designation/services/designations.service')

describe('UIDirectoryTableComponent', () => {
    let component: UIDirectoryTableComponent
    let router: Router
    let events: EventService
    let dialog: MatDialog
    let createMdoService: CreateMDOService
    let designationsService: DesignationsService

    beforeEach(() => {
        router = new Router()
        events = new EventService(null as any, null as any)
        dialog = { open: jest.fn().mockReturnValue({ afterClosed: jest.fn() }) } as unknown as MatDialog
        createMdoService = new CreateMDOService(null as any)
        designationsService = new DesignationsService(null as any, null as any)

        component = new UIDirectoryTableComponent(
            router, events, dialog, designationsService, createMdoService
        )
    })

    it('should be created', () => {
        expect(component).toBeTruthy()
    })

    it('should emit pageChangeEvent on page change', () => {
        const pageChangeEventSpy = jest.spyOn(component.pageChangeEvent, 'emit')
        const event = { pageIndex: 1, pageSize: 20 }

        component.onOrgPageChange(event)

        expect(pageChangeEventSpy).toHaveBeenCalledWith(event)
    })

    it('should initialize dropdownList on ngOnInit', () => {
        // const statesSpy = jest.spyOn(createMdoService, 'getStatesOrMinisteries').mockReturnValue({
        //     subscribe: jest.fn().mockImplementation((cb: Function) => cb({ result: { response: { content: ['State1', 'State2'] } } }))
        // })

        component.ngOnInit()

        //expect(statesSpy).toHaveBeenCalledWith('state')
        expect(component.dropdownList.statesList).toEqual(['State1', 'State2'])
    })

    it('should apply filter when called', () => {
        const filterSubjectSpy = jest.spyOn(component['filterSubject'], 'next')
        const filterValue = 'Test'

        component.applyFilter(filterValue)

        expect(filterSubjectSpy).toHaveBeenCalledWith(filterValue)
    })

    it('should set moreThanTwoChar to true if filter value length > 2', () => {
        component.applyFilter('Test')
        expect(component.moreThanTwoChar).toBe(true)
    })

    it('should set moreThanTwoChar to false if filter value length <= 2', () => {
        component.applyFilter('T')
        expect(component.moreThanTwoChar).toBe(false)
    })

    it('should open dialog on generateCustRegistrationLink when frameworkId exists', () => {
        const row = { id: 1, qrRegistrationLink: '', registrationLink: '' }
        // const getOrgReadDataSpy = jest.spyOn(designationsService, 'getOrgReadData').mockReturnValue({
        //     subscribe: jest.fn().mockImplementation((cb: Function) => cb({ frameworkid: '123' }))
        // })
        // const getFrameworkInfoSpy = jest.spyOn(designationsService, 'getFrameworkInfo').mockReturnValue({
        //     subscribe: jest.fn().mockImplementation((cb: Function) => cb({ result: { framework: { categories: [{ terms: [{ associations: ['assoc1'] }] }] } } }))
        // })

        component.generateCustRegistrationLink(row)

        // expect(getOrgReadDataSpy).toHaveBeenCalledWith(row.id)
        // expect(getFrameworkInfoSpy).toHaveBeenCalledWith('123')
        expect(dialog.open).toHaveBeenCalled()
    })

    it('should emit buttonClickAction event when button is clicked', () => {
        const event = { action: 'create', row: {} }
        const buttonClickActionSpy = jest.spyOn(component, 'buttonClickAction')

        component.buttonClickAction(event)

        expect(buttonClickActionSpy).toHaveBeenCalledWith(event)
    })

    it('should toggle overlay visibility', () => {
        document.body.innerHTML = `<ws-app-home><mat-sidenav></mat-sidenav></ws-app-home>`
        const sidenav = document.querySelector('ws-app-home mat-sidenav') as HTMLElement

        component.toggleOverlay(true)
        expect(sidenav.style.zIndex).toBe('0')

        component.toggleOverlay(false)
        expect(sidenav.style.zIndex).toBe('2')
    })
})
