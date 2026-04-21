(window as any)['env'] = {
    name: 'test-environment',
    sitePath: '/test-site-path',
    karmYogiPath: '/test-karm-yogi-path',
    cbpPath: '/test-cbp-path',
}
import { MatDialog } from '@angular/material/dialog'
import { HelpCenterGuideComponentV2 } from './help-center-guide-v2.component'


describe('HelpCenterGuideComponentV2', () => {
    let component: HelpCenterGuideComponentV2
    const dialog: Partial<MatDialog> = {}

    beforeAll(() => {
        component = new HelpCenterGuideComponentV2(
            dialog as MatDialog
        )
    })

    beforeEach(() => {
        jest.clearAllMocks()
        jest.resetAllMocks()
    })

    it('should create a instance of component', () => {
        expect(component).toBeTruthy()
    })

    describe('ngOnInit', () => {
        it('calling ngOnInit', () => {
            component.ngOnInit()
        })
    })

    describe('openVideoPopup', () => {
        it('calling openVideoPopup', () => {
            component.openVideoPopup()
        })
    })

    describe('callResizeEvent', () => {
        it('calling callResizeEvent', () => {
            component.callResizeEvent('')
        })
    })

})
