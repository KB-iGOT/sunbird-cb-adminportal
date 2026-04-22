import { SectorListViewComponent } from './sector-list-view.component'
import { Router } from '@angular/router'
import { MatTableDataSource } from '@angular/material/table'
import { EventEmitter } from '@angular/core'
import { ITableData, IAction } from '../../events/interfaces/interfaces'
import { sectorConstants } from '../sectors-constats.model'

// Mock dependencies
jest.mock('@angular/router')
jest.mock('@angular/material/table')
jest.mock('lodash', () => ({
    map: jest.fn()
}))

// Mock sectorConstants
jest.mock('../sectors-constats.model', () => ({
    sectorConstants: {
        pageSize: 10,
        pageOptions: [5, 10, 25, 100]
    }
}))

describe('SectorListViewComponent', () => {
    let component: SectorListViewComponent
    let mockRouter: jest.Mocked<Router>
    let mockDataSource: jest.Mocked<MatTableDataSource<any>>

    beforeEach(() => {
        // Create mocks
        mockRouter = {
            navigateByUrl: jest.fn()
        } as any

        mockDataSource = {
            data: [],
            sort: null,
            paginator: null
        } as any;

        // Mock MatTableDataSource constructor
        (MatTableDataSource as jest.Mock).mockImplementation(() => mockDataSource)

        // Create component instance
        component = new SectorListViewComponent(mockRouter)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('Constructor', () => {
        it('should initialize component with default values', () => {
            expect(component.dataSource).toBe(mockDataSource)
            expect(component.filterData).toBeInstanceOf(EventEmitter)
            expect(component.data).toEqual([])
            expect(component.searchValue).toBe('')
            expect(component.moreThanTwoChar).toBe(false)
            expect(component.pageSize).toBe(sectorConstants.pageSize)
            expect(component.pageSizeOptions).toBe(sectorConstants.pageOptions)
            expect(component.paginator).toBeNull()
        })

        it('should set dataSource paginator to paginator', () => {
            expect(mockDataSource.paginator).toBe(component.paginator)
        })
    })

    describe('getFinalColumns', () => {
        it('should return empty string when tableData is undefined', () => {
            component.tableData = undefined

            const result = component.getFinalColumns()

            expect(result).toBe('')
        })

        it('should return columns with basic setup', () => {
            const mockTableData: ITableData = {
                columns: [
                    {
                        key: 'name',
                        displayName: ''
                    },
                    {
                        key: 'code',
                        displayName: ''
                    },
                    {
                        key: 'description',
                        displayName: ''
                    }
                ],
                needCheckBox: false,
                needHash: false,
                actions: [],
                needUserMenus: false
            }

            component.tableData = mockTableData

            // Mock lodash map
            const lodash = require('lodash')
            lodash.map.mockReturnValue(['name', 'code', 'description'])

            const result = component.getFinalColumns()

            expect(result).toEqual(['name', 'code', 'description'])
            expect(lodash.map).toHaveBeenCalledWith(mockTableData.columns, expect.any(Function))
        })

        it('should add select column when needCheckBox is true', () => {
            const mockTableData: ITableData = {
                columns: [{
                    key: 'name',
                    displayName: ''
                }, {
                    key: 'code',
                    displayName: ''
                }],
                needCheckBox: true,
                needHash: false,
                actions: [],
                needUserMenus: false
            }

            component.tableData = mockTableData

            const lodash = require('lodash')
            lodash.map.mockReturnValue(['name', 'code'])

            const result = component.getFinalColumns()

            expect(result).toEqual(['select', 'name', 'code'])
        })

        it('should add SR column when needHash is true', () => {
            const mockTableData: ITableData = {
                columns: [{
                    key: 'name',
                    displayName: ''
                }, {
                    key: 'code',
                    displayName: ''
                }],
                needCheckBox: false,
                needHash: true,
                actions: [],
                needUserMenus: false
            }

            component.tableData = mockTableData

            const lodash = require('lodash')
            lodash.map.mockReturnValue(['name', 'code'])

            const result = component.getFinalColumns()

            expect(result).toEqual(['SR', 'name', 'code'])
        })

        it('should add Actions column when actions exist', () => {
            const mockActions: IAction[] = [{
                name: 'edit',
                icon: '',
                type: '',
                label: ''
            }, {
                name: 'delete',
                icon: '',
                type: '',
                label: ''
            }]
            const mockTableData: ITableData = {
                columns: [{
                    key: 'name',
                    displayName: ''
                }],
                needCheckBox: false,
                needHash: false,
                actions: mockActions,
                needUserMenus: false
            }

            component.tableData = mockTableData

            const lodash = require('lodash')
            lodash.map.mockReturnValue(['name'])

            const result = component.getFinalColumns()

            expect(result).toEqual(['name', 'Actions'])
        })

        it('should add all columns when all options are enabled', () => {
            const mockActions: IAction[] = [{
                name: 'edit',
                icon: '',
                type: '',
                label: ''
            }]
            const mockTableData: ITableData = {
                columns: [{
                    key: 'name',
                    displayName: ''
                }, {
                    key: 'code',
                    displayName: ''
                }],
                needCheckBox: true,
                needHash: true,
                actions: mockActions,
                needUserMenus: false
            }

            component.tableData = mockTableData

            const lodash = require('lodash')
            lodash.map.mockReturnValue(['name', 'code'])

            const result = component.getFinalColumns()

            expect(result).toEqual(['SR', 'select', 'name', 'code', 'Actions'])
        })
    })

    describe('ngOnInit', () => {
        it('should initialize component when tableData exists', () => {
            const mockTableData: ITableData = {
                columns: [{
                    key: 'name',
                    displayName: ''
                }, {
                    key: 'code',
                    displayName: ''
                }],
                actions: [],
                needHash: false,
                needCheckBox: false,
                needUserMenus: false
            }
            const mockData = [{ name: 'Sector 1', code: 'S1' }]

            component.tableData = mockTableData
            component.data = mockData

            jest.useFakeTimers()
            component.ngOnInit()

            expect(component.displayedColumns).toBe(mockTableData.columns)
            expect(mockDataSource.data).toBe(mockData)
            expect(component.length).toBe(1)

            // Fast-forward setTimeout
            jest.advanceTimersByTime(0)
            expect(mockDataSource.paginator).toBe(component.paginator)

            jest.useRealTimers()
        })

        it('should handle initialization when tableData is undefined', () => {
            const mockData = [{ name: 'Sector 1' }]

            component.tableData = undefined
            component.data = mockData

            component.ngOnInit()

            expect(component.displayedColumns).toEqual([])
            expect(mockDataSource.data).toBe(mockData)
            expect(component.length).toBe(1)
        })

        it('should handle empty data array', () => {
            const mockTableData: ITableData = {
                columns: [{
                    key: 'name',
                    displayName: ''
                }],
                actions: [],
                needHash: false,
                needCheckBox: false,
                needUserMenus: false
            }

            component.tableData = mockTableData
            component.data = []

            component.ngOnInit()

            expect(mockDataSource.data).toEqual([])
            expect(component.length).toBe(0)
        })
    })

    describe('applyFilter', () => {
        beforeEach(() => {
            component.data = [
                { name: 'Technology Sector', code: 'TECH' },
                { name: 'Healthcare Sector', code: 'HEALTH' },
                { name: 'Financial Services', code: 'FIN' }
            ]
            mockDataSource.data = component.data
        })

        it('should filter data based on search term', () => {
            component.applyFilter('tech')

            expect(mockDataSource.data).toEqual([
                { name: 'Technology Sector', code: 'TECH' }
            ])
        })

        it('should be case insensitive', () => {
            component.applyFilter('HEALTH')

            expect(mockDataSource.data).toEqual([
                { name: 'Healthcare Sector', code: 'HEALTH' }
            ])
        })

        it('should return multiple matches', () => {
            component.applyFilter('sector')

            expect(mockDataSource.data).toEqual([
                { name: 'Technology Sector', code: 'TECH' },
                { name: 'Healthcare Sector', code: 'HEALTH' }
            ])
        })

        it('should reset data when search term is empty', () => {
            // First filter
            component.applyFilter('tech')
            expect(mockDataSource.data).toHaveLength(1)

            // Reset filter
            component.applyFilter('')
            expect(mockDataSource.data).toBe(component.data)
            expect(mockDataSource.data).toHaveLength(3)
        })

        it('should handle null/undefined search term', () => {
            component.applyFilter(null as any)
            expect(mockDataSource.data).toBe(component.data)

            component.applyFilter(undefined as any)
            expect(mockDataSource.data).toBe(component.data)
        })

        it('should handle data without name property gracefully', () => {
            component.data = [{ code: 'TEST' }]

            expect(() => {
                component.applyFilter('test')
            }).toThrow() // This will throw because of accessing .name on undefined
        })
    })

    describe('onCreateClick', () => {
        it('should navigate to create sector route', () => {
            component.onCreateClick()

            expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app/home/sectors/new')
            expect(mockRouter.navigateByUrl).toHaveBeenCalledTimes(1)
        })
    })

    describe('onClickButton', () => {
        it('should navigate to sub-sectors route with correct code', () => {
            const mockRow = { code: 'TECH', name: 'Technology' }

            component.onClickButton(mockRow)

            expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app/home/sectors/TECH/sub-sectors')
            expect(mockRouter.navigateByUrl).toHaveBeenCalledTimes(1)
        })

        it('should handle row with different code', () => {
            const mockRow = { code: 'HEALTH', name: 'Healthcare' }

            component.onClickButton(mockRow)

            expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app/home/sectors/HEALTH/sub-sectors')
        })

        it('should handle row without code property', () => {
            const mockRow = { name: 'Test' }

            component.onClickButton(mockRow)

            expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app/home/sectors/undefined/sub-sectors')
        })
    })

    describe('matSort setter', () => {
        it('should set sort when dataSource.sort is falsy', () => {
            const mockSort = { active: 'name', direction: 'asc' } as any
            mockDataSource.sort = null

            component.matSort = mockSort

            expect(mockDataSource.sort).toBe(mockSort)
        })

        it('should not set sort when dataSource.sort already exists', () => {
            const existingSort = { active: 'code', direction: 'desc' } as any
            const newSort = { active: 'name', direction: 'asc' } as any

            mockDataSource.sort = existingSort

            component.matSort = newSort

            expect(mockDataSource.sort).toBe(existingSort)
        })
    })

    describe('Input Properties', () => {
        it('should handle tableData input', () => {
            const mockTableData: ITableData = {
                columns: [{
                    key: 'test',
                    displayName: ''
                }],
                actions: [],
                needHash: false,
                needCheckBox: false,
                needUserMenus: false
            }

            component.tableData = mockTableData

            expect(component.tableData).toBe(mockTableData)
        })

        it('should handle data input', () => {
            const mockData = [{ name: 'Test', code: 'T1' }]

            component.data = mockData

            expect(component.data).toBe(mockData)
        })

        it('should handle isCreate input', () => {
            component.isCreate = true
            expect(component.isCreate).toBe(true)

            component.isCreate = false
            expect(component.isCreate).toBe(false)
        })

        it('should handle actions input', () => {
            const mockActions: IAction[] = [{
                name: 'edit',
                icon: '',
                type: '',
                label: ''
            }]

            component.actions = mockActions

            expect(component.actions).toBe(mockActions)
        })
    })

    describe('Component Properties', () => {
        it('should have correct default values for component properties', () => {
            expect(component.displayedColumns).toEqual([])
            expect(component.searchValue).toBe('')
            expect(component.moreThanTwoChar).toBe(false)
            expect(component.pageSize).toBe(sectorConstants.pageSize)
            expect(component.pageSizeOptions).toBe(sectorConstants.pageOptions)
        })
    })
})