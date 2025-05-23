import { AssignListPopupComponent } from './assign-list-popup.component'
import { UntypedFormBuilder } from '@angular/forms'
import { of, throwError } from 'rxjs'

describe('AssignListPopupComponent', () => {
    let component: AssignListPopupComponent
    let mockFormBuilder: jest.Mocked<UntypedFormBuilder>
    let mockRequestService: any
    let mockDialogRef: any
    let mockData: any

    // Mock sessionStorage
    const mockSessionStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn()
    }

    beforeEach(() => {
        // Mock dependencies
        mockFormBuilder = {
            group: jest.fn()
        } as any

        mockRequestService = {
            getOrgInterestList: jest.fn(),
            assignToOrg: jest.fn()
        }

        mockDialogRef = {
            close: jest.fn()
        }

        mockData = {
            demand_id: 'test-demand-id',
            assignedProvider: null
        }

        // Setup form builder mock
        const mockFormGroup = {
            controls: {
                assignee: {
                    setValue: jest.fn()
                }
            },
            value: {
                assignee: null
            }
        }


        mockFormBuilder.group.mockReturnValue(mockFormGroup as any)

        // Mock global objects
        Object.defineProperty(window, 'sessionStorage', {
            value: mockSessionStorage,
            writable: true
        })

        // Create component instance
        component = new AssignListPopupComponent(
            mockFormBuilder,
            mockRequestService,
            mockData,
            mockDialogRef
        )
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('Constructor', () => {
        it('should create component and initialize form', () => {
            expect(component).toBeDefined()
            expect(mockFormBuilder.group).toHaveBeenCalledWith({
                assignee: expect.any(Object)
            })
        })

        it('should initialize default properties', () => {
            expect(component.displayedColumns).toEqual(['select', 'providerName', 'details', 'eta'])
            expect(component.providerList).toEqual([])
            expect(component.pageNumber).toBe(0)
            expect(component.pageSize).toBe(5)
            expect(component.assignText).toBe('')
            expect(component.submitAssign).toBe('')
        })
    })

    describe('ngOnInit', () => {
        beforeEach(() => {
            jest.spyOn(component, 'getInterestOrgList').mockImplementation(() => { })
        })

        it('should set currentUser from sessionStorage when idDetails exists', () => {
            mockSessionStorage.getItem.mockReturnValue('test-user-id')

            component.ngOnInit()

            expect(mockSessionStorage.getItem).toHaveBeenCalledWith('idDetails')
            expect(component.currentUser).toBe('test-user-id')
        })

        it('should set currentUser to empty string when idDetails does not exist', () => {
            mockSessionStorage.getItem.mockReturnValue(null)

            component.ngOnInit()

            expect(component.currentUser).toBe('')
        })

        it('should set assign text properties', () => {
            component.ngOnInit()

            expect(component.assignText).toBe('Assign')
            expect(component.submitAssign).toBe('Assign')
        })

        it('should call getInterestOrgList', () => {
            component.ngOnInit()

            expect(component.getInterestOrgList).toHaveBeenCalled()
        })
    })

    describe('setFormData', () => {
        beforeEach(() => {
            component.providerList = [
                { orgName: 'Provider A', interestId: '1' },
                { orgName: 'Provider B', interestId: '2' },
                { orgName: 'Provider C', interestId: '3' }
            ]
        })

        it('should set re-assign text when assignedProvider exists', () => {
            component.data.assignedProvider = 'Provider B'

            component.setFormData()

            expect(component.assignText).toBe('Re-assign')
            expect(component.submitAssign).toBe('Re-Assign')
        })

        it('should move assigned provider to the beginning of the list', () => {
            component.data.assignedProvider = 'Provider B'

            component.setFormData()

            expect(component.providerList[0].orgName).toBe('Provider B')
            expect(component.providerList.length).toBe(3)
        })

        it('should not modify list when assignedProvider is not found', () => {
            component.data.assignedProvider = 'Non-existent Provider'
            const originalList = [...component.providerList]

            component.setFormData()

            expect(component.providerList).toEqual(originalList)
        })

        it('should not modify assign text when no assignedProvider', () => {
            component.data.assignedProvider = null
            component.assignText = 'Assign'
            component.submitAssign = 'Assign'

            component.setFormData()

            expect(component.assignText).toBe('Assign')
            expect(component.submitAssign).toBe('Assign')
        })
    })

    describe('getInterestOrgList', () => {
        const mockResponse = {
            data: [
                { orgName: 'Provider A', interestId: '1' },
                { orgName: 'Provider B', interestId: '2' }
            ],
            totalCount: 10
        }

        beforeEach(() => {
            jest.spyOn(component, 'setFormData').mockImplementation(() => { })
        })

        it('should call requestService with correct parameters', () => {
            mockRequestService.getOrgInterestList.mockReturnValue(of(mockResponse))

            component.getInterestOrgList()

            expect(mockRequestService.getOrgInterestList).toHaveBeenCalledWith({
                filterCriteriaMap: {
                    demandId: 'test-demand-id'
                },
                requestedFields: [],
                pageNumber: 0,
                pageSize: 5
            })
        })

        it('should update component properties on successful response', () => {
            mockRequestService.getOrgInterestList.mockReturnValue(of(mockResponse))

            component.getInterestOrgList()

            expect(component.providerList).toEqual(mockResponse.data)
            expect(component.providerCount).toBe(mockResponse.totalCount)
            expect(component.dataSource).toBeDefined()
        })

        it('should call setFormData after successful response', () => {
            mockRequestService.getOrgInterestList.mockReturnValue(of(mockResponse))

            component.getInterestOrgList()

            expect(component.setFormData).toHaveBeenCalled()
        })

        it('should handle empty response data', () => {
            mockRequestService.getOrgInterestList.mockReturnValue(of({ data: null }))

            component.getInterestOrgList()

            expect(component.setFormData).not.toHaveBeenCalled()
        })

        it('should use current pageNumber and pageSize in request', () => {
            component.pageNumber = 2
            component.pageSize = 10
            mockRequestService.getOrgInterestList.mockReturnValue(of(mockResponse))

            component.getInterestOrgList()

            expect(mockRequestService.getOrgInterestList).toHaveBeenCalledWith(
                expect.objectContaining({
                    pageNumber: 2,
                    pageSize: 10
                })
            )
        })
    })

    describe('onChangePage', () => {
        beforeEach(() => {
            jest.spyOn(component, 'getInterestOrgList').mockImplementation(() => { })
        })

        it('should update pageNumber and pageSize', () => {
            const event = {
                pageIndex: 3,
                pageSize: 15
            }

            component.onChangePage(event)

            expect(component.pageNumber).toBe(3)
            expect(component.pageSize).toBe(15)
        })

        it('should call getInterestOrgList after updating pagination', () => {
            const event = {
                pageIndex: 1,
                pageSize: 10
            }

            component.onChangePage(event)

            expect(component.getInterestOrgList).toHaveBeenCalled()
        })
    })

    describe('onSubmitAssign', () => {
        const mockSelectedProvider = {
            interestId: '1',
            demandId: 'demand-1',
            ownerId: 'owner-1',
            orgId: 'org-1',
            description: 'Test description',
            turnAroundTime: '2 days',
            orgName: 'Test Org',
            status: 'active',
            createdOn: '2023-01-01',
            updatedOn: '2023-01-02'
        }

        beforeEach(() => {
            component.requestForm = {
                value: {
                    assignee: mockSelectedProvider
                }
            } as any
            component.currentUser = 'test-user'
        })

        it('should call assignToOrg with correct parameters when provider is selected', () => {
            mockRequestService.assignToOrg.mockReturnValue(of({ success: true }))

            component.onSubmitAssign()

            expect(mockRequestService.assignToOrg).toHaveBeenCalledWith({
                interestId: '1',
                demandId: 'demand-1',
                ownerId: 'owner-1',
                orgId: 'org-1',
                description: 'Test description',
                turnAroundTime: '2 days',
                orgName: 'Test Org',
                status: 'active',
                createdOn: '2023-01-01',
                updatedOn: '2023-01-02'
            })
        })

        it('should close dialog with confirmation data on successful assignment', () => {
            mockRequestService.assignToOrg.mockReturnValue(of({ success: true }))

            component.onSubmitAssign()

            expect(mockDialogRef.close).toHaveBeenCalledWith({ data: 'confirmed' })
        })

        it('should close dialog with error on assignment failure', () => {
            const mockError = { message: 'Assignment failed' }
            mockRequestService.assignToOrg.mockReturnValue(throwError(mockError))

            component.onSubmitAssign()

            expect(mockDialogRef.close).toHaveBeenCalledWith({ error: mockError })
        })

        it('should not call assignToOrg when no provider is selected', () => {
            component.requestForm.value.assignee = null

            component.onSubmitAssign()

            expect(mockRequestService.assignToOrg).not.toHaveBeenCalled()
            expect(mockDialogRef.close).not.toHaveBeenCalled()
        })

        it('should not call assignToOrg when assignee is undefined', () => {
            component.requestForm.value.assignee = undefined

            component.onSubmitAssign()

            expect(mockRequestService.assignToOrg).not.toHaveBeenCalled()
        })
    })

    describe('cancel', () => {
        it('should close dialog without parameters', () => {
            component.cancel()

            expect(mockDialogRef.close).toHaveBeenCalledWith()
        })
    })

    describe('getAssigneeList', () => {
        it('should exist as empty method', () => {
            expect(() => component.getAssigneeList()).not.toThrow()
        })
    })

    describe('Integration scenarios', () => {
        it('should handle complete workflow for new assignment', () => {
            const mockOrgListResponse = {
                data: [{ orgName: 'Provider A', interestId: '1' }],
                totalCount: 1
            }

            mockSessionStorage.getItem.mockReturnValue('user-123')
            mockRequestService.getOrgInterestList.mockReturnValue(of(mockOrgListResponse))
            mockRequestService.assignToOrg.mockReturnValue(of({ success: true }))

            // Initialize component
            component.ngOnInit()

            // Simulate form value
            component.requestForm.value.assignee = mockOrgListResponse.data[0]

            // Submit assignment
            component.onSubmitAssign()

            expect(component.currentUser).toBe('user-123')
            expect(component.assignText).toBe('Assign')
            expect(mockRequestService.getOrgInterestList).toHaveBeenCalled()
            expect(mockRequestService.assignToOrg).toHaveBeenCalled()
            expect(mockDialogRef.close).toHaveBeenCalledWith({ data: 'confirmed' })
        })

        it('should handle complete workflow for re-assignment', () => {
            component.data.assignedProvider = 'Existing Provider'
            component.providerList = [
                { orgName: 'Other Provider', interestId: '1' },
                { orgName: 'Existing Provider', interestId: '2' }
            ]

            const mockOrgListResponse = {
                data: component.providerList,
                totalCount: 2
            }

            mockRequestService.getOrgInterestList.mockReturnValue(of(mockOrgListResponse))

            component.ngOnInit()

            expect(component.assignText).toBe('Re-assign')
            expect(component.submitAssign).toBe('Re-Assign')
            expect(component.providerList[0].orgName).toBe('Existing Provider')
        })
    })
})