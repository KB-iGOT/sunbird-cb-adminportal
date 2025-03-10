
import { HttpClient } from '@angular/common/http'
import { of } from 'rxjs'
import { UserViewPopUpService } from './ui-user-table-pop-up.services'

// Mock HttpClient
jest.mock('@angular/common/http', () => ({
  HttpClient: jest.fn(),
}))

describe('UserViewPopUpService', () => {
  let service: UserViewPopUpService
  let httpClientMock: HttpClient

  beforeEach(() => {
    httpClientMock = new HttpClient(null as any) // Mock HttpClient instance
    service = new UserViewPopUpService(httpClientMock)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should call the correct API endpoint and return users by department', (done) => {
    const searchString = 'IT'
    const mockResponse = [{ id: 1, name: 'John Doe' }, { id: 2, name: 'Jane Doe' }]

    // Mocking the HttpClient's get method
    httpClientMock.get = jest.fn().mockReturnValue(of(mockResponse))

    service.getAllUsersByDepartments(searchString).subscribe((response: any) => {
      // Check the URL and response
      expect(httpClientMock.get).toHaveBeenCalledWith(
        '/apis/proxies/v8/user/v1/autocomplete/IT'
      )
      expect(response).toEqual(mockResponse)
      done()
    })
  })
})
