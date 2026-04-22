import { AuthInitService } from './init.service'

describe('AuthInitService', () => {
  let service: AuthInitService

  beforeEach(() => {
    service = new AuthInitService()
  })

  it('should create the service', () => {
    expect(service).toBeTruthy()
  })

  it('should have creationEntity as an empty Map by default', () => {
    expect(service.creationEntity).toBeInstanceOf(Map)
    expect(service.creationEntity.size).toBe(0)
  })

  it('should allow setting and getting authConfig', () => {
    const config: any = { version: '1', fields: [] }
    service.authConfig = config
    expect(service.authConfig).toEqual(config)
  })

  it('should allow setting and getting ordinals', () => {
    service.ordinals = { level1: 'A', level2: 'B' }
    expect(service.ordinals.level1).toBe('A')
  })

  it('should allow setting authAdditionalConfig', () => {
    service.authAdditionalConfig = { key: 'value' }
    expect(service.authAdditionalConfig).toEqual({ key: 'value' })
  })

  it('should allow setting collectionConfig', () => {
    const config: any = { maxNodes: 100 }
    service.collectionConfig = config
    expect(service.collectionConfig).toEqual(config)
  })

  it('should allow adding entries to creationEntity map', () => {
    const entity: any = { type: 'course', template: 'default' }
    service.creationEntity.set('course', entity)
    expect(service.creationEntity.get('course')).toEqual(entity)
    expect(service.creationEntity.size).toBe(1)
  })

  it('should allow setting optimizedWorkFlow', () => {
    const workflow: any = { allow: true, conditions: {} }
    service.optimizedWorkFlow = workflow
    expect(service.optimizedWorkFlow).toEqual(workflow)
  })

  it('should allow setting workFlowTable', () => {
    const table: any = [{ conditions: {}, workFlow: ['step1'] }]
    service.workFlowTable = table
    expect(service.workFlowTable).toEqual(table)
  })

  it('should allow setting ownerDetails', () => {
    const details: any = [{ status: ['active'], owner: 'admin', name: 'Admin', relatedActions: [], actionName: 'edit' }]
    service.ownerDetails = details
    expect(service.ownerDetails).toEqual(details)
  })

  it('should allow setting permissionDetails', () => {
    const perms: any = [{ role: 'admin', editContent: {}, editMeta: {} }]
    service.permissionDetails = perms
    expect(service.permissionDetails).toEqual(perms)
  })

  it('should allow setting authMetaV2', () => {
    const meta: any = { key1: { type: 'string', default: '' } }
    service.authMetaV2 = meta
    expect(service.authMetaV2).toEqual(meta)
  })
})
