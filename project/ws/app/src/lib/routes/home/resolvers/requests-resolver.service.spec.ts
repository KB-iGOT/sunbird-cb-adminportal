import { of, throwError } from 'rxjs'
import { RequestsResolve } from './requests-resolver.service'

describe('RequestsResolve', () => {
    let service: RequestsResolve
    let mockHttpClient: any

    beforeEach(() => {
        // Mock HttpClient
        mockHttpClient = {
            post: jest.fn()
        }

        service = new RequestsResolve(mockHttpClient)

        // Mock window.location
        delete (window as any).location;
        (window as any).location = {
            pathname: '/some/path/requests/position'
        }
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    describe('resolve method', () => {
        it('should set requestType to position when pathname contains position', () => {
            // Arrange
            (window as any).location.pathname = '/some/path/requests/position'

            // Act
            service.resolve()

            // Assert
            expect(service.requestType).toBe('position')
        })

        it('should convert designation to position', () => {
            // Arrange
            (window as any).location.pathname = '/some/path/requests/designation'

            // Act
            service.resolve()

            // Assert
            expect(service.requestType).toBe('position')
        })

        it('should set requestType to organisation when pathname contains organisation', () => {
            // Arrange
            (window as any).location.pathname = '/some/path/requests/organisation'

            // Act
            service.resolve()

            // Assert
            expect(service.requestType).toBe('organisation')
        })

        it('should set requestType to domain when pathname contains domain', () => {
            // Arrange
            (window as any).location.pathname = '/some/path/requests/domain'

            // Act
            service.resolve()

            // Assert
            expect(service.requestType).toBe('domain')
        })

        it('should set correct URL for position request type', () => {
            // Arrange
            (window as any).location.pathname = '/some/path/requests/position'

            // Act
            service.resolve()

            // Assert
            expect(service.url).toBe('/apis/proxies/v8/workflow/position/search')
        })

        it('should set correct URL for organisation request type', () => {
            // Arrange
            (window as any).location.pathname = '/some/path/requests/organisation'

            // Act
            service.resolve()

            // Assert
            expect(service.url).toBe('/apis/proxies/v8/workflow/org/search')
        })

        it('should set correct URL for domain request type', () => {
            // Arrange
            (window as any).location.pathname = '/some/path/requests/domain'

            // Act
            service.resolve()

            // Assert
            expect(service.url).toBe('/apis/proxies/v8/workflow/domain/search')
        })

        it('should set pageLimit to 20 for domain request type', () => {
            // Arrange
            (window as any).location.pathname = '/some/path/requests/domain'

            // Act
            service.resolve()

            // Assert
            expect(service.pageLimit).toBe(20)
        })

        it('should keep pageLimit as 1000 for non-domain request types', () => {
            // Arrange
            (window as any).location.pathname = '/some/path/requests/position'

            // Act
            service.resolve()

            // Assert
            expect(service.pageLimit).toBe(1000)
        })

        it('should call setTimeout', () => {
            // Arrange
            const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
            (window as any).location.pathname = '/some/path/requests/position'

            // Act
            service.resolve()

            // Assert
            expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000)
        })

        it('should handle empty pathname correctly', () => {
            // Arrange
            (window as any).location.pathname = '/some/path/requests/'

            // Act
            service.resolve()

            // Assert
            expect(service.requestType).toBe('')
        })

        it('should handle unknown request type', () => {
            // Arrange
            (window as any).location.pathname = '/some/path/requests/unknown'

            // Act
            service.resolve()

            // Assert
            expect(service.requestType).toBe('unknown')
            expect(service.url).toBeUndefined()
        })

        it('should handle pathname without requests segment', () => {
            // Arrange
            (window as any).location.pathname = '/app/dashboard/position'

            // Act
            service.resolve()

            // Assert
            expect(service.requestType).toBeUndefined()
        })
    })

    describe('HTTP call simulation', () => {
        beforeEach(() => {
            // Mock setTimeout to execute immediately for HTTP testing
            jest.spyOn(global, 'setTimeout').mockImplementation((callback: TimerHandler) => {
                if (typeof callback === 'function') {
                    callback()
                }
                return 1 as any
            })
        })

        it('should make HTTP POST call with correct parameters for position', (done) => {
            // Arrange
            (window as any).location.pathname = '/some/path/requests/position'
            const mockResponse = {
                result: {
                    data: [{ id: 1, name: 'test position' }]
                }
            }
            mockHttpClient.post.mockReturnValue(of(mockResponse))

            // Act
            service.resolve()

            // Assert
            setTimeout(() => {
                expect(mockHttpClient.post).toHaveBeenCalledWith(
                    '/apis/proxies/v8/workflow/position/search',
                    {
                        serviceName: 'position',
                        applicationStatus: 'IN_PROGRESS',
                        limit: 1000,
                        offset: 0,
                        deptName: 'iGOT'
                    }
                )
                done()
            }, 0)
        })

        it('should make HTTP POST call with correct parameters for organisation', (done) => {
            // Arrange
            (window as any).location.pathname = '/some/path/requests/organisation'
            const mockResponse = {
                result: {
                    data: [{ id: 1, name: 'test organisation' }]
                }
            }
            mockHttpClient.post.mockReturnValue(of(mockResponse))

            // Act
            service.resolve()

            // Assert
            setTimeout(() => {
                expect(mockHttpClient.post).toHaveBeenCalledWith(
                    '/apis/proxies/v8/workflow/org/search',
                    {
                        serviceName: 'organisation',
                        applicationStatus: 'IN_PROGRESS',
                        limit: 1000,
                        offset: 0,
                        deptName: 'iGOT'
                    }
                )
                done()
            }, 0)
        })

        it('should make HTTP POST call with correct parameters for domain', (done) => {
            // Arrange
            (window as any).location.pathname = '/some/path/requests/domain'
            const mockResponse = {
                result: [{ id: 1, name: 'test domain' }]
            }
            mockHttpClient.post.mockReturnValue(of(mockResponse))

            // Act
            service.resolve()

            // Assert
            setTimeout(() => {
                expect(mockHttpClient.post).toHaveBeenCalledWith(
                    '/apis/proxies/v8/workflow/domain/search',
                    {
                        serviceName: 'domain',
                        applicationStatus: 'IN_PROGRESS',
                        limit: 20,
                        offset: 0,
                        deptName: 'iGOT'
                    }
                )
                done()
            }, 0)
        })

        it('should handle HTTP errors', (done) => {
            // Arrange
            (window as any).location.pathname = '/some/path/requests/position'
            const mockError = new Error('HTTP Error')
            mockHttpClient.post.mockReturnValue(throwError(mockError))

            // Act
            service.resolve()

            // Assert
            setTimeout(() => {
                expect(mockHttpClient.post).toHaveBeenCalled()
                // The method executes but doesn't return the observable due to setTimeout
                done()
            }, 0)
        })
    })

    describe('constructor', () => {
        it('should inject HttpClient correctly', () => {
            // Act
            const newService = new RequestsResolve(mockHttpClient)

            // Assert
            expect(newService).toBeDefined()
            expect((newService as any).http).toBe(mockHttpClient)
        })
    })

    describe('default values', () => {
        it('should have correct initial pageLimit', () => {
            // Assert
            expect(service.pageLimit).toBe(1000)
        })

        it('should have undefined initial requestType', () => {
            // Assert
            expect(service.requestType).toBeUndefined()
        })

        it('should have undefined initial url', () => {
            // Assert
            expect(service.url).toBeUndefined()
        })
    })

    describe('URL parsing edge cases', () => {
        it('should correctly parse pathname with multiple segments after requests', () => {
            // Arrange
            (window as any).location.pathname = '/app/dashboard/requests/organisation/details'

            // Act
            service.resolve()

            // Assert
            expect(service.requestType).toBe('organisation/details')
        })

        it('should handle pathname with no segments after requests', () => {
            // Arrange
            (window as any).location.pathname = '/app/requests'

            // Act
            service.resolve()

            // Assert
            expect(service.requestType).toBeUndefined()
        })
    })
})