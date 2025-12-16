import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SsoIntegrationComponent } from './sso-integration.component';

describe('SsoIntegrationComponent', () => {
  let component: SsoIntegrationComponent;
  let fixture: ComponentFixture<SsoIntegrationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SsoIntegrationComponent]
    });
    fixture = TestBed.createComponent(SsoIntegrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
