import { SetupDoneComponent } from './setup-done.component'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { DomSanitizer } from '@angular/platform-browser'
import { MatDialog } from '@angular/material/dialog'
import { Router } from '@angular/router'
import { Globals } from '../../globals'
import { AppTourDialogComponent } from '@sunbird-cb/collection'

describe('SetupDoneComponent', () => {
    let component: SetupDoneComponent
    let mockConfigSvc: jest.Mocked<ConfigurationsService>
    let mockActivatedRoute: any
    let mockDomSanitizer: jest.Mocked<DomSanitizer>
    let mockMatDialog: jest.Mocked<MatDialog>
    let mockRouter: jest.Mocked<Router>
    let mockGlobals: jest.Mocked<Globals>

    beforeEach(() => {
        // Mock services
        mockConfigSvc = {
            pageNavBar: {},
            instanceConfig: { logos: { thumpsUp: 'mockUrl' } },
        } as jest.Mocked<ConfigurationsService>

        mockActivatedRoute = {
            data: {
                subscribe: jest.fn((cb: any) => cb({ badges: { data: 'mockBadgesData' } })),
            },
        }

        mockDomSanitizer = {
            bypassSecurityTrustResourceUrl: jest.fn(() => 'safeUrl'),
        } as unknown as jest.Mocked<DomSanitizer>

        mockMatDialog = {
            open: jest.fn(),
        } as unknown as jest.Mocked<MatDialog>

        mockRouter = {
            navigate: jest.fn(),
        } as unknown as jest.Mocked<Router>

        mockGlobals = {
            firstTimeSetupDone: false,
        } as jest.Mocked<Globals>

        component = new SetupDoneComponent(
            mockConfigSvc,
            mockActivatedRoute,
            mockDomSanitizer,
            mockMatDialog,
            mockRouter,
            mockGlobals
        )
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize badges from route data and sanitize app icon on ngOnInit', () => {
        component.ngOnInit()

        // Check if badges are set correctly
        expect(component.badges).toBe('mockBadgesData')

        // Check if the appIcon is sanitized correctly
        expect(mockDomSanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith('mockUrl')
        expect(component.appIcon).toBe('safeUrl')
    })

    it('should call finishSetup method and navigate to home', () => {
        component.finishSetup()

        // Check if globals.firstTimeSetupDone is set to true
        expect(mockGlobals.firstTimeSetupDone).toBe(true)

        // Check if the dialog opens
        expect(mockMatDialog.open).toHaveBeenCalledWith(AppTourDialogComponent, {
            width: '500px',
            minHeight: '350px',
            data: 'dialog',
            backdropClass: 'backdropBackground',
        })

        // Check if router navigate was called with the correct parameters
        expect(mockRouter.navigate).toHaveBeenCalledWith(['page', 'home'])
    })
})
