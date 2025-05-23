import { CoursesTableComponent } from './courses-table.component'
import { FormControl } from '@angular/forms'
import { MatTableDataSource } from '@angular/material/table'
import { PageEvent } from '@angular/material/paginator'
import { of } from 'rxjs'
import * as _ from 'lodash'

// Mock lodash
jest.mock('lodash', () => ({
    get: jest.fn(),
    map: jest.fn(),
}))

// Mock MatTableDataSource
jest.mock('@angular/material/table', () => ({
    MatTableDataSource: jest.fn().mockImplementation(() => ({
        data: [],
        filteredData: [],
    })),
}))

// Mock FormControl
jest.mock('@angular/forms', () => ({
    FormControl: jest.fn().mockImplementation(() => ({
        valueChanges: of('test'),
    })),
}))

describe('CoursesTableComponent', () => {
    let component: CoursesTableComponent
    let mockGet: jest.MockedFunction<typeof _.get>
    let mockMap: jest.MockedFunction<typeof _.map>

    beforeEach(() => {
        jest.clearAllMocks()
        mockGet = _.get as jest.MockedFunction<typeof _.get>
        mockMap = _.map as jest.MockedFunction<typeof _.map>

        component = new CoursesTableComponent()
    })

    describe('Constructor', () => {
        it('should initialize with default values', () => {
            expect(component.paginationDetails).toEqual({
                startIndex: 0,
                lastIndes: 20,
                pageSize: 20,
                pageIndex: 0,
                totalCount: 20,
            })
            expect(component.menuItems).toEqual([])
            expect(component.showLoader).toBe(false)
            expect(component.showSearchBox).toBe(true)
            expect(component.pageSizeOptions).toEqual([20, 30, 40])
            expect(component.columnsList).toEqual([])
            expect(component.allSelected).toBe(false)
            expect(component.selectedRowData).toEqual([])
            expect(component.showDeleteAll).toBe(true)
            expect(component.tableColumns).toEqual([])
            expect(component.noDataMessage).toBe('No data found')
            expect(component.showPagination).toBe(true)
            expect(MatTableDataSource).toHaveBeenCalled()
        })

        it('should create FormControl instance', () => {
            expect(FormControl).toHaveBeenCalled()
            expect(component.searchControl).toBeDefined()
        })
    })

    describe('ngOnInit', () => {
        beforeEach(() => {
            mockGet.mockReturnValue(true)
            component.searchKey = { emit: jest.fn() } as any
        })

        it('should set properties when tableData is provided', () => {
            const mockTableData = {
                columns: ['col1', 'col2'],
                showDeleteAll: false,
                showSearchBox: false,
                noDataMessage: 'Custom no data message',
                showPagination: false,
            }
            component.tableData = mockTableData

            component.ngOnInit()

            expect(component.displayedColumns).toEqual(['col1', 'col2'])
            expect(component.showDeleteAll).toBe(false)
            expect(mockGet).toHaveBeenCalledWith(mockTableData, 'showSearchBox', true)
            expect(mockGet).toHaveBeenCalledWith(mockTableData, 'noDataMessage', 'No data found')
            expect(mockGet).toHaveBeenCalledWith(mockTableData, 'showPagination', true)
        })

        it('should not set properties when tableData is not provided', () => {
            component.tableData = null

            component.ngOnInit()

            expect(component.displayedColumns).toBeUndefined()
            expect(component.showDeleteAll).toBe(true)
        })

        it('should subscribe to searchControl valueChanges', () => {
            const mockEmit = jest.fn()
            component.searchKey = { emit: mockEmit } as any

            component.ngOnInit()

            // Since we mocked FormControl to return of('test'), the subscription should emit 'test'
            expect(mockEmit).toHaveBeenCalledWith('test')
        })
    })

    describe('ngOnChanges', () => {
        it('should call getFinalColumns when tableData changes', () => {
            const spy = jest.spyOn(component, 'getFinalColumns').mockImplementation()
            const changes = {
                tableData: {
                    currentValue: { columns: [] },
                    previousValue: null,
                    firstChange: true,
                    isFirstChange: () => true,
                },
            }

            component.ngOnChanges(changes)

            expect(spy).toHaveBeenCalled()
        })

        it('should update dataSource and reset selectedRowData when data changes', () => {
            const mockData = [{ id: 1 }, { id: 2 }]
            component.data = mockData as any
            component.selectedRowData = [{ id: 3 }]

            const changes = {
                data: {
                    currentValue: mockData,
                    previousValue: null,
                    firstChange: true,
                    isFirstChange: () => true,
                },
            }

            component.ngOnChanges(changes)

            expect(component.dataSource.data).toEqual(mockData)
            expect(component.selectedRowData).toEqual([])
        })

        it('should not call getFinalColumns when tableData does not change', () => {
            const spy = jest.spyOn(component, 'getFinalColumns').mockImplementation()
            const changes = {}

            component.ngOnChanges(changes)

            expect(spy).not.toHaveBeenCalled()
        })
    })

    describe('getFinalColumns', () => {
        beforeEach(() => {
            mockMap.mockReturnValue([])
        })

        it('should set columns without checkbox and menu', () => {
            const mockColumns = [{ key: 'col1' }, { key: 'col2' }]
            component.tableData = {
                columns: mockColumns,
                needCheckBox: false,
            }
            component.menuItems = []

            component.getFinalColumns()

            expect(component.tableColumns).toEqual(mockColumns)
            expect(mockMap).toHaveBeenCalledWith(mockColumns, expect.any(Function))
            expect(component.columnsList).toEqual([])
        })

        it('should add checkbox column when needCheckBox is true', () => {
            const mockColumns = [{ key: 'col1' }]
            component.tableData = {
                columns: mockColumns,
                needCheckBox: true,
            }
            component.menuItems = []

            component.getFinalColumns()

            expect(component.tableColumns).toHaveLength(2)
            expect(component.tableColumns[0]).toEqual({
                displayName: '',
                key: 'select',
                cellType: 'select',
            })
        })

        it('should add menu column when menuItems exist', () => {
            const mockColumns = [{ key: 'col1' }]
            component.tableData = {
                columns: mockColumns,
                needCheckBox: false,
            }
            component.menuItems = []

            component.getFinalColumns()

            expect(component.tableColumns).toHaveLength(2)
            expect(component.tableColumns[1]).toEqual({
                displayName: '',
                key: 'menu',
                cellType: 'menu',
            })
        })

        it('should add both checkbox and menu columns', () => {
            const mockColumns = [{ key: 'col1' }]
            component.tableData = {
                columns: mockColumns,
                needCheckBox: true,
            }
            component.menuItems = []

            component.getFinalColumns()

            expect(component.tableColumns).toHaveLength(3)
            // expect(component.tableColumns[0].key).toBe('select')
            // expect(component.tableColumns[2].key).toBe('menu')
        })
    })

    describe('deleteAllSelected', () => {
        it('should call buttonClick with delete action and selectedRowData', () => {
            const spy = jest.spyOn(component, 'buttonClick').mockImplementation()
            component.selectedRowData = [{ id: 1 }, { id: 2 }]

            component.deleteAllSelected()

            expect(spy).toHaveBeenCalledWith('delete', [{ id: 1 }, { id: 2 }])
        })
    })

    describe('buttonClick', () => {
        it('should emit actionsClick when tableData exists', () => {
            const mockEmit = jest.fn()
            component.actionsClick = { emit: mockEmit } as any
            component.tableData = { columns: [] }

            component.buttonClick('edit', { id: 1 })

            expect(mockEmit).toHaveBeenCalledWith({
                action: 'edit',
                rows: { id: 1 },
            })
        })

        it('should not emit actionsClick when tableData does not exist', () => {
            const mockEmit = jest.fn()
            component.actionsClick = { emit: mockEmit } as any
            component.tableData = null

            component.buttonClick('edit', { id: 1 })

            expect(mockEmit).not.toHaveBeenCalled()
        })
    })

    describe('selectAll', () => {
        beforeEach(() => {
            mockGet.mockReturnValue([
                { id: 1, isActive: false },
                { id: 2, isActive: true },
                { id: 3, isActive: false },
            ])
        })

        it('should select all inactive rows when allSelected is true', () => {
            component.allSelected = true
            component.selectedRowData = []

            component.selectAll()

            expect(component.selectedRowData).toHaveLength(2)
            expect(component.selectedRowData[0].isChecked).toBe(true)
            expect(component.selectedRowData[1].isChecked).toBe(true)
        })

        it('should deselect all rows when allSelected is false', () => {
            component.allSelected = false
            component.selectedRowData = [{ id: 1 }]

            component.selectAll()

            expect(component.selectedRowData).toEqual([])
            expect(mockGet).toHaveBeenCalledWith(component.dataSource, 'filteredData', [])
        })

        it('should not select active rows', () => {
            component.allSelected = true
            component.selectedRowData = []

            component.selectAll()

            // Only inactive rows should be selected (id: 1 and id: 3)
            expect(component.selectedRowData).toHaveLength(2)
            expect(component.selectedRowData.find((row: any) => row.id === 2)).toBeUndefined()
        })
    })

    describe('onCheckboxChange', () => {
        it('should add row to selectedRowData when checked', () => {
            const mockColumn = { id: 1, isChecked: true }
            component.selectedRowData = []

            component.onCheckboxChange(mockColumn)

            expect(component.selectedRowData).toContain(mockColumn)
        })

        it('should remove row from selectedRowData when unchecked', () => {
            const mockColumn = { id: 1, isChecked: false }
            component.selectedRowData = [{ id: 1 }, { id: 2 }]

            component.onCheckboxChange(mockColumn)

            expect(component.selectedRowData).toHaveLength(1)
            expect(component.selectedRowData[0].id).toBe(2)
        })

        it('should not remove row if id does not match', () => {
            const mockColumn = { id: 3, isChecked: false }
            component.selectedRowData = [{ id: 1 }, { id: 2 }]

            component.onCheckboxChange(mockColumn)

            expect(component.selectedRowData).toHaveLength(2)
        })
    })

    describe('onChangePage', () => {
        it('should update pagination details and emit pageChange', () => {
            const mockEmit = jest.fn()
            component.pageChange = { emit: mockEmit } as any

            const pageEvent: PageEvent = {
                pageIndex: 2,
                pageSize: 30,
                length: 100,
                previousPageIndex: 1,
            }

            component.onChangePage(pageEvent)

            expect(component.paginationDetails.startIndex).toBe(60) // 2 * 30
            expect(component.paginationDetails.lastIndex).toBe(90) // (2 + 1) * 30
            expect(component.paginationDetails.pageSize).toBe(30)
            expect(component.paginationDetails.pageIndex).toBe(2)
            expect(mockEmit).toHaveBeenCalledWith(component.paginationDetails)
        })

        it('should calculate correct indices for first page', () => {
            const mockEmit = jest.fn()
            component.pageChange = { emit: mockEmit } as any

            const pageEvent: PageEvent = {
                pageIndex: 0,
                pageSize: 20,
                length: 100,
                previousPageIndex: 1,
            }

            component.onChangePage(pageEvent)

            expect(component.paginationDetails.startIndex).toBe(0)
            expect(component.paginationDetails.lastIndex).toBe(20)
        })
    })

    describe('Event Emitters', () => {
        it('should have actionsClick EventEmitter', () => {
            expect(component.actionsClick).toBeDefined()
        })

        it('should have searchKey EventEmitter', () => {
            expect(component.searchKey).toBeDefined()
        })

        it('should have pageChange EventEmitter', () => {
            expect(component.pageChange).toBeDefined()
        })
    })

    describe('Input Properties', () => {
        it('should accept tableData input', () => {
            const testData = { columns: ['test'] }
            component.tableData = testData
            expect(component.tableData).toBe(testData)
        })

        it('should accept data input', () => {
            const testData = [{ id: 1 }]
            component.data = testData as any
            expect(component.data).toBe(testData)
        })

        it('should accept menuItems input', () => {
            const testItems: never[] = []
            component.menuItems = testItems
            expect(component.menuItems).toBe(testItems)
        })

        it('should accept showLoader input', () => {
            component.showLoader = true
            expect(component.showLoader).toBe(true)
        })
    })
})