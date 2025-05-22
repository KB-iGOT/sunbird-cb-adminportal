import { TncComponent } from './tnc.component'
import { NsTnc } from '../../../../../../../../../src/app/models/tnc.model'
import { of, throwError, Subscription } from 'rxjs'

// Mock interfaces and types
interface MockActivatedRoute {
    data: any
    snapshot: {
        queryParamMap: {
            has: jest.Mock
            get: jest.Mock
        }
    }
}

interface MockRouter {
    navigate: jest.Mock
}

interface MockHttpClient {
    post: jest.Mock
    patch: jest.Mock
}

interface MockConfigurationsService {
    pageNavBar: any
    isNewUser: boolean
    userUrl: string
    hasAcceptedTnc: boolean
    appSetup: any
}

interface MockLoggerService {
    error: jest.Mock
}

interface MockTncAppResolverService {
    getTnc: jest.Mock
}

interface MockTncPublicResolverService {
    getPublicTnc: jest.Mock
}

interface MockGlobals {
    firstTimeSetupDone: boolean
}

describe('TncComponent', () => {
    let component: TncComponent
    let mockActivatedRoute: MockActivatedRoute
    let mockRouter: MockRouter
    let mockHttpClient: MockHttpClient
    let mockLoggerService: MockLoggerService
    let mockConfigService: MockConfigurationsService
    let mockTncProtectedService: MockTncAppResolverService
    let mockTncPublicService: MockTncPublicResolverService
    let mockGlobals: MockGlobals

    const mockTncData: NsTnc.ITnc = {
        isNewUser: true,
        isAccepted: false,
        termsAndConditions: [
            {
                name: 'Generic T&C',
                language: 'en',
                version: '1.0',
                content: 'Generic terms content',
                acceptedDate: new Date(),
                acceptedLanguage: '',
                acceptedVersion: '',
                availableLanguages: [],
                isAccepted: false
            },
            {
                name: 'Data Privacy',
                language: 'en',
                version: '1.0',
                content: 'Data privacy content',
                acceptedDate: new Date(),
                acceptedLanguage: '',
                acceptedVersion: '',
                availableLanguages: [],
                isAccepted: false
            }
        ]
    }

    beforeEach(() => {
        // Create mocks
        mockActivatedRoute = {
            data: of({ tnc: { data: mockTncData }, isPublic: false }),
            snapshot: {
                queryParamMap: {
                    has: jest.fn(),
                    get: jest.fn()
                }
            }
        }

        mockRouter = {
            navigate: jest.fn()
        }

        mockHttpClient = {
            post: jest.fn(),
            patch: jest.fn()
        }

        mockLoggerService = {
            error: jest.fn()
        }

        mockConfigService = {
            pageNavBar: { background: 'primary' },
            isNewUser: false,
            userUrl: '',
            hasAcceptedTnc: false,
            appSetup: {}
        }

        mockTncProtectedService = {
            getTnc: jest.fn()
        }

        mockTncPublicService = {
            getPublicTnc: jest.fn()
        }

        mockGlobals = {
            firstTimeSetupDone: false
        }

        // Create component instance
        component = new TncComponent(
            mockActivatedRoute as any,
            mockRouter as any,
            mockHttpClient as any,
            mockLoggerService as any,
            mockConfigService as any,
            mockTncProtectedService as any,
            mockTncPublicService as any,
            mockGlobals as any
        )
    })

    afterEach(() => {
        jest.clearAllMocks()
        if (component.routeSubscription) {
            component.routeSubscription.unsubscribe()
        }
    })

    describe('ngOnInit', () => {
        it('should initialize component with TNC data from route', () => {
            component.ngOnInit()

            expect(component.tncData).toEqual(mockTncData)
            expect(mockConfigService.isNewUser).toBe(true)
            expect(component.isPublic).toBe(false)
        })

        it('should navigate to error page when no TNC data is provided', () => {
            mockActivatedRoute.data = of({ tnc: {} })

            component.ngOnInit()

            expect(mockRouter.navigate).toHaveBeenCalledWith(['error-service-unavailable'])
        })

        it('should set isPublic to true when route data indicates public access', () => {
            mockActivatedRoute.data = of({ tnc: { data: mockTncData }, isPublic: true })

            component.ngOnInit()

            expect(component.isPublic).toBe(true)
        })

        it('should set userUrl from query params when ref parameter exists', () => {
            mockActivatedRoute.snapshot.queryParamMap.has.mockReturnValue(true)
            mockActivatedRoute.snapshot.queryParamMap.get.mockReturnValue('http://example.com')

            component.ngOnInit()

            expect(mockConfigService.userUrl).toBe('http://example.com')
            expect(component.expectedUrl).toBe('http://example.com')
        })

        it('should set expectedUrl from configService.userUrl when it exists', () => {
            mockConfigService.userUrl = 'http://configured-url.com'

            component.ngOnInit()

            expect(component.expectedUrl).toBe('http://configured-url.com')
        })
    })

    describe('ngOnDestroy', () => {
        it('should unsubscribe from route subscription', () => {
            const mockSubscription = new Subscription()
            const unsubscribeSpy = jest.spyOn(mockSubscription, 'unsubscribe')
            component.routeSubscription = mockSubscription

            component.ngOnDestroy()

            expect(unsubscribeSpy).toHaveBeenCalled()
        })

        it('should not throw error when routeSubscription is null', () => {
            component.routeSubscription = null

            expect(() => component.ngOnDestroy()).not.toThrow()
        })
    })

    describe('getTnc', () => {
        beforeEach(() => {
            component.tncData = mockTncData
        })

        it('should call public TNC service when isPublic is true', () => {
            component.isPublic = true
            const mockResponse = { ...mockTncData, language: 'es' }
            mockTncPublicService.getPublicTnc.mockReturnValue(of(mockResponse))

            component.getTnc('es')

            expect(mockTncPublicService.getPublicTnc).toHaveBeenCalledWith('es')
            expect(component.tncData).toEqual(mockResponse)
        })

        it('should call protected TNC service when isPublic is false', () => {
            component.isPublic = false
            const mockResponse = { ...mockTncData, language: 'es' }
            mockTncProtectedService.getTnc.mockReturnValue(of(mockResponse))

            component.getTnc('es')

            expect(mockTncProtectedService.getTnc).toHaveBeenCalledWith('es')
            expect(component.tncData).toEqual(mockResponse)
        })

        it('should not make API call when tncData is null', () => {
            component.tncData = null

            component.getTnc('es')

            expect(mockTncPublicService.getPublicTnc).not.toHaveBeenCalled()
            expect(mockTncProtectedService.getTnc).not.toHaveBeenCalled()
        })
    })

    describe('getDp', () => {
        beforeEach(() => {
            component.tncData = mockTncData
        })

        it('should return early when locale matches Data Privacy language', () => {
            component.getDp('en')

            expect(mockTncPublicService.getPublicTnc).not.toHaveBeenCalled()
            expect(mockTncProtectedService.getTnc).not.toHaveBeenCalled()
        })

        it('should call public service when isPublic is true and locale differs', () => {
            component.isPublic = true
            const mockResponse = { ...mockTncData }
            mockTncPublicService.getPublicTnc.mockReturnValue(of(mockResponse))

            component.getDp('es')

            expect(mockTncPublicService.getPublicTnc).toHaveBeenCalledWith('es')
        })

        it('should call protected service when isPublic is false and locale differs', () => {
            component.isPublic = false
            const mockResponse = { ...mockTncData }
            mockTncProtectedService.getTnc.mockReturnValue(of(mockResponse))

            component.getDp('es')

            expect(mockTncProtectedService.getTnc).toHaveBeenCalledWith('es')
        })

        it('should not make API call when tncData is null', () => {
            component.tncData = null

            component.getDp('es')

            expect(mockTncPublicService.getPublicTnc).not.toHaveBeenCalled()
            expect(mockTncProtectedService.getTnc).not.toHaveBeenCalled()
        })
    })

    describe('assignDp', () => {
        it('should update tncData with new data and preserve Generic T&C', () => {
            component.tncData = mockTncData
            const genericTnc = mockTncData.termsAndConditions[0]
            const newData: any = {
                ...mockTncData,
                termsAndConditions: [
                    {
                        name: 'Data Privacy',
                        language: 'es',
                        version: '1.1',
                        content: 'Spanish data privacy content'
                    }
                ]
            }

            component.assignDp(genericTnc, newData)

            expect(component.tncData?.termsAndConditions[0]).toEqual(genericTnc)
        })
    })

    describe('acceptTnc', () => {
        beforeEach(() => {
            component.tncData = mockTncData
        })

        it('should successfully accept TNC and navigate to home page', () => {
            mockHttpClient.post.mockReturnValue(of({}))
            mockHttpClient.patch.mockReturnValue(of({}))

            component.acceptTnc()

            expect(component.isAcceptInProgress).toBe(true)
            expect(mockHttpClient.post).toHaveBeenCalledWith('/apis/protected/v8/user/tnc/accept', {
                termsAccepted: [
                    {
                        acceptedLanguage: 'en',
                        docName: 'Generic T&C',
                        version: '1.0'
                    },
                    {
                        acceptedLanguage: 'en',
                        docName: 'Data Privacy',
                        version: '1.0'
                    }
                ]
            })
            expect(component.tncData?.isAccepted).toBe(true)
            expect(mockConfigService.hasAcceptedTnc).toBe(true)
            expect(mockRouter.navigate).toHaveBeenCalledWith(['page', 'home'])
        })

        it('should handle error when accepting TNC fails', () => {
            const error = new Error('Network error')
            mockHttpClient.post.mockReturnValue(throwError(error))

            component.acceptTnc()

            expect(mockLoggerService.error).toHaveBeenCalledWith('ERROR ACCEPTING TNC:', error)
            expect(component.errorInAccepting).toBe(true)
            expect(component.isAcceptInProgress).toBe(false)
        })

        it('should handle case when only Generic T&C exists', () => {
            const tncDataWithOnlyGeneric = {
                ...mockTncData,
                termsAndConditions: [mockTncData.termsAndConditions[0]]
            }
            component.tncData = tncDataWithOnlyGeneric
            mockHttpClient.post.mockReturnValue(of({}))
            mockHttpClient.patch.mockReturnValue(of({}))

            component.acceptTnc()

            expect(mockHttpClient.post).toHaveBeenCalledWith('/apis/protected/v8/user/tnc/accept', {
                termsAccepted: [
                    {
                        acceptedLanguage: 'en',
                        docName: 'Generic T&C',
                        version: '1.0'
                    }
                ]
            })
        })

        it('should handle case when only Data Privacy exists', () => {
            const tncDataWithOnlyDP = {
                ...mockTncData,
                termsAndConditions: [mockTncData.termsAndConditions[1]]
            }
            component.tncData = tncDataWithOnlyDP
            mockHttpClient.post.mockReturnValue(of({}))
            mockHttpClient.patch.mockReturnValue(of({}))

            component.acceptTnc()

            expect(mockHttpClient.post).toHaveBeenCalledWith('/apis/protected/v8/user/tnc/accept', {
                termsAccepted: [
                    {
                        acceptedLanguage: 'en',
                        docName: 'Data Privacy',
                        version: '1.0'
                    }
                ]
            })
        })

        it('should set errorInAccepting to false when tncData is null', () => {
            component.tncData = null
            component.errorInAccepting = true

            component.acceptTnc()

            expect(component.errorInAccepting).toBe(false)
            expect(mockHttpClient.post).not.toHaveBeenCalled()
        })

        it('should handle new user setup flow when conditions are met', () => {
            component.tncData = { ...mockTncData, isNewUser: true }
            mockConfigService.appSetup = { someConfig: true }
            mockGlobals.firstTimeSetupDone = false
            mockHttpClient.post.mockReturnValue(of({}))
            mockHttpClient.patch.mockReturnValue(of({}))

            component.acceptTnc()

            // Should not navigate to home page for new user setup
            expect(mockRouter.navigate).not.toHaveBeenCalledWith(['page', 'home'])
        })
    })

    describe('postProcess', () => {
        it('should call postprocessing API', () => {
            mockHttpClient.patch.mockReturnValue(of({}))

            component.postProcess()

            expect(mockHttpClient.patch).toHaveBeenCalledWith('/apis/protected/v8/user/tnc/postprocessing', {})
        })
    })

    describe('Component initialization', () => {
        it('should initialize with default values', () => {
            expect(component.tncData).toBeNull()
            expect(component.routeSubscription).toBeNull()
            expect(component.isAcceptInProgress).toBe(false)
            expect(component.errorInAccepting).toBe(false)
            expect(component.isPublic).toBe(false)
            expect(component.selectedLocale).toBe('')
            expect(component.checked).toBe(false)
            expect(component.expectedUrl).toBe('')
        })

        it('should set pageNavbar from config service', () => {
            expect(component.pageNavbar).toEqual(mockConfigService.pageNavBar)
        })

        it('should initialize errorWidget with correct configuration', () => {
            expect(component.errorWidget.widgetData.errorType).toBe('internalServer')
        })
    })
})