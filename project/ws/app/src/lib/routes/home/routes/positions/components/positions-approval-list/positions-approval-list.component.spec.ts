import { PositionsApprovalListComponent } from './positions-approval-list.component'
import { ActivatedRoute, Router } from '@angular/router'
import { PositionsService } from '../../services/position.service'
import { of } from 'rxjs'

describe('PositionsApprovalListComponent', () => {
    let component: PositionsApprovalListComponent
    let mockActivatedRoute: jest.Mocked<ActivatedRoute>
    let mockRouter: jest.Mocked<Router>
    let mockPositionsService: jest.Mocked<PositionsService>

    beforeEach(() => {
        // Create Jest mock objects for dependencies
        mockActivatedRoute = {
            snapshot: {
                data: {}
            },
            parent: {}
        } as jest.Mocked<ActivatedRoute>

        mockRouter = {
            navigate: jest.fn()
        } as unknown as jest.Mocked<Router>

        mockPositionsService = {
            getPositionsList: jest.fn()
        } as unknown as jest.Mocked<PositionsService>

        // Initialize component with mocked dependencies
        component = new PositionsApprovalListComponent(
            mockActivatedRoute,
            mockRouter,
            mockPositionsService
        )
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('constructor', () => {
        it('should create component with correct initial values', () => {
            expect(component).toBeTruthy()
            expect(component.data).toEqual([])
            expect(component.tabledata).toBeDefined()
        })

        it('should initialize tabledata with correct structure', () => {
            expect(component.tabledata.columns).toHaveLength(4)
            expect(component.tabledata.columns[0]).toEqual({ key: 'createdDate', displayName: 'Created On' })
            expect(component.tabledata.columns[1]).toEqual({ key: 'position', displayName: 'Position' })
            expect(component.tabledata.columns[2]).toEqual({ key: 'firstName', displayName: 'Full Name' })
            expect(component.tabledata.columns[3]).toEqual({ key: 'email', displayName: 'Email' })

            expect(component.tabledata.actions).toHaveLength(1)
            expect(component.tabledata.actions[0]).toEqual({
                name: 'edit',
                label: 'Edit',
                icon: 'edit',
                type: 'link'
            })

            expect(component.tabledata.needHash).toBe(false)
            expect(component.tabledata.needCheckBox).toBe(false)
            expect(component.tabledata.sortState).toBe('asc')
            expect(component.tabledata.sortColumn).toBe('name')
            expect(component.tabledata.needUserMenus).toBe(false)
            expect(component.tabledata.actionColumnName).toBe('Edit')
        })
    })

    describe('ngOnInit', () => {
        it('should process data from route snapshot when positions data exists', () => {
            // Arrange
            const mockRouteData = {
                positions: {
                    data: [
                        {
                            wfInfo: [
                                {
                                    updateFieldValues: JSON.stringify([{
                                        toValue: { position: 'Developer' },
                                        description: 'Test Description',
                                        firstName: 'John',
                                        email: 'john@test.com',
                                        mobile: '1234567890'
                                    }]),
                                    createdOn: '2024-01-15T10:30:00Z'
                                }
                            ]
                        }
                    ]
                }
            }

            mockActivatedRoute.snapshot.data = mockRouteData

            // Act
            component.ngOnInit()

            // Assert
            expect(component.data).toHaveLength(1)
            expect(component.data[0].position).toBe('Developer')
            expect(component.data[0].firstName).toBe('John')
            expect(component.data[0].email).toBe('john@test.com')
            expect(component.data[0].mobile).toBe('1234567890')
            expect(component.data[0].description).toBe('Test Description')
            expect(component.data[0].createdDate).toMatch(/\d+-\d+-\d+/)
        })

        it('should call getPositionsList when no route data exists', () => {
            // Arrange
            mockActivatedRoute.snapshot.data = {}
            const getPositionsListSpy = jest.spyOn(component, 'getPositionsList').mockImplementation(() => { })

            // Act
            component.ngOnInit()

            // Assert
            expect(getPositionsListSpy).toHaveBeenCalled()

            // Cleanup
            getPositionsListSpy.mockRestore()
        })

        it('should call getPositionsList when route data exists but no positions data', () => {
            // Arrange
            mockActivatedRoute.snapshot.data = { someOtherData: 'value' }
            const getPositionsListSpy = jest.spyOn(component, 'getPositionsList').mockImplementation(() => { })

            // Act
            component.ngOnInit()

            // Assert
            expect(getPositionsListSpy).toHaveBeenCalled()

            // Cleanup
            getPositionsListSpy.mockRestore()
        })

        it('should skip items without toValue.position', () => {
            // Arrange
            const mockRouteData = {
                positions: {
                    data: [
                        {
                            wfInfo: [
                                {
                                    updateFieldValues: JSON.stringify([{
                                        // Missing toValue.position
                                        description: 'Test Description',
                                        firstName: 'John',
                                        email: 'john@test.com'
                                    }]),
                                    createdOn: '2024-01-15T10:30:00Z'
                                }
                            ]
                        }
                    ]
                }
            }

            mockActivatedRoute.snapshot.data = mockRouteData

            // Act
            component.ngOnInit()

            // Assert
            expect(component.data).toHaveLength(0)
        })

        it('should format date correctly', () => {
            // Arrange
            const mockRouteData = {
                positions: {
                    data: [
                        {
                            wfInfo: [
                                {
                                    updateFieldValues: JSON.stringify([{
                                        toValue: { position: 'Developer' },
                                        firstName: 'John',
                                        email: 'john@test.com'
                                    }]),
                                    createdOn: '2024-01-15T10:30:00Z' // January 15, 2024
                                }
                            ]
                        }
                    ]
                }
            }

            mockActivatedRoute.snapshot.data = mockRouteData

            // Act
            component.ngOnInit()

            // Assert
            expect(component.data[0].createdDate).toBe('15-0-2024') // Note: getMonth() returns 0-based index
        })

        it('should handle multiple wfInfo items and filter correctly', () => {
            // Arrange
            const mockRouteData = {
                positions: {
                    data: [
                        {
                            wfInfo: [
                                {
                                    updateFieldValues: JSON.stringify([{
                                        toValue: { position: 'Developer' },
                                        firstName: 'John',
                                        email: 'john@test.com'
                                    }]),
                                    createdOn: '2024-01-15T10:30:00Z'
                                },
                                {
                                    updateFieldValues: JSON.stringify([{
                                        // Missing toValue.position - should be skipped
                                        firstName: 'Jane',
                                        email: 'jane@test.com'
                                    }]),
                                    createdOn: '2024-01-16T10:30:00Z'
                                },
                                {
                                    updateFieldValues: JSON.stringify([{
                                        toValue: { position: 'Designer' },
                                        firstName: 'Bob',
                                        email: 'bob@test.com'
                                    }]),
                                    createdOn: '2024-01-17T10:30:00Z'
                                }
                            ]
                        }
                    ]
                }
            }

            mockActivatedRoute.snapshot.data = mockRouteData

            // Act
            component.ngOnInit()

            // Assert
            expect(component.data).toHaveLength(2) // Only items with toValue.position
            expect(component.data[0].position).toBe('Developer')
            expect(component.data[1].position).toBe('Designer')
        })
    })

    describe('getPositionsList', () => {
        it('should call positionsService with correct parameters', () => {
            // Arrange
            const mockResponse = {
                result: {
                    data: [
                        {
                            wfInfo: [
                                { id: 1, name: 'Test Position 1' },
                                { id: 2, name: 'Test Position 2' }
                            ]
                        }
                    ]
                }
            }

            mockPositionsService.getPositionsList.mockReturnValue(of(mockResponse))

            // Act
            component.getPositionsList()

            // Assert
            const expectedReqBody = {
                serviceName: 'position',
                applicationStatus: 'IN_PROGRESS',
                limit: 1000,
                offset: 0,
                deptName: 'iGOT'
            }

            expect(mockPositionsService.getPositionsList).toHaveBeenCalledWith(expectedReqBody)
            expect(mockPositionsService.getPositionsList).toHaveBeenCalledTimes(1)
        })

        it('should populate data array with wfInfo items', () => {
            // Arrange
            const mockResponse = {
                result: {
                    data: [
                        {
                            wfInfo: [
                                { id: 1, name: 'Test Position 1' },
                                { id: 2, name: 'Test Position 2' }
                            ]
                        },
                        {
                            wfInfo: [
                                { id: 3, name: 'Test Position 3' }
                            ]
                        }
                    ]
                }
            }

            mockPositionsService.getPositionsList.mockReturnValue(of(mockResponse))

            // Act
            component.getPositionsList()

            // Assert
            expect(component.data).toHaveLength(3)
            expect(component.data[0]).toEqual({ id: 1, name: 'Test Position 1' })
            expect(component.data[1]).toEqual({ id: 2, name: 'Test Position 2' })
            expect(component.data[2]).toEqual({ id: 3, name: 'Test Position 3' })
        })

        it('should handle empty response data', () => {
            // Arrange
            const mockResponse = {
                result: {
                    data: []
                }
            }

            mockPositionsService.getPositionsList.mockReturnValue(of(mockResponse))

            // Act
            component.getPositionsList()

            // Assert
            expect(component.data).toHaveLength(0)
        })

        it('should handle response with empty wfInfo arrays', () => {
            // Arrange
            const mockResponse = {
                result: {
                    data: [
                        { wfInfo: [] },
                        { wfInfo: [] }
                    ]
                }
            }

            mockPositionsService.getPositionsList.mockReturnValue(of(mockResponse))

            // Act
            component.getPositionsList()

            // Assert
            expect(component.data).toHaveLength(0)
        })
    })

    describe('actionsClick', () => {
        it('should navigate to new-position with correct parameters', () => {
            // Arrange
            const mockEvent = {
                action: 'edit',
                row: { id: 1, name: 'Test Position' }
            }

            // Act
            component.actionsClick(mockEvent)

            // Assert
            expect(mockRouter.navigate).toHaveBeenCalledWith(
                ['new-position'],
                {
                    relativeTo: mockActivatedRoute.parent,
                    state: mockEvent
                }
            )
            expect(mockRouter.navigate).toHaveBeenCalledTimes(1)
        })

        it('should handle different action types', () => {
            // Arrange
            const mockEvent = {
                action: 'delete',
                row: { id: 2, name: 'Another Position' }
            }

            // Act
            component.actionsClick(mockEvent)

            // Assert
            expect(mockRouter.navigate).toHaveBeenCalledWith(
                ['new-position'],
                {
                    relativeTo: mockActivatedRoute.parent,
                    state: mockEvent
                }
            )
        })

        it('should handle events with additional properties', () => {
            // Arrange
            const mockEvent = {
                action: 'edit',
                row: {
                    id: 3,
                    name: 'Complex Position',
                    additionalData: 'test',
                    nestedObject: { prop: 'value' }
                }
            }

            // Act
            component.actionsClick(mockEvent)

            // Assert
            expect(mockRouter.navigate).toHaveBeenCalledWith(
                ['new-position'],
                {
                    relativeTo: mockActivatedRoute.parent,
                    state: mockEvent
                }
            )
        })
    })

    describe('Date formatting in ngOnInit', () => {
        it('should handle different date formats correctly', () => {
            // Test with different dates to ensure proper formatting
            const testCases = [
                {
                    input: '2024-12-25T10:30:00Z',
                    expectedDay: '25',
                    expectedMonth: '11', // December is month 11 (0-based)
                    expectedYear: '2024'
                },
                {
                    input: '2023-01-01T00:00:00Z',
                    expectedDay: '1',
                    expectedMonth: '0', // January is month 0 (0-based)
                    expectedYear: '2023'
                },
                {
                    input: '2022-06-15T15:45:30Z',
                    expectedDay: '15',
                    expectedMonth: '5', // June is month 5 (0-based)
                    expectedYear: '2022'
                }
            ]

            testCases.forEach((testCase) => {
                // Arrange
                const mockRouteData = {
                    positions: {
                        data: [
                            {
                                wfInfo: [
                                    {
                                        updateFieldValues: JSON.stringify([{
                                            toValue: { position: 'Developer' },
                                            firstName: 'John',
                                            email: 'john@test.com'
                                        }]),
                                        createdOn: testCase.input
                                    }
                                ]
                            }
                        ]
                    }
                }

                mockActivatedRoute.snapshot.data = mockRouteData
                component.data = [] // Reset data array

                // Act
                component.ngOnInit()

                // Assert
                const expectedDate = `${testCase.expectedDay}-${testCase.expectedMonth}-${testCase.expectedYear}`
                expect(component.data[0].createdDate).toBe(expectedDate)
            })
        })

        it('should handle invalid date gracefully', () => {
            // Arrange
            const mockRouteData = {
                positions: {
                    data: [
                        {
                            wfInfo: [
                                {
                                    updateFieldValues: JSON.stringify([{
                                        toValue: { position: 'Developer' },
                                        firstName: 'John',
                                        email: 'john@test.com'
                                    }]),
                                    createdOn: 'invalid-date'
                                }
                            ]
                        }
                    ]
                }
            }

            mockActivatedRoute.snapshot.data = mockRouteData

            // Act & Assert
            expect(() => component.ngOnInit()).not.toThrow()
            expect(component.data).toHaveLength(1)
            expect(component.data[0].createdDate).toMatch(/NaN-NaN-NaN/)
        })
    })

    describe('Error handling', () => {
        it('should handle JSON parse errors gracefully', () => {
            // Arrange
            const mockRouteData = {
                positions: {
                    data: [
                        {
                            wfInfo: [
                                {
                                    updateFieldValues: 'invalid-json',
                                    createdOn: '2024-01-15T10:30:00Z'
                                }
                            ]
                        }
                    ]
                }
            }

            mockActivatedRoute.snapshot.data = mockRouteData

            // Act & Assert
            expect(() => component.ngOnInit()).toThrow()
        })

        it('should handle missing updateFieldValues', () => {
            // Arrange
            const mockRouteData = {
                positions: {
                    data: [
                        {
                            wfInfo: [
                                {
                                    // Missing updateFieldValues
                                    createdOn: '2024-01-15T10:30:00Z'
                                }
                            ]
                        }
                    ]
                }
            }

            mockActivatedRoute.snapshot.data = mockRouteData

            // Act & Assert
            expect(() => component.ngOnInit()).toThrow()
        })
    })
})