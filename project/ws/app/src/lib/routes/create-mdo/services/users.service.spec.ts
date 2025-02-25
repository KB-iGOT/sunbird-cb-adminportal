import { UsersService } from './users.service'
import { of } from 'rxjs'

// Mock HttpClient
class MockHttpClient {
  get = jest.fn();
  post = jest.fn();
}

describe('UsersService', () => {
  let service: UsersService
  let mockHttpClient: MockHttpClient

  beforeEach(() => {
    // Create a new instance of the mock HttpClient before each test
    mockHttpClient = new MockHttpClient()
    service = new UsersService(mockHttpClient as any)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should call getUsers and return data', (done) => {
    const role = 'admin'
    const mockResponse = [{ name: 'John Doe', role: 'admin' }]

    // Mock the get method
    mockHttpClient.get.mockReturnValue(of(mockResponse))

    service.getUsers(role).subscribe(response => {
      expect(response).toEqual(mockResponse)
      expect(mockHttpClient.get).toHaveBeenCalledWith(`/apis/protected/v8/user/roles/getUsersV2/${role}/`)
      done()
    })
  })

  it('should call getUsersByDepartment and return data', (done) => {
    const userId = '123'
    const mockResponse = [{ name: 'Jane Doe', department: 'HR' }]

    mockHttpClient.get.mockReturnValue(of(mockResponse))

    service.getUsersByDepartment(userId).subscribe(response => {
      expect(response).toEqual(mockResponse)
      expect(mockHttpClient.get).toHaveBeenCalledWith(`/apis/protected/v8/portal/spv/department/${userId}/?allUsers=true`)
      done()
    })
  })

  it('should call getAllKongUsers and return data', (done) => {
    const depId = '456'
    const mockResponse = [{ name: 'Kong User', depId: '456' }]
    const reqBody = {
      request: {
        filters: {
          rootOrgId: depId,
        },
      },
    }

    mockHttpClient.post.mockReturnValue(of(mockResponse))

    service.getAllKongUsers(depId).subscribe(response => {
      expect(response).toEqual(mockResponse)
      expect(mockHttpClient.post).toHaveBeenCalledWith(`/apis/proxies/v8/user/v1/search`, reqBody)
      done()
    })
  })

  it('should call searchUserByenter and return data', (done) => {
    const value = 'John'
    const rootOrgId = '123'
    const mockResponse = [{ name: 'John Doe' }]
    const reqBody = {
      request: {
        query: value,
        filters: {
          rootOrgId,
        },
      },
    }

    mockHttpClient.post.mockReturnValue(of(mockResponse))

    service.searchUserByenter(value, rootOrgId).subscribe(response => {
      expect(response).toEqual(mockResponse)
      expect(mockHttpClient.post).toHaveBeenCalledWith(`/apis/proxies/v8/user/v1/search`, reqBody)
      done()
    })
  })

  it('should call getUserDetails and return data', (done) => {
    const userID = '789'
    const mockResponse = { name: 'John Doe', id: '789' }

    mockHttpClient.get.mockReturnValue(of(mockResponse))

    service.getUserDetails(userID).subscribe(response => {
      expect(response).toEqual(mockResponse)
      expect(mockHttpClient.get).toHaveBeenCalledWith(`/apis/proxies/v8/api/user/v2/read/${userID}`)
      done()
    })
  })

  it('should call sendOtp and return data', (done) => {
    const value = '12345'
    const type = 'mobile'
    const mockResponse = { otpSent: true }
    const reqObj = {
      request: {
        type,
        key: value,
      },
    }

    mockHttpClient.post.mockReturnValue(of(mockResponse))

    service.sendOtp(value, type).subscribe(response => {
      expect(response).toEqual(mockResponse)
      expect(mockHttpClient.post).toHaveBeenCalledWith('/apis/proxies/v8/otp/v1/generate', reqObj)
      done()
    })
  })

  it('should call resendOtp and return data', (done) => {
    const value = '12345'
    const type = 'mobile'
    const mockResponse = { otpResent: true }
    const reqObj = {
      request: {
        type,
        key: value,
      },
    }

    mockHttpClient.post.mockReturnValue(of(mockResponse))

    service.resendOtp(value, type).subscribe(response => {
      expect(response).toEqual(mockResponse)
      expect(mockHttpClient.post).toHaveBeenCalledWith('/apis/proxies/v8/otp/v1/generate', reqObj)
      done()
    })
  })

  it('should call verifyOTP and return data', (done) => {
    const otp = 123456
    const value = '12345'
    const type = 'mobile'
    const mockResponse = { otpVerified: true }
    const reqObj = {
      request: {
        otp,
        type,
        key: value,
      },
    }

    mockHttpClient.post.mockReturnValue(of(mockResponse))

    service.verifyOTP(otp, value, type).subscribe(response => {
      expect(response).toEqual(mockResponse)
      expect(mockHttpClient.post).toHaveBeenCalledWith('/apis/proxies/v8/otp/v1/verify', reqObj)
      done()
    })
  })
})
