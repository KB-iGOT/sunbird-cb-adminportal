import { TestBed } from '@angular/core/testing';

import { DeveloperDocService } from './developer-doc.service';

describe('DeveloperDocService', () => {
  let service: DeveloperDocService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DeveloperDocService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
