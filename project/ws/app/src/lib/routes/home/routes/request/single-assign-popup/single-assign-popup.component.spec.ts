import { SingleAssignPopupComponent } from './single-assign-popup.component'
import { of, throwError } from 'rxjs'

// Create a proper mock form interface
interface MockFormGroup {
    controls: any
    value: any
    setValue: (value: any) => void
    patchValue: (value: any) => void
}

// Mock dependencies
const createMockForm = (): MockFormGroup => ({
    controls: {
        assignee: { setValue: jest.fn() },
        orgSearch: { valueChanges: of('') }
    },
    value: {
        assignee: null,
        orgSearch: ''
    },
    setValue: jest.fn(),
    patchValue: jest.fn()
})

const mockFormBuilder = {
    group: jest.fn(() => createMockForm())
}

const mockRequestService = {
    getRequestTypeList: jest.fn(),
    createDemand: jest.fn()
}

const mockDialogData = {
    title: 'Test Title',
    objective: 'Test Objective',
    typeOfUser: 'learner',
    competencies: ['skill1', 'skill2'],
    referenceLink: 'http://test.com',
    requestType: 'training',
    preferredProvider: 'provider1',
    status: 'active',
    owner: 'test-owner',
    demand_id: '123',
    learningMode: 'online',
    assignedProvider: 'Test Provider'
}

const mockDialogRef = {
    close: jest.fn()
}

const mockConfigService = {
    confService: {
        userProfile: {
            userId: 'user123'
        }
    }
}

describe('SingleAssignPopupComponent', () => {
    let component: SingleAssignPopupComponent
    let mockPaginator: any
    let mockForm: MockFormGroup

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks()

        // Create mock paginator
        mockPaginator = {
            pageIndex: 0,
            pageSize: 5
        }

        // Create fresh mock form
        mockForm = createMockForm()
        mockFormBuilder.group.mockReturnValue(mockForm)

        // Initialize component
        component = new SingleAssignPopupComponent(
            mockFormBuilder as any,
            mockRequestService as any,
            mockDialogData,
            mockConfigService as any,
            mockDialogRef as any
        )
    })

    describe('Constructor', () => {
        it('should create component with proper dependencies', () => {
            expect(component).toBeDefined()
            expect(component.data).toEqual(mockDialogData)
            expect(mockFormBuilder.group).toHaveBeenCalled()
        })

        it('should initialize form with required validators', () => {
            expect(mockFormBuilder.group).toHaveBeenCalledWith({
                assignee: expect.any(Object),
                orgSearch: expect.any(Object)
            })
        })
    })

    describe('ngOnInit', () => {
        beforeEach(() => {
            mockRequestService.getRequestTypeList.mockReturnValue(of([
                { id: 1, orgName: 'Provider 1' },
                { id: 2, orgName: 'Provider 2' }
            ]))
        })

        it('should initialize component properties', () => {
            component.ngOnInit()

            expect(component.assignText).toBe('Assign')
            expect(component.submitAssign).toBe('Assign')
            expect(component.userId).toBe('user123')
        })

        it('should call getOrgListData', () => {
            const spy = jest.spyOn(component, 'getOrgListData')
            component.ngOnInit()

            expect(spy).toHaveBeenCalled()
        })

        it('should set userId from userProfile', () => {
            component.ngOnInit()
            expect(component.userId).toBe('user123')
        })

        it('should set userId from userProfileV2 when userProfile is not available', () => {
            const mockConfigWithV2 = {
                confService: {
                    userProfile: null,
                    userProfileV2: {
                        userId: 'userV2-456'
                    }
                }
            }

            component = new SingleAssignPopupComponent(
                mockFormBuilder as any,
                mockRequestService as any,
                mockDialogData,
                mockConfigWithV2 as any,
                mockDialogRef as any
            )

            component.ngOnInit()
            expect(component.userId).toBe('userV2-456')
        })
    })

    describe('getOrgListData', () => {
        it('should fetch organization list successfully', () => {
            const mockData = [
                { id: 1, orgName: 'Provider 1' },
                { id: 2, orgName: 'Provider 2' }
            ]
            mockRequestService.getRequestTypeList.mockReturnValue(of(mockData))

            component.getOrgListData()

            expect(mockRequestService.getRequestTypeList).toHaveBeenCalledWith({
                request: {
                    filters: {
                        isCbp: true,
                    },
                },
            })
            expect(component.requestTypeData).toEqual(mockData)
            expect(component.filterRequestData).toEqual(mockData)
            expect(component.dataSource.data).toEqual(mockData)
        })

        it('should handle empty response', () => {
            mockRequestService.getRequestTypeList.mockReturnValue(of(null))

            component.getOrgListData()

            expect(component.requestTypeData).toBeUndefined()
        })

        it('should call setFormData after successful data fetch', () => {
            const mockData = [{ id: 1, orgName: 'Provider 1' }]
            mockRequestService.getRequestTypeList.mockReturnValue(of(mockData))
            const spy = jest.spyOn(component, 'setFormData')

            component.getOrgListData()

            expect(spy).toHaveBeenCalled()
        })
    })

    describe('setFormData', () => {
        beforeEach(() => {
            component.requestTypeData = [
                { id: 1, orgName: 'Provider 1' },
                { id: 2, orgName: 'Test Provider' },
                { id: 3, orgName: 'Provider 3' }
            ]
        })

        it('should set re-assign text when assignedProvider exists', () => {
            component.setFormData()

            expect(component.assignText).toBe('Re-assign')
            expect(component.submitAssign).toBe('Re-Assign')
        })

        it('should move assigned provider to first position', () => {
            component.setFormData()

            expect(component.requestTypeData[0].orgName).toBe('Test Provider')
            expect(component.requestTypeData[0].id).toBe(2)
        })

        it('should handle case when assigned provider is not found', () => {
            component.data.assignedProvider = 'Non-existent Provider'
            const originalData = [...component.requestTypeData]

            component.setFormData()

            expect(component.requestTypeData).toEqual(originalData)
        })

        it('should not modify array when assigned provider is already first', () => {
            component.requestTypeData = [
                { id: 2, orgName: 'Test Provider' },
                { id: 1, orgName: 'Provider 1' },
                { id: 3, orgName: 'Provider 3' }
            ]

            component.setFormData()

            expect(component.requestTypeData[0].orgName).toBe('Test Provider')
            expect(component.requestTypeData.length).toBe(3)
        })
    })

    describe('onChangePage', () => {
        it('should update page properties and call getOrgListData', () => {
            const event = { pageIndex: 2, pageSize: 10 }
            const spy = jest.spyOn(component, 'getOrgListData')

            component.onChangePage(event)

            expect(component.pageNumber).toBe(2)
            expect(component.pageSize).toBe(10)
            expect(spy).toHaveBeenCalled()
        })
    })

    describe('onSubmitAssign', () => {
        beforeEach(() => {
            component.userId = 'user123'
            // Mock form value by updating the mock's value property
            mockForm.value = {
                assignee: {
                    id: 'provider123',
                    orgName: 'Selected Provider'
                },
                orgSearch: ''
            }
            component.requestForm = mockForm as any
        })

        it('should submit assignment request successfully', () => {
            mockRequestService.createDemand.mockReturnValue(of({ success: true }))

            component.onSubmitAssign()

            expect(mockRequestService.createDemand).toHaveBeenCalledWith({
                title: mockDialogData.title,
                objective: mockDialogData.objective,
                typeOfUser: mockDialogData.typeOfUser,
                competencies: mockDialogData.competencies,
                referenceLink: mockDialogData.referenceLink,
                requestType: mockDialogData.requestType,
                preferredProvider: mockDialogData.preferredProvider,
                assignedProvider: {
                    providerName: 'Selected Provider',
                    providerId: 'provider123'
                },
                status: mockDialogData.status,
                source: mockDialogData.owner,
                demand_id: mockDialogData.demand_id,
                learningMode: mockDialogData.learningMode
            })

            expect(mockDialogRef.close).toHaveBeenCalledWith({ data: 'confirmed' })
        })

        it('should handle assignment request error', () => {
            const error = new Error('Assignment failed')
            mockRequestService.createDemand.mockReturnValue(throwError(error))

            component.onSubmitAssign()

            expect(mockDialogRef.close).toHaveBeenCalledWith({ error })
        })

        it('should not submit when no assignee is selected', () => {
            mockForm.value = {
                assignee: null,
                orgSearch: ''
            }
            component.requestForm = mockForm as any

            component.onSubmitAssign()

            expect(mockRequestService.createDemand).not.toHaveBeenCalled()
            expect(mockDialogRef.close).not.toHaveBeenCalled()
        })

        it('should handle case when assignee is undefined', () => {
            mockForm.value = {
                assignee: undefined,
                orgSearch: ''
            }
            component.requestForm = mockForm as any

            component.onSubmitAssign()

            expect(mockRequestService.createDemand).not.toHaveBeenCalled()
        })
    })

    describe('cancel', () => {
        it('should close dialog without data', () => {
            component.cancel()

            expect(mockDialogRef.close).toHaveBeenCalledWith()
        })
    })

    describe('setDataSourceAttributes', () => {
        it('should set paginator to dataSource', () => {
            component.paginator = mockPaginator
            component.setDataSourceAttributes()

            expect(component.dataSource.paginator).toBe(mockPaginator)
        })
    })

    describe('matPaginator setter', () => {
        it('should set paginator and call setDataSourceAttributes', () => {
            const spy = jest.spyOn(component, 'setDataSourceAttributes')

            component.matPaginator = mockPaginator

            expect(component.paginator).toBe(mockPaginator)
            expect(spy).toHaveBeenCalled()
        })
    })

    describe('Component Properties', () => {
        it('should initialize with default values', () => {
            expect(component.displayedColumns).toEqual(['select', 'name'])
            expect(component.providerList).toEqual([])
            expect(component.pageNumber).toBe(0)
            expect(component.pageSize).toBe(5)
            expect(component.isDisable).toBe(false)
            expect(component.assignText).toBe('')
            expect(component.submitAssign).toBe('')
            expect(component.requestTypeData).toEqual([])
            expect(component.filterRequestData).toEqual([])
        })
    })

    describe('Error Handling', () => {
        it('should handle getOrgListData service error gracefully', () => {
            mockRequestService.getRequestTypeList.mockReturnValue(throwError('Service error'))

            expect(() => component.getOrgListData()).not.toThrow()
        })

        it('should handle missing config service data', () => {
            const componentWithoutConfig = new SingleAssignPopupComponent(
                mockFormBuilder as any,
                mockRequestService as any,
                mockDialogData,
                { confService: {} } as any,
                mockDialogRef as any
            )

            expect(() => componentWithoutConfig.ngOnInit()).not.toThrow()
        })
    })

    describe('Integration Tests', () => {
        it('should complete full flow: init -> fetch data -> set form -> submit', async () => {
            const mockData = [
                { id: 1, orgName: 'Provider 1' },
                { id: 2, orgName: 'Test Provider' }
            ]

            mockRequestService.getRequestTypeList.mockReturnValue(of(mockData))
            mockRequestService.createDemand.mockReturnValue(of({ success: true }))

            // Initialize
            component.ngOnInit()

            // Verify data was fetched and form was set
            expect(component.requestTypeData).toEqual(mockData)
            expect(component.assignText).toBe('Re-assign')

            // Set assignee and submit
            mockForm.value = {
                assignee: { id: 'provider123', orgName: 'Selected Provider' },
                orgSearch: ''
            }
            component.requestForm = mockForm as any
            component.onSubmitAssign()

            // Verify submission
            expect(mockRequestService.createDemand).toHaveBeenCalled()
            expect(mockDialogRef.close).toHaveBeenCalledWith({ data: 'confirmed' })
        })
    })
})