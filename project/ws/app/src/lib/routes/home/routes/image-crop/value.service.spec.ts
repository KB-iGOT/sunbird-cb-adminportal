import { Subject } from 'rxjs'

// Mock @angular/cdk/layout before importing service
jest.mock('@angular/cdk/layout', () => ({
  BreakpointObserver: jest.fn(),
  Breakpoints: {
    XSmall: '(max-width: 599.98px)',
    Small: '(min-width: 600px) and (max-width: 959.98px)',
  },
  BreakpointState: {},
}))

import { ValueService } from './value.service'
import { BreakpointObserver } from '@angular/cdk/layout'

describe('ValueService', () => {
  let service: ValueService
  let breakpointObserver: any
  let xSmallSubject: Subject<{ matches: boolean }>
  let ltMediumSubject: Subject<{ matches: boolean }>

  beforeEach(() => {
    xSmallSubject = new Subject<{ matches: boolean }>()
    ltMediumSubject = new Subject<{ matches: boolean }>()

    let callCount = 0
    breakpointObserver = {
      observe: jest.fn().mockImplementation(() => {
        callCount++
        // First call: XSmall; second call: XSmall + Small
        return callCount === 1 ? xSmallSubject.asObservable() : ltMediumSubject.asObservable()
      }),
    }

    service = new ValueService(breakpointObserver as BreakpointObserver)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should create an instance', () => {
    expect(service).toBeTruthy()
  })

  it('should call breakpointObserver.observe for XSmall', () => {
    expect(breakpointObserver.observe).toHaveBeenCalledWith(['(max-width: 599.98px)'])
  })

  it('should call breakpointObserver.observe for XSmall and Small combined', () => {
    expect(breakpointObserver.observe).toHaveBeenCalledWith([
      '(max-width: 599.98px)',
      '(min-width: 600px) and (max-width: 959.98px)',
    ])
  })

  it('isXSmall$ should emit true when XSmall matches', done => {
    service.isXSmall$.subscribe(value => {
      expect(value).toBe(true)
      done()
    })
    xSmallSubject.next({ matches: true })
  })

  it('isXSmall$ should emit false when XSmall does not match', done => {
    service.isXSmall$.subscribe(value => {
      expect(value).toBe(false)
      done()
    })
    xSmallSubject.next({ matches: false })
  })

  it('isLtMedium$ should emit true when small breakpoint matches', done => {
    service.isLtMedium$.subscribe(value => {
      expect(value).toBe(true)
      done()
    })
    ltMediumSubject.next({ matches: true })
  })

  it('isLtMedium$ should emit false when small breakpoint does not match', done => {
    service.isLtMedium$.subscribe(value => {
      expect(value).toBe(false)
      done()
    })
    ltMediumSubject.next({ matches: false })
  })

  it('isXSmall$ should be an Observable', () => {
    expect(service.isXSmall$).toBeDefined()
    expect(typeof service.isXSmall$.subscribe).toBe('function')
  })

  it('isLtMedium$ should be an Observable', () => {
    expect(service.isLtMedium$).toBeDefined()
    expect(typeof service.isLtMedium$.subscribe).toBe('function')
  })
})
