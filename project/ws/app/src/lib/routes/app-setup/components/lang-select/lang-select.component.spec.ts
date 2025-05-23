import { LangSelectComponent } from './lang-select.component'
import { Router } from '@angular/router'
import { ConfigurationsService, UserPreferenceService, NsInstanceConfig } from '@sunbird-cb/utils'

// Mock the dependencies
const mockRouter = {
    navigateByUrl: jest.fn(),
    url: '/current/path'
}

const mockConfigService = {
    userProfile: null,
    instanceConfig: null,
    userPreference: null,
    userUrl: null
}

const mockUserPrefService = {
    saveUserPreference: jest.fn()
}

// Mock location object
const mockLocation = {
    origin: 'https://example.com',
    assign: jest.fn()
}

// Mock window object
const mockWindow = {
    navigator: {
        languages: ['en-US'],
        language: 'en-US',
        browserLanguage: 'en-US',
        userLanguage: 'en-US'
    }
};

// Setup global mocks
(global as any).location = mockLocation;
(global as any).window = mockWindow

describe('LangSelectComponent', () => {
    let component: LangSelectComponent
    let configSvc: ConfigurationsService
    let router: Router
    let userPrefSvc: UserPreferenceService

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks()

        // Create mock instances
        configSvc = mockConfigService as any
        router = mockRouter as any
        userPrefSvc = mockUserPrefService as any

        // Create component instance
        component = new LangSelectComponent(configSvc, router, userPrefSvc)
    })

    describe('Constructor and Initial State', () => {
        test('should create component with initial values', () => {
            expect(component).toBeDefined()
            expect(component.userName).toBe('')
            expect(component.selectedLang).toBe('')
            expect(component.lang).toBe('')
            expect(component.animalControl).toBeDefined()
            expect(component.animalControl.hasError('required')).toBe(true)
        })
    })

    describe('ngOnInit', () => {
        test('should set userName from userProfile when available', () => {
            configSvc.userProfile = {
                userId: 'user123',
                givenName: 'John Doe'
            } as any

            component.ngOnInit()

            expect(component.userName).toBe('John Doe')
        })

        test('should set empty userName when userProfile is null', () => {
            configSvc.userProfile = null

            component.ngOnInit()

            expect(component.userName).toBe('')
        })

        test('should set empty userName when givenName is not available', () => {
            configSvc.userProfile = {
                userId: 'user123',
                givenName: null
            } as any

            component.ngOnInit()

            expect(component.userName).toBe('')
        })

        test('should initialize selectedLang to empty string', () => {
            component.ngOnInit()

            expect(component.selectedLang).toBe('')
        })

        test('should populate allowedLangCode from instanceConfig', () => {
            const mockLocals: NsInstanceConfig.ILocalsConfig[] = [
                { path: 'en', isAvailable: true, isEnabled: true, locals: [], isRTL: false },
                { path: 'hi', isAvailable: true, isEnabled: false, locals: [], isRTL: false },
                { path: 'te', isAvailable: false, isEnabled: true, locals: [], isRTL: false }
            ]

            configSvc.instanceConfig = {
                locals: mockLocals
            } as any // Cast to any to avoid full interface implementation

            component.ngOnInit()

            expect(component.allowedLangCode).toEqual({
                'en': { path: 'en', isAvailable: true, isEnabled: true, locals: {}, isRTL: false },
                'hi': { path: 'hi', isAvailable: true, isEnabled: false, locals: {}, isRTL: false },
                'te': { path: 'te', isAvailable: false, isEnabled: true, locals: {}, isRTL: false }
            })
        })

        test('should handle null instanceConfig', () => {
            configSvc.instanceConfig = null

            component.ngOnInit()

            expect(component.allowedLangCode).toEqual({})
        })

        test('should handle empty locals array', () => {
            configSvc.instanceConfig = {
                locals: []
            } as any // Cast to any to avoid full interface implementation

            component.ngOnInit()

            expect(component.allowedLangCode).toEqual({})
        })
    })

    describe('isLocaleAvailable', () => {
        beforeEach(() => {
            component.allowedLangCode = {
                'en': { path: 'en', isAvailable: true, isEnabled: true, locals: [], isRTL: false },
                'hi': { path: 'hi', isAvailable: false, isEnabled: true, locals: [], isRTL: false },
                'te': { path: 'te', isAvailable: true, isEnabled: false, locals: [], isRTL: false }
            }
        })

        test('should return true for available locale', () => {
            expect(component.isLocaleAvailable('en')).toBe(true)
        })

        test('should return false for unavailable locale', () => {
            expect(component.isLocaleAvailable('hi')).toBe(false)
        })

        test('should return false for non-existent locale', () => {
            expect(component.isLocaleAvailable('fr')).toBe(false)
        })

        test('should handle null allowedLangCode entry', () => {
            component.allowedLangCode['fr'] = null as any
            expect(component.isLocaleAvailable('fr')).toBe(false)
        })
    })

    describe('isLocaleEnabled', () => {
        beforeEach(() => {
            component.allowedLangCode = {
                'en': { path: 'en', isAvailable: true, isEnabled: true, locals: [], isRTL: false },
                'hi': { path: 'hi', isAvailable: false, isEnabled: true, locals: [], isRTL: false },
                'te': { path: 'te', isAvailable: true, isEnabled: false, locals: [], isRTL: false }
            }
        })

        test('should return true for enabled locale', () => {
            expect(component.isLocaleEnabled('en')).toBe(true)
            expect(component.isLocaleEnabled('hi')).toBe(true)
        })

        test('should return false for disabled locale', () => {
            expect(component.isLocaleEnabled('te')).toBe(false)
        })

        test('should return false for non-existent locale', () => {
            expect(component.isLocaleEnabled('fr')).toBe(false)
        })

        test('should handle null allowedLangCode entry', () => {
            component.allowedLangCode['fr'] = null as any
            expect(component.isLocaleEnabled('fr')).toBe(false)
        })
    })

    describe('langChanged', () => {
        test('should update selectedLang', () => {
            component.langChanged('hi')

            expect(component.selectedLang).toBe('hi')
        })

        test('should handle empty string', () => {
            component.langChanged('')

            expect(component.selectedLang).toBe('')
        })
    })

    describe('applyLang', () => {
        beforeEach(() => {
            userPrefSvc.saveUserPreference = jest.fn().mockResolvedValue(undefined)
        })

        test('should convert "en" to empty string', async () => {
            component.selectedLang = 'en'

            await component.applyLang()

            expect(component.selectedLang).toBe('')
        })

        test('should save user preference with selected locale', async () => {
            component.selectedLang = 'hi'

            await component.applyLang()

            expect(userPrefSvc.saveUserPreference).toHaveBeenCalledWith({
                selectedLocale: 'hi'
            })
        })

        test('should save user preference with empty string for English', async () => {
            component.selectedLang = 'en'

            await component.applyLang()

            expect(userPrefSvc.saveUserPreference).toHaveBeenCalledWith({
                selectedLocale: ''
            })
        })

        test('should navigate to English route when selectedLang is empty', async () => {
            component.selectedLang = ''

            await component.applyLang()

            expect(router.navigateByUrl).toHaveBeenCalledWith('/app/setup/home/tnc')
            expect(mockLocation.assign).not.toHaveBeenCalled()
        })

        test('should navigate to English route when selectedLang is "en"', async () => {
            component.selectedLang = 'en'

            await component.applyLang()

            expect(router.navigateByUrl).toHaveBeenCalledWith('/app/setup/home/tnc')
            expect(mockLocation.assign).not.toHaveBeenCalled()
        })

        test('should assign location for non-English locale', async () => {
            component.selectedLang = 'hi'

            await component.applyLang()

            expect(mockLocation.assign).toHaveBeenCalledWith(
                'https://example.com/hi/app/setup/home/tnc'
            )
            expect(router.navigateByUrl).not.toHaveBeenCalled()
        })

        test('should include ref parameter when userUrl is available', async () => {
            component.selectedLang = 'hi'
            configSvc.userUrl = 'https://example.com/some/path'

            await component.applyLang()

            expect(mockLocation.assign).toHaveBeenCalledWith(
                'https://example.com/hi/app/setup/home/tnc?ref=https%3A%2F%2Fexample.com%2Fsome%2Fpath'
            )
        })

        test('should include ref parameter for English locale when userUrl is available', async () => {
            component.selectedLang = 'en'
            configSvc.userUrl = 'https://example.com/some/path'

            await component.applyLang()

            expect(router.navigateByUrl).toHaveBeenCalledWith('/app/setup/home/tnc')
        })

        test('should handle saveUserPreference rejection', async () => {
            const error = new Error('Save failed')
            userPrefSvc.saveUserPreference = jest.fn().mockRejectedValue(error)
            component.selectedLang = 'hi'

            await expect(component.applyLang()).rejects.toThrow('Save failed')
        })
    })

    describe('Form Control', () => {
        test('should have required validator on animalControl', () => {
            expect(component.animalControl.hasError('required')).toBe(true)

            component.animalControl.setValue('test')
            expect(component.animalControl.hasError('required')).toBe(false)
        })
    })

    describe('Edge Cases', () => {
        test('should handle undefined userProfile gracefully', () => {
            configSvc.userProfile = undefined as any

            expect(() => component.ngOnInit()).not.toThrow()
            expect(component.userName).toBe('')
        })

        test('should handle undefined instanceConfig gracefully', () => {
            configSvc.instanceConfig = undefined as any

            expect(() => component.ngOnInit()).not.toThrow()
            expect(component.allowedLangCode).toEqual({})
        })

        test('should handle null selectedLang in applyLang', async () => {
            component.selectedLang = null as any

            await component.applyLang()

            expect(userPrefSvc.saveUserPreference).toHaveBeenCalledWith({
                selectedLocale: null
            })
        })
    })
})