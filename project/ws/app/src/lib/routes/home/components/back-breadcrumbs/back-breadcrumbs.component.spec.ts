import { BackBreadcrumbsComponent } from './back-breadcrumbs.component'

describe('BackBreadcrumbsComponent', () => {
  let component: BackBreadcrumbsComponent
  let mockRouter: { navigate: jest.Mock }

  beforeEach(() => {
    mockRouter = { navigate: jest.fn() }
    component = new BackBreadcrumbsComponent(mockRouter as any)
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should initialize data as empty array', () => {
    expect(component.data).toEqual([])
  })

  describe('navigate', () => {
    it('should call router.navigate with crumb route when route is defined', () => {
      const crumb = { label: 'Home', route: '/app/home' }
      component.navigate(crumb as any)
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home'])
    })

    it('should not call router.navigate when crumb has no route', () => {
      const crumb = { label: 'Current Page' }
      component.navigate(crumb as any)
      expect(mockRouter.navigate).not.toHaveBeenCalled()
    })

    it('should not call router.navigate when route is empty string', () => {
      const crumb = { label: 'Empty Route', route: '' }
      component.navigate(crumb as any)
      expect(mockRouter.navigate).not.toHaveBeenCalled()
    })
  })
})

