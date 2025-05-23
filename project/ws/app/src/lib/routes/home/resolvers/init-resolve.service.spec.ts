import { InitResolver } from './init-resolve.service'
import { ActivatedRouteSnapshot } from '@angular/router'
describe('InitResolver', () => {
    let resolver: InitResolver
    let mockRoute: ActivatedRouteSnapshot

    beforeEach(() => {
        // Initialize the resolver
        resolver = new InitResolver()

        // Create a mock ActivatedRouteSnapshot
        mockRoute = {
            data: {},
            params: {},
            queryParams: {},
            fragment: null,
            url: [],
            outlet: 'primary',
            component: null,
            routeConfig: null,
            root: {} as ActivatedRouteSnapshot,
            parent: null,
            firstChild: null,
            children: [],
            pathFromRoot: [],
            paramMap: new Map(),
            queryParamMap: new Map()
        } as unknown as ActivatedRouteSnapshot
    })

    describe('constructor', () => {
        it('should create an instance of InitResolver', () => {
            expect(resolver).toBeDefined()
            expect(resolver).toBeInstanceOf(InitResolver)
        })
    })

    describe('resolve', () => {
        it('should return an observable with default forkProcess when no data is provided', (done) => {
            // Arrange
            mockRoute.data = {}

            // Act
            const result$ = resolver.resolve(mockRoute)

            // Assert
            result$.subscribe((result: any) => {
                expect(result).toEqual([undefined])
                done()
            })
        })

        it('should return an observable with default forkProcess when data is null', (done) => {
            // Arrange
            mockRoute.data = null as any

            // Act
            const result$ = resolver.resolve(mockRoute)

            // Assert
            result$.subscribe((result: any) => {
                expect(result).toEqual([undefined])
                done()
            })
        })

        it('should return an observable with default forkProcess when data.load is undefined', (done) => {
            // Arrange
            mockRoute.data = { someOtherProperty: 'value' }

            // Act
            const result$ = resolver.resolve(mockRoute)

            // Assert
            result$.subscribe((result: any) => {
                expect(result).toEqual([undefined])
                done()
            })
        })

        it('should return an observable with default forkProcess when data.load is empty array', (done) => {
            // Arrange
            mockRoute.data = { load: [] }

            // Act
            const result$ = resolver.resolve(mockRoute)

            // Assert
            result$.subscribe((result: any) => {
                expect(result).toEqual([undefined])
                done()
            })
        })

        it('should return an observable with default forkProcess when data.load does not include ckeditor', (done) => {
            // Arrange
            mockRoute.data = { load: ['someOtherModule', 'anotherModule'] }

            // Act
            const result$ = resolver.resolve(mockRoute)

            // Assert
            result$.subscribe((result: any) => {
                expect(result).toEqual([undefined])
                done()
            })
        })

        it('should handle data.load containing ckeditor (commented code branch)', (done) => {
            // Arrange
            mockRoute.data = { load: ['ckeditor'] }

            // Act
            const result$ = resolver.resolve(mockRoute)

            // Assert
            result$.subscribe((result: any) => {
                // Since the ckeditor injection code is commented out,
                // it should still return the default forkProcess
                expect(result).toEqual([undefined])
                done()
            })
        })

        it('should handle data.load containing ckeditor along with other modules', (done) => {
            // Arrange
            mockRoute.data = { load: ['someModule', 'ckeditor', 'anotherModule'] }

            // Act
            const result$ = resolver.resolve(mockRoute)

            // Assert
            result$.subscribe((result: any) => {
                // Since the ckeditor injection code is commented out,
                // it should still return the default forkProcess
                expect(result).toEqual([undefined])
                done()
            })
        })

        it('should return an Observable that completes successfully', (done) => {
            // Arrange
            mockRoute.data = { load: ['test'] }

            // Act
            const result$ = resolver.resolve(mockRoute)

            // Assert
            result$.subscribe({
                next: (result: any) => {
                    expect(result).toBeDefined()
                },
                complete: () => {
                    done()
                },
                error: (error: any) => {
                    fail('Observable should not error: ' + error)
                }
            })
        })

        it('should handle multiple calls to resolve method', () => {
            // Arrange
            const mockRoute1: any = { ...mockRoute, data: { load: ['module1'] } }
            const mockRoute2: any = { ...mockRoute, data: { load: ['ckeditor'] } }

            // Act
            const result1$ = resolver.resolve(mockRoute1)
            const result2$ = resolver.resolve(mockRoute2)

            // Assert
            expect(result1$).toBeDefined()
            expect(result2$).toBeDefined()

            // Both should be independent observables
            expect(result1$).not.toBe(result2$)
        })
    })

    describe('edge cases', () => {
        it('should handle route with undefined data property', (done) => {
            // Arrange
            delete (mockRoute as any).data

            // Act
            const result$ = resolver.resolve(mockRoute)

            // Assert
            result$.subscribe((result: any) => {
                expect(result).toEqual([undefined])
                done()
            })
        })

        it('should handle case-sensitive check for ckeditor', (done) => {
            // Arrange
            mockRoute.data = { load: ['CKEditor', 'CKEDITOR', 'CkEditor'] }

            // Act
            const result$ = resolver.resolve(mockRoute)

            // Assert
            result$.subscribe((result: any) => {
                // Should not match due to case sensitivity
                expect(result).toEqual([undefined])
                done()
            })
        })

        it('should handle data.load with non-string values', (done) => {
            // Arrange
            mockRoute.data = { load: [123, null, undefined, 'ckeditor'] as any }

            // Act
            const result$ = resolver.resolve(mockRoute)

            // Assert
            result$.subscribe((result: any) => {
                // Should still work because includes() can handle mixed types
                expect(result).toEqual([undefined])
                done()
            })
        })
    })
})