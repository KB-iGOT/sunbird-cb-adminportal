import { InfoModalComponent } from './info-modal.component'

describe('InfoModalComponent', () => {
  let component: InfoModalComponent
  let dialogRefMock: { close: jest.Mock }

  beforeEach(() => {
    // Create a mock for MatDialogRef
    dialogRefMock = {
      close: jest.fn()
    }
  })

  it('should create the component', () => {
    // Arrange
    const mockData = { type: 'import-igot-master-create' }

    // Act
    component = new InfoModalComponent(dialogRefMock as any, mockData)

    // Assert
    expect(component).toBeTruthy()
  })

  describe('confirmed method', () => {
    it('should set startImporting to true when type is import-igot-master-create', () => {
      // Arrange
      const mockData = { type: 'import-igot-master-create' }
      component = new InfoModalComponent(dialogRefMock as any, mockData)

      // Act
      component.confirmed()

      // Assert
      expect(dialogRefMock.close).toHaveBeenCalledWith({ startImporting: true })
    })

    it('should set reviewImporting to false when type is import-igot-master-review', () => {
      // Arrange
      const mockData = { type: 'import-igot-master-review' }
      component = new InfoModalComponent(dialogRefMock as any, mockData)

      // Act
      component.confirmed()

      // Assert
      expect(dialogRefMock.close).toHaveBeenCalledWith({ reviewImporting: false })
    })

    it('should set isDelete to true when type is delete', () => {
      // Arrange
      const mockData = { type: 'delete' }
      component = new InfoModalComponent(dialogRefMock as any, mockData)

      // Act
      component.confirmed()

      // Assert
      expect(dialogRefMock.close).toHaveBeenCalledWith({ isDelete: true })
    })
  })

  describe('rejected method', () => {
    it('should set close to true when type is import-igot-master-create', () => {
      // Arrange
      const mockData = { type: 'import-igot-master-create' }
      component = new InfoModalComponent(dialogRefMock as any, mockData)

      // Act
      component.rejected()

      // Assert
      expect(dialogRefMock.close).toHaveBeenCalledWith({ close: true })
    })

    it('should set reviewImporting to true when type is import-igot-master-review', () => {
      // Arrange
      const mockData = { type: 'import-igot-master-review' }
      component = new InfoModalComponent(dialogRefMock as any, mockData)

      // Act
      component.rejected()

      // Assert
      expect(dialogRefMock.close).toHaveBeenCalledWith({ reviewImporting: true })
    })

    it('should set isDelete to false when type is delete', () => {
      // Arrange
      const mockData = { type: 'delete' }
      component = new InfoModalComponent(dialogRefMock as any, mockData)

      // Act
      component.rejected()

      // Assert
      expect(dialogRefMock.close).toHaveBeenCalledWith({ isDelete: false })
    })
  })

  it('should have data accessible from the constructor', () => {
    // Arrange
    const mockData = { type: 'test-type', otherProp: 'test-value' }

    // Act
    component = new InfoModalComponent(dialogRefMock as any, mockData)

    // Assert
    expect(component.data).toEqual(mockData)
  })

  it('should initialize without errors', () => {
    // Arrange
    const mockData = { type: 'test-type' }
    component = new InfoModalComponent(dialogRefMock as any, mockData)

    // Act & Assert - just making sure ngOnInit doesn't throw errors
    expect(() => {
      component.ngOnInit()
    }).not.toThrow()
  })
})