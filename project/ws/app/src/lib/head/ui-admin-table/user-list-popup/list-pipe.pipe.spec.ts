import { ListPipePipe } from './list-pipe.pipe'
import * as _ from 'lodash'

describe('ListPipePipe', () => {
  let pipe: ListPipePipe

  beforeEach(() => {
    pipe = new ListPipePipe()
  })

  it('should create an instance of ListPipePipe', () => {
    expect(pipe).toBeTruthy()
  })

  it('should transform an array of objects to a string of selected property values, ordered and joined by <br />', () => {
    const input = [
      { name: 'John', age: 25 },
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 20 },
    ]
    const args = 'name'
    const result = pipe.transform(input, args)

    // Using Lodash to manually generate the expected result
    const expectedResult = _.chain(input).map(i => i[args]).orderBy().join('<br />').value()

    expect(result).toBe(expectedResult)
  })

  it('should handle empty input gracefully', () => {
    const input: any = []
    const args = 'name'
    const result = pipe.transform(input, args)

    // Expecting an empty string as no data to transform
    expect(result).toBe('')
  })

  it('should handle null or undefined input gracefully', () => {
    const args = 'name'

    // Test with null input
    const nullInput = null
    const resultNull = pipe.transform(nullInput, args)
    expect(resultNull).toBe('')

    // Test with undefined input
    const undefinedInput = undefined
    const resultUndefined = pipe.transform(undefinedInput, args)
    expect(resultUndefined).toBe('')
  })

  it('should handle case when the provided property does not exist on objects', () => {
    const input = [
      { name: 'John', age: 25 },
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 20 },
    ]
    const args = 'nonExistentProperty' // Non-existent property
    const result = pipe.transform(input, args)

    // Since the property doesn't exist, the result should be an empty string
    expect(result).toBe('')
  })
})
