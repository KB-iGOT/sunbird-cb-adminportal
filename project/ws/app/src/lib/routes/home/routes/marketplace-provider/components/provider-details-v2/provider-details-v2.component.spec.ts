import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProviderDetailsV2Component } from './provider-details-v2.component';

describe('ProviderDetailsV2Component', () => {
  let component: ProviderDetailsV2Component;
  let fixture: ComponentFixture<ProviderDetailsV2Component>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProviderDetailsV2Component]
    });
    fixture = TestBed.createComponent(ProviderDetailsV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
