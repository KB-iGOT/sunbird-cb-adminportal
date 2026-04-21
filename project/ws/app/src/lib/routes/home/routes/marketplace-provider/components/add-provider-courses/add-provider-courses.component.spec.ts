import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddProviderCoursesComponent } from './add-provider-courses.component';

describe('AddProviderCoursesComponent', () => {
  let component: AddProviderCoursesComponent;
  let fixture: ComponentFixture<AddProviderCoursesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddProviderCoursesComponent]
    });
    fixture = TestBed.createComponent(AddProviderCoursesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
