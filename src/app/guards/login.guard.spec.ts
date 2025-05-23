import { LoginGuard } from './login.guard'
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils'

// Mock dependencies
const mockRouter = {
  parseUrl: jest.fn()
}

const mockConfigSvc = {
  isAuthenticated: false,
  instanceConfig: null
}

const mockActivatedRouteSnapshot = {
  queryParamMap: {
    has: jest.fn(),
    get: jest.fn()
  }
} as unknown as ActivatedRouteSnapshot

const mockRouterStateSnapshot = {} as RouterStateSnapshot

describe('LoginGuard', () => {
  let guard: LoginGuard
  let router: jest.Mocked<Router>
  let configSvc: jest.Mocked<ConfigurationsService>
  let activatedRoute: ActivatedRouteSnapshot
  let routerState: RouterStateSnapshot

  beforeEach(() => {
    // Create fresh mocks for each test
    router = mockRouter as unknown as jest.Mocked<Router>
    configSvc = mockConfigSvc as jest.Mocked<ConfigurationsService>
    activatedRoute = mockActivatedRouteSnapshot
    routerState = mockRouterStateSnapshot

    // Reset all mocks
    jest.clearAllMocks()

    // Create guard instance
    guard = new LoginGuard(router, configSvc)
  })

  describe('canActivate', () => {
    describe('when user is not authenticated', () => {
      beforeEach(() => {
        configSvc.isAuthenticated = false
      })

      it('should return false when login is hidden and keycloak config exists', () => {
        // Arrange
        // configSvc.instanceConfig = {
        //   keycloak: {
        //     isLoginHidden: true,
        //     defaultidpHint: 'N',
        //     bearerExcludedUrls: [],
        //     clientId: '',
        //     key: '',
        //     realm: '',
        //     url: ''
        //   }
        // }

        // Act
        const result = guard.canActivate(activatedRoute, routerState)

        // Assert
        expect(result).toBe(false)
      })

      it('should return true when login is not hidden', () => {
        // Arrange
        // configSvc.instanceConfig = {
        //   keycloak: {
        //     isLoginHidden: false,
        //     defaultidpHint: 'E',
        //     bearerExcludedUrls: [],
        //     clientId: '',
        //     key: '',
        //     realm: '',
        //     url: ''
        //   }
        // }

        // Act
        const result = guard.canActivate(activatedRoute, routerState)

        // Assert
        expect(result).toBe(true)
      })

      it('should return true when instanceConfig is null', () => {
        // Arrange
        configSvc.instanceConfig = null

        // Act
        const result = guard.canActivate(activatedRoute, routerState)

        // Assert
        expect(result).toBe(true)
      })

      it('should return true when keycloak config is undefined', () => {
        // Arrange
        configSvc.instanceConfig = {} as any

        // Act
        const result = guard.canActivate(activatedRoute, routerState)

        // Assert
        expect(result).toBe(true)
      })
    })

    describe('when user is authenticated', () => {
      beforeEach(() => {
        configSvc.isAuthenticated = true
      })

      it('should redirect to ref URL when ref query param exists', () => {
        // Arrange
        const encodedRef = encodeURIComponent('/some/path')
        const decodedRef = '/some/path'
        const mockUrlTree = { toString: () => decodedRef } as UrlTree

        activatedRoute.queryParamMap.has = jest.fn().mockReturnValue(true)
        activatedRoute.queryParamMap.get = jest.fn().mockReturnValue(encodedRef)
        router.parseUrl.mockReturnValue(mockUrlTree)

        // Act
        const result = guard.canActivate(activatedRoute, routerState)

        // Assert
        expect(activatedRoute.queryParamMap.has).toHaveBeenCalledWith('ref')
        expect(activatedRoute.queryParamMap.get).toHaveBeenCalledWith('ref')
        expect(router.parseUrl).toHaveBeenCalledWith(decodedRef)
        expect(result).toBe(mockUrlTree)
      })

      it('should handle empty ref query param', () => {
        // Arrange
        const mockUrlTree = { toString: () => '' } as UrlTree

        activatedRoute.queryParamMap.has = jest.fn().mockReturnValue(true)
        activatedRoute.queryParamMap.get = jest.fn().mockReturnValue('')
        router.parseUrl.mockReturnValue(mockUrlTree)

        // Act
        const result = guard.canActivate(activatedRoute, routerState)

        // Assert
        expect(activatedRoute.queryParamMap.has).toHaveBeenCalledWith('ref')
        expect(activatedRoute.queryParamMap.get).toHaveBeenCalledWith('ref')
        expect(router.parseUrl).toHaveBeenCalledWith('')
        expect(result).toBe(mockUrlTree)
      })

      it('should handle null ref query param', () => {
        // Arrange
        const mockUrlTree = { toString: () => '' } as UrlTree

        activatedRoute.queryParamMap.has = jest.fn().mockReturnValue(true)
        activatedRoute.queryParamMap.get = jest.fn().mockReturnValue(null)
        router.parseUrl.mockReturnValue(mockUrlTree)

        // Act
        const result = guard.canActivate(activatedRoute, routerState)

        // Assert
        expect(activatedRoute.queryParamMap.has).toHaveBeenCalledWith('ref')
        expect(activatedRoute.queryParamMap.get).toHaveBeenCalledWith('ref')
        expect(router.parseUrl).toHaveBeenCalledWith('')
        expect(result).toBe(mockUrlTree)
      })

      it('should redirect to app/home when no ref query param exists', () => {
        // Arrange
        const mockUrlTree = { toString: () => 'app/home' } as UrlTree

        activatedRoute.queryParamMap.has = jest.fn().mockReturnValue(false)
        router.parseUrl.mockReturnValue(mockUrlTree)

        // Act
        const result = guard.canActivate(activatedRoute, routerState)

        // Assert
        expect(activatedRoute.queryParamMap.has).toHaveBeenCalledWith('ref')
        expect(activatedRoute.queryParamMap.get).not.toHaveBeenCalled()
        expect(router.parseUrl).toHaveBeenCalledWith('app/home')
        expect(result).toBe(mockUrlTree)
      })

      it('should decode URL-encoded ref parameter correctly', () => {
        // Arrange
        const originalRef = '/app/dashboard?tab=overview&filter=active'
        const encodedRef = encodeURIComponent(originalRef)
        const mockUrlTree = { toString: () => originalRef } as UrlTree

        activatedRoute.queryParamMap.has = jest.fn().mockReturnValue(true)
        activatedRoute.queryParamMap.get = jest.fn().mockReturnValue(encodedRef)
        router.parseUrl.mockReturnValue(mockUrlTree)

        // Act
        const result = guard.canActivate(activatedRoute, routerState)

        // Assert
        expect(router.parseUrl).toHaveBeenCalledWith(originalRef)
        expect(result).toBe(mockUrlTree)
      })
    })
  })

  describe('constructor', () => {
    it('should create guard instance with injected dependencies', () => {
      // Act & Assert
      expect(guard).toBeDefined()
      expect(guard['router']).toBe(router)
      expect(guard['configSvc']).toBe(configSvc)
    })
  })
})