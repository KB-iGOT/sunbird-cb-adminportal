import { OnboardingRequestsComponent } from './onboarding-requests.component'
import { of, Subject } from 'rxjs'

describe('OnboardingRequestsComponent', () => {
    let component: OnboardingRequestsComponent
    let mockRouter: any
    let mockActivatedRoute: any
    let mockRequestService: any
    let mockChangeDetectorRef: any
    let paramsSubject: Subject<any>

    beforeEach(() => {
        // Mock dependencies
        paramsSubject = new Subject()

        mockRouter = {
            navigate: jest.fn()
        }

        mockActivatedRoute = {
            params: paramsSubject.asObservable(),
            snapshot: {
                params: { type: 'organisation' },
                parent: {
                    data: {
                        configService: {
                            userRoles: ['user', 'spv_admin']
                        }
                    }
                },
                data: {
                    requestsList: {
                        data: [
                            {
                                wfInfo: [
                                    {
                                        updateFieldValues: JSON.stringify([{
                                            firstName: 'John',
                                            email: 'john@test.com',
                                            mobile: '1234567890',
                                            description: 'Test description',
                                            toValue: { organisation: 'Test Org' }
                                        }]),
                                        createdOn: '2023-01-15T10:00:00Z',
                                        lastUpdatedOn: '2023-01-16T10:00:00Z'
                                    }
                                ]
                            }
                        ]
                    },
                    aprovedrequestsList: {
                        data: [
                            {
                                wfInfo: [
                                    {
                                        updateFieldValues: JSON.stringify([{
                                            firstName: 'Jane',
                                            email: 'jane@test.com',
                                            mobile: '0987654321',
                                            description: 'Approved description',
                                            toValue: { organisation: 'Approved Org' }
                                        }]),
                                        createdOn: '2023-01-10T10:00:00Z',
                                        lastUpdatedOn: '2023-01-17T10:00:00Z'
                                    }
                                ]
                            }
                        ]
                    },
                    rejectedList: {
                        data: [
                            {
                                wfInfo: [
                                    {
                                        updateFieldValues: JSON.stringify([{
                                            firstName: 'Bob',
                                            email: 'bob@test.com',
                                            mobile: '5555555555',
                                            description: 'Rejected description',
                                            toValue: { organisation: 'Rejected Org' }
                                        }]),
                                        createdOn: '2023-01-12T10:00:00Z',
                                        lastUpdatedOn: '2023-01-18T10:00:00Z'
                                    }
                                ]
                            }
                        ]
                    },
                    positionsList: {
                        data: [
                            { name: 'Manager', description: 'Management position' },
                            { name: 'Developer', description: 'Development position' }
                        ]
                    }
                }
            },
            parent: {}
        }

        mockRequestService = {
            getOrgsList: jest.fn().mockReturnValue(of({
                result: {
                    data: [
                        {
                            wfInfo: [
                                {
                                    updateFieldValues: JSON.stringify([{
                                        firstName: 'Service',
                                        email: 'service@test.com',
                                        mobile: '1111111111',
                                        description: 'Service description',
                                        toValue: { organisation: 'Service Org' }
                                    }]),
                                    createdOn: '2023-01-20T10:00:00Z',
                                    lastUpdatedOn: '2023-01-21T10:00:00Z'
                                }
                            ]
                        }
                    ],
                    count: 1
                }
            })),
            getPositionsList: jest.fn().mockReturnValue(of({
                result: {
                    data: [
                        {
                            wfInfo: [
                                {
                                    updateFieldValues: JSON.stringify([{
                                        firstName: 'Position',
                                        email: 'position@test.com',
                                        mobile: '2222222222',
                                        description: 'Position description',
                                        toValue: { position: 'Service Position' }
                                    }]),
                                    createdOn: '2023-01-22T10:00:00Z',
                                    lastUpdatedOn: '2023-01-23T10:00:00Z'
                                }
                            ]
                        }
                    ],
                    count: 1
                }
            }))
        }

        mockChangeDetectorRef = {
            detectChanges: jest.fn()
        }

        // Create component instance
        component = new OnboardingRequestsComponent(
            mockRouter,
            mockActivatedRoute,
            mockRequestService,
            mockChangeDetectorRef
        )
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('Component Initialization', () => {
        it('should create component', () => {
            expect(component).toBeTruthy()
        })

        it('should initialize with default values', () => {
            expect(component.tabledata).toEqual([])
            expect(component.tabledataApproved).toEqual([])
            expect(component.tabledataPositions).toEqual([])
            expect(component.data).toEqual([])
            expect(component.currentFilter).toBe('pending')
            expect(component.isSpvAdmin).toBe(false)
            expect(component.limit).toBe(20)
            expect(component.pageIndex).toBe(0)
            expect(component.currentOffset).toBe(0)
        })
    })

    describe('ngOnInit', () => {
        it('should initialize component for organisation request type', () => {
            component.ngOnInit()

            paramsSubject.next({ type: 'organisation' })

            expect(component.requestType).toBe('organisation')
            expect(component.displayType).toBe('organisation')
            expect(component.currentFilter).toBe('pending')
            expect(component.isSpvAdmin).toBe(true)
            expect(component.data.length).toBeGreaterThan(0)
        })

        it('should initialize component for designation request type', () => {
            component.ngOnInit()

            paramsSubject.next({ type: 'designation' })

            expect(component.requestType).toBe('position')
            expect(component.displayType).toBe('designation')
            expect(component.currentFilter).toBe('designations')
        })

        it('should initialize component for position request type', () => {
            component.ngOnInit()

            paramsSubject.next({ type: 'position' })

            expect(component.requestType).toBe('position')
            expect(component.displayType).toBe('position')
            expect(component.currentFilter).toBe('pending')
            expect(component.data.length).toBe(2)
        })

        it('should handle missing data in snapshot', () => {
            mockActivatedRoute.snapshot.data = null
            component.ngOnInit()

            paramsSubject.next({ type: 'position' })

            expect(component.data).toEqual([])
        })

        it('should call getPendingList when organisation data is not available', () => {
            mockActivatedRoute.snapshot.data.requestsList = null
            jest.spyOn(component, 'getPendingList')

            component.ngOnInit()
            paramsSubject.next({ type: 'organisation' })

            expect(component.getPendingList).toHaveBeenCalled()
        })

        it('should setup tabledata configuration correctly', () => {
            component.ngOnInit()
            paramsSubject.next({ type: 'organisation' })

            expect(component.tabledata.columns).toHaveLength(4)
            expect(component.tabledata.columns[1].key).toBe('organisation')
            expect(component.tabledata.actions).toHaveLength(1)
            expect(component.tabledata.actions[0].name).toBe('edit')
        })
    })

    describe('ngAfterViewChecked', () => {
        it('should call detectChanges', () => {
            component.ngAfterViewChecked()
            expect(mockChangeDetectorRef.detectChanges).toHaveBeenCalled()
        })
    })

    describe('getDisplayName', () => {
        it('should return capitalized display name', () => {
            component.displayType = 'organisation'
            expect(component.getDisplayName()).toBe('Organisation')
        })

        it('should handle empty display type', () => {
            component.displayType = ''
            expect(component.getDisplayName()).toBe('')
        })

        it('should handle single character display type', () => {
            component.displayType = 'a'
            expect(component.getDisplayName()).toBe('A')
        })
    })

    describe('formatData', () => {
        it('should format organisation data correctly', () => {
            component.requestType = 'organisation'
            const mockData = [
                {
                    wfInfo: [
                        {
                            updateFieldValues: JSON.stringify([{
                                firstName: 'Test',
                                email: 'test@test.com',
                                mobile: '1234567890',
                                description: 'Test desc',
                                toValue: { organisation: 'Test Org' }
                            }]),
                            createdOn: '2023-01-15T10:00:00Z',
                            lastUpdatedOn: '2023-01-16T10:00:00Z'
                        }
                    ]
                }
            ]

            component.formatData(mockData, 'pending')

            expect(component.data.length).toBe(1)
            expect(component.data[0].firstName).toBe('Test')
            expect(component.data[0].organisation).toBe('Test Org')
            expect(component.data[0].createdDate).toBe('15-01-2023')
            expect(component.data[0].lastupdateDate).toBe('16-01-2023')
        })

        it('should format position data correctly', () => {
            component.requestType = 'position'
            const mockData = [
                {
                    wfInfo: [
                        {
                            updateFieldValues: JSON.stringify([{
                                firstName: 'Test',
                                email: 'test@test.com',
                                mobile: '1234567890',
                                description: 'Test desc',
                                toValue: { position: 'Test Position' }
                            }]),
                            createdOn: '2023-01-15T10:00:00Z',
                            lastUpdatedOn: '2023-01-16T10:00:00Z'
                        }
                    ]
                }
            ]

            component.formatData(mockData, 'pending')

            expect(component.data.length).toBe(1)
            expect(component.data[0].position).toBe('Test Position')
        })

        it('should format domain data correctly', () => {
            component.requestType = 'domain'
            const mockData = [
                {
                    wfInfo: [
                        {
                            updateFieldValues: JSON.stringify([{
                                firstName: 'Test',
                                email: 'test@test.com',
                                mobile: '1234567890',
                                description: 'Test desc',
                                toValue: { domain: 'Test Domain' }
                            }]),
                            createdOn: '2023-01-15T10:00:00Z',
                            lastUpdatedOn: '2023-01-16T10:00:00Z'
                        }
                    ]
                }
            ]

            component.formatData(mockData, 'pending')

            expect(component.data.length).toBe(1)
        })

        it('should sort by lastUpdatedOn for approved/rejected lists', () => {
            component.requestType = 'organisation'
            const mockData = [
                {
                    wfInfo: [
                        {
                            updateFieldValues: JSON.stringify([{
                                firstName: 'First',
                                email: 'first@test.com',
                                toValue: { organisation: 'First Org' }
                            }]),
                            createdOn: '2023-01-15T10:00:00Z',
                            lastUpdatedOn: '2023-01-16T10:00:00Z'
                        },
                        {
                            updateFieldValues: JSON.stringify([{
                                firstName: 'Second',
                                email: 'second@test.com',
                                toValue: { organisation: 'Second Org' }
                            }]),
                            createdOn: '2023-01-14T10:00:00Z',
                            lastUpdatedOn: '2023-01-17T10:00:00Z'
                        }
                    ]
                }
            ]

            component.formatData(mockData, 'approved')

            expect(component.data[0].firstName).toBe('Second')
        })

        it('should skip data without toValue', () => {
            component.requestType = 'organisation'
            const mockData = [
                {
                    wfInfo: [
                        {
                            updateFieldValues: JSON.stringify([{
                                firstName: 'Test',
                                email: 'test@test.com'
                            }]),
                            createdOn: '2023-01-15T10:00:00Z',
                            lastUpdatedOn: '2023-01-16T10:00:00Z'
                        }
                    ]
                }
            ]

            component.formatData(mockData, 'pending')

            expect(component.data.length).toBe(0)
        })
    })

    describe('filter', () => {
        beforeEach(() => {
            component.requestType = 'organisation'
            component.data = ['existing data']
        })

        it('should filter pending requests', () => {
            jest.spyOn(component, 'getPendingList')

            component.filter('pending')

            expect(component.currentFilter).toBe('pending')
            expect(component.data).toEqual([])
            expect(component.pageIndex).toBe(0)
            expect(component.currentOffset).toBe(0)
            expect(component.limit).toBe(20)
            expect(component.totalRecords).toBe(0)
        })

        it('should filter approved requests', () => {
            jest.spyOn(component, 'getApprovedList')

            component.filter('approved')

            expect(component.currentFilter).toBe('approved')
            expect(component.getApprovedList).toHaveBeenCalled()
        })

        it('should filter rejected requests', () => {
            jest.spyOn(component, 'getRejectedList')

            component.filter('rejected')

            expect(component.currentFilter).toBe('rejected')
            expect(component.getRejectedList).toHaveBeenCalled()
        })

        it('should filter designations', () => {
            component.filter('designations')

            expect(component.currentFilter).toBe('designations')
            expect(component.data.length).toBe(2)
        })

        it('should handle designations with missing data', () => {
            mockActivatedRoute.snapshot.data.positionsList = null

            component.filter('designations')

            expect(component.data).toEqual([])
        })

        it('should use cached data for pending organisation requests', () => {
            jest.spyOn(component, 'formatData')

            component.filter('pending')

            expect(component.formatData).toHaveBeenCalled()
        })

        it('should use cached data for approved organisation requests', () => {
            jest.spyOn(component, 'formatData')

            component.filter('approved')

            expect(component.formatData).toHaveBeenCalled()
        })

        it('should use cached data for rejected organisation requests', () => {
            jest.spyOn(component, 'formatData')

            component.filter('rejected')

            expect(component.formatData).toHaveBeenCalled()
        })
    })

    describe('getPendingList', () => {
        it('should get pending organisation list', () => {
            component.requestType = 'organisation'

            component.getPendingList()

            expect(mockRequestService.getOrgsList).toHaveBeenCalledWith({
                serviceName: 'organisation',
                applicationStatus: 'IN_PROGRESS',
                limit: 20,
                offset: 0,
                deptName: 'iGOT'
            })
            expect(component.pendingListRecord).toBe(1)
        })

        it('should get pending position list', () => {
            component.requestType = 'position'

            component.getPendingList()

            expect(mockRequestService.getPositionsList).toHaveBeenCalledWith({
                serviceName: 'position',
                applicationStatus: 'IN_PROGRESS',
                limit: 20,
                offset: 0,
                deptName: 'iGOT'
            })
            expect(component.pendingListRecord).toBe(1)
        })
    })

    describe('getApprovedList', () => {
        it('should get approved organisation list', () => {
            component.requestType = 'organisation'

            component.getApprovedList()

            expect(mockRequestService.getOrgsList).toHaveBeenCalledWith({
                serviceName: 'organisation',
                applicationStatus: 'APPROVED',
                limit: 20,
                offset: 0,
                deptName: 'iGOT'
            })
            expect(component.totalRecords).toBe(1)
        })

        it('should get approved position list', () => {
            component.requestType = 'position'

            component.getApprovedList()

            expect(mockRequestService.getPositionsList).toHaveBeenCalledWith({
                serviceName: 'position',
                applicationStatus: 'APPROVED',
                limit: 20,
                offset: 0,
                deptName: 'iGOT'
            })
            expect(component.totalRecords).toBe(1)
        })
    })

    describe('getRejectedList', () => {
        it('should get rejected organisation list', () => {
            component.requestType = 'organisation'

            component.getRejectedList()

            expect(mockRequestService.getOrgsList).toHaveBeenCalledWith({
                serviceName: 'organisation',
                applicationStatus: 'REJECTED',
                limit: 20,
                offset: 0,
                deptName: 'iGOT'
            })
            expect(component.totalRecords).toBe(1)
        })

        it('should get rejected position list', () => {
            component.requestType = 'position'

            component.getRejectedList()

            expect(mockRequestService.getPositionsList).toHaveBeenCalledWith({
                serviceName: 'position',
                applicationStatus: 'REJECTED',
                limit: 20,
                offset: 0,
                deptName: 'iGOT'
            })
            expect(component.totalRecords).toBe(1)
        })
    })

    describe('actionsClick', () => {
        it('should navigate to requests-approval', () => {
            const event = { action: 'edit', row: { id: 1 } }

            component.actionsClick(event)

            expect(mockRouter.navigate).toHaveBeenCalledWith(
                ['requests-approval'],
                { relativeTo: mockActivatedRoute.parent, state: event }
            )
        })
    })

    describe('findSpvAdmin', () => {
        it('should set isSpvAdmin to true when spv_admin role exists', () => {
            const roles = ['user', 'spv_admin', 'another_role']

            component.findSpvAdmin(roles)

            expect(component.isSpvAdmin).toBe(true)
        })

        it('should keep isSpvAdmin false when spv_admin role does not exist', () => {
            const roles = ['user', 'another_role']

            component.findSpvAdmin(roles)

            expect(component.isSpvAdmin).toBe(false)
        })

        it('should handle empty roles array', () => {
            const roles: any[] = []

            component.findSpvAdmin(roles)

            expect(component.isSpvAdmin).toBe(false)
        })
    })

    describe('onPaginateChange', () => {
        it('should handle pagination change with same page size', () => {
            jest.spyOn(component, 'getPendingList')
            component.currentFilter = 'pending'
            const event: any = { pageIndex: 2, pageSize: 20 }

            component.onPaginateChange(event)

            expect(component.pageIndex).toBe(2)
            expect(component.limit).toBe(20)
            expect(component.currentOffset).toBe(2)
            expect(component.getPendingList).toHaveBeenCalled()
        })

        it('should handle pagination change with different page size', () => {
            jest.spyOn(component, 'getApprovedList')
            component.currentFilter = 'approved'
            const event: any = { pageIndex: 1, pageSize: 50 }

            component.onPaginateChange(event)

            expect(component.pageIndex).toBe(0)
            expect(component.limit).toBe(50)
            expect(component.currentOffset).toBe(0)
            expect(component.getApprovedList).toHaveBeenCalled()
        })

        it('should call getRejectedList for rejected filter', () => {
            jest.spyOn(component, 'getRejectedList')
            component.currentFilter = 'rejected'
            const event: any = { pageIndex: 1, pageSize: 20 }

            component.onPaginateChange(event)

            expect(component.getRejectedList).toHaveBeenCalled()
        })

        it('should not call any list method for other filters', () => {
            jest.spyOn(component, 'getPendingList')
            jest.spyOn(component, 'getApprovedList')
            jest.spyOn(component, 'getRejectedList')
            component.currentFilter = 'designations'
            const event: any = { pageIndex: 1, pageSize: 20 }

            component.onPaginateChange(event)

            expect(component.getPendingList).not.toHaveBeenCalled()
            expect(component.getApprovedList).not.toHaveBeenCalled()
            expect(component.getRejectedList).not.toHaveBeenCalled()
        })
    })

    describe('Edge Cases', () => {
        it('should handle malformed JSON in updateFieldValues', () => {
            component.requestType = 'organisation'
            const mockData = [
                {
                    wfInfo: [
                        {
                            updateFieldValues: 'invalid json',
                            createdOn: '2023-01-15T10:00:00Z',
                            lastUpdatedOn: '2023-01-16T10:00:00Z'
                        }
                    ]
                }
            ]

            expect(() => component.formatData(mockData, 'pending')).toThrow()
        })

        it('should handle missing userRoles in route data', () => {
            mockActivatedRoute.snapshot.parent.data.configService.userRoles = undefined

            expect(() => component.ngOnInit()).not.toThrow()
        })

        it('should handle null wfInfo', () => {
            component.requestType = 'organisation'
            const mockData = [
                {
                    wfInfo: null
                }
            ]

            expect(() => component.formatData(mockData, 'pending')).toThrow()
        })
    })
})