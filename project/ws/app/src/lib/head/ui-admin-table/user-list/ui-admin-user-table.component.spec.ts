import { UIAdminUserTableComponent } from './ui-admin-user-table.component'
import { SelectionModel } from '@angular/cdk/collections'
import { EventEmitter, SimpleChanges } from '@angular/core'
import { MatTableDataSource } from '@angular/material/table'
import * as _ from 'lodash'

// Mock dependencies
const mockRouter = {
    navigate: jest.fn()
}

const mockDialog = {
    open: jest.fn().mockReturnValue({
        afterClosed: jest.fn().mockReturnValue({
            subscribe: jest.fn()
        })
    })
}

const mockActivatedRoute = {
    snapshot: {
        parent: {
            data: {
                configService: {
                    unMappedUser: {
                        roles: ['STATE_ADMIN', 'MDO_ADMIN']
                    }
                }
            }
        }
    },
    queryParams: {
        subscribe: jest.fn()
    }
}

const mockCreateMDOService = {
    searchedUserdata: {
        subscribe: jest.fn()
    },
    assignAdminToDepartment: jest.fn().mockReturnValue({
        subscribe: jest.fn()
    })
}

const mockEvents = {
    raiseInteractTelemetry: jest.fn()
}

const mockSnackBar = {
    open: jest.fn()
}

const mockPaginator = {
    pageIndex: 0,
    pageSize: 20
}

const mockSort = {}

// Mock environment
const mockEnvironment = {
    departments: ['state', 'ministry'],
    karmYogiPath: 'https://test-path.com',
    userBucket: 'user-bucket/'
}

// Mock global objects
global.sessionStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
} as any

global.document = {
    body: {
        clientHeight: 800
    }
} as any

global.window = {
    location: {
        href: 'https://test.com'
    },
    XMLHttpRequest: jest.fn()
} as any

// Mock XMLHttpRequest
const mockXHR = {
    open: jest.fn(),
    send: jest.fn(),
    onreadystatechange: jest.fn(),
    readyState: 4,
    status: 200
}

global.XMLHttpRequest = jest.fn(() => mockXHR) as any

describe('UIAdminUserTableComponent', () => {
    let component: UIAdminUserTableComponent

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks()

        // Mock the environment import
        jest.doMock('../../../../../../../../src/environments/environment', () => ({
            environment: mockEnvironment
        }))

        // Create component instance
        component = new UIAdminUserTableComponent(
            mockRouter as any,
            mockDialog as any,
            mockActivatedRoute as any,
            mockCreateMDOService as any,
            mockEvents as any,
            mockSnackBar as any
        )

        // Set up component properties
        component.paginator = mockPaginator as any
        component.sort = mockSort as any
    })

    describe('Constructor', () => {
        it('should initialize component with default values', () => {
            expect(component.bodyHeight).toBe(675) // 800 - 125
            expect(component.pageSize).toBe(20)
            expect(component.pageSizeOptions).toEqual([20, 30, 40])
            expect(component.userRoles).toEqual(['STATE_ADMIN', 'MDO_ADMIN'])
            expect(component.isStateAdmin).toBe(true)
            expect(component.dataSource).toBeInstanceOf(MatTableDataSource)
            expect(component.selection).toBeInstanceOf(SelectionModel)
            expect(component.actionsClick).toBeInstanceOf(EventEmitter)
            expect(component.clicked).toBeInstanceOf(EventEmitter)
        })

        it('should set isStateAdmin to true when STATE_ADMIN role exists', () => {
            expect(component.isStateAdmin).toBe(true)
        })
    })

    describe('ngOnInit', () => {
        it('should initialize component properties', () => {
            const mockTableData = {
                columns: [
                    { key: 'name', displayName: 'Name' },
                    { key: 'email', displayName: 'Email' }
                ]
            }

            component.tableData = mockTableData as any
            component.data = [{ name: 'Test', email: 'test@example.com' }] as any

            mockActivatedRoute.queryParams.subscribe = jest.fn((callback) => {
                callback({
                    currentDept: 'state',
                    depatName: 'Test Department',
                    orgName: 'Test Org',
                    roleId: '123',
                    path: 'reports',
                    subOrgType: 'state'
                })
            });

            (global.sessionStorage.getItem as jest.Mock).mockReturnValue('user123')

            component.ngOnInit()

            expect(component.currentUserId).toBe('user123')
            expect(component.displayedColumns).toEqual(mockTableData.columns)
            expect(component.departmentRole).toBe('state')
            expect(component.departmentName).toBe('Test Department')
            expect(component.orgName).toBe('Test Org')
            expect(component.departmentId).toBe('123')
            expect(component.reportsPath).toBe('reports')
            expect(component.subOrgType).toBe('state')
            expect(component.needAddAdmin).toBe(true)
            expect(component.needCreateUser).toBe(true)
            expect(component.isReports).toBe(true)
        })

        it('should use inputDepartmentId when departmentId is not set', () => {
            component.inputDepartmentId = '123'
            component.ngOnInit()
            expect(component.departmentId).toBe('123')
        })
    })

    describe('ngOnChanges', () => {
        it('should update component data when changes occur', () => {
            const mockData = [{ name: 'Test' }]
            const changes: SimpleChanges = {
                data: {
                    currentValue: mockData,
                    previousValue: [],
                    firstChange: false,
                    isFirstChange: () => false
                }
            }

            component.currentTabData = 'users'
            component.ngOnChanges(changes)

            expect(component.currentTabName).toBe('users')
            expect(component.dataSource.data).toEqual(mockData)
            expect(component.length).toBe(1)
        })
    })

    describe('ngAfterViewInit', () => {
        it('should set up sorting configuration', () => {
            component.ngAfterViewInit()

            expect(component.dataSource.sort).toBe(mockSort)
            expect(typeof component.dataSource.sortingDataAccessor).toBe('function')
        })

        it('should handle custom sorting for date fields', () => {
            component.ngAfterViewInit()

            const item = {
                START_DATE: '2023-01-01',
                END_DATE: '2023-12-31',
                OTHER_FIELD: 'test'
            }

            expect(component.dataSource.sortingDataAccessor(item, 'DISPLAY_START_DATE')).toBe('2023-01-01')
            expect(component.dataSource.sortingDataAccessor(item, 'DISPLAY_END_DATE')).toBe('2023-12-31')
            expect(component.dataSource.sortingDataAccessor(item, 'OTHER_FIELD')).toBe('test')
        })
    })

    describe('applyFilter', () => {
        it('should call onSearchEnter with empty string when filterValue is empty', () => {
            jest.spyOn(component, 'onSearchEnter')
            component.applyFilter('')
            expect(component.onSearchEnter).toHaveBeenCalledWith('')
        })

        it('should set moreThanTwoChar to true when filterValue length > 2', () => {
            component.applyFilter('test')
            expect(component.moreThanTwoChar).toBe(true)
        })

        it('should set moreThanTwoChar to false when filterValue length <= 2', () => {
            component.applyFilter('te')
            expect(component.moreThanTwoChar).toBe(false)
        })
    })

    describe('buttonClick', () => {
        it('should emit actionsClick when action is not disabled', () => {
            const mockTableData = {
                actions: [
                    { name: 'edit', disabled: false },
                    { name: 'delete', disabled: true }
                ]
            }

            component.tableData = mockTableData as any
            jest.spyOn(component.actionsClick!, 'emit')

            const row = { id: 1 }
            component.buttonClick('edit', row)

            expect(component.actionsClick!.emit).toHaveBeenCalledWith({ action: 'edit', row })
        })

        it('should not emit actionsClick when action is disabled', () => {
            const mockTableData = {
                actions: [{ name: 'delete', disabled: true }]
            }

            component.tableData = mockTableData as any
            jest.spyOn(component.actionsClick!, 'emit')

            component.buttonClick('delete', {})

            expect(component.actionsClick!.emit).not.toHaveBeenCalled()
        })
    })

    describe('getFinalColumns', () => {
        it('should return columns with additional columns when needed', () => {
            const mockTableData = {
                columns: [
                    { key: 'name' },
                    { key: 'email' }
                ],
                needCheckBox: true,
                needHash: true,
                actions: [{ name: 'edit' }],
                needUserMenus: true
            }

            component.tableData = mockTableData as any
            const result = component.getFinalColumns()

            expect(result).toEqual(['SR', 'select', 'name', 'email', 'Actions', 'Menu'])
        })

        it('should return basic columns when no additional features needed', () => {
            const mockTableData = {
                columns: [
                    { key: 'name' },
                    { key: 'email' }
                ]
            }

            component.tableData = mockTableData as any
            const result = component.getFinalColumns()

            expect(result).toEqual(['name', 'email'])
        })

        it('should return empty string when tableData is undefined', () => {
            component.tableData = undefined
            const result = component.getFinalColumns()

            expect(result).toBe('')
        })
    })

    describe('onChangePage', () => {
        it('should emit searchByEnterKey with correct parameters', () => {
            jest.spyOn(component.searchByEnterKey, 'emit')
            component.searchText = 'test search'

            const pageEvent = {
                pageIndex: 2,
                pageSize: 30,
                length: 100
            }

            component.onChangePage(pageEvent as any)

            expect(component.startIndex).toBe(60) // 2 * 30
            expect(component.lastIndex).toBe(30)
            expect(component.searchByEnterKey.emit).toHaveBeenCalledWith({
                query: 'test search',
                limit: 30,
                offset: 60
            })
        })

        it('should emit empty query when searchText is empty', () => {
            jest.spyOn(component.searchByEnterKey, 'emit')
            component.searchText = ''

            const pageEvent = { pageIndex: 0, pageSize: 20 }
            component.onChangePage(pageEvent as any)

            expect(component.searchByEnterKey.emit).toHaveBeenCalledWith({
                query: '',
                limit: 20,
                offset: 0
            })
        })
    })

    describe('openPopup', () => {
        it('should open dialog and handle user assignment', () => {
            const mockResponse = {
                data: [{ userId: 'user123' }]
            }

            const mockDialogRef = {
                afterClosed: jest.fn().mockReturnValue({
                    subscribe: jest.fn((callback) => callback(mockResponse))
                })
            }

            mockDialog.open.mockReturnValue(mockDialogRef)
            mockCreateMDOService.searchedUserdata.subscribe.mockImplementation((callback) => {
                callback([{
                    userId: 'user123',
                    organisations: [{ roles: ['EXISTING_ROLE'] }]
                }])
            })

            mockCreateMDOService.assignAdminToDepartment.mockReturnValue({
                subscribe: jest.fn((successCallback) => successCallback(true))
            })

            component.departmentName = 'Test Department'
            component.departmentRole = 'state'
            component.departmentId = 'dept123'

            component.openPopup()

            expect(mockDialog.open).toHaveBeenCalledWith(expect.any(Function), {
                maxHeight: 'auto',
                height: '65%',
                width: '80%',
                panelClass: 'remove-pad',
            })
        })
    })

    describe('Selection methods', () => {
        beforeEach(() => {
            component.dataSource.data = [{ id: 1 }, { id: 2 }, { id: 3 }]
            component.selection.clear()
        })

        it('should return true when all rows are selected', () => {
            component.selection.select({ id: 1 }, { id: 2 }, { id: 3 })
            expect(component.isAllSelected()).toBe(true)
        })

        it('should return false when not all rows are selected', () => {
            component.selection.select({ id: 1 })
            expect(component.isAllSelected()).toBe(false)
        })

        it('should select all rows when none are selected', () => {
            component.masterToggle()
            expect(component.selection.selected.length).toBe(3)
        })

        it('should clear selection when all rows are selected', () => {
            component.selection.select({ id: 1 }, { id: 2 }, { id: 3 })
            component.masterToggle()
            expect(component.selection.selected.length).toBe(0)
        })

        it('should return correct checkbox label', () => {
            const row = { position: 0 }
            expect(component.checkboxLabel(row)).toBe('select row 1')

            component.selection.select(row)
            expect(component.checkboxLabel(row)).toBe('deselect row 1')

            expect(component.checkboxLabel()).toBe('deselect all')
        })
    })

    describe('Navigation methods', () => {
        it('should navigate to create user page with correct params', () => {
            component.departmentId = 'dept123'
            component.departmentRole = 'state'
            component.orgName = 'Test Org'
            component.otherInput = { test: 'data' }
            component.subOrgType = 'ministry'

            jest.spyOn(component, 'raiseTelemetry')

            component.gotoCreateUser()

            expect(component.raiseTelemetry).toHaveBeenCalledWith('button')
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/create-user'], {
                queryParams: {
                    id: 'dept123',
                    currentDept: 'state',
                    createDept: JSON.stringify({ test: 'data' }),
                    orgName: 'Test Org',
                    redirectionPath: 'https://test.com',
                    subOrgType: 'mdo'
                }
            })
        })

        it('should navigate to create position page', () => {
            jest.spyOn(component, 'raiseTelemetry')

            component.gotoCreatePosition()

            expect(component.raiseTelemetry).toHaveBeenCalledWith('button')
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/requests/positions/new'], {})
        })
    })

    describe('getSubOrgType', () => {
        it('should return correct subOrgType mapping', () => {
            component.subOrgType = 'ministry'
            expect(component.getSubOrgType()).toBe('mdo')

            component.subOrgType = 'state'
            expect(component.getSubOrgType()).toBe('state')

            component.subOrgType = 'other'
            expect(component.getSubOrgType()).toBe('cbp-providers')

            component.subOrgType = 'MINISTRY'
            expect(component.getSubOrgType()).toBe('mdo')
        })
    })

    describe('onSearchEnter', () => {
        it('should emit empty string for empty or zero-length input', () => {
            jest.spyOn(component.searchByEnterKey, 'emit')

            component.onSearchEnter('')
            expect(component.searchByEnterKey.emit).toHaveBeenCalledWith('')

            component.onSearchEnter({ length: 0 })
            expect(component.searchByEnterKey.emit).toHaveBeenCalledWith('')
        })

        it('should emit search term for input longer than 2 characters', () => {
            jest.spyOn(component.searchByEnterKey, 'emit')

            component.onSearchEnter('test')
            expect(component.searchByEnterKey.emit).toHaveBeenCalledWith('test')

            component.onSearchEnter({ length: 5 })
            expect(component.searchByEnterKey.emit).toHaveBeenCalledWith({ length: 5 })
        })

        it('should not emit for input with 2 or fewer characters', () => {
            jest.spyOn(component.searchByEnterKey, 'emit')

            component.onSearchEnter('te')
            expect(component.searchByEnterKey.emit).not.toHaveBeenCalled()
        })
    })

    describe('Download methods', () => {
        beforeEach(() => {
            component.departmentId = 'dept123'
        })

        it('should download users report when file exists', () => {
            mockXHR.status = 200

            component.downloadUsersReport('Test Department')

            expect(mockXHR.open).toHaveBeenCalledWith('GET',
                'https://test-path.com/content-store/user-report/dept123/Test-Department-userReport.zip'
            )
            expect(mockXHR.send).toHaveBeenCalled()
        })

        it('should show error message when users report is not available', () => {
            mockXHR.status = 404
            mockXHR.onreadystatechange()

            expect(mockSnackBar.open).toHaveBeenCalledWith('Report is not available')
        })

        it('should download consumption report when file exists', () => {
            mockXHR.status = 200

            component.downloadConsumptionReport('Test Department')

            expect(mockXHR.open).toHaveBeenCalledWith('GET',
                'https://test-path.com/user-bucket/dept123/Test-Department-userEnrolmentReport.zip'
            )
            expect(mockXHR.send).toHaveBeenCalled()
        })

        it('should show error message when consumption report is not available', () => {
            mockXHR.status = 404
            mockXHR.onreadystatechange()

            expect(mockSnackBar.open).toHaveBeenCalledWith('Report is not available')
        })
    })

    describe('Utility methods', () => {
        it('should emit row click event', () => {
            jest.spyOn(component.eOnRowClick, 'emit')
            const rowData = { id: 1, name: 'Test' }

            component.onRowClick(rowData)

            expect(component.eOnRowClick.emit).toHaveBeenCalledWith(rowData)
        })

        it('should raise telemetry event', () => {
            component.raiseTelemetry('button')

            expect(mockEvents.raiseInteractTelemetry).toHaveBeenCalledWith({
                type: 'click',
                subType: 'button',
                id: 'button-click'
            }, {})
        })

        it('should filter list by key', () => {
            const list = [
                { name: 'John', age: 30 },
                { name: 'Jane', age: 25 }
            ]

            const result = component.filterList(list, 'name')
            expect(result).toEqual(['John', 'Jane'])
        })

        it('should open snackbar with correct parameters', () => {
            component['openSnackbar']('Test message', 3000)

            expect(mockSnackBar.open).toHaveBeenCalledWith('Test message', 'X', {
                duration: 3000
            })
        })

        it('should open snackbar with default duration', () => {
            component['openSnackbar']('Test message')

            expect(mockSnackBar.open).toHaveBeenCalledWith('Test message', 'X', {
                duration: 5000
            })
        })
    })
})