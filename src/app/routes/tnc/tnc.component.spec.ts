import { TncComponent } from './tnc.component'
import { of, throwError } from 'rxjs'

describe('TncComponent', () => {
  let component: TncComponent
  let mockActivatedRoute: any
  let mockRouter: any
  let mockHttpClient: any
  let mockLoggerService: any
  let mockConfigService: any
  let mockTncProtectedSvc: any
  let mockTncPublicSvc: any
  let mockMatDialog: any
  // Mock data
  const mockTncData: any = {
    termsAndConditions: [
      {
        name: 'Generic T&C',
        language: 'en',
        version: '1.0',
        content: 'Terms content',
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
        content: 'Privacy content',
        acceptedDate: new Date(),
        acceptedLanguage: '',
        acceptedVersion: '',
        availableLanguages: [],
        isAccepted: false
      }
    ],
    isNewUser: false
  }

  const setupComponent = (routeData = { tnc: { data: mockTncData }, isPublic: false }) => {
    // Initialize mocks
    mockActivatedRoute = {
      data: of(routeData)
    }

    mockRouter = {
      navigate: jest.fn(),
      navigateByUrl: jest.fn()
    }

    mockHttpClient = {
      post: jest.fn(),
      patch: jest.fn()
    }

    mockLoggerService = {
      error: jest.fn()
    }

    mockConfigService = {
      hasAcceptedTnc: false,
      isNewUser: false,
      userUrl: '',
      appSetup: false
    }

    mockTncProtectedSvc = {
      getTnc: jest.fn()
    }

    mockTncPublicSvc = {
      getPublicTnc: jest.fn()
    }

    mockMatDialog = {
      open: jest.fn().mockReturnValue({
        afterClosed: () => of(false)
      })
    }

    // Create component with mocks
    component = new TncComponent(
      mockActivatedRoute as any,
      mockRouter as any,
      mockHttpClient as any,
      mockLoggerService as any,
      mockConfigService as any,
      mockTncProtectedSvc as any,
      mockTncPublicSvc as any,
      mockMatDialog as any
    )
  }

  beforeEach(() => {
    setupComponent()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('ngOnInit', () => {
    it('should set tncData and isNewUser flag when tnc data is available', () => {
      component.ngOnInit()

      expect(component.tncData).toEqual(mockTncData)
      expect(mockConfigService.isNewUser).toBe(false)
      expect(component.isPublic).toBe(false)
    })

    it('should navigate to error page when tnc data is not available', () => {
      setupComponent({ tnc: { data: null }, isPublic: false })

      component.ngOnInit()

      expect(mockRouter.navigate).toHaveBeenCalledWith(['error-service-unavailable'])
    })

    it('should set isPublic flag when provided in route data', () => {
      setupComponent({ tnc: { data: mockTncData }, isPublic: true })

      component.ngOnInit()

      expect(component.isPublic).toBe(true)
    })
  })

  describe('getTnc', () => {
    beforeEach(() => {
      component.ngOnInit()
    })

    it('should return early if requested language is the same as current language', () => {
      mockTncProtectedSvc.getTnc = jest.fn()
      mockTncPublicSvc.getPublicTnc = jest.fn()

      component.getTnc('en')

      expect(mockTncProtectedSvc.getTnc).not.toHaveBeenCalled()
      expect(mockTncPublicSvc.getPublicTnc).not.toHaveBeenCalled()
    })

    it('should call tncProtectedSvc.getTnc when not public', () => {
      const newLocale = 'fr'
      const mockResponse = { ...mockTncData }
      mockTncProtectedSvc.getTnc.mockReturnValue(of(mockResponse))

      component.getTnc(newLocale)

      expect(mockTncProtectedSvc.getTnc).toHaveBeenCalledWith(newLocale)
    })

    it('should call tncPublicSvc.getPublicTnc when public', () => {
      setupComponent({ tnc: { data: mockTncData }, isPublic: true })
      component.ngOnInit()

      const newLocale = 'fr'
      const mockResponse = { ...mockTncData }
      mockTncPublicSvc.getPublicTnc.mockReturnValue(of(mockResponse))

      component.getTnc(newLocale)

      expect(mockTncPublicSvc.getPublicTnc).toHaveBeenCalledWith(newLocale)
    })
  })

  describe('getDp', () => {
    beforeEach(() => {
      component.ngOnInit()
    })

    it('should return early if requested language is the same as current language', () => {
      mockTncProtectedSvc.getTnc = jest.fn()
      mockTncPublicSvc.getPublicTnc = jest.fn()

      component.getDp('en')

      expect(mockTncProtectedSvc.getTnc).not.toHaveBeenCalled()
      expect(mockTncPublicSvc.getPublicTnc).not.toHaveBeenCalled()
    })

    it('should call tncProtectedSvc.getTnc when not public', () => {
      const newLocale = 'fr'
      const mockResponse = { ...mockTncData }
      mockTncProtectedSvc.getTnc.mockReturnValue(of(mockResponse))

      component.getDp(newLocale)

      expect(mockTncProtectedSvc.getTnc).toHaveBeenCalledWith(newLocale)
    })

    it('should call tncPublicSvc.getPublicTnc when public', () => {
      setupComponent({ tnc: { data: mockTncData }, isPublic: true })
      component.ngOnInit()

      const newLocale = 'fr'
      const mockResponse = { ...mockTncData }
      mockTncPublicSvc.getPublicTnc.mockReturnValue(of(mockResponse))

      component.getDp(newLocale)

      expect(mockTncPublicSvc.getPublicTnc).toHaveBeenCalledWith(newLocale)
    })
  })

  describe('acceptTnc', () => {
    beforeEach(() => {
      component.ngOnInit()
    })

    it('should set error if tncData is null', () => {
      component.tncData = null
      component.acceptTnc({})

      expect(component.errorInAccepting).toBe(false)
      expect(mockHttpClient.post).not.toHaveBeenCalled()
    })

    it('should post to accept API with correct payload', () => {
      mockHttpClient.post.mockReturnValue(of({}))
      mockHttpClient.patch.mockReturnValue(of({}))

      component.acceptTnc({})

      const expectedPayload = {
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
      }

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/apis/protected/v8/user/tnc/accept',
        expectedPayload
      )
      expect(component.isAcceptInProgress).toBe(true)
    })

    it('should call postProcess after successful acceptance', () => {
      mockHttpClient.post.mockReturnValue(of({}))
      mockHttpClient.patch.mockReturnValue(of({}))

      component.acceptTnc({})

      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        '/apis/protected/v8/user/tnc/postprocessing',
        {}
      )
    })

    it('should navigate to app setup when isNewUser is true and appSetup is true', () => {
      mockHttpClient.post.mockReturnValue(of({}))
      mockHttpClient.patch.mockReturnValue(of({}))

      if (component.tncData) {
        component.tncData.isNewUser = true
      }
      mockConfigService.appSetup = true

      component.acceptTnc({})

      expect(mockRouter.navigate).toHaveBeenCalledWith(['app', 'setup'])
    })

    it('should navigate to home page when userUrl is not set', () => {
      mockHttpClient.post.mockReturnValue(of({}))
      mockHttpClient.patch.mockReturnValue(of({}))
      mockConfigService.userUrl = ''

      component.acceptTnc({})

      expect(mockRouter.navigate).toHaveBeenCalledWith(['page', 'home'])
    })

    it('should open dialog when userUrl is set', () => {
      mockHttpClient.post.mockReturnValue(of({}))
      mockHttpClient.patch.mockReturnValue(of({}))
      mockConfigService.userUrl = '/some/url'

      const templateRef = {}

      component.acceptTnc(templateRef)

      expect(mockMatDialog.open).toHaveBeenCalledWith(templateRef, {
        width: '400px',
        backdropClass: 'backdropBackground',
      })
    })

    it('should handle error in accepting TnC', () => {
      const errorResponse = { status: 500, message: 'Server error' }
      mockHttpClient.post.mockReturnValue(throwError(errorResponse))

      component.acceptTnc({})

      expect(mockLoggerService.error).toHaveBeenCalledWith('ERROR ACCEPTING TNC:', errorResponse)
      expect(component.errorInAccepting).toBe(true)
      expect(component.isAcceptInProgress).toBe(false)
    })
  })

  describe('ngOnDestroy', () => {
    it('should unsubscribe from routeSubscription if it exists', () => {
      component.ngOnInit()
      const unsubscribeSpy = jest.spyOn(component.routeSubscription as any, 'unsubscribe')

      component.ngOnDestroy()

      expect(unsubscribeSpy).toHaveBeenCalled()
    })

    it('should not throw error if routeSubscription is null', () => {
      component.routeSubscription = null

      expect(() => {
        component.ngOnDestroy()
      }).not.toThrow()
    })
  })
})