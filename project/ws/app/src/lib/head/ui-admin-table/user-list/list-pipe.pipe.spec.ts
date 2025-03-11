import { ListPipePipe } from './list-pipe.pipe'
import * as _ from 'lodash'

describe('ListPipePipe', () => {
  let pipe: ListPipePipe

  beforeEach(() => {
    pipe = new ListPipePipe()
  })

  it('should be created', () => {
    expect(pipe).toBeTruthy()
  })

  it('should transform array correctly with the given key', () => {
    const value = [
      { name: 'John', age: 25 },
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 22 },
    ]
    const args = 'name'

    // Expected transformed value
    const expected = 'Alice<br />Bob<br />John'

    // Transforming using the pipe
    const result = pipe.transform(value, args)

    expect(result).toBe(expected)
  })

  it('should handle empty array', () => {
    const value: any = []
    const args = 'name'

    const result = pipe.transform(value, args)

    // When value is empty, the result should be an empty string
    expect(result).toBe('')
  })

  it('should handle undefined or null input gracefully', () => {
    const resultWithUndefined = pipe.transform(undefined, 'name')
    const resultWithNull = pipe.transform(null, 'name')

    // In case of undefined or null, the result should be empty string
    expect(resultWithUndefined).toBe('')
    expect(resultWithNull).toBe('')
  })

  it('should return an empty string if the key does not exist in the objects', () => {
    const value = [
      { name: 'John', age: 25 },
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 22 },
    ]
    const args = 'nonExistentKey' // Key doesn't exist in the objects

    const result = pipe.transform(value, args)

    // Since 'nonExistentKey' doesn't exist, it should return an empty string
    expect(result).toBe('')
  })

  it('should sort values in ascending order', () => {
    const value = [
      { name: 'John', age: 25 },
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 22 },
    ]
    const args = 'age' // Sorting by age

    const result = pipe.transform(value, args)

    // Expected sorted order by age: Bob (22), John (25), Alice (30)
    const expected = 'Bob<br />John<br />Alice'

    expect(result).toBe(expected)
  })
})
