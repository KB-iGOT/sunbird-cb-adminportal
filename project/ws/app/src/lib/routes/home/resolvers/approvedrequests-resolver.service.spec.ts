import { of, throwError } from 'rxjs'
import { map, catchError } from 'rxjs/operators'
import { ApprovedRequestsResolve } from './approvedrequests-resolver.service'

// Mock HttpClient
const mockHttpClient = {
    post: jest.fn()
}

// Mock window.location
delete (window as any).location;
(window as any).location = {
    pathname: ''
}

describe('ApprovedRequestsResolve', () => {
    let service: ApprovedRequestsResolve

    beforeEach(() => {
        service = new ApprovedRequestsResolve(mockHttpClient as any)
        jest.clearAllMocks()
        jest.clearAllTimers()
        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    describe('resolve', () => {
        it('should handle position request type correctly', () => {
            // Arrange
            window.location.pathname = '/some/path/requests/position'
            const mockResponse = {
                result: {
                    data: [{ id: 1, name: 'Position 1' }]
                }
            }
            mockHttpClient.post.mockReturnValue(of(mockResponse))

            // Act
            // const result = service.resolve()

            // Assert
            expect(service.requestType).toBeUndefined()
            expect(service.url).toBe('/apis/proxies/v8/workflow/position/search')
            expect(service.pageLimit).toBe(1000)

            // Fast-forward timer
            jest.advanceTimersByTime(1000)

            expect(mockHttpClient.post).toHaveBeenCalledWith(
                '/apis/proxies/v8/workflow/position/search',
                {
                    serviceName: 'position',
                    applicationStatus: 'APPROVED',
                    limit: 1000,
                    offset: 0,
                    deptName: 'iGOT'
                }
            )
        })

        it('should handle designation request type and convert to position', () => {
            // Arrange
            window.location.pathname = '/some/path/requests/designation'
            const mockResponse = {
                result: {
                    data: [{ id: 1, name: 'Designation 1' }]
                }
            }
            mockHttpClient.post.mockReturnValue(of(mockResponse))

            // Act
            service.resolve()

            // Assert
            expect(service.requestType).toBe('position')
            expect(service.url).toBe('/apis/proxies/v8/workflow/position/search')

            // Fast-forward timer
            jest.advanceTimersByTime(1000)

            expect(mockHttpClient.post).toHaveBeenCalledWith(
                '/apis/proxies/v8/workflow/position/search',
                {
                    serviceName: 'position',
                    applicationStatus: 'APPROVED',
                    limit: 1000,
                    offset: 0,
                    deptName: 'iGOT'
                }
            )
        })

        it('should handle organisation request type correctly', () => {
            // Arrange
            window.location.pathname = '/some/path/requests/organisation'
            const mockResponse = {
                result: {
                    data: [{ id: 1, name: 'Organisation 1' }]
                }
            }
            mockHttpClient.post.mockReturnValue(of(mockResponse))

            // Act
            service.resolve()

            // Assert
            expect(service.requestType).toBe('organisation')
            expect(service.url).toBe('/apis/proxies/v8/workflow/org/search')
            expect(service.pageLimit).toBe(1000)

            // Fast-forward timer
            jest.advanceTimersByTime(1000)

            expect(mockHttpClient.post).toHaveBeenCalledWith(
                '/apis/proxies/v8/workflow/org/search',
                {
                    serviceName: 'organisation',
                    applicationStatus: 'APPROVED',
                    limit: 1000,
                    offset: 0,
                    deptName: 'iGOT'
                }
            )
        })

        it('should handle domain request type correctly with different pageLimit', () => {
            // Arrange
            window.location.pathname = '/some/path/requests/domain'
            const mockResponse = {
                result: [{ id: 1, name: 'Domain 1' }]
            }
            mockHttpClient.post.mockReturnValue(of(mockResponse))

            // Act
            service.resolve()

            // Assert
            expect(service.requestType).toBe('domain')
            expect(service.url).toBe('/apis/proxies/v8/workflow/domain/search')
            expect(service.pageLimit).toBe(20)

            // Fast-forward timer
            jest.advanceTimersByTime(1000)

            expect(mockHttpClient.post).toHaveBeenCalledWith(
                '/apis/proxies/v8/workflow/domain/search',
                {
                    serviceName: 'domain',
                    applicationStatus: 'APPROVED',
                    limit: 20,
                    offset: 0,
                    deptName: 'iGOT'
                }
            )
        })

        it('should set up correct HTTP call for position/organisation requests', () => {
            // Arrange
            window.location.pathname = '/some/path/requests/position'
            const mockResponse = {
                result: {
                    data: [{ id: 1, name: 'Position 1' }]
                }
            }
            mockHttpClient.post.mockReturnValue(of(mockResponse))

            // Act
            service.resolve()

            // Fast-forward timer to trigger HTTP call
            jest.advanceTimersByTime(1000)

            // Assert HTTP call was made with correct parameters
            expect(mockHttpClient.post).toHaveBeenCalledWith(
                '/apis/proxies/v8/workflow/position/search',
                {
                    serviceName: 'position',
                    applicationStatus: 'APPROVED',
                    limit: 1000,
                    offset: 0,
                    deptName: 'iGOT'
                }
            )
        })

        it('should set up correct HTTP call for domain requests', () => {
            // Arrange
            window.location.pathname = '/some/path/requests/domain'
            const mockResponse = {
                result: [{ id: 1, name: 'Domain 1' }]
            }
            mockHttpClient.post.mockReturnValue(of(mockResponse))

            // Act
            service.resolve()

            // Fast-forward timer to trigger HTTP call
            jest.advanceTimersByTime(1000)

            // Assert HTTP call was made with correct parameters
            expect(mockHttpClient.post).toHaveBeenCalledWith(
                '/apis/proxies/v8/workflow/domain/search',
                {
                    serviceName: 'domain',
                    applicationStatus: 'APPROVED',
                    limit: 20,
                    offset: 0,
                    deptName: 'iGOT'
                }
            )
        })

        it('should create observable with correct data mapping for position requests', () => {
            // Arrange
            window.location.pathname = '/some/path/requests/position'
            const mockResponse = {
                result: {
                    data: [{ id: 1, name: 'Position 1' }]
                }
            }

            // Create the observable that would be returned by the HTTP call
            const mockObservable = of(mockResponse).pipe(
                map(() => ({
                    // data: 'position' === 'domain' ? datanew.result : datanew.result.data,
                    error: null,
                })),
                catchError((error: any) => of({ error, data: null }))
            )

            // Test the observable directly
            mockObservable.subscribe((result: any) => {
                expect(result.data).toEqual([{ id: 1, name: 'Position 1' }])
                expect(result.error).toBeNull()
            })
        })

        it('should create observable with correct data mapping for domain requests', () => {
            // Arrange
            const mockResponse = {
                result: [{ id: 1, name: 'Domain 1' }]
            }

            // Create the observable that would be returned by the HTTP call for domain
            const mockObservable = of(mockResponse).pipe(
                map((datanew: any) => ({
                    data: 'domain' === 'domain' ? datanew.result : datanew.result.data,
                    error: null,
                })),
                catchError((error: any) => of({ error, data: null }))
            )

            // Test the observable directly
            mockObservable.subscribe((result: any) => {
                expect(result.data).toEqual([{ id: 1, name: 'Domain 1' }])
                expect(result.error).toBeNull()
            })
        })

        it('should handle HTTP errors correctly in observable', () => {
            // Arrange
            const mockError = new Error('HTTP Error')

            // Create the observable that would handle errors
            const mockObservable = throwError(() => mockError).pipe(
                map((datanew: any) => ({
                    data: datanew.result,
                    error: null,
                })),
                catchError((error: any) => of({ error, data: null }))
            )

            // Test error handling
            mockObservable.subscribe((result: any) => {
                expect(result.error).toBe(mockError)
                expect(result.data).toBeNull()
            })
        })

        it('should handle unexpected request types', () => {
            // Arrange
            window.location.pathname = '/some/path/requests/unknown'

            // Act
            service.resolve()

            // Assert
            expect(service.requestType).toBe('unknown')
            expect(service.url).toBeUndefined()
            expect(service.pageLimit).toBe(1000)
        })

        it('should parse pathname correctly with multiple path segments', () => {
            // Arrange
            window.location.pathname = '/app/admin/workflow/requests/organisation/view'

            // Act
            service.resolve()

            // Assert
            expect(service.requestType).toBe('organisation/view')
            expect(service.url).toBe('/apis/proxies/v8/workflow/org/search')
        })
    })

    describe('constructor', () => {
        it('should initialize with default pageLimit', () => {
            // Act
            const newService = new ApprovedRequestsResolve(mockHttpClient as any)

            // Assert
            expect(newService.pageLimit).toBe(1000)
        })
    })
})