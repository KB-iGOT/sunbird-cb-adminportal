import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KnowledgeCenterListComponent } from './knowledge-center-list.component';

describe('KnowledgeCenterListComponent', () => {
  let component: KnowledgeCenterListComponent;
  let fixture: ComponentFixture<KnowledgeCenterListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KnowledgeCenterListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KnowledgeCenterListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
