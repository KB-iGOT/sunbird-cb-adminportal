import { GeneralReportsService } from './general-reports.service'
import { HttpClient } from '@angular/common/http'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { of } from 'rxjs'

jest.mock('@angular/common/http')
jest.mock('@sunbird-cb/utils-v2')

describe('GeneralReportsService', () => {
  let service: GeneralReportsService
  let mockConfigSvc: ConfigurationsService
  let mockHttpClient: HttpClient

  beforeEach(() => {
    mockConfigSvc = new ConfigurationsService() as any
    mockHttpClient = new HttpClient(null as any) // HttpClient mock

    service = new GeneralReportsService(mockConfigSvc, mockHttpClient)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('getContent', () => {
    it('should call http.get with correct URL', () => {
      const mockBaseUrl = 'https://mock.base.url'
      mockConfigSvc.baseUrl = mockBaseUrl

      const mockResponse = { data: 'test' }
      mockHttpClient.get = jest.fn().mockReturnValue(of(mockResponse))

      service.getContent().subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(mockHttpClient.get).toHaveBeenCalledWith(`${mockBaseUrl}/feature/general-reports.json`)
    })
  })

  describe('getReportContnet', () => {
    it('should call http.get with correct URL based on rdate', () => {
      const mockRdate = '2025-02-25'
      const mockResponse = { report: 'test report' }
      mockHttpClient.get = jest.fn().mockReturnValue(of(mockResponse))

      service.getReportContnet(mockRdate).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(mockHttpClient.get).toHaveBeenCalledWith(`/apis/proxies/v8/storage/v1/spvReportInfo/${mockRdate}`)
    })
  })
})
