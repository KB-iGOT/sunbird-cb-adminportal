import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { FormBuilder } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { MatSnackBar } from '@angular/material/snack-bar'
import { of } from 'rxjs'

import { DeveloperDocCreationComponent } from './developer-doc-creation.component'
import { DeveloperDocService } from '../../services/developer-doc.service'
import { GlobalEventsService } from '../../../../../../../../../../../src/app/services/global-events.service'

describe('DeveloperDocCreationComponent', () => {
  let component: DeveloperDocCreationComponent
  let fixture: ComponentFixture<DeveloperDocCreationComponent>
  let developerDocService: any

  beforeEach(async () => {
    developerDocService = {
      getArticles: jest.fn().mockReturnValue(of({ result: { data: [] } })),
      createSubCategory: jest.fn().mockReturnValue(of({})),
      updateSubCategory: jest.fn().mockReturnValue(of({})),
      createArticle: jest.fn().mockReturnValue(of({})),
      updateArticle: jest.fn().mockReturnValue(of({})),
      deleteArticle: jest.fn().mockReturnValue(of({})),
      publishSubCategory: jest.fn().mockReturnValue(of({})),
      publishArticle: jest.fn().mockReturnValue(of({})),
    }

    await TestBed.configureTestingModule({
      declarations: [DeveloperDocCreationComponent],
      providers: [
        FormBuilder,
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
        { provide: Router, useValue: { navigate: jest.fn() } },
        { provide: DeveloperDocService, useValue: developerDocService },
        { provide: MatSnackBar, useValue: { open: jest.fn(), openFromComponent: jest.fn() } },
        { provide: GlobalEventsService, useValue: { setLoaderState: jest.fn() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    fixture = TestBed.createComponent(DeveloperDocCreationComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should be in create mode when no id query param is present', () => {
    expect(component.mode).toBe('create')
    expect(component.articleId).toBeNull()
    expect(component.subCategoryForm).toBeTruthy()
  })

  describe('stripHtml', () => {
    it('should remove html tags and decode &nbsp;', () => {
      expect(component.stripHtml('<p>Hello&nbsp;<strong>World</strong></p>')).toBe('Hello World')
    })

    it('should collapse whitespace and trim', () => {
      expect(component.stripHtml('<p>  Hello   </p>\n<p> World </p>')).toBe('Hello World')
    })

    it('should return an empty string for empty input', () => {
      expect(component.stripHtml('')).toBe('')
      expect(component.stripHtml(null as any)).toBe('')
    })

    it('should handle a long string of unclosed tags quickly', () => {
      const start = Date.now()
      const input = '<'.repeat(50000)
      expect(component.stripHtml(input)).toBe(input)
      expect(Date.now() - start).toBeLessThan(1000)
    })
  })

  describe('article content', () => {
    it('should validate CKEditor content by its plain-text length', () => {
      component.onCKEditorChange(0, '<p>Short <strong>text</strong></p>')

      const content = component.articlesArray.at(0).get('content')!
      expect(content.touched).toBe(true)
      expect(content.dirty).toBe(true)
      expect(component.articleHasError(0, 'content', 'minlength')).toBe(true)
      expect(component.getArticleContentPlainTextLength(0)).toBe(10)
      expect(component.getArticleRemainingCharacters(0, 'content', 50)).toBe(40)
    })

    it('should treat markup-only content as missing', () => {
      component.onCKEditorChange(0, '<p>&nbsp;</p>')
      expect(component.articleHasError(0, 'content', 'required')).toBe(true)

      component.onCKEditorChange(0, `<p>${'a'.repeat(60)}</p>`)
      expect(component.articlesArray.at(0).get('content')!.valid).toBe(true)
      expect(component.getArticleRemainingCharacters(0, 'content', 50)).toBe(0)
    })
  })

  describe('tags', () => {
    it('should append an empty tag once every tag has a value', () => {
      component.tagsArray.at(0).patchValue({ value: 'angular' })
      component.onTagChange()
      expect(component.tagsArray.length).toBe(2)
      expect(component.tagsArray.at(1).value).toEqual({ value: '' })

      component.onTagChange()
      expect(component.tagsArray.length).toBe(2)
    })

    it('should clear the last remaining tag instead of removing it', () => {
      component.tagsArray.at(0).patchValue({ value: 'angular' })
      component.removeTag(0)
      expect(component.tagsArray.length).toBe(1)
      expect(component.tagsArray.at(0).value).toEqual({ value: '' })
    })
  })
})
