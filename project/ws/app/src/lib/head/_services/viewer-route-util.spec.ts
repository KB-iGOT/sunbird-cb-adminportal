
import { VIEWER_ROUTE_FROM_MIME, viewerRouteGenerator } from '@sunbird-cb/collection'
import { NsContent } from './widget-content.model'

// Mock for NsContent if not available in tests
jest.mock('./widget-content.model', () => {
  return {
    NsContent: {
      EMimeTypes: {
        MP3: 'audio/mpeg',
        M4A: 'audio/m4a',
        COLLECTION: 'application/vnd.ekstep.content-collection',
        CHANNEL: 'application/channel',
        CERTIFICATION: 'application/certification',
        HTML: 'application/html',
        HTML_TEXT: 'text/html',
        IAP: 'application/iap',
        ILP_FP: 'application/ilpfp',
        PDF: 'application/pdf',
        MP4: 'video/mp4',
        M3U8: 'application/m3u8',
        YOUTUBE: 'application/x-youtube',
        WEB_MODULE: 'application/web-module',
        WEB_MODULE_EXERCISE: 'application/web-module-exercise',
        CLASS_DIAGRAM: 'application/class-diagram',
        HANDS_ON: 'application/hands-on',
        RDBMS_HANDS_ON: 'application/rdbms-hands-on',
        HTML_PICKER: 'application/html-picker',
        QUIZ: 'application/quiz',
        COLLECTION_RESOURCE: 'application/collection-resource'
      },
      PLAYER_SUPPORTED_COLLECTION_TYPES: ['Course', 'Learning Path', 'Program']
    }
  }
})

describe('VIEWER_ROUTE_FROM_MIME', () => {
  it('should return correct route for MP3 mime type', () => {
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.MP3)).toBe('audio')
  })

  it('should return correct route for M4A mime type', () => {
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.M4A)).toBe('audio-native')
  })

  it('should return correct route for COLLECTION mime type', () => {
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.COLLECTION)).toBe('html')
  })

  it('should return correct route for CHANNEL mime type', () => {
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.CHANNEL)).toBe('channel')
  })

  it('should return correct route for application/json mime type', () => {
    expect(VIEWER_ROUTE_FROM_MIME('application/json' as any)).toBe('channel')
  })

  it('should return correct route for CERTIFICATION mime type', () => {
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.CERTIFICATION)).toBe('certification')
  })

  it('should return correct route for HTML mime type', () => {
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.HTML)).toBe('html')
  })

  it('should return correct route for HTML_TEXT mime type', () => {
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.HTML_TEXT)).toBe('html')
  })

  it('should return correct route for IAP mime type', () => {
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.IAP)).toBe('iap')
  })

  it('should return correct route for ILP_FP mime type', () => {
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.ILP_FP)).toBe('ilp-fp')
  })

  it('should return correct route for PDF mime type', () => {
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.PDF)).toBe('pdf')
  })

  it('should return correct route for MP4 mime type', () => {
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.MP4)).toBe('video')
  })

  it('should return correct route for M3U8 mime type', () => {
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.M3U8)).toBe('video')
  })

  it('should return correct route for YOUTUBE mime type', () => {
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.YOUTUBE)).toBe('youtube')
  })

  it('should return correct route for WEB_MODULE mime type', () => {
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.WEB_MODULE)).toBe('web-module')
  })

  it('should return correct route for WEB_MODULE_EXERCISE mime type', () => {
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.WEB_MODULE_EXERCISE)).toBe('web-module')
  })

  it('should return correct route for CLASS_DIAGRAM mime type', () => {
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.CLASS_DIAGRAM)).toBe('class-diagram')
  })

  it('should return correct route for HANDS_ON mime type', () => {
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.HANDS_ON)).toBe('hands-on')
  })

  it('should return correct route for RDBMS_HANDS_ON mime type', () => {
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.RDBMS_HANDS_ON)).toBe('rdbms-hands-on')
  })

  it('should return correct route for HTML_PICKER mime type', () => {
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.HTML_PICKER)).toBe('html-picker')
  })

  it('should return correct route for QUIZ mime type', () => {
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.QUIZ)).toBe('quiz')
  })

  it('should return correct route for COLLECTION_RESOURCE mime type', () => {
    expect(VIEWER_ROUTE_FROM_MIME(NsContent.EMimeTypes.COLLECTION_RESOURCE)).toBe('resource-collection')
  })

  it('should return html as default for unknown mime type', () => {
    expect(VIEWER_ROUTE_FROM_MIME('unknown/type' as any)).toBe('html')
  })
})

describe('viewerRouteGenerator', () => {
  it('should generate basic route without collection or preview', () => {
    const result = viewerRouteGenerator('content-123', NsContent.EMimeTypes.PDF)
    expect(result).toEqual({
      url: '/viewer/pdf/content-123',
      queryParams: {}
    })
  })

  it('should generate route with preview flag', () => {
    const result = viewerRouteGenerator('content-123', NsContent.EMimeTypes.PDF, undefined, undefined, true)
    expect(result).toEqual({
      url: '/author/viewer/pdf/content-123',
      queryParams: {}
    })
  })

  it('should include primaryCategory in queryParams if provided', () => {
    const result = viewerRouteGenerator('content-123', NsContent.EMimeTypes.PDF, undefined, undefined, false, 'Course')
    expect(result).toEqual({
      url: '/viewer/pdf/content-123',
      queryParams: { primaryCategory: 'Course' }
    })
  })

  it('should include collectionId and collectionType in queryParams if both are provided and valid', () => {
    const result = viewerRouteGenerator(
      'content-123',
      NsContent.EMimeTypes.PDF,
      'collection-456',
      'Course'
    )
    expect(result).toEqual({
      url: '/viewer/pdf/content-123',
      queryParams: { collectionId: 'collection-456', collectionType: 'Course' }
    })
  })

  it('should not include collection params if collectionType is not supported', () => {
    const result = viewerRouteGenerator(
      'content-123',
      NsContent.EMimeTypes.PDF,
      'collection-456',
      'UnsupportedType'
    )
    expect(result).toEqual({
      url: '/viewer/pdf/content-123',
      queryParams: {}
    })
  })

  it('should include batchId in queryParams if provided', () => {
    const result = viewerRouteGenerator(
      'content-123',
      NsContent.EMimeTypes.PDF,
      undefined,
      undefined,
      false,
      undefined,
      'batch-789'
    )
    expect(result).toEqual({
      url: '/viewer/pdf/content-123',
      queryParams: { batchId: 'batch-789' }
    })
  })

  it('should combine all queryParams when all options are provided', () => {
    const result = viewerRouteGenerator(
      'content-123',
      NsContent.EMimeTypes.PDF,
      'collection-456',
      'Course',
      true,
      'Learning',
      'batch-789'
    )
    expect(result).toEqual({
      url: '/author/viewer/pdf/content-123',
      queryParams: {
        primaryCategory: 'Learning',
        collectionId: 'collection-456',
        collectionType: 'Course',
        batchId: 'batch-789'
      }
    })
  })
})