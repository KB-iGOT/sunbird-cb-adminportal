import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { NotificationApiService } from './notification-api.service' // Adjust the import path as needed
import { INotificationData, ENotificationType } from '../models/notifications.model'

describe('NotificationApiService', () => {
  let service: NotificationApiService
  let httpMock: HttpTestingController
  const API_BASE = '/apis/protected/v8/user/notifications'

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NotificationApiService]
    })

    service = TestBed.inject(NotificationApiService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify() // Ensures that no requests are outstanding
  })

  describe('getNotifications', () => {
    it('should make GET request to the correct endpoint with no params', () => {
      const dummyResponse: INotificationData = {
        data: [],
        page: ''
      } // Adjust according to your interface structure

      service.getNotifications().subscribe(response => {
        expect(response).toEqual(dummyResponse)
      })

      const req = httpMock.expectOne(`${API_BASE}`)
      expect(req.request.method).toBe('GET')
      req.flush(dummyResponse)
    })

    it('should include query parameters when provided', () => {
      const classification = 'important'
      const size = 10
      const page = 'next'
      const dummyResponse: INotificationData = {
        data: [],
        page: ''
      }

      service.getNotifications(classification, size, page).subscribe(response => {
        expect(response).toEqual(dummyResponse)
      })

      const req = httpMock.expectOne(request => {
        return request.url === API_BASE &&
          request.params.get('classification') === classification &&
          request.params.get('size') === size.toString() &&
          request.params.get('page') === page
      })
      expect(req.request.method).toBe('GET')
      req.flush(dummyResponse)
    })

    it('should include only provided parameters', () => {
      const classification = 'important'
      const dummyResponse: INotificationData = {
        data: [],
        page: ''
      }

      service.getNotifications(classification).subscribe(response => {
        expect(response).toEqual(dummyResponse)
      })

      const req = httpMock.expectOne(request => {
        return request.url === API_BASE &&
          request.params.get('classification') === classification &&
          request.params.get('size') === null &&
          request.params.get('page') === null
      })
      expect(req.request.method).toBe('GET')
      req.flush(dummyResponse)
    })
  })

  describe('updateNotificationSeenStatus', () => {
    it('should make PATCH request to the base endpoint when no params provided', () => {
      service.updateNotificationSeenStatus().subscribe()

      const req = httpMock.expectOne(API_BASE)
      expect(req.request.method).toBe('PATCH')
      expect(req.request.body).toEqual({})
      req.flush({})
    })

    it('should make PATCH request to specific notification when ID and classification provided', () => {
      const notificationId = '123'
      const classification = ENotificationType.Info // Adjust based on your enum values
      const status = true

      service.updateNotificationSeenStatus(notificationId, classification, status).subscribe()

      const req = httpMock.expectOne(`${API_BASE}/${notificationId}/${classification}`)
      expect(req.request.method).toBe('PATCH')
      expect(req.request.body).toEqual({ seen: status })
      req.flush({})
    })

    it('should use default status value (true) when not provided', () => {
      const notificationId = '123'
      const classification = ENotificationType.Info

      service.updateNotificationSeenStatus(notificationId, classification).subscribe()

      const req = httpMock.expectOne(`${API_BASE}/${notificationId}/${classification}`)
      expect(req.request.method).toBe('PATCH')
      expect(req.request.body).toEqual({ seen: true })
      req.flush({})
    })

    it('should allow setting status to false', () => {
      const notificationId = '123'
      const classification = ENotificationType.Info
      const status = false

      service.updateNotificationSeenStatus(notificationId, classification, status).subscribe()

      const req = httpMock.expectOne(`${API_BASE}/${notificationId}/${classification}`)
      expect(req.request.method).toBe('PATCH')
      expect(req.request.body).toEqual({ seen: false })
      req.flush({})
    })
  })
})