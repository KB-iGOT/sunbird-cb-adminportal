import { Component, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms'
import { DeveloperDocService } from '../../services/developer-doc.service'

interface Article {
  id?: string
  title?: string
  summary?: string
  category?: string
  status?: string
  type?: string
  createdBy?: string
  updatedBy?: string
  createdOn?: string
  updatedOn?: string
  [key: string]: any
}

@Component({
  selector: 'ws-app-developer-doc-creation',
  templateUrl: './developer-doc-creation.component.html',
  styleUrl: './developer-doc-creation.component.scss',
  standalone: false,
})
export class DeveloperDocCreationComponent implements OnInit {
  // Form and properties
  subCategoryForm!: FormGroup
  article: Article = {}
  articleId: string | null = null
  mode: 'create' | 'edit' | 'view' = 'create'

  // UI properties
  isLoading: boolean = false
  isSaving: boolean = false
  expandedAccordionIndex: number | null = null
  headerText: string = 'Create Article'
  actionButtonText: string = 'Save'

  // Dropdown options
  visibilityOptions = [
    { value: 'public', label: 'Public' },
    { value: 'private', label: 'Private' },
    { value: 'internal', label: 'Internal' },
  ]

  statusOptions = [
    { value: 'DRAFT', label: 'Draft' },
    { value: 'PUBLISHED', label: 'Published' },
    { value: 'ARCHIVED', label: 'Archived' },
  ]

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
  }

  /**
   * Initialize form structure
   */
  private initializeForm(): void {
    this.subCategoryForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      excerpt: ['', [Validators.required, Validators.minLength(10)]],
      visibility: ['public', Validators.required],
      status: ['DRAFT', Validators.required],
      articles: this.fb.array([this.createArticleForm()], Validators.minLength(1))
    })
  }

  /**
   * Create article form group
   */
  private createArticleForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      content: ['', [Validators.required, Validators.minLength(20)]]
    })
  }

  /**
   * Get articles form array
   */
  get articlesArray(): FormArray {
    return this.subCategoryForm.get('articles') as FormArray
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
        this.article = {}
        // Form is already initialized with defaults
      }

      // Update header and button text based on mode
      this.updateUIText()
    })
  }

  /**
   * Update header and action button text based on mode
   */
  private updateUIText(): void {
    switch (this.mode) {
      case 'create':
        this.headerText = 'Create Article'
        this.actionButtonText = 'Save'
        break
      case 'edit':
        this.headerText = 'Edit Article'
        this.actionButtonText = 'Update'
        break
      case 'view':
        this.headerText = 'View Article'
        this.actionButtonText = 'Edit'
        break
    }
  }

  /**
   * Load article data from service
   */
  private loadArticle(id: string): void {
    this.isLoading = true

    const formBody = {
      filterCriteriaMap: {
        id: id
      },
      requestedFields: [],
      pageNumber: 0,
      pageSize: 1,
    }

    this.developerDocService.getArticles(formBody).subscribe(
      (response: any) => {
        if (response && response.data && response.data.length > 0) {
          const item = response.data[0]
          this.article = {
            id: item.id,
            title: item.title,
            summary: item.summary,
            category: item.type,
            status: item.status,
            type: item.type,
            createdBy: item.createdBy,
            updatedBy: item.updatedBy,
            createdOn: item.createdOn,
            updatedOn: item.updatedOn,
          }
          this.populateForm(this.article)
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

  /**
   * Populate form with article data
   */
  private populateForm(article: Article): void {
    this.subCategoryForm.patchValue({
      title: article.title || '',
      excerpt: article.summary || '',
      visibility: 'public',
      status: article.status || 'DRAFT',
    })

    // Reset articles array and add mock data for now
    // TODO: Update this when API provides articles data
    const articlesArray = this.subCategoryForm.get('articles') as FormArray
    articlesArray.clear()
    articlesArray.push(this.createArticleForm())
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
   * Toggle accordion
   */
  toggleAccordion(index: number): void {
    this.expandedAccordionIndex = this.expandedAccordionIndex === index ? null : index
  }

  /**
   * Handle action button click based on mode
   */
  handleAction(): void {
    switch (this.mode) {
      case 'create':
        this.saveArticle()
        break
      case 'edit':
        this.updateArticle()
        break
      case 'view':
        this.enableEditMode()
        break
    }
  }

  /**
   * Save article (create mode)
   */
  private saveArticle(): void {
    if (this.subCategoryForm.invalid) {
      console.warn('Form is invalid')
      this.markFormGroupTouched(this.subCategoryForm)
      return
    }

    this.isSaving = true
    const formValue = this.subCategoryForm.value

    this.developerDocService.createArticle(formValue).subscribe(
      (response: any) => {
        console.log('Article created successfully', response)
        this.isSaving = false
        this.router.navigate(['/app/home/knowledge-center'])
      },
      (error: any) => {
        console.error('Error creating article:', error)
        this.isSaving = false
      }
    )
  }

  /**
   * Update article (edit mode)
   */
  private updateArticle(): void {
    if (this.subCategoryForm.invalid) {
      console.warn('Form is invalid')
      this.markFormGroupTouched(this.subCategoryForm)
      return
    }

    this.isSaving = true
    const formValue = this.subCategoryForm.value

    this.developerDocService.updateArticle(formValue).subscribe(
      (response: any) => {
        console.log('Article updated successfully', response)
        this.isSaving = false
        this.router.navigate(['/app/home/knowledge-center'])
      },
      (error: any) => {
        console.error('Error updating article:', error)
        this.isSaving = false
      }
    )
  }

  /**
   * Enable edit mode (from view mode)
   */
  private enableEditMode(): void {
    this.mode = 'edit'
    this.updateUIText()
    // Enable form controls
    Object.keys(this.subCategoryForm.controls).forEach(key => {
      this.subCategoryForm.get(key)?.enable()
    })
    this.articlesArray.controls.forEach((control: any) => {
      control.enable()
    })
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
}
