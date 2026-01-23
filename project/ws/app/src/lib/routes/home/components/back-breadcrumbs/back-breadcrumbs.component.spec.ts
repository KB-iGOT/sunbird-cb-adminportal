import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackBreadcrumbsComponent } from './back-breadcrumbs.component';

describe('BackBreadcrumbsComponent', () => {
  let component: BackBreadcrumbsComponent;
  let fixture: ComponentFixture<BackBreadcrumbsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BackBreadcrumbsComponent]
    });
    fixture = TestBed.createComponent(BackBreadcrumbsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
