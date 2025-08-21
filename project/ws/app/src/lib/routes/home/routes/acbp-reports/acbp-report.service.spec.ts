import { AcbpReportsService } from './acbp-reports.service'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { HttpClient } from '@angular/common/http'
import { of } from 'rxjs'

// Mocking dependencies
jest.mock('@sunbird-cb/utils-v2', () => ({
  ConfigurationsService: jest.fn().mockImplementation(() => ({
    baseUrl: 'http://mockBaseUrl',
  })),
}))

jest.mock('@angular/common/http', () => ({
  HttpClient: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
  })),
}))

describe('AcbpReportsService', () => {
  let acbpReportsService: AcbpReportsService
  let configSvc: ConfigurationsService
  let http: HttpClient

  beforeEach(() => {
    configSvc = new ConfigurationsService()
    http = new HttpClient(null as any) // Mocked, so no real HttpClient is needed
    acbpReportsService = new AcbpReportsService(configSvc, http)
  })

  it('should be created', () => {
    expect(acbpReportsService).toBeTruthy()
  })

  describe('getAcbpContent', () => {
    it('should call HttpClient.get with the correct URL', () => {
      const mockResponse = { data: 'some data' }
      const url = 'http://mockBaseUrl/feature/acbp-reports.json';
      (http.get as jest.Mock).mockReturnValue(of(mockResponse)) // Mocking the HTTP response

      acbpReportsService.getAcbpContent().subscribe(response => {
        expect(response).toEqual(mockResponse)
        expect(http.get).toHaveBeenCalledWith(url)
      })
    })
  })

  describe('getAcbpReportContnet', () => {
    it('should call HttpClient.get with the correct URL and date', () => {
      const mockResponse = { data: 'report data' }
      const reportDate = '2025-03-03'
      const url = `/apis/proxies/v8/storage/v1/spvReportInfo/${reportDate}`;
      (http.get as jest.Mock).mockReturnValue(of(mockResponse)) // Mocking the HTTP response

      acbpReportsService.getAcbpReportContnet(reportDate).subscribe(response => {
        expect(response).toEqual(mockResponse)
        expect(http.get).toHaveBeenCalledWith(url)
      })
    })
  })
})
