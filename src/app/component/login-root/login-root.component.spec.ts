import { LoginRootComponent } from './login-root.component'
import { LoginRootDirective } from './login-root.directive'
import { LoginRootService } from './login-root.service'
import { ComponentFactoryResolver, ViewContainerRef } from '@angular/core'

describe('LoginRootComponent', () => {
  let component: LoginRootComponent
  let mockComponentFactoryResolver: jest.Mocked<ComponentFactoryResolver>
  let mockLoginRootService: jest.Mocked<LoginRootService>
  let mockViewContainerRef: jest.Mocked<ViewContainerRef>
  let mockComponentFactory: any
  let mockComponent: any

  beforeEach(() => {
    // Mock component that will be loaded dynamically
    mockComponent = jest.fn()

    // Create mock for ComponentFactory
    mockComponentFactory = {
      create: jest.fn()
    }

    // Create mock for ViewContainerRef
    mockViewContainerRef = {
      clear: jest.fn(),
      createComponent: jest.fn().mockReturnValue(mockComponent)
    } as unknown as jest.Mocked<ViewContainerRef>

    // Create mock for ComponentFactoryResolver
    mockComponentFactoryResolver = {
      resolveComponentFactory: jest.fn().mockReturnValue(mockComponentFactory)
    } as unknown as jest.Mocked<ComponentFactoryResolver>

    // Create mock for LoginRootService
    mockLoginRootService = {
      getComponent: jest.fn().mockReturnValue(mockComponent)
    } as unknown as jest.Mocked<LoginRootService>

    // Create component instance and manually inject mocks
    component = new LoginRootComponent(
      mockComponentFactoryResolver,
      mockLoginRootService
    )

    // Mock the ViewChild by setting the property directly
    // Create a mock LoginRootDirective
    component.wsLoginRoot = {
      viewContainerRef: mockViewContainerRef
    } as unknown as LoginRootDirective
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('loadComponent', () => {
    it('should get component from service and create it in the view container', () => {
      // Act
      component.loadComponent()

      // Assert
      expect(mockLoginRootService.getComponent).toHaveBeenCalled()
      expect(mockComponentFactoryResolver.resolveComponentFactory).toHaveBeenCalledWith(mockComponent)
      expect(mockViewContainerRef.clear).toHaveBeenCalled()
      expect(mockViewContainerRef.createComponent).toHaveBeenCalledWith(mockComponentFactory)
    })
  })

  describe('ngOnInit', () => {
    it('should call loadComponent', () => {
      // Setup spy on component's loadComponent method
      const loadComponentSpy = jest.spyOn(component, 'loadComponent')

      // Act
      component.ngOnInit()

      // Assert
      expect(loadComponentSpy).toHaveBeenCalled()
    })
  })
})