import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { FormBuilder, ReactiveFormsModule } from '@angular/forms'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'

import { BulkUploadCoursesComponent } from './bulk-upload-courses.component'
import { MarketplaceService } from '../../services/marketplace.service'

describe('BulkUploadCoursesComponent', () => {
  let component: BulkUploadCoursesComponent
  let fixture: ComponentFixture<BulkUploadCoursesComponent>
  const pageData = { data: { trasformContentJson: [{ spec: {}, requiredList: [] }] } }

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BulkUploadCoursesComponent],
      imports: [ReactiveFormsModule],
      providers: [
        FormBuilder,
        {
          provide: MarketplaceService,
          useValue: {
            downloadAssetFile: jest.fn().mockReturnValue(of({})),
            updateProvider: jest.fn().mockReturnValue(of({})),
            uploadContent: jest.fn().mockReturnValue(of({})),
          },
        },
        { provide: MatSnackBar, useValue: { open: jest.fn(), openFromComponent: jest.fn() } },
        { provide: MatDialog, useValue: { open: jest.fn().mockReturnValue({ afterClosed: () => of(false), close: jest.fn() }) } },
        { provide: ActivatedRoute, useValue: { data: of({ pageData }), snapshot: { data: { pageData } } } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    fixture = TestBed.createComponent(BulkUploadCoursesComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should read configuration data from route', () => {
    expect(component.providerConfiguration).toEqual(pageData.data)
    expect(component.configurationData).toEqual(pageData.data)
  })

  it('should strip surrounding quotes and whitespace from csv headers', () => {
    expect(component.getHeaderArray(['"name","code",plain ,"in"side"'])).toEqual(['name', 'code', 'plain', 'in"side'])
  })
})
