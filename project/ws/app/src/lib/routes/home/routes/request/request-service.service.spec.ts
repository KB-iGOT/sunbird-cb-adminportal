import { TestBed } from '@angular/core/testing'

import { RequestServiceService } from './request-service.service'

describe('RequestServiceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}))

  it('should be created', () => {
    const service: RequestServiceService = TestBed.inject(RequestServiceService)
    expect(service).toBeTruthy()
  })
})
