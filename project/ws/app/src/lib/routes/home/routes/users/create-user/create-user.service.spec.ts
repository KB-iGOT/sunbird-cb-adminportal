import { CreateUserService } from './create-user.service'
import { IUserForm } from '../users.model'
import { of, throwError } from 'rxjs'

describe('CreateUserService', () => {
  let service: CreateUserService
  let http: any

  beforeEach(() => {
    http = { post: jest.fn() }
    service = new CreateUserService(http)
    jest.clearAllMocks()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('createUser', () => {
    const mockUserData: IUserForm = {
      username: 'testuser',
      email: 'testuser@example.com',
      org: '',
      firstName: '',
    }

    it('should call http.post with the correct URL and data (keycloak=true)', (done) => {
      const apiUrl = `/apis/protected/v8/user/users/createuser?keycloak=true`
      const mockResponse = { success: true }
      http.post.mockReturnValue(of(mockResponse))

      service.createUser(mockUserData, true).subscribe(response => {
        expect(http.post).toHaveBeenCalledWith(apiUrl, mockUserData)
        expect(response).toEqual(mockResponse)
        done()
      })
    })

    it('should call http.post with keycloak=false when false is passed', (done) => {
      const apiUrl = `/apis/protected/v8/user/users/createuser?keycloak=false`
      http.post.mockReturnValue(of({}))

      service.createUser(mockUserData, false).subscribe(() => {
        expect(http.post).toHaveBeenCalledWith(apiUrl, mockUserData)
        done()
      })
    })

    it('should return observable from createUser', () => {
      http.post.mockReturnValue(of({}))
      const result = service.createUser(mockUserData, true)
      expect(result).toBeDefined()
      expect(typeof result.subscribe).toBe('function')
    })

    it('should propagate error when http.post fails', (done) => {
      const errorResponse = new Error('Something went wrong')
      http.post.mockReturnValue(throwError(errorResponse))

      service.createUser(mockUserData, true).subscribe({
        next: () => fail('should have errored'),
        error: error => {
          expect(error).toEqual(errorResponse)
          done()
        },
      })
    })
  })
})
