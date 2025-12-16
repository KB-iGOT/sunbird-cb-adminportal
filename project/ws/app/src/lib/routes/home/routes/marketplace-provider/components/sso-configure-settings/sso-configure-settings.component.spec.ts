import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SsoConfigureSettingsComponent } from './sso-configure-settings.component';

describe('SsoConfigureSettingsComponent', () => {
  let component: SsoConfigureSettingsComponent;
  let fixture: ComponentFixture<SsoConfigureSettingsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SsoConfigureSettingsComponent]
    });
    fixture = TestBed.createComponent(SsoConfigureSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
