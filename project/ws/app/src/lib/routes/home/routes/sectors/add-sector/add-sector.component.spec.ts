import { AddSectorComponent } from './add-sector.component'
import { SectorsService } from '../sectors.service'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Router } from '@angular/router'
import { ActivatedRoute } from '@angular/router'
import { of, throwError } from 'rxjs'
import { AddThumbnailComponent } from '../../add-thumbnail/add-thumbnail.component'
import { environment } from '../../../../../../../../../../src/environments/environment'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { DomSanitizer } from '@angular/platform-browser'

describe('AddSectorComponent', () => {
    let component: AddSectorComponent
    let mockSectorsService: jest.Mocked<SectorsService>
    let mockDialog: jest.Mocked<MatDialog>
    let mockSnackBar: jest.Mocked<MatSnackBar>
    let mockRouter: jest.Mocked<Router>
    let mockActivatedRoute: jest.Mocked<ActivatedRoute>
    let mockSanitizer: any

    beforeEach(() => {
        mockSectorsService = {
            createSector: jest.fn(),
            createImageContent: jest.fn(),
            upload: jest.fn(),
            getChangedArtifactUrl: jest.fn(),
        } as any

        mockDialog = {
            open: jest.fn(),
        } as any

        mockSnackBar = {
            open: jest.fn(),
        } as any

        mockRouter = {
            navigate: jest.fn(),
            navigateByUrl: jest.fn(),
        } as any

        mockActivatedRoute = {
            snapshot: {
                parent: {
                    data: {
                        configService: {
                            userProfile: {
                                userId: 'test-user-id',
                            },
                        },
                    },
                },
            },
        } as any

        mockSanitizer = {
            bypassSecurityTrustResourceUrl: jest.fn((url: string) => url),
        }

        component = new AddSectorComponent(
            mockDialog,
            mockRouter,
            mockSnackBar,
            mockSectorsService,
            mockActivatedRoute,
            mockSanitizer,
        )
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
        expect(component.currentUser).toBe('test-user-id')
    })

    it('should navigate to sectors page on goToList()', () => {
        component.goToList()
        expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app/home/sectors')
    })

    it('should call createSector and show success message on valid submit', () => {
        component.addSectorForm.controls['sectorTitle'].setValue('New Sector')
        component.addSectorForm.controls['imgUrl'].setValue('http://example.com/image.png')

        mockSectorsService.createSector.mockReturnValue(of({ responseCode: 'OK' }))

        component.onSubmit()

        expect(component.isLoading).toBe(false)
        expect(mockSectorsService.createSector).toHaveBeenCalledWith({
            request: { name: 'New Sector', imgUrl: 'http://example.com/image.png' },
        })
        expect(mockSnackBar.open).toHaveBeenCalledWith('Sector is successfuly created.')
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/sectors'])
    })

    it('should show error message if createSector fails', () => {
        component.addSectorForm.controls['sectorTitle'].setValue('New Sector')
        component.addSectorForm.controls['imgUrl'].setValue('http://example.com/image.png')

        mockSectorsService.createSector.mockReturnValue(throwError({
            error: { responseCode: 'BAD_REQUEST', params: { errmsg: 'Bad request error' } },
        }))

        component.onSubmit()

        expect(mockSnackBar.open).toHaveBeenCalledWith('Bad request error')
        expect(component.isLoading).toBe(false)
    })

    it('should generate a valid URL with generateUrl()', () => {
        (environment as any).contentBucket = 'x/y/new-content-bucket'
        const oldUrl = 'https://old-url.com/path/to/file'
        const expectedNewUrl = 'https://new-content-bucket/x/y/new-content-bucket/to/file'

        const generatedUrl = component.generateUrl(oldUrl)

        expect(generatedUrl).toBe(expectedNewUrl)
    })

    it('should open dialog and set imgUrl when a valid image is selected', () => {
        const dialogRef = {
            afterClosed: jest.fn().mockReturnValue(of({ imgUrl: 'http://example.com/new-image.png' })),
        }
        mockDialog.open.mockReturnValue(dialogRef as any)

        component.openDialog()

        expect(mockDialog.open).toHaveBeenCalledWith(AddThumbnailComponent, expect.any(Object))
        dialogRef.afterClosed().subscribe(() => {
            expect(component.addSectorForm.controls['imgUrl'].value).toBe('http://example.com/new-image.png')
        })
    })

    it('should handle file upload correctly', () => {
        const file = new File(['dummy content'], 'test.png', { type: 'image/png' })

        component.uploadAppIcon(file)

        // Test various file validation scenarios (e.g., size check, file extension check, etc.)
        expect(mockSnackBar.open).not.toHaveBeenCalled()
    })

    it('should sanitize and return a safe URL from getUrl()', () => {
        const url = 'http://example.com/image.png'
        mockSectorsService.getChangedArtifactUrl.mockReturnValue(url)

        const result = component.getUrl(url)

        expect(mockSanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith(url)
        expect(result).toBe(url)
    })

    it('should return default logo from getUrl() when no artifact url', () => {
        mockSectorsService.getChangedArtifactUrl.mockReturnValue('')
        expect(component.getUrl('')).toBe('/assets/instances/eagle/app_logos/default.png')
    })

    it('should show generic error when createSector fails with non bad request', () => {
        mockSectorsService.createSector.mockReturnValue(throwError({ statusText: 'Server Error', error: { responseCode: 'SERVER_ERROR' } }))
        component.onSubmit()
        expect(mockSnackBar.open).toHaveBeenCalledWith('Server Error', 'X', expect.any(Object))
    })

    it('should reject too large files on upload', () => {
        const file = { name: 'big.png', size: 1024 * 1024 * 1024 } as any
        component.uploadAppIcon(file)
        expect(mockSnackBar.open).toHaveBeenCalledWith('Size is greater than allowed.')
    })

    describe('template', () => {
        let fixture: ComponentFixture<AddSectorComponent>

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                declarations: [AddSectorComponent],
                imports: [ReactiveFormsModule],
                providers: [
                    { provide: MatDialog, useValue: mockDialog },
                    { provide: Router, useValue: mockRouter },
                    { provide: MatSnackBar, useValue: mockSnackBar },
                    { provide: SectorsService, useValue: mockSectorsService },
                    { provide: ActivatedRoute, useValue: mockActivatedRoute },
                    { provide: DomSanitizer, useValue: mockSanitizer },
                ],
                schemas: [NO_ERRORS_SCHEMA],
            }).compileComponents()

            fixture = TestBed.createComponent(AddSectorComponent)
            fixture.detectChanges()
        })

        it('should render the "Sectors" heading as a span, not a label', () => {
            const heading: HTMLElement = fixture.nativeElement.querySelector('span.heading')
            expect(heading).toBeTruthy()
            expect(heading.textContent!.trim()).toBe('Sectors')
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
