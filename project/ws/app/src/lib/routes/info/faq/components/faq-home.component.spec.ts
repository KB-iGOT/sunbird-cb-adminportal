import { FaqHomeComponent } from './faq-home.component'
import { ActivatedRoute } from '@angular/router'
import { ValueService, ConfigurationsService, EFeatures } from '@sunbird-cb/utils'
import { of, BehaviorSubject } from 'rxjs'
import { IFAQ, IContent } from '../faq.model'

describe('FaqHomeComponent', () => {
    let component: FaqHomeComponent
    let mockActivatedRoute: jest.Mocked<ActivatedRoute>
    let mockValueService: jest.Mocked<ValueService>
    let mockConfigurationsService: jest.Mocked<ConfigurationsService>

    // Mock data
    const mockFaqData: IFAQ[] = [
        {
            groupKey: 'general',
            contents: [
                { id: '1', title: 'General FAQ 1', content: 'Content 1' },
                { id: '2', title: 'General FAQ 2', content: 'Content 2' }
            ] as unknown as IContent[],
            groupName: '',
            groupShortName: ''
        },
        {
            groupKey: 'technical',
            contents: [
                { id: '3', title: 'Technical FAQ 1', content: 'Tech Content 1' }
            ] as unknown as IContent[],
            groupName: '',
            groupShortName: ''
        }
    ]

    const mockPageNavBar = { background: 'primary' }

    beforeEach(() => {
        // Create mock services with proper observables
        const mockQueryParamMap = {
            get: jest.fn().mockReturnValue(null)
        }

        mockActivatedRoute = {
            data: of({ pageData: { data: mockFaqData } }),
            queryParamMap: of(mockQueryParamMap)
        } as any

        const isLtMediumSubject = new BehaviorSubject<boolean>(false)
        mockValueService = {
            isLtMedium$: isLtMediumSubject.asObservable()
        } as any

        mockConfigurationsService = {
            pageNavBar: mockPageNavBar,
            restrictedFeatures: null
        } as any

        // Create component instance
        component = new FaqHomeComponent(
            mockActivatedRoute,
            mockValueService,
            mockConfigurationsService
        )
    })

    afterEach(() => {
        // Clean up subscriptions
        component.ngOnDestroy()
    })

    describe('Component Initialization', () => {
        it('should create component with default values', () => {
            expect(component).toBeTruthy()
            expect(component.errorMessageCode).toBe('NONE')
            expect(component.sideNavBarOpened).toBe(true)
            expect(component.isFaqFeature).toBe(true)
            expect(component.selectedTabIndex).toBe(0)
            expect(component.selectedTabData).toBeNull()
            expect(component.faqConfigs).toBeNull()
        })

        it('should set pageNavbar from configSvc', () => {
            expect(component.pageNavbar).toBe(mockPageNavBar)
        })

        it('should initialize mode$ observable', () => {
            component.mode$.subscribe(mode => {
                expect(mode).toBe('side') // isLtMedium is false by default
            })
        })
    })

    describe('ngOnInit', () => {
        it('should initialize FAQ data from route data', () => {
            component.ngOnInit()

            expect(component.faqConfigs).toEqual(mockFaqData)
            expect(component.selectedTabData).toEqual(mockFaqData[0].contents)
            expect(component.selectedTabIndex).toBe(0)
        })

        it('should handle empty FAQ data', () => {
            const mockRouteWithEmptyData = {
                data: of({ pageData: { data: null } }),
                queryParamMap: of({ get: jest.fn().mockReturnValue(null) })
            } as any

            const testComponent = new FaqHomeComponent(
                mockRouteWithEmptyData,
                mockValueService,
                mockConfigurationsService
            )

            testComponent.ngOnInit()

            expect(testComponent.faqConfigs).toBeNull()
            expect(testComponent.selectedTabData).toBeNull()
            expect(testComponent.selectedTabIndex).toBe(0)

            testComponent.ngOnDestroy()
        })

        it('should handle query param for active tab', () => {
            const mockQueryParamMap = {
                get: jest.fn().mockReturnValue('technical')
            }

            // Create a new component instance with different route mock
            const mockRouteWithQueryParam = {
                data: of({ pageData: { data: mockFaqData } }),
                queryParamMap: of(mockQueryParamMap)
            } as any

            const testComponent = new FaqHomeComponent(
                mockRouteWithQueryParam,
                mockValueService,
                mockConfigurationsService
            )

            testComponent.ngOnInit()

            expect(testComponent.selectedTabIndex).toBe(1)
            expect(testComponent.selectedTabData).toEqual(mockFaqData[1].contents)

            testComponent.ngOnDestroy()
        })

        it('should handle non-existent tab in query param', () => {
            const mockQueryParamMap = {
                get: jest.fn().mockReturnValue('nonexistent')
            }

            const mockRouteWithQueryParam = {
                data: of({ pageData: { data: mockFaqData } }),
                queryParamMap: of(mockQueryParamMap)
            } as any

            const testComponent = new FaqHomeComponent(
                mockRouteWithQueryParam,
                mockValueService,
                mockConfigurationsService
            )

            testComponent.ngOnInit()

            // Should remain at default values
            expect(testComponent.selectedTabIndex).toBe(0)
            expect(testComponent.selectedTabData).toEqual(mockFaqData[0].contents)

            testComponent.ngOnDestroy()
        })

        it('should set isFaqFeature based on restricted features', () => {
            const restrictedFeatures = new Set([EFeatures.FAQ])
            mockConfigurationsService.restrictedFeatures = restrictedFeatures

            component.ngOnInit()

            expect(component.isFaqFeature).toBe(false)
        })

        it('should handle screen size changes', () => {
            const isLtMediumSubject = new BehaviorSubject<boolean>(true)
            mockValueService.isLtMedium$ = isLtMediumSubject.asObservable()

            component.ngOnInit()

            expect(component.sideNavBarOpened).toBe(false)
            expect(component.screenSizeIsLtMedium).toBe(true)

            // Test screen size change
            isLtMediumSubject.next(false)
            expect(component.sideNavBarOpened).toBe(true)
            expect(component.screenSizeIsLtMedium).toBe(false)
        })
    })

    describe('ngOnDestroy', () => {
        it('should unsubscribe from all subscriptions', () => {
            component.ngOnInit()

            // Spy on unsubscribe methods
            const faqSpy = jest.spyOn(component['subscriptionFAQ']!, 'unsubscribe')
            const activeFaqSpy = jest.spyOn(component['subscriptionActiveFAQ']!, 'unsubscribe')
            const sideNavSpy = jest.spyOn(component['defaultSideNavBarOpenedSubscription']!, 'unsubscribe')

            component.ngOnDestroy()

            expect(faqSpy).toHaveBeenCalled()
            expect(activeFaqSpy).toHaveBeenCalled()
            expect(sideNavSpy).toHaveBeenCalled()
        })

        it('should handle null subscriptions gracefully', () => {
            // Don't call ngOnInit, so subscriptions remain null
            expect(() => component.ngOnDestroy()).not.toThrow()
        })
    })

    describe('sideNavOnClick', () => {
        beforeEach(() => {
            component.ngOnInit()
        })

        it('should update selected tab data and index', () => {
            component.sideNavOnClick(1)

            expect(component.selectedTabData).toEqual(mockFaqData[1].contents)
            expect(component.selectedTabIndex).toBe(1)
        })

        it('should handle invalid index gracefully', () => {
            const originalTabData = component.selectedTabData
            const originalTabIndex = component.selectedTabIndex

            component.sideNavOnClick(999)

            expect(component.selectedTabData).toBe(originalTabData)
            expect(component.selectedTabIndex).toBe(originalTabIndex)
        })

        it('should toggle side nav when screen is small', () => {
            component.screenSizeIsLtMedium = true
            component.sideNavBarOpened = true

            component.sideNavOnClick(0)

            expect(component.sideNavBarOpened).toBe(false)
        })

        it('should not toggle side nav when screen is large', () => {
            component.screenSizeIsLtMedium = false
            component.sideNavBarOpened = true

            component.sideNavOnClick(0)

            expect(component.sideNavBarOpened).toBe(true)
        })

        it('should handle null faqConfigs', () => {
            component.faqConfigs = null
            const originalTabData = component.selectedTabData
            const originalTabIndex = component.selectedTabIndex

            component.sideNavOnClick(0)

            expect(component.selectedTabData).toBe(originalTabData)
            expect(component.selectedTabIndex).toBe(originalTabIndex)
        })
    })

    describe('Observable Streams', () => {
        it('should map isLtMedium$ to correct mode', () => {
            const isLtMediumSubject = new BehaviorSubject<boolean>(false)
            mockValueService.isLtMedium$ = isLtMediumSubject.asObservable()

            component = new FaqHomeComponent(
                mockActivatedRoute,
                mockValueService,
                mockConfigurationsService
            )

            component.mode$.subscribe(mode => {
                expect(mode).toBe('side')
            })

            isLtMediumSubject.next(true)
            component.mode$.subscribe(mode => {
                expect(mode).toBe('over')
            })
        })
    })

    describe('Error States', () => {
        it('should handle route data subscription error', () => {
            mockActivatedRoute.data = of({ pageData: undefined })

            expect(() => component.ngOnInit()).not.toThrow()
            expect(component.faqConfigs).toBeUndefined()
        })

        it('should handle query param subscription with null faqConfigs', () => {
            const queryParamMap = new Map()
            queryParamMap.set('tab', 'technical')
            // mockActivatedRoute.queryParamMap = of(queryParamMap)
            mockActivatedRoute.data = of({ pageData: { data: null } })

            expect(() => component.ngOnInit()).not.toThrow()
        })
    })

    describe('Component Properties', () => {
        it('should have correct error message codes type', () => {
            const validCodes = ['API_FAILURE', 'NO_DATA', 'INVALID_DATA', 'NONE']
            expect(validCodes).toContain(component.errorMessageCode)
        })

        it('should maintain subscription references', () => {
            component.ngOnInit()

            expect(component['subscriptionFAQ']).not.toBeNull()
            expect(component['subscriptionActiveFAQ']).not.toBeNull()
            expect(component['defaultSideNavBarOpenedSubscription']).not.toBeNull()
        })
    })
})