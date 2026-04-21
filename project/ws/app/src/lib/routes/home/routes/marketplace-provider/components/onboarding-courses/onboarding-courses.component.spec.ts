import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OnboardingCoursesComponent } from './onboarding-courses.component';

describe('OnboardingCoursesComponent', () => {
  let component: OnboardingCoursesComponent;
  let fixture: ComponentFixture<OnboardingCoursesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OnboardingCoursesComponent]
    });
    fixture = TestBed.createComponent(OnboardingCoursesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
