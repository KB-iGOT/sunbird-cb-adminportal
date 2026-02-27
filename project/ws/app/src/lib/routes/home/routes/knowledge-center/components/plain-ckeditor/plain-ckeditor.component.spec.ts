import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlainCkeditorComponent } from './plain-ckeditor.component';

describe('PlainCkeditorComponent', () => {
  let component: PlainCkeditorComponent;
  let fixture: ComponentFixture<PlainCkeditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlainCkeditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlainCkeditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
