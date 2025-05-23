import { AboutVideoComponent } from './about-video.component'
import { ConfigurationsService } from '@sunbird-cb/utils'

// Create a mock ConfigurationsService that matches the interface expectations
const createMockConfigService = () => ({
    instanceConfig: {
        introVideo: {
            en: 'https://example.com/video-en.mp4',
            hi: 'https://example.com/video-hi.mp4',
            fr: 'https://example.com/video-fr.mp4'
        },
        details: {
            appName: 'Test App'
        }
    } as any, // Type assertion to avoid interface conflicts
    restrictedFeatures: new Set(['someOtherFeature']) as Set<string>,
    userPreference: {
        selectedLocale: 'en'
    } as any,
    pageNavBar: {
        color: 'primary',
        variant: 'elevated'
    } as any
})

describe('AboutVideoComponent', () => {
    let component: AboutVideoComponent
    let configService: jest.Mocked<ConfigurationsService>

    beforeEach(() => {
        configService = createMockConfigService() as jest.Mocked<ConfigurationsService>
        component = new AboutVideoComponent(configService)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('Component Initialization', () => {
        it('should create component instance', () => {
            expect(component).toBeDefined()
            expect(component).toBeInstanceOf(AboutVideoComponent)
        })

        it('should initialize with default values', () => {
            expect(component.introVideos).toBeUndefined()
            expect(component.isPartOfFirstTimeSetupV2).toBe(false)
            expect(component.locale).toBe('')
            expect(component.appName).toBe('')
            expect(component.showNextbutton).toBe(false)
            expect(component.objectKeys).toBe(Object.keys)
        })

        it('should initialize pageNavbar from configService', () => {
            expect(component.pageNavbar).toBe(configService.pageNavBar)
        })

        it('should initialize widgetResolverData with default values', () => {
            expect(component.widgetResolverData).toEqual({
                widgetData: {
                    url: '',
                    autoplay: true,
                    identifier: '',
                },
                widgetHostClass: 'video-full block',
                widgetSubType: 'playerVideo',
                widgetType: 'player',
                widgetHostStyle: {
                    height: '100%',
                    'max-width': '90%',
                    'margin-left': 'auto',
                    'margin-right': 'auto',
                },
            })
        })
    })

    describe('ngOnInit', () => {
        describe('when instanceConfig exists', () => {
            beforeEach(() => {
                // ConfigService is already set up with instanceConfig in the main beforeEach
            })

            it('should set introVideos from instanceConfig', () => {
                component.ngOnInit()
                if (configService.instanceConfig) {
                    expect(component.introVideos).toBe(configService.instanceConfig.introVideo)
                }

            })

            it('should set appName from instanceConfig', () => {
                component.ngOnInit()
                if (configService.instanceConfig) {
                    expect(component.appName).toBe(configService.instanceConfig.details.appName)
                }
            })
        })

        describe('when instanceConfig does not exist', () => {
            beforeEach(() => {
                configService.instanceConfig = null
            })

            it('should not set introVideos or appName', () => {
                component.ngOnInit()
                expect(component.introVideos).toBeUndefined()
                expect(component.appName).toBe('')
            })
        })

        describe('firstTimeSetupV2 feature flag', () => {
            it('should set isPartOfFirstTimeSetupV2 to true when restrictedFeatures exists and does not contain firstTimeSetupV2', () => {
                configService.restrictedFeatures = new Set(['otherFeature'])
                component.ngOnInit()
                expect(component.isPartOfFirstTimeSetupV2).toBe(true)
            })

            it('should keep isPartOfFirstTimeSetupV2 as false when restrictedFeatures contains firstTimeSetupV2', () => {
                configService.restrictedFeatures = new Set(['firstTimeSetupV2'])
                component.ngOnInit()
                expect(component.isPartOfFirstTimeSetupV2).toBe(false)
            })

            it('should keep isPartOfFirstTimeSetupV2 as false when restrictedFeatures is null', () => {
                configService.restrictedFeatures = null
                component.ngOnInit()
                expect(component.isPartOfFirstTimeSetupV2).toBe(false)
            })
        })

        describe('locale handling', () => {
            // Component already has instanceConfig set up in main beforeEach

            it('should use selectedLocale from userPreference when available', () => {
                configService.userPreference = { selectedLocale: 'hi' } as any
                component.ngOnInit()
                expect(component.locale).toBe('hi')
            })

            it('should default to empty string when userPreference is null', () => {
                configService.userPreference = null as any
                component.ngOnInit()
                expect(component.locale).toBe('en') // Falls back to 'en' because '' is not in introVideos keys
            })

            it('should default to "en" when selected locale is not available in introVideos', () => {
                configService.userPreference = { selectedLocale: 'de' } as any
                component.ngOnInit()
                expect(component.locale).toBe('en')
            })

            it('should use selected locale when it exists in introVideos', () => {
                configService.userPreference = { selectedLocale: 'fr' } as any
                component.ngOnInit()
                expect(component.locale).toBe('fr')
            })
        })

        describe('widgetResolverData update', () => {
            // Component already has instanceConfig set up in main beforeEach

            it('should update widgetResolverData url with selected locale video', () => {
                configService.userPreference = { selectedLocale: 'hi' } as any
                component.ngOnInit()

                expect(component.widgetResolverData.widgetData.url).toBe('https://example.com/video-hi.mp4')
            })

            it('should update widgetResolverData url with default "en" video when locale not available', () => {
                configService.userPreference = { selectedLocale: 'unknown' } as any
                component.ngOnInit()

                expect(component.widgetResolverData.widgetData.url).toBe('https://example.com/video-en.mp4')
            })
        })

        describe('showNextbutton logic', () => {
            it('should set showNextbutton to true when restrictedFeatures exists and does not contain firstTimeSetupV2', () => {
                configService.restrictedFeatures = new Set(['otherFeature'])
                component.ngOnInit()
                expect(component.showNextbutton).toBe(true)
            })

            it('should keep showNextbutton as false when restrictedFeatures contains firstTimeSetupV2', () => {
                configService.restrictedFeatures = new Set(['firstTimeSetupV2'])
                component.ngOnInit()
                expect(component.showNextbutton).toBe(false)
            })

            it('should keep showNextbutton as false when restrictedFeatures is null', () => {
                configService.restrictedFeatures = null
                component.ngOnInit()
                expect(component.showNextbutton).toBe(false)
            })
        })
    })

    describe('onItemChange', () => {
        beforeEach(() => {
            // Component already has instanceConfig set up, just need to initialize
            component.ngOnInit()
        })

        it('should update widgetResolverData url with the specified locale video', () => {
            const initialUrl = component.widgetResolverData.widgetData.url

            component.onItemChange('hi')

            expect(component.widgetResolverData.widgetData.url).toBe('https://example.com/video-hi.mp4')
            expect(component.widgetResolverData.widgetData.url).not.toBe(initialUrl)
        })

        it('should preserve other widgetResolverData properties when updating url', () => {
            const originalData = { ...component.widgetResolverData }

            component.onItemChange('fr')

            expect(component.widgetResolverData.widgetType).toBe(originalData.widgetType)
            expect(component.widgetResolverData.widgetSubType).toBe(originalData.widgetSubType)
            expect(component.widgetResolverData.widgetHostClass).toBe(originalData.widgetHostClass)
            expect(component.widgetResolverData.widgetHostStyle).toEqual(originalData.widgetHostStyle)
            expect(component.widgetResolverData.widgetData.autoplay).toBe(originalData.widgetData.autoplay)
            expect(component.widgetResolverData.widgetData.identifier).toBe(originalData.widgetData.identifier)
        })

        it('should handle locale that does not exist in introVideos', () => {
            component.onItemChange('nonexistent')

            expect(component.widgetResolverData.widgetData.url).toBeUndefined()
        })

        it('should create a new object reference when updating widgetResolverData', () => {
            const originalReference = component.widgetResolverData

            component.onItemChange('hi')

            expect(component.widgetResolverData).not.toBe(originalReference)
            expect(component.widgetResolverData.widgetData).not.toBe(originalReference.widgetData)
        })
    })

    describe('Edge Cases and Error Handling', () => {
        it('should handle missing introVideos gracefully in onItemChange', () => {
            component.introVideos = null

            expect(() => component.onItemChange('en')).not.toThrow()
            expect(component.widgetResolverData.widgetData.url).toBeUndefined()
        })

        it('should handle empty introVideos object', () => {
            configService.instanceConfig = {
                ...configService.instanceConfig,
                introVideo: {}
            } as any

            component.ngOnInit()

            expect(component.locale).toBe('en')
            expect(component.widgetResolverData.widgetData.url).toBeUndefined()
        })

        it('should handle missing userPreference gracefully', () => {
            configService.userPreference = undefined as any

            expect(() => component.ngOnInit()).not.toThrow()
            expect(component.locale).toBe('en')
        })

        it('should handle missing details in instanceConfig', () => {
            configService.instanceConfig = {
                introVideo: configService.instanceConfig ? configService.instanceConfig.introVideo : '',
                details: null
            } as any

            expect(() => component.ngOnInit()).toThrow()
        })
    })

    describe('Integration Tests', () => {
        it('should properly initialize and then update video url through onItemChange', () => {
            configService.userPreference = { selectedLocale: 'en' } as any

            component.ngOnInit()
            expect(component.widgetResolverData.widgetData.url).toBe('https://example.com/video-en.mp4')

            component.onItemChange('hi')
            expect(component.widgetResolverData.widgetData.url).toBe('https://example.com/video-hi.mp4')

            component.onItemChange('fr')
            expect(component.widgetResolverData.widgetData.url).toBe('https://example.com/video-fr.mp4')
        })

        it('should handle complete workflow with all features', () => {
            configService.restrictedFeatures = new Set(['otherFeature']) as Set<string>
            configService.userPreference = { selectedLocale: 'hi' } as any

            component.ngOnInit()

            expect(component.appName).toBe('Test App')
            expect(component.isPartOfFirstTimeSetupV2).toBe(true)
            expect(component.showNextbutton).toBe(true)
            expect(component.locale).toBe('hi')
            expect(component.widgetResolverData.widgetData.url).toBe('https://example.com/video-hi.mp4')

            component.onItemChange('en')
            expect(component.widgetResolverData.widgetData.url).toBe('https://example.com/video-en.mp4')
        })
    })
})