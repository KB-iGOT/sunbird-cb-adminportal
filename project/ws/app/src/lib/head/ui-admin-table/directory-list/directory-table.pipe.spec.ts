
import * as _ from 'lodash'
import { ListPipePipe } from './directory-table.pipe'

// Mock lodash chain functionality with null handling
jest.mock('lodash', () => {
  const originalLodash = jest.requireActual('lodash')
  return {
    ...originalLodash,
    chain: jest.fn().mockImplementation((value) => {
      // Handle null/undefined values
      const safeValue = value || []

      return {
        map: jest.fn().mockImplementation((callback) => {
          const mappedArray = safeValue.map(callback)
          return {
            orderBy: jest.fn().mockImplementation(() => {
              return {
                join: jest.fn().mockImplementation((separator) => {
                  return {
                    value: jest.fn().mockReturnValue(mappedArray.join(separator))
                  }
                })
              }
            })
          }
        })
      }
    })
  }
})

describe('ListPipePipe', () => {
  let pipe: ListPipePipe

  beforeEach(() => {
    pipe = new ListPipePipe()
    jest.clearAllMocks()
  })

  it('should create an instance', () => {
    expect(pipe).toBeTruthy()
  })

  it('should transform an array of objects by extracting specified property and joining with <br />', () => {
    // Arrange
    const inputArray = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
      { id: 3, name: 'Bob' }
    ]

    // Act
    const result = pipe.transform(inputArray, 'name')

    // Assert
    expect(result).toBe('John<br />Jane<br />Bob')
    expect(_.chain).toHaveBeenCalledWith(inputArray)
  })

  it('should return empty string when input is null', () => {
    // Act
    const result = pipe.transform(null, 'name')

    // Assert
    expect(result).toBe('')
    expect(_.chain).toHaveBeenCalledWith(null)
  })

  it('should return empty string when input is undefined', () => {
    // Act
    const result = pipe.transform(undefined, 'name')

    // Assert
    expect(result).toBe('')
    expect(_.chain).toHaveBeenCalledWith(undefined)
  })

  it('should return empty string when input is an empty array', () => {
    // Act
    const result = pipe.transform([], 'name')

    // Assert
    expect(result).toBe('')
    expect(_.chain).toHaveBeenCalledWith([])
  })

  it('should handle missing property gracefully', () => {
    // Arrange
    const inputArray = [
      { id: 1, name: 'John' },
      { id: 2 }, // missing name property
      { id: 3, name: 'Bob' }
    ]

    // Act
    const result = pipe.transform(inputArray, 'name')

    // Assert
    expect(result).toBe('John<br />undefined<br />Bob')
    expect(_.chain).toHaveBeenCalledWith(inputArray)
  })
})