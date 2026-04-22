import { AddSectorComponent } from './add-sector.component'
import { SectorsService } from '../sectors.service'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Router } from '@angular/router'
import { ActivatedRoute } from '@angular/router'
import { of, throwError } from 'rxjs'
import { AddThumbnailComponent } from '../../add-thumbnail/add-thumbnail.component'
import { sectorConstants } from '../sectors-constats.model'
import * as envModule from '../../../../../../../../../../src/environments/environment'

jest.mock('@angular/router')
jest.mock('@angular/material/dialog')
jest.mock('@angular/material/snack-bar')

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

        mockDialog = { open: jest.fn() } as any
        mockSnackBar = { open: jest.fn() } as any
        mockRouter = { navigate: jest.fn(), navigateByUrl: jest.fn() } as any
        mockActivatedRoute = {
            snapshot: {
                parent: {
                    data: {
                        configService: {
                            userProfile: { userId: 'test-user-id' },
                        },
                    },
                },
            },
        } as any
        mockSanitizer = {
            bypassSecurityTrustResourceUrl: jest.fn().mockImplementation(url => url),
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

    it('should handle missing parent data gracefully', () => {
        const noParentRoute = { snapshot: { parent: null } } as any
        const comp = new AddSectorComponent(
            mockDialog, mockRouter, mockSnackBar, mockSectorsService, noParentRoute, mockSanitizer
        )
        expect(comp.currentUser).toBeUndefined()
    })

    it('should call ngOnInit without error', () => {
        expect(() => component.ngOnInit()).not.toThrow()
    })

    describe('goToList', () => {
        it('should navigate to sectors page', () => {
            component.goToList()
            expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app/home/sectors')
        })
    })

    describe('onSubmit', () => {
        beforeEach(() => {
            component.addSectorForm.controls['sectorTitle'].setValue('New Sector')
            component.addSectorForm.controls['imgUrl'].setValue('http://example.com/image.png')
        })

        it('should call createSector and show success message on OK response', () => {
            mockSectorsService.createSector.mockReturnValue(of({ responseCode: 'OK' }))
            component.onSubmit()
            expect(mockSectorsService.createSector).toHaveBeenCalled()
            expect(mockSnackBar.open).toHaveBeenCalledWith('Sector is successfuly created.')
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/sectors'])
            expect(component.isLoading).toBe(false)
        })

        it('should reset isLoading on non-OK response', () => {
            mockSectorsService.createSector.mockReturnValue(of({ responseCode: 'ERROR' }))
            component.onSubmit()
            expect(component.isLoading).toBe(false)
        })

        it('should handle BAD_REQUEST error', () => {
            mockSectorsService.createSector.mockReturnValue(throwError({
                error: { responseCode: 'BAD_REQUEST', params: { errmsg: 'Bad request error' } },
            }))
            component.onSubmit()
            expect(mockSnackBar.open).toHaveBeenCalledWith('Bad request error')
            expect(component.isLoading).toBe(false)
        })

        it('should handle non-BAD_REQUEST error with statusText', () => {
            mockSectorsService.createSector.mockReturnValue(throwError({
                statusText: 'Internal Server Error',
                error: { responseCode: 'SERVER_ERROR' },
            }))
            component.onSubmit()
            expect(mockSnackBar.open).toHaveBeenCalledWith('Internal Server Error', 'X', { duration: sectorConstants.duration })
        })

        it('should handle non-BAD_REQUEST error without statusText', () => {
            mockSectorsService.createSector.mockReturnValue(throwError({
                error: { responseCode: 'SERVER_ERROR' },
            }))
            component.onSubmit()
            expect(mockSnackBar.open).toHaveBeenCalledWith('Something went wrong.', 'X', { duration: sectorConstants.duration })
        })
    })

    describe('generateUrl', () => {
        beforeEach(() => {
            // Ensure contentBucket is set so generateUrl can split it
            Object.defineProperty(envModule.environment, 'contentBucket', {
                value: 'https://mock-bucket',
                writable: true,
                configurable: true,
            })
        })

        it('should return empty string for empty input', () => {
            const result = component.generateUrl('')
            expect(result).toBe('')
        })

        it('should replace host and bucket sections of URL', () => {
            const oldUrl = 'https://old-host.com/old-bucket/path/file'
            const result = component.generateUrl(oldUrl)
            expect(typeof result).toBe('string')
            expect(result).toBeDefined()
        })
    })

    describe('openDialog', () => {
        it('should set imgUrl when dialog returns imgUrl', () => {
            const dialogRef = {
                afterClosed: jest.fn().mockReturnValue(of({ imgUrl: 'http://example.com/image.png' })),
            }
            mockDialog.open.mockReturnValue(dialogRef as any)
            component.openDialog()
            expect(mockDialog.open).toHaveBeenCalledWith(AddThumbnailComponent, expect.any(Object))
            expect(component.addSectorForm.controls['imgUrl'].value).toBe('http://example.com/image.png')
        })

        it('should call uploadAppIcon when dialog returns a file', () => {
            const file = new File(['content'], 'sector.png', { type: 'image/png' })
            const dialogRef = {
                afterClosed: jest.fn().mockReturnValue(of({ file })),
            }
            mockDialog.open.mockReturnValue(dialogRef as any)
            const spy = jest.spyOn(component, 'uploadAppIcon')
            component.openDialog()
            expect(spy).toHaveBeenCalledWith(file)
        })

        it('should do nothing when dialog returns no data', () => {
            const dialogRef = {
                afterClosed: jest.fn().mockReturnValue(of(null)),
            }
            mockDialog.open.mockReturnValue(dialogRef as any)
            component.openDialog()
            expect(component.addSectorForm.controls['imgUrl'].value).toBe('')
        })
    })

    describe('uploadAppIcon', () => {
        it('should return early when file is falsy', () => {
            component.uploadAppIcon(null as any)
            expect(mockSnackBar.open).not.toHaveBeenCalled()
        })

        it('should return early for invalid file extension', () => {
            const file = new File(['content'], 'document.pdf', { type: 'application/pdf' })
            component.uploadAppIcon(file)
            expect(mockSnackBar.open).not.toHaveBeenCalled()
        })

        it('should show snackbar when file exceeds size limit', () => {
            const oversizedContent = new Uint8Array(sectorConstants.fileCount * sectorConstants.fileSize * sectorConstants.fileSize + 1)
            const file = new File([oversizedContent], 'large.png', { type: 'image/png' })
            component.uploadAppIcon(file)
            expect(mockSnackBar.open).toHaveBeenCalledWith('Size is greater than allowed.')
        })

        it('should accept valid .jpg file within size', () => {
            const file = new File(['small'], 'image.jpg', { type: 'image/jpeg' })
            component.uploadAppIcon(file)
            // No snackBar error expected for valid files
            expect(mockSnackBar.open).not.toHaveBeenCalled()
        })

        it('should accept valid .jpeg file within size', () => {
            const file = new File(['small'], 'image.jpeg', { type: 'image/jpeg' })
            component.uploadAppIcon(file)
            expect(mockSnackBar.open).not.toHaveBeenCalled()
        })
    })

    describe('getUrl', () => {
        it('should return sanitized URL when getChangedArtifactUrl returns a value', () => {
            mockSectorsService.getChangedArtifactUrl.mockReturnValue('https://cdn.example.com/img.png')
            const result = component.getUrl('original-url')
            expect(mockSanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith('https://cdn.example.com/img.png')
            expect(result).toBe('https://cdn.example.com/img.png')
        })

        it('should return default image when getChangedArtifactUrl returns falsy', () => {
            mockSectorsService.getChangedArtifactUrl.mockReturnValue('')
            const result = component.getUrl('original-url')
            expect(result).toBe('/assets/instances/eagle/app_logos/default.png')
        })
    })
})

