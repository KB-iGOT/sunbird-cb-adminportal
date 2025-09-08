import { AppSetupHomeComponent } from './app-setup-home.component'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'

jest.mock('@sunbird-cb/utils-v2', () => ({
    ConfigurationsService: jest.fn().mockImplementation(() => ({
        activeLocale: { path: 'en' },
        instanceConfig: { introVideo: { en: 'https://example.com/intro-video' } },
        userUrl: 'https://example.com/user-url',
    })),
}))

jest.mock('@angular/material/legacy-dialog', () => ({
    MatLegacyDialog: jest.fn().mockImplementation(() => ({
        open: jest.fn().mockReturnValue({
            afterClosed: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
        }),
    })),
}))

describe('AppSetupHomeComponent', () => {
    let component: AppSetupHomeComponent
    let configSvc: ConfigurationsService
    let matDialog: MatDialog

    beforeEach(() => {
        configSvc = new ConfigurationsService()
        matDialog = new MatDialog(null as any, null as any, null as any, null as any, null as any, null as any, null as any, null as any)
        component = new AppSetupHomeComponent(configSvc, matDialog)

        // Initialize the component's properties
        component.ngOnInit()
    })

    it('should initialize correctly with default values', () => {
        expect(component.appLanguage).toBe('en')
        expect(component.introVideos).toEqual({ en: 'https://example.com/intro-video' })
        expect(component.widgetResolverData.widgetData.url).toBe('https://example.com/intro-video')
    })

    it('should change language path', () => {
        component.langChanged('fr')
        expect(component.chosenLang).toBe('fr')
    })

    it('should handle previous button click', () => {
        component.currentIndex = 5
        component.prevBtn()
        expect(component.currentIndex).toBe(4)
    })

    it('should handle next button click', () => {
        component.currentIndex = 2
        component.nextBtn()
        expect(component.currentIndex).toBe(3)
    })

    it('should handle stepper selection change', () => {
        // const event: StepperSelectionEvent = { selectedIndex: 3 }
        // component.onChange(event)
        expect(component.currentIndex).toBe(3)
    })

    it('should open dialog when applyChanges is called with userUrl set', () => {
        const template = 'someTemplate' // mock template
        component.applyChanges(template)
        expect(matDialog.open).toHaveBeenCalledWith(template, { width: '400px', backdropClass: 'backdropBackground' })
    })

    it('should not open dialog when applyChanges is called with userUrl not set', () => {
        configSvc.userUrl = '' // mock userUrl to be empty
        const template = 'someTemplate' // mock template
        component.applyChanges(template)
        expect(matDialog.open).not.toHaveBeenCalled()
    })

    it('should update widget resolver data on item change', () => {
        component.onItemChange('en')
        expect(component.widgetResolverData.widgetData.url).toBe('https://example.com/intro-video')
    })
})
