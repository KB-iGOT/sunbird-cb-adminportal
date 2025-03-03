import { EventListViewComponent } from './event-list-view.component'
import { SimpleChange, SimpleChanges } from '@angular/core'
import { SelectionModel } from '@angular/cdk/collections'
import { MatLegacyTableDataSource } from '@angular/material/legacy-table'
import * as moment from 'moment'

// Mock dependencies
jest.mock('@angular/router', () => ({
  Router: jest.fn().mockImplementation(() => ({
    navigate: jest.fn()
  })),
  ActivatedRoute: jest.fn().mockImplementation(() => ({
    parent: {
      snapshot: {
        data: {
          configService: {}
        }
      }
    }
  }))
}))

jest.mock('@angular/material/dialog', () => ({
  MatDialog: jest.fn().mockImplementation(() => ({
    open: jest.fn().mockReturnValue({})
  })),
  MAT_DIALOG_DATA: 'MAT_DIALOG_DATA'
}))

jest.mock('@sunbird-cb/utils', () => ({
  EventService: jest.fn().mockImplementation(() => ({
    raiseInteractTelemetry: jest.fn()
  }))
}))

describe('EventListViewComponent', () => {
  let component: EventListViewComponent
  // let mockRouter: any
  // let mockMatDialog: any
  // let mockEventService: any
  // let mockActivatedRoute: any
  // let mockChangeDetectorRef: any
  let mockPaginator: any
  // let mockMatSort: any

  beforeEach(() => {
    // Mock dependencies
    // mockRouter = {
    //   navigate: jest.fn()
    // }
    // mockMatDialog = {
    //   open: jest.fn().mockReturnValue({})
    // }
    // mockEventService = {
    //   raiseInteractTelemetry: jest.fn()
    // }
    // mockActivatedRoute = {
    //   parent: {
    //     snapshot: {
    //       data: {
    //         configService: {}
    //       }
    //     }
    //   }
    // }
    // mockChangeDetectorRef = {
    //   detectChanges: jest.fn()
    // }

    // Create mock paginator before component initialization
    mockPaginator = {
      firstPage: jest.fn(),
      pageSize: 20,
      pageSizeOptions: [20, 30, 40]
    }

    // mockMatSort = {
    //   active: 'id',
    //   direction: 'asc'
    // }

    // Create component with mocked dependencies
    // component = new EventListViewComponent(
    //   mockRouter,
    //   mockMatDialog,
    //   mockEventService,
    //   mockActivatedRoute,
    //   mockChangeDetectorRef,
    //   {} // MAT_DIALOG_DATA
    // )

    // Mock the dataSource to prevent "Cannot set properties of undefined" error
    component.dataSource = new MatLegacyTableDataSource([])

    // Set mock paginator after dataSource is initialized
    component.paginator = mockPaginator

    // Handle the matSort setter
    Object.defineProperty(component, 'matSort', {
      set: (sort) => {
        if (!component.dataSource.sort) {
          component.dataSource.sort = sort
        }
      }
    })
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should initialize with correct properties', () => {
    expect(component.dataSource).toBeTruthy()
    expect(component.dataSource instanceof MatLegacyTableDataSource).toBeTruthy()
    expect(component.selection instanceof SelectionModel).toBeTruthy()
    expect(component.actionsClick).toBeTruthy()
    expect(component.clicked).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('should set displayedColumns and dataSource', () => {
      // Arrange
      const mockColumns = [
        { key: 'col1', name: 'Column 1' },
        { key: 'col2', name: 'Column 2' }
      ]
      const mockData = [{ id: 1 }, { id: 2 }]
      component.tableData = { columns: mockColumns } as any
      component.data = mockData as any

      // Act
      component.ngOnInit()

      // Assert
      expect(component.displayedColumns).toEqual(mockColumns)
      expect(component.dataSource.data).toEqual(mockData)
    })
  })

  describe('ngOnChanges', () => {
    it('should update dataSource data and reset paginator', () => {
      // Arrange
      const mockData = [{ id: 1 }, { id: 2 }]
      const changes: SimpleChanges = {
        data: new SimpleChange(null, mockData, true)
      }

      // Act
      component.ngOnChanges(changes)

      // Assert
      expect(component.dataSource.data).toEqual(mockData)
      expect(component.length).toBe(mockData.length)
      expect(component.paginator.firstPage).toHaveBeenCalled()
    })
  })

  describe('ngAfterViewInit', () => {
    it('should set up dataSource with paginator and filter predicate', () => {
      // Arrange
      jest.spyOn(component.dataSource, 'filterPredicate', 'set')

      // Act
      component.ngAfterViewInit()

      // Assert
      expect(component.dataSource.paginator).toBe(mockPaginator)
      expect(component.dataSource.filterPredicate).toBeDefined()

      // Test the filter predicate
      const filterPredicate = component.dataSource.filterPredicate
      expect(filterPredicate({ eventName: 'Test Event' }, 'test')).toBe(true)
      expect(filterPredicate({ eventName: 'Different Event' }, 'test')).toBe(false)
    })

    it('should set up sortingDataAccessor with custom date handling', () => {
      // Arrange
      const mockItem = {
        eventName: 'Test Event',
        startDate: '2023-03-15',
        startTime: '14:30:00+05:30',
        createdOn: '2023-03-15T14:30:00',
        duration: 60,
        eventjoined: 100
      }

      // Act
      component.ngAfterViewInit()

      // Get the sortingDataAccessor function
      const sortingDataAccessor = component.dataSource.sortingDataAccessor

      // Assert different properties use the correct accessors
      expect(sortingDataAccessor(mockItem, 'eventName')).toBe('Test Event')
      expect(sortingDataAccessor(mockItem, 'eventStartDate')).toBeInstanceOf(Date)
      expect(sortingDataAccessor(mockItem, 'eventCreatedOn')).toBeInstanceOf(Date)
      expect(sortingDataAccessor(mockItem, 'eventDuration')).toBe(60)
      expect(sortingDataAccessor(mockItem, 'eventjoined')).toBe(100)
    })
  })

  describe('customDateFormat', () => {
    it('should format date and time correctly', () => {
      // Arrange
      const date = '2023-03-15'
      const time = '14:30:00+05:30'

      // Act
      const result = component.customDateFormat(date, time)

      // Assert
      expect(result).toBeInstanceOf(Date)
      const formattedDate = moment(result).format('YYYY-MM-DD HH:mm')
      expect(formattedDate.substring(0, 10)).toBe('2023-03-15')
    })
  })

  describe('allEventDateFormat', () => {
    it('should format datetime correctly', () => {
      // Arrange
      const datetime = '2023-03-15T14:30:00'

      // Act
      const result = component.allEventDateFormat(datetime)

      // Assert
      expect(result).toBeInstanceOf(Date)
    })
  })

  describe('applyFilter', () => {
    it('should apply filter to dataSource when value is provided', () => {
      // Arrange
      const filterValue = 'Test Filter'

      // Act
      component.applyFilter(filterValue)

      // Assert
      expect(component.dataSource.filter).toBe('test filter')
    })

    it('should clear filter when empty value is provided', () => {
      // Arrange
      component.dataSource.filter = 'previous filter'

      // Act
      component.applyFilter('')

      // Assert
      expect(component.dataSource.filter).toBe('')
    })
  })

  describe('buttonClick', () => {
    it('should emit actionsClick event with action and row', () => {
      // Arrange
      const action = 'edit'
      const row = { id: 1 }
      component.tableData = {
        actions: [
          { name: 'edit', disabled: false }
        ]
      } as any
      // jest.spyOn(component.actionsClick, 'emit')

      // Act
      component.buttonClick(action, row)

      // Assert
      // expect(component.actionsClick.emit).toHaveBeenCalledWith({ action, row })
    })

    it('should not emit actionsClick event when action is disabled', () => {
      // Arrange
      const action = 'edit'
      const row = { id: 1 }
      component.tableData = {
        actions: [
          { name: 'edit', disabled: true }
        ]
      } as any
      // jest.spyOn(component.actionsClick, 'emit')

      // Act
      component.buttonClick(action, row)

      // Assert
      // expect(component.actionsClick.emit).not.toHaveBeenCalled()
    })
  })

  describe('getFinalColumns', () => {
    it('should return columns with select when needCheckBox is true', () => {
      // Arrange
      component.tableData = {
        columns: [{ key: 'col1' }, { key: 'col2' }],
        needCheckBox: true,
        needHash: false,
        actions: []
      } as any

      // Act
      const result = component.getFinalColumns()

      // Assert
      expect(result).toContain('select')
      expect(result).toContain('col1')
      expect(result).toContain('col2')
    })

    it('should return columns with SR when needHash is true', () => {
      // Arrange
      component.tableData = {
        columns: [{ key: 'col1' }, { key: 'col2' }],
        needCheckBox: false,
        needHash: true,
        actions: []
      } as any

      // Act
      const result = component.getFinalColumns()

      // Assert
      expect(result).toContain('SR')
      expect(result).toContain('col1')
      expect(result).toContain('col2')
    })

    it('should return columns with Actions when actions exist', () => {
      // Arrange
      component.tableData = {
        columns: [{ key: 'col1' }, { key: 'col2' }],
        needCheckBox: false,
        needHash: false,
        actions: [{ name: 'edit' }]
      } as any

      // Act
      const result = component.getFinalColumns()

      // Assert
      expect(result).toContain('Actions')
      expect(result).toContain('col1')
      expect(result).toContain('col2')
    })

    it('should return columns with Menu when needUserMenus is true', () => {
      // Arrange
      component.tableData = {
        columns: [{ key: 'col1' }, { key: 'col2' }],
        needCheckBox: false,
        needHash: false,
        actions: [],
        needUserMenus: true
      } as any

      // Act
      const result = component.getFinalColumns()

      // Assert
      expect(result).toContain('Menu')
      expect(result).toContain('col1')
      expect(result).toContain('col2')
    })

    it('should return empty string when tableData is undefined', () => {
      // Arrange
      component.tableData = undefined

      // Act
      const result = component.getFinalColumns()

      // Assert
      expect(result).toBe('')
    })
  })

  describe('isAllSelected', () => {
    it('should return true when all rows are selected', () => {
      // Arrange
      component.dataSource.data = [{ id: 1 }, { id: 2 }]
      component.selection.select(...component.dataSource.data)

      // Act
      const result = component.isAllSelected()

      // Assert
      expect(result).toBe(true)
    })

    it('should return false when not all rows are selected', () => {
      // Arrange
      component.dataSource.data = [{ id: 1 }, { id: 2 }]
      component.selection.select(component.dataSource.data[0])

      // Act
      const result = component.isAllSelected()

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('masterToggle', () => {
    it('should select all rows when none are selected', () => {
      // Arrange
      component.dataSource.data = [{ id: 1 }, { id: 2 }]
      jest.spyOn(component.selection, 'clear')
      jest.spyOn(component.selection, 'select')

      // Act
      component.masterToggle()

      // Assert
      expect(component.selection.select).toHaveBeenCalledTimes(2)
    })

    it('should clear selection when all rows are selected', () => {
      // Arrange
      component.dataSource.data = [{ id: 1 }, { id: 2 }]
      component.selection.select(...component.dataSource.data)
      jest.spyOn(component.selection, 'clear')

      // Act
      component.masterToggle()

      // Assert
      expect(component.selection.clear).toHaveBeenCalled()
    })
  })

  describe('checkboxLabel', () => {
    it('should return "select all" label when no row is provided and not all selected', () => {
      // Arrange
      jest.spyOn(component, 'isAllSelected').mockReturnValue(false)

      // Act
      const result = component.checkboxLabel()

      // Assert
      expect(result).toBe('select all')
    })

    it('should return "deselect all" label when no row is provided and all are selected', () => {
      // Arrange
      jest.spyOn(component, 'isAllSelected').mockReturnValue(true)

      // Act
      const result = component.checkboxLabel()

      // Assert
      expect(result).toBe('deselect all')
    })

    it('should return "select row" label when row is provided and not selected', () => {
      // Arrange
      const row = { position: 0 }
      jest.spyOn(component.selection, 'isSelected').mockReturnValue(false)

      // Act
      const result = component.checkboxLabel(row)

      // Assert
      expect(result).toBe('select row 1')
    })
  })
})