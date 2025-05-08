import { AcsendingOrderPipe } from './acsending-order.pipe'

describe('AcsendingOrderPipe', () => {
  let pipe: AcsendingOrderPipe

  beforeEach(() => {
    pipe = new AcsendingOrderPipe()
  })

  it('should create an instance', () => {
    expect(pipe).toBeTruthy()
  })

  it('should return original array if no value is provided', () => {
    const array: any = []
    expect(pipe.transform(array, 'asc', 'name')).toBe(array)
  })

  it('should return original array if order is empty or not provided', () => {
    const array = [3, 1, 2]
    expect(pipe.transform(array, '', 'name')).toBe(array)
    expect(pipe.transform(array, null, 'name')).toBe(array)
  })

  it('should sort a simple array in ascending order when no column is specified', () => {
    const array = [3, 1, 2]
    const result = pipe.transform(array, 'asc', '')
    expect(result).toEqual([1, 2, 3])
  })

  it('should sort a simple array in descending order when no column is specified', () => {
    const array = [3, 1, 2]
    const result = pipe.transform(array, 'desc', '')
    expect(result).toEqual([3, 2, 1])
  })

  it('should return original array when array has 0 or 1 items', () => {
    const emptyArray: any = []
    const singleItemArray = [1]

    expect(pipe.transform(emptyArray, 'asc', 'name')).toBe(emptyArray)
    expect(pipe.transform(singleItemArray, 'asc', 'name')).toBe(singleItemArray)
  })

  it('should sort an array of objects by specified column in ascending order', () => {
    const arrayOfObjects = [
      { name: 'John', age: 30 },
      { name: 'Alice', age: 25 },
      { name: 'Bob', age: 35 }
    ]

    const result = pipe.transform(arrayOfObjects, 'asc', 'name')

    expect(result).toEqual([
      { name: 'Alice', age: 25 },
      { name: 'Bob', age: 35 },
      { name: 'John', age: 30 }
    ])
  })

  it('should sort an array of objects by specified column in descending order', () => {
    const arrayOfObjects = [
      { name: 'John', age: 30 },
      { name: 'Alice', age: 25 },
      { name: 'Bob', age: 35 }
    ]

    const result = pipe.transform(arrayOfObjects, 'desc', 'age')

    expect(result).toEqual([
      { name: 'Bob', age: 35 },
      { name: 'John', age: 30 },
      { name: 'Alice', age: 25 }
    ])
  })

  it('should handle string values correctly', () => {
    const stringArray = ['banana', 'apple', 'cherry']

    const ascResult = pipe.transform(stringArray, 'asc', '')
    expect(ascResult).toEqual(['apple', 'banana', 'cherry'])

    const descResult = pipe.transform(stringArray, 'desc', '')
    expect(descResult).toEqual(['cherry', 'banana', 'apple'])
  })

  it('should handle case sensitivity correctly', () => {
    const mixedCaseArray = ['Banana', 'apple', 'Cherry']

    const result = pipe.transform(mixedCaseArray, 'asc', '')
    // Default sort in JavaScript is case-sensitive
    // Capital letters come before lowercase letters
    expect(result).toEqual(['Banana', 'Cherry', 'apple'])
  })
})