import { EditSectorComponent } from './edit-sector.component'
import { of, throwError } from 'rxjs'
import { UntypedFormBuilder } from '@angular/forms'
import { sectorConstants } from '../sectors-constats.model'

describe('EditSectorComponent', () => {
    let component: EditSectorComponent
    let sectorsService: any
    let snackBar: any
    let activatedRoute: any
    let router: any
    let dialog: any
    let formBuilder: UntypedFormBuilder
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
        router = { navigateByUrl: jest.fn(), navigate: jest.fn() }
        dialog = {}
        formBuilder = new UntypedFormBuilder()
        configSvc = { userProfile: { userId: 'user-1' } }
        sanitizer = { bypassSecurityTrustResourceUrl: jest.fn().mockImplementation(url => url) }

        component = new EditSectorComponent(
            dialog,
            configSvc,
            router,
            formBuilder,
            sectorsService,
            sanitizer,
            activatedRoute,
            snackBar
        )
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should set currentUser from configSvc.userProfile', () => {
        expect(component.currentUser).toBe('user-1')
    })

    it('should set currentUser to null when userProfile is absent', () => {
        const comp = new EditSectorComponent(
            dialog,
            { userProfile: null } as any,
            router,
            formBuilder,
            sectorsService,
            sanitizer,
            activatedRoute,
            snackBar
        )
        expect(comp.currentUser).toBeNull()
    })

    describe('ngOnInit', () => {
        it('should load sector data when id is present and response is OK', () => {
            const sectorDetails = {
                name: 'Test Sector',
                imgUrl: 'test-url',
                children: [{ name: 'Sub-sector 1' }],
            }
            sectorsService.readSector.mockReturnValue(
                of({ responseCode: 'OK', result: { sector: sectorDetails } })
            )
            component.ngOnInit()
            expect(component.sectorDetails).toEqual(sectorDetails)
            expect(component.addSectorForm.controls['sectorTitle'].value).toBe('Test Sector')
            expect(component.addSectorForm.controls['imgUrl'].value).toBe('test-url')
            expect(component.textboxes.length).toBe(1)
        })

        it('should not populate form when response has no result', () => {
            sectorsService.readSector.mockReturnValue(of({ responseCode: 'OK', result: null }))
            component.ngOnInit()
            expect(component.sectorDetails).toBeUndefined()
        })

        it('should not populate form when responseCode is not OK', () => {
            sectorsService.readSector.mockReturnValue(of({ responseCode: 'ERROR' }))
            component.ngOnInit()
            expect(component.sectorDetails).toBeUndefined()
        })

        it('should not add textboxes when children array is empty', () => {
            const sectorDetails = { name: 'S', imgUrl: 'url', children: [] }
            sectorsService.readSector.mockReturnValue(
                of({ responseCode: 'OK', result: { sector: sectorDetails } })
            )
            component.ngOnInit()
            expect(component.textboxes.length).toBe(0)
        })

        it('should handle error when reading sector data', () => {
            sectorsService.readSector.mockReturnValue(throwError('Server error'))
            component.ngOnInit()
            expect(snackBar.open).toHaveBeenCalledWith('Server error', 'X', { duration: sectorConstants.duration })
        })
    })

    describe('addTextbox', () => {
        it('should add a textbox with default empty value', () => {
            component.addTextbox()
            expect(component.textboxes.length).toBe(1)
            expect(component.textboxes.at(0).value).toBe('')
        })

        it('should add a textbox with provided value', () => {
            component.addTextbox('Sub-sector 1')
            expect(component.textboxes.length).toBe(1)
            expect(component.textboxes.at(0).value).toBe('Sub-sector 1')
        })
    })

    describe('removeTextbox', () => {
        it('should remove a textbox at given index', () => {
            component.addTextbox('Sub-sector 1')
            component.removeTextbox(0)
            expect(component.textboxes.length).toBe(0)
        })
    })

    describe('goToList', () => {
        it('should navigate to the sectors page', () => {
            component.goToList()
            expect(router.navigateByUrl).toHaveBeenCalledWith('/app/home/sectors')
        })
    })

    describe('onSubSectorSubmit', () => {
        beforeEach(() => {
            component.sectorDetails = { identifier: 'sector-1', children: [] }
            component.addTextbox('New Sub-sector')
        })

        it('should submit sub-sectors successfully', () => {
            sectorsService.createSubSectors.mockReturnValue(of({ responseCode: 'OK' }))
            component.onSubSectorSubmit()
            expect(snackBar.open).toHaveBeenCalledWith('Sub-sectors are successfuly created.')
            expect(router.navigate).toHaveBeenCalledWith(['/app/home/sectors'])
            expect(component.loading).toBe(false)
        })

        it('should reset loading on non-OK response', () => {
            sectorsService.createSubSectors.mockReturnValue(of({ responseCode: 'ERROR' }))
            component.onSubSectorSubmit()
            expect(component.loading).toBe(false)
        })

        it('should handle BAD_REQUEST error during submission', () => {
            const errorResponse = { error: { responseCode: 'BAD_REQUEST', params: { errmsg: 'Error message' } } }
            sectorsService.createSubSectors.mockReturnValue(throwError(errorResponse))
            component.onSubSectorSubmit()
            expect(snackBar.open).toHaveBeenCalledWith('Error message')
            expect(component.loading).toBe(false)
        })

        it('should handle non-BAD_REQUEST error with statusText', () => {
            const errorResponse = { statusText: 'Internal Server Error', error: { responseCode: 'SERVER_ERROR' } }
            sectorsService.createSubSectors.mockReturnValue(throwError(errorResponse))
            component.onSubSectorSubmit()
            expect(snackBar.open).toHaveBeenCalledWith('Internal Server Error', 'X', { duration: sectorConstants.duration })
        })

        it('should handle non-BAD_REQUEST error without statusText', () => {
            const errorResponse = { error: { responseCode: 'SERVER_ERROR' } }
            sectorsService.createSubSectors.mockReturnValue(throwError(errorResponse))
            component.onSubSectorSubmit()
            expect(snackBar.open).toHaveBeenCalledWith('Something went wrong.', 'X', { duration: sectorConstants.duration })
        })
    })

    describe('getUrl', () => {
        it('should return sanitized URL when getChangedArtifactUrl returns a value', () => {
            sectorsService.getChangedArtifactUrl.mockReturnValue('https://cdn.example.com/image.png')
            const result = component.getUrl('original-url')
            expect(sanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith('https://cdn.example.com/image.png')
            expect(result).toBe('https://cdn.example.com/image.png')
        })

        it('should return default image URL when getChangedArtifactUrl returns falsy', () => {
            sectorsService.getChangedArtifactUrl.mockReturnValue(null)
            const result = component.getUrl('original-url')
            expect(result).toBe('/assets/instances/eagle/app_logos/default.png')
        })
    })

    describe('validateInput', () => {
        it('should show error and set form errors when HTML tag is detected', () => {
            component.validateInput('<script>alert("XSS")</script>')
            expect(snackBar.open).toHaveBeenCalledWith('HTML or Js is not allowed')
            expect(component.myForm.controls['textboxes'].errors).toEqual({ required: true })
        })

        it('should not show error for valid input', () => {
            component.validateInput('Valid input text')
            expect(snackBar.open).not.toHaveBeenCalled()
        })

        it('should detect javascript: protocol as invalid', () => {
            component.validateInput('javascript:alert(1)')
            expect(snackBar.open).toHaveBeenCalledWith('HTML or Js is not allowed')
        })
    })
})

