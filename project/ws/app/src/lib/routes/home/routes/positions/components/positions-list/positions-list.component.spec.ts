import { of, throwError } from 'rxjs'
import { PositionsListComponent } from './positions-list.component'
import { ActivatedRoute } from '@angular/router'
import { PositionsService } from '../../services/position.service'

describe('PositionsListComponent', () => {
    let component: PositionsListComponent
    let mockActivatedRoute: jest.Mocked<ActivatedRoute>
    let mockPositionsService: jest.Mocked<PositionsService>

    beforeEach(() => {
        // Mock ActivatedRoute
        mockActivatedRoute = {
            snapshot: {
                data: {}
            }
        } as any

        // Mock PositionsService
        mockPositionsService = {
            getPositionsList: jest.fn()
        } as any

        // Create component instance
        component = new PositionsListComponent(mockActivatedRoute, mockPositionsService)
    })

    describe('Constructor', () => {
        it('should create component with correct dependencies', () => {
            expect(component).toBeDefined()
            expect(component['aRoute']).toBe(mockActivatedRoute)
            expect(component['positionsSvc']).toBe(mockPositionsService)
        })

        it('should initialize tableData with correct configuration', () => {
            expect(component.tableData).toBeDefined()
            expect(component.tableData!.columns).toEqual([
                { key: 'createdOn', displayName: 'Created On' },
                { key: 'name', displayName: 'Position' },
                { key: 'description', displayName: 'Position Description' }
            ])
            expect(component.tableData!.actions).toEqual([])
            expect(component.tableData!.needHash).toBe(false)
            expect(component.tableData!.needCheckBox).toBe(false)
            expect(component.tableData!.sortState).toBe('asc')
            expect(component.tableData!.sortColumn).toBe('name')
            expect(component.tableData!.needUserMenus).toBe(false)
        })

        it('should initialize data as undefined', () => {
            expect(component.data).toBeUndefined()
        })
    })

    describe('ngOnInit', () => {
        it('should set data from route snapshot when positions data exists', () => {
            const mockPositionsData = [
                { id: 1, name: 'Developer', description: 'Software Developer' },
                { id: 2, name: 'Manager', description: 'Project Manager' }
            ]

            mockActivatedRoute.snapshot.data = {
                positions: {
                    data: mockPositionsData
                }
            }

            component.ngOnInit()

            expect(component.data).toEqual(mockPositionsData)
            expect(mockPositionsService.getPositionsList).not.toHaveBeenCalled()
        })

        it('should call getPositionsList when route snapshot has no positions data', () => {
            mockActivatedRoute.snapshot.data = {}
            jest.spyOn(component, 'getPositionsList').mockImplementation(() => { })

            component.ngOnInit()

            expect(component.getPositionsList).toHaveBeenCalled()
        })

        it('should call getPositionsList when route snapshot data is null', () => {
            mockActivatedRoute.snapshot.data = null as any
            jest.spyOn(component, 'getPositionsList').mockImplementation(() => { })

            component.ngOnInit()

            expect(component.getPositionsList).toHaveBeenCalled()
        })

        it('should call getPositionsList when positions data is null', () => {
            mockActivatedRoute.snapshot.data = {
                positions: {
                    data: null
                }
            }
            jest.spyOn(component, 'getPositionsList').mockImplementation(() => { })

            component.ngOnInit()

            expect(component.getPositionsList).toHaveBeenCalled()
        })

        it('should call getPositionsList when positions is null', () => {
            mockActivatedRoute.snapshot.data = {
                positions: null
            }
            jest.spyOn(component, 'getPositionsList').mockImplementation(() => { })

            component.ngOnInit()

            expect(component.getPositionsList).toHaveBeenCalled()
        })
    })

    describe('getPositionsList', () => {
        it('should call positionsService.getPositionsList with correct parameters', () => {
            const mockResponse = {
                result: {
                    data: [
                        { id: 1, name: 'Developer', description: 'Software Developer' },
                        { id: 2, name: 'Manager', description: 'Project Manager' }
                    ]
                }
            }

            mockPositionsService.getPositionsList.mockReturnValue(of(mockResponse))

            component.getPositionsList()

            expect(mockPositionsService.getPositionsList).toHaveBeenCalledWith({
                serviceName: 'position',
                applicationStatus: 'APPROVED',
                limit: 1000,
                offset: 0,
                deptName: 'iGOT'
            })
        })

        it('should set data from service response', () => {
            const mockData = [
                { id: 1, name: 'Developer', description: 'Software Developer' },
                { id: 2, name: 'Manager', description: 'Project Manager' }
            ]
            const mockResponse = {
                result: {
                    data: mockData
                }
            }

            mockPositionsService.getPositionsList.mockReturnValue(of(mockResponse))

            component.getPositionsList()

            expect(component.data).toEqual(mockData)
        })

        it('should handle empty data response', () => {
            const mockResponse = {
                result: {
                    data: []
                }
            }

            mockPositionsService.getPositionsList.mockReturnValue(of(mockResponse))

            component.getPositionsList()

            expect(component.data).toEqual([])
        })

        it('should handle service error gracefully', () => {
            const mockError = new Error('Service error')
            mockPositionsService.getPositionsList.mockReturnValue(throwError(mockError))

            // Should not throw error when service fails
            expect(() => {
                component.getPositionsList()
            }).not.toThrow()

            expect(mockPositionsService.getPositionsList).toHaveBeenCalled()
        })

        it('should handle malformed response structure', () => {
            const mockResponse = {
                result: null
            }

            mockPositionsService.getPositionsList.mockReturnValue(of(mockResponse))

            expect(() => {
                component.getPositionsList()
            }).toThrow()
        })
    })

    describe('Integration Tests', () => {
        it('should properly initialize and load data from route', () => {
            const mockPositionsData = [
                { id: 1, name: 'Developer', description: 'Software Developer', createdOn: '2024-01-01' }
            ]

            mockActivatedRoute.snapshot.data = {
                positions: {
                    data: mockPositionsData
                }
            }

            // Create new component instance to test full initialization
            const newComponent = new PositionsListComponent(mockActivatedRoute, mockPositionsService)
            newComponent.ngOnInit()

            expect(newComponent.data).toEqual(mockPositionsData)
            expect(newComponent.tableData).toBeDefined()
            expect(newComponent.tableData!.columns.length).toBe(3)
        })

        it('should properly initialize and load data from service', () => {
            const mockServiceData = [
                { id: 2, name: 'Tester', description: 'QA Tester', createdOn: '2024-01-02' }
            ]
            const mockResponse = {
                result: {
                    data: mockServiceData
                }
            }

            mockActivatedRoute.snapshot.data = {}
            mockPositionsService.getPositionsList.mockReturnValue(of(mockResponse))

            // Create new component instance to test full initialization
            const newComponent = new PositionsListComponent(mockActivatedRoute, mockPositionsService)
            newComponent.ngOnInit()

            expect(mockPositionsService.getPositionsList).toHaveBeenCalledWith({
                serviceName: 'position',
                applicationStatus: 'APPROVED',
                limit: 1000,
                offset: 0,
                deptName: 'iGOT'
            })
            expect(newComponent.data).toEqual(mockServiceData)
        })
    })

    describe('Property Access Tests', () => {
        it('should have tableData with correct structure', () => {
            expect(component.tableData).toHaveProperty('columns')
            expect(component.tableData).toHaveProperty('actions')
            expect(component.tableData).toHaveProperty('needHash')
            expect(component.tableData).toHaveProperty('needCheckBox')
            expect(component.tableData).toHaveProperty('sortState')
            expect(component.tableData).toHaveProperty('sortColumn')
            expect(component.tableData).toHaveProperty('needUserMenus')
        })

        it('should have correct column configuration', () => {
            const columns = component.tableData!.columns
            expect(columns[0]).toEqual({ key: 'createdOn', displayName: 'Created On' })
            expect(columns[1]).toEqual({ key: 'name', displayName: 'Position' })
            expect(columns[2]).toEqual({ key: 'description', displayName: 'Position Description' })
        })

        it('should have empty actions array', () => {
            expect(component.tableData!.actions).toEqual([])
            expect(Array.isArray(component.tableData!.actions)).toBe(true)
        })
    })
})