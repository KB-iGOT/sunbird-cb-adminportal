import { KnowledgeCenterListComponent } from './knowledge-center-list.component'
import { MatTableDataSource } from '@angular/material/table'
import { of, throwError } from 'rxjs'
import { FormControl } from '@angular/forms'

const mockDeveloperDocService = {
  getArticles: jest.fn(),
  deleteSubCategory: jest.fn(),
}

const mockRouter = {
  navigate: jest.fn(),
}

const mockSnackBar = {
  open: jest.fn(),
}

const mockDialogRef = {
  afterClosed: jest.fn().mockReturnValue(of(true)),
}

const mockDialog = {
  open: jest.fn().mockReturnValue(mockDialogRef),
}

const makeArticlesResponse = (items: any[] = [], totalCount = 0) => of({
  result: {
    data: items,
    totalCount,
    userDetails: [],
    categoryDetails: [],
  }
})

describe('KnowledgeCenterListComponent', () => {
  let component: KnowledgeCenterListComponent

  beforeEach(() => {
    jest.clearAllMocks()
    mockDeveloperDocService.getArticles.mockReturnValue(makeArticlesResponse())
    component = new KnowledgeCenterListComponent(
      mockDeveloperDocService as any,
      mockRouter as any,
      mockSnackBar as any,
      mockDialog as any,
    )
  })

  afterEach(() => {
    if (component['searchSubscription']) {
      component['searchSubscription'].unsubscribe()
    }
    if (component['articleApiSubscription']) {
      component['articleApiSubscription'].unsubscribe()
    }
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should have correct default values', () => {
    expect(component.articlesList).toEqual([])
    expect(component.currentPage).toBe(1)
    expect(component.paginationSize).toBe(10)
    expect(component.sortField).toBe('')
    expect(component.sortDirection).toBe('asc')
    expect(component.showLoader).toBe(false)
    expect(component.searchQuery).toBe('')
    expect(component.dataSource).toBeInstanceOf(MatTableDataSource)
  })

  it('should have menuItems with view, edit, and delete actions', () => {
    expect(component.menuItems).toHaveLength(3)
    expect(component.menuItems.map(m => m.action)).toEqual(['view', 'edit', 'delete'])
  })

  it('ngOnInit should initialize table, search listener, and load articles', () => {
    const initSpy = jest.spyOn(component as any, 'initializeTable')
    const searchSpy = jest.spyOn(component as any, 'setupSearchListener')
    const loadSpy = jest.spyOn(component as any, 'loadArticles')
    component.ngOnInit()
    expect(initSpy).toHaveBeenCalled()
    expect(searchSpy).toHaveBeenCalled()
    expect(loadSpy).toHaveBeenCalled()
  })

  it('ngOnDestroy should unsubscribe subscriptions and complete subject', () => {
    component.ngOnInit()
    const completeSpy = jest.spyOn(component['searchSubject$'], 'complete')
    component.ngOnDestroy()
    expect(completeSpy).toHaveBeenCalled()
  })

  it('initializeTable should call getColumnConfiguration', () => {
    const spy = jest.spyOn(component as any, 'getColumnConfiguration')
      ; (component as any).initializeTable()
    expect(spy).toHaveBeenCalled()
  })

  it('getColumnConfiguration should set displayedColumns including actions', () => {
    ; (component as any).getColumnConfiguration()
    expect(component.displayedColumns).toContain('actions')
    expect(component.displayedColumns).toContain('title')
    expect(component.displayedColumns).toContain('status')
  })

  it('loadArticles should set articlesList and totalItemsCount on success', () => {
    const items = [
      { title: 'Article 1', status: 'live', isPublic: true, createdBy: null, categoryId: null }
    ]
    mockDeveloperDocService.getArticles.mockReturnValue(makeArticlesResponse(items, 1))
      ; (component as any).loadArticles()
    expect(component.articlesList).toHaveLength(1)
    expect(component.totalItemsCount).toBe(1)
    expect(component.showLoader).toBe(false)
  })

  it('loadArticles should set visibility to Public when isPublic is true', () => {
    const items = [{ title: 'Article 1', status: 'live', isPublic: true, createdBy: null, categoryId: null }]
    mockDeveloperDocService.getArticles.mockReturnValue(makeArticlesResponse(items, 1))
      ; (component as any).loadArticles()
    expect(component.articlesList[0].visibility).toBe('Public')
  })

  it('loadArticles should set visibility to Private when isPublic is false', () => {
    const items = [{ title: 'Article 1', status: 'live', isPublic: false, createdBy: null, categoryId: null }]
    mockDeveloperDocService.getArticles.mockReturnValue(makeArticlesResponse(items, 1))
      ; (component as any).loadArticles()
    expect(component.articlesList[0].visibility).toBe('Private')
  })

  it('loadArticles should set status to Inactive when status is ARCHIVED', () => {
    const items = [{ title: 'Article 1', status: 'ARCHIVED', isPublic: false, createdBy: null, categoryId: null }]
    mockDeveloperDocService.getArticles.mockReturnValue(makeArticlesResponse(items, 1))
      ; (component as any).loadArticles()
    expect(component.articlesList[0].status).toBe('Inactive')
  })

  it('loadArticles should handle error and reset articlesList', () => {
    mockDeveloperDocService.getArticles.mockReturnValue(throwError('error'))
      ; (component as any).loadArticles()
    expect(component.articlesList).toEqual([])
    expect(component.showLoader).toBe(false)
  })

  it('loadArticles should handle non-array data response', () => {
    mockDeveloperDocService.getArticles.mockReturnValue(of({ result: { data: null, totalCount: 0, userDetails: [], categoryDetails: [] } }))
      ; (component as any).loadArticles()
    expect(component.articlesList).toEqual([])
  })

  it('onSearchInput should load articles with search string when trimmed length >= 3', () => {
    const loadSpy = jest.spyOn(component as any, 'loadArticles')
    component.onSearchInput('angular')
    expect(loadSpy).toHaveBeenCalledWith('angular')
  })

  it('onSearchInput should reset and load articles when search is empty', () => {
    const loadSpy = jest.spyOn(component as any, 'loadArticles')
    component.onSearchInput('')
    expect(component.currentPage).toBe(1)
    expect(loadSpy).toHaveBeenCalledWith()
  })

  it('onSearchInput should clear articlesList when search length < 3 and not 0', () => {
    component.onSearchInput('ab')
    expect(component.articlesList).toEqual([])
  })

  it('onSearchInput with no args should use searchControl value', () => {
    const loadSpy = jest.spyOn(component as any, 'loadArticles')
    component.searchControl = new FormControl('search-val')
    component.onSearchInput()
    expect(loadSpy).toHaveBeenCalled()
  })

  it('onSortChange should toggle direction when sorting same field', () => {
    component.sortField = 'title'
    component.sortDirection = 'asc'
    component.onSortChange('title')
    expect(component.sortDirection).toBe('desc')
  })

  it('onSortChange should set new field and asc direction when field changes', () => {
    component.sortField = 'title'
    component.sortDirection = 'desc'
    component.onSortChange('status')
    expect(component.sortField).toBe('status')
    expect(component.sortDirection).toBe('asc')
  })

  it('onPageChange should update currentPage, paginationSize and reload articles', () => {
    const loadSpy = jest.spyOn(component as any, 'loadArticles')
    component.onPageChange({ currentPage: 2, limit: 20, previousPage: 1 } as any)
    expect(component.currentPage).toBe(2)
    expect(component.paginationSize).toBe(20)
    expect(loadSpy).toHaveBeenCalled()
  })

  it('takeAction with view should navigate to developer-doc in view mode', () => {
    component.takeAction('view', { subCategoryId: 'art-1' })
    expect(mockRouter.navigate).toHaveBeenCalledWith(
      ['/app/home/knowledge-center/developer-doc'],
      { queryParams: { id: 'art-1', mode: 'view' } }
    )
  })

  it('takeAction with edit should navigate to developer-doc in edit mode', () => {
    component.takeAction('edit', { subCategoryId: 'art-1' })
    expect(mockRouter.navigate).toHaveBeenCalledWith(
      ['/app/home/knowledge-center/developer-doc'],
      { queryParams: { id: 'art-1', mode: 'edit' } }
    )
  })

  it('takeAction with delete should open confirmation dialog', () => {
    mockDeveloperDocService.deleteSubCategory = jest.fn().mockReturnValue(of({}))
    component.takeAction('delete', { subCategoryId: 'art-1', title: 'Article 1' })
    expect(mockDialog.open).toHaveBeenCalled()
  })

  it('takeAction with delete and confirmed should delete article and reload', () => {
    mockDialogRef.afterClosed.mockReturnValue(of(true))
    mockDeveloperDocService.deleteSubCategory = jest.fn().mockReturnValue(of({}))
    component.takeAction('delete', { subCategoryId: 'art-1', title: 'Article 1' })
    expect(mockDeveloperDocService.deleteSubCategory).toHaveBeenCalledWith('art-1')
    expect(mockSnackBar.open).toHaveBeenCalledWith('Article inactivated successfully')
  })

  it('takeAction with delete and error should show error snackbar', () => {
    mockDialogRef.afterClosed.mockReturnValue(of(true))
    mockDeveloperDocService.deleteSubCategory = jest.fn().mockReturnValue(throwError({ error: { error: { message: 'Delete error' } } }))
    component.takeAction('delete', { subCategoryId: 'art-1', title: 'Article 1' })
    expect(mockSnackBar.open).toHaveBeenCalledWith('Delete error')
  })

  it('takeAction with delete and no subCategoryId should not open dialog', () => {
    component.takeAction('delete', { title: 'Article 1' })
    expect(mockDialog.open).not.toHaveBeenCalled()
  })

  it('takeAction with unknown action should not navigate', () => {
    component.takeAction('unknown', { subCategoryId: 'art-1' })
    expect(mockRouter.navigate).not.toHaveBeenCalled()
  })

  it('addNewArticle should navigate to developer-doc without queryParams', () => {
    component.addNewArticle()
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/knowledge-center/developer-doc'])
  })

  it('capitalizeText should capitalize first letter and lowercase rest', () => {
    expect(component.capitalizeText('hELLO')).toBe('Hello')
  })

  it('capitalizeText should return empty string for empty input', () => {
    expect(component.capitalizeText('')).toBe('')
  })

  it('capitalizeText should handle single character', () => {
    expect(component.capitalizeText('a')).toBe('A')
  })

  it('takeAction with delete and response false should not delete', () => {
    mockDialogRef.afterClosed.mockReturnValue(of(false))
    mockDeveloperDocService.deleteSubCategory = jest.fn().mockReturnValue(of({}))
    component.takeAction('delete', { subCategoryId: 'art-1', title: 'Article 1' })
    expect(mockDeveloperDocService.deleteSubCategory).not.toHaveBeenCalled()
  })

  it('loadArticles with search string should pass it to API', () => {
    ; (component as any).loadArticles('angular')
    expect(mockDeveloperDocService.getArticles).toHaveBeenCalledWith(
      expect.objectContaining({ searchString: 'angular' })
    )
  })

  it('loadArticles should enrich articles with category name when category found', () => {
    const items = [{ title: 'Article', status: 'live', isPublic: true, createdBy: 'u1', categoryId: 'cat1' }]
    const response = of({
      result: {
        data: items,
        totalCount: 1,
        userDetails: [{ user_id: 'u1', first_name: 'John' }],
        categoryDetails: [{ id: 'cat1', title: 'Category 1' }],
      }
    })
    mockDeveloperDocService.getArticles.mockReturnValue(response)
      ; (component as any).loadArticles()
    expect(component.articlesList[0].categoryName).toBe('Category 1')
    expect(component.articlesList[0].creatorName).toBe('John')
  })
})
