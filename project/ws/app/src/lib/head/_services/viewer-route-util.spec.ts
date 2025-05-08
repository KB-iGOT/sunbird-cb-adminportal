// Import the functions to be tested
import { VIEWER_ROUTE_FROM_MIME, viewerRouteGenerator } from '@sunbird-cb/collection'
import { NsContent } from './widget-content.model'

describe('VIEWER_ROUTE_FROM_MIME', () => {
  test('should return correct route for audio files', () => {
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.MP3)).toBe('audio')
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.M4A)).toBe('audio-native')
  })

  test('should return correct route for video files', () => {
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.MP4)).toBe('video')
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.M3U8)).toBe('video')
  })

  test('should return correct route for document files', () => {
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.PDF)).toBe('pdf')
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.HTML)).toBe('html')
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.HTML_TEXT)).toBe('html')
  })

  test('should return correct route for special content types', () => {
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.COLLECTION)).toBe('html')
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.CHANNEL)).toBe('channel')
    expect(VIEWER_ROUTE_FROM_MIME('application/json' as any)).toBe('channel')
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.CERTIFICATION)).toBe('certification')
  })

  test('should return correct route for interactive content', () => {
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.IAP)).toBe('iap')
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.ILP_FP)).toBe('ilp-fp')
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.WEB_MODULE)).toBe('web-module')
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.WEB_MODULE_EXERCISE)).toBe('web-module')
  })

  test('should return correct route for educational content', () => {
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.CLASS_DIAGRAM)).toBe('class-diagram')
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.HANDS_ON)).toBe('hands-on')
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.RDBMS_HANDS_ON)).toBe('rdbms-hands-on')
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.HTML_PICKER)).toBe('html-picker')
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.QUIZ)).toBe('quiz')
  })

  test('should return correct route for collection resources', () => {
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.COLLECTION_RESOURCE)).toBe('resource-collection')
  })

  test('should return html for youtube content', () => {
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.YOUTUBE)).toBe('youtube')
  })

  test('should return html as default for unknown mime types', () => {
    expect(VIEWER_ROUTE_FROM_MIME('unknown-mime-type' as any)).toBe('html')
  })
})

describe('viewerRouteGenerator', () => {
  // beforeAll(() => {
  //   // Mock NsContent.PLAYER_SUPPORTED_COLLECTION_TYPES
  //   NsContent.PLAYER_SUPPORTED_COLLECTION_TYPES = ['Course', 'Learning Path']
  // })

  test('should generate basic viewer route without collection info', () => {
    const result = viewerRouteGenerator('content-123', NsContent.EMimeTypes.PDF)
    expect(result).toEqual({
      url: '/viewer/pdf/content-123',
      queryParams: {}
    })
  })

  test('should generate route with primaryCategory', () => {
    const result = viewerRouteGenerator(
      'content-123',
      NsContent.EMimeTypes.PDF,
      undefined,
      undefined,
      false,
      'Resource'
    )
    expect(result).toEqual({
      url: '/viewer/pdf/content-123',
      queryParams: { primaryCategory: 'Resource' }
    })
  })

  test('should generate route with collection info for supported types', () => {
    const result = viewerRouteGenerator(
      'content-123',
      NsContent.EMimeTypes.MP4,
      'collection-456',
      'Course'
    )
    expect(result).toEqual({
      url: '/viewer/video/content-123',
      queryParams: {
        collectionId: 'collection-456',
        collectionType: 'Course'
      }
    })
  })

  test('should omit collection info for unsupported collection types', () => {
    const result = viewerRouteGenerator(
      'content-123',
      NsContent.EMimeTypes.PDF,
      'collection-456',
      'Unsupported Type'
    )
    expect(result).toEqual({
      url: '/viewer/pdf/content-123',
      queryParams: {}
    })
  })

  test('should generate preview route when forPreview is true', () => {
    const result = viewerRouteGenerator(
      'content-123',
      NsContent.EMimeTypes.HTML,
      undefined,
      undefined,
      true
    )
    expect(result).toEqual({
      url: '/author/viewer/html/content-123',
      queryParams: {}
    })
  })

  test('should include batch ID when provided', () => {
    const result = viewerRouteGenerator(
      'content-123',
      NsContent.EMimeTypes.MP3,
      undefined,
      undefined,
      false,
      'Resource',
      'batch-789'
    )
    expect(result).toEqual({
      url: '/viewer/audio/content-123',
      queryParams: {
        primaryCategory: 'Resource',
        batchId: 'batch-789'
      }
    })
  })

  test('should combine all parameters correctly', () => {
    const result = viewerRouteGenerator(
      'content-123',
      NsContent.EMimeTypes.MP4,
      'collection-456',
      'Learning Path',
      true,
      'Video',
      'batch-789'
    )
    expect(result).toEqual({
      url: '/author/viewer/video/content-123',
      queryParams: {
        primaryCategory: 'Video',
        collectionId: 'collection-456',
        collectionType: 'Learning Path',
        batchId: 'batch-789'
      }
    })
  })
})