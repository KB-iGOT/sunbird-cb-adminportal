import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestCopyDetailsV2Component } from './request-copy-details-v2.component';

describe('RequestCopyDetailsV2Component', () => {
  let component: RequestCopyDetailsV2Component;
  let fixture: ComponentFixture<RequestCopyDetailsV2Component>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RequestCopyDetailsV2Component]
    });
    fixture = TestBed.createComponent(RequestCopyDetailsV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
