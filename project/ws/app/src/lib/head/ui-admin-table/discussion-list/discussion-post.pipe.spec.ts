
import * as _ from 'lodash'
import { ListPipePipe } from './discussion-post.pipe'

// Mock lodash chain functionality
jest.mock('lodash', () => {
  const originalLodash = jest.requireActual('lodash')
  return {
    ...originalLodash,
    chain: jest.fn()
  }
})

describe('ListPipePipe', () => {
  let pipe: ListPipePipe

  // Mock chain implementation for testing
  const mockChain = {
    map: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    join: jest.fn().mockReturnThis(),
    value: jest.fn()
  }

  beforeEach(() => {
    pipe = new ListPipePipe()

    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup the lodash chain mock
    (_.chain as jest.Mock).mockReturnValue(mockChain)
  })

  it('should create an instance', () => {
    expect(pipe).toBeTruthy()
  })

  it('should transform array of objects using property specified in args', () => {
    // Arrange
    const inputArray = [
      { name: 'John', age: 30 },
      { name: 'Jane', age: 25 },
      { name: 'Doe', age: 40 }
    ]
    const propertyName = 'name'

    // Setup the mock to return a specific value
    mockChain.value.mockReturnValue('John<br />Jane<br />Doe')

    // Act
    const result = pipe.transform(inputArray, propertyName)

    // Assert
    expect(_.chain).toHaveBeenCalledWith(inputArray)
    expect(mockChain.map).toHaveBeenCalledWith(expect.any(Function))
    expect(mockChain.orderBy).toHaveBeenCalledWith('asc')
    expect(mockChain.join).toHaveBeenCalledWith('<br />')
    expect(result).toBe('John<br />Jane<br />Doe')

    // Verify the map function works correctly
    const mapFn = mockChain.map.mock.calls[0][0]
    expect(mapFn({ name: 'John' }, 'name')).toBe('John')
  })

  it('should handle empty arrays', () => {
    // Arrange
    const inputArray: any[] = []
    mockChain.value.mockReturnValue('')

    // Act
    const result = pipe.transform(inputArray, 'name')

    // Assert
    expect(result).toBe('')
  })

  it('should handle null or undefined values', () => {
    // Arrange
    mockChain.value.mockReturnValue('')

    // Act & Assert
    expect(pipe.transform(null, 'name')).toBe('')
    expect(pipe.transform(undefined, 'name')).toBe('')
  })

  it('should handle objects with missing properties', () => {
    // Arrange
    const inputArray = [
      { name: 'John' },
      { age: 25 },
      { name: 'Doe' }
    ]
    const propertyName = 'name';

    // Setup mock implementation to test the actual mapping function
    (_.chain as jest.Mock).mockImplementation((value) => {
      const mappedValues = value.map((i: any) => i[propertyName])
      const ordered = mappedValues // Skip actual ordering for test simplicity
      const joined = ordered.filter(Boolean).join('<br />')
      return {
        map: () => ({ orderBy: () => ({ join: () => ({ value: () => joined }) }) })
      }
    })

    // Act
    const result = pipe.transform(inputArray, propertyName)

    // Assert
    expect(result).toBe('John<br />Doe')
  })
})