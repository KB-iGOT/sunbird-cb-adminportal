import { SectorsComponent } from './sectors.component'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { SectorsService } from './sectors.service'
import { MatDialog } from '@angular/material/dialog'
import { of, throwError } from 'rxjs'

describe('SectorsComponent', () => {
    let component: SectorsComponent
    let mockConfigService: Partial<ConfigurationsService>
    let mockSectorsService: Partial<SectorsService>
    let mockMatDialog: Partial<MatDialog>

    beforeEach(() => {
        // Mock the services
        mockConfigService = {
            userProfile: { userId: 'test-user' },
        }
        mockSectorsService = {
            getAllSectors: jest.fn(),
        }
        mockMatDialog = {}

        // Instantiate the component with the mocked services
        component = new SectorsComponent(
            mockMatDialog as MatDialog,
            mockConfigService as ConfigurationsService,
            mockSectorsService as SectorsService
        )
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize with default values', () => {
        expect(component.isLoading).toBeFalsy()
        expect(component.tabledata).toEqual({
            columns: [
                { displayName: 'Sector', key: 'name' },
                { displayName: 'Sub-sectors', key: 'subSector' },
            ],
            needCheckBox: false,
            needHash: false,
            sortColumn: 'name',
            sortState: 'asc',
            needUserMenus: false,
            actionColumnName: 'Actions',
            actions: [{ icon: '', label: 'Action', name: 'DownloadFile', type: 'Standard', disabled: false }],
        })
        expect(component.currentUser).toBe('test-user')
    })

    it('should call getAllSectors and populate data on ngOnInit', () => {
        const mockResponse = {
            result: {
                sectors: [
                    { identifier: '1', name: 'Sector 1', children: [{ name: 'SubSector 1' }] },
                    { identifier: '2', name: 'Sector 2', children: [] },
                ],
            },
        }
        mockSectorsService.getAllSectors = jest.fn().mockReturnValue(of(mockResponse))

        component.ngOnInit()

        expect(component.isLoading).toBeTruthy()
        setTimeout(() => {
            expect(component.isLoading).toBeFalsy()
            expect(component.data.length).toBe(2)
            expect(component.data[0].subSector).toBe('SubSector 1')
            expect(component.data[1].subSector).toBe('')
            expect(component.data[0].identifier).toBe('1')
            expect(component.data[1].identifier).toBe('2')
        }, 0)
    })

    it('should handle error while getting sectors', () => {
        const errorResponse = new Error('Something went wrong')
        mockSectorsService.getAllSectors = jest.fn().mockReturnValue(throwError(errorResponse))

        console.log = jest.fn()  // Mock console.log to suppress the error logs

        component.ngOnInit()

        expect(component.isLoading).toBeTruthy()
        setTimeout(() => {
            expect(component.isLoading).toBeFalsy()
            expect(console.log).toHaveBeenCalledWith(errorResponse)
        }, 0)
    })

    it('should return a string of sub-sectors when getSubSectors is called', () => {
        const mockChildren = [
            { name: 'SubSector 1' },
            { name: 'SubSector 2' },
        ]
        const result = component.getSubSectors(mockChildren)
        expect(result).toBe('SubSector 1, SubSector 2')
    })
})
