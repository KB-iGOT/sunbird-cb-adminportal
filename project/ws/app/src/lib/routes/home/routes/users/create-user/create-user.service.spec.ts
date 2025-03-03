import { CreateUserService } from './create-user.service'
import { HttpClient } from '@angular/common/http'
import { IUserForm } from '../users.model'
import { of, throwError } from 'rxjs'

jest.mock('@angular/common/http', () => ({
  HttpClient: jest.fn(),
}))

describe('CreateUserService', () => {
  let service: CreateUserService
  let httpClientMock: jest.Mocked<HttpClient>

  beforeEach(() => {
    httpClientMock = new HttpClient(null as any) as jest.Mocked<HttpClient>
    service = new CreateUserService(httpClientMock)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('createUser', () => {
    const mockUserData: IUserForm = {
      username: 'testuser',
      email: 'testuser@example.com',
      password: 'Test@1234',
      org: '',
      firstName: ''
    }

    const keycloak = true

    it('should call http.post with the correct URL and data', () => {
      // Arrange
      const apiUrl = `/apis/protected/v8/user/users/createuser?keycloak=${keycloak}`
      const mockResponse = { success: true }
      httpClientMock.post.mockReturnValue(of(mockResponse))

      // Act
      service.createUser(mockUserData, keycloak).subscribe((response) => {
        // Assert
        expect(httpClientMock.post).toHaveBeenCalledWith(apiUrl, mockUserData)
        expect(response).toEqual(mockResponse)
      })
    })

    it('should handle error correctly when http.post fails', () => {
      // Arrange
      const errorResponse = new Error('Something went wrong')
      httpClientMock.post.mockReturnValue(throwError(() => errorResponse))

      // Act & Assert
      service.createUser(mockUserData, keycloak).subscribe({
        next: () => {
          // This should not be called
        },
        error: (error) => {
          expect(error).toEqual(errorResponse)
        },
      })
    })
  })
})
