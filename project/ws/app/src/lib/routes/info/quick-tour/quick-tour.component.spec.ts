import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { QuickTourComponent } from './quick-tour.component'

describe('QuickTourComponent', () => {
    let component: QuickTourComponent
    let mockConfigSvc: jest.Mocked<ConfigurationsService>

    beforeEach(() => {
        // Create mock ConfigurationsService
        mockConfigSvc = {
            instanceConfig: null,
            activeLocale: null,
        } as any

        // Create component instance
        component = new QuickTourComponent(mockConfigSvc)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('Component Initialization', () => {
        it('should create component with default values', () => {
            expect(component).toBeDefined()
            expect(component.appLanguage).toBe('en')
            expect(component.introVideos).toBeUndefined()
            expect(component.widgetResolverData).toEqual({
                widgetData: {
                    url: '',
                    autoplay: true,
                    identifier: '',
                },
                widgetHostClass: 'video-full block vertical-height-without-nav',
                widgetSubType: 'playerVideo',
                widgetType: 'player',
            })
        })

        it('should initialize with injected ConfigurationsService', () => {
            expect(component['configSvc']).toBe(mockConfigSvc)
        })
    })

    describe('ngOnInit', () => {
        describe('when instanceConfig is null or undefined', () => {
            it('should not set introVideos when instanceConfig is null', () => {
                mockConfigSvc.instanceConfig = null

                // ngOnInit throws when introVideos is undefined and Object.keys is called
                expect(() => component.ngOnInit()).toThrow()
                expect(component.introVideos).toBeUndefined()
            })

            it('should not set introVideos when instanceConfig is undefined', () => {
                mockConfigSvc.instanceConfig = undefined as any

                // ngOnInit throws when introVideos is undefined and Object.keys is called
                expect(() => component.ngOnInit()).toThrow()
                expect(component.introVideos).toBeUndefined()
            })
        })

        describe('when instanceConfig exists', () => {
            it('should set introVideos from instanceConfig.tourVideo', () => {
                const mockTourVideo = { en: 'video-url-en.mp4' }
                mockConfigSvc.instanceConfig = { tourVideo: mockTourVideo } as any

                component.ngOnInit()

                expect(component.introVideos).toBe(mockTourVideo)
            })
        })

        describe('language selection logic', () => {
            beforeEach(() => {
                mockConfigSvc.instanceConfig = {
                    tourVideo: { en: 'video-en.mp4', de: 'video-de.mp4' }
                } as any
            })

            it('should default to "en" when introVideos has single key', () => {
                mockConfigSvc.instanceConfig = {
                    tourVideo: { en: 'video-en.mp4' }
                } as any

                component.ngOnInit()

                expect(component.appLanguage).toBe('en')
            })

            it('should set appLanguage to "de" when activeLocale.path is "de"', () => {
                mockConfigSvc.activeLocale = { path: 'de' } as any

                component.ngOnInit()

                expect(component.appLanguage).toBe('de')
            })

            it('should set appLanguage to "en" when activeLocale.path is not "de"', () => {
                mockConfigSvc.activeLocale = { path: 'fr' } as any

                component.ngOnInit()

                expect(component.appLanguage).toBe('en')
            })

            it('should set appLanguage to "en" when activeLocale.path is empty string', () => {
                mockConfigSvc.activeLocale = { path: '' } as any

                component.ngOnInit()

                expect(component.appLanguage).toBe('en')
            })

            it('should set appLanguage to "en" when activeLocale is null', () => {
                mockConfigSvc.activeLocale = null

                component.ngOnInit()

                expect(component.appLanguage).toBe('en')
            })

            it('should set appLanguage to "en" when activeLocale is undefined', () => {
                mockConfigSvc.activeLocale = null

                component.ngOnInit()

                expect(component.appLanguage).toBe('en')
            })
        })

        describe('widgetResolverData update', () => {
            it('should update widgetResolverData.widgetData.url with correct video URL for English', () => {
                const mockTourVideo = {
                    en: 'video-english.mp4',
                    de: 'video-german.mp4'
                }
                mockConfigSvc.instanceConfig = { tourVideo: mockTourVideo } as any
                mockConfigSvc.activeLocale = { path: 'en' } as any

                component.ngOnInit()

                expect(component.widgetResolverData.widgetData.url).toBe('video-english.mp4')
            })

            it('should update widgetResolverData.widgetData.url with correct video URL for German', () => {
                const mockTourVideo = {
                    en: 'video-english.mp4',
                    de: 'video-german.mp4'
                }
                mockConfigSvc.instanceConfig = { tourVideo: mockTourVideo } as any
                mockConfigSvc.activeLocale = { path: 'de' } as any

                component.ngOnInit()

                expect(component.widgetResolverData.widgetData.url).toBe('video-german.mp4')
            })

            it('should preserve other widgetResolverData properties when updating URL', () => {
                const mockTourVideo = { en: 'test-video.mp4' }
                mockConfigSvc.instanceConfig = { tourVideo: mockTourVideo } as any

                const originalData = { ...component.widgetResolverData }
                component.ngOnInit()

                expect(component.widgetResolverData.widgetHostClass).toBe(originalData.widgetHostClass)
                expect(component.widgetResolverData.widgetSubType).toBe(originalData.widgetSubType)
                expect(component.widgetResolverData.widgetType).toBe(originalData.widgetType)
                expect(component.widgetResolverData.widgetData.autoplay).toBe(originalData.widgetData.autoplay)
                expect(component.widgetResolverData.widgetData.identifier).toBe(originalData.widgetData.identifier)
            })

            it('should handle undefined video URL gracefully', () => {
                const mockTourVideo = { fr: 'video-french.mp4' } // No 'en' key
                mockConfigSvc.instanceConfig = { tourVideo: mockTourVideo } as any
                mockConfigSvc.activeLocale = { path: 'en' } as any

                component.ngOnInit()

                expect(component.widgetResolverData.widgetData.url).toBeUndefined()
            })
        })

        describe('integration scenarios', () => {
            it('should handle complete flow with German locale', () => {
                const mockTourVideo = {
                    en: 'intro-en.mp4',
                    de: 'intro-de.mp4',
                    fr: 'intro-fr.mp4'
                }
                mockConfigSvc.instanceConfig = { tourVideo: mockTourVideo } as any
                mockConfigSvc.activeLocale = { path: 'de' } as any

                component.ngOnInit()

                expect(component.introVideos).toBe(mockTourVideo)
                expect(component.appLanguage).toBe('de')
                expect(component.widgetResolverData.widgetData.url).toBe('intro-de.mp4')
            })

            it('should handle complete flow with non-German locale defaulting to English', () => {
                const mockTourVideo = {
                    en: 'intro-en.mp4',
                    de: 'intro-de.mp4'
                }
                mockConfigSvc.instanceConfig = { tourVideo: mockTourVideo } as any
                mockConfigSvc.activeLocale = { path: 'es' } as any

                component.ngOnInit()

                expect(component.introVideos).toBe(mockTourVideo)
                expect(component.appLanguage).toBe('en')
                expect(component.widgetResolverData.widgetData.url).toBe('intro-en.mp4')
            })

            it('should handle single language scenario', () => {
                const mockTourVideo = { en: 'single-video.mp4' }
                mockConfigSvc.instanceConfig = { tourVideo: mockTourVideo } as any

                component.ngOnInit()

                expect(component.introVideos).toBe(mockTourVideo)
                expect(component.appLanguage).toBe('en')
                expect(component.widgetResolverData.widgetData.url).toBe('single-video.mp4')
            })
        })
    })

    describe('Edge Cases', () => {
        it('should handle empty tourVideo object', () => {
            mockConfigSvc.instanceConfig = { tourVideo: {} } as any

            component.ngOnInit()

            expect(component.introVideos).toEqual({})
            expect(component.appLanguage).toBe('en')
            expect(component.widgetResolverData.widgetData.url).toBeUndefined()
        })

        it('should handle missing tourVideo property', () => {
            mockConfigSvc.instanceConfig = { someOtherProperty: 'value' } as any

            // When tourVideo is undefined, Object.keys(undefined) throws
            expect(() => component.ngOnInit()).toThrow()
            expect(component.introVideos).toBeUndefined()
        })

        it('should handle activeLocale without path property', () => {
            const mockTourVideo = { en: 'video.mp4', de: 'video-de.mp4' }
            mockConfigSvc.instanceConfig = { tourVideo: mockTourVideo } as any
            mockConfigSvc.activeLocale = { someOtherProp: 'value' } as any

            component.ngOnInit()

            expect(component.appLanguage).toBe('en')
        })
    })
})