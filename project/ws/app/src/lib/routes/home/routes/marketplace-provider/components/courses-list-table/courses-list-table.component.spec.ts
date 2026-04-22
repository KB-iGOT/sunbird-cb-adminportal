import { CoursesListTableComponent } from './courses-list-table.component'

jest.mock('@angular/material/table', () => ({
  MatTableDataSource: jest.fn().mockImplementation((data: any[]) => ({
    data: data || [],
    filteredData: data || [],
    filter: '',
  })),
}))

jest.mock('@angular/forms', () => ({
  FormControl: jest.fn().mockImplementation(() => ({
    value: null,
  })),
}))

describe('CoursesListTableComponent', () => {
  let component: CoursesListTableComponent

  const makeTableData = (overrides: any = {}) => ({
    columns: [
      { displayName: 'Name', key: 'name', cellType: 'text' },
      { displayName: 'Status', key: 'status', cellType: 'text' },
    ],
    showSearchBox: true,
    showDeleteAll: false,
    showPagination: true,
    needCheckBox: false,
    acceptRejectMenu: false,
    noDataMessage: 'No data found',
    ...overrides,
  })

  beforeEach(() => {
    component = new CoursesListTableComponent()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should create an instance of the component', () => {
    expect(component).toBeTruthy()
  })

  it('should have correct default values', () => {
    expect(component.coursesList).toEqual([])
    expect(component.menuItems).toEqual([])
    expect(component.showDefaultMenu).toBe(false)
    expect(component.displayedColumns).toEqual([])
    expect(component.searchQuery).toBe('')
    expect(component.allSelected).toBe(false)
    expect(component.selectedRowData).toEqual([])
  })

  describe('ngOnInit', () => {
    it('should call initializeTable and loadCourses on init', () => {
      component.tableData = makeTableData()
      component.coursesList = [{ name: 'Course 1', status: 'active' }]
      component.ngOnInit()
      expect(component.columnsList.length).toBeGreaterThan(0)
    })
  })

  describe('ngOnChanges', () => {
    it('should reload courses when coursesList changes', () => {
      component.coursesList = [{ name: 'Course A', status: 'active' }]
      component.ngOnChanges({ coursesList: { currentValue: component.coursesList } } as any)
      expect(component.totalItemsCount).toBe(1)
    })

    it('should re-initialize table when tableData changes', () => {
      component.tableData = makeTableData()
      component.ngOnChanges({ tableData: { currentValue: component.tableData } } as any)
      expect(component.columnsList.length).toBeGreaterThan(0)
    })

    it('should update pagination when paginationDetails changes', () => {
      component.paginationDetails = { currentPage: 2, pageSize: 20, totalCount: 100, paginationSizeOptions: [10, 20] }
      component.ngOnChanges({ paginationDetails: { currentValue: component.paginationDetails } } as any)
      expect(component.currentPage).toBe(2)
      expect(component.paginationSize).toBe(20)
      expect(component.totalItemsCount).toBe(100)
    })
  })

  describe('initializeTable (via tableData)', () => {
    it('should configure table with checkbox column when needCheckBox is true', () => {
      component.tableData = makeTableData({ needCheckBox: true })
      component.ngOnInit()
      expect(component.displayedColumns).toContain('select')
    })

    it('should add menu column when showDefaultMenu is true', () => {
      component.tableData = makeTableData()
      component.showDefaultMenu = true
      component.ngOnInit()
      expect(component.displayedColumns).toContain('menu')
    })

    it('should add acceptReject column when acceptRejectMenu is true', () => {
      component.tableData = makeTableData({ acceptRejectMenu: true })
      component.ngOnInit()
      expect(component.displayedColumns).toContain('acceptReject')
    })

    it('should set noDataMessage from tableData', () => {
      component.tableData = makeTableData({ noDataMessage: 'Custom empty message' })
      component.ngOnInit()
      expect(component.noDataMessage).toBe('Custom empty message')
    })
  })

  describe('loadCourses', () => {
    it('should set totalItemsCount to 0 when coursesList is empty', () => {
      component.coursesList = []
      component.tableData = makeTableData()
      component.ngOnInit()
      expect(component.totalItemsCount).toBe(0)
    })

    it('should set totalItemsCount to coursesList length when courses exist', () => {
      component.coursesList = [{ name: 'A' }, { name: 'B' }]
      component.tableData = makeTableData()
      component.ngOnInit()
      expect(component.totalItemsCount).toBe(2)
    })
  })

  describe('onSearchInput', () => {
    it('should emit searchKey with empty string when searchControl is empty', () => {
      const emitSpy = jest.spyOn(component.searchKey, 'emit')
        ; (component.searchControl as any).value = null
      component.coursesList = []
      component.onSearchInput()
      expect(emitSpy).toHaveBeenCalledWith('')
    })

    it('should filter courses and emit searchKey when search value is provided', () => {
      const emitSpy = jest.spyOn(component.searchKey, 'emit')
        ; (component.searchControl as any).value = 'angular'
      component.coursesList = [
        { name: 'Angular Course', status: 'active' },
        { name: 'React Course', status: 'active' },
      ]
      component.onSearchInput()
      expect(emitSpy).toHaveBeenCalledWith('angular')
    })
  })

  describe('onSortChange', () => {
    it('should toggle sort direction when same field is sorted', () => {
      component.tableData = makeTableData()
      component.coursesList = [{ name: 'B' }, { name: 'A' }]
      component.ngOnInit()
      component.sortField = 'name'
      component.sortDirection = 'asc'

      const emitSpy = jest.spyOn(component.sortChange, 'emit')
      component.onSortChange('name')

      expect(component.sortDirection).toBe('desc')
      expect(emitSpy).toHaveBeenCalledWith({ field: 'name', direction: 'desc' })
    })

    it('should reset to asc when a new field is sorted', () => {
      component.tableData = makeTableData()
      component.coursesList = [{ name: 'B', status: 'z' }]
      component.ngOnInit()
      component.sortField = 'name'
      component.sortDirection = 'desc'

      component.onSortChange('status')

      expect(component.sortField).toBe('status')
      expect(component.sortDirection).toBe('asc')
    })
  })

  describe('onPageChange', () => {
    it('should emit pageChange with correct pagination info', () => {
      const emitSpy = jest.spyOn(component.pageChange, 'emit')
      component.paginationDetails = { totalCount: 50 }
      const event: any = { limit: 10, currentPage: 1, previousPage: 0 }

      component.onPageChange(event)

      expect(emitSpy).toHaveBeenCalledWith({
        pageSize: 10,
        totalCount: 50,
        currentPage: 1,
        previousPage: 0,
        limit: 10,
      })
    })
  })

  describe('selectAll', () => {
    it('should mark all courses as checked and populate selectedRowData', () => {
      const courses = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }]
      component.coursesList = courses
      component.tableData = makeTableData()
      component.ngOnInit()
        ; (component.dataSource as any).filteredData = courses

      component.selectAll({ checked: true } as any)

      expect(component.allSelected).toBe(true)
      expect(component.selectedRowData.length).toBe(2)
      expect(courses[0]).toHaveProperty('isChecked', true)
    })

    it('should clear selectedRowData when unchecked', () => {
      const courses = [{ id: 1, name: 'A', isChecked: true }]
      component.coursesList = courses
      component.tableData = makeTableData()
      component.ngOnInit()
        ; (component.dataSource as any).filteredData = courses

      component.selectAll({ checked: false } as any)

      expect(component.allSelected).toBe(false)
      expect(component.selectedRowData).toEqual([])
    })
  })

  describe('onCheckboxChange', () => {
    it('should add course to selectedRowData when checked', () => {
      const course = { id: 1, name: 'Course A' }
      component.coursesList = [course]
      component.tableData = makeTableData()
      component.ngOnInit()
        ; (component.dataSource as any).filteredData = [course]

      component.onCheckboxChange({ checked: true } as any, course)

      expect(component.selectedRowData).toContain(course)
      expect(course).toHaveProperty('isChecked', true)
    })

    it('should remove course from selectedRowData when unchecked', () => {
      const course = { id: 1, name: 'Course A' }
      component.selectedRowData = [course]
      component.coursesList = [course]
      component.tableData = makeTableData()
      component.ngOnInit()
        ; (component.dataSource as any).filteredData = [course]

      component.onCheckboxChange({ checked: false } as any, course)

      expect(component.selectedRowData).not.toContain(course)
      expect(course).toHaveProperty('isChecked', false)
    })
  })

  describe('deleteAllSelected', () => {
    it('should emit delete action with selectedRowData when items are selected', () => {
      const emitSpy = jest.spyOn(component.actionTriggered, 'emit')
      component.selectedRowData = [{ id: 1 }, { id: 2 }]
      component.deleteAllSelected()
      expect(emitSpy).toHaveBeenCalledWith({ action: 'delete', rows: [{ id: 1 }, { id: 2 }] })
    })

    it('should not emit when selectedRowData is empty', () => {
      const emitSpy = jest.spyOn(component.actionTriggered, 'emit')
      component.selectedRowData = []
      component.deleteAllSelected()
      expect(emitSpy).not.toHaveBeenCalled()
    })
  })

  describe('takeAction', () => {
    it('should emit actionTriggered with given action and data', () => {
      const emitSpy = jest.spyOn(component.actionTriggered, 'emit')
      const data = { id: 1 }
      component.takeAction('edit', data)
      expect(emitSpy).toHaveBeenCalledWith({ action: 'edit', rows: data })
    })
  })

  describe('capitalizeText', () => {
    it('should capitalize first letter and lowercase rest', () => {
      expect(component.capitalizeText('hELLO')).toBe('Hello')
    })

    it('should return empty string for empty input', () => {
      expect(component.capitalizeText('')).toBe('')
    })

    it('should return empty string for null/undefined', () => {
      expect(component.capitalizeText(null as any)).toBe('')
    })

    it('should capitalize single character', () => {
      expect(component.capitalizeText('a')).toBe('A')
    })
  })
})
