import { AppRetryInterceptorService } from './app-retry-interceptor.service'
import { HttpRequest, HttpHandler, HttpErrorResponse } from '@angular/common/http'
import { of, throwError } from 'rxjs'

describe('AppRetryInterceptorService', () => {
  let service: AppRetryInterceptorService
  let mockHttpHandler: HttpHandler

  beforeEach(() => {
    service = new AppRetryInterceptorService()
    mockHttpHandler = {
      handle: jest.fn(),
    } as any
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('intercept', () => {
    it('should not retry if body.excludeRetry is true', () => {
      const request = new HttpRequest('GET', '/test', { excludeRetry: true })
      const next = mockHttpHandler

      // Mocking next.handle() to return an observable
      next.handle = jest.fn().mockReturnValue(of({}))

      service.intercept(request, next).subscribe((response) => {
        expect(response).toEqual({})
      })
      expect(next.handle).toHaveBeenCalledWith(request)
    })

    it('should retry on 5xx errors up to maxAttempts', () => {
      const request = new HttpRequest('GET', '/test')
      const next = mockHttpHandler
      const errorResponse = new HttpErrorResponse({
        status: 500,
        statusText: 'Server Error',
      })

      // Mocking next.handle() to throw an error on first request and retry
      next.handle = jest.fn().mockReturnValueOnce(throwError(() => errorResponse)).mockReturnValueOnce(of({}))

      service.intercept(request, next).subscribe((response) => {
        expect(response).toEqual({})
      })

      // Ensure the retry logic is being triggered
      expect(next.handle).toHaveBeenCalledTimes(2) // One initial call + 1 retry
    })

    it('should not retry if error is not 5xx', () => {
      const request = new HttpRequest('GET', '/test')
      const next = mockHttpHandler
      const errorResponse = new HttpErrorResponse({
        status: 400,
        statusText: 'Bad Request',
      })

      next.handle = jest.fn().mockReturnValueOnce(throwError(() => errorResponse))

      service.intercept(request, next).subscribe({
        error: (err) => {
          expect(err).toBe(errorResponse)
        },
      })

      expect(next.handle).toHaveBeenCalledTimes(1) // Only one call since no retry should happen
    })

    it('should retry with increasing delays based on retry attempt', (done) => {
      const request = new HttpRequest('GET', '/test')
      const next = mockHttpHandler
      const errorResponse = new HttpErrorResponse({
        status: 500,
        statusText: 'Server Error',
      })

      // Mocking the first call to throw an error
      next.handle = jest.fn().mockReturnValueOnce(throwError(() => errorResponse)).mockReturnValueOnce(of({}))

      const startTime = Date.now()

      service.intercept(request, next).subscribe({
        next: () => {
          const elapsed = Date.now() - startTime
          // Verify that retry happened with some time delay (roughly around 5000ms * retry count)
          expect(elapsed).toBeGreaterThanOrEqual(5000)
          done()
        },
        error: done.fail,
      })
    })

    it('should stop retrying after max attempts are reached', () => {
      const request = new HttpRequest('GET', '/test')
      const next = mockHttpHandler
      const errorResponse = new HttpErrorResponse({
        status: 500,
        statusText: 'Server Error',
      })

      // Mocking next.handle() to keep throwing an error (simulate no successful retries)
      next.handle = jest.fn().mockReturnValue(throwError(() => errorResponse))

      // Set maxAttempts to 2 for testing
      service['maxAttempts'] = 2

      service.intercept(request, next).subscribe({
        next: () => { },
        error: (err) => {
          expect(err).toEqual(errorResponse)
          expect(next.handle).toHaveBeenCalledTimes(2) // Should retry exactly once (maxAttempts = 2)
        },
      })
    })
  })

  describe('shouldRetry', () => {
    it('should return true for 5xx errors', () => {
      const error = new HttpErrorResponse({
        status: 500,
        statusText: 'Internal Server Error',
      })
      expect(service['shouldRetry'](error)).toBe(true)
    })

    it('should return false for 4xx errors', () => {
      const error = new HttpErrorResponse({
        status: 400,
        statusText: 'Bad Request',
      })
      expect(service['shouldRetry'](error)).toBe(false)
    })

    it('should return false for non-5xx errors', () => {
      const error = new HttpErrorResponse({
        status: 404,
        statusText: 'Not Found',
      })
      expect(service['shouldRetry'](error)).toBe(false)
    })
  })
})
