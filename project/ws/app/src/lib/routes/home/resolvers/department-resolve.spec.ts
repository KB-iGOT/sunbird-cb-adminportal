import { DepartmentResolve } from './department-resolve'
import { ProfileV2Service } from '../services/home.servive'
import { Router } from '@angular/router'
import { AuthKeycloakService } from '@sunbird-cb/utils-v2'
import { of, throwError } from 'rxjs'
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router'

describe('DepartmentResolve', () => {
  let resolver: DepartmentResolve
  let profileServiceMock: Partial<ProfileV2Service>
  let routerMock: Partial<Router>
  let authServiceMock: Partial<AuthKeycloakService>

  beforeEach(() => {
    profileServiceMock = {
      checkValidLogin: jest.fn(),
    }
    routerMock = {
      navigate: jest.fn(),
    }
    authServiceMock = {
      force_logout: jest.fn(),
    }

    resolver = new DepartmentResolve(
      profileServiceMock as ProfileV2Service,
      routerMock as Router,
      authServiceMock as AuthKeycloakService
    )
    jest.clearAllMocks()
  })

  it('should be created', () => {
    expect(resolver).toBeTruthy()
  })

  it('should resolve and return mapped data when profile service succeeds', async () => {
    const mockProfileData = { userId: 'abc', name: 'Test User' }
      ; (profileServiceMock.checkValidLogin as jest.Mock).mockReturnValue(of(mockProfileData))

    const result = await resolver.resolve({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)

    let resolvedData: any
    result.subscribe((data: any) => { resolvedData = data })

    expect(profileServiceMock.checkValidLogin).toHaveBeenCalled()
    expect(resolvedData).toEqual({ data: mockProfileData, error: null })
    expect(routerMock.navigate).not.toHaveBeenCalled()
    expect(authServiceMock.force_logout).not.toHaveBeenCalled()
  })

  it('should navigate to error page and force logout when profile service throws an error', async () => {
    ; (profileServiceMock.checkValidLogin as jest.Mock).mockReturnValue(throwError(() => new Error('Unauthorized')))

    const result = await resolver.resolve({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)

    let emitted = false
    result.subscribe({ next: () => { emitted = true }, complete: () => { } })

    expect(profileServiceMock.checkValidLogin).toHaveBeenCalled()
    expect(routerMock.navigate).toHaveBeenCalledWith(['error-access-forbidden'])
    expect(authServiceMock.force_logout).toHaveBeenCalled()
    expect(emitted).toBe(false) // EMPTY never emits
  })
})