import { MarketPlaceDashboardComponent } from './market-place-dashboard.component'
import { of, throwError } from 'rxjs'
import { HttpErrorResponse } from '@angular/common/http'

describe('MarketPlaceDashboardComponent', () => {
    let component: MarketPlaceDashboardComponent
    let mockDialog: any
    let mockRouter: any
    let mockMarketPlaceSvc: any
    let mockSnackBar: any
    let mockDatePipe: any
    let mockDialogRef: any

    beforeEach(() => {
        // Mock dependencies
        mockDialog = {
            open: jest.fn()
        }

        mockRouter = {
            navigate: jest.fn()
        }

        mockMarketPlaceSvc = {
            getProvidersList: jest.fn(),
            deleteProvider: jest.fn()
        }

        mockSnackBar = {
            open: jest.fn()
        }

        mockDatePipe = {
            transform: jest.fn()
        }

        mockDialogRef = {
            afterClosed: jest.fn(() => of(true))
        }

        // Create component instance
        component = new MarketPlaceDashboardComponent(
            mockDialog,
            mockRouter,
            mockMarketPlaceSvc,
            mockSnackBar,
            mockDatePipe
        )
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('Component Initialization', () => {
        it('should create component', () => {
            expect(component).toBeDefined()
        })

        it('should have correct helpCenterGuide configuration', () => {
            expect(component.helpCenterGuide).toEqual({
                header: 'SPV Help Center: Video Guides and Tips',
                guideNotes: [
                    'Ensure all mandatory fields in the onboarding form regarding the content provider are filled. Once completed, proceed to uploading course catalog for the content provider.',
                    'Reach out to support team for authenticating the content provider',
                ],
                helpVideoLink: `/assets/public/content/guide-videos/CIOS_Updated_demo.mp4`,
            })
        })

        it('should initialize with default values', () => {
            expect(component.providersList).toEqual([])
            expect(component.displayLoader).toBe(false)
            expect(component.searchKey).toBe('')
            expect(component.menuItems).toEqual([])
        })
    })

    describe('ngOnInit', () => {
        it('should call intializeTableData', () => {
            const spy = jest.spyOn(component, 'intializeTableData')
            component.ngOnInit()
            expect(spy).toHaveBeenCalled()
        })
    })

    describe('intializeTableData', () => {
        beforeEach(() => {
            jest.spyOn(component, 'getProviders').mockImplementation(() => { })
        })

        it('should set up table configuration correctly', () => {
            component.intializeTableData()

            expect(component.tabledata).toEqual({
                columns: [
                    { displayName: 'Content Provider Name', key: 'contentPartnerName', cellType: 'text', imageKey: 'link' },
                    { displayName: 'Onboarded On', key: 'createdOn', cellType: 'text', cellClass: 'cell-gray-text' },
                    { displayName: 'Last Updated On', key: 'updatedOn', cellType: 'text', cellClass: 'cell-gray-text' },
                    { displayName: 'Authentication', key: 'isAuthenticate', cellType: 'authentication' },
                ],
                needCheckBox: false,
                showDeleteAll: false,
            })
        })

        it('should set up menu items correctly', () => {
            component.intializeTableData()

            expect(component.menuItems).toEqual([
                {
                    icon: 'edit',
                    btnText: 'Configure',
                    action: 'configure',
                }
            ])
        })

        it('should set up pagination details correctly', () => {
            component.intializeTableData()

            expect(component.paginationDetails).toEqual({
                startIndex: 0,
                lastIndes: 20,
                pageSize: 20,
                pageIndex: 0,
                totalCount: 20,
            })
        })

        it('should call getProviders', () => {
            const spy = jest.spyOn(component, 'getProviders')
            component.intializeTableData()
            expect(spy).toHaveBeenCalled()
        })
    })

    describe('getProviders', () => {
        beforeEach(() => {
            component.paginationDetails = {
                startIndex: 0,
                lastIndes: 20,
                pageSize: 20,
                pageIndex: 0,
                totalCount: 20,
            }
        })

        it('should set displayLoader to true initially', () => {
            mockMarketPlaceSvc.getProvidersList.mockReturnValue(of({}))
            component.getProviders()
            expect(component.displayLoader).toBe(true)
        })

        it('should reset providersList', () => {
            mockMarketPlaceSvc.getProvidersList.mockReturnValue(of({}))
            component.providersList = ['existing']
            component.getProviders()
            expect(component.providersList).toEqual([])
        })

        it('should call marketPlaceSvc.getProvidersList with correct parameters', () => {
            mockMarketPlaceSvc.getProvidersList.mockReturnValue(of({}))
            component.getProviders()

            const expectedFormBody = {
                filterCriteriaMap: {
                    isActive: true,
                },
                pageNumber: 0,
                pageSize: 20,
                facets: ['contentPartnerName'],
                orderBy: 'createdOn',
                orderDirection: 'desc',
            }

            expect(mockMarketPlaceSvc.getProvidersList).toHaveBeenCalledWith(expectedFormBody)
        })

        it('should include searchString when searchKey is provided', () => {
            component.searchKey = 'test search'
            mockMarketPlaceSvc.getProvidersList.mockReturnValue(of({}))
            component.getProviders()

            const expectedFormBody = {
                filterCriteriaMap: {
                    isActive: true,
                },
                pageNumber: 0,
                pageSize: 20,
                facets: ['contentPartnerName'],
                orderBy: 'createdOn',
                orderDirection: 'desc',
                searchString: 'test search'
            }

            expect(mockMarketPlaceSvc.getProvidersList).toHaveBeenCalledWith(expectedFormBody)
        })

        it('should unsubscribe existing subscription', () => {
            const mockSubscription = { unsubscribe: jest.fn() }
            component.apiSubscription = mockSubscription
            mockMarketPlaceSvc.getProvidersList.mockReturnValue(of({}))

            component.getProviders()

            expect(mockSubscription.unsubscribe).toHaveBeenCalled()
        })

        it('should handle successful response', () => {
            const mockResponse = {
                result: {
                    data: [{ id: 1, name: 'Provider 1' }],
                    totalCount: 5
                }
            }

            jest.spyOn(component, 'formateProvidersList').mockReturnValue(['formatted provider'])
            mockMarketPlaceSvc.getProvidersList.mockReturnValue(of(mockResponse))

            component.getProviders()

            expect(component.displayLoader).toBe(false)
            expect(component.providersList).toEqual(['formatted provider'])
            expect(component.paginationDetails.totalCount).toBe(5)
        })

        it('should handle error response', () => {
            const mockError = {
                error: {
                    params: {
                        errMsg: 'Error message'
                    }
                }
            } as HttpErrorResponse

            jest.spyOn(component, 'showSnackBar').mockImplementation(() => { })
            mockMarketPlaceSvc.getProvidersList.mockReturnValue(throwError(mockError))

            component.getProviders()

            expect(component.displayLoader).toBe(false)
            expect(component.showSnackBar).toHaveBeenCalledWith('Error message')
        })
    })

    describe('onSearch', () => {
        it('should set searchKey and call getProviders', () => {
            jest.spyOn(component, 'getProviders').mockImplementation(() => { })

            component.onSearch('test search')

            expect(component.searchKey).toBe('test search')
            expect(component.getProviders).toHaveBeenCalled()
        })
    })

    describe('formateProvidersList', () => {
        beforeEach(() => {
            mockDatePipe.transform.mockReturnValue('Jan 01, 2023')
        })

        it('should return empty array for null/undefined input', () => {
            expect(component.formateProvidersList(null)).toEqual([])
            expect(component.formateProvidersList(undefined)).toEqual([])
        })

        it('should format providers list correctly', () => {
            const mockProviders = [
                { id: 1, name: 'Provider 1', createdOn: '2023-01-01' },
                { id: 2, name: 'Provider 2', createdOn: '2023-01-02' }
            ]

            const result = component.formateProvidersList(mockProviders)

            expect(mockDatePipe.transform).toHaveBeenCalledTimes(4) // 2 calls per provider
            expect(result).toHaveLength(2)
            expect(result[0].createdOn).toBe('Jan 01, 2023')
            expect(result[0].updatedOn).toBe('Jan 01, 2023')
        })
    })

    describe('providerEvents', () => {
        it('should handle configure action', () => {
            jest.spyOn(component, 'navigateToConfiguration').mockImplementation(() => { })

            const event = {
                action: 'configure',
                rows: {
                    id: '123',
                    contentPartnerName: 'Test Provider',
                    isAuthenticate: true,
                    partnerCode: 'TEST123'
                }
            }

            component.providerEvents(event)

            const expectedProviderDetails = {
                id: '123',
                providerName: 'Test Provider',
                isAuthenticated: true,
                partnerCode: 'TEST123'
            }

            expect(component.navigateToConfiguration).toHaveBeenCalledWith(expectedProviderDetails)
        })

        it('should handle deactivate action', () => {
            jest.spyOn(component, 'openConformationPopup').mockImplementation(() => { })

            const event = {
                action: 'deactivate',
                row: { id: '123', name: 'Test Provider' }
            }

            component.providerEvents(event)

            expect(component.openConformationPopup).toHaveBeenCalledWith(event.row)
        })
    })

    describe('navigateToConfiguration', () => {
        it('should navigate to provider configuration with ID', () => {
            const providerDetails = { id: '123' }

            component.navigateToConfiguration(providerDetails)

            expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/marketplace-providers/onboard-partner/123'])
        })

        it('should navigate to new provider configuration without ID', () => {
            component.navigateToConfiguration()

            expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/marketplace-providers/onboard-partner'])
        })
    })

    describe('openConformationPopup', () => {
        beforeEach(() => {
            mockDialog.open.mockReturnValue(mockDialogRef)
            jest.spyOn(component, 'deleteProvider').mockImplementation(() => { })
        })

        it('should open confirmation dialog with correct configuration', () => {
            const provider = { id: '123', name: 'Test Provider' }

            component.openConformationPopup(provider)

            expect(mockDialog.open).toHaveBeenCalledWith(
                expect.any(Function), // ConformationPopupComponent
                expect.objectContaining({
                    autoFocus: false,
                    width: '626px',
                    maxWidth: '80vw',
                    maxHeight: '90vh',
                    height: '225px',
                    disableClose: true,
                })
            )
        })

        it('should call deleteProvider when dialog returns true', () => {
            const provider = { id: '123', name: 'Test Provider' }
            mockDialogRef.afterClosed.mockReturnValue(of(true))

            component.openConformationPopup(provider)

            expect(component.deleteProvider).toHaveBeenCalledWith('123')
        })

        it('should not call deleteProvider when dialog returns false', () => {
            const provider = { id: '123', name: 'Test Provider' }
            mockDialogRef.afterClosed.mockReturnValue(of(false))

            component.openConformationPopup(provider)

            expect(component.deleteProvider).not.toHaveBeenCalled()
        })
    })

    describe('deleteProvider', () => {
        beforeEach(() => {
            jest.spyOn(component, 'getProviders').mockImplementation(() => { })
            jest.useFakeTimers()
        })

        afterEach(() => {
            jest.useRealTimers()
        })

        it('should set displayLoader to true initially', () => {
            mockMarketPlaceSvc.deleteProvider.mockReturnValue(of(true))

            component.deleteProvider('123')

            expect(component.displayLoader).toBe(true)
        })

        it('should handle successful deletion', () => {
            mockMarketPlaceSvc.deleteProvider.mockReturnValue(of(true))

            component.deleteProvider('123')

            jest.advanceTimersByTime(2000)

            expect(component.getProviders).toHaveBeenCalled()
        })

        it('should handle unsuccessful deletion', () => {
            mockMarketPlaceSvc.deleteProvider.mockReturnValue(of(false))

            component.deleteProvider('123')

            expect(component.displayLoader).toBe(false)
            expect(component.getProviders).not.toHaveBeenCalled()
        })

        it('should handle error during deletion', () => {
            const mockError = {
                error: {
                    params: {
                        errMsg: 'Delete error'
                    }
                }
            } as HttpErrorResponse

            jest.spyOn(component, 'showSnackBar').mockImplementation(() => { })
            mockMarketPlaceSvc.deleteProvider.mockReturnValue(throwError(mockError))

            component.deleteProvider('123')

            expect(component.displayLoader).toBe(false)
            expect(component.showSnackBar).toHaveBeenCalledWith('Delete error')
        })

        it('should use default error message when errMsg is not available', () => {
            const mockError = {} as HttpErrorResponse

            jest.spyOn(component, 'showSnackBar').mockImplementation(() => { })
            mockMarketPlaceSvc.deleteProvider.mockReturnValue(throwError(mockError))

            component.deleteProvider('123')

            expect(component.showSnackBar).toHaveBeenCalledWith('Something went wrong')
        })
    })

    describe('onPageChange', () => {
        it('should update pagination details and call getProviders', () => {
            jest.spyOn(component, 'getProviders').mockImplementation(() => { })

            const newPaginationDetails = {
                startIndex: 20,
                lastIndes: 40,
                pageSize: 20,
                pageIndex: 1,
                totalCount: 100,
            }

            component.onPageChange(newPaginationDetails)

            expect(component.paginationDetails).toEqual(newPaginationDetails)
            expect(component.getProviders).toHaveBeenCalled()
        })
    })

    describe('showSnackBar', () => {
        it('should call snackBar.open with message', () => {
            const message = 'Test message'

            component.showSnackBar(message)

            expect(mockSnackBar.open).toHaveBeenCalledWith(message)
        })
    })
})