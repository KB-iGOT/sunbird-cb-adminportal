
import { ProfileV2Service } from '../services/home.servive'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { of, throwError } from 'rxjs'
//import { NSProfileDataV2 } from '../models/profile-v2.model'
import { HomeResolve } from './home-resolve'

describe('HomeResolve', () => {
  let homeResolve: HomeResolve
  let profileV2SvcMock: jest.Mocked<ProfileV2Service>
  let configSvcMock: jest.Mocked<ConfigurationsService>

  beforeEach(() => {
    // Mock ProfileV2Service
    profileV2SvcMock = {
      fetchProfile: jest.fn(),
    } as any

    // Mock ConfigurationsService
    configSvcMock = {
      userProfile: { userId: 'mockUserId' },
    } as any

    homeResolve = new HomeResolve(profileV2SvcMock, configSvcMock)
  })

  it('should resolve profile for "me" path', () => {
    const routeMock = { routeConfig: { path: 'me' }, params: {}, queryParams: {} }
    const stateMock = {} as any
    const profileData: any = { id: 'mockUserId' }

    profileV2SvcMock.fetchProfile.mockReturnValue(of(profileData))

    homeResolve.resolve(routeMock as any, stateMock).subscribe((response) => {
      expect(response.error).toBeNull()
      expect(response.data).toEqual(profileData)
      expect(profileV2SvcMock.fetchProfile).toHaveBeenCalledWith('mockUserId')
    })
  })

  it('should resolve profile for non-"me" path with userId from params', () => {
    const routeMock = { routeConfig: { path: 'somePath' }, params: { userId: 'user123' }, queryParams: {} }
    const stateMock = {} as any
    const profileData: any = { id: 'user123', name: 'Jane Doe' }

    profileV2SvcMock.fetchProfile.mockReturnValue(of(profileData))

    homeResolve.resolve(routeMock as any, stateMock).subscribe((response) => {
      expect(response.error).toBeNull()
      expect(response.data).toEqual(profileData)
      expect(profileV2SvcMock.fetchProfile).toHaveBeenCalledWith('user123')
    })
  })

  it('should resolve profile for non-"me" path with userId from queryParams', () => {
    const routeMock = { routeConfig: { path: 'somePath' }, params: {}, queryParams: { userId: 'user456' } }
    const stateMock = {} as any
    const profileData: any = { id: 'user456', name: 'Bob Smith' }

    profileV2SvcMock.fetchProfile.mockReturnValue(of(profileData))

    homeResolve.resolve(routeMock as any, stateMock).subscribe((response) => {
      expect(response.error).toBeNull()
      expect(response.data).toEqual(profileData)
      expect(profileV2SvcMock.fetchProfile).toHaveBeenCalledWith('user456')
    })
  })

  it('should resolve profile for non-"me" path with userId from configSvc', () => {
    const routeMock = { routeConfig: { path: 'somePath' }, params: {}, queryParams: {} }
    const stateMock = {} as any
    const profileData: any = { id: 'mockUserId', name: 'Alice Wonderland' }

    profileV2SvcMock.fetchProfile.mockReturnValue(of(profileData))

    homeResolve.resolve(routeMock as any, stateMock).subscribe((response) => {
      expect(response.error).toBeNull()
      expect(response.data).toEqual(profileData)
      expect(profileV2SvcMock.fetchProfile).toHaveBeenCalledWith('mockUserId')
    })
  })

  it('should handle error when profile fetching fails', () => {
    const routeMock = { routeConfig: { path: 'somePath' }, params: { userId: 'user789' }, queryParams: {} }
    const stateMock = {} as any
    const errorResponse = { message: 'Error fetching profile' }

    profileV2SvcMock.fetchProfile.mockReturnValue(throwError(() => errorResponse))

    homeResolve.resolve(routeMock as any, stateMock).subscribe((response) => {
      expect(response.error).toEqual(errorResponse)
      expect(response.data).toBeNull()
      expect(profileV2SvcMock.fetchProfile).toHaveBeenCalledWith('user789')
    })
  })
})
