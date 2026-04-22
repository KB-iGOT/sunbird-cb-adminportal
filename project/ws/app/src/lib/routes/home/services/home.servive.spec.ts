import { HttpClient } from '@angular/common/http'
import { of } from 'rxjs'
import { ProfileV2Service } from './home.servive'

describe('ProfileV2Service', () => {
  let service: ProfileV2Service
  let mockHttp: jest.Mocked<Partial<HttpClient>>

  beforeEach(() => {
    mockHttp = {
      get: jest.fn(),
      post: jest.fn(),
    }
    service = new ProfileV2Service(mockHttp as HttpClient)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should create an instance of the service', () => {
    expect(service).toBeTruthy()
  })

  describe('fetchDiscussProfile', () => {
    it('should call GET with correct URL for given wid', () => {
      const mockResponse = { id: 'user-1', username: 'testuser' }
        ; (mockHttp.get as jest.Mock).mockReturnValue(of(mockResponse))

      service.fetchDiscussProfile('user-1').subscribe(result => {
        expect(result).toEqual(mockResponse)
      })

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/apis/protected/v8/discussionHub/users/user-1'
      )
    })
  })

  describe('fetchProfile', () => {
    it('should call GET with correct URL for given userId', () => {
      const mockProfile = { id: 'user-2', name: 'Test User' }
        ; (mockHttp.get as jest.Mock).mockReturnValue(of(mockProfile))

      service.fetchProfile('user-2').subscribe(result => {
        expect(result).toEqual(mockProfile)
      })

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/apis/protected/v8/user/profileDetails/getUserRegistryById/user-2'
      )
    })
  })

  describe('fetchPost', () => {
    it('should call POST with correct URL and request body', () => {
      const request = { postId: 'post-1' }
      const mockResponse = { data: 'some data' }
        ; (mockHttp.post as jest.Mock).mockReturnValue(of(mockResponse))

      service.fetchPost(request).subscribe(result => {
        expect(result).toEqual(mockResponse)
      })

      expect(mockHttp.post).toHaveBeenCalledWith(
        '/apis/protected/v8/social/post/viewConversation',
        request
      )
    })
  })

  describe('getMyDepartment', () => {
    it('should call GET with correct URL', () => {
      const mockDept = { name: 'Engineering' }
        ; (mockHttp.get as jest.Mock).mockReturnValue(of(mockDept))

      service.getMyDepartment().subscribe(result => {
        expect(result).toEqual(mockDept)
      })

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/apis/protected/v8/portal/spv/mydepartment?allUsers=true'
      )
    })
  })

  describe('getAllDepartment', () => {
    it('should call GET with correct URL', () => {
      const mockDepts = [{ name: 'HR' }, { name: 'Engineering' }]
        ; (mockHttp.get as jest.Mock).mockReturnValue(of(mockDepts))

      service.getAllDepartment().subscribe(result => {
        expect(result).toEqual(mockDepts)
      })

      expect(mockHttp.get).toHaveBeenCalledWith('/apis/proxies/v8/org/v1/search')
    })
  })

  describe('checkValidLogin', () => {
    it('should call GET with correct URL', () => {
      const mockResponse = { userId: 'user-1' }
        ; (mockHttp.get as jest.Mock).mockReturnValue(of(mockResponse))

      service.checkValidLogin().subscribe(result => {
        expect(result).toEqual(mockResponse)
      })

      expect(mockHttp.get).toHaveBeenCalledWith('/apis/proxies/v8/api/user/v2/read')
    })
  })
})
