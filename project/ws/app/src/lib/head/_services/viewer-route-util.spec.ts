import { VIEWER_ROUTE_FROM_MIME, viewerRouteGenerator } from './viewer-route-util' // Replace with actual file name
import { NsContent } from './widget-content.model'

// Mock the NsContent namespace and its properties
jest.mock('./widget-content.model', () => ({
  NsContent: {
    EMimeTypes: {
      MP3: 'audio/mp3',
      M4A: 'audio/m4a',
      COLLECTION: 'collection',
      CHANNEL: 'channel',
      CERTIFICATION: 'certification',
      HTML: 'text/html',
      HTML_TEXT: 'text/html-text',
      IAP: 'iap',
      ILP_FP: 'ilp-fp',
      PDF: 'application/pdf',
      MP4: 'video/mp4',
      M3U8: 'application/x-mpegURL',
      YOUTUBE: 'video/youtube',
      WEB_MODULE: 'web-module',
      WEB_MODULE_EXERCISE: 'web-module-exercise',
      CLASS_DIAGRAM: 'class-diagram',
      HANDS_ON: 'hands-on',
      RDBMS_HANDS_ON: 'rdbms-hands-on',
      HTML_PICKER: 'html-picker',
      QUIZ: 'quiz',
      COLLECTION_RESOURCE: 'collection-resource'
    },
    PLAYER_SUPPORTED_COLLECTION_TYPES: ['course', 'learning-path', 'program']
  }
}))

describe('VIEWER_ROUTE_FROM_MIME', () => {
  it('should return "audio" for MP3 mime type', () => {
    const result = VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.MP3)
    expect(result).toBe('audio')
  })

  it('should return "audio-native" for M4A mime type', () => {
    const result = VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.M4A)
    expect(result).toBe('audio-native')
  })

  it('should return "html" for COLLECTION mime type', () => {
    const result = VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.COLLECTION)
    expect(result).toBe('html')
  })

  it('should return "channel" for CHANNEL mime type', () => {
    const result = VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.CHANNEL)
    expect(result).toBe('channel')
  })

  it('should return "channel" for application/json mime type', () => {
    const result = VIEWER_ROUTE_FROM_MIME('application/json' as any)
    expect(result).toBe('channel')
  })

  it('should return "certification" for CERTIFICATION mime type', () => {
    const result = VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.CERTIFICATION)
    expect(result).toBe('certification')
  })

  it('should return "html" for HTML mime type', () => {
    const result = VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.HTML)
    expect(result).toBe('html')
  })

  it('should return "html" for HTML_TEXT mime type', () => {
    const result = VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.HTML_TEXT)
    expect(result).toBe('html')
  })

  it('should return "iap" for IAP mime type', () => {
    const result = VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.IAP)
    expect(result).toBe('iap')
  })

  it('should return "ilp-fp" for ILP_FP mime type', () => {
    const result = VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.ILP_FP)
    expect(result).toBe('ilp-fp')
  })

  it('should return "pdf" for PDF mime type', () => {
    const result = VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.PDF)
    expect(result).toBe('pdf')
  })

  it('should return "video" for MP4 mime type', () => {
    const result = VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.MP4)
    expect(result).toBe('video')
  })

  it('should return "video" for M3U8 mime type', () => {
    const result = VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.M3U8)
    expect(result).toBe('video')
  })

  it('should return "youtube" for YOUTUBE mime type', () => {
    const result = VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.YOUTUBE)
    expect(result).toBe('youtube')
  })

  it('should return "web-module" for WEB_MODULE mime type', () => {
    const result = VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.WEB_MODULE)
    expect(result).toBe('web-module')
  })

  it('should return "web-module" for WEB_MODULE_EXERCISE mime type', () => {
    const result = VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.WEB_MODULE_EXERCISE)
    expect(result).toBe('web-module')
  })

  it('should return "class-diagram" for CLASS_DIAGRAM mime type', () => {
    const result = VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.CLASS_DIAGRAM)
    expect(result).toBe('class-diagram')
  })

  it('should return "hands-on" for HANDS_ON mime type', () => {
    const result = VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.HANDS_ON)
    expect(result).toBe('hands-on')
  })

  it('should return "rdbms-hands-on" for RDBMS_HANDS_ON mime type', () => {
    const result = VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.RDBMS_HANDS_ON)
    expect(result).toBe('rdbms-hands-on')
  })

  it('should return "html-picker" for HTML_PICKER mime type', () => {
    const result = VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.HTML_PICKER)
    expect(result).toBe('html-picker')
  })

  it('should return "quiz" for QUIZ mime type', () => {
    const result = VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.QUIZ)
    expect(result).toBe('quiz')
  })

  it('should return "resource-collection" for COLLECTION_RESOURCE mime type', () => {
    const result = VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.COLLECTION_RESOURCE)
    expect(result).toBe('resource-collection')
  })

  it('should return "html" for unknown mime type (default case)', () => {
    const result = VIEWER_ROUTE_FROM_MIME('unknown/type' as any)
    expect(result).toBe('html')
  })
})

describe('viewerRouteGenerator', () => {
  const mockId = 'test-id-123'
  const mockMimeType = NsContent.EMimeTypes.PDF

  it('should generate basic viewer route without optional parameters', () => {
    const result = viewerRouteGenerator(mockId, mockMimeType)

    expect(result).toEqual({
      url: '/viewer/pdf/test-id-123',
      queryParams: {}
    })
  })

  it('should generate preview route when forPreview is true', () => {
    const result = viewerRouteGenerator(mockId, mockMimeType, undefined, undefined, true)

    expect(result).toEqual({
      url: '/author/viewer/pdf/test-id-123',
      queryParams: {}
    })
  })

  it('should include primaryCategory in queryParams when provided', () => {
    const result = viewerRouteGenerator(mockId, mockMimeType, undefined, undefined, false, 'technology')

    expect(result).toEqual({
      url: '/viewer/pdf/test-id-123',
      queryParams: {
        primaryCategory: 'technology'
      }
    })
  })

  it('should include collectionId and collectionType when both are provided and collection type is supported', () => {
    const result = viewerRouteGenerator(
      mockId,
      mockMimeType,
      'collection-123',
      'course',
      false
    )

    expect(result).toEqual({
      url: '/viewer/pdf/test-id-123',
      queryParams: {
        collectionId: 'collection-123',
        collectionType: 'course'
      }
    })
  })

  it('should exclude collectionId and collectionType when collection type is not supported', () => {
    const result = viewerRouteGenerator(
      mockId,
      mockMimeType,
      'collection-123',
      'unsupported-type',
      false
    )

    expect(result).toEqual({
      url: '/viewer/pdf/test-id-123',
      queryParams: {}
    })
  })

  it('should include batchId in queryParams when provided', () => {
    const result = viewerRouteGenerator(
      mockId,
      mockMimeType,
      undefined,
      undefined,
      false,
      undefined,
      'batch-456'
    )

    expect(result).toEqual({
      url: '/viewer/pdf/test-id-123',
      queryParams: {
        batchId: 'batch-456'
      }
    })
  })

  it('should include all optional parameters when provided and valid', () => {
    const result = viewerRouteGenerator(
      mockId,
      mockMimeType,
      'collection-123',
      'learning-path',
      true,
      'science',
      'batch-789'
    )

    expect(result).toEqual({
      url: '/author/viewer/pdf/test-id-123',
      queryParams: {
        primaryCategory: 'science',
        collectionId: 'collection-123',
        collectionType: 'learning-path',
        batchId: 'batch-789'
      }
    })
  })

  it('should handle different mime types correctly in URL generation', () => {
    const result = viewerRouteGenerator(
      'video-id',
      NsContent.EMimeTypes.MP4
    )

    expect(result).toEqual({
      url: '/viewer/video/video-id',
      queryParams: {}
    })
  })

  it('should only include collectionId when collectionType is missing', () => {
    const result = viewerRouteGenerator(
      mockId,
      mockMimeType,
      'collection-123',
      undefined,
      false
    )

    expect(result).toEqual({
      url: '/viewer/pdf/test-id-123',
      queryParams: {}
    })
  })

  it('should only include collectionType when collectionId is missing', () => {
    const result = viewerRouteGenerator(
      mockId,
      mockMimeType,
      undefined,
      'course',
      false
    )

    expect(result).toEqual({
      url: '/viewer/pdf/test-id-123',
      queryParams: {}
    })
  })

  it('should handle edge case with empty string collectionId', () => {
    const result = viewerRouteGenerator(
      mockId,
      mockMimeType,
      '',
      'course',
      false
    )

    expect(result).toEqual({
      url: '/viewer/pdf/test-id-123',
      queryParams: {}
    })
  })
})