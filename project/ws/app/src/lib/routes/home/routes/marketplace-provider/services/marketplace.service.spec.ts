import { of, throwError } from 'rxjs'
import { apiErrorMessage, MarketplaceService } from './marketplace.service'
import { environment } from '../../../../../../../../../../src/environments/environment'

describe('MarketplaceService', () => {
  let service: MarketplaceService
  let httpClient: any

  beforeEach(() => {
    httpClient = {
      get: jest.fn(() => of({})),
      post: jest.fn(() => of({})),
      put: jest.fn(() => of({})),
      delete: jest.fn(() => of({})),
    }
    service = new MarketplaceService(httpClient)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should create a provider', () => {
    const formBody = { licenseType: 'User' }
    service.createProvider(formBody)
    expect(httpClient.post).toHaveBeenCalledWith('/apis/proxies/v8/contentpartner/v2/create', formBody)
  })

  it('should update a provider', () => {
    const formBody = { licenseType: 'Course' }
    service.updateProvider(formBody)
    expect(httpClient.post).toHaveBeenCalledWith('/apis/proxies/v8/contentpartner/v2/update', formBody)
  })

  it('should upload a thumbnail using the file from the given form data', () => {
    const file = new File(['content'], 'icon.png', { type: 'image/png' })
    const icon: any = { get: jest.fn(() => file) }

    service.uploadThumbNail(icon)

    expect(httpClient.post).toHaveBeenCalledWith(
      'apis/proxies/v8/storage/v1/uploadCiosIcon',
      expect.any(FormData)
    )
    const uploadedFormData = httpClient.post.mock.calls[0][1]
    expect((uploadedFormData.get('file') as File).name).toBe(file.name)
  })

  it('should upload a CIOS contract using the file from the given form data', () => {
    const file = new File(['content'], 'contract.pdf', { type: 'application/pdf' })
    const data: any = { get: jest.fn(() => file) }

    service.uploadCIOSContract(data)

    expect(httpClient.post).toHaveBeenCalledWith(
      '/apis/proxies/v8/storage/v1/uploadCiosContract',
      expect.any(FormData)
    )
    const uploadedFormData = httpClient.post.mock.calls[0][1]
    expect((uploadedFormData.get('file') as File).name).toBe(file.name)
  })

  it('should get the providers list', () => {
    const formBody = { page: 1 }
    service.getProvidersList(formBody)
    expect(httpClient.post).toHaveBeenCalledWith('/apis/proxies/v8/contentpartner/v1/search', formBody)
  })

  it('should delete a provider', () => {
    service.deleteProvider('provider-1')
    expect(httpClient.delete).toHaveBeenCalledWith('/apis/proxies/v8/contentpartner/v1/delete/provider-1')
  })

  it('should activate a provider', () => {
    const formBody = { id: 'provider-1' }
    service.activateProvider(formBody)
    expect(httpClient.put).toHaveBeenCalledWith('/apis/proxies/v8/contentpartner/v1/activate', formBody)
  })

  it('should get provider details', () => {
    service.getProviderDetails('provider-1')
    expect(httpClient.get).toHaveBeenCalledWith('/apis/proxies/v8/contentpartner/v1/read/provider-1')
  })

  it('should get the groups list', () => {
    service.getGroupsList()
    expect(httpClient.get).toHaveBeenCalledWith('/apis/proxies/v8/user/v1/groups')
  })

  it('should get the content list for a provider', () => {
    service.getContentList('provider-1')
    expect(httpClient.get).toHaveBeenCalledWith('/apis/proxies/v8/ciosIntegration/v1/file/info/provider-1')
  })

  it('should upload content using the file from the given form data', () => {
    const file = new File(['content'], 'content.xlsx')
    const data: any = { get: jest.fn(() => file) }

    service.uploadContent(data, 'partner-code', 'partner-1')

    expect(httpClient.post).toHaveBeenCalledWith(
      '/apis/proxies/v8/ciosIntegration/v1/loadContentFromExcel/partner-code/partner-1',
      expect.any(FormData)
    )
    const uploadedFormData = httpClient.post.mock.calls[0][1]
    expect((uploadedFormData.get('file') as File).name).toBe(file.name)
  })

  it('should upload progress using the file from the given form data', () => {
    const file = new File(['content'], 'progress.xlsx')
    const data: any = { get: jest.fn(() => file) }

    service.uploadProgress(data, 'partner-code')

    expect(httpClient.post).toHaveBeenCalledWith(
      '/apis/proxies/v8/ciosIntegration/v1/loadContentProgressFromExcel/partner-code',
      expect.any(FormData)
    )
    const uploadedFormData = httpClient.post.mock.calls[0][1]
    expect((uploadedFormData.get('file') as File).name).toBe(file.name)
  })

  describe('convertResourceUrl', () => {
    it('should return an empty string when no url is given', () => {
      expect(service.convertResourceUrl()).toBe('')
      expect(service.convertResourceUrl('')).toBe('')
    })

    it('should return the original value when it is not a valid url', () => {
      expect(service.convertResourceUrl('not-a-valid-url')).toBe('not-a-valid-url')
    })

    it('should return the original url when there is no resource path after the host', () => {
      expect(service.convertResourceUrl('https://example.com')).toBe('https://example.com')
    })

    it('should rebuild the url against the content host when a resource path is present', () => {
      const result = service.convertResourceUrl('https://example.com/resource/path/to/file')
      expect(result).toBe(`${environment.contentHost}/content-store/path/to/file`)
    })
  })

  it('should get the courses list', () => {
    const formBody = { providerId: 'provider-1' }
    service.getCoursesList(formBody)
    expect(httpClient.post).toHaveBeenCalledWith('apis/proxies/v8/ciosIntegration/v1/search/content', formBody)
  })

  it('should delete unpublished courses with a text response type', () => {
    const formBody = { providerId: 'provider-1' }
    service.deleteUnPublishedCourses(formBody)
    expect(httpClient.post).toHaveBeenCalledWith(
      'apis/proxies/v8/ciosIntegration/v1/deleteContent',
      formBody,
      { responseType: 'text' }
    )
  })

  it('should download logs with a blob response type', () => {
    service.downloadLogs('log-file.gz')
    expect(httpClient.get).toHaveBeenCalledWith(
      '/apis/proxies/v8/storage/v1/downloadCiosLogs/log-file.gz',
      { responseType: 'blob' }
    )
  })

  it('should create a configuration', () => {
    const formBody = { key: 'value' }
    service.createConfiguration(formBody)
    expect(httpClient.post).toHaveBeenCalledWith('apis/proxies/v8/serviceregistry/config/create', formBody)
  })

  it('should update a configuration', () => {
    const formBody = { key: 'value' }
    service.updateConfiguration(formBody)
    expect(httpClient.post).toHaveBeenCalledWith('apis/proxies/v8/serviceregistry/config/update', formBody)
  })

  it('should get configuration details', () => {
    service.getConfiguraionDetails('config-1')
    expect(httpClient.get).toHaveBeenCalledWith('apis/proxies/v8/serviceregistry/config/read/config-1')
  })

  it('should get the SSO configuration for a partner', () => {
    service.getSSOConfiguration('partner-1')
    expect(httpClient.get).toHaveBeenCalledWith('/apis/proxies/v8/sso/read/partner-1')
  })

  it('should create the SSO configuration for a partner', () => {
    const formBody = { enabled: true }
    service.createSSOConfiguration('partner-1', formBody)
    expect(httpClient.post).toHaveBeenCalledWith('/apis/proxies/v8/sso/create/partner-1', formBody)
  })

  it('should update the SSO configuration for a partner', () => {
    const formBody = { enabled: false }
    service.updateSSOConfiguration('partner-1', formBody)
    expect(httpClient.post).toHaveBeenCalledWith('/apis/proxies/v8/sso/update/partner-1', formBody)
  })

  it('should run the LTI SSO test for a partner code', () => {
    service.ltiSSOTest('partner-code')
    expect(httpClient.get).toHaveBeenCalledWith('/apis/proxies/v8/ciosIntegration/lti/ssotest/partner-code')
  })

  it('should test the SSO configuration', () => {
    const formBody = { samlResponse: 'response' }
    service.testSSOConfiguration(formBody)
    expect(httpClient.post).toHaveBeenCalledWith('/apis/proxies/v8/sso/validateSaml', formBody)
  })

  it('should list registered content providers', () => {
    const formBody = { page: 1 }
    service.contentRegisterList(formBody)
    expect(httpClient.post).toHaveBeenCalledWith('/apis/proxies/v8/contentpartner/register/v1/search', formBody)
  })

  it('should change the status of a registered provider', () => {
    const formBody = { id: 'provider-1', status: 'active' }
    service.changeStatusRegisterProvider(formBody)
    expect(httpClient.post).toHaveBeenCalledWith('/apis/proxies/v8/contentpartner/register/v1/update', formBody)
  })

  it('should get the details of a registered provider', () => {
    service.readRegisteredProviderDetails('provider-1')
    expect(httpClient.get).toHaveBeenCalledWith('/apis/proxies/v8/contentpartner/register/v1/readbyid?id=provider-1')
  })

  describe('downloadAssetFile', () => {
    it('should create, click and remove an anchor element using the given file name', () => {
      const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
      let capturedLink: any
      const appendSpy = jest.spyOn(document.body, 'appendChild').mockImplementation((node: any) => {
        capturedLink = node
        return node
      })
      const removeSpy = jest.spyOn(document.body, 'removeChild').mockImplementation((node: any) => node)

      service.downloadAssetFile('https://example.com/path/file.pdf', 'custom.pdf')

      expect(capturedLink.download).toBe('custom.pdf')
      expect(capturedLink.href).toBe('https://example.com/path/file.pdf')
      expect(capturedLink.target).toBe('_blank')
      expect(clickSpy).toHaveBeenCalled()
      expect(removeSpy).toHaveBeenCalledWith(capturedLink)

      clickSpy.mockRestore()
      appendSpy.mockRestore()
      removeSpy.mockRestore()
    })

    it('should fall back to the last segment of the asset path when no file name is given', () => {
      const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
      let capturedLink: any
      const appendSpy = jest.spyOn(document.body, 'appendChild').mockImplementation((node: any) => {
        capturedLink = node
        return node
      })
      const removeSpy = jest.spyOn(document.body, 'removeChild').mockImplementation((node: any) => node)

      service.downloadAssetFile('https://example.com/path/file.pdf')

      expect(capturedLink.download).toBe('file.pdf')

      clickSpy.mockRestore()
      appendSpy.mockRestore()
      removeSpy.mockRestore()
    })

    it('should fall back to a default file name when the asset path has no file segment', () => {
      const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
      let capturedLink: any
      const appendSpy = jest.spyOn(document.body, 'appendChild').mockImplementation((node: any) => {
        capturedLink = node
        return node
      })
      const removeSpy = jest.spyOn(document.body, 'removeChild').mockImplementation((node: any) => node)

      service.downloadAssetFile('https://example.com/path/')

      expect(capturedLink.download).toBe('file')

      clickSpy.mockRestore()
      appendSpy.mockRestore()
      removeSpy.mockRestore()
    })
  })

  describe('provider access apis', () => {
    it('should read the access settings and the notification settings of a provider', () => {
      service.readProviderAccessSettings('partner-1').subscribe()
      service.readNotificationSettings('partner-1').subscribe()

      expect(httpClient.get).toHaveBeenCalledWith('/apis/proxies/v8/accessSettings/provider/v1/read/partner-1')
      expect(httpClient.get).toHaveBeenCalledWith('/apis/proxies/v8/accessSettings/provider/v1/notification/read/partner-1')
    })

    it('should give back what a read answers', () => {
      const response = { result: { accessControl: { userGroups: [] } } }
      httpClient.get.mockReturnValueOnce(of(response))
      let result: any
      service.readProviderAccessSettings('partner-1').subscribe(value => result = value)
      expect(result).toBe(response)
    })

    it('should pass a failed read on, so the page can show what the api says', () => {
      const failure = { status: 400, error: { params: { errMsg: 'Invalid partnerId' } } }
      httpClient.get.mockReturnValueOnce(throwError(failure))
      let error: any
      service.readProviderAccessSettings('partner-1').subscribe({ error: e => error = e })
      expect(error).toBe(failure)
    })

    it('should put the access settings and the notification settings to their upserts', () => {
      const accessBody = { partnerId: 'partner-1', accessControl: { userGroups: [] } }
      const notificationBody = { partnerId: 'partner-1', recipients: [] }

      service.upsertProviderAccessSettings(accessBody).subscribe()
      service.upsertNotificationSettings(notificationBody).subscribe()

      expect(httpClient.put).toHaveBeenCalledWith('/apis/proxies/v8/accessSettings/provider/v1/upsert', accessBody)
      expect(httpClient.put).toHaveBeenCalledWith('/apis/proxies/v8/accessSettings/provider/v1/notification/upsert', notificationBody)
    })

    it('should save the preference with the rest of the provider details, leaving the details given untouched', () => {
      const providerDetails = { id: 'partner-1', data: { licenseType: 'User', providerPreference: false } }

      service.updateProviderPreference(providerDetails, true).subscribe()

      expect(httpClient.post).toHaveBeenCalledWith('/apis/proxies/v8/contentpartner/v2/update', {
        id: 'partner-1',
        data: { licenseType: 'User', providerPreference: true },
      })
      expect(providerDetails.data.providerPreference).toBe(false)
    })

    it('should add the data of the provider when it has none', () => {
      service.updateProviderPreference({ id: 'partner-1' }, false).subscribe()
      expect(httpClient.post).toHaveBeenCalledWith('/apis/proxies/v8/contentpartner/v2/update', {
        id: 'partner-1',
        data: { providerPreference: false },
      })
    })
  })

  describe('apiErrorMessage', () => {
    const fallback = 'Something went wrong, please try again later'

    it('should give the errMsg of the service, trimmed', () => {
      expect(apiErrorMessage({ error: { params: { errMsg: '  Invalid partnerId  ' } } })).toBe('Invalid partnerId')
    })

    it('should give the errmsg of the gateway', () => {
      expect(apiErrorMessage({ error: { params: { errmsg: 'Forbidden: API WHITELIST Access is denied' } } }))
        .toBe('Forbidden: API WHITELIST Access is denied')
    })

    it('should give the message of the body when the params carry none', () => {
      expect(apiErrorMessage({ error: { params: { errMsg: ' ' }, message: 'Missing or invalid fields: [accessControl]' } }))
        .toBe('Missing or invalid fields: [accessControl]')
    })

    it('should prefer the errMsg of the service to the other messages', () => {
      expect(apiErrorMessage({ error: { params: { errMsg: 'service', errmsg: 'gateway' }, message: 'body' } })).toBe('service')
    })

    it('should fall back to a general message when the api gives none', () => {
      expect(apiErrorMessage({ status: 404, error: 'Cannot GET /notification/read' })).toBe(fallback)
      expect(apiErrorMessage({ error: { params: { errMsg: null } } })).toBe(fallback)
      expect(apiErrorMessage(new Error('Http failure'))).toBe(fallback)
      expect(apiErrorMessage(undefined)).toBe(fallback)
    })
  })

})
