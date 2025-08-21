import { ModerationViewComponent } from './moderation.component'
import { of } from 'rxjs'
import { Router } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { ModerationService } from '../../services/moderation.service'
import { ActivatedRoute } from '@angular/router'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'

// Mock the dependencies
jest.mock('@angular/router', () => ({
    ActivatedRoute: jest.fn().mockImplementation(() => ({
        parent: {
            snapshot: { data: { pageData: { data: { tabs: [] } } } }
        },
        params: {
            subscribe: jest.fn().mockImplementation(callback => callback({ department: 'MDO' }))
        },
        data: {
            subscribe: jest.fn().mockImplementation(callback => callback({ profile: { data: [{}] } }))
        }
    })),
    Router: jest.fn().mockImplementation(() => ({
        navigate: jest.fn()
    }))
}))

jest.mock('@sunbird-cb/utils-v2', () => ({
    ConfigurationsService: jest.fn().mockImplementation(() => ({
        userProfile: { userId: 'test-user' }
    }))
}))

jest.mock('../../services/moderation.service', () => ({
    ModerationService: jest.fn().mockImplementation(() => ({
        getModeratedData: jest.fn().mockReturnValue(of({ payload: { feedbackList: [] } })),
        getData: jest.fn().mockReturnValue(of({ payload: { feedbackList: [] } })),
        getAllDepartmentsKong: jest.fn().mockReturnValue(of({ result: { response: { content: [] } } }))
    }))
}))

jest.mock('@angular/material/legacy-dialog', () => ({
    MatLegacyDialog: jest.fn().mockImplementation(() => ({
        open: jest.fn()
    }))
}))

describe('ModerationViewComponent', () => {
    let component: ModerationViewComponent
    let moderationService: ModerationService
    let router: Router
    let configService: ConfigurationsService
    let dialog: MatDialog

    beforeEach(() => {
        // Setup the component with mocks
        moderationService = new ModerationService(null as any)
        router = new Router()
        configService = new ConfigurationsService()
        dialog = new MatDialog(null as any, null as any, null as any, null as any, null as any, null as any, null as any)

        component = new ModerationViewComponent(dialog, new ActivatedRoute(), configService, moderationService, router)
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize with default filter as "MDO"', () => {
        expect(component.currentFilter).toBe('MDO')
    })

    it('should call getAllDepartmentsHeaderAPI on init', () => {
        jest.spyOn(component, 'getAllDepartmentsHeaderAPI')
        component.ngOnInit()
        expect(component.getAllDepartmentsHeaderAPI).toHaveBeenCalled()
    })

    it('should set moderatedData and serviceData on init', () => {
        jest.spyOn(moderationService, 'getModeratedData').mockReturnValue(of({ payload: { feedbackList: ['moderated'] } }))
        jest.spyOn(moderationService, 'getData').mockReturnValue(of({ payload: { feedbackList: ['service'] } }))

        component.ngOnInit()
        expect(component.moderatedData).toEqual(['moderated'])
        expect(component.moderationServiceData).toEqual(['service'])
    })

    it('should update data when filter is called', () => {
        const key = 'Approved'
        jest.spyOn(component, 'getDepartDataByKey')
        component.filter(key)
        expect(component.getDepartDataByKey).toHaveBeenCalledWith(key)
    })

    it('should call actionClick and navigate', () => {
        const clickedData = { id: 1 }
        component.actionClick(clickedData)
        expect(router.navigate).toHaveBeenCalledWith(['/app/home/MDO/create-department', { data: JSON.stringify(clickedData) }])
    })

    it('should update data for "Rejected" filter', () => {
        jest.spyOn(moderationService, 'getModeratedData').mockReturnValue(of({ payload: { feedbackList: [{ classification: 'SFW' }] } }))
        component.getDepartDataByKey('Rejected')
        expect(component.data.length).toBe(0) // Should not contain 'SFW' classified data
    })

    it('should update data for "Approved" filter', () => {
        jest.spyOn(moderationService, 'getModeratedData').mockReturnValue(of({ payload: { feedbackList: [{ classification: 'SFW' }] } }))
        component.getDepartDataByKey('Approved')
        expect(component.data.length).toBe(1) // Should contain 'SFW' classified data
    })

    it('should update table header when creating table header', () => {
        const mockTableHeader = {
            actions: [{ name: 'Edit', label: 'Edit info', icon: 'remove_red_eye', type: 'button' }],
            columns: [
                { displayName: 'Department', key: 'mdo' },
                { displayName: 'Type', key: 'type' }
            ],
            needCheckBox: false,
            needHash: false,
            sortColumn: '',
            sortState: 'asc'
        }
        component.createTableHeader()
        expect(component.tabledata).toEqual(mockTableHeader)
    })
})
