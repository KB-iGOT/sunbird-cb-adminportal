import { UsersService } from './users.service'
import { HttpClient } from '@angular/common/http'
import { of } from 'rxjs'

// Mock HttpClient
class HttpClientMock {
  get = jest.fn();
}

describe('UsersService', () => {
  let usersService: UsersService
  let httpClientMock: HttpClientMock

  beforeEach(() => {
    // Create the mock HttpClient
    httpClientMock = new HttpClientMock()
    // Create the UsersService instance with the mocked HttpClient
    usersService = new UsersService(httpClientMock as unknown as HttpClient)
  })

  it('should be created', () => {
    expect(usersService).toBeTruthy()
  })

  it('should call http.get() when getUsers is called', () => {
    // Arrange: Prepare a mock return value for the HttpClient's get method
    const mockRole = 'admin'
    const mockResponse = [{ id: 1, name: 'John Doe' }]
    httpClientMock.get.mockReturnValue(of(mockResponse))

    // Act: Call the getUsers method
    usersService.getUsers(mockRole).subscribe(response => {
      // Assert: Check that the response matches the mock data
      expect(response).toEqual(mockResponse)
    })

    // Assert: Check if http.get() was called with the correct URL
    expect(httpClientMock.get).toHaveBeenCalledWith('/apis/protected/v8/user/roles/getUsersV2/admin/')
  })
})
