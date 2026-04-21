import { fakeAsync, tick } from '@angular/core/testing'
import { KCMMappingComponent } from './kcm-mapping.component'
import { ActivatedRoute } from '@angular/router'
import { MatDialog } from '@angular/material/dialog'
import { DemoVideoPopupComponent } from '../../components/demo-video-popup/demo-video-popup.component'
import { of } from 'rxjs'
import { environment } from '../../../../../../../../../src/environments/environment'

describe('KCMMappingComponent', () => {
    let component: KCMMappingComponent
    // let fixture: ComponentFixture<KCMMappingComponent>
    let mockActivatedRoute: any
    let mockMatDialog: any
    let mockPageData: any

    beforeEach(() => {
        // Setup mock data
        mockPageData = {
            data: {
                defaultKCMConfig: [
                    {
                        name: 'Default Config',
                        // Other properties will be populated by the component
                    }
                ],
                frameworkConfig: [
                    {
                        name: 'Framework Config',
                        frameworkId: 'testFramework'
                    }
                ],
                topsection: {
                    guideVideo: {
                        url: '/test-video-path.mp4'
                    }
                }
            }
        }

        // Mock ActivatedRoute
        mockActivatedRoute = {
            data: of({ pageData: mockPageData })
        }

        // Mock MatDialog
        mockMatDialog = {
            open: jest.fn()
        }

        // Set environment values for testing
        environment.KCMframeworkName = 'testFrameworkName'
        environment.karmYogiPath = 'https://test-path.com'

        // Create component with mocked dependencies
        component = new KCMMappingComponent(
            mockActivatedRoute as unknown as ActivatedRoute,
            mockMatDialog as unknown as MatDialog
        )
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize environment and framework values on ngOnInit', () => {
        component.ngOnInit()

        expect(component.environmentVal).toBeDefined()
        expect(component.environmentVal.frameworkName).toEqual('testFrameworkName')
    })

    it('should set kcmConfig from activated route data', () => {
        component.ngOnInit()

        expect(component.kcmConfig).toEqual(mockPageData.data)
    })

    it('should update defaultKCMConfig with correct frameworkId', () => {
        component.ngOnInit()

        expect(component.kcmConfig.defaultKCMConfig[0].frameworkId).toEqual('testFrameworkName')
    })

    it('should combine defaultKCMConfig and frameworkConfig into taxonomyConfig', () => {
        component.ngOnInit()

        const expectedTaxonomyConfig = [
            {
                name: 'Default Config',
                frameworkId: 'testFrameworkName'
            },
            {
                name: 'Framework Config',
                frameworkId: 'testFramework'
            }
        ]

        expect(component.taxonomyConfig).toEqual(expectedTaxonomyConfig)
    })

    it('should extract videoLink from config', () => {
        component.ngOnInit()

        expect(component.videoLink).toEqual('/test-video-path.mp4')
    })

    it('should dispatch resize event after timeout when callResizeEvent is called', fakeAsync(() => {
        const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent')

        component.callResizeEvent({})
        tick(100)

        expect(dispatchEventSpy).toHaveBeenCalledTimes(1)
        expect(dispatchEventSpy).toHaveBeenCalledWith(expect.any(Event))
        expect(dispatchEventSpy.mock.calls[0][0].type).toBe('resize')
    }))

    it('should open dialog with correct parameters when openVideoPopup is called', () => {
        component.videoLink = '/test-video-path.mp4'
        component.environmentVal = { karmYogiPath: 'https://test-path.com' }
        environment.karmYogiPath = 'https://test-path.com'

        component.openVideoPopup()

        expect(mockMatDialog.open).toHaveBeenCalledWith(
            DemoVideoPopupComponent,
            {
                data: {
                    videoLink: 'https://test-path.com/test-video-path.mp4',
                },
                disableClose: true,
                width: '50%',
                height: '60%',
                panelClass: 'overflow-visable',
            }
        )
    })
})