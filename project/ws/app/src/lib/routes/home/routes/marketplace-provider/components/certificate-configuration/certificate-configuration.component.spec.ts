import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificateConfigurationComponent } from './certificate-configuration.component';

describe('CertificateConfigurationComponent', () => {
  let component: CertificateConfigurationComponent;
  let fixture: ComponentFixture<CertificateConfigurationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CertificateConfigurationComponent]
    });
    fixture = TestBed.createComponent(CertificateConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
