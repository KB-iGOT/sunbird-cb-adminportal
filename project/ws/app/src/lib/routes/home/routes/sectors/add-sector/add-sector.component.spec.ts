import { AddSectorComponent } from './add-sector.component'
import { SectorsService } from '../sectors.service'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Router } from '@angular/router'
import { ActivatedRoute } from '@angular/router'
import { of, throwError } from 'rxjs'
import { AddThumbnailComponent } from '../../add-thumbnail/add-thumbnail.component'

describe('AddSectorComponent', () => {
    let component: AddSectorComponent
    let mockSectorsService: jest.Mocked<SectorsService>
    let mockDialog: jest.Mocked<MatDialog>
    let mockSnackBar: jest.Mocked<MatSnackBar>
    let mockRouter: jest.Mocked<Router>
    let mockActivatedRoute: jest.Mocked<ActivatedRoute>

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

        component = new AddSectorComponent(
            mockDialog,
            mockRouter,
            mockSnackBar,
            mockSectorsService,
            mockActivatedRoute,
            {} as any, // mock the sanitizer as it's not relevant for this test
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

        expect(component.isLoading).toBe(true)
        expect(mockSectorsService.createSector).toHaveBeenCalled()
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
        const oldUrl = 'https://old-url.com/path/to/file'
        const expectedNewUrl = 'https://new-content-bucket/path/to/file'

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

        expect(result).toBe(url) // Assuming the getChangedArtifactUrl returns the sanitized URL directly
    })
})
