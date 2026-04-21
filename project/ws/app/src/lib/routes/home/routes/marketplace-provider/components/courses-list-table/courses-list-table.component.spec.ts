import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoursesListTableComponent } from './courses-list-table.component';

describe('CoursesListTableComponent', () => {
  let component: CoursesListTableComponent;
  let fixture: ComponentFixture<CoursesListTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CoursesListTableComponent]
    });
    fixture = TestBed.createComponent(CoursesListTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
