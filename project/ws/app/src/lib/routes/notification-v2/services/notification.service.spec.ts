import { NotificationService } from './notification.service'
import { Router } from '@angular/router'
import { ENotificationEvent, INotification } from '../models/notifications.model'

describe('NotificationService', () => {
  let service: NotificationService
  let mockRouter: jest.Mocked<Router>

  beforeEach(() => {
    // Create a mock Router
    mockRouter = {
      navigate: jest.fn().mockReturnValue(Promise.resolve(true))
    } as unknown as jest.Mocked<Router>

    // Instantiate the service with the mock Router
    service = new NotificationService(mockRouter)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should navigate to goals pending actions for ShareGoal event', () => {
    // Arrange
    const notification: INotification = {
      eventId: ENotificationEvent.ShareGoal,
      targetData: {}
    } as INotification

    // Act
    service.mapRoute(notification)

    // Assert
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/goals/me/pending-actions'])
  })

  it('should navigate to playlist notification for SharePlaylist event', () => {
    // Arrange
    const notification: INotification = {
      eventId: ENotificationEvent.SharePlaylist,
      targetData: {}
    } as INotification

    // Act
    service.mapRoute(notification)

    // Assert
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/playlist/notification'])
  })

  describe('ShareContent and PublishContent events', () => {
    it('should navigate to TOC overview with identifier', () => {
      // Arrange
      const notification: INotification = {
        eventId: ENotificationEvent.ShareContent,
        targetData: { identifier: 'content-123' }
      } as INotification

      // Act
      service.mapRoute(notification)

      // Assert
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/toc/content-123/overview'])
    })

    it('should not navigate when identifier is missing', () => {
      // Arrange
      const notification: INotification = {
        eventId: ENotificationEvent.ShareContent,
        targetData: {}
      } as INotification

      // Act
      service.mapRoute(notification)

      // Assert
      expect(mockRouter.navigate).not.toHaveBeenCalled()
    })

    it('should navigate correctly for PublishContent event', () => {
      // Arrange
      const notification: INotification = {
        eventId: ENotificationEvent.PublishContent,
        targetData: { identifier: 'content-456' }
      } as INotification

      // Act
      service.mapRoute(notification)

      // Assert
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/toc/content-456/overview'])
    })
  })

  describe('Editor-related events', () => {
    const editorEvents = [
      ENotificationEvent.AddContributor,
      ENotificationEvent.SendContent,
      ENotificationEvent.RejectContent,
      ENotificationEvent.DelegateContent,
      ENotificationEvent.ApproveContent
    ]

    editorEvents.forEach((eventType: any) => {
      it(`should navigate to editor with identifier for ${eventType} event`, () => {
        // Arrange
        const notification: INotification = {
          eventId: eventType,
          targetData: { identifier: 'editor-123' }
        } as INotification

        // Act
        service.mapRoute(notification)

        // Assert
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/author/editor/editor-123'])
      })

      it(`should not navigate when identifier is missing for ${eventType} event`, () => {
        // Arrange
        const notification: INotification = {
          eventId: eventType,
          targetData: {}
        } as INotification

        // Act
        service.mapRoute(notification)

        // Assert
        expect(mockRouter.navigate).not.toHaveBeenCalled()
      })
    })
  })

  it('should not navigate for unknown event types', () => {
    // Arrange
    const notification: INotification = {
    } as INotification

    // Act
    service.mapRoute(notification)

    // Assert
    expect(mockRouter.navigate).not.toHaveBeenCalled()
  })
})