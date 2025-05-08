import { of } from 'rxjs'
import { DesignationsService } from './designations.service' // adjust the import path as needed
import * as _ from 'lodash'

describe('DesignationsService', () => {
  let service: DesignationsService
  let httpClientSpy: { get: jest.Mock; post: jest.Mock; patch: jest.Mock }
  let configSvcSpy: { orgReadData: any }

  beforeEach(() => {
    httpClientSpy = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn()
    }

    configSvcSpy = {
      orgReadData: null
    }

    service = new DesignationsService(
      httpClientSpy as any,
      configSvcSpy as any
    )
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('createFrameWork', () => {
    it('should call http.get with the correct URL', () => {
      const frameworkName = 'testFramework'
      const orgId = 'org123'
      const termName = 'Test Term'

      httpClientSpy.get.mockReturnValue(of({ result: 'success' }))

      service.createFrameWork(frameworkName, orgId, termName).subscribe(result => {
        expect(result).toEqual({ result: 'success' })
      })

      expect(httpClientSpy.get).toHaveBeenCalledWith(
        `/apis/proxies/v8/org/framework/read?frameworkName=${frameworkName}&orgId=${orgId}&termName=${encodeURIComponent(termName)}`
      )
    })
  })

  describe('getIgotMasterDesignations', () => {
    it('should call http.post and format the response correctly', () => {
      const req = { request: { filters: { status: 'ACTIVE' } } }
      const mockResponse = {
        result: {
          result: {
            data: [
              { id: 'desig1', name: 'Designation 1' },
              { id: 'desig2', name: 'Designation 2' }
            ],
            facets: [],
            totalCount: 2
          }
        }
      }

      httpClientSpy.post.mockReturnValue(of(mockResponse))

      // Set up the service state
      service.orgDesignationList = [{ refId: 'desig1' }]
      service.selectedDesignationList = [{ id: 'desig2' }]

      service.getIgotMasterDesignations(req).subscribe(result => {
        expect(result.formatedDesignationsLsit.length).toBe(2)
        expect(result.formatedDesignationsLsit[0].isOrgDesignation).toBe(true)
        expect(result.formatedDesignationsLsit[0].selected).toBe(false)
        expect(result.formatedDesignationsLsit[1].isOrgDesignation).toBe(false)
        expect(result.formatedDesignationsLsit[1].selected).toBe(true)
      })

      expect(httpClientSpy.post).toHaveBeenCalledWith(
        'apis/proxies/v8/designation/search',
        req
      )
    })
  })

  describe('formateMasterDesignationList', () => {
    it('should format master designation list correctly', () => {
      const response = {
        data: [
          { id: 'desig1', name: 'Designation 1' },
          { id: 'desig2', name: 'Designation 2' },
          { id: 'desig3', name: 'Designation 3' }
        ],
        facets: [],
        totalCount: 3
      }

      // Set up the service state
      service.orgDesignationList = [{ refId: 'desig1' }]
      service.selectedDesignationList = [{ id: 'desig2' }]

      service.formateMasterDesignationList(response).subscribe(result => {
        expect(result.formatedDesignationsLsit.length).toBe(3)

        // First designation should be in org list
        expect(result.formatedDesignationsLsit[0].isOrgDesignation).toBe(true)
        expect(result.formatedDesignationsLsit[0].selected).toBe(false)

        // Second designation should be in selected list
        expect(result.formatedDesignationsLsit[1].isOrgDesignation).toBe(false)
        expect(result.formatedDesignationsLsit[1].selected).toBe(true)

        // Third designation should be in neither list
        expect(result.formatedDesignationsLsit[2].isOrgDesignation).toBe(false)
        expect(result.formatedDesignationsLsit[2].selected).toBe(false)
      })
    })
  })

  describe('getFrameworkInfo', () => {
    it('should call http.get with the correct URL and format the data', () => {
      const frameWorkName = 'testFramework'
      const mockResponse = {
        result: {
          framework: {
            categories: [
              {
                code: 'cat1',
                identifier: 'id1',
                index: 1,
                name: 'Category 1',
                selected: false,
                status: 'ACTIVE',
                description: 'Description 1',
                translations: {},
                category: 'main',
                terms: [
                  {
                    code: 'term1',
                    name: 'Term 1',
                    associations: [],
                    additionalProperties: {
                      importedById: 'user1',
                      importedByName: 'User 1',
                      importedOn: '2023-01-01'
                    }
                  }
                ]
              }
            ]
          }
        }
      }

      httpClientSpy.get.mockReturnValue(of(mockResponse))

      // Spy on the formateData method
      jest.spyOn(service, 'formateData')

      service.getFrameworkInfo(frameWorkName).subscribe()

      expect(httpClientSpy.get).toHaveBeenCalledWith(
        `/apis/proxies/v8/framework/v1/read/${frameWorkName}`,
        { withCredentials: true }
      )
      expect(service.formateData).toHaveBeenCalledWith(mockResponse)
    })
  })

  describe('formateData', () => {
    it('should format framework categories correctly', () => {
      service.userProfile = { userId: 'user1' }
      const response = {
        result: {
          framework: {
            categories: [
              {
                code: 'cat1',
                identifier: 'id1',
                index: 1,
                name: 'Category 1',
                selected: false,
                status: 'ACTIVE',
                description: 'Description 1',
                translations: {},
                category: 'main',
                terms: [
                  {
                    code: 'term1',
                    name: 'Term 1',
                    associations: [],
                    additionalProperties: {
                      importedById: 'user1',
                      importedByName: 'User 1',
                      importedOn: '2023-01-01'
                    }
                  },
                  {
                    code: 'term2',
                    name: 'Term 2',
                    associations: [
                      {
                        code: 'subterm1',
                        name: 'Sub Term 1',
                        additionalProperties: {
                          importedById: 'user2',
                          importedByName: 'User 2',
                          importedOn: '2023-01-02'
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        }
      }

      service.formateData(response)

      expect(service.list.size).toBe(1)
      const category = service.list.get('cat1')
      expect(category).toBeTruthy()
      expect(category.code).toBe('cat1')
      expect(category.children.length).toBe(2)

      // Check first term formatting
      expect(category.children[0].code).toBe('term1')
      expect(category.children[0].importedByName).toBe('You') // Since userProfile.userId matches importedById

      // Check nested association formatting
      expect(category.children[1].children.length).toBe(1)
      expect(category.children[1].children[0].code).toBe('subterm1')
      expect(category.children[1].children[0].importedByName).toBe('User 2')
    })
  })

  describe('getOrgReadData', () => {
    it('should call http.post and update configSvc.orgReadData', () => {
      const organisationId = 'org123'
      const mockResponse = {
        result: {
          response: {
            id: organisationId,
            name: 'Test Org'
          }
        }
      }

      httpClientSpy.post.mockReturnValue(of(mockResponse))

      service.getOrgReadData(organisationId).subscribe(result => {
        expect(result).toEqual(mockResponse.result.response)
        expect(configSvcSpy.orgReadData).toEqual(mockResponse.result.response)
      })

      expect(httpClientSpy.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/org/v1/read',
        {
          request: {
            organisationId
          }
        }
      )
    })
  })

  describe('copyFramework', () => {
    it('should call http.post with the correct URL and map the response', () => {
      const request = { framework: 'testFramework' }
      const mockResponse = {
        result: {
          response: {
            frameworkId: 'fw123'
          }
        }
      }

      httpClientSpy.post.mockReturnValue(of(mockResponse))

      service.copyFramework(request).subscribe(result => {
        expect(result).toEqual(mockResponse.result.response)
      })

      // Note: This assumes environment.ODCSMasterFramework is available in the actual code
      expect(httpClientSpy.post).toHaveBeenCalledWith(
        `/api/framework/v1/copy/undefined`, // Since environment is not mocked, it's undefined
        request
      )
    })
  })

  describe('updateTerms', () => {
    it('should call http.patch with the correct URL', () => {
      const frameworkId = 'fw123'
      const categoryId = 'cat1'
      const categoryTermCode = 'term1'
      const requestBody = { request: { name: 'Updated Term' } }

      httpClientSpy.patch.mockReturnValue(of({ result: 'success' }))

      service.updateTerms(frameworkId, categoryId, categoryTermCode, requestBody).subscribe()

      expect(httpClientSpy.patch).toHaveBeenCalledWith(
        `apis/proxies/v8/framework/v1/term/update/${categoryTermCode}?framework=${frameworkId}&category=${categoryId}`,
        requestBody
      )
    })
  })

  describe('importDesigantion', () => {
    it('should call http.post with the correct URL', () => {
      const framework = 'fw123'
      const category = 'cat1'
      const reqBody = { request: { name: 'New Designation' } }

      httpClientSpy.post.mockReturnValue(of({ result: 'success' }))

      service.importDesigantion(framework, category, reqBody).subscribe()

      expect(httpClientSpy.post).toHaveBeenCalledWith(
        `apis/proxies/v8/designation/create/term?framework=${framework}&category=${category}`,
        reqBody
      )
    })
  })

  describe('deleteDesignation', () => {
    it('should call http.post with the correct URL', () => {
      const frameworkName = 'fw123'
      const category = 'cat1'
      const formBody = { request: { code: 'term1' } }

      httpClientSpy.post.mockReturnValue(of({ result: 'success' }))

      service.deleteDesignation(frameworkName, category, formBody).subscribe()

      expect(httpClientSpy.post).toHaveBeenCalledWith(
        `/apis/proxies/v8/framework/v1/term/retire?framework=${frameworkName}&category=${category}`,
        formBody
      )
    })
  })

  // Utility methods tests
  describe('setUserProfile', () => {
    it('should set the userProfile property', () => {
      const profileDetails = { userId: 'user1', name: 'Test User' }
      service.setUserProfile(profileDetails)
      expect(service.userProfile).toEqual(profileDetails)
    })
  })

  describe('setFrameWorkInfo', () => {
    it('should set the frameWorkInfo property', () => {
      const frameWorkInfo = { id: 'fw123', name: 'Framework 123' }
      service.setFrameWorkInfo(frameWorkInfo)
      expect(service.frameWorkInfo).toEqual(frameWorkInfo)
    })
  })

  describe('setCurrentOrgDesignationsList', () => {
    it('should set the orgDesignationList property', () => {
      const orgDesignationList = [{ id: 'desig1', name: 'Designation 1' }]
      service.setCurrentOrgDesignationsList(orgDesignationList)
      expect(service.orgDesignationList).toEqual(orgDesignationList)
    })
  })

  describe('updateSelectedDesignationList', () => {
    it('should update the selectedDesignationList property', () => {
      const selectedList = [{ id: 'desig1', name: 'Designation 1' }]
      service.updateSelectedDesignationList(selectedList)
      expect(service.selectedDesignationList).toEqual(selectedList)
    })
  })

  describe('getUuid', () => {
    it('should return a UUID string', () => {
      const uuid = service.getUuid
      expect(typeof uuid).toBe('string')
      // Basic UUID v4 format check
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    })
  })
})