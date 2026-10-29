import { EditSectorComponent } from './edit-sector.component'
import { of, throwError } from 'rxjs'
import { ReactiveFormsModule, UntypedFormBuilder } from '@angular/forms'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute, Router } from '@angular/router'
import { DomSanitizer } from '@angular/platform-browser'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { sectorConstants } from '../sectors-constats.model'
import { SectorsService } from '../sectors.service'

describe('EditSectorComponent', () => {
    let component: EditSectorComponent
    let sectorsService: any
    let snackBar: any
    let activatedRoute: any
    let router: any
    let dialog: any
    let configSvc: any
    let sanitizer: any

    beforeEach(() => {
        sectorsService = {
            readSector: jest.fn(),
            createSubSectors: jest.fn(),
            getChangedArtifactUrl: jest.fn(),
        }
        snackBar = { open: jest.fn() }
        activatedRoute = { params: of({ id: '123' }) }
        router = { navigate: jest.fn(), navigateByUrl: jest.fn() }
        dialog = {}
        configSvc = { userProfile: { userId: 'user-1' } }
        sanitizer = { bypassSecurityTrustResourceUrl: jest.fn((url: string) => `safe:${url}`) }

        component = new EditSectorComponent(
            dialog,
            configSvc,
            router,
            new UntypedFormBuilder(),
            sectorsService,
            sanitizer,
            activatedRoute,
            snackBar,
        )
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
        expect(component.currentUser).toBe('user-1')
    })

    it('should initialize the component with sector data on ngOnInit', () => {
        const sectorDetails = {
            name: 'Test Sector',
            imgUrl: 'test-url',
            children: [{ name: 'Sub-sector 1' }],
        }
        sectorsService.readSector.mockReturnValue(of({ responseCode: 'OK', result: { sector: sectorDetails } }))

        component.ngOnInit()

        expect(sectorsService.readSector).toHaveBeenCalledWith('123')
        expect(component.sectorDetails).toEqual(sectorDetails)
        expect(component.addSectorForm.controls['sectorTitle'].value).toBe('Test Sector')
        expect(component.addSectorForm.controls['imgUrl'].value).toBe('test-url')
        expect(component.textboxes.length).toBe(1)
    })

    it('should show the error in snackbar when reading sector data fails', () => {
        const error = { error: { responseCode: 'BAD_REQUEST' } }
        sectorsService.readSector.mockReturnValue(throwError(error))

        component.ngOnInit()

        expect(snackBar.open).toHaveBeenCalledWith(error, 'X', { duration: sectorConstants.duration })
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
        component.goToList()
        expect(router.navigateByUrl).toHaveBeenCalledWith('/app/home/sectors')
    })

    it('should submit sub-sectors successfully', () => {
        sectorsService.createSubSectors.mockReturnValue(of({ responseCode: 'OK' }))

        component.sectorDetails = { identifier: 'sector-1', children: [{ name: 'Existing' }] }
        component.addTextbox()
        component.textboxes.at(0).setValue('New Sub-sector')

        component.onSubSectorSubmit()

        expect(sectorsService.createSubSectors).toHaveBeenCalledWith({
            request: {
                identifier: 'sector-1',
                subsectors: [{ name: 'Existing' }, { name: 'New Sub-sector' }],
            },
        })
        expect(snackBar.open).toHaveBeenCalledWith('Sub-sectors are successfuly created.')
        expect(router.navigate).toHaveBeenCalledWith(['/app/home/sectors'])
        expect(component.loading).toBe(false)
    })

    it('should handle bad request error during sub-sector submission', () => {
        const errorResponse = { error: { responseCode: 'BAD_REQUEST', params: { errmsg: 'Error message' } } }
        sectorsService.createSubSectors.mockReturnValue(throwError(errorResponse))
        component.sectorDetails = { identifier: 'sector-1', children: [] }

        component.onSubSectorSubmit()

        expect(snackBar.open).toHaveBeenCalledWith('Error message')
        expect(component.loading).toBe(false)
    })

    it('should handle other errors during sub-sector submission', () => {
        sectorsService.createSubSectors.mockReturnValue(throwError({ error: { responseCode: 'SERVER_ERROR' } }))
        component.sectorDetails = { identifier: 'sector-1', children: [] }

        component.onSubSectorSubmit()

        expect(snackBar.open).toHaveBeenCalledWith('Something went wrong.', 'X', { duration: sectorConstants.duration })
    })

    it('should validate input and show error if HTML/JS is detected', () => {
        component.validateInput('<script>alert("XSS")</script>')

        expect(snackBar.open).toHaveBeenCalledWith('HTML or Js is not allowed')
        expect(component.myForm.controls['textboxes'].errors).toEqual({ required: true })
    })

    it('should not flag plain text input', () => {
        component.validateInput('Plain text')
        expect(snackBar.open).not.toHaveBeenCalled()
    })

    it('should format URL properly', () => {
        sectorsService.getChangedArtifactUrl.mockReturnValue('changed-url')
        expect(component.getUrl('test-url')).toBe('safe:changed-url')
        expect(sanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith('changed-url')
    })

    it('should return default logo when URL cannot be changed', () => {
        sectorsService.getChangedArtifactUrl.mockReturnValue('')
        expect(component.getUrl('')).toBe('/assets/instances/eagle/app_logos/default.png')
    })

    describe('template', () => {
        let fixture: ComponentFixture<EditSectorComponent>

        beforeEach(async () => {
            sectorsService.readSector.mockReturnValue(of({
                responseCode: 'OK',
                result: { sector: { name: 'Test Sector', imgUrl: 'test-url', children: [] } },
            }))

            await TestBed.configureTestingModule({
                declarations: [EditSectorComponent],
                imports: [ReactiveFormsModule],
                providers: [
                    UntypedFormBuilder,
                    { provide: MatDialog, useValue: dialog },
                    { provide: ConfigurationsService, useValue: configSvc },
                    { provide: Router, useValue: router },
                    { provide: SectorsService, useValue: sectorsService },
                    { provide: DomSanitizer, useValue: sanitizer },
                    { provide: ActivatedRoute, useValue: activatedRoute },
                    { provide: MatSnackBar, useValue: snackBar },
                ],
                schemas: [NO_ERRORS_SCHEMA],
            }).compileComponents()

            fixture = TestBed.createComponent(EditSectorComponent)
            fixture.detectChanges()
        })

        it('should render the "Sectors" and "Sub-sectors" headings as spans, not labels', () => {
            const headings: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('span.heading'))
            expect(headings.map(heading => heading.textContent!.trim())).toEqual(['Sectors', 'Sub-sectors'])
            expect(fixture.nativeElement.querySelector('label.heading')).toBeNull()
        })

        it('should keep the real form labels associated via the for attribute', () => {
            const labels: HTMLLabelElement[] = Array.from(fixture.nativeElement.querySelectorAll('label'))
            expect(labels.length).toBe(2)
            labels.forEach(label => expect(label.getAttribute('for')).toBeTruthy())
            expect(labels.map(label => label.textContent!.trim())).toEqual(['Sector Name', 'Select Icon'])
        })
    })
})
