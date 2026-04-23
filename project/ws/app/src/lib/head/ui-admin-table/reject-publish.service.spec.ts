import { of } from 'rxjs'
import { RejectPublishService } from './reject-publish.service'

describe('RejectPublishService', () => {
  let service: RejectPublishService

  const http: any = {
    post: jest.fn(),
    get: jest.fn(),
  }

  beforeEach(() => {
    service = new RejectPublishService(http)
    jest.clearAllMocks()
  })

  it('should create an instance', () => {
    expect(service).toBeTruthy()
  })

  it('should call publishData with correct endpoint and data', (done) => {
    const data = { feedback: 'test content', type: 'text' }
    http.post.mockReturnValue(of({ success: true }))

    service.publishData(data).subscribe(res => {
      expect(res).toEqual({ success: true })
      done()
    })

    expect(http.post).toHaveBeenCalledWith(
      '/moderatoradmin/feedback/persist/text/moderated',
      data
    )
  })

  it('should call getCategories with correct endpoint', (done) => {
    http.get.mockReturnValue(of(['profanity', 'spam']))

    service.getCategories().subscribe(res => {
      expect(res).toEqual(['profanity', 'spam'])
      done()
    })

    expect(http.get).toHaveBeenCalledWith('/moderatoradmin/profanity/type/text')
  })

  it('should return observable from publishData', () => {
    http.post.mockReturnValue(of({}))
    const result = service.publishData({})
    expect(result).toBeDefined()
    expect(typeof result.subscribe).toBe('function')
  })

  it('should return observable from getCategories', () => {
    http.get.mockReturnValue(of([]))
    const result = service.getCategories()
    expect(result).toBeDefined()
    expect(typeof result.subscribe).toBe('function')
  })
})
