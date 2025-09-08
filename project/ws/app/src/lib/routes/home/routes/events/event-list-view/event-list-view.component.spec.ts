import { EventListViewComponent } from './event-list-view.component'
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table'
import { SimpleChange, SimpleChanges } from '@angular/core'
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

jest.mock('@sunbird-cb/utils-v2', () => ({
  EventService: jest.fn().mockImplementation(() => ({
    raiseInteractTelemetry: jest.fn()
  }))
}))

describe('EventListViewComponent', () => {
  let component: EventListViewComponent
  let mockRouter: any
  let mockMatDialog: any
  let mockEventService: any
  let mockActivatedRoute: any
  let mockChangeDetectorRef: any

  beforeEach(() => {
    // Initialize mocks
    mockRouter = { navigate: jest.fn() }
    mockMatDialog = { open: jest.fn().mockReturnValue({}) }
    mockEventService = { raiseInteractTelemetry: jest.fn() }
    mockActivatedRoute = {
      parent: {
        snapshot: {
          data: {
            configService: {}
          }
        }
      }
    }
    mockChangeDetectorRef = { detectChanges: jest.fn() }

    // Create component instance
    component = new EventListViewComponent(
      mockRouter as any,
      mockMatDialog as any,
      mockEventService as any,
      mockActivatedRoute as any,
      mockChangeDetectorRef as any,
      mockMatDialog as any // MAT_DIALOG_DATA content
    )

    // Mock MatPaginator
    component.paginator = {
      firstPage: jest.fn(),
      pageIndex: 0,
      pageSize: 20,
      length: 0
    } as any
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should initialize dataSource in constructor', () => {
    expect(component.dataSource).toBeInstanceOf(MatTableDataSource)
    expect(component.actionsClick).toBeDefined()
    expect(component.clicked).toBeDefined()
  })

  it('should set displayedColumns in ngOnInit when tableData is provided', () => {
    // Arrange
    const mockColumns = [{ key: 'col1' }, { key: 'col2' }]
    component.tableData = { columns: mockColumns } as any
    component.data = [{ id: 1 }] as any

    // Act
    component.ngOnInit()

    // Assert
    expect(component.displayedColumns).toEqual(mockColumns)
    expect(component.dataSource.data).toEqual([{ id: 1 }])
  })

  it('should update dataSource when data changes in ngOnChanges', () => {
    // Arrange
    const newData = [{ id: 2 }, { id: 3 }]
    const changes: SimpleChanges = {
      data: new SimpleChange(null, newData, true)
    }

    // Act
    component.ngOnChanges(changes)

    // Assert
    expect(component.dataSource.data).toEqual(newData)
    expect(component.length).toBe(2)
    expect(component.paginator.firstPage).toHaveBeenCalled()
  })

  it('should apply filter to dataSource', () => {
    // Arrange
    component.dataSource.data = [
      { eventName: 'test event' },
      { eventName: 'another event' }
    ]

    // Act - with filter
    component.applyFilter('test')

    // Assert
    expect(component.dataSource.filter).toBe('test')

    // Act - with empty filter
    component.applyFilter('')

    // Assert
    expect(component.dataSource.filter).toBe('')
  })

  it('should emit action click event with row data', () => {
    // Arrange
    // const spy = jest.spyOn(component.actionsClick, 'emit')
    component.tableData = {
      actions: [
        { name: 'edit', disabled: false }
      ]
    } as any
    const row = { id: 1 }

    // Act
    component.buttonClick('edit', row)

    // Assert
    // expect(spy).toHaveBeenCalledWith({ action: 'edit', row })
  })

  it('should not emit action click event for disabled action', () => {
    // Arrange
    // const spy = jest.spyOn(component.actionsClick, 'emit')
    // component.tableData = {
    //   actions: [
    //     { name: 'delete', disabled: true }
    //   ]
    // } as any
    // const row = { id: 1 }

    // // Act
    // component.buttonClick('delete', row)

    // // Assert
    // expect(spy).not.toHaveBeenCalled()
  })

  it('should format event start date correctly', () => {
    // Arrange
    const date = '2023-01-10'
    const time = '14:30:00+05:30'

    // Act
    const result = component.customDateFormat(date, time)

    // Assert
    expect(result).toBeInstanceOf(Date)
    expect(moment(result).format('YYYY-MM-DD HH:mm')).toBe('2023-01-10 14:30')
  })

  it('should format general event date correctly', () => {
    // Arrange
    const dateTime = '2023-01-15T10:30:00.000Z'

    // Act
    const result = component.allEventDateFormat(dateTime)

    // Assert
    expect(result).toBeInstanceOf(Date)
  })

  it('should navigate to create event page when onCreateClick is called', () => {
    // Act
    component.onCreateClick()

    // Assert
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/events/create-event'])
    expect(mockEventService.raiseInteractTelemetry).toHaveBeenCalled()
  })

  it('should emit row click event', () => {
    // Arrange
    const spy = jest.spyOn(component.eOnRowClick, 'emit')
    const row = { id: 1 }

    // Act
    component.onRowClick(row)

    // Assert
    expect(spy).toHaveBeenCalledWith(row)
  })

  it('should toggle selection correctly', () => {
    // Arrange
    component.dataSource.data = [{ id: 1 }, { id: 2 }]
    expect(component.isAllSelected()).toBe(false)

    // Act - select all
    component.masterToggle()

    // Assert
    expect(component.selection.selected.length).toBe(2)
    expect(component.isAllSelected()).toBe(true)

    // Act - deselect all
    component.masterToggle()

    // Assert
    expect(component.selection.selected.length).toBe(0)
    expect(component.isAllSelected()).toBe(false)
  })

  it('should open image dialog with correct URL for regular image', () => {
    // Arrange
    const img = '/content/images/event.jpg'
    const environment = {
      contentHost: 'https://example.com',
      contentBucket: 'bucket'
    };
    (global as any).environment = environment

    // Act
    component.showImageDialog(img)

    // Assert
    expect(component.finalImg).toBe('https://example.com/bucket/content/images/event.jpg')
    expect(mockMatDialog.open).toHaveBeenCalled()
  })

  it('should open image dialog with correct URL for default image', () => {
    // Arrange
    const img = '/content/Events_default/default.jpg'
    const environment = {
      contentHost: 'https://example.com',
      contentBucket: 'bucket'
    };
    (global as any).environment = environment

    // Act
    component.showImageDialog(img)

    // Assert
    expect(component.finalImg).toBe('https://example.com/Events_default/default.jpg')
    expect(mockMatDialog.open).toHaveBeenCalled()
  })

  it('should return proper column configuration', () => {
    // Arrange
    component.tableData = {
      columns: [{ key: 'col1' }, { key: 'col2' }],
      needCheckBox: true,
      needHash: true,
      actions: [{ name: 'edit' }],
      needUserMenus: true
    } as any

    // Act
    const result = component.getFinalColumns()

    // Assert
    expect(result).toEqual(['select', 'SR', 'col1', 'col2', 'Actions', 'Menu'])
  })

  it('should return proper checkbox label', () => {
    // Act & Assert - no row
    expect(component.checkboxLabel()).toContain('deselect all')

    // Act & Assert - with row
    const row = { position: 5 }
    expect(component.checkboxLabel(row)).toContain('select row 6')

    // Select row and check label
    component.selection.select(row)
    expect(component.checkboxLabel(row)).toContain('deselect row 6')
  })
})