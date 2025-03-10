import { ConfigureMarketplaceProvidersComponent } from './configure-marketplace-providers.component'
import { of, throwError } from 'rxjs'

jest.mock('lodash', () => ({
    get: jest.fn(),
}))

describe('ConfigureMarketplaceProvidersComponent', () => {
    let component: ConfigureMarketplaceProvidersComponent
    let activatedRouteMock: any
    let snackBarMock: any
    let marketplaceServiceMock: any

    beforeEach(() => {
        // Mock services
        activatedRouteMock = {
            data: of({
                providerDetails: { data: { result: 'providerData' } },
                pageData: { data: { configureCertificateGuide: { helpCenterGuide: 'guide', instructions: 'instructions' } } }
            })
        }

        snackBarMock = {
            open: jest.fn()
        }

        marketplaceServiceMock = {
            getProviderDetails: jest.fn().mockReturnValue(of({ result: 'providerDetails' }))
        }

        // Create component instance
        component = new ConfigureMarketplaceProvidersComponent(
            activatedRouteMock,
            snackBarMock,
            marketplaceServiceMock
        )
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize widgetData correctly', () => {
        expect(component.widgetData).toEqual({
            titles: [
                { title: 'Marketplace Providers', url: '/app/home/marketplace-providers', path: '/app/home/marketplace-providers' },
                { title: 'Onboard Provider', url: 'none' },
                { title: 'Configure', url: 'none' }
            ]
        })
    })

    it('should call getRoutesData and set providerDetails and disableCourseCatalog correctly', () => {
        component.ngOnInit()
        expect(component.providerDetails).toBe('providerData')
        expect(component.disableCourseCatalog).toBe(false)
    })

    it('should call getRoutesData and set helpCenterGuide and instructionsList correctly', () => {
        component.ngOnInit()
        expect(component.helpCenterGuide).toBe('guide')
        expect(component.instructionsList).toBe('instructions')
    })

    it('should call getProviderDetails and set providerDetails on success', () => {
        // const response = { result: 'newProviderDetails' }
        component.providerDetails = { id: 123 }

        component.getProviderDetails({})

        expect(marketplaceServiceMock.getProviderDetails).toHaveBeenCalledWith(123)
        marketplaceServiceMock.getProviderDetails().subscribe(() => {
            expect(component.providerDetails).toBe('newProviderDetails')
            expect(component.disableCourseCatalog).toBe(false)
        })
    })

    it('should call showSnackBar when getProviderDetails fails', () => {
        const errorResponse = {
            error: {
                params: {
                    errMsg: 'Error occurred'
                }
            }
        }

        marketplaceServiceMock.getProviderDetails = jest.fn().mockReturnValue(throwError(errorResponse))
        component.providerDetails = { id: 123 }

        component.getProviderDetails({})

        expect(snackBarMock.open).toHaveBeenCalledWith('Error occurred')
    })

    it('should show default error message when error response does not contain errMsg', () => {
        const errorResponse = {
            error: {}
        }

        marketplaceServiceMock.getProviderDetails = jest.fn().mockReturnValue(throwError(errorResponse))
        component.providerDetails = { id: 123 }

        component.getProviderDetails({})

        expect(snackBarMock.open).toHaveBeenCalledWith('Something went worng, please try again later')
    })

    it('should call showSnackBar with custom message when error occurs', () => {
        const customErrorMessage = 'Custom error message'

        component.showSnackBar(customErrorMessage)

        expect(snackBarMock.open).toHaveBeenCalledWith(customErrorMessage)
    })
})
