import { RolesAccessService } from './roles-access.service'
import { HttpClient } from '@angular/common/http'
import { of } from 'rxjs'

describe('RolesAccessService', () => {
  let service: RolesAccessService
  let httpClientMock: jest.Mocked<HttpClient>

  beforeEach(() => {
    // Create a mock of HttpClient
    httpClientMock = {
      get: jest.fn(),
    } as any // Casting to match HttpClient type

    // Initialize the service with the mock HttpClient
    service = new RolesAccessService(httpClientMock)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should call HttpClient.get and return roles data', () => {
    // Create mock response data
    const mockResponse = { roleCount: 5 }

    // Mock the behavior of httpClient.get to return the mock data
    httpClientMock.get.mockReturnValue(of(mockResponse))

    // Call the service method
    service.getRoles().subscribe(response => {
      // Assert that the response matches the mock data
      expect(response).toEqual(mockResponse)
    })

    // Assert that HttpClient.get was called with the correct URL
    expect(httpClientMock.get).toHaveBeenCalledWith('/apis/protected/v8/user/roles/rolesv2/usercount')
  })
})
