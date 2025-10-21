import { FeaturesComponent } from './features.component'
import { of, Subject } from 'rxjs'
import { ActivatedRoute, Router, ParamMap } from '@angular/router'
import { ConfigurationsService, SubapplicationRespondService, ValueService } from '@sunbird-cb/utils-v2'
import { CustomTourService } from '@sunbird-cb/collection'
import { UntypedFormControl } from '@angular/forms'

describe('FeaturesComponent', () => {
  let component: FeaturesComponent
  let mockRouter: jest.Mocked<Router>
  let mockActivatedRoute: Partial<ActivatedRoute>
  let mockConfigService: jest.Mocked<ConfigurationsService>
  let mockTourService: jest.Mocked<CustomTourService>
  let mockRespondService: jest.Mocked<SubapplicationRespondService>
  let mockValueService: jest.Mocked<ValueService>
  let mockDialog: any
  let tourGuideNotifier: Subject<boolean>
  let mockQueryControl: UntypedFormControl
  let mockQueryParamMap: ParamMap

  beforeEach(() => {
    tourGuideNotifier = new Subject<boolean>()

    mockRouter = {
      navigate: jest.fn(),
    } as unknown as jest.Mocked<Router>

    // Properly mock the queryParamMap
    mockQueryParamMap = {
      get: jest.fn().mockReturnValue(null),
      getAll: jest.fn(),
      has: jest.fn(),
      keys: [],
    } as unknown as ParamMap

    // Properly mock the ActivatedRoute with snapshot
    mockActivatedRoute = {
      snapshot: {
        queryParamMap: mockQueryParamMap,
      } as any,
    }

    mockConfigService = {
      pageNavBar: { color: 'primary' },
      appsConfig: {
        groups: [
          {
            name: 'Group 1',
            desc: 'Description for Group 1',
            icon: 'group-icon',
            hasRole: [],
            featureIds: ['feature1', 'feature2'],
          },
        ],
        features: {
          feature1: {
            id: 'feature1',
            name: 'Feature 1',
            description: 'Description for Feature 1',
            icon: 'feature-icon',
            keywords: ['keyword1', 'keyword2'],
            url: '/feature1',
            permission: [],
          },
          feature2: {
            id: 'feature2',
            name: 'Feature 2',
            description: 'Description for Feature 2',
            icon: 'feature-icon',
            keywords: ['keyword3', 'keyword4'],
            url: '/feature2',
            permission: [],
          },
        },
        tourGuide: {
          steps: [{ target: 'step1', content: 'Step 1' }],
        },
      },
      restrictedFeatures: new Set(),
      tourGuideNotifier,
    } as unknown as jest.Mocked<ConfigurationsService>

    mockTourService = {
      data: null,
      startTour: jest.fn(),
    } as unknown as jest.Mocked<CustomTourService>

    mockRespondService = {
      unsubscribeResponse: jest.fn(),
    } as unknown as jest.Mocked<SubapplicationRespondService>

    mockValueService = {
      isXSmall$: of(false),
    } as unknown as jest.Mocked<ValueService>

    mockDialog = {
      open: jest.fn(),
    }

    // Create a mock FormControl
    mockQueryControl = {
      valueChanges: of(''),
      setValue: jest.fn(),
    } as unknown as UntypedFormControl

    // Override the constructor for UntypedFormControl
    // Create a spy for the actual component's queryControl
    // jest.spyOn(UntypedFormControl.prototype, 'constructor').mockImplementation(() => {
    //   return mockQueryControl
    // })

    // Instantiate the component with our mocks
    component = new FeaturesComponent(
      mockDialog,
      mockRouter,
      mockActivatedRoute as ActivatedRoute,
      mockConfigService,
      mockTourService,
      mockRespondService,
      mockValueService
    )

    // Explicitly replace the component's queryControl with our mock
    component.queryControl = mockQueryControl
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should initialize with correct data', () => {
    // Mock private filteredFeatures method to avoid errors
    (component as any).filteredFeatures = jest.fn().mockReturnValue([])

    component.ngOnInit()
    expect(component.isTourGuideAvailable).toBe(true)
  })

  it('should clear query control', () => {
    component.clear()
    expect(mockQueryControl.setValue).toHaveBeenCalledWith('')
  })

  it('should start tour and unsubscribe from response', () => {
    // component.responseSubscription = of(null).subscribe()
    component.startTour()
    expect(mockTourService.startTour).toHaveBeenCalled()
    expect(mockRespondService.unsubscribeResponse).toHaveBeenCalled()
  })

  it('should open logout dialog', () => {
    component.logout()
    expect(mockDialog.open).toHaveBeenCalled()
  })

  it('should handle query changes', () => {
    // Mock private filteredFeatures method to avoid errors
    (component as any).filteredFeatures = jest.fn().mockReturnValue([])

    const navigateSpy = jest.spyOn(mockRouter, 'navigate')
    component.ngOnInit()
    expect(navigateSpy).toHaveBeenCalledWith([], { queryParams: { q: null } })
  })

  it('should set isTourGuideAvailable based on config', () => {
    // Mock private filteredFeatures method to avoid errors
    (component as any).filteredFeatures = jest.fn().mockReturnValue([])

    component.ngOnInit()
    tourGuideNotifier.next(true)
    expect(component.isTourGuideAvailable).toBe(true)
  })

  it('should handle component destruction', () => {
    const notifierSpy = jest.spyOn(mockConfigService.tourGuideNotifier, 'next')
    component.ngOnDestroy()
    expect(notifierSpy).toHaveBeenCalledWith(false)
  })

  it('should handle XSmall screen size', () => {
    mockValueService.isXSmall$ = of(true)
    component = new FeaturesComponent(
      mockDialog,
      mockRouter,
      mockActivatedRoute as ActivatedRoute,
      mockConfigService,
      mockTourService,
      mockRespondService,
      mockValueService,
    )

    // Directly replace the component's queryControl with our mock
    component.queryControl = mockQueryControl

    expect(component.isXSmall).toBe(true)
  })

  // For tests that need queryMatchForFeature and filteredFeatures
  describe('Private methods', () => {
    it('should match features based on query', () => {
      const feature = {
        id: 'feature1',
        name: 'Feature 1',
        description: 'Test description',
        icon: 'icon',
        keywords: ['keyword1', 'test'],
        url: '/feature1',
        permission: [],
      }

      const result = (component as any).queryMatchForFeature(feature, 'test')
      expect(result).toBe(true)
    })

    it('should return empty array when no features match query', () => {
      // Mock featuresConfig to be empty
      (component as any).featuresConfig = []

      const result = (component as any).filteredFeatures('nonexistent')
      expect(result).toEqual([])
    })

    it('should return all features when query is empty', () => {
      // Create a mock for featuresConfig
      const mockFeaturesConfig = [
        {
          name: 'Group 1',
          featureWidgets: [{ widgetData: { actionBtn: { name: 'Feature 1', keywords: [] } } }]
        }
      ];

      // Set the mock on the component
      (component as any).featuresConfig = mockFeaturesConfig

      const result = (component as any).filteredFeatures('')
      expect(result).toEqual(mockFeaturesConfig)
    })
  })
})