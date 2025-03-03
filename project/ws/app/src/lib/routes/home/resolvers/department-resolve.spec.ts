import { DepartmentResolve } from './department-resolve'
import { ProfileV2Service } from '../services/home.servive'
import { Router } from '@angular/router'
import { AuthKeycloakService } from '@sunbird-cb/utils'
import { EMPTY } from 'rxjs'
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router'

describe('DepartmentResolve', () => {
  let resolver: DepartmentResolve
  let profileServiceMock: jest.Mocked<ProfileV2Service>
  let routerMock: jest.Mocked<Router>
  let authServiceMock: jest.Mocked<AuthKeycloakService>
  let routeSnapshotMock: ActivatedRouteSnapshot
  let routerStateSnapshotMock: RouterStateSnapshot

  beforeEach(() => {
    // Create mock objects
    profileServiceMock = {
      checkValidLogin: jest.fn(),
    } as unknown as jest.Mocked<ProfileV2Service>

    routerMock = {
      navigate: jest.fn(),
    } as unknown as jest.Mocked<Router>

    authServiceMock = {
      force_logout: jest.fn(),
    } as unknown as jest.Mocked<AuthKeycloakService>

    routeSnapshotMock = {} as ActivatedRouteSnapshot
    routerStateSnapshotMock = {} as RouterStateSnapshot

    // Initialize the resolver with mocked dependencies
    resolver = new DepartmentResolve(
      profileServiceMock,
      routerMock,
      authServiceMock
    )
  })

  it('should be created', () => {
    expect(resolver).toBeTruthy()
  })

  it('should resolve successfully when profile service returns valid data', async () => {
    // Mock data
    const mockProfileData = {
      result: {
        response: {
          roles: ['SOME_ROLE'],
          rootOrg: { isSpv: true },
        },
      },
    }

    // Mock the profileService.checkValidLogin to return successful data
    // profileServiceMock.checkValidLogin.mockResolvedValue(of(mockProfileData))

    // Call the resolve method
    const result = await resolver.resolve(routeSnapshotMock, routerStateSnapshotMock)

    // Subscribe to the observable returned by resolve
    let resolvedData: any
    result.subscribe(data => {
      resolvedData = data
    })

    // Assertions
    expect(profileServiceMock.checkValidLogin).toHaveBeenCalled()
    expect(resolvedData).toEqual({
      data: mockProfileData,
      error: null,
    })
    expect(routerMock.navigate).not.toHaveBeenCalled()
    expect(authServiceMock.force_logout).not.toHaveBeenCalled()
  })

  it('should navigate to error page and force logout when profile service throws an error', async () => {
    // Mock the profileService.checkValidLogin to throw an error
    // profileServiceMock.checkValidLogin.mockResolvedValue(throwError('Error'))

    // Call the resolve method
    const result = await resolver.resolve(routeSnapshotMock, routerStateSnapshotMock)

    // Subscribe to the observable returned by resolve
    let resolvedData: any
    result.subscribe(data => {
      resolvedData = data
    })

    // Assertions
    expect(profileServiceMock.checkValidLogin).toHaveBeenCalled()
    expect(routerMock.navigate).toHaveBeenCalledWith(['error-access-forbidden'])
    expect(authServiceMock.force_logout).toHaveBeenCalled()
    expect(resolvedData).toBeUndefined() // The observable should complete without emitting
  })

  it('should return EMPTY when error occurs', async () => {
    // Mock the profileService.checkValidLogin to throw an error
    // profileServiceMock.checkValidLogin.mockResolvedValue(throwError('Error'))

    // Call the resolve method
    const result = await resolver.resolve(routeSnapshotMock, routerStateSnapshotMock)

    // Verify that EMPTY is returned
    expect(result).toBe(EMPTY)
  })
})