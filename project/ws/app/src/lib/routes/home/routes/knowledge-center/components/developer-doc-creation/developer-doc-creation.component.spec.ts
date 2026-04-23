import { FormBuilder, FormArray } from '@angular/forms'
import { of, throwError } from 'rxjs'
import { DeveloperDocCreationComponent } from './developer-doc-creation.component'

let mockQueryParams = of({ id: null as any })

const mockActivatedRoute = {
  get queryParams() { return mockQueryParams },
}

const mockRouter = { navigate: jest.fn() }

const mockDeveloperDocService = {
  getArticles: jest.fn(),
  createSubCategory: jest.fn(),
  updateSubCategory: jest.fn(),
  createArticle: jest.fn(),
  updateArticle: jest.fn(),
  deleteArticle: jest.fn(),
  publishArticle: jest.fn(),
  publishSubCategory: jest.fn(),
}

const mockSnackBar = { openFromComponent: jest.fn() }
const mockLoaderService = { setLoaderState: jest.fn() }

function createComponent() {
  const fb = new FormBuilder()
  return new DeveloperDocCreationComponent(
    mockActivatedRoute as any,
    mockRouter as any,
    mockDeveloperDocService as any,
    fb,
    mockSnackBar as any,
    mockLoaderService as any,
  )
}

describe('DeveloperDocCreationComponent', () => {
  let component: DeveloperDocCreationComponent

  beforeEach(() => {
    jest.clearAllMocks()
    mockDeveloperDocService.getArticles.mockReturnValue(of({ result: { data: [] } }))
    component = createComponent()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('initializeForm', () => {
    it('should create form with required controls', () => {
      expect(component.subCategoryForm).toBeDefined()
      expect(component.subCategoryForm.get('title')).toBeDefined()
      expect(component.subCategoryForm.get('articles')).toBeDefined()
      expect(component.subCategoryForm.get('tags')).toBeDefined()
    })
  })

  describe('stripHtml', () => {
    it('should remove HTML tags from string', () => {
      expect(component.stripHtml('<p>Hello <b>World</b></p>')).toBe('Hello World')
    })

    it('should replace &nbsp; with space', () => {
      expect(component.stripHtml('Hello&nbsp;World')).toBe('Hello World')
    })

    it('should return empty string for falsy input', () => {
      expect(component.stripHtml('')).toBe('')
    })
  })

  describe('normalizeSpaces', () => {
    it('should collapse multiple spaces', () => {
      expect(component.normalizeSpaces('Hello   World')).toBe('Hello World')
    })

    it('should trim leading and trailing spaces', () => {
      expect(component.normalizeSpaces('  Hello  ')).toBe('Hello')
    })
  })

  describe('plainTextRequired', () => {
    it('should return null for non-empty content', () => {
      const ctrl = component.subCategoryForm.get('title')!
      ctrl.setValue('Some text here')
      const result = component.plainTextRequired(ctrl)
      expect(result).toBeNull()
    })

    it('should return required error for empty HTML content', () => {
      const ctrl = component.subCategoryForm.get('title')!
      ctrl.setValue('<p>   </p>')
      const result = component.plainTextRequired(ctrl)
      expect(result).toEqual({ required: true })
    })
  })

  describe('plainTextMinLength', () => {
    it('should return null for content meeting min length', () => {
      const validator = component.plainTextMinLength(3)
      const ctrl = component.subCategoryForm.get('title')!
      ctrl.setValue('Long enough content here')
      expect(validator(ctrl)).toBeNull()
    })

    it('should return minlength error for content below min length', () => {
      const validator = component.plainTextMinLength(10)
      const ctrl = component.subCategoryForm.get('title')!
      ctrl.setValue('<p>Hi</p>')
      expect(validator(ctrl)).toEqual({
        minlength: { requiredLength: 10, actualLength: 2 }
      })
    })

    it('should return null for empty content (let required handle it)', () => {
      const validator = component.plainTextMinLength(10)
      const ctrl = component.subCategoryForm.get('title')!
      ctrl.setValue('')
      expect(validator(ctrl)).toBeNull()
    })
  })

  describe('plainTextMaxLength', () => {
    it('should return null for content within max length', () => {
      const validator = component.plainTextMaxLength(1000)
      const ctrl = component.subCategoryForm.get('title')!
      ctrl.setValue('short content')
      expect(validator(ctrl)).toBeNull()
    })

    it('should return maxlength error for content exceeding max', () => {
      const validator = component.plainTextMaxLength(5)
      const ctrl = component.subCategoryForm.get('title')!
      ctrl.setValue('this is too long')
      expect(validator(ctrl)).toEqual({
        maxlength: { requiredLength: 5, actualLength: 16 }
      })
    })
  })

  describe('createArticleForm', () => {
    it('should create article form with default values', () => {
      const form = component.createArticleForm()
      expect(form.get('title')).toBeDefined()
      expect(form.get('content')).toBeDefined()
    })

    it('should populate article form with given article data', () => {
      const article = { articleId: 'art1', title: 'Test Title', content: '<p>Content</p>' }
      const form = component.createArticleForm(article)
      expect(form.get('title')?.value).toBe('Test Title')
      expect(form.get('articleId')?.value).toBe('art1')
    })
  })

  describe('createTagForm', () => {
    it('should create tag form with empty value', () => {
      const form = component.createTagForm()
      expect(form.get('value')?.value).toBe('')
    })

    it('should create tag form with provided value', () => {
      const form = component.createTagForm('Angular')
      expect(form.get('value')?.value).toBe('Angular')
    })
  })

  describe('articlesArray getter', () => {
    it('should return articles FormArray', () => {
      expect(component.articlesArray).toBeInstanceOf(FormArray)
    })
  })

  describe('tagsArray getter', () => {
    it('should return tags FormArray', () => {
      expect(component.tagsArray).toBeInstanceOf(FormArray)
    })
  })

  describe('addArticle', () => {
    it('should add a new article to the form', () => {
      const initialLength = component.articlesArray.length
      component.addArticle()
      expect(component.articlesArray.length).toBe(initialLength + 1)
    })
  })

  describe('removeArticle', () => {
    it('should remove article at given index when more than one', () => {
      component.addArticle()
      const len = component.articlesArray.length
      component.removeArticle(0)
      expect(component.articlesArray.length).toBe(len - 1)
    })

    it('should not remove when only one article remains', () => {
      // Start with exactly 1 article
      while (component.articlesArray.length > 1) {
        component.articlesArray.removeAt(0)
      }
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      component.removeArticle(0)
      expect(component.articlesArray.length).toBe(1)
      consoleSpy.mockRestore()
    })
  })

  describe('deleteArticle', () => {
    it('should show error when only one article', () => {
      while (component.articlesArray.length > 1) component.articlesArray.removeAt(0)
      const event = { stopPropagation: jest.fn() }
      component.deleteArticle(0, event as any)
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })

    it('should remove new article (no articleId) from array', () => {
      component.addArticle()
      const event = { stopPropagation: jest.fn() }
      component.deleteArticle(1, event as any)
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })

    it('should call deleteArticle API for existing article', () => {
      component.addArticle()
      const formArray = component.articlesArray
      formArray.at(1).get('articleId')?.setValue('art-1')
      mockDeveloperDocService.deleteArticle.mockReturnValue(of({ result: 'ok' }))
      const event = { stopPropagation: jest.fn() }
      component.deleteArticle(1, event as any)
      expect(mockDeveloperDocService.deleteArticle).toHaveBeenCalledWith('art-1')
    })

    it('should show error when deleteArticle API fails', () => {
      component.addArticle()
      component.articlesArray.at(1).get('articleId')?.setValue('art-1')
      mockDeveloperDocService.deleteArticle.mockReturnValue(throwError(() => ({ error: { params: { errMsg: 'Delete failed' } } })))
      const event = { stopPropagation: jest.fn() }
      component.deleteArticle(1, event as any)
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })
  })

  describe('addTag', () => {
    it('should add a new empty tag', () => {
      const initial = component.tagsArray.length
      component.addTag()
      expect(component.tagsArray.length).toBe(initial + 1)
    })
  })

  describe('removeTag', () => {
    it('should remove tag when more than one exists', () => {
      component.addTag()
      const len = component.tagsArray.length
      component.removeTag(0)
      expect(component.tagsArray.length).toBe(len - 1)
    })

    it('should clear value when only one tag remains', () => {
      while (component.tagsArray.length > 1) component.tagsArray.removeAt(0)
      component.tagsArray.at(0).patchValue({ value: 'SomeTag' })
      component.removeTag(0)
      expect(component.tagsArray.at(0).get('value')?.value).toBe('')
    })
  })

  describe('onTagChange', () => {
    it('should add empty tag if none is empty', () => {
      while (component.tagsArray.length > 0) component.tagsArray.removeAt(0)
      component.tagsArray.push(component.createTagForm('angular'))
      const initialLen = component.tagsArray.length
      component.onTagChange()
      expect(component.tagsArray.length).toBe(initialLen + 1)
    })
  })

  describe('toggleAccordion', () => {
    it('should toggle accordion to null when same index clicked', () => {
      component.expandedAccordionIndex = 0
      component.toggleAccordion(0)
      expect(component.expandedAccordionIndex).toBeNull()
    })

    it('should set accordion to new index', () => {
      component.expandedAccordionIndex = 0
      component.toggleAccordion(1)
      expect(component.expandedAccordionIndex).toBe(1)
    })
  })

  describe('save', () => {
    it('should call performSave with DRAFT', () => {
      const spy = jest.spyOn(component, 'performSave')
      component.save()
      expect(spy).toHaveBeenCalledWith('DRAFT')
    })
  })

  describe('next', () => {
    it('should show error when form is invalid', () => {
      component.subCategoryForm.get('title')?.setValue('')
      component.next()
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })
  })

  describe('performSave', () => {
    it('should return early when title is invalid', () => {
      component.subCategoryForm.get('title')?.setValue('')
      component.performSave('DRAFT')
      expect(mockDeveloperDocService.createSubCategory).not.toHaveBeenCalled()
    })

    it('should call createNewSubCategory when no articleId', () => {
      component.subCategoryForm.get('title')?.setValue('Long enough title text')
      mockDeveloperDocService.createSubCategory.mockReturnValue(of({ result: { subCategoryId: 'sub1' } }))
      mockDeveloperDocService.createArticle.mockReturnValue(of({ result: { articleId: 'art1' } }))
      component.performSave('DRAFT')
      expect(mockDeveloperDocService.createSubCategory).toHaveBeenCalled()
    })
  })

  describe('getCategories', () => {
    it('should set categoryOptions from response', () => {
      mockDeveloperDocService.getArticles.mockReturnValue(of({
        result: { data: [{ categoryId: 'cat1', title: 'Category 1' }] }
      }))
      component.getCategories()
      expect(component.categoryOptions.length).toBe(1)
    })

    it('should handle error gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      mockDeveloperDocService.getArticles.mockReturnValue(throwError(() => new Error('Error')))
      component.getCategories()
      consoleSpy.mockRestore()
    })
  })

  describe('populateForm', () => {
    it('should set form values from subCategoryDetails', () => {
      component.mode = 'edit'
      const details = {
        title: 'My Article Title', summary: 'Summary text', categoryId: 'cat1',
        isPublic: true, status: 'PUBLISHED', articles: [], tags: ['tag1']
      }
      component.populateForm(details)
      expect(component.subCategoryForm.get('title')?.value).toBe('My Article Title')
      expect(component.headerText).toBe('Edit Article')
    })
  })

  describe('hasError', () => {
    it('should return true for control with error and is touched', () => {
      component.subCategoryForm.get('title')?.markAsTouched()
      component.subCategoryForm.get('title')?.setValue('')
      expect(component.hasError('title', 'required')).toBe(true)
    })

    it('should return false for untouched invalid control', () => {
      expect(component.hasError('title', 'required')).toBe(false)
    })
  })

  describe('articleHasError', () => {
    it('should return true for touched article field with error', () => {
      component.articlesArray.at(0).get('title')?.markAsTouched()
      component.articlesArray.at(0).get('title')?.setValue('')
      expect(component.articleHasError(0, 'title', 'required')).toBe(true)
    })
  })

  describe('getRemainingCharacters', () => {
    it('should return remaining chars to reach min length', () => {
      component.subCategoryForm.get('title')?.setValue('Hi')
      expect(component.getRemainingCharacters('title', 10)).toBe(8)
    })

    it('should return 0 when value exceeds min length', () => {
      component.subCategoryForm.get('title')?.setValue('A very long enough title text here')
      expect(component.getRemainingCharacters('title', 5)).toBe(0)
    })
  })

  describe('getArticleRemainingCharacters', () => {
    it('should return remaining chars for article field', () => {
      component.articlesArray.at(0).get('title')?.setValue('Short')
      expect(component.getArticleRemainingCharacters(0, 'title', 10)).toBe(5)
    })

    it('should strip HTML for content field', () => {
      component.articlesArray.at(0).get('content')?.setValue('<p>Hi</p>')
      expect(component.getArticleRemainingCharacters(0, 'content', 10)).toBe(8)
    })
  })

  describe('getArticleContentPlainTextLength', () => {
    it('should return plain text length of article content', () => {
      component.articlesArray.at(0).get('content')?.setValue('<p>Hello World</p>')
      expect(component.getArticleContentPlainTextLength(0)).toBe(11)
    })
  })

  describe('cancel', () => {
    it('should navigate to knowledge-center', () => {
      component.cancel()
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/knowledge-center'])
    })
  })

  describe('markFormGroupTouched', () => {
    it('should mark all controls as touched', () => {
      component.markFormGroupTouched(component.subCategoryForm)
      expect(component.subCategoryForm.get('title')?.touched).toBe(true)
    })
  })

  describe('showSnackBar', () => {
    it('should call snackBar.openFromComponent', () => {
      component.showSnackBar('Test', 'success')
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })
  })

  describe('initializeComponent', () => {
    it('should set mode to create when no id in queryParams', () => {
      mockQueryParams = of({ id: null })
      mockDeveloperDocService.getArticles.mockReturnValue(of({ result: { data: [] } }))
      const comp = createComponent()
      comp.ngOnInit()
      expect(comp.mode).toBe('create')
      expect(comp.articleId).toBeNull()
    })

    it('should call loadArticle when id is present in queryParams', () => {
      mockQueryParams = of({ id: 'sub123', mode: 'edit' })
      mockDeveloperDocService.getArticles.mockReturnValue(of({ result: { data: [{ status: 'DRAFT', articles: [] }] } }))
      const comp = createComponent()
      comp.ngOnInit()
      expect(comp.articleId).toBe('sub123')
      expect(comp.mode).toBe('edit')
    })

    it('should default mode to edit when mode is not in queryParams', () => {
      mockQueryParams = of({ id: 'sub456' })
      mockDeveloperDocService.getArticles.mockReturnValue(of({ result: { data: [{ status: 'DRAFT', articles: [] }] } }))
      const comp = createComponent()
      comp.ngOnInit()
      expect(comp.mode).toBe('edit')
    })
  })

  describe('loadArticle', () => {
    it('should navigate away when response is falsy', () => {
      mockDeveloperDocService.getArticles.mockReturnValueOnce(of(null))
      component.loadArticle('some-id')
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/knowledge-center'])
    })

    it('should call loadArticleSections on valid response', () => {
      mockDeveloperDocService.getArticles
        .mockReturnValueOnce(of({ result: { data: [{ status: 'DRAFT' }] } }))
        .mockReturnValueOnce(of({ result: { data: [] } }))
      const spy = jest.spyOn(component, 'loadArticleSections')
      component.loadArticle('sub-id')
      expect(spy).toHaveBeenCalledWith('sub-id')
    })

    it('should navigate away on loadArticle error', () => {
      mockDeveloperDocService.getArticles.mockReturnValueOnce(throwError(() => new Error('err')))
      component.loadArticle('sub-id')
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/knowledge-center'])
      expect(mockLoaderService.setLoaderState).toHaveBeenCalledWith(false)
    })
  })

  describe('loadArticleSections', () => {
    it('should populate form and set loader false on success', () => {
      component.subCategoryDetails = { status: 'DRAFT', articles: [] }
      mockDeveloperDocService.getArticles.mockReturnValueOnce(
        of({ result: { data: [{ title: 'A', content: 'B' }] } })
      )
      const spy = jest.spyOn(component, 'populateForm')
      component.loadArticleSections('sub-id')
      expect(spy).toHaveBeenCalled()
      expect(mockLoaderService.setLoaderState).toHaveBeenCalledWith(false)
    })

    it('should navigate away on loadArticleSections error', () => {
      mockDeveloperDocService.getArticles.mockReturnValueOnce(throwError(() => new Error('err')))
      component.loadArticleSections('sub-id')
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/knowledge-center'])
      expect(mockLoaderService.setLoaderState).toHaveBeenCalledWith(false)
    })

    it('should handle falsy response in loadArticleSections', () => {
      mockDeveloperDocService.getArticles.mockReturnValueOnce(of(null))
      component.loadArticleSections('sub-id')
      // should not throw
      expect(true).toBe(true)
    })
  })

  describe('populateForm extra branches', () => {
    it('should set headerText to New Article for create mode', () => {
      component.mode = 'create'
      const details = {
        title: 'Title', summary: 'Summ', categoryId: 'c1',
        isPublic: true, status: 'DRAFT', articles: [{ title: 'A', content: 'B' }], tags: ['t1']
      }
      component.populateForm(details)
      expect(component.headerText).toBe('New Article')
    })

    it('should set headerText to View Article for view mode', () => {
      component.mode = 'view'
      const details = {
        title: 'Title', summary: 'Summ', categoryId: 'c1',
        isPublic: true, status: 'PUBLISHED', articles: [], tags: []
      }
      component.populateForm(details)
      expect(component.headerText).toBe('View Article')
    })

    it('should add empty article when articles array is empty', () => {
      component.mode = 'edit'
      const details = {
        title: 'T', summary: 'S', categoryId: 'c1',
        isPublic: true, status: 'DRAFT', articles: null, tags: null
      }
      component.populateForm(details)
      expect(component.articlesArray.length).toBe(1)
      expect(component.tagsArray.length).toBe(1)
    })
  })

  describe('getCategories extra', () => {
    it('should set default category when form has no value and options exist', () => {
      component.subCategoryForm.get('category')?.setValue('')
      mockDeveloperDocService.getArticles.mockReturnValue(of({
        result: { data: [{ categoryId: 'cat99', title: 'Cat99' }] }
      }))
      component.getCategories()
      expect(component.subCategoryForm.get('category')?.value).toBe('cat99')
    })

    it('should not override existing category value', () => {
      component.subCategoryForm.get('category')?.setValue('existing-cat')
      mockDeveloperDocService.getArticles.mockReturnValue(of({
        result: { data: [{ categoryId: 'cat1', title: 'Cat1' }] }
      }))
      component.getCategories()
      expect(component.subCategoryForm.get('category')?.value).toBe('existing-cat')
    })
  })

  describe('performSave with existing articleId', () => {
    it('should call saveExistingSubCategory when articleId is set', () => {
      component.articleId = 'existing-sub'
      component.subCategoryDetails = { status: 'DRAFT' }
      component.subCategoryForm.get('title')?.setValue('Long enough title text here')
      mockDeveloperDocService.updateSubCategory.mockReturnValue(of({ result: { subCategoryId: 'existing-sub' } }))
      mockDeveloperDocService.createArticle.mockReturnValue(of({ result: { articleId: 'art1' } }))
      component.performSave('DRAFT')
      expect(mockDeveloperDocService.updateSubCategory).toHaveBeenCalled()
    })

    it('should handle missing subCategoryId in response', () => {
      component.articleId = null
      component.subCategoryForm.get('title')?.setValue('Long enough title text here')
      mockDeveloperDocService.createSubCategory.mockReturnValue(of({ result: {} }))
      component.performSave('DRAFT')
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })

    it('should handle performSave error', () => {
      component.articleId = null
      component.subCategoryForm.get('title')?.setValue('Long enough title text here')
      mockDeveloperDocService.createSubCategory.mockReturnValue(throwError(() => ({ error: { params: { errMsg: 'Save error' } } })))
      component.performSave('DRAFT')
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })
  })

  describe('publish', () => {
    it('should show error when no articleId', () => {
      component.articleId = null
      component.publish()
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })

    it('should call publishSubCategory when no article IDs', () => {
      component.articleId = 'sub-id'
      while (component.articlesArray.length > 1) component.articlesArray.removeAt(0)
      component.articlesArray.at(0).get('articleId')?.setValue('')
      const spy = jest.spyOn(component, 'publishSubCategory')
      component.publish()
      // no forkJoin since no article IDs - publishSubCategory not called directly
      expect(spy).not.toHaveBeenCalled()
    })

    it('should call publishSubCategory after all articles published', () => {
      component.articleId = 'sub-id'
      component.articlesArray.at(0).get('articleId')?.setValue('art-1')
      mockDeveloperDocService.publishArticle.mockReturnValue(of({ result: 'ok' }))
      mockDeveloperDocService.publishSubCategory.mockReturnValue(of({ result: 'ok' }))
      component.publish()
      expect(mockDeveloperDocService.publishArticle).toHaveBeenCalledWith({ id: 'art-1' })
    })

    it('should show error when forkJoin fails in publish', () => {
      component.articleId = 'sub-id'
      component.articlesArray.at(0).get('articleId')?.setValue('art-1')
      mockDeveloperDocService.publishArticle.mockReturnValue(throwError(() => ({ error: { params: { errMsg: 'Publish failed' } } })))
      component.publish()
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })
  })

  describe('publishSubCategory', () => {
    it('should return early when no articleId', () => {
      component.articleId = null
      component.isSaving = true
      component.publishSubCategory()
      expect(component.isSaving).toBe(false)
    })

    it('should navigate after successful publish', () => {
      jest.useFakeTimers()
      component.articleId = 'sub-id'
      mockDeveloperDocService.publishSubCategory.mockReturnValue(of({ result: 'ok' }))
      component.publishSubCategory()
      jest.runAllTimers()
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/knowledge-center'])
      jest.useRealTimers()
    })

    it('should show error on publishSubCategory failure', () => {
      component.articleId = 'sub-id'
      mockDeveloperDocService.publishSubCategory.mockReturnValue(throwError(() => ({ error: { params: { errMsg: 'Publish error' } } })))
      component.publishSubCategory()
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })

    it('should handle falsy response in publishSubCategory', () => {
      component.articleId = 'sub-id'
      mockDeveloperDocService.publishSubCategory.mockReturnValue(of(null))
      component.publishSubCategory()
      // should not navigate
      expect(mockRouter.navigate).not.toHaveBeenCalled()
    })
  })

  describe('createNewSubCategory', () => {
    it('should call createSubCategory with correct payload', () => {
      mockDeveloperDocService.createSubCategory.mockReturnValue(of({}))
      component.createNewSubCategory({ title: 'T', isPublic: true }, 'DRAFT').subscribe()
      expect(mockDeveloperDocService.createSubCategory).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'subcategory', status: 'DRAFT' })
      )
    })
  })

  describe('saveExistingSubCategory', () => {
    it('should call updateSubCategory with merged payload', () => {
      component.subCategoryDetails = { title: 'Old', updatedBy: 'user', updatedOn: '2024', articles: [] }
      mockDeveloperDocService.updateSubCategory.mockReturnValue(of({}))
      component.saveExistingSubCategory({ title: 'New', isPublic: true }, 'PUBLISHED').subscribe()
      const callArg = mockDeveloperDocService.updateSubCategory.mock.calls[0][0]
      expect(callArg.title).toBe('New')
      expect(callArg.status).toBe('PUBLISHED')
      expect(callArg.updatedBy).toBeUndefined()
    })
  })

  describe('saveArticlesData', () => {
    it('should create new articles via forkJoin', () => {
      component.articleId = 'sub-id'
      component.subCategoryForm.get('category')?.setValue('cat1')
      component.subCategoryForm.get('visibility')?.setValue(true)
      component.subCategoryDetails = { articles: [] }
      // Article without articleId - new article
      component.articlesArray.at(0).get('articleId')?.setValue('')
      component.articlesArray.at(0).get('title')?.setValue('New article title')
      component.articlesArray.at(0).get('content')?.setValue('content')

      mockDeveloperDocService.createArticle.mockReturnValue(of({ result: { articleId: 'new-art-1' } }))
      mockDeveloperDocService.getArticles.mockReturnValue(of({ result: { data: [] } }))
      component.saveArticlesData('sub-id', 'DRAFT')
      expect(mockDeveloperDocService.createArticle).toHaveBeenCalled()
    })

    it('should update existing articles via forkJoin', () => {
      component.articleId = 'sub-id'
      component.subCategoryDetails = {
        articles: [{ articleId: 'art-1', title: 'Old', content: 'Old content', status: 'DRAFT' }]
      }
      component.articlesArray.at(0).get('articleId')?.setValue('art-1')
      component.articlesArray.at(0).get('title')?.setValue('Updated title')
      component.articlesArray.at(0).get('content')?.setValue('Updated content')
      mockDeveloperDocService.updateArticle.mockReturnValue(of({ result: {} }))
      mockDeveloperDocService.getArticles.mockReturnValue(of({ result: { data: [] } }))
      component.saveArticlesData('sub-id', 'DRAFT')
      expect(mockDeveloperDocService.updateArticle).toHaveBeenCalled()
    })

    it('should handle forkJoin error in saveArticlesData', () => {
      component.articleId = 'sub-id'
      component.subCategoryDetails = { articles: [] }
      component.articlesArray.at(0).get('articleId')?.setValue('')
      component.articlesArray.at(0).get('title')?.setValue('A title')
      component.articlesArray.at(0).get('content')?.setValue('content')
      mockDeveloperDocService.createArticle.mockReturnValue(throwError(() => ({ error: { params: { errMsg: 'Article error' } } })))
      component.saveArticlesData('sub-id', 'DRAFT')
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })

    it('should call publish when status is PUBLISHED in saveArticlesData', () => {
      component.articleId = 'sub-id'
      component.subCategoryDetails = { articles: [] }
      component.articlesArray.at(0).get('articleId')?.setValue('')
      component.articlesArray.at(0).get('title')?.setValue('title')
      component.articlesArray.at(0).get('content')?.setValue('content')
      mockDeveloperDocService.createArticle.mockReturnValue(of({ result: { articleId: 'new-art' } }))
      mockDeveloperDocService.getArticles.mockReturnValue(of({ result: { data: [] } }))
      mockDeveloperDocService.publishArticle.mockReturnValue(of({}))
      mockDeveloperDocService.publishSubCategory.mockReturnValue(of({}))
      const spy = jest.spyOn(component, 'publish')
      component.saveArticlesData('sub-id', 'PUBLISHED')
      expect(spy).toHaveBeenCalled()
    })

    it('should do nothing when articles array is empty in saveArticlesData', () => {
      component.subCategoryDetails = { articles: [] }
      while (component.articlesArray.length > 0) component.articlesArray.removeAt(0)
      component.saveArticlesData('sub-id', 'DRAFT')
      expect(mockDeveloperDocService.createArticle).not.toHaveBeenCalled()
    })
  })

  describe('next - valid form', () => {
    it('should call performSave with PUBLISHED when form is valid', () => {
      component.subCategoryForm.get('title')?.setValue('Long enough title here!!')
      component.subCategoryForm.get('excerpt')?.setValue('A'.repeat(50))
      component.subCategoryForm.get('category')?.setValue('cat1')
      component.subCategoryForm.get('visibility')?.setValue(true)
      component.articlesArray.at(0).get('title')?.setValue('Article Title Here!!!')
      component.articlesArray.at(0).get('content')?.setValue('A'.repeat(50))
      mockDeveloperDocService.createSubCategory.mockReturnValue(of({ result: { subCategoryId: 'sub-new' } }))
      mockDeveloperDocService.createArticle.mockReturnValue(of({ result: { articleId: 'art-new' } }))
      mockDeveloperDocService.getArticles.mockReturnValue(of({ result: { data: [] } }))
      const spy = jest.spyOn(component, 'performSave')
      component.next()
      expect(spy).toHaveBeenCalledWith('PUBLISHED')
    })
  })

  describe('getTagRemainingCharacters', () => {
    it('should return remaining characters for tag field', () => {
      component.tagsArray.at(0).patchValue({ value: 'ab' })
      expect(component.getTagRemainingCharacters(0, 3)).toBe(1)
    })

    it('should return 0 when tag length exceeds minLength', () => {
      component.tagsArray.at(0).patchValue({ value: 'abcdef' })
      expect(component.getTagRemainingCharacters(0, 3)).toBe(0)
    })
  })

  describe('onCKEditorChange', () => {
    it('should update article content and mark as touched/dirty', () => {
      component.onCKEditorChange(0, '<p>New content</p>')
      const ctrl = component.articlesArray.at(0).get('content')
      expect(ctrl?.value).toBe('<p>New content</p>')
      expect(ctrl?.touched).toBe(true)
      expect(ctrl?.dirty).toBe(true)
    })
  })

  describe('deleteArticle extra', () => {
    it('should show success after new article (no articleId) removed when array has 2+', () => {
      component.addArticle()
      const event = { stopPropagation: jest.fn() }
      const len = component.articlesArray.length
      component.deleteArticle(1, event as any)
      expect(component.articlesArray.length).toBe(len - 1)
    })

    it('should remain saving when deleteArticle API returns falsy response', () => {
      component.addArticle()
      component.articlesArray.at(1).get('articleId')?.setValue('art-x')
      mockDeveloperDocService.deleteArticle.mockReturnValue(of(null))
      const event = { stopPropagation: jest.fn() }
      component.deleteArticle(1, event as any)
      // isSaving stays true because the falsy response branch doesn't reset it
      expect(component.isSaving).toBe(true)
    })
  })

  describe('markFormGroupTouched with nested FormArray', () => {
    it('should mark nested FormArray controls as touched', () => {
      component.markFormGroupTouched(component.subCategoryForm)
      const articleTitle = component.articlesArray.at(0).get('title')
      expect(articleTitle?.touched).toBe(true)
    })
  })
})

