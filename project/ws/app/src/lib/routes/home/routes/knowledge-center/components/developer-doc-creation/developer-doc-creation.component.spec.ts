import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeveloperDocCreationComponent } from './developer-doc-creation.component';

describe('DeveloperDocCreationComponent', () => {
  let component: DeveloperDocCreationComponent;
  let fixture: ComponentFixture<DeveloperDocCreationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeveloperDocCreationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeveloperDocCreationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
