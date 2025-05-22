import { UIUserTablePopUpComponent } from './ui-user-table-pop-up.component'
import { SelectionModel } from '@angular/cdk/collections'
import { EventEmitter, SimpleChanges, SimpleChange } from '@angular/core'
import { MatTableDataSource } from '@angular/material/table'
import { of } from 'rxjs'

// Mock dependencies
const mockProfileUtilSvc = {
    emailTransform: jest.fn()
}

const mockUserService = {
    searchUserByenter: jest.fn()
}

const mockActivatedRoute = {
    queryParams: of({ roleId: 'test-role-id' })
}

const mockCreateMDOService = {
    searchedUserdata: {
        subscribe: jest.fn(),
        next: jest.fn()
    },
    adminButton: {
        next: jest.fn()
    }
}

const mockPaginator = {
    // Mock paginator properties and methods as needed
}

const mockSort = {
    // Mock sort properties and methods as needed
}

describe('UIUserTablePopUpComponent', () => {
    let component: UIUserTablePopUpComponent

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks()

        // Mock document.body.clientHeight
        Object.defineProperty(document.body, 'clientHeight', {
            value: 1000,
            writable: true
        })

        // Create component instance
        component = new UIUserTablePopUpComponent(
            mockProfileUtilSvc as any,
            mockUserService as any,
            mockActivatedRoute as any,
            mockCreateMDOService as any
        )

        // Mock ViewChild properties
        component.paginator = mockPaginator as any
        component.sort = mockSort as any
    })

    describe('Constructor', () => {
        it('should initialize component with default values', () => {
            expect(component.dataSource).toBeInstanceOf(MatTableDataSource)
            expect(component.actionsClick).toBeInstanceOf(EventEmitter)
            expect(component.clicked).toBeInstanceOf(EventEmitter)
            expect(component.selection).toBeInstanceOf(SelectionModel)
            expect(component.bodyHeight).toBe(875) // 1000 - 125
            expect(component.pageSize).toBe(20)
            expect(component.pageSizeOptions).toEqual([20, 30, 40])
        })
    })

    describe('ngOnInit', () => {
        it('should initialize table configuration and subscribe to route params', () => {
            // const mockSubscribe = jest.fn((callback) => {
            //     callback({ roleId: 'test-role-id' })
            // })
            // mockActivatedRoute.queryParams.subscribe = mockSubscribe

            component.ngOnInit()

            expect(component.displayedColumns).toBeUndefined()
            expect(component.dataSource.data).toEqual([])
            expect(component.viewPaginator).toBe(true)
            expect(component.tableData).toEqual({
                columns: [
                    { displayName: 'Full name', key: 'fullname' },
                    { displayName: 'Email', key: 'email' },
                ],
                actions: [{ name: 'Details', label: 'Details', icon: 'remove_red_eye', type: 'link' }],
                needCheckBox: false,
                needHash: false,
                sortColumn: '',
                sortState: 'asc',
                needUserMenus: false,
            })
            expect(component.deparmentId).toBe('test-role-id')
        })

        it('should set displayedColumns when tableData exists', () => {
            const mockColumns = [{ displayName: 'Test', key: 'test' }]
            component.tableData = { columns: mockColumns } as any

            component.ngOnInit()

            expect(component.displayedColumns).toBe(mockColumns)
        })
    })

    describe('ngOnChanges', () => {
        it('should update dataSource data and length when data changes', () => {
            const mockData = [
                { fullname: 'John Doe', email: 'john@example.com', userId: '1' },
                { fullname: 'Jane Smith', email: 'jane@example.com', userId: '2' }
            ]

            const changes: SimpleChanges = {
                data: new SimpleChange(null, mockData, false)
            }

            component.ngOnChanges(changes)

            expect(component.dataSource.data).toBe(mockData)
            expect(component.length).toBe(2)
        })

        it('should handle undefined data gracefully', () => {
            const changes: SimpleChanges = {
                data: new SimpleChange(null, undefined, false)
            }

            component.ngOnChanges(changes)

            expect(component.dataSource.data).toBeUndefined()
            expect(component.length).toBe(0)
        })
    })

    describe('applyFilter', () => {
        beforeEach(() => {
            component.getAllActiveUsersAPI = jest.fn()
        })

        it('should apply filter and call API when filterValue is provided', () => {
            const filterValue = 'TEST VALUE'

            component.applyFilter(filterValue)

            expect(component.isSearched).toBe(true)
            expect(component.dataSource.filter).toBe('test value')
            expect(component.getAllActiveUsersAPI).toHaveBeenCalledWith('test value')
        })

        it('should clear filter and data when filterValue is empty', () => {
            component.dataSource.data = [{ test: 'data' }]

            component.applyFilter('')

            expect(component.dataSource.filter).toBe('')
            expect(component.dataSource.data).toEqual([])
            expect(component.getAllActiveUsersAPI).not.toHaveBeenCalled()
        })

        it('should clear filter and data when filterValue is null', () => {
            component.dataSource.data = [{ test: 'data' }]

            component.applyFilter(null)

            expect(component.dataSource.filter).toBe('')
            expect(component.dataSource.data).toEqual([])
            expect(component.getAllActiveUsersAPI).not.toHaveBeenCalled()
        })
    })

    describe('buttonClick', () => {
        beforeEach(() => {
            component.tableData = {
                actions: [
                    { name: 'Details', disabled: false },
                    { name: 'Delete', disabled: true }
                ]
            } as any

            mockCreateMDOService.searchedUserdata.subscribe.mockImplementation((callback) => {
                callback([{
                    organisations: [{
                        userId: 'test-user-id',
                        roles: ['MDO_ADMIN']
                    }]
                }])
            })
        })

        it('should emit action when action is not disabled', () => {
            const mockEmit = jest.fn()
            component.actionsClick = { emit: mockEmit } as any
            const row = { userId: 'test-user-id' }

            component.buttonClick('Details', row)

            expect(mockEmit).toHaveBeenCalledWith({ action: 'Details', row })
        })

        it('should not emit action when action is disabled', () => {
            const mockEmit = jest.fn()
            component.actionsClick = { emit: mockEmit } as any
            const row = { userId: 'test-user-id' }

            component.buttonClick('Delete', row)

            expect(mockEmit).not.toHaveBeenCalled()
        })

        it('should set admin button to true when user has MDO_ADMIN role', () => {
            const row = { userId: 'test-user-id' }

            component.buttonClick('Details', row)

            expect(mockCreateMDOService.adminButton.next).toHaveBeenCalledWith(true)
        })

        it('should set admin button to true when user has STATE_ADMIN role', () => {
            mockCreateMDOService.searchedUserdata.subscribe.mockImplementation((callback) => {
                callback([{
                    organisations: [{
                        userId: 'test-user-id',
                        roles: ['STATE_ADMIN']
                    }]
                }])
            })
            const row = { userId: 'test-user-id' }

            component.buttonClick('Details', row)

            expect(mockCreateMDOService.adminButton.next).toHaveBeenCalledWith(true)
        })

        it('should set admin button to false when user has neither admin role', () => {
            mockCreateMDOService.searchedUserdata.subscribe.mockImplementation((callback) => {
                callback([{
                    organisations: [{
                        userId: 'test-user-id',
                        roles: ['USER']
                    }]
                }])
            })
            const row = { userId: 'test-user-id' }

            component.buttonClick('Details', row)

            expect(mockCreateMDOService.adminButton.next).toHaveBeenCalledWith(false)
        })
    })

    describe('getAllActiveUsersAPI', () => {
        it('should call userService and process response', () => {
            const mockResponse = {
                result: {
                    response: {
                        content: [{ id: '1', firstName: 'John' }]
                    }
                }
            }

            mockUserService.searchUserByenter.mockReturnValue(of(mockResponse))
            component.getAllUserByKey = jest.fn()
            component.deparmentId = 'test-dept'

            component.getAllActiveUsersAPI('search-term')

            expect(mockUserService.searchUserByenter).toHaveBeenCalledWith('search-term', 'test-dept')
            expect(component.getAllUserByKey).toHaveBeenCalledWith(mockResponse.result.response.content)
        })
    })

    describe('getAllUserByKey', () => {
        beforeEach(() => {
            mockProfileUtilSvc.emailTransform.mockReturnValue('john@example.com')
        })

        it('should process user data and update dataSource', () => {
            const userObj = [{
                id: '1',
                firstName: 'John',
                lastName: 'Doe',
                profileDetails: {
                    personalDetails: {
                        primaryEmail: 'john@example.com'
                    }
                }
            }]

            component.getAllUserByKey(userObj)

            expect(component.dataSource.data).toEqual([{
                userId: '1',
                fullname: 'John',
                email: 'john@example.com'
            }])
            expect(mockCreateMDOService.searchedUserdata.next).toHaveBeenCalledWith(userObj)
        })

        it('should return empty array when userObj is null', () => {
            const result = component.getAllUserByKey(null)
            expect(result).toEqual([])
            expect(component.dataSource.data).toEqual([])
        })

        it('should return empty array when userObj is undefined', () => {
            const result = component.getAllUserByKey(undefined)
            expect(result).toEqual([])
            expect(component.dataSource.data).toEqual([])
        })

        it('should clear dataSource before processing new data', () => {
            component.dataSource.data = [{ existing: 'data' }]
            const userObj = [{
                id: '1',
                firstName: 'John',
                profileDetails: {
                    personalDetails: {
                        primaryEmail: 'john@example.com'
                    }
                }
            }]

            component.getAllUserByKey(userObj)

            expect(component.dataSource.data).toHaveLength(1)
            expect(component.dataSource.data[0]).toEqual({
                userId: '1',
                fullname: 'John',
                email: 'john@example.com'
            })
        })
    })

    describe('getFinalColumns', () => {
        it('should return columns with actions when tableData has actions', () => {
            component.tableData = {
                columns: [
                    { key: 'name' },
                    { key: 'email' }
                ],
                actions: [{ name: 'Details' }],
                needCheckBox: false,
                needHash: false
            } as any

            const result = component.getFinalColumns()

            expect(result).toEqual(['name', 'email', 'Actions'])
        })

        it('should return columns with checkbox when needCheckBox is true', () => {
            component.tableData = {
                columns: [{ key: 'name' }],
                actions: [],
                needCheckBox: true,
                needHash: false
            } as any

            const result = component.getFinalColumns()

            expect(result).toEqual(['select', 'name'])
        })

        it('should return columns with hash when needHash is true', () => {
            component.tableData = {
                columns: [{ key: 'name' }],
                actions: [],
                needCheckBox: false,
                needHash: true
            } as any

            const result = component.getFinalColumns()

            expect(result).toEqual(['SR', 'name'])
        })

        it('should return columns with both checkbox and hash when both are true', () => {
            component.tableData = {
                columns: [{ key: 'name' }],
                actions: [{ name: 'Details' }],
                needCheckBox: true,
                needHash: true
            } as any

            const result = component.getFinalColumns()

            expect(result).toEqual(['SR', 'select', 'name', 'Actions'])
        })

        it('should return empty string when tableData is undefined', () => {
            component.tableData = undefined

            const result = component.getFinalColumns()

            expect(result).toBe('')
        })
    })

    describe('isAllSelected', () => {
        it('should return true when all rows are selected', () => {
            component.dataSource.data = [{ id: 1 }, { id: 2 }]
            component.selection.select({ id: 1 })
            component.selection.select({ id: 2 })

            const result = component.isAllSelected()

            expect(result).toBe(true)
        })

        it('should return false when not all rows are selected', () => {
            component.dataSource.data = [{ id: 1 }, { id: 2 }]
            component.selection.select({ id: 1 })

            const result = component.isAllSelected()

            expect(result).toBe(false)
        })

        it('should return true when no rows exist', () => {
            component.dataSource.data = []

            const result = component.isAllSelected()

            expect(result).toBe(true)
        })
    })

    describe('filterList', () => {
        it('should extract values by key from list', () => {
            const list = [
                { name: 'John', age: 30 },
                { name: 'Jane', age: 25 }
            ]

            const result = component.filterList(list, 'name')

            expect(result).toEqual(['John', 'Jane'])
        })

        it('should handle empty list', () => {
            const result = component.filterList([], 'name')

            expect(result).toEqual([])
        })
    })

    describe('masterToggle', () => {
        beforeEach(() => {
            component.dataSource.data = [{ id: 1 }, { id: 2 }]
            component.isAllSelected = jest.fn()
        })

        it('should clear selection when all rows are selected', () => {
            (component.isAllSelected as jest.Mock).mockReturnValue(true)
            const clearSpy = jest.spyOn(component.selection, 'clear')

            component.masterToggle()

            expect(clearSpy).toHaveBeenCalled()
        })

        it('should select all rows when not all are selected', () => {
            (component.isAllSelected as jest.Mock).mockReturnValue(false)
            const selectSpy = jest.spyOn(component.selection, 'select')

            component.masterToggle()

            expect(selectSpy).toHaveBeenCalledTimes(2)
            expect(selectSpy).toHaveBeenCalledWith({ id: 1 })
            expect(selectSpy).toHaveBeenCalledWith({ id: 2 })
        })
    })

    describe('checkboxLabel', () => {
        beforeEach(() => {
            component.isAllSelected = jest.fn()
        })

        it('should return select all label when no row provided and not all selected', () => {
            (component.isAllSelected as jest.Mock).mockReturnValue(false)

            const result = component.checkboxLabel()

            expect(result).toBe('deselect all')
        })

        it('should return deselect all label when no row provided and all selected', () => {
            (component.isAllSelected as jest.Mock).mockReturnValue(true)

            const result = component.checkboxLabel()

            expect(result).toBe('select all')
        })

        it('should return select row label when row is not selected', () => {
            const row = { position: 0 }
            component.selection.isSelected = jest.fn().mockReturnValue(false)

            const result = component.checkboxLabel(row)

            expect(result).toBe('select row 1')
        })

        it('should return deselect row label when row is selected', () => {
            const row = { position: 1 }
            component.selection.isSelected = jest.fn().mockReturnValue(true)

            const result = component.checkboxLabel(row)

            expect(result).toBe('deselect row 2')
        })
    })

    describe('onRowClick', () => {
        it('should emit row click event', () => {
            const mockEmit = jest.fn()
            component.eOnRowClick = { emit: mockEmit } as any
            const eventData = { rowData: 'test' }

            component.onRowClick(eventData)

            expect(mockEmit).toHaveBeenCalledWith(eventData)
        })
    })
})