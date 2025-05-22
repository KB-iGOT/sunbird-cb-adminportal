import { of, throwError } from 'rxjs'
import { RejectedRequestsResolve } from './rejectedrequests-reoslver.service'

// Mock HttpClient
const mockHttpClient = {
    post: jest.fn()
}

// Mock window.location
const mockLocation = {
    pathname: ''
}

// Setup global mocks
Object.defineProperty(window, 'location', {
    value: mockLocation,
    writable: true
})

describe('RejectedRequestsResolve', () => {
    let service: RejectedRequestsResolve

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks()
        mockHttpClient.post.mockClear()

        // Create service instance with mocked HttpClient
        service = new RejectedRequestsResolve(mockHttpClient as any)

        // Mock setTimeout to execute immediately
        jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
            callback()
            return {} as any
        })
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    describe('resolve method', () => {
        it('should handle designation request type (converts to position)', () => {
            // Arrange
            mockLocation.pathname = '/some/path/requests/designation'
            const mockResponse = {
                result: {
                    data: [{ id: 1, name: 'test position' }]
                }
            }
            mockHttpClient.post.mockReturnValue(of(mockResponse))

            // Act
            service.resolve()

            // Assert
            expect(service.requestType).toBe('position')
            expect(service.url).toBe('/apis/proxies/v8/workflow/position/search')
            expect(service.pageLimit).toBe(1000)

            expect(mockHttpClient.post).toHaveBeenCalledWith(
                '/apis/proxies/v8/workflow/position/search',
                {
                    serviceName: 'position',
                    applicationStatus: 'REJECTED',
                    limit: 1000,
                    offset: 0,
                    deptName: 'iGOT'
                }
            )
        })

        it('should handle position request type', () => {
            // Arrange
            mockLocation.pathname = '/some/path/requests/position'
            const mockResponse = {
                result: {
                    data: [{ id: 1, name: 'test position' }]
                }
            }
            mockHttpClient.post.mockReturnValue(of(mockResponse))

            // Act
            service.resolve()

            // Assert
            expect(service.requestType).toBe('position')
            expect(service.url).toBe('/apis/proxies/v8/workflow/position/search')
            expect(service.pageLimit).toBe(1000)

            expect(mockHttpClient.post).toHaveBeenCalledWith(
                '/apis/proxies/v8/workflow/position/search',
                {
                    serviceName: 'position',
                    applicationStatus: 'REJECTED',
                    limit: 1000,
                    offset: 0,
                    deptName: 'iGOT'
                }
            )
        })

        it('should handle organisation request type', () => {
            // Arrange
            mockLocation.pathname = '/some/path/requests/organisation'
            const mockResponse = {
                result: {
                    data: [{ id: 1, name: 'test org' }]
                }
            }
            mockHttpClient.post.mockReturnValue(of(mockResponse))

            // Act
            service.resolve()

            // Assert
            expect(service.requestType).toBe('organisation')
            expect(service.url).toBe('/apis/proxies/v8/workflow/org/search')
            expect(service.pageLimit).toBe(1000)

            expect(mockHttpClient.post).toHaveBeenCalledWith(
                '/apis/proxies/v8/workflow/org/search',
                {
                    serviceName: 'organisation',
                    applicationStatus: 'REJECTED',
                    limit: 1000,
                    offset: 0,
                    deptName: 'iGOT'
                }
            )
        })

        it('should handle domain request type with different page limit', () => {
            // Arrange
            mockLocation.pathname = '/some/path/requests/domain'
            const mockResponse = {
                result: [{ id: 1, name: 'test domain' }]
            }
            mockHttpClient.post.mockReturnValue(of(mockResponse))

            // Act
            service.resolve()

            // Assert
            expect(service.requestType).toBe('domain')
            expect(service.url).toBe('/apis/proxies/v8/workflow/domain/search')
            expect(service.pageLimit).toBe(20)

            expect(mockHttpClient.post).toHaveBeenCalledWith(
                '/apis/proxies/v8/workflow/domain/search',
                {
                    serviceName: 'domain',
                    applicationStatus: 'REJECTED',
                    limit: 20,
                    offset: 0,
                    deptName: 'iGOT'
                }
            )
        })

        it('should handle other request types (fallback case)', () => {
            // Arrange
            mockLocation.pathname = '/some/path/requests/unknown'
            const mockResponse = {
                result: {
                    data: [{ id: 1, name: 'test data' }]
                }
            }
            mockHttpClient.post.mockReturnValue(of(mockResponse))

            // Act
            service.resolve()

            // Assert
            expect(service.requestType).toBe('unknown')
            expect(service.url).toBeUndefined()
            expect(service.pageLimit).toBe(1000)

            expect(mockHttpClient.post).toHaveBeenCalledWith(
                undefined,
                {
                    serviceName: 'unknown',
                    applicationStatus: 'REJECTED',
                    limit: 1000,
                    offset: 0,
                    deptName: 'iGOT'
                }
            )
        })

        it('should parse pathname correctly when multiple segments exist', () => {
            // Arrange
            mockLocation.pathname = '/app/admin/requests/position/details'
            const mockResponse = {
                result: {
                    data: [{ id: 1, name: 'test position' }]
                }
            }
            mockHttpClient.post.mockReturnValue(of(mockResponse))

            // Act
            service.resolve()

            // Assert
            expect(service.requestType).toBe('position')
        })

        it('should handle HTTP success response for non-domain request types', (done) => {
            // Arrange
            mockLocation.pathname = '/some/path/requests/position'
            const mockResponse = {
                result: {
                    data: [{ id: 1, name: 'test position' }]
                }
            }


            mockHttpClient.post.mockReturnValue(of(mockResponse))


            // Since the method uses setTimeout, we need to wait
            setTimeout(() => {
                expect(mockHttpClient.post).toHaveBeenCalled()
                done()
            }, 1100)
        })

        it('should handle HTTP success response for domain request type', (done) => {
            // Arrange
            mockLocation.pathname = '/some/path/requests/domain'
            const mockResponse = {
                result: [{ id: 1, name: 'test domain' }]
            }

            mockHttpClient.post.mockReturnValue(of(mockResponse))


            setTimeout(() => {
                expect(mockHttpClient.post).toHaveBeenCalled()
                done()
            }, 1100)
        })

        it('should handle HTTP error response', (done) => {
            // Arrange
            mockLocation.pathname = '/some/path/requests/position'
            const mockError = new Error('HTTP Error')

            mockHttpClient.post.mockReturnValue(throwError(mockError))


            setTimeout(() => {
                expect(mockHttpClient.post).toHaveBeenCalled()
                done()
            }, 1100)
        })

        it('should call setTimeout with 1000ms delay', () => {
            // Arrange
            mockLocation.pathname = '/some/path/requests/position'
            mockHttpClient.post.mockReturnValue(of({}))

            // Act
            service.resolve()

            // Assert
            expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000)
        })

        it('should handle empty pathname gracefully', () => {
            // Arrange
            mockLocation.pathname = ''
            mockHttpClient.post.mockReturnValue(of({}))

            // Act
            service.resolve()

            // Assert
            expect(service.requestType).toBeUndefined()
        })

        it('should handle pathname without requests segment', () => {
            // Arrange
            mockLocation.pathname = '/some/other/path'
            mockHttpClient.post.mockReturnValue(of({}))

            // Act
            service.resolve()

            // Assert
            expect(service.requestType).toBeUndefined()
        })
    })

    describe('constructor', () => {
        it('should initialize with default pageLimit', () => {
            // Assert
            expect(service.pageLimit).toBe(1000)
        })

        it('should store HttpClient reference', () => {
            // Assert
            expect(service['http']).toBe(mockHttpClient)
        })
    })

    describe('property initialization', () => {
        it('should initialize requestType and url as undefined', () => {
            // Assert
            expect(service.requestType).toBeUndefined()
            expect(service.url).toBeUndefined()
        })
    })
})