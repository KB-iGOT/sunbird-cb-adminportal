import { Component, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms'
import { DeveloperDocService } from '../../services/developer-doc.service'
import * as _ from 'lodash'
import { map } from 'rxjs/operators'
import { forkJoin, Observable } from 'rxjs'

@Component({
  selector: 'ws-app-developer-doc-creation',
  templateUrl: './developer-doc-creation.component.html',
  styleUrls: [
    './developer-doc-creation.component.scss'
  ],
  standalone: false,
})
export class DeveloperDocCreationComponent implements OnInit {
  // Form and properties
  subCategoryForm!: FormGroup
  subCategoryDetails: any = {}
  articleId: string | null = null
  mode: 'create' | 'edit' | 'view' = 'create'

  // UI properties
  isLoading: boolean = false
  isSaving: boolean = false
  expandedAccordionIndex: number | null = null
  headerText: string = 'Create Article'

  // Dropdown options
  visibilityOptions = [
    { value: true, label: 'Public' },
    { value: false, label: 'Member' }
  ]

  categoryOptions: any = []

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private developerDocService: DeveloperDocService,
    private fb: FormBuilder
  ) {
    this.initializeForm()
  }

  ngOnInit(): void {
    this.initializeComponent()
    this.getCategories()
  }

  /**
   * Initialize form structure
   */
  private initializeForm(): void {
    this.subCategoryForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(100)]],
      excerpt: ['', [Validators.required, Validators.minLength(10)]],
      category: ['technical', Validators.required],
      visibility: [true, Validators.required],
      articles: this.fb.array([this.createArticleForm()], Validators.minLength(1)),
      tags: this.fb.array([this.createTagForm()])
    })
  }

  /**
   * Create article form group
   */
  private createArticleForm(article?: any): FormGroup {
    return this.fb.group({
      articleId: [article?.articleId || ''],
      title: [article?.title || '', [Validators.required, Validators.minLength(3)]],
      content: [article?.content || '', [Validators.required, Validators.minLength(20)]]
    })
  }

  /**
   * Create tag form group
   */
  private createTagForm(value: string = ''): FormGroup {
    return this.fb.group({
      value: [value, [Validators.minLength(3)]]
    })
  }

  get articlesArray(): FormArray {
    return this.subCategoryForm.get('articles') as FormArray
  }

  get tagsArray(): FormArray {
    return this.subCategoryForm.get('tags') as FormArray
  }

  /**
   * Initialize component based on query parameters
   */
  private initializeComponent(): void {
    this.activatedRoute.queryParams.subscribe((queryParams: any) => {
      this.articleId = queryParams['id'] || null

      if (this.articleId) {
        this.mode = queryParams['mode'] || 'edit'
        this.loadArticle(this.articleId)
      } else {
        this.mode = 'create'
        this.subCategoryDetails = {}
      }
    })
  }

  getCategories(): void {
    const formBody = {
      filterCriteriaMap: {
        type: 'category'
      },
      requestedFields: [
        'title',
        'categoryId'
      ],
      pageNumber: 0,
      pageSize: 500
    }

    this.developerDocService.getArticles(formBody).subscribe(
      (response: any) => {
        this.categoryOptions = _.get(response, 'result.data', [])
      },
      (error: any) => {
        console.error('Error fetching categories:', error)
      })
  }


  /**
   * Load article data from service
   */
  private loadArticle(id: string): void {
    this.isLoading = true

    const formBody = {
      filterCriteriaMap: {
        subCategoryId: id
      },
      pageNumber: 0,
      pageSize: 500
    }

    this.developerDocService.getArticles(formBody).pipe(
      map((responce: any) => {
        const data = _.get(responce, 'result.data', [])
        const subCategoryDetails = data.find((item: any) => item.type === 'subcategory')
        const articlesList = data.filter((item: any) => item.type === 'article')
        return {
          ...subCategoryDetails,
          articles: articlesList
        }
      })
    ).subscribe(
      (response: any) => {
        if (response) {
          this.subCategoryDetails = response
          this.populateForm(this.subCategoryDetails)
        } else {
          console.warn('Article not found')
          this.router.navigate(['/app/home/knowledge-center'])
        }
        this.isLoading = false
      },
      (error: any) => {
        console.error('Error loading article:', error)
        this.isLoading = false
        this.router.navigate(['/app/home/knowledge-center'])
      }
    )
  }

  private populateForm(subCategoryDetails: any): void {
    switch (this.mode) {
      case 'create':
        this.headerText = 'Create Article'
        break
      case 'edit':
        this.headerText = 'Edit Article'
        break
      case 'view':
        this.headerText = 'View Article'
        break
    }

    this.subCategoryForm.patchValue({
      title: subCategoryDetails.title || '',
      excerpt: subCategoryDetails.summary || '',
      category: subCategoryDetails.categoryId,
      visibility: subCategoryDetails.isPublic,
    })

    const articlesArray = this.subCategoryForm.get('articles') as FormArray
    articlesArray.clear()
    if (subCategoryDetails.articles && Array.isArray(subCategoryDetails.articles) && subCategoryDetails.articles.length > 0) {
      subCategoryDetails.articles.forEach((art: any) => {
        articlesArray.push(this.createArticleForm(art))
      })
    } else {
      articlesArray.push(this.createArticleForm())
    }

    const tagsArray = this.subCategoryForm.get('tags') as FormArray
    tagsArray.clear()
    if (subCategoryDetails.tags && Array.isArray(subCategoryDetails.tags) && subCategoryDetails.tags.length > 0) {
      subCategoryDetails.tags.forEach((tag: any) => {
        tagsArray.push(this.createTagForm(tag))
      })
    } else {
      tagsArray.push(this.createTagForm())
    }
  }

  /**
   * Add new article
   */
  addArticle(): void {
    const articlesArray = this.subCategoryForm.get('articles') as FormArray
    articlesArray.push(this.createArticleForm())
  }

  /**
   * Remove article
   */
  removeArticle(index: number): void {
    const articlesArray = this.subCategoryForm.get('articles') as FormArray
    if (articlesArray.length > 1) {
      articlesArray.removeAt(index)
    } else {
      console.warn('At least one article is required')
    }
  }

  /**
   * Delete article with event handling
   */
  deleteArticle(index: number, event: Event): void {
    event.stopPropagation()
    if (this.articlesArray.length > 1) {
      this.removeArticle(index)
    }
  }

  /**
   * Add new tag
   */
  addTag(): void {
    const tagsArray = this.subCategoryForm.get('tags') as FormArray
    tagsArray.push(this.createTagForm())
  }

  /**
   * Remove tag
   */
  removeTag(index: number): void {
    const tagsArray = this.subCategoryForm.get('tags') as FormArray
    if (tagsArray.length > 1) {
      tagsArray.removeAt(index)
    } else {
      // Ensure at least one empty tag remains
      tagsArray.at(index).patchValue({ value: '' })
    }
  }

  /**
   * Handle tag change - ensure at least one empty tag remains
   */
  onTagChange(): void {
    const tagsArray = this.subCategoryForm.get('tags') as FormArray
    const hasEmptyTag = tagsArray.controls.some(control => !control.get('value')?.value)

    if (!hasEmptyTag && tagsArray.length > 0) {
      tagsArray.push(this.createTagForm())
    }
  }

  /**
   * Toggle accordion
   */
  toggleAccordion(index: number): void {
    this.expandedAccordionIndex = this.expandedAccordionIndex === index ? null : index
  }

  /**
   * Save/Publish article with specified status
   * @param status 'DRAFT' for saving as draft, 'PUBLISHED' for publishing
   */
  saveArticle(status: string = 'DRAFT'): void {
    if (!this.subCategoryForm.valid) {
      this.markFormGroupTouched(this.subCategoryForm)
      console.warn('Form is invalid')
      return
    }

    this.isSaving = true

    // Extract tags as string array (filter out empty values)
    const tagsArray = this.tagsArray.value
      .map((tag: any) => tag.value)
      .filter((value: string) => value && value.trim())

    // Build subcategory payload
    const subCategoryPayload = {
      title: this.subCategoryForm.get('title')?.value,
      summary: this.subCategoryForm.get('excerpt')?.value,
      categoryId: this.subCategoryForm.get('category')?.value,
      isPublic: this.subCategoryForm.get('visibility')?.value,
      tags: tagsArray
    }

    // Determine if create or update
    const subCategoryRequest = this.articleId
      ? this.saveExistingSubCategory(subCategoryPayload, status)
      : this.createNewSubCategory(subCategoryPayload, status)

    subCategoryRequest.subscribe(
      (response: any) => {
        const subCategoryId = this.articleId || _.get(response, 'result.subCategoryId', '')

        if (subCategoryId) {
          // Save all articles
          this.saveArticlesData(subCategoryId, status)
        } else {
          this.isSaving = false
          console.error('Failed to get subCategoryId from response')
        }
      },
      (error: any) => {
        this.isSaving = false
        console.error(`Error saving subcategory with status ${status}:`, error)
      }
    )
  }

  /**
   * Create a new subcategory with specified status
   */
  private createNewSubCategory(payload: any, status: string): Observable<any> {
    const createPayload = {
      ...payload,
      type: 'subcategory',
      status: status,
      showUnderDeveloperDocs: true
    }
    return this.developerDocService.createSubCategory(createPayload)
  }

  /**
   * Update existing subcategory with specified status
   * Merge existing data from subCategoryDetails with form values
   */
  private saveExistingSubCategory(payload: any, status: string): Observable<any> {
    // Start with all fields from subCategoryDetails except updatedBy, updatedOn, and articles
    const existingData = { ...this.subCategoryDetails }
    delete existingData.updatedBy
    delete existingData.updatedOn
    delete existingData.articles

    // Merge with form values (form values override existing data)
    const updatePayload = {
      ...existingData,
      ...payload,
      status: status,
      id: this.articleId
    }

    return this.developerDocService.updateSubCategory(updatePayload)
  }

  /**
   * Save articles for the subcategory with specified status
   * For existing articles: merge with original data, update modified fields
   * For new articles: create with form data
   */
  private saveArticlesData(subCategoryId: string, status: string): void {
    const articles = this.articlesArray.value
    const articlePromises: Observable<any>[] = []

    articles.forEach((article: any) => {
      // If article has an ID, it's an existing record
      if (article.articleId) {
        // Find original article from subCategoryDetails
        const originalArticle = this.subCategoryDetails.articles?.find(
          (art: any) => art.articleId === article.articleId
        )

        if (originalArticle) {
          // Keep all fields except updatedBy and updatedOn
          const existingData = { ...originalArticle }
          delete existingData.updatedBy
          delete existingData.updatedOn

          // Merge with form values (form values override existing data)
          const articlePayload = {
            ...existingData,
            title: article.title,
            content: article.content,
            status: status,
            id: article.articleId
          }

          articlePromises.push(
            this.developerDocService.updateArticle(articlePayload)
          )
        }
      } else {
        // New article
        const articlePayload = {
          title: article.title,
          content: article.content,
          subCategoryId: subCategoryId,
          categoryId: this.subCategoryForm.get('category')?.value,
          isPublic: this.subCategoryForm.get('visibility')?.value,
          type: 'article',
          status: status,
          showUnderDeveloperDocs: true
        }

        articlePromises.push(
          this.developerDocService.createArticle(articlePayload)
        )
      }
    })

    if (articlePromises.length > 0) {
      forkJoin(articlePromises).subscribe(
        (responses: any) => {
          if (responses.some((res: any) => !res || res.error)) {
            console.error('Error saving some articles:', responses)
          } else {
            console.log('All articles saved successfully')
          }
          this.isSaving = false
          // Optionally navigate back after successful save
          this.router.navigate(['/app/home/knowledge-center'])
        },
        (error: any) => {
          this.isSaving = false
          console.error('Error saving articles:', error)
        }
      )
    } else {
      this.isSaving = false
    }
  }




  /**
   * Cancel and go back
   */
  cancel(): void {
    this.router.navigate(['/app/home/knowledge-center'])
  }

  /**
   * Mark all fields as touched
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key)
      control?.markAsTouched()

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control)
      }

      if (control instanceof FormArray) {
        control.controls.forEach((item: any) => {
          if (item instanceof FormGroup) {
            this.markFormGroupTouched(item)
          }
        })
      }
    })
  }

  /**
   * Check if form control has error
   */
  hasError(controlName: string, errorType: string): boolean {
    const control = this.subCategoryForm.get(controlName)
    return !!(control && control.hasError(errorType) && (control.dirty || control.touched))
  }

  /**
   * Check if article title has error
   */
  articleHasError(index: number, fieldName: string, errorType: string): boolean {
    const control = this.articlesArray.at(index).get(fieldName)
    return !!(control && control.hasError(errorType) && (control.dirty || control.touched))
  }

  /**
   * Get remaining characters needed for minimum length
   */
  getRemainingCharacters(controlName: string, minLength: number = 0): number {
    const control = this.subCategoryForm.get(controlName)
    const currentLength = control?.value?.length || 0
    const remaining = minLength - currentLength
    return remaining > 0 ? remaining : 0
  }

  /**
   * Get remaining characters needed for article field minimum length
   */
  getArticleRemainingCharacters(index: number, fieldName: string, minLength: number = 0): number {
    const control = this.articlesArray.at(index).get(fieldName)
    const currentLength = control?.value?.length || 0
    const remaining = minLength - currentLength
    return remaining > 0 ? remaining : 0
  }

  /**
   * Get remaining characters needed for tag field minimum length
   */
  getTagRemainingCharacters(index: number, minLength: number = 0): number {
    const control = this.tagsArray.at(index).get('value')
    const currentLength = control?.value?.length || 0
    const remaining = minLength - currentLength
    return remaining > 0 ? remaining : 0
  }

  /**
   * Handle CKEditor content change and update form control
   */
  onCKEditorChange(index: number, content: string): void {
    const control = this.articlesArray.at(index).get('content')
    if (control) {
      control.patchValue(content)
      control.markAsTouched()
      control.markAsDirty()
    }
  }
}
