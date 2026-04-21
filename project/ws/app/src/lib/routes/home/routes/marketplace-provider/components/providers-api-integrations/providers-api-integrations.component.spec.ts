import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProvidersApiIntegrationsComponent } from './providers-api-integrations.component';

describe('ProvidersApiIntegrationsComponent', () => {
  let component: ProvidersApiIntegrationsComponent;
  let fixture: ComponentFixture<ProvidersApiIntegrationsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProvidersApiIntegrationsComponent]
    });
    fixture = TestBed.createComponent(ProvidersApiIntegrationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
