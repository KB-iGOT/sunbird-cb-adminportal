import { MyDashboardHomeComponent } from './my-dashboard-home.component'
import { Router } from '@angular/router'
import { ConfigurationsService, NsPage } from '@sunbird-cb/utils'
import { mapFilePath, dashboardEmptyData } from '../../../../../../../../../src/dashboard-assets/data/data'

// Mocks for Router and ConfigurationsService
jest.mock('@angular/router', () => ({
    Router: jest.fn().mockImplementation(() => ({
        navigate: jest.fn(),
    })),
}))

jest.mock('@sunbird-cb/utils', () => ({
    ConfigurationsService: jest.fn().mockImplementation(() => ({
        pageNavBar: {} as NsPage.INavBackground,
    })),
    NsPage: {
        INavBackground: jest.fn(),
    },
}))

describe('MyDashboardHomeComponent', () => {
    let component: MyDashboardHomeComponent
    let router: Router
    let configSvc: ConfigurationsService

    beforeEach(() => {
        router = new Router()
        configSvc = new ConfigurationsService()
        component = new MyDashboardHomeComponent(router, configSvc)
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize with empty currentDashboard if selectedDashboardId is empty', () => {
        component.ngOnInit()
        expect(component.currentDashboard).toEqual([dashboardEmptyData])
    })

    it('should update selectedDashboardId when getDashboardId is called with a valid value', () => {
        component.getDashboardId('some-id')
        expect(component.selectedDashboardId).toBe('some-id')
    })

    it('should reset currentDashboard to empty if getDashboardId is called with an invalid value', () => {
        component.getDashboardId('')
        expect(component.currentDashboard).toEqual([dashboardEmptyData])

        component.getDashboardId('')
        expect(component.currentDashboard).toEqual([dashboardEmptyData])
    })

    it('should navigate to home when backToHome is called', () => {
        component.backToHome()
        expect(router.navigate).toHaveBeenCalledWith(['page', 'home'])
    })

    it('should log event data when getDateFilterPreset is called', () => {
        const consoleSpy = jest.spyOn(console, 'log')
        const event = { someData: 'test' }
        component.getDateFilterPreset(event)
        expect(consoleSpy).toHaveBeenCalledWith('event', event)
    })

    it('should have correct initial values for API endpoints and mapPath', () => {
        expect(component.getDashboardForKM).toBe('/apis/proxies/v8/dashboard/analytics/getDashboardConfig/Karmayogi')
        expect(component.getDashboardForProfile).toBe('/apis/proxies/v8/dashboard/analytics/getDashboardsForProfile/Karmayogi?realm=spv')
        expect(component.getChartV2).toBe('/apis/proxies/v8/dashboard/analytics/getChartV2/Karmayogi')
        expect(component.mapPath).toBe(mapFilePath)
    })
})
