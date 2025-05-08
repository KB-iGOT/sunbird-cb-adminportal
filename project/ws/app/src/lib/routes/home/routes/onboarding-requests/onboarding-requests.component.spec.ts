import { OnboardingRequestsComponent } from './onboarding-requests.component'
import { of } from 'rxjs'
import * as _ from 'lodash'

describe('OnboardingRequestsComponent', () => {
    let component: OnboardingRequestsComponent
    let mockRouter: any
    let mockActivatedRoute: any
    let mockRequestService: any
    let mockChangeDetectorRef: any

    beforeEach(() => {
        // Mock dependencies
        mockRouter = {
            navigate: jest.fn()
        }

        mockActivatedRoute = {
            params: of({ type: 'organisation' }),
            snapshot: {
                params: { type: 'organisation' },
                parent: {
                    data: {
                        configService: {
                            userRoles: ['user']
                        }
                    }
                },
                data: {
                    requestsList: {
                        data: []
                    },
                    aprovedrequestsList: {
                        data: []
                    },
                    rejectedList: {
                        data: []
                    },
                    positionsList: {
                        data: []
                    }
                }
            }
        }

        mockRequestService = {
            getPositionsList: jest.fn().mockReturnValue(of({
                result: {
                    data: [],
                    count: 10
                }
            })),
            getOrgsList: jest.fn().mockReturnValue(of({
                result: {
                    data: [],
                    count: 10
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

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    describe('ngOnInit', () => {
        it('should set user roles and check for spv_admin role', () => {
            // Arrange
            const spyFindSpvAdmin = jest.spyOn(component, 'findSpvAdmin')

            // Act
            component.ngOnInit()

            // Assert
            expect(spyFindSpvAdmin).toHaveBeenCalledWith(['user'])
            expect(component.isSpvAdmin).toBe(false)
        })

        it('should handle position type request', () => {
            // Arrange
            mockActivatedRoute.params = of({ type: 'position' })
            mockActivatedRoute.snapshot.params.type = 'position'
            mockActivatedRoute.snapshot.data.positionsList.data = [
                { name: 'Position 1', description: 'Description 1' },
                { name: 'Position 2', description: 'Description 2' }
            ]

            // Act
            component.ngOnInit()

            // Assert
            expect(component.requestType).toBe('position')
            expect(component.displayType).toBe('position')
            expect(component.currentFilter).toBe('pending')
            expect(component.data.length).toBe(2)
        })

        it('should handle designation type request', () => {
            // Arrange
            mockActivatedRoute.params = of({ type: 'designation' })
            mockActivatedRoute.snapshot.params.type = 'designation'

            // Act
            component.ngOnInit()

            // Assert
            expect(component.requestType).toBe('position')
            expect(component.displayType).toBe('designation')
            expect(component.currentFilter).toBe('designations')
        })

        it('should handle organisation type request', () => {
            // Arrange
            mockActivatedRoute.params = of({ type: 'organisation' })
            mockActivatedRoute.snapshot.params.type = 'organisation'
            const formatDataSpy = jest.spyOn(component, 'formatData')

            // Act
            component.ngOnInit()

            // Assert
            expect(component.requestType).toBe('organisation')
            expect(component.displayType).toBe('organisation')
            expect(component.currentFilter).toBe('pending')
            expect(formatDataSpy).toHaveBeenCalled()
        })

        it('should setup table columns correctly', () => {
            // Act
            component.ngOnInit()

            // Assert
            expect(component.tabledata.columns.length).toBe(4)
            expect(component.tabledata.columns[1].key).toBe('organisation')
            expect(component.tabledata.columns[1].displayName).toBe('Organisation')

            expect(component.tabledataApproved.columns.length).toBe(4)
            expect(component.tabledataPositions.columns.length).toBe(2)
        })
    })

    describe('getDisplayName', () => {
        it('should capitalize the first letter of display type', () => {
            // Arrange
            component.displayType = 'position'

            // Act
            const result = component.getDisplayName()

            // Assert
            expect(result).toBe('Position')
        })
    })

    describe('formatData', () => {
        it('should format organisation data correctly', () => {
            // Arrange
            component.requestType = 'organisation'
            const mockResData = [{
                wfInfo: [{
                    createdOn: '2025-01-01T00:00:00',
                    lastUpdatedOn: '2025-01-02T00:00:00',
                    updateFieldValues: JSON.stringify([{
                        toValue: {
                            organisation: 'Test Org'
                        },
                        description: 'Org description',
                        firstName: 'John',
                        email: 'john@example.com',
                        mobile: '1234567890'
                    }])
                }]
            }]

            // Act
            component.formatData(mockResData, 'pending')

            // Assert
            expect(component.data.length).toBe(1)
            expect(component.data[0].organisation).toBe('Test Org')
            expect(component.data[0].firstName).toBe('John')
            expect(component.data[0].createdDate).toBe('01-01-2025')
            expect(component.data[0].lastupdateDate).toBe('02-01-2025')
        })

        it('should format position data correctly', () => {
            // Arrange
            component.requestType = 'position'
            const mockResData = [{
                wfInfo: [{
                    createdOn: '2025-01-01T00:00:00',
                    lastUpdatedOn: '2025-01-02T00:00:00',
                    updateFieldValues: JSON.stringify([{
                        toValue: {
                            position: 'Test Position'
                        },
                        description: 'Position description',
                        firstName: 'John',
                        email: 'john@example.com',
                        mobile: '1234567890'
                    }])
                }]
            }]

            // Act
            component.formatData(mockResData, 'pending')

            // Assert
            expect(component.data.length).toBe(1)
            expect(component.data[0].position).toBe('Test Position')
        })

        it('should sort data by createdOn date for pending list', () => {
            // Arrange
            component.requestType = 'organisation'
            const mockResData = [{
                wfInfo: [
                    {
                        createdOn: '2025-01-02T00:00:00',
                        lastUpdatedOn: '2025-01-03T00:00:00',
                        updateFieldValues: JSON.stringify([{
                            toValue: {
                                organisation: 'Org 2'
                            },
                            description: 'Desc 2',
                            firstName: 'Jane',
                            email: 'jane@example.com',
                            mobile: '0987654321'
                        }])
                    },
                    {
                        createdOn: '2025-01-01T00:00:00',
                        lastUpdatedOn: '2025-01-02T00:00:00',
                        updateFieldValues: JSON.stringify([{
                            toValue: {
                                organisation: 'Org 1'
                            },
                            description: 'Desc 1',
                            firstName: 'John',
                            email: 'john@example.com',
                            mobile: '1234567890'
                        }])
                    }
                ]
            }]

            // Act
            component.formatData(mockResData, 'pending')

            // Assert
            expect(component.data.length).toBe(2)
            expect(component.data[0].organisation).toBe('Org 2') // Most recent first
        })

        it('should sort data by lastUpdatedOn date for approved/rejected list', () => {
            // Arrange
            component.requestType = 'organisation'
            const mockResData = [{
                wfInfo: [
                    {
                        createdOn: '2025-01-01T00:00:00',
                        lastUpdatedOn: '2025-01-02T00:00:00',
                        updateFieldValues: JSON.stringify([{
                            toValue: {
                                organisation: 'Org 1'
                            },
                            description: 'Desc 1',
                            firstName: 'John',
                            email: 'john@example.com'
                        }])
                    },
                    {
                        createdOn: '2025-01-02T00:00:00',
                        lastUpdatedOn: '2025-01-03T00:00:00',
                        updateFieldValues: JSON.stringify([{
                            toValue: {
                                organisation: 'Org 2'
                            },
                            description: 'Desc 2',
                            firstName: 'Jane',
                            email: 'jane@example.com'
                        }])
                    }
                ]
            }]

            // Act
            component.formatData(mockResData, 'approved')

            // Assert
            expect(component.data.length).toBe(2)
            expect(component.data[0].organisation).toBe('Org 2') // Most recently updated first
        })
    })

    describe('filter', () => {
        it('should reset pagination variables when filter is changed', () => {
            // Arrange
            component.pageIndex = 2
            component.currentOffset = 40
            component.limit = 50
            component.totalRecords = 100

            // Act
            component.filter('pending')

            // Assert
            expect(component.pageIndex).toBe(0)
            expect(component.currentOffset).toBe(0)
            expect(component.limit).toBe(20)
            expect(component.totalRecords).toBe(0)
        })

        it('should call getPendingList for pending filter', () => {
            // Arrange
            component.requestType = 'position'
            const spy = jest.spyOn(component, 'getPendingList')

            // Act
            component.filter('pending')

            // Assert
            expect(spy).toHaveBeenCalled()
            expect(component.currentFilter).toBe('pending')
        })

        it('should call getApprovedList for approved filter', () => {
            // Arrange
            component.requestType = 'position'
            const spy = jest.spyOn(component, 'getApprovedList')

            // Act
            component.filter('approved')

            // Assert
            expect(spy).toHaveBeenCalled()
            expect(component.currentFilter).toBe('approved')
        })

        it('should call getRejectedList for rejected filter', () => {
            // Arrange
            component.requestType = 'position'
            const spy = jest.spyOn(component, 'getRejectedList')

            // Act
            component.filter('rejected')

            // Assert
            expect(spy).toHaveBeenCalled()
            expect(component.currentFilter).toBe('rejected')
        })

        it('should handle designations filter correctly', () => {
            // Arrange
            mockActivatedRoute.snapshot.data.positionsList.data = [
                { name: 'Position 1', description: 'Description 1' },
                { name: 'Position 2', description: 'Description 2' }
            ]

            // Act
            component.filter('designations')

            // Assert
            expect(component.currentFilter).toBe('designations')
            expect(component.data.length).toBe(2)
        })
    })

    describe('getPendingList', () => {
        it('should call getPositionsList for position requests', () => {
            // Arrange
            component.requestType = 'position'

            // Act
            component.getPendingList()

            // Assert
            expect(mockRequestService.getPositionsList).toHaveBeenCalledWith({
                serviceName: 'position',
                applicationStatus: 'IN_PROGRESS',
                limit: component.limit,
                offset: component.currentOffset,
                deptName: 'iGOT'
            })
        })

        it('should call getOrgsList for organisation requests', () => {
            // Arrange
            component.requestType = 'organisation'

            // Act
            component.getPendingList()

            // Assert
            expect(mockRequestService.getOrgsList).toHaveBeenCalledWith({
                serviceName: 'organisation',
                applicationStatus: 'IN_PROGRESS',
                limit: component.limit,
                offset: component.currentOffset,
                deptName: 'iGOT'
            })
        })
    })

    describe('getApprovedList', () => {
        it('should call service with correct params', () => {
            // Arrange
            component.requestType = 'position'

            // Act
            component.getApprovedList()

            // Assert
            expect(mockRequestService.getPositionsList).toHaveBeenCalledWith({
                serviceName: 'position',
                applicationStatus: 'APPROVED',
                limit: component.limit,
                offset: component.currentOffset,
                deptName: 'iGOT'
            })
        })
    })

    describe('getRejectedList', () => {
        it('should call service with correct params', () => {
            // Arrange
            component.requestType = 'organisation'

            // Act
            component.getRejectedList()

            // Assert
            expect(mockRequestService.getOrgsList).toHaveBeenCalledWith({
                serviceName: 'organisation',
                applicationStatus: 'REJECTED',
                limit: component.limit,
                offset: component.currentOffset,
                deptName: 'iGOT'
            })
        })
    })

    describe('actionsClick', () => {
        it('should navigate to requests-approval with event data', () => {
            // Arrange
            const event = { action: 'edit', row: { id: 123 } }

            // Act
            component.actionsClick(event)

            // Assert
            expect(mockRouter.navigate).toHaveBeenCalledWith(
                ['requests-approval'],
                { relativeTo: mockActivatedRoute.parent, state: event }
            )
        })
    })

    describe('findSpvAdmin', () => {
        it('should set isSpvAdmin to true when role is present', () => {
            // Arrange
            const roles = ['user', 'spv_admin', 'other_role']

            // Act
            component.findSpvAdmin(roles)

            // Assert
            expect(component.isSpvAdmin).toBe(true)
        })

        it('should keep isSpvAdmin as false when role is not present', () => {
            // Arrange
            const roles = ['user', 'other_role']

            // Act
            component.findSpvAdmin(roles)

            // Assert
            expect(component.isSpvAdmin).toBe(false)
        })
    })

    describe('onPaginateChange', () => {
        it('should update pagination variables and call correct list function', () => {
            // Arrange
            const event = { pageIndex: 2, pageSize: 25, length: 100 } as any
            component.currentFilter = 'pending'
            const spy = jest.spyOn(component, 'getPendingList')

            // Act
            component.onPaginateChange(event)

            // Assert
            expect(component.pageIndex).toBe(2)
            expect(component.limit).toBe(25)
            expect(component.currentOffset).toBe(2)
            expect(spy).toHaveBeenCalled()
        })

        it('should call getApprovedList when current filter is approved', () => {
            // Arrange
            const event = { pageIndex: 1, pageSize: 20, length: 100 } as any
            component.currentFilter = 'approved'
            const spy = jest.spyOn(component, 'getApprovedList')

            // Act
            component.onPaginateChange(event)

            // Assert
            expect(spy).toHaveBeenCalled()
        })

        it('should call getRejectedList when current filter is rejected', () => {
            // Arrange
            const event = { pageIndex: 1, pageSize: 20, length: 100 } as any
            component.currentFilter = 'rejected'
            const spy = jest.spyOn(component, 'getRejectedList')

            // Act
            component.onPaginateChange(event)

            // Assert
            expect(spy).toHaveBeenCalled()
        })
    })
})