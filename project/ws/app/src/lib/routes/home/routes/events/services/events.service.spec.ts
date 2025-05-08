import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { EventsService } from './events.service'
import { environment } from '..//../../../../../../../../../src/environments/environment'

describe('EventsService', () => {
  let service: EventsService
  let httpMock: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EventsService]
    })
    service = TestBed.inject(EventsService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify() // Ensure no outstanding requests
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should create an asset', () => {
    const mockReq = { name: 'test asset' }
    const mockResponse = { id: '123', status: 'success' }

    service.crreateAsset(mockReq).subscribe(response => {
      expect(response).toEqual(mockResponse)
    })

    const req = httpMock.expectOne('/apis/proxies/v8/action/content/v3/create')
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual(mockReq)
    req.flush(mockResponse)
  })

  it('should upload a file', () => {
    const mockVal = 'file123'
    const mockFormData = new FormData()
    const mockResponse = { id: '123', status: 'success' }

    service.uploadFile(mockVal, mockFormData).subscribe(response => {
      expect(response).toEqual(mockResponse)
    })

    // Note: The service has two HTTP requests but only returns the second one
    // First request is ignored in test since it doesn't affect the observable chain
    const req = httpMock.expectOne(`/apis/proxies/v8/upload/action/content/v3/upload/${mockVal}`)
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual(mockFormData)
    req.flush(mockResponse)
  })

  it('should create an event', () => {
    const mockReq = { title: 'New Event' }
    const mockResponse = { id: 'event123', status: 'created' }

    service.createEvent(mockReq).subscribe(response => {
      expect(response).toEqual(mockResponse)
    })

    const req = httpMock.expectOne('/apis/proxies/v8/event/v4/create')
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual(mockReq)
    req.flush(mockResponse)
  })

  it('should update an event', () => {
    const eventId = 'event123'
    const mockReq = { title: 'Updated Event' }
    const mockResponse = { id: eventId, status: 'updated' }

    service.updateEvent(eventId, mockReq).subscribe(response => {
      expect(response).toEqual(mockResponse)
    })

    const req = httpMock.expectOne(`/apis/proxies/v8/event/v4/update/${eventId}`)
    expect(req.request.method).toBe('PATCH')
    expect(req.request.body).toEqual(mockReq)
    req.flush(mockResponse)
  })

  it('should publish an event', () => {
    const eventId = 'event123'
    const mockReq = { status: 'Live' }
    const mockResponse = { id: eventId, status: 'published' }

    service.publishEvent(eventId, mockReq).subscribe(response => {
      expect(response).toEqual(mockResponse)
    })

    const req = httpMock.expectOne(`/apis/proxies/v8/event/v4/publish/${eventId}`)
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual(mockReq)
    req.flush(mockResponse)
  })

  it('should search events', () => {
    const mockReq = { query: 'workshop' }
    const mockResponse = { events: [{ id: '123', title: 'Workshop' }] }

    service.searchEvent(mockReq).subscribe(response => {
      expect(response).toEqual(mockResponse)
    })

    const req = httpMock.expectOne('/apis/proxies/v8/sunbirdigot/read')
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual(mockReq)
    req.flush(mockResponse)
  })

  it('should get events list with cache control headers', () => {
    const mockReq = { filters: {} }
    const mockResponse = { events: [{ id: '123', title: 'Event 1' }] }

    service.getEventsList(mockReq).subscribe(response => {
      expect(response).toEqual(mockResponse)
    })

    const req = httpMock.expectOne('/apis/proxies/v8/sunbirdigot/search')
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual(mockReq)
    expect(req.request.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate, post-check=0, pre-check=0')
    expect(req.request.headers.get('Pragma')).toBe('no-cache')
    expect(req.request.headers.get('Expires')).toBe('0')
    req.flush(mockResponse)
  })

  it('should get participants', () => {
    const mockResponse = { users: [{ id: 'user1', name: 'John Doe' }] }

    service.getParticipants().subscribe(response => {
      expect(response).toEqual(mockResponse)
    })

    const req = httpMock.expectOne('/apis/protected/v8/portal/mdo/mydepartment?allUsers=true')
    expect(req.request.method).toBe('GET')
    req.flush(mockResponse)
  })

  it('should upload cover image', () => {
    const eventId = 'event123'
    const mockReq = { image: 'base64data' }
    const mockResponse = { url: 'image-url' }

    service.uploadCoverImage(mockReq, eventId).subscribe(response => {
      expect(response).toEqual(mockResponse)
    })

    const req = httpMock.expectOne(`/apis/authContent/upload/igot/dopt/Public/${eventId}/artifacts`)
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual(mockReq)
    req.flush(mockResponse)
  })

  it('should get all events', () => {
    const mockResponse = { events: [{ id: '123', title: 'Event 1' }] }

    service.getEvents().subscribe(response => {
      expect(response).toEqual(mockResponse)
    })

    const req = httpMock.expectOne('/apis/proxies/v8/sunbirdigot/read')
    expect(req.request.method).toBe('GET')
    req.flush(mockResponse)
  })

  it('should search users', () => {
    const searchTerm = 'john'
    const mockResponse = { users: [{ id: 'user1', name: 'John Doe' }] }

    service.searchUser(searchTerm).subscribe(response => {
      expect(response).toEqual(mockResponse)
    })

    const req = httpMock.expectOne(`/apis/proxies/v8/user/v1/autocomplete/${searchTerm}`)
    expect(req.request.method).toBe('GET')
    req.flush(mockResponse)
  })

  it('should get event details', () => {
    const eventId = 'event123'
    const mockResponse = { id: eventId, title: 'Test Event' }

    service.getEventDetails(eventId).subscribe(response => {
      expect(response).toEqual(mockResponse)
    })

    const req = httpMock.expectOne(`/apis/proxies/v8/event/v4/read/${eventId}`)
    expect(req.request.method).toBe('GET')
    req.flush(mockResponse)
  })

  it('should retire an event', () => {
    const eventId = 'event123'
    const mockResponse = { id: eventId, status: 'retired' }

    service.retireEvent(eventId).subscribe(response => {
      expect(response).toEqual(mockResponse)
    })

    const req = httpMock.expectOne(`/apis/proxies/v8/event/v4/retire/${eventId}`)
    expect(req.request.method).toBe('DELETE')
    req.flush(mockResponse)
  })

  it('should transform content URL to public URL', () => {
    const contentUrl = '/content/do_123/artifact/image.jpg'
    environment.contentHost = 'https://example.com'
    environment.contentBucket = 'bucket'

    const result = service.getPublicUrl(contentUrl)
    expect(result).toBe('https://example.com/bucket/content/do_123/artifact/image.jpg')
  })

  it('should get SLW resource type detail', () => {
    const payload = { type: 'resource' }
    const mockFormResponse = {
      result: {
        form: {
          data: { resourceTypes: ['Type1', 'Type2'] }
        }
      }
    }

    service.getSlwResourceTypeDetail(payload).subscribe(response => {
      expect(response).toEqual(mockFormResponse.result.form.data)
    })

    const req = httpMock.expectOne('/apis/v1/form/read')
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual(payload)
    req.flush(mockFormResponse)
  })

  it('should call formReadData', () => {
    const request = { type: 'resource' }
    const mockResponse = { result: { form: { data: {} } } }

    service.formReadData(request).subscribe(response => {
      expect(response).toEqual(mockResponse)
    })

    const req = httpMock.expectOne('/apis/v1/form/read')
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual(request)
    req.flush(mockResponse)
  })
})