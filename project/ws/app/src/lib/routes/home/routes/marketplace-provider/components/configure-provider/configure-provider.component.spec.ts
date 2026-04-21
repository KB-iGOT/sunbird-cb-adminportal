import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigureProviderComponent } from './configure-provider.component';

describe('ConfigureProviderComponent', () => {
  let component: ConfigureProviderComponent;
  let fixture: ComponentFixture<ConfigureProviderComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConfigureProviderComponent]
    });
    fixture = TestBed.createComponent(ConfigureProviderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
