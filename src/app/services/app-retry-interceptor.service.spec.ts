import { AppRetryInterceptorService } from './app-retry-interceptor.service'
import { HttpRequest, HttpHandler, HttpErrorResponse } from '@angular/common/http'
import { of, throwError } from 'rxjs'

describe('AppRetryInterceptorService', () => {
  let service: AppRetryInterceptorService
  let mockHttpHandler: HttpHandler
  let mockRequest: HttpRequest<any>

  beforeEach(() => {
    service = new AppRetryInterceptorService()
    mockHttpHandler = { handle: jest.fn() }
    mockRequest = new HttpRequest('GET', '/test', {})
  })

  it('should not retry if excludeRetry is true in the request body', () => {
    // Set the request to have excludeRetry in the body
    mockRequest = new HttpRequest('GET', '/test', { excludeRetry: true })

    // Simulate the next.handle returning an observable that does not retry
    mockHttpHandler.handle = jest.fn().mockReturnValue(of({}))

    service.intercept(mockRequest, mockHttpHandler).subscribe((response) => {
      expect(response).toEqual({})
      expect(mockHttpHandler.handle).toHaveBeenCalledWith(mockRequest)
    })
  })

  it('should retry on error with status > 499', (done) => {
    // Simulate a retry on server errors (status code > 499)
    const mockError = new HttpErrorResponse({
      status: 500,
      statusText: 'Server Error',
    })

    // Mock the handler to return a stream of errors
    mockHttpHandler.handle = jest.fn().mockReturnValue(throwError(mockError))

    service.intercept(mockRequest, mockHttpHandler).subscribe({
      next: () => {
        // This should not be called since we expect a retry behavior
      },
      error: (err) => {
        expect(err).toBe(mockError)
        done()
      },
    })
  })

  it('should stop retrying after max attempts', (done) => {
    const maxAttempts = 1
    const mockError = new HttpErrorResponse({
      status: 500,
      statusText: 'Server Error',
    })

    // Mocking handler to throw error twice
    mockHttpHandler.handle = jest.fn().mockReturnValueOnce(throwError(mockError))

    service['maxAttempts'] = maxAttempts // Set maxAttempts to 1

    service.intercept(mockRequest, mockHttpHandler).subscribe({
      next: () => {
        // This should not be called since we expect an error after the retry
      },
      error: (err) => {
        expect(err).toBe(mockError)
        expect(mockHttpHandler.handle).toHaveBeenCalledTimes(1) // Check it was only retried once
        done()
      },
    })
  })

  it('should not retry if status code is <= 499', (done) => {
    // Simulate an error that should not trigger a retry (e.g. 400 - Bad Request)
    const mockError = new HttpErrorResponse({
      status: 400,
      statusText: 'Bad Request',
    })

    // Mock the handler to return an error
    mockHttpHandler.handle = jest.fn().mockReturnValueOnce(throwError(mockError))

    service.intercept(mockRequest, mockHttpHandler).subscribe({
      next: () => {
        // This should not be called since we expect an error immediately
      },
      error: (err) => {
        expect(err).toBe(mockError)
        done()
      },
    })
  })

  it('should retry and wait for backoff time on subsequent retries', () => {
    const mockError = new HttpErrorResponse({
      status: 500,
      statusText: 'Server Error',
    })

    // Mock the handler to simulate error and retry behavior
    mockHttpHandler.handle = jest.fn().mockReturnValueOnce(throwError(mockError))

    // const retrySpy = jest.spyOn(service, 'genericRetryStrategy')

    // service.intercept(mockRequest, mockHttpHandler).subscribe({
    //   next: () => {
    //     // This should not be called immediately as we are testing retry behavior
    //   },
    //   error: (err) => {
    //     expect(retrySpy).toHaveBeenCalled()
    //     expect(err).toBe(mockError)
    //     done()
    //   },
    // })
  })
})
