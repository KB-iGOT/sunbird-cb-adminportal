
import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http'
import { MatSnackBar } from '@angular/material/snack-bar'
import { of, throwError } from 'rxjs'
import * as fileSaver from 'file-saver'
import { FileService } from './upload.service'

// Mock file-saver
jest.mock('file-saver', () => ({
  saveAs: jest.fn(),
}))

describe('FileService', () => {
  let service: FileService
  let httpClientMock: jest.Mocked<HttpClient>
  let matSnackBarMock: jest.Mocked<MatSnackBar>

  beforeEach(() => {
    httpClientMock = {
      post: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<HttpClient>

    matSnackBarMock = {
      open: jest.fn(),
    } as unknown as jest.Mocked<MatSnackBar>

    service = new FileService(httpClientMock, matSnackBarMock)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('isLoading', () => {
    it('should return an observable of loading state', (done) => {
      service.isLoading().subscribe((isLoading) => {
        expect(isLoading).toBeFalsy()
        done()
      })
    })
  })

  describe('upload', () => {
    it('should upload a file and return the response', (done) => {
      const fileName = 'test.csv'
      const formData = new FormData()
      const mockResponse = { success: true }

      httpClientMock.post.mockReturnValue(of(mockResponse))

      service.upload(fileName, formData).subscribe((response) => {
        expect(response).toEqual(mockResponse)
        expect(httpClientMock.post).toHaveBeenCalledWith('/apis/proxies/v8/user/v2/bulkupload', formData)
        done()
      })
    })

    it('should set loading state to true during upload and false after completion', (done) => {
      const fileName = 'test.csv'
      const formData = new FormData()
      const mockResponse = { success: true }

      httpClientMock.post.mockReturnValue(of(mockResponse))

      const loadingStates: boolean[] = []
      service.isLoading().subscribe((state) => loadingStates.push(state))

      service.upload(fileName, formData).subscribe(() => {
        expect(loadingStates).toEqual([false, true, false])
        done()
      })
    })
  })

  describe('download', () => {
    it('should download a file with the given filename', () => {
      const filePath = '/test/path'
      const fileName = 'test.csv'
      const blobData = new Blob(['test content'], { type: 'text/csv' })

      httpClientMock.get.mockReturnValue(of(blobData))

      service.download(filePath, fileName)

      expect(httpClientMock.get).toHaveBeenCalledWith(filePath, { responseType: 'blob' })
      expect(fileSaver.saveAs).toHaveBeenCalledWith(blobData, fileName)
    })
  })

  describe('downloadWithDispositionName', () => {
    it('should download a file using Content-Disposition filename', () => {
      const filePath = '/test/path'
      const blobData = new Blob(['test content'], { type: 'text/csv' })
      const headers = new HttpHeaders({
        'Content-Disposition': 'attachment; filename="test-file.csv"',
      })
      const response = new HttpResponse({
        body: blobData,
        headers,
      })

      httpClientMock.get.mockReturnValue(of(response))

      service.downloadWithDispositionName(filePath)

      expect(httpClientMock.get).toHaveBeenCalledWith(filePath, {
        responseType: 'blob',
        observe: 'response',
      })
      expect(fileSaver.saveAs).toHaveBeenCalledWith(blobData, 'test-file.csv')
    })

    it('should use provided filename if Content-Disposition is not available', () => {
      const filePath = '/test/path'
      const fileName = 'custom-file.csv'
      const blobData = new Blob(['test content'], { type: 'text/csv' })
      const headers = new HttpHeaders()
      const response = new HttpResponse({
        body: blobData,
        headers,
      })

      httpClientMock.get.mockReturnValue(of(response))

      service.downloadWithDispositionName(filePath, fileName)

      expect(httpClientMock.get).toHaveBeenCalledWith(filePath, {
        responseType: 'blob',
        observe: 'response',
      })
      expect(fileSaver.saveAs).toHaveBeenCalledWith(blobData, fileName)
    })

    it('should use default filename if both Content-Disposition and provided filename are not available', () => {
      const filePath = '/test/path'
      const blobData = new Blob(['test content'], { type: 'text/csv' })
      const headers = new HttpHeaders()
      const response = new HttpResponse({
        body: blobData,
        headers,
      })

      httpClientMock.get.mockReturnValue(of(response))

      service.downloadWithDispositionName(filePath)

      expect(httpClientMock.get).toHaveBeenCalledWith(filePath, {
        responseType: 'blob',
        observe: 'response',
      })
      expect(fileSaver.saveAs).toHaveBeenCalledWith(blobData, 'sample.xlsx')
    })

    it('should show error snackbar when download fails', () => {
      const filePath = '/test/path'
      httpClientMock.get.mockReturnValue(throwError('Download error'))

      service.downloadWithDispositionName(filePath)

      expect(httpClientMock.get).toHaveBeenCalled()
      expect(matSnackBarMock.open).toHaveBeenCalledWith('Could not download the file')
    })

    it('should set loading state to true during download and false after completion', (done) => {
      const filePath = '/test/path'
      const blobData = new Blob(['test content'], { type: 'text/csv' })
      const headers = new HttpHeaders()
      const response = new HttpResponse({
        body: blobData,
        headers,
      })

      httpClientMock.get.mockReturnValue(of(response))

      const loadingStates: boolean[] = []
      service.isLoading().subscribe((state) => {
        loadingStates.push(state)
        if (loadingStates.length === 3) {
          expect(loadingStates).toEqual([false, true, false])
          done()
        }
      })

      service.downloadWithDispositionName(filePath)
    })
  })

  describe('downloadReport', () => {
    it('should download report with correct filename', () => {
      const id = '123'
      const name = 'users.csv'
      const reportData = {
        report: {
          data: [65, 66, 67], // ASCII values for 'ABC'
        },
      }

      httpClientMock.get.mockReturnValue(of(reportData))

      service.downloadReport(id, name)

      expect(httpClientMock.get).toHaveBeenCalledWith('/apis/protected/v8/admin/userRegistration/bulkUploadReport/123')
      expect(fileSaver.saveAs).toHaveBeenCalled()
      // Verify blob was created with correct data
      const blobArg: any = (fileSaver.saveAs as unknown as jest.Mock).mock.calls[0][0]
      expect(blobArg).toBeInstanceOf(Blob)
      expect((fileSaver.saveAs as unknown as jest.Mock).mock.calls[0][1]).toBe('users-report.csv')
    })
  })

  describe('remove', () => {
    it('should remove a file', () => {
      const fileName = 'test.csv'
      httpClientMock.delete.mockReturnValue(of(undefined))

      service.remove(fileName)

      expect(httpClientMock.delete).toHaveBeenCalledWith('/files/${fileName}')
    })
  })

  describe('validateFile', () => {
    it('should return true for valid file formats (csv)', () => {
      expect(service.validateFile('test.csv')).toBe(true)
    })

    it('should return false for invalid file formats', () => {
      expect(service.validateFile('test.txt')).toBe(false)
      expect(service.validateFile('test.pdf')).toBe(false)
    })
  })

  describe('validateExcelFile', () => {
    it('should return true for valid Excel file types', () => {
      expect(service.validateExcelFile('application/vnd.ms-excel')).toBe(true)
      expect(service.validateExcelFile('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toBe(true)
    })

    it('should return false for invalid Excel file types', () => {
      expect(service.validateExcelFile('application/pdf')).toBe(false)
      expect(service.validateExcelFile('text/plain')).toBe(false)
    })
  })

  describe('getBulkUploadData', () => {
    it('should get bulk upload data', async () => {
      const mockResponse = { data: [] }
      httpClientMock.get.mockReturnValue(of(mockResponse))

      const result = await service.getBulkUploadData()

      expect(httpClientMock.get).toHaveBeenCalledWith('/apis/proxies/v8/user/v1/bulkupload')
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getBulkUploadDataV1', () => {
    it('should get bulk upload data with root org id', (done) => {
      const rootOrgId = 'org123'
      const mockResponse = { data: [] }

      httpClientMock.get.mockReturnValue(of(mockResponse))

      service.getBulkUploadDataV1(rootOrgId).subscribe((response) => {
        expect(response).toEqual(mockResponse)
        expect(httpClientMock.get).toHaveBeenCalledWith('/apis/proxies/v8/user/v1/bulkupload/org123')
        done()
      })
    })
  })

  describe('getBulkApprovalUploadDataV1', () => {
    it('should get bulk approval upload data', (done) => {
      const mockResponse = { data: [] }

      httpClientMock.get.mockReturnValue(of(mockResponse))

      service.getBulkApprovalUploadDataV1().subscribe((response) => {
        expect(response).toEqual(mockResponse)
        expect(httpClientMock.get).toHaveBeenCalledWith('/apis/proxies/v8/workflow/admin/bulkupdate/getstatus')
        done()
      })
    })
  })

  describe('uploadApproval', () => {
    it('should upload approval file and return the response', (done) => {
      const fileName = 'test.csv'
      const formData = new FormData()
      const mockResponse = { success: true }

      httpClientMock.post.mockReturnValue(of(mockResponse))

      service.uploadApproval(fileName, formData).subscribe((response) => {
        expect(response).toEqual(mockResponse)
        expect(httpClientMock.post).toHaveBeenCalledWith(
          '/apis/proxies/v8/workflow/admin/v2/bulkupdate/transition',
          formData
        )
        done()
      })
    })
  })

  describe('Designation Bulk Upload', () => {
    it('should return correct download sample file URL', () => {
      const frameworkId = 'framework123'
      const url = service.downloadBulkUploadSampleFile(frameworkId)
      expect(url).toBe('/apis/proxies/v8/designation/v1/orgMapping/sample/framework123')
    })

    it('should upload designation bulk file', (done) => {
      const fileName = 'test.xlsx'
      const formData = new FormData()
      const frameworkId = 'framework123'
      const orgId = 'org123'
      const mockResponse = { success: true }

      httpClientMock.post.mockReturnValue(of(mockResponse))

      service.bulkUploadDesignation(fileName, formData, frameworkId, orgId).subscribe((response) => {
        expect(response).toEqual(mockResponse)
        expect(httpClientMock.post).toHaveBeenCalledWith(
          '/apis/proxies/v8/designation/v1/orgMapping/bulkUpload/org123/framework123',
          formData
        )
        done()
      })
    })

    it('should get bulk designation upload data', (done) => {
      const rootOrgId = 'org123'
      const mockResponse = { data: [] }

      httpClientMock.get.mockReturnValue(of(mockResponse))

      service.getBulkDesignationUploadData(rootOrgId).subscribe((response) => {
        expect(response).toEqual(mockResponse)
        expect(httpClientMock.get).toHaveBeenCalledWith(
          '/apis/proxies/v8/designation/v1/orgMapping/bulkUpload/progress/details/org123'
        )
        done()
      })
    })

    it('should return correct bulk designation status URL', () => {
      const fileName = 'path/to/file.xlsx'
      const url = service.getBulkDesignationStatus(fileName)
      expect(url).toBe('/apis/proxies/v8/designation/v1/orgMapping/download/path/to/file.xlsx')
    })
  })

  describe('Competency Designation Bulk Upload', () => {
    it('should return correct download competency sample file URL', () => {
      const frameworkId = 'framework123'
      const url = service.downloadBulkUploadCompetencySampleFile(frameworkId)
      expect(url).toBe('/apis/proxies/v8/organisation/v1/getCompetencyDesignationMappingFile/sample/framework123')
    })

    it('should upload competency bulk file', (done) => {
      const fileName = 'test.xlsx'
      const formData = new FormData()
      const frameworkId = 'framework123'
      const mockResponse = { success: true }

      httpClientMock.post.mockReturnValue(of(mockResponse))

      service.bulkUploadCompetency(fileName, formData, frameworkId).subscribe((response) => {
        expect(response).toEqual(mockResponse)
        expect(httpClientMock.post).toHaveBeenCalledWith(
          '/apis/proxies/v8/organisation/v1/competencyDesignationMappings/bulkUpload/framework123',
          formData
        )
        done()
      })
    })

    it('should get bulk competency upload data', (done) => {
      const rootOrgId = 'org123'
      const mockResponse = { data: [] }

      httpClientMock.get.mockReturnValue(of(mockResponse))

      service.getBulkCompetencyUploadData(rootOrgId).subscribe((response) => {
        expect(response).toEqual(mockResponse)
        expect(httpClientMock.get).toHaveBeenCalledWith(
          '/apis/proxies/v8/organisation/v1/competencyDesignationMappings/bulkUpload/progress/details/org123'
        )
        done()
      })
    })

    it('should return correct bulk competency status URL', () => {
      const fileName = 'path/to/file.xlsx'
      const url = service.getBulkCompetencyStatus(fileName)
      expect(url).toBe('/apis/proxies/v8/organisation/v1/competencyDesignationMappings/download/path/to/file.xlsx')
    })
  })
})