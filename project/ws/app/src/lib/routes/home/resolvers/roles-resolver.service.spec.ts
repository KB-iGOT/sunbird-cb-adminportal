import { of, throwError } from 'rxjs'
import { RolesService } from '../services/roles.service'
import { RolesResolver } from './roles-resolver.service'

describe('RolesResolver', () => {
    let resolver: RolesResolver

    const rolesService: Partial<RolesService> = {
        getAllRoles: jest.fn(),
    }

    beforeEach(() => {
        resolver = new RolesResolver(rolesService as RolesService)
        jest.clearAllMocks()
    })

    it('should create a instance of component', () => {
        expect(resolver).toBeTruthy()
    })

    it('should resolve and return parsed data on success', (done) => {
        const mockResponse = {
            result: { response: { value: '{"orgType":"ministry"}' } },
        }
            ; (rolesService.getAllRoles as jest.Mock).mockReturnValue(of(mockResponse))

        resolver.resolve({} as any, {} as any).subscribe(result => {
            expect(result.data).toEqual({ orgType: 'ministry' })
            expect(result.error).toBeNull()
            done()
        })
    })

    it('should return empty object when value is missing', (done) => {
        const mockResponse = { result: { response: {} } }
            ; (rolesService.getAllRoles as jest.Mock).mockReturnValue(of(mockResponse))

        resolver.resolve({} as any, {} as any).subscribe(result => {
            expect(result.data).toEqual({})
            expect(result.error).toBeNull()
            done()
        })
    })

    it('should return empty object when response is null', (done) => {
        const mockResponse = {}
            ; (rolesService.getAllRoles as jest.Mock).mockReturnValue(of(mockResponse))

        resolver.resolve({} as any, {} as any).subscribe(result => {
            expect(result.data).toEqual({})
            expect(result.error).toBeNull()
            done()
        })
    })

    it('should catch error and return error response', (done) => {
        const error = new Error('API error')
            // Use throwError without factory (RxJS 6 compatible)
            ; (rolesService.getAllRoles as jest.Mock).mockReturnValue(throwError(error))

        resolver.resolve({} as any, {} as any).subscribe(result => {
            expect(result.error).toBe(error)
            expect(result.data).toBeNull()
            done()
        })
    })
})