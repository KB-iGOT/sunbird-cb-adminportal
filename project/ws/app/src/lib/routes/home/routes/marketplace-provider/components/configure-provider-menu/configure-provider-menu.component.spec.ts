import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigureProviderMenuComponent } from './configure-provider-menu.component';

describe('ConfigureProviderMenuComponent', () => {
  let component: ConfigureProviderMenuComponent;
  let fixture: ComponentFixture<ConfigureProviderMenuComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConfigureProviderMenuComponent]
    });
    fixture = TestBed.createComponent(ConfigureProviderMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
