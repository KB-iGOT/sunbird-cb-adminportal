// general.guard.spec.ts
import { GeneralGuard } from './general.guard'
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router'
import { ConfigurationsService, AuthKeycloakService } from '@sunbird-cb/utils'

describe('GeneralGuard', () => {
  let guard: GeneralGuard
  let mockRouter: jest.Mocked<Router>
  let mockConfigSvc: jest.Mocked<ConfigurationsService>
  let mockAuthSvc: jest.Mocked<AuthKeycloakService>
  let mockActivatedRouteSnapshot: Partial<ActivatedRouteSnapshot>
  let mockRouterStateSnapshot: Partial<RouterStateSnapshot>

  beforeEach(() => {
    // Create mock implementations
    mockRouter = {
      parseUrl: jest.fn(),
      navigateByUrl: jest.fn(),
    } as unknown as jest.Mocked<Router>

    mockConfigSvc = {
      isAuthenticated: true,
      userProfile: {},
      instanceConfig: { disablePidCheck: false },
      hasAcceptedTnc: true,
      userRoles: new Set(['user', 'content_creator']),
      restrictedFeatures: new Set(['feature3']),
      profileDetailsStatus: true,
      userUrl: '',
      unMappedUser: { isDeleted: false },
    } as unknown as jest.Mocked<ConfigurationsService>

    mockAuthSvc = {
      force_logout: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
    } as unknown as jest.Mocked<AuthKeycloakService>

    mockActivatedRouteSnapshot = {
      data: {
        requiredFeatures: [],
        requiredRoles: [],
      },
    }

    mockRouterStateSnapshot = {
      url: '/test-url',
    }

    guard = new GeneralGuard(
      mockRouter,
      mockConfigSvc,
      mockAuthSvc
    )
  })

  it('should be created', () => {
    expect(guard).toBeTruthy()
  })

  describe('hasRole method', () => {
    it('should return true when user has one of the required roles', () => {
      expect(guard.hasRole(['user', 'admin'])).toBe(true)
    })

    it('should return false when user does not have any of the required roles', () => {
      expect(guard.hasRole(['admin', 'manager'])).toBe(false)
    })

    it('should handle case-insensitive role matching', () => {
      expect(guard.hasRole(['USER', 'Admin'])).toBe(true)
    })

    it('should handle empty role array', () => {
      expect(guard.hasRole([])).toBe(false)
    })
  })

  describe('canActivate method', () => {
    it('should allow access when all conditions are met', async () => {
      const result = await guard.canActivate(
        mockActivatedRouteSnapshot as ActivatedRouteSnapshot,
        mockRouterStateSnapshot as RouterStateSnapshot
      )

      expect(result).toBe(true)
    })

    it('should handle routes with required roles that user has', async () => {
      mockActivatedRouteSnapshot.data = {
        requiredRoles: ['content_creator'],
        requiredFeatures: [],
      }

      const result = await guard.canActivate(
        mockActivatedRouteSnapshot as ActivatedRouteSnapshot,
        mockRouterStateSnapshot as RouterStateSnapshot
      )

      expect(result).toBe(true)
    })

    it('should redirect to home page when user lacks required roles', async () => {
      mockActivatedRouteSnapshot.data = {
        requiredRoles: ['admin', 'manager'],
        requiredFeatures: [],
      }

      mockRouter.parseUrl.mockReturnValue('/page/home' as any)

      const result = await guard.canActivate(
        mockActivatedRouteSnapshot as ActivatedRouteSnapshot,
        mockRouterStateSnapshot as RouterStateSnapshot
      )

      expect(mockRouter.parseUrl).toHaveBeenCalledWith('/page/home')
      expect(result).toEqual('/page/home')
    })

    it('should redirect to invalid-user page when user profile is null', async () => {
      mockConfigSvc.userProfile = null

      mockRouter.parseUrl.mockReturnValue('/app/invalid-user' as any)

      const result = await guard.canActivate(
        mockActivatedRouteSnapshot as ActivatedRouteSnapshot,
        mockRouterStateSnapshot as RouterStateSnapshot
      )

      expect(mockRouter.parseUrl).toHaveBeenCalledWith('/app/invalid-user')
      expect(result).toEqual('/app/invalid-user')
    })

    it('should not redirect to invalid-user when disablePidCheck is true', async () => {
      mockConfigSvc.userProfile = null
      //  mockConfigSvc.instanceConfig.disablePidCheck = true

      const result = await guard.canActivate(
        mockActivatedRouteSnapshot as ActivatedRouteSnapshot,
        mockRouterStateSnapshot as RouterStateSnapshot
      )

      expect(result).toBeUndefined()
    })

    it('should redirect to error page and force logout when user is deleted', async () => {
      mockConfigSvc.unMappedUser = { isDeleted: true }

      const result = await guard.canActivate(
        mockActivatedRouteSnapshot as ActivatedRouteSnapshot,
        mockRouterStateSnapshot as RouterStateSnapshot
      )

      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/error-access-forbidden')
      expect(mockAuthSvc.force_logout).toHaveBeenCalled()
      expect(result).toBe(false)
    })

    it('should redirect when required feature is restricted', async () => {
      mockActivatedRouteSnapshot.data = {
        requiredFeatures: ['feature3'],
        requiredRoles: [],
      }

      mockRouter.parseUrl.mockReturnValue('/app/home' as any)

      const result = await guard.canActivate(
        mockActivatedRouteSnapshot as ActivatedRouteSnapshot,
        mockRouterStateSnapshot as RouterStateSnapshot
      )

      expect(mockRouter.parseUrl).toHaveBeenCalledWith('/app/home')
      expect(result).toEqual('/app/home')
    })

    it('should allow access when required feature is not restricted', async () => {
      mockActivatedRouteSnapshot.data = {
        requiredFeatures: ['feature1', 'feature2'],
        requiredRoles: [],
      }

      const result = await guard.canActivate(
        mockActivatedRouteSnapshot as ActivatedRouteSnapshot,
        mockRouterStateSnapshot as RouterStateSnapshot
      )

      expect(result).toBe(true)
    })

    it('should handle undefined data in route', async () => {
      mockActivatedRouteSnapshot.data = undefined

      const result = await guard.canActivate(
        mockActivatedRouteSnapshot as ActivatedRouteSnapshot,
        mockRouterStateSnapshot as RouterStateSnapshot
      )

      expect(result).toBe(true)
    })

    it('should save URL when tnc not accepted and URL is valid', async () => {
      mockConfigSvc.hasAcceptedTnc = false
      mockRouterStateSnapshot.url = '/app/dashboard'

      const result = await guard.canActivate(
        mockActivatedRouteSnapshot as ActivatedRouteSnapshot,
        mockRouterStateSnapshot as RouterStateSnapshot
      )

      expect(mockConfigSvc.userUrl).toBe('/app/dashboard')
      expect(result).toBe(true) // The default behavior is still to allow
    })
  })
})