import { EditSectorComponent } from './edit-sector.component'
import { of, throwError } from 'rxjs'
import { ActivatedRoute, Router } from '@angular/router'
import { SectorsService } from '../sectors.service'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { UntypedFormBuilder } from '@angular/forms'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { sectorConstants } from '../sectors-constats.model'

jest.mock('@angular/router')
jest.mock('../sectors.service')
jest.mock('@angular/material/legacy-snack-bar')
jest.mock('@sunbird-cb/utils-v2')
jest.mock('@angular/material/legacy-dialog')

describe('EditSectorComponent', () => {
    let component: EditSectorComponent
    let sectorsService: any
    let snackBar: any
    let activatedRoute: jest.Mocked<ActivatedRoute>
    let router: any
    let dialog: jest.Mocked<MatDialog>
    let formBuilder: UntypedFormBuilder
    let configSvc: any

    beforeEach(() => {
        sectorsService = new SectorsService(null as any) // Provide appropriate mocks for services
        snackBar = new MatSnackBar(null as any, null as any, null as any, null as any, null as any, null as any)
        activatedRoute = { params: of({ id: '123' }) } as any
        router = new Router()
        dialog = {} as any // Add mock methods if required
        formBuilder = new UntypedFormBuilder()
        configSvc = new ConfigurationsService() // Mock service

        component = new EditSectorComponent(
            dialog,
            configSvc,
            router,
            formBuilder,
            sectorsService,
            null as any, // Mocked sanitizer
            activatedRoute,
            snackBar
        )
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize the component with sector data on ngOnInit', () => {
        const sectorDetails = {
            name: 'Test Sector',
            imgUrl: 'test-url',
            children: [{ name: 'Sub-sector 1' }]
        }
        sectorsService.readSector = jest.fn().mockReturnValue(of({ responseCode: 'OK', result: { sector: sectorDetails } }))

        component.ngOnInit()

        expect(component.sectorDetails).toEqual(sectorDetails)
        expect(component.addSectorForm.controls['sectorTitle'].value).toBe('Test Sector')
        expect(component.addSectorForm.controls['imgUrl'].value).toBe('test-url')
        expect(component.textboxes.length).toBe(1) // One sub-sector added
    })

    it('should handle error when reading sector data in ngOnInit', () => {
        sectorsService.readSector = jest.fn().mockReturnValue(throwError({ error: { responseCode: 'BAD_REQUEST' } }))
        snackBar.open = jest.fn()

        component.ngOnInit()

        expect(snackBar.open).toHaveBeenCalledWith('Bad Request', 'X', { duration: sectorConstants.duration })
    })

    it('should add a textbox when addTextbox is called', () => {
        component.addTextbox('New Sub-sector')
        expect(component.textboxes.length).toBe(1)
        expect(component.textboxes.at(0).value).toBe('New Sub-sector')
    })

    it('should remove a textbox when removeTextbox is called', () => {
        component.addTextbox('Sub-sector 1')
        component.removeTextbox(0)
        expect(component.textboxes.length).toBe(0)
    })

    it('should navigate to the sectors page on goToList', () => {
        router.navigateByUrl = jest.fn()
        component.goToList()
        expect(router.navigateByUrl).toHaveBeenCalledWith('/app/home/sectors')
    })

    it('should submit sub-sectors successfully', () => {
        const response = { responseCode: 'OK' }
        sectorsService.createSubSectors = jest.fn().mockReturnValue(of(response))
        snackBar.open = jest.fn()
        router.navigate = jest.fn()

        component.sectorDetails = { identifier: 'sector-1', children: [] }
        component.myForm.controls['textboxes'].setValue(['New Sub-sector'])

        component.onSubSectorSubmit()

        expect(snackBar.open).toHaveBeenCalledWith('Sub-sectors are successfuly created.')
        expect(router.navigate).toHaveBeenCalledWith(['/app/home/sectors'])
    })

    it('should handle error during sub-sector submission', () => {
        const errorResponse = { error: { responseCode: 'BAD_REQUEST', params: { errmsg: 'Error message' } } }
        sectorsService.createSubSectors = jest.fn().mockReturnValue(throwError(errorResponse))
        snackBar.open = jest.fn()

        component.onSubSectorSubmit()

        expect(snackBar.open).toHaveBeenCalledWith('Error message')
    })

    it('should validate input and show error if HTML/JS is detected', () => {
        const event = '<script>alert("XSS")</script>'
        snackBar.open = jest.fn()

        component.validateInput(event)

        expect(snackBar.open).toHaveBeenCalledWith('HTML or Js is not allowed')
        expect(component.myForm.controls['textboxes'].errors).toEqual({ required: true })
    })

    it('should format URL properly', () => {
        const url = 'test-url'
        sectorsService.getChangedArtifactUrl = jest.fn().mockReturnValue('changed-url')
        const formattedUrl = component.getUrl(url)
        expect(formattedUrl).toBe('changed-url')
    })
})
