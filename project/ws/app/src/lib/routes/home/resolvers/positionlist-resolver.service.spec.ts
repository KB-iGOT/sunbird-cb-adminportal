import { of, throwError } from 'rxjs'
import { ApprovedlistResolve } from './positionlist-resolver.service'

describe('ApprovedlistResolve', () => {
    let service: ApprovedlistResolve
    let mockHttpClient: any

    beforeEach(() => {
        // Mock HttpClient
        mockHttpClient = {
            get: jest.fn()
        }

        // Create service instance with mocked HttpClient
        service = new ApprovedlistResolve(mockHttpClient)

        // Reset window.location.pathname before each test
        delete (window as any).location;
        (window as any).location = { pathname: '' }
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('resolve()', () => {
        it('should return null when requestType is not "designation"', (done) => {
            // Arrange
            (window as any).location.pathname = '/some/path/requests/other'

            // Act
            const result = service.resolve()

            // Assert
            result.subscribe(data => {
                expect(data).toBeNull()
                expect(mockHttpClient.get).not.toHaveBeenCalled()
                done()
            })
        })

        it('should return null when requestType is undefined', (done) => {
            // Arrange
            (window as any).location.pathname = '/some/path/without/requests'

            // Act
            const result = service.resolve()

            // Assert
            result.subscribe(data => {
                expect(data).toBeNull()
                expect(mockHttpClient.get).not.toHaveBeenCalled()
                done()
            })
        })

        it('should make HTTP request when requestType is "designation"', (done) => {
            // Arrange
            const mockResponse = {
                responseData: [
                    { id: 1, name: 'Position 1' },
                    { id: 2, name: 'Position 2' }
                ]
            };

            (window as any).location.pathname = '/some/path/requests/designation'
            mockHttpClient.get.mockReturnValue(of(mockResponse))

            // Act
            const result = service.resolve()

            // Assert
            result.subscribe(data => {
                expect(mockHttpClient.get).toHaveBeenCalledWith('/apis/proxies/v8/user/v1/positions')
                expect(data).toEqual({
                    data: mockResponse.responseData,
                    error: null
                })
                expect(service.requestType).toBe('designation')
                expect(service.url).toBe('/apis/proxies/v8/user/v1/positions')
                done()
            })
        })

        it('should handle HTTP error and return error object', (done) => {
            // Arrange
            const mockError = new Error('HTTP Error');

            (window as any).location.pathname = '/some/path/requests/designation'
            mockHttpClient.get.mockReturnValue(throwError(mockError))

            // Act
            const result = service.resolve()

            // Assert
            result.subscribe(data => {
                expect(mockHttpClient.get).toHaveBeenCalledWith('/apis/proxies/v8/user/v1/positions')
                expect(data).toEqual({
                    error: mockError,
                    data: null
                })
                done()
            })
        })

        it('should correctly parse requestType from pathname with multiple segments', (done) => {
            // Arrange
            const mockResponse = { responseData: [] };

            (window as any).location.pathname = '/app/main/requests/designation/details'
            mockHttpClient.get.mockReturnValue(of(mockResponse))

            // Act
            const result = service.resolve()

            // Assert
            result.subscribe(() => {
                expect(service.requestType).toBe('designation/details')
                expect(mockHttpClient.get).toHaveBeenCalled()
                done()
            })
        })

        it('should handle empty responseData', (done) => {
            // Arrange
            const mockResponse = { responseData: null };

            (window as any).location.pathname = '/requests/designation'
            mockHttpClient.get.mockReturnValue(of(mockResponse))

            // Act
            const result = service.resolve()

            // Assert
            result.subscribe(data => {
                expect(data).toEqual({
                    data: null,
                    error: null
                })
                done()
            })
        })

        it('should handle case-sensitive requestType comparison', (done) => {
            // Arrange
            (window as any).location.pathname = '/requests/DESIGNATION'

            // Act
            const result = service.resolve()

            // Assert
            result.subscribe(data => {
                expect(data).toBeNull()
                expect(mockHttpClient.get).not.toHaveBeenCalled()
                done()
            })
        })

        it('should handle pathname with trailing slash', (done) => {
            // Arrange
            const mockResponse = { responseData: ['test'] };

            (window as any).location.pathname = '/requests/designation/'
            mockHttpClient.get.mockReturnValue(of(mockResponse))

            // Act
            const result = service.resolve()

            // Assert
            result.subscribe(() => {
                expect(service.requestType).toBe('designation/')
                expect(mockHttpClient.get).toHaveBeenCalled()
                done()
            })
        })
    })

    describe('Service Properties', () => {
        it('should initialize with undefined requestType and url', () => {
            // Assert
            expect(service.requestType).toBeUndefined()
            expect(service.url).toBeUndefined()
        })

        it('should set requestType and url properties when resolve is called with designation', () => {
            // Arrange
            (window as any).location.pathname = '/requests/designation'
            mockHttpClient.get.mockReturnValue(of({ responseData: [] }))

            // Act
            service.resolve().subscribe()

            // Assert
            expect(service.requestType).toBe('designation')
            expect(service.url).toBe('/apis/proxies/v8/user/v1/positions')
        })

        it('should set requestType but not url when requestType is not designation', () => {
            // Arrange
            (window as any).location.pathname = '/requests/other'

            // Act
            service.resolve().subscribe()

            // Assert
            expect(service.requestType).toBe('other')
            expect(service.url).toBeUndefined()
        })
    })
})