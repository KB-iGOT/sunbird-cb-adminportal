import '@angular/compiler'
import { NsContent } from '../_services/widget-content.model'
import { BtnChannelAnalyticsComponent } from './btn-channel-analytics.component'

describe('BtnChannelAnalyticsComponent', () => {
    let component: BtnChannelAnalyticsComponent

    beforeEach(() => {
        component = new BtnChannelAnalyticsComponent()
        jest.clearAllMocks()
    })

    it('should create a instance of component', () => {
        expect(component).toBeTruthy()
    })

    it('should return true from showButton when contentType is CHANNEL', () => {
        component.widgetData = {
            identifier: 'channel-001',
            contentType: NsContent.EContentTypes.CHANNEL,
        }
        expect(component.showButton).toBe(true)
    })

    it('should return false from showButton when contentType is COURSE', () => {
        component.widgetData = {
            identifier: 'course-001',
            contentType: NsContent.EContentTypes.COURSE,
        }
        expect(component.showButton).toBe(false)
    })

    it('should return false from showButton when contentType is PROGRAM', () => {
        component.widgetData = {
            identifier: 'program-001',
            contentType: NsContent.EContentTypes.PROGRAM,
        }
        expect(component.showButton).toBe(false)
    })

    it('should return false from showButton when contentType is MODULE', () => {
        component.widgetData = {
            identifier: 'module-001',
            contentType: NsContent.EContentTypes.MODULE,
        }
        expect(component.showButton).toBe(false)
    })

    it('should set widgetData correctly', () => {
        const data = {
            identifier: 'test-id',
            contentType: NsContent.EContentTypes.CHANNEL,
        }
        component.widgetData = data
        expect(component.widgetData).toEqual(data)
    })
})
