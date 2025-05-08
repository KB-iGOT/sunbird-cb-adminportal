import { SectorsService } from './sectors.service'
import { HttpClient } from '@angular/common/http'
import { of } from 'rxjs'
import { environment } from '../../../../../../../../../src/environments/environment'

// Mock environment
jest.mock('../../../../../../../../../src/environments/environment', () => ({
  environment: {
    sitePath: 'test-site.com',
    contentBucket: 'test-bucket'
  }
}))

describe('SectorsService', () => {
  let service: SectorsService
  let httpClientSpy: jest.Mocked<HttpClient>

  beforeEach(() => {
    // Create a spy object for HttpClient with all methods mocked
    httpClientSpy = {
      get: jest.fn(),
      post: jest.fn(),
    } as any

    // Initialize service with the spy
    service = new SectorsService(httpClientSpy)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('getAllSectors', () => {
    it('should call http get with the correct URL', () => {
      // Mock response
      const mockResponse = { sectors: ['Sector1', 'Sector2'] }
      httpClientSpy.get.mockReturnValue(of(mockResponse))

      // Call the method
      let result: any
      service.getAllSectors().subscribe(res => {
        result = res
      })

      // Verify the http call was made correctly
      expect(httpClientSpy.get).toHaveBeenCalledWith('/apis/proxies/v8/catalog/v1/sector')
      expect(result).toEqual(mockResponse)
    })
  })

  describe('createSector', () => {
    it('should call http post with the correct URL and request body', () => {
      // Mock request and response
      const mockRequest = { name: 'New Sector' }
      const mockResponse = { id: '123', name: 'New Sector' }
      httpClientSpy.post.mockReturnValue(of(mockResponse))

      // Call the method
      let result: any
      service.createSector(mockRequest).subscribe(res => {
        result = res
      })

      // Verify the http call was made correctly
      expect(httpClientSpy.post).toHaveBeenCalledWith('/apis/proxies/v8/catalog/v1/sector/create', mockRequest)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('readSector', () => {
    it('should call http get with the correct URL and ID', () => {
      // Mock response
      const sectorId = '123'
      const mockResponse = { id: '123', name: 'Test Sector' }
      httpClientSpy.get.mockReturnValue(of(mockResponse))

      // Call the method
      let result: any
      service.readSector(sectorId).subscribe(res => {
        result = res
      })

      // Verify the http call was made correctly
      expect(httpClientSpy.get).toHaveBeenCalledWith(`/apis/proxies/v8/catalog/v1/sector/read/${sectorId}`)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('createSubSectors', () => {
    it('should call http post with the correct URL and request body', () => {
      // Mock request and response
      const mockRequest = { sectorId: '123', name: 'New SubSector' }
      const mockResponse = { id: '456', sectorId: '123', name: 'New SubSector' }
      httpClientSpy.post.mockReturnValue(of(mockResponse))

      // Call the method
      let result: any
      service.createSubSectors(mockRequest).subscribe(res => {
        result = res
      })

      // Verify the http call was made correctly
      expect(httpClientSpy.post).toHaveBeenCalledWith('apis/proxies/v8/catalog/v1/subsector/create', mockRequest)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('fetchImagesContent', () => {
    it('should call http post with the correct URL and search data', () => {
      // Mock request and response
      const mockRequest = { query: 'test' }
      const mockResponse = { results: ['image1', 'image2'] }
      httpClientSpy.post.mockReturnValue(of(mockResponse))

      // Call the method
      let result: any
      service.fetchImagesContent(mockRequest).subscribe(res => {
        result = res
      })

      // Verify the http call was made correctly
      expect(httpClientSpy.post).toHaveBeenCalledWith('apis/proxies/v8/sunbirdigot/read', mockRequest)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('createImageContent', () => {
    it('should call http post with the correct URL and request body', () => {
      // Mock request and response
      const mockRequest = { name: 'New Image' }
      const mockResponse = { id: '789', name: 'New Image' }
      httpClientSpy.post.mockReturnValue(of(mockResponse))

      // Call the method
      let result: any
      service.createImageContent(mockRequest).subscribe(res => {
        result = res
      })

      // Verify the http call was made correctly
      expect(httpClientSpy.post).toHaveBeenCalledWith(`apis/proxies/v8/action/content/v3/create`, mockRequest)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('upload', () => {
    it('should call http post with the correct URL and form data for non-fixed file names', () => {
      // Mock data
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      const formData = new FormData()
      formData.append('content', file)
      const contentData = { contentId: '123' }
      const mockResponse = { id: '123', url: 'test-url' }

      // Spy on appendToFilename
      jest.spyOn(service, 'appendToFilename').mockReturnValue('test1620000000000.jpg')

      // Mock the post response
      httpClientSpy.post.mockReturnValue(of(mockResponse))

      // Call the method
      let result: any
      service.upload(formData, contentData).subscribe(res => {
        result = res
      })

      // Verify appendToFilename was called
      expect(service.appendToFilename).toHaveBeenCalledWith('test.jpg')

      // Verify the http call was made with modified filename in FormData
      expect(httpClientSpy.post).toHaveBeenCalledWith(
        `apis/proxies/v8/upload/action/content/v3/upload/123`,
        expect.any(FormData)
      )
      expect(result).toEqual(mockResponse)
    })

    it('should not modify filename for fixed file names', () => {
      // Mock data for a fixed filename
      const file = new File(['test content'], 'channel.json', { type: 'application/json' })
      const formData = new FormData()
      formData.append('content', file)
      const contentData = { contentId: '123' }
      const mockResponse = { id: '123', url: 'test-url' }

      // Spy on appendToFilename
      const appendToFilenameSpy = jest.spyOn(service, 'appendToFilename')

      // Mock the post response
      httpClientSpy.post.mockReturnValue(of(mockResponse))

      // Call the method
      let result: any
      service.upload(formData, contentData).subscribe(res => {
        result = res
      })

      // Verify appendToFilename was not called for fixed filename
      expect(appendToFilenameSpy).not.toHaveBeenCalled()

      // Verify the http call was made with original filename in FormData
      expect(httpClientSpy.post).toHaveBeenCalledWith(
        `apis/proxies/v8/upload/action/content/v3/upload/123`,
        expect.any(FormData)
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('appendToFilename', () => {
    it('should append timestamp before extension', () => {
      // Mock date
      const mockDate = new Date(2023, 0, 1)
      const mockTimestamp = mockDate.getTime()
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate)

      const result = service.appendToFilename('test.jpg')
      expect(result).toBe(`test${mockTimestamp}.jpg`)
    })

    it('should append timestamp to filename without extension', () => {
      // Mock date
      const mockDate = new Date(2023, 0, 1)
      const mockTimestamp = mockDate.getTime()
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate)

      const result = service.appendToFilename('test')
      expect(result).toBe(`test${mockTimestamp}`)
    })
  })

  describe('getChangedArtifactUrl', () => {
    it('should transform URL correctly', () => {
      const originalUrl = 'server/content/test/image.jpg'
      const expected = `https://${environment.sitePath}/${environment.contentBucket}/content/test/image.jpg`

      const result = service.getChangedArtifactUrl(originalUrl)
      expect(result).toBe(expected)
    })

    it('should return original URL if empty', () => {
      const originalUrl = ''

      const result = service.getChangedArtifactUrl(originalUrl)
      expect(result).toBe(originalUrl)
    })

    it('should handle undefined URL', () => {
      const originalUrl = undefined

      const result = service.getChangedArtifactUrl(originalUrl as any)
      expect(result).toBe(originalUrl)
    })
  })
})