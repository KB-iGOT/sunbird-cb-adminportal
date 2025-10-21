import { UIDirectoryTableComponent } from './directory-table.component'
import { SelectionModel } from '@angular/cdk/collections'
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table'
import { BehaviorSubject, of, throwError } from 'rxjs'
import { SimpleChanges } from '@angular/core'
import * as _ from 'lodash'
// Mock dependencies
const mockRouter = {
    navigate: jest.fn()
}

const mockEventService = {
    raiseInteractTelemetry: jest.fn()
}

const mockDialog = {
    open: jest.fn().mockReturnValue({
        afterClosed: jest.fn().mockReturnValue(of({}))
    })
}

const mockCreateMDOService = {
    getStatesOrMinisteries: jest.fn()
}

const mockDesignationsService = {
    getOrgReadData: jest.fn(),
    getFrameworkInfo: jest.fn()
}

// Mock environment
jest.mock('../../../../../../../../src/environments/environment', () => ({
    environment: {
        departments: ['test-dept']
    }
}))

// Mock lodash
jest.mock('lodash', () => ({
    get: jest.fn((obj, path, defaultValue) => {
        const keys = path.split('.')
        let result = obj
        for (const key of keys) {
            if (result && typeof result === 'object' && key in result) {
                result = result[key]
            } else {
                return defaultValue
            }
        }
        return result
    }),
    map: jest.fn((array, iteratee) => {
        if (typeof iteratee === 'string') {
            return array.map((item: any) => item[iteratee])
        }
        return array.map(iteratee)
    }),
    find: jest.fn((array, predicate) => {
        return array.find(predicate)
    }),
    orderBy: jest.fn((array, keys, orders) => {
        return [...array].sort((a, b) => {
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i]
                const order = orders[i] === 'desc' ? -1 : 1
                if (a[key] < b[key]) return -1 * order
                if (a[key] > b[key]) return 1 * order
            }
            return 0
        })
    })
}))


jest.mock('@angular/router')
jest.mock('@sunbird-cb/utils-v2')
jest.mock('@angular/material/dialog')
jest.mock('../../../routes/home/services/create-mdo.services')
jest.mock('../../../routes/create-mdo/routes/designation/services/designations.service')

describe('UIDirectoryTableComponent', () => {
    let component: UIDirectoryTableComponent
    let mockPaginator: any
    let mockSort: any

    beforeEach(() => {
        // Mock paginator
        mockPaginator = {
            firstPage: jest.fn()
        }

        // Mock sort
        mockSort = {}

        // Create component instance
        component = new UIDirectoryTableComponent(
            mockRouter as any,
            mockEventService as any,
            mockDialog as any,
            mockDesignationsService as any,
            mockCreateMDOService as any
        )

        // Set up component properties
        component.paginator = mockPaginator
        component.sort = mockSort
        component.tableData = {
            columns: [
                { key: 'name', label: 'Name' },
                { key: 'email', label: 'Email' }
            ],
            actions: [
                { name: 'edit', disabled: false },
                { name: 'delete', disabled: true }
            ],
            needCheckBox: false,
            needHash: false,
            tableDataCount: 10,
            loader: false,
            showNewNoContent: false
        }
        component.data = []
        component.selectedDepartment = 'organisation'
        component.departmentID = 'dept-1'

        // Reset mocks
        jest.clearAllMocks()
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('Component Initialization', () => {
        it('should create component instance', () => {
            expect(component).toBeTruthy()
        })

        it('should initialize with default values', () => {
            expect(component.pageSize).toBe(20)
            expect(component.pageSizeOptions).toEqual([20, 30, 40])
            expect(component.isSelectedDept).toBe(true)
            expect(component.showNewNoContent).toBe(false)
            expect(component.openCreateNavBar).toBe(false)
            expect(component.searchValue).toBe('')
            expect(component.moreThanTwoChar).toBe(false)
            expect(component.pageIndex).toBe(0)
        })

        it('should initialize dataSource as MatTableDataSource', () => {
            expect(component.dataSource).toBeInstanceOf(MatTableDataSource)
        })

        it('should initialize selection as SelectionModel', () => {
            expect(component.selection).toBeInstanceOf(SelectionModel)
        })

        it('should initialize filterSubject as BehaviorSubject', () => {
            expect(component['filterSubject']).toBeInstanceOf(BehaviorSubject)
        })
    })

    describe('ngOnInit', () => {
        it('should set isSelectedDept to false when department is in environment', () => {
            component.selectedDepartment = 'test-dept'
            component.ngOnInit()
            expect(component.isSelectedDept).toBe(false)
        })

        it('should set dataSource data and paginator', () => {
            const testData = [{ id: 1, name: 'Test' }]
            component.data = testData as any
            component.ngOnInit()

            expect(component.dataSource.data).toBe(testData)
            expect(component.dataSource.paginator).toBe(mockPaginator)
            expect(component.dataSource.sort).toBe(mockSort)
        })

        it('should call initializeValuesAndAPIs', () => {
            const spy = jest.spyOn(component, 'initializeValuesAndAPIs').mockImplementation()
            component.ngOnInit()
            expect(spy).toHaveBeenCalled()
        })
    })

    describe('ngOnChanges', () => {
        it('should update tableData and dataSource on changes', () => {
            const changes: SimpleChanges = {
                tableData: {
                    currentValue: { showNewNoContent: true, tableDataCount: 5 },
                    previousValue: null,
                    firstChange: true,
                    isFirstChange: () => true
                },
                data: {
                    currentValue: [{ id: 1 }],
                    previousValue: [],
                    firstChange: false,
                    isFirstChange: () => false
                }
            }

            component.ngOnChanges(changes)

            expect(component.showNewNoContent).toBe(true)
            expect(component.length).toBe(5)
            expect(component.dataSource.data).toEqual([{ id: 1 }])
        })

        it('should reset pageIndex when selectedDepartment changes', () => {
            component.pageIndex = 5
            const changes: SimpleChanges = {
                selectedDepartment: {
                    currentValue: 'new-dept',
                    previousValue: 'old-dept',
                    firstChange: false,
                    isFirstChange: () => false
                }
            }

            component.ngOnChanges(changes)
            expect(component.pageIndex).toBe(0)
        })
    })

    describe('applyFilter', () => {
        it('should set moreThanTwoChar to true when filter length > 2', () => {
            component.applyFilter('test')
            expect(component.moreThanTwoChar).toBe(true)
        })

        it('should set moreThanTwoChar to false when filter length <= 2', () => {
            component.applyFilter('te')
            expect(component.moreThanTwoChar).toBe(false)
        })

        it('should call onSearchEnter and filterSubject.next when filter is empty', () => {
            const onSearchEnterSpy = jest.spyOn(component, 'onSearchEnter').mockImplementation()
            const nextSpy = jest.spyOn(component['filterSubject'], 'next')

            component.applyFilter('')

            expect(onSearchEnterSpy).toHaveBeenCalledWith('')
            expect(nextSpy).toHaveBeenCalledWith('')
        })
    })

    describe('onOrgPageChange', () => {
        it('should update pageIndex and emit pageChangeEvent', () => {
            const event = { pageIndex: 2, pageSize: 20 }
            const emitSpy = jest.spyOn(component.pageChangeEvent, 'emit')

            component.onOrgPageChange(event)

            expect(component.pageIndex).toBe(2)
            expect(emitSpy).toHaveBeenCalledWith(event)
        })
    })

    describe('initializeValuesAndAPIs', () => {
        it('should fetch states and ministries data', () => {
            const statesResponse = {
                result: {
                    response: {
                        content: [
                            { orgName: 'State B' },
                            { orgName: 'State A' }
                        ]
                    }
                }
            }

            const ministriesResponse = {
                result: {
                    response: {
                        content: [
                            { orgName: 'Ministry Y' },
                            { orgName: 'Ministry X' }
                        ]
                    }
                }
            }

            mockCreateMDOService.getStatesOrMinisteries
                .mockReturnValueOnce(of(statesResponse))
                .mockReturnValueOnce(of(ministriesResponse))

            component.initializeValuesAndAPIs()

            expect(mockCreateMDOService.getStatesOrMinisteries).toHaveBeenCalledWith('state')
            expect(mockCreateMDOService.getStatesOrMinisteries).toHaveBeenCalledWith('ministry')
        })
    })

    describe('buttonClick', () => {
        it('should emit actionsClick when action is not disabled', () => {
            const emitSpy = jest.spyOn(component.actionsClick!, 'emit')
            const row = { id: 1 }

            component.buttonClick('edit', row)

            expect(emitSpy).toHaveBeenCalledWith({ action: 'edit', row })
        })

        it('should not emit when action is disabled', () => {
            const emitSpy = jest.spyOn(component.actionsClick!, 'emit')
            const row = { id: 1 }

            component.buttonClick('delete', row)

            expect(emitSpy).not.toHaveBeenCalled()
        })
    })

    describe('getFinalColumns', () => {
        it('should return columns with actions when actions exist', () => {
            const result = component.getFinalColumns()
            expect(result).toEqual(['name', 'email', 'Actions'])
        })

        it('should include select column when needCheckBox is true', () => {
            component.tableData.needCheckBox = true
            const result = component.getFinalColumns()
            expect(result).toEqual(['select', 'name', 'email', 'Actions'])
        })

        it('should include SR column when needHash is true', () => {
            component.tableData.needHash = true
            const result = component.getFinalColumns()
            expect(result).toEqual(['SR', 'name', 'email', 'Actions'])
        })

        it('should include link column when link exists', () => {
            component.tableData.link = { column: 'linkColumn' }
            const result = component.getFinalColumns()
            expect(result).toEqual(['name', 'email', 'Actions', 'linkColumn'])
        })

        it('should return empty string when tableData is undefined', () => {
            component.tableData = undefined as any
            const result = component.getFinalColumns()
            expect(result).toBe('')
        })
    })

    describe('Selection Methods', () => {
        beforeEach(() => {
            component.dataSource.data = [
                { id: 1, name: 'Item 1' },
                { id: 2, name: 'Item 2' }
            ]
        })

        it('should return true when all items are selected', () => {
            component.selection.select(...component.dataSource.data)
            expect(component.isAllSelected()).toBe(true)
        })

        it('should return false when not all items are selected', () => {
            component.selection.select(component.dataSource.data[0])
            expect(component.isAllSelected()).toBe(false)
        })

        it('should select all items when masterToggle is called and not all selected', () => {
            const selectSpy = jest.spyOn(component.selection, 'select')
            component.masterToggle()
            expect(selectSpy).toHaveBeenCalledWith(...component.dataSource.data)
        })

        it('should clear selection when masterToggle is called and all selected', () => {
            component.selection.select(...component.dataSource.data)
            const clearSpy = jest.spyOn(component.selection, 'clear')
            component.masterToggle()
            expect(clearSpy).toHaveBeenCalled()
        })

        it('should return correct checkbox label for row', () => {
            const row = { position: 0 }
            const label = component.checkboxLabel(row)
            expect(label).toBe('select row 1')
        })

        it('should return correct checkbox label for header', () => {
            const label = component.checkboxLabel()
            expect(label).toBe('deselect all')
        })
    })

    describe('onRowClick', () => {
        it('should emit eOnRowClick and raise telemetry', () => {
            const emitSpy = jest.spyOn(component.eOnRowClick, 'emit')
            const telemetrySpy = jest.spyOn(component, 'raiseTelemetryForRow').mockImplementation()
            const rowData = { id: 1 }

            component.onRowClick(rowData)

            expect(emitSpy).toHaveBeenCalledWith({ data: rowData, type: 'users' })
            expect(telemetrySpy).toHaveBeenCalledWith('row', rowData)
        })
    })

    describe('gotoCreateNew', () => {
        it('should open create navbar for organisation department', () => {
            const toggleSpy = jest.spyOn(component, 'toggleOverlay').mockImplementation()
            component.selectedDepartment = 'organisation'

            component.gotoCreateNew()

            expect(component.openCreateNavBar).toBe(true)
            expect(component.openMode).toBe('createNew')
            expect(component.rowData).toEqual({})
            expect(toggleSpy).toHaveBeenCalledWith(true)
        })

        it('should navigate for non-organisation department', () => {
            component.selectedDepartment = 'other'

            component.gotoCreateNew()

            expect(mockRouter.navigate).toHaveBeenCalledWith([
                '/app/home/other/create-department',
                { needAddAdmin: true }
            ])
        })
    })

    describe('raiseTelemetryForRow', () => {
        it('should call eventService.raiseInteractTelemetry', () => {
            const rowData = { id: 'test-id' }

            component.raiseTelemetryForRow('row', rowData)

            expect(mockEventService.raiseInteractTelemetry).toHaveBeenCalledWith(
                {
                    type: 'click',
                    subType: 'row',
                    id: 'row-click'
                },
                {
                    id: 'test-id',
                    type: 'department'
                }
            )
        })
    })

    describe('onSearchEnter', () => {
        it('should reset pageIndex and emit empty string for empty filter', () => {
            const emitSpy = jest.spyOn(component.searchByEnterKey, 'emit')
            component.pageIndex = 5

            component.onSearchEnter('')

            expect(component.pageIndex).toBe(0)
            expect(emitSpy).toHaveBeenCalledWith('')
        })

        it('should emit filter value when length > 2', () => {
            const emitSpy = jest.spyOn(component.searchByEnterKey, 'emit')
            component.pageIndex = 5

            component.onSearchEnter('test')

            expect(component.pageIndex).toBe(0)
            expect(emitSpy).toHaveBeenCalledWith('test')
        })

        it('should not emit when filter length <= 2', () => {
            const emitSpy = jest.spyOn(component.searchByEnterKey, 'emit')

            component.onSearchEnter('te')

            expect(emitSpy).not.toHaveBeenCalled()
        })
    })

    describe('buttonClickAction', () => {
        it('should close create navbar and overlay', () => {
            const toggleSpy = jest.spyOn(component, 'toggleOverlay').mockImplementation()
            component.openCreateNavBar = true
            component.customSelfRegistration = true

            component.buttonClickAction({ action: 'create' })

            expect(component.openCreateNavBar).toBe(false)
            expect(component.customSelfRegistration).toBe(false)
            expect(toggleSpy).toHaveBeenCalledWith(false)
        })
    })

    describe('generateCustRegistrationLink', () => {
        it('should open dialog when framework has no associations', () => {
            const row = { id: 'org-1' }
            const orgResponse = { frameworkid: 'fw-1' }
            const frameworkResponse = {
                result: {
                    framework: {
                        categories: [{
                            terms: [{
                                associations: []
                            }]
                        }]
                    }
                }
            }

            mockDesignationsService.getOrgReadData.mockReturnValue(of(orgResponse))
            mockDesignationsService.getFrameworkInfo.mockReturnValue(of(frameworkResponse))

            component.generateCustRegistrationLink(row)

            expect(mockDialog.open).toHaveBeenCalledWith(
                expect.anything(),
                {
                    panelClass: 'info-dialog',
                    data: { type: 'import-igot-master-create' }
                }
            )
        })

        it('should open review dialog when framework has associations', () => {
            const row = { id: 'org-1' }
            const orgResponse = { frameworkid: 'fw-1' }
            const frameworkResponse = {
                result: {
                    framework: {
                        categories: [{
                            terms: [{
                                associations: ['assoc1']
                            }]
                        }]
                    }
                }
            }

            mockDesignationsService.getOrgReadData.mockReturnValue(of(orgResponse))
            mockDesignationsService.getFrameworkInfo.mockReturnValue(of(frameworkResponse))

            component.generateCustRegistrationLink(row)

            expect(mockDialog.open).toHaveBeenCalledWith(
                expect.anything(),
                {
                    panelClass: 'info-dialog',
                    data: { type: 'import-igot-master-review' }
                }
            )
        })

        it('should handle framework info error', () => {
            const row = { id: 'org-1' }
            const orgResponse = { frameworkid: 'fw-1' }

            mockDesignationsService.getOrgReadData.mockReturnValue(of(orgResponse))
            mockDesignationsService.getFrameworkInfo.mockReturnValue(throwError('Error'))

            expect(() => component.generateCustRegistrationLink(row)).not.toThrow()
        })
    })

    describe('subscribeToAfterClosedModal', () => {
        beforeEach(() => {
            component.dialogRef = {
                afterClosed: jest.fn()
            }
        })

        it('should set customSelfRegistration when reviewImporting is false', () => {
            const row = {
                id: 'org-1',
                organisation: 'Test Org',
                qrRegistrationLink: 'qr-link',
                registrationLink: 'reg-link',
                startDateRegistration: '2023-01-01',
                endDateRegistration: '2023-12-31'
            }

            const result = { reviewImporting: false }
            component.dialogRef.afterClosed.mockReturnValue(of(result))
            const toggleSpy = jest.spyOn(component, 'toggleOverlay').mockImplementation()

            component.subscribeToAfterClosedModal(row)

            expect(component.customSelfRegistration).toBe(true)
            expect(component.selfRegistrationData.orgId).toBe('org-1')
            expect(toggleSpy).toHaveBeenCalledWith(true)
        })

        it('should call goToRoute when reviewImporting is true', () => {
            const row = { id: 'org-1' }
            const result = { reviewImporting: true }
            component.dialogRef.afterClosed.mockReturnValue(of(result))
            const goToRouteSpy = jest.spyOn(component, 'goToRoute').mockImplementation()

            component.subscribeToAfterClosedModal(row)

            expect(goToRouteSpy).toHaveBeenCalledWith('designation_master/import-designation', row)
        })
    })

    describe('organizationCreatedEmit', () => {
        it('should reset pageIndex and emit search after timeout', (done) => {
            const emitSpy = jest.spyOn(component.searchByEnterKey, 'emit')
            component.pageIndex = 5

            component.organizationCreatedEmit({})

            setTimeout(() => {
                expect(component.pageIndex).toBe(0)
                expect(emitSpy).toHaveBeenCalledWith('')
                done()
            }, 1100)
        })
    })

    describe('goToRoute', () => {
        it('should emit eOnRowClick and raise telemetry', () => {
            const emitSpy = jest.spyOn(component.eOnRowClick, 'emit')
            const telemetrySpy = jest.spyOn(component, 'raiseTelemetryForRow').mockImplementation()
            const data = { id: 1 }

            component.goToRoute('test-type', data)

            expect(emitSpy).toHaveBeenCalledWith({ data, type: 'test-type' })
            expect(telemetrySpy).toHaveBeenCalledWith('row', data)
        })
    })

    describe('editOrganization', () => {
        it('should set edit mode and open navbar', () => {
            const toggleSpy = jest.spyOn(component, 'toggleOverlay').mockImplementation()
            const data = { id: 'org-1' }

            component.editOrganization(data)

            expect(component.openCreateNavBar).toBe(true)
            expect(component.openMode).toBe('editMode')
            expect(component.rowData).toBe(data)
            expect(toggleSpy).toHaveBeenCalledWith(true)
        })
    })

    describe('linkGeneratedEmit', () => {
        it('should emit search event when event is truthy', () => {
            const emitSpy = jest.spyOn(component.searchByEnterKey, 'emit')

            component.linkGeneratedEmit({ success: true })

            expect(emitSpy).toHaveBeenCalledWith('')
        })

        it('should not emit when event is falsy', () => {
            const emitSpy = jest.spyOn(component.searchByEnterKey, 'emit')

            component.linkGeneratedEmit(null)

            expect(emitSpy).not.toHaveBeenCalled()
        })
    })

    describe('toggleOverlay', () => {
        beforeEach(() => {
            // Mock DOM
            const mockElement = {
                style: { zIndex: '2' }
            }
            document.querySelector = jest.fn().mockReturnValue(mockElement)
        })

        it('should set z-index to 0 when showOverlay is true', () => {
            const mockElement = { style: { zIndex: '2' } }
            document.querySelector = jest.fn().mockReturnValue(mockElement)

            component.toggleOverlay(true)

            expect(mockElement.style.zIndex).toBe('0')
        })

        it('should set z-index to 2 when showOverlay is false', () => {
            const mockElement = { style: { zIndex: '0' } }
            document.querySelector = jest.fn().mockReturnValue(mockElement)

            component.toggleOverlay(false)

            expect(mockElement.style.zIndex).toBe('2')
        })

        it('should handle when sidenav element is not found', () => {
            document.querySelector = jest.fn().mockReturnValue(null)

            expect(() => component.toggleOverlay(true)).not.toThrow()
        })
    })

    describe('getFilterValue', () => {
        it('should return current filter value', () => {
            const testValue = 'test-filter'
            component['filterSubject'].next(testValue)

            const result = component.getFilterValue

            expect(result).toBe(testValue)
        })
    })

    describe('filterList', () => {
        it('should return array of values for given key', () => {
            const list = [
                { name: 'Item 1', id: 1 },
                { name: 'Item 2', id: 2 }
            ]

            const result = component.filterList(list, 'name')

            expect(result).toEqual(['Item 1', 'Item 2'])
        })
    })
})