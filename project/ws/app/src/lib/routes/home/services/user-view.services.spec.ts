
import { HttpClient } from '@angular/common/http'
import { of } from 'rxjs'
import { UserViewService } from './user-view.services'

// Mock HttpClient
jest.mock('@angular/common/http', () => ({
  HttpClient: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
  })),
}))

describe('UserViewService', () => {
  let userViewService: UserViewService
  let httpClientMock: HttpClient

  beforeEach(() => {
    // Create an instance of the mock HttpClient
    httpClientMock = new HttpClient(null as any)
    userViewService = new UserViewService(httpClientMock)
  })

  it('should be created', () => {
    expect(userViewService).toBeTruthy()
  })

  it('should call http.get with the correct URL when getAllDepartments is called', () => {
    const mockResponse = { data: 'some data' };
    // Mock the get method to return an observable with a mock response
    (httpClientMock.get as jest.Mock).mockReturnValue(of(mockResponse))

    userViewService.getAllDepartments().subscribe((response: any) => {
      expect(response).toEqual(mockResponse)
    })

    expect(httpClientMock.get).toHaveBeenCalledWith('/apis/protected/v8/portal/spv/department/1?allUsers=true')
  })
})
