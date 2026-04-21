import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BulkUploadCoursesComponent } from './bulk-upload-courses.component';

describe('BulkUploadCoursesComponent', () => {
  let component: BulkUploadCoursesComponent;
  let fixture: ComponentFixture<BulkUploadCoursesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BulkUploadCoursesComponent]
    });
    fixture = TestBed.createComponent(BulkUploadCoursesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
