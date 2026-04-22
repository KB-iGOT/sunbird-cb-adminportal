import { ProfileV2UtillService } from './home-utill.service'
import { of, throwError } from 'rxjs'

describe('ProfileV2UtillService', () => {
  let service: ProfileV2UtillService
  let mockHttp: any

  beforeEach(() => {
    mockHttp = {
      get: jest.fn(),
      post: jest.fn(),
    }
    service = new ProfileV2UtillService(mockHttp)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('fetchBadges', () => {
    it('should call http.get with correct URL', () => {
      const wid = 'user-123'
      const mockResponse = { canEarn: [], earned: [], recent: [] }
      mockHttp.get.mockReturnValue(of(mockResponse))

      service.fetchBadges(wid).subscribe(res => {
        expect(res).toEqual(mockResponse)
      })

      expect(mockHttp.get).toHaveBeenCalledWith(
        `/apis/protected/v8/user/badge/for/${wid}`
      )
    })

    it('should propagate errors from http.get', () => {
      const wid = 'user-456'
      mockHttp.get.mockReturnValue(throwError('HTTP Error'))

      service.fetchBadges(wid).subscribe({
        next: () => fail('should have errored'),
        error: (err: any) => expect(err).toBe('HTTP Error'),
      })
    })
  })

  describe('reCalculateBadges', () => {
    it('should call http.post with correct URL and empty body', () => {
      const mockResponse = { result: 'success' }
      mockHttp.post.mockReturnValue(of(mockResponse))

      service.reCalculateBadges().subscribe(res => {
        expect(res).toEqual(mockResponse)
      })

      expect(mockHttp.post).toHaveBeenCalledWith(
        '/apis/protected/v8/user/badge/update',
        {}
      )
    })

    it('should propagate errors from http.post', () => {
      mockHttp.post.mockReturnValue(throwError('Post Error'))

      service.reCalculateBadges().subscribe({
        next: () => fail('should have errored'),
        error: (err: any) => expect(err).toBe('Post Error'),
      })
    })
  })

  describe('fetchRecentBadge', () => {
    it('should call http.get with badge notification URL', () => {
      const mockNotification = { recent_badge: { badge_name: 'Test Badge' }, totalPoints: [] }
      mockHttp.get.mockReturnValue(of(mockNotification))

      service.fetchRecentBadge().subscribe(res => {
        expect(res).toEqual(mockNotification)
      })

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/apis/protected/v8/user/badge/notification'
      )
    })

    it('should return the mapped notification response', () => {
      const mockData = { data: 'badge-data' }
      mockHttp.get.mockReturnValue(of(mockData))

      service.fetchRecentBadge().subscribe(result => {
        expect(result).toEqual(mockData)
      })
    })

    it('should propagate errors from http.get', () => {
      mockHttp.get.mockReturnValue(throwError('Get Error'))

      service.fetchRecentBadge().subscribe({
        next: () => fail('should have errored'),
        error: (err: any) => expect(err).toBe('Get Error'),
      })
    })
  })

  describe('emailTransform', () => {
    it('should replace dots with [dot] and @ with [at]', () => {
      const result = service.emailTransform('john.doe@example.com')
      expect(result).toBe('john[dot]doe[at]example[dot]com')
    })

    it('should handle email with multiple dots', () => {
      const result = service.emailTransform('a.b.c@x.y')
      expect(result).toBe('a[dot]b[dot]c[at]x[dot]y')
    })

    it('should return undefined when value is undefined', () => {
      const result = service.emailTransform(undefined as any)
      expect(result).toBeUndefined()
    })

    it('should handle email with no dots before @', () => {
      const result = service.emailTransform('user@domain.com')
      expect(result).toBe('user[at]domain[dot]com')
    })

    it('should handle simple email', () => {
      const result = service.emailTransform('test@test.org')
      expect(result).toBe('test[at]test[dot]org')
    })
  })
})
