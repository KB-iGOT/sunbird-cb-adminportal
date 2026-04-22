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
    let mockLoaderService: any
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
            getProvidersList: jest.fn().mockReturnValue(of({ result: { data: [], totalCount: 0 } })),
            deleteProvider: jest.fn(),
            changeStatusRegisterProvider: jest.fn(),
            contentRegisterList: jest.fn().mockReturnValue(of({ result: { data: [], totalCount: 0 } })),
            activateProvider: jest.fn()
        }

        mockSnackBar = {
            open: jest.fn(),
            openFromComponent: jest.fn()
        }

        mockDatePipe = {
            transform: jest.fn().mockReturnValue('Jan 01, 2023')
        }

        mockLoaderService = {
            setLoaderState: jest.fn()
        }

        mockDialogRef = {
            afterClosed: jest.fn(() => of(true))
        }

        // Create component instance with all 6 required constructor params
        component = new MarketPlaceDashboardComponent(
            mockDialog,
            mockRouter,
            mockMarketPlaceSvc,
            mockSnackBar,
            mockDatePipe,
            mockLoaderService
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
            expect(component.helpCenterGuide.header).toBe('SPV Help Center: Video Guides and Tips')
            expect(component.helpCenterGuide.guideNotes).toHaveLength(2)
        })

        it('should initialize with default values', () => {
            expect(component.providersList).toEqual([])
            expect(component.displayLoader).toBe(false)
            expect(component.searchKey).toBe('')
            expect(component.menuItems).toEqual([])
            expect(component.currentTab).toBe('onboardProviders')
        })
    })

    describe('ngOnInit', () => {
        it('should call intializeTableData on init', () => {
            const spy = jest.spyOn(component, 'intializeTableData').mockImplementation(() => { })
            component.ngOnInit()
            expect(spy).toHaveBeenCalled()
        })
    })

    describe('ngAfterViewInit', () => {
        it('should add CSS class to container when element exists', () => {
            const mockContainer = { classList: { add: jest.fn(), remove: jest.fn() } }
            jest.spyOn(document, 'querySelector').mockReturnValue(mockContainer as any)
            component.ngAfterViewInit()
            expect(mockContainer.classList.add).toHaveBeenCalledWith('container-balanced-padding')
        })

        it('should not throw when container does not exist', () => {
            jest.spyOn(document, 'querySelector').mockReturnValue(null)
            expect(() => component.ngAfterViewInit()).not.toThrow()
        })
    })

    describe('ngOnDestroy', () => {
        it('should set isComponentActive to false', () => {
            jest.spyOn(document, 'querySelector').mockReturnValue(null)
            component.ngOnDestroy()
            expect(component.isComponentActive).toBe(false)
        })

        it('should remove CSS class from container when element exists', () => {
            const mockContainer = { classList: { add: jest.fn(), remove: jest.fn() } }
            jest.spyOn(document, 'querySelector').mockReturnValue(mockContainer as any)
            component.ngOnDestroy()
            expect(mockContainer.classList.remove).toHaveBeenCalledWith('container-balanced-padding')
        })
    })

    describe('intializeTableData', () => {
        beforeEach(() => {
            jest.spyOn(component, 'getProviders').mockImplementation(() => { })
        })

        it('should set up table configuration with required columns', () => {
            component.intializeTableData()
            expect(component.tabledata.columns.length).toBeGreaterThan(0)
            expect(component.tabledata.needCheckBox).toBe(false)
            expect(component.tabledata.showDeleteAll).toBe(false)
        })

        it('should clear menu items', () => {
            component.menuItems = [{ icon: 'old', btnText: 'old', action: 'old' }]
            component.intializeTableData()
            expect(component.menuItems).toEqual([])
        })

        it('should initialize pagination details', () => {
            component.intializeTableData()
            expect(component.paginationDetails).toBeDefined()
            expect(component.paginationDetails.currentPage).toBe(1)
            expect(component.paginationDetails.pageSize).toBe(20)
        })

        it('should call getProviders', () => {
            const spy = jest.spyOn(component, 'getProviders')
            component.intializeTableData()
            expect(spy).toHaveBeenCalled()
        })
    })

    describe('initailizeProviderRequestsTable', () => {
        it('should set up provider requests table configuration', () => {
            component.initailizeProviderRequestsTable()
            expect(component.tabledata.columns.length).toBeGreaterThan(0)
            expect(component.tabledata.needCheckBox).toBe(false)
            expect(component.tabledata.acceptRejectMenu).toBe(true)
        })

        it('should clear menu items', () => {
            component.menuItems = [{ icon: 'old', btnText: 'old', action: 'old' }]
            component.initailizeProviderRequestsTable()
            expect(component.menuItems).toEqual([])
        })
    })

    describe('initializePagination', () => {
        it('should initialize paginationDetails', () => {
            component.initializePagination()
            expect(component.paginationDetails).toEqual({
                currentPage: 1,
                pageSize: 20,
                totalCount: 20,
                paginationSizeOptions: [20, 50, 100]
            })
        })

        it('should reset sortData to defaults', () => {
            component.sortData = { field: 'custom', direction: 'asc' }
            component.initializePagination()
            expect(component.sortData).toEqual({ field: 'createdOn', direction: 'desc' })
        })
    })

    describe('getProviders', () => {
        beforeEach(() => {
            component.paginationDetails = {
                currentPage: 1,
                pageSize: 20,
                totalCount: 20,
                paginationSizeOptions: [20, 50, 100]
            }
        })

        it('should call loaderService.setLoaderState(true) at start of getProviders', () => {
            component.getProviders()
            expect(mockLoaderService.setLoaderState).toHaveBeenCalledWith(true)
        })

        it('should call loaderService.setLoaderState(true)', () => {
            component.getProviders()
            expect(mockLoaderService.setLoaderState).toHaveBeenCalledWith(true)
        })

        it('should call marketPlaceSvc.getProvidersList', () => {
            component.getProviders()
            expect(mockMarketPlaceSvc.getProvidersList).toHaveBeenCalled()
        })

        it('should include searchString when searchKey is provided', () => {
            component.searchKey = 'test'
            component.getProviders()
            const calledWith = mockMarketPlaceSvc.getProvidersList.mock.calls[0][0]
            expect(calledWith.searchString).toBe('test')
        })

        it('should not include searchString when searchKey is empty', () => {
            component.searchKey = ''
            component.getProviders()
            const calledWith = mockMarketPlaceSvc.getProvidersList.mock.calls[0][0]
            expect(calledWith.searchString).toBeUndefined()
        })

        it('should unsubscribe existing subscription before new one', () => {
            const mockSub = { unsubscribe: jest.fn() }
            component.apiSubscription = mockSub
            component.getProviders()
            expect(mockSub.unsubscribe).toHaveBeenCalled()
        })

        it('should handle successful response and update providersList', () => {
            const mockResponse = {
                result: { data: [{ id: 1, contentPartnerName: 'P1', createdOn: '2023-01-01' }], totalCount: 1 }
            }
            mockMarketPlaceSvc.getProvidersList.mockReturnValue(of(mockResponse))
            component.getProviders()
            expect(component.displayLoader).toBe(false)
            expect(component.providersList.length).toBe(1)
            expect(component.paginationDetails.totalCount).toBe(1)
        })

        it('should handle error response and show snackbar', () => {
            const mockError = { error: { params: { errMsg: 'Load failed' } } } as HttpErrorResponse
            jest.spyOn(component, 'showSnackBar').mockImplementation(() => { })
            mockMarketPlaceSvc.getProvidersList.mockReturnValue(throwError(mockError))
            component.getProviders()
            expect(component.displayLoader).toBe(false)
            expect(component.showSnackBar).toHaveBeenCalledWith('Load failed', 'error')
        })

        it('should handle error with no errMsg using null', () => {
            const mockError = { error: { params: {} } } as HttpErrorResponse
            jest.spyOn(component, 'showSnackBar').mockImplementation(() => { })
            mockMarketPlaceSvc.getProvidersList.mockReturnValue(throwError(mockError))
            component.getProviders()
            expect(component.showSnackBar).toHaveBeenCalledWith(undefined, 'error')
        })
    })

    describe('listProvidersRequests', () => {
        beforeEach(() => {
            component.paginationDetails = {
                currentPage: 1,
                pageSize: 20,
                totalCount: 20,
                paginationSizeOptions: [20, 50, 100]
            }
        })

        it('should call loaderService.setLoaderState(true)', () => {
            component.listProvidersRequests()
            expect(mockLoaderService.setLoaderState).toHaveBeenCalledWith(true)
        })

        it('should clear providersRequestsList', () => {
            component.providersRequestsList = [{ id: 'old' }] as any
            component.listProvidersRequests()
            expect(component.providersRequestsList).toEqual([])
        })

        it('should call contentRegisterList service', () => {
            component.listProvidersRequests()
            expect(mockMarketPlaceSvc.contentRegisterList).toHaveBeenCalled()
        })

        it('should include searchString when searchKey is set', () => {
            component.searchKey = 'search'
            component.listProvidersRequests()
            const calledWith = mockMarketPlaceSvc.contentRegisterList.mock.calls[0][0]
            expect(calledWith.searchString).toBe('search')
        })

        it('should handle successful response', () => {
            const mockResponse = {
                result: { data: [{ id: 1 }], totalCount: 1 }
            }
            mockMarketPlaceSvc.contentRegisterList.mockReturnValue(of(mockResponse))
            component.listProvidersRequests()
            expect(component.paginationDetails.totalCount).toBe(1)
        })

        it('should handle error response', () => {
            const mockError = { error: { params: { errMsg: 'List failed' } } } as HttpErrorResponse
            jest.spyOn(component, 'showSnackBar').mockImplementation(() => { })
            mockMarketPlaceSvc.contentRegisterList.mockReturnValue(throwError(mockError))
            component.listProvidersRequests()
            expect(component.showSnackBar).toHaveBeenCalledWith('List failed', 'error')
        })
    })

    describe('onSearch', () => {
        it('should push value to searchProvider$ subject', () => {
            const nextSpy = jest.spyOn(component.searchProvider$, 'next')
            component.onSearch('abc')
            expect(nextSpy).toHaveBeenCalledWith('abc')
        })
    })

    describe('onSearchRegisteredPartners', () => {
        it('should push value to searchRegisteredProvider$ subject', () => {
            const nextSpy = jest.spyOn(component.searchRegisteredProvider$, 'next')
            component.onSearchRegisteredPartners('xyz')
            expect(nextSpy).toHaveBeenCalledWith('xyz')
        })
    })

    describe('formateProvidersList', () => {
        it('should return empty array for falsy input', () => {
            expect(component.formateProvidersList(null)).toEqual([])
            expect(component.formateProvidersList(undefined)).toEqual([])
        })

        it('should format each provider with transformed dates', () => {
            const providers = [{ id: 1, contentPartnerName: 'P1', createdOn: '2023-01-01T00:00:00Z' }]
            const result = component.formateProvidersList(providers)
            expect(result).toHaveLength(1)
            expect(result[0].createdOn).toBe('Jan 01, 2023')
            expect(result[0].updatedOn).toBe('Jan 01, 2023')
        })
    })

    describe('providerEvents', () => {
        beforeEach(() => {
            jest.spyOn(component, 'navigateToConfigurationV2').mockImplementation(() => { })
            jest.spyOn(component, 'openConformationPopup').mockImplementation(() => { })
            jest.spyOn(component, 'activateProvider').mockImplementation(() => { })
            jest.spyOn(component, 'acceptRejectProviderStatus').mockImplementation(() => { })
        })

        it('should call navigateToConfigurationV2 for configure action', () => {
            component.providerEvents({ action: 'configure', rows: { id: '1', contentPartnerName: 'P', isAuthenticate: true, partnerCode: 'X' } })
            expect(component.navigateToConfigurationV2).toHaveBeenCalled()
        })

        it('should call navigateToConfigurationV2 with tab for sso_integration action', () => {
            component.providerEvents({ action: 'sso_integration', rows: { id: '1', contentPartnerName: 'P', isAuthenticate: true, partnerCode: 'X' } })
            expect(component.navigateToConfigurationV2).toHaveBeenCalledWith(expect.objectContaining({ tab: 'sso_integration' }))
        })

        it('should call openConformationPopup for deactivate_provider action', () => {
            const rows = { id: '1' }
            component.providerEvents({ action: 'deactivate_provider', rows })
            expect(component.openConformationPopup).toHaveBeenCalledWith(rows)
        })

        it('should call activateProvider for activate_provider action', () => {
            const rows = { id: '1' }
            component.providerEvents({ action: 'activate_provider', rows })
            expect(component.activateProvider).toHaveBeenCalledWith(rows)
        })

        it('should call acceptRejectProviderStatus for accept action', () => {
            const rows = { id: '1' }
            component.providerEvents({ action: 'accept', rows })
            expect(component.acceptRejectProviderStatus).toHaveBeenCalledWith('accept', rows)
        })

        it('should call acceptRejectProviderStatus for reject action', () => {
            const rows = { id: '1' }
            component.providerEvents({ action: 'reject', rows })
            expect(component.acceptRejectProviderStatus).toHaveBeenCalledWith('reject', rows)
        })

        it('should navigate with PENDING status for view action when status is PENDING', () => {
            const rows = { id: '1', status: 'PENDING', contentPartnerName: 'P', isAuthenticate: false, partnerCode: 'Y' }
            component.providerEvents({ action: 'view', rows })
            expect(component.navigateToConfigurationV2).toHaveBeenCalledWith(expect.any(Object), 'PENDING')
        })

        it('should navigate without status for view action when status is not PENDING', () => {
            const rows = { id: '1', status: 'APPROVED', contentPartnerName: 'P', isAuthenticate: false, partnerCode: 'Y' }
            component.providerEvents({ action: 'view', rows })
            expect(component.navigateToConfigurationV2).toHaveBeenCalledWith(expect.any(Object))
        })
    })

    describe('acceptRejectProviderStatus', () => {
        it('should call changeStatusRegisterProvider with APPROVED for accept', () => {
            const rowData = { id: 'p1' }
            mockMarketPlaceSvc.changeStatusRegisterProvider.mockReturnValue(of({}))
            jest.spyOn(component, 'listProvidersRequests').mockImplementation(() => { })
            jest.spyOn(component, 'showSnackBar').mockImplementation(() => { })
            component.acceptRejectProviderStatus('accept', rowData)
            expect(mockMarketPlaceSvc.changeStatusRegisterProvider).toHaveBeenCalledWith({ id: 'p1', status: 'APPROVED' })
        })

        it('should call changeStatusRegisterProvider with REJECTED for reject', () => {
            const rowData = { id: 'p2' }
            mockMarketPlaceSvc.changeStatusRegisterProvider.mockReturnValue(of({}))
            jest.spyOn(component, 'listProvidersRequests').mockImplementation(() => { })
            jest.spyOn(component, 'showSnackBar').mockImplementation(() => { })
            component.acceptRejectProviderStatus('reject', rowData)
            expect(mockMarketPlaceSvc.changeStatusRegisterProvider).toHaveBeenCalledWith({ id: 'p2', status: 'REJECTED' })
        })

        it('should show success snackbar on success', () => {
            const rowData = { id: 'p1' }
            mockMarketPlaceSvc.changeStatusRegisterProvider.mockReturnValue(of({}))
            jest.spyOn(component, 'listProvidersRequests').mockImplementation(() => { })
            jest.spyOn(component, 'showSnackBar').mockImplementation(() => { })
            component.acceptRejectProviderStatus('accept', rowData)
            expect(component.showSnackBar).toHaveBeenCalledWith('The request has been approved successfully.', 'success')
        })

        it('should show error snackbar on error', () => {
            const rowData = { id: 'p1' }
            const mockError = { error: { params: { errMsg: 'Status error' } } } as HttpErrorResponse
            mockMarketPlaceSvc.changeStatusRegisterProvider.mockReturnValue(throwError(mockError))
            jest.spyOn(component, 'showSnackBar').mockImplementation(() => { })
            component.acceptRejectProviderStatus('accept', rowData)
            expect(component.showSnackBar).toHaveBeenCalledWith('Status error', 'error')
        })
    })

    describe('navigateToConfiguration', () => {
        it('should navigate with provider id when provided', () => {
            component.navigateToConfiguration({ id: '42' })
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/marketplace-providers/onboard-partner/42'])
        })

        it('should navigate to base path when no provider details', () => {
            component.navigateToConfiguration()
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/marketplace-providers/onboard-partner'])
        })
    })

    describe('navigateToConfigurationV2', () => {
        it('should navigate with id queryParam', () => {
            component.navigateToConfigurationV2({ id: '10' })
            expect(mockRouter.navigate).toHaveBeenCalledWith(
                ['/app/home/marketplace-providers/configure-provider'],
                { queryParams: { id: '10' } }
            )
        })

        it('should navigate with status queryParam', () => {
            component.navigateToConfigurationV2({ id: '10' }, 'PENDING')
            expect(mockRouter.navigate).toHaveBeenCalledWith(
                ['/app/home/marketplace-providers/configure-provider'],
                { queryParams: { id: '10', status: 'PENDING' } }
            )
        })

        it('should navigate to base path when no provider details', () => {
            component.navigateToConfigurationV2()
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/marketplace-providers/configure-provider'])
        })

        it('should include tab in queryParams when provided', () => {
            component.navigateToConfigurationV2({ id: '5', tab: 'sso_integration' })
            expect(mockRouter.navigate).toHaveBeenCalledWith(
                ['/app/home/marketplace-providers/configure-provider'],
                { queryParams: { id: '5', tab: 'sso_integration' } }
            )
        })
    })

    describe('openConformationPopup', () => {
        it('should open dialog and call deleteProvider on confirm', () => {
            mockDialogRef.afterClosed.mockReturnValue(of(true))
            mockDialog.open.mockReturnValue(mockDialogRef)
            jest.spyOn(component, 'deleteProvider').mockImplementation(() => { })

            component.openConformationPopup({ id: 'prov1' })

            expect(mockDialog.open).toHaveBeenCalled()
            expect(component.deleteProvider).toHaveBeenCalledWith('prov1')
        })

        it('should not call deleteProvider on cancel', () => {
            mockDialogRef.afterClosed.mockReturnValue(of(false))
            mockDialog.open.mockReturnValue(mockDialogRef)
            jest.spyOn(component, 'deleteProvider').mockImplementation(() => { })

            component.openConformationPopup({ id: 'prov1' })
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

        it('should call getProviders after timeout on success', () => {
            mockMarketPlaceSvc.deleteProvider.mockReturnValue(of(true))
            component.deleteProvider('123')
            jest.advanceTimersByTime(2000)
            expect(component.getProviders).toHaveBeenCalled()
        })

        it('should set displayLoader false when res is falsy', () => {
            mockMarketPlaceSvc.deleteProvider.mockReturnValue(of(null))
            component.deleteProvider('123')
            expect(component.displayLoader).toBe(false)
        })

        it('should handle error and show snackbar', () => {
            const mockError = { error: { params: { errMsg: 'Del error' } } } as HttpErrorResponse
            jest.spyOn(component, 'showSnackBar').mockImplementation(() => { })
            mockMarketPlaceSvc.deleteProvider.mockReturnValue(throwError(mockError))
            component.deleteProvider('123')
            expect(component.displayLoader).toBe(false)
            expect(component.showSnackBar).toHaveBeenCalledWith('Del error', 'error')
        })

        it('should use default message when errMsg not present', () => {
            const mockError = {} as HttpErrorResponse
            jest.spyOn(component, 'showSnackBar').mockImplementation(() => { })
            mockMarketPlaceSvc.deleteProvider.mockReturnValue(throwError(mockError))
            component.deleteProvider('123')
            expect(component.showSnackBar).toHaveBeenCalledWith('Something went wrong', 'error')
        })
    })

    describe('activateProvider', () => {
        beforeEach(() => {
            jest.spyOn(component, 'getProviders').mockImplementation(() => { })
        })

        it('should call activateProvider service', () => {
            mockMarketPlaceSvc.activateProvider.mockReturnValue(of({ success: true }))
            component.activateProvider({ id: 'p1' })
            expect(mockMarketPlaceSvc.activateProvider).toHaveBeenCalledWith({ partnerId: 'p1' })
        })

        it('should call getProviders and disable loader on success', () => {
            mockMarketPlaceSvc.activateProvider.mockReturnValue(of(true))
            component.activateProvider({ id: 'p1' })
            expect(component.getProviders).toHaveBeenCalled()
            expect(mockLoaderService.setLoaderState).toHaveBeenCalledWith(false)
        })

        it('should show snackbar on error', () => {
            jest.spyOn(component, 'showSnackBar').mockImplementation(() => { })
            mockMarketPlaceSvc.activateProvider.mockReturnValue(throwError(new Error()))
            component.activateProvider({ id: 'p1' })
            expect(component.showSnackBar).toHaveBeenCalledWith('Something went wrong please try again', 'error')
        })
    })

    describe('onPageChange', () => {
        beforeEach(() => {
            jest.spyOn(component, 'getProviders').mockImplementation(() => { })
            jest.spyOn(component, 'listProvidersRequests').mockImplementation(() => { })
            component.paginationDetails = { currentPage: 1, pageSize: 20, totalCount: 0, paginationSizeOptions: [] }
        })

        it('should update paginationDetails and call getProviders for onboardProviders tab', () => {
            component.currentTab = 'onboardProviders'
            component.onPageChange({ currentPage: 2, pageSize: 50 })
            expect(component.paginationDetails.currentPage).toBe(2)
            expect(component.paginationDetails.pageSize).toBe(50)
            expect(component.getProviders).toHaveBeenCalled()
        })

        it('should call listProvidersRequests for providerRequests tab', () => {
            component.currentTab = 'providerRequests'
            component.onPageChange({ currentPage: 2, pageSize: 20 })
            expect(component.listProvidersRequests).toHaveBeenCalled()
        })
    })

    describe('handleOnTabChange', () => {
        beforeEach(() => {
            jest.spyOn(component, 'intializeTableData').mockImplementation(() => { })
            jest.spyOn(component, 'initailizeProviderRequestsTable').mockImplementation(() => { })
            jest.spyOn(component, 'initializePagination').mockImplementation(() => { })
            jest.spyOn(component, 'listProvidersRequests').mockImplementation(() => { })
        })

        it('should initialize providers table for tab index 0', () => {
            component.handleOnTabChange({ index: 0 })
            expect(component.intializeTableData).toHaveBeenCalled()
            expect(component.currentTab).toBe('onboardProviders')
        })

        it('should initialize requests table for tab index 1', () => {
            component.handleOnTabChange({ index: 1 })
            expect(component.initailizeProviderRequestsTable).toHaveBeenCalled()
            expect(component.initializePagination).toHaveBeenCalled()
            expect(component.listProvidersRequests).toHaveBeenCalled()
            expect(component.currentTab).toBe('providerRequests')
        })
    })

    describe('showSnackBar', () => {
        it('should call snackBar.openFromComponent with message and type', () => {
            component.showSnackBar('Success!', 'success')
            expect(mockSnackBar.openFromComponent).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    data: { message: 'Success!', type: 'success' },
                    duration: 5000,
                    panelClass: 'success'
                })
            )
        })

        it('should call snackBar.openFromComponent with error type', () => {
            component.showSnackBar('Error!', 'error')
            expect(mockSnackBar.openFromComponent).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    data: { message: 'Error!', type: 'error' },
                    panelClass: 'error'
                })
            )
        })
    })

    describe('onSortChange', () => {
        beforeEach(() => {
            jest.spyOn(component, 'initializePagination').mockImplementation(() => { })
            jest.spyOn(component, 'getProviders').mockImplementation(() => { })
            jest.spyOn(component, 'listProvidersRequests').mockImplementation(() => { })
        })

        it('should return early for isActive field', () => {
            component.onSortChange({ field: 'isActive', direction: 'asc' })
            expect(component.initializePagination).not.toHaveBeenCalled()
        })

        it('should call getProviders for onboardProviders tab', () => {
            component.currentTab = 'onboardProviders'
            component.onSortChange({ field: 'updatedOn', direction: 'desc' })
            expect(component.getProviders).toHaveBeenCalled()
        })

        it('should call listProvidersRequests for providerRequests tab', () => {
            component.currentTab = 'providerRequests'
            component.onSortChange({ field: 'createdOn', direction: 'asc' })
            expect(component.listProvidersRequests).toHaveBeenCalled()
        })

        it('should update sortData', () => {
            component.currentTab = 'onboardProviders'
            component.onSortChange({ field: 'name', direction: 'asc' })
            expect(component.sortData).toEqual({ field: 'name', direction: 'asc' })
        })
    })
})