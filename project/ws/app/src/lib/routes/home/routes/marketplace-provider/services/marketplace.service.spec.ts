import { of } from 'rxjs'
import { MarketplaceService } from './marketplace.service'

describe('MarketplaceService', () => {
  let service: MarketplaceService
  let httpClientMock: any

  beforeEach(() => {
    // Create a mock for HttpClient
    httpClientMock = {
      post: jest.fn(),
      get: jest.fn(),
      delete: jest.fn()
    }

    // Initialize the service with the mock
    service = new MarketplaceService(httpClientMock)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('createProvider', () => {
    it('should call http post with correct endpoint and body', () => {
      // Arrange
      const mockFormBody = { name: 'Test Provider', code: 'TEST001' }
      const mockResponse = { id: '123', success: true }
      httpClientMock.post.mockReturnValue(of(mockResponse))

      // Act
      let result: any
      service.createProvider(mockFormBody).subscribe(res => {
        result = res
      })

      // Assert
      expect(httpClientMock.post).toHaveBeenCalledWith('/apis/proxies/v8/contentpartner/v1/create', mockFormBody)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('updateProvider', () => {
    it('should call http post with correct endpoint and body', () => {
      // Arrange
      const mockFormBody = { id: '123', name: 'Updated Provider', code: 'TEST001' }
      const mockResponse = { success: true }
      httpClientMock.post.mockReturnValue(of(mockResponse))

      // Act
      let result: any
      service.updateProvider(mockFormBody).subscribe(res => {
        result = res
      })

      // Assert
      expect(httpClientMock.post).toHaveBeenCalledWith('/apis/proxies/v8/contentpartner/v1/update', mockFormBody)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('uploadThumbNail', () => {
    it('should create FormData and call http post with correct endpoint', () => {
      // Arrange
      const mockFile = new File(['content'], 'thumbnail.jpg', { type: 'image/jpeg' })
      const mockFormData = new FormData()
      mockFormData.append('content', mockFile)

      const mockResponse = { url: 'https://example.com/thumbnail.jpg' }
      httpClientMock.post.mockReturnValue(of(mockResponse))

      // Act
      let result: any
      service.uploadThumbNail(mockFormData).subscribe(res => {
        result = res
      })

      // Assert
      expect(httpClientMock.post).toHaveBeenCalledWith(
        'apis/proxies/v8/storage/v1/uploadCiosIcon',
        expect.any(FormData)
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('uploadCIOSContract', () => {
    it('should create FormData and call http post with correct endpoint', () => {
      // Arrange
      const mockFile = new File(['content'], 'contract.pdf', { type: 'application/pdf' })
      const mockFormData = new FormData()
      mockFormData.append('content', mockFile)

      const mockResponse = { url: 'https://example.com/contract.pdf' }
      httpClientMock.post.mockReturnValue(of(mockResponse))

      // Act
      let result: any
      service.uploadCIOSContract(mockFormData).subscribe(res => {
        result = res
      })

      // Assert
      expect(httpClientMock.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/storage/v1/uploadCiosContract',
        expect.any(FormData)
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getProvidersList', () => {
    it('should call http post with correct endpoint and body', () => {
      // Arrange
      const mockFormBody = { pageSize: 10, pageNumber: 1 }
      const mockResponse = { providers: [], totalCount: 0 }
      httpClientMock.post.mockReturnValue(of(mockResponse))

      // Act
      let result: any
      service.getProvidersList(mockFormBody).subscribe(res => {
        result = res
      })

      // Assert
      expect(httpClientMock.post).toHaveBeenCalledWith('/apis/proxies/v8/contentpartner/v1/search', mockFormBody)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('deleteProvider', () => {
    it('should call http delete with correct endpoint and provider id', () => {
      // Arrange
      const providerId = '123'
      const mockResponse = { success: true }
      httpClientMock.delete.mockReturnValue(of(mockResponse))

      // Act
      let result: any
      service.deleteProvider(providerId).subscribe(res => {
        result = res
      })

      // Assert
      expect(httpClientMock.delete).toHaveBeenCalledWith('/apis/proxies/v8/contentpartner/v1/delete/123')
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getProviderDetails', () => {
    it('should call http get with correct endpoint and provider id', () => {
      // Arrange
      const providerId = '123'
      const mockResponse = { id: '123', name: 'Test Provider' }
      httpClientMock.get.mockReturnValue(of(mockResponse))

      // Act
      let result: any
      service.getProviderDetails(providerId).subscribe(res => {
        result = res
      })

      // Assert
      expect(httpClientMock.get).toHaveBeenCalledWith('/apis/proxies/v8/contentpartner/v1/read/123')
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getContentList', () => {
    it('should call http get with correct endpoint and provider id', () => {
      // Arrange
      const providerId = '123'
      const mockResponse = { files: [] }
      httpClientMock.get.mockReturnValue(of(mockResponse))

      // Act
      let result: any
      service.getContentList(providerId).subscribe(res => {
        result = res
      })

      // Assert
      expect(httpClientMock.get).toHaveBeenCalledWith('/apis/proxies/v8/ciosIntegration/v1/file/info/123')
      expect(result).toEqual(mockResponse)
    })
  })

  describe('uploadContent', () => {
    it('should create FormData and call http post with correct endpoint', () => {
      // Arrange
      const mockFile = new File(['content'], 'courses.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const mockFormData = new FormData()
      mockFormData.append('content', mockFile)
      const partnerCode = 'TEST001'
      const partnerId = '123'

      const mockResponse = { success: true }
      httpClientMock.post.mockReturnValue(of(mockResponse))

      // Act
      let result: any
      service.uploadContent(mockFormData, partnerCode, partnerId).subscribe(res => {
        result = res
      })

      // Assert
      expect(httpClientMock.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/ciosIntegration/v1/loadContentFromExcel/TEST001/123',
        expect.any(FormData)
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('uploadProgress', () => {
    it('should create FormData and call http post with correct endpoint', () => {
      // Arrange
      const mockFile = new File(['content'], 'progress.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const mockFormData = new FormData()
      mockFormData.append('content', mockFile)
      const partnerCode = 'TEST001'

      const mockResponse = { success: true }
      httpClientMock.post.mockReturnValue(of(mockResponse))

      // Act
      let result: any
      service.uploadProgress(mockFormData, partnerCode).subscribe(res => {
        result = res
      })

      // Assert
      expect(httpClientMock.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/ciosIntegration/v1/loadContentProgressFromExcel/TEST001',
        expect.any(FormData)
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getCoursesList', () => {
    it('should call http post with correct endpoint and body', () => {
      // Arrange
      const mockFormBody = { pageSize: 10, pageNumber: 1 }
      const mockResponse = { courses: [], totalCount: 0 }
      httpClientMock.post.mockReturnValue(of(mockResponse))

      // Act
      let result: any
      service.getCoursesList(mockFormBody).subscribe(res => {
        result = res
      })

      // Assert
      expect(httpClientMock.post).toHaveBeenCalledWith('apis/proxies/v8/ciosIntegration/v1/search/content', mockFormBody)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('deleteUnPublishedCourses', () => {
    it('should call http post with correct endpoint and body', () => {
      // Arrange
      const mockFormBody = { ids: ['123', '456'] }
      const mockResponse = 'Deleted successfully'
      httpClientMock.post.mockReturnValue(of(mockResponse))

      // Act
      let result: any
      service.deleteUnPublishedCourses(mockFormBody).subscribe(res => {
        result = res
      })

      // Assert
      expect(httpClientMock.post).toHaveBeenCalledWith(
        'apis/proxies/v8/ciosIntegration/v1/deleteContent',
        mockFormBody,
        { responseType: 'text' as 'json' }
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('downloadLogs', () => {
    it('should call http get with correct endpoint and gcpfileName', () => {
      // Arrange
      const gcpfileName = 'log123.txt'
      const mockBlob = new Blob(['log content'], { type: 'text/plain' })
      httpClientMock.get.mockReturnValue(of(mockBlob))

      // Act
      let result: any
      service.downloadLogs(gcpfileName).subscribe(res => {
        result = res
      })

      // Assert
      expect(httpClientMock.get).toHaveBeenCalledWith(
        '/apis/proxies/v8/storage/v1/downloadCiosLogs/log123.txt',
        { responseType: 'blob' as 'json' }
      )
      expect(result).toEqual(mockBlob)
    })
  })

  describe('createConfiguration', () => {
    it('should call http post with correct endpoint and body', () => {
      // Arrange
      const mockFormBody = { name: 'Test Config', value: 'test-value' }
      const mockResponse = { id: '123', success: true }
      httpClientMock.post.mockReturnValue(of(mockResponse))

      // Act
      let result: any
      service.createConfiguration(mockFormBody).subscribe(res => {
        result = res
      })

      // Assert
      expect(httpClientMock.post).toHaveBeenCalledWith('apis/proxies/v8/serviceregistry/config/create', mockFormBody)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('updateConfiguration', () => {
    it('should call http post with correct endpoint and body', () => {
      // Arrange
      const mockFormBody = { id: '123', name: 'Updated Config', value: 'updated-value' }
      const mockResponse = { success: true }
      httpClientMock.post.mockReturnValue(of(mockResponse))

      // Act
      let result: any
      service.updateConfiguration(mockFormBody).subscribe(res => {
        result = res
      })

      // Assert
      expect(httpClientMock.post).toHaveBeenCalledWith('apis/proxies/v8/serviceregistry/config/update', mockFormBody)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getConfiguraionDetails', () => {
    it('should call http get with correct endpoint and configuration id', () => {
      // Arrange
      const configurationId = '123'
      const mockResponse = { id: '123', name: 'Test Config' }
      httpClientMock.get.mockReturnValue(of(mockResponse))

      // Act
      let result: any
      service.getConfiguraionDetails(configurationId).subscribe(res => {
        result = res
      })

      // Assert
      expect(httpClientMock.get).toHaveBeenCalledWith('apis/proxies/v8/serviceregistry/config/read/123')
      expect(result).toEqual(mockResponse)
    })
  })
})