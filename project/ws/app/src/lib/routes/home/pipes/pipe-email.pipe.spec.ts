import { PipeEmailPipe } from './pipe-email.pipe'

describe('PipeEmailPipe', () => {
  let pipe: PipeEmailPipe

  beforeEach(() => {
    pipe = new PipeEmailPipe() // Instantiate the pipe directly
  })

  it('should create the pipe', () => {
    expect(pipe).toBeTruthy() // Check if pipe instance is created
  })

  it('should transform email by replacing "@" with "[at]" and "." with "[dot]"', () => {
    const input = 'test.email@example.com'
    const expectedOutput = 'test[dot]email[at]example[dot]com'

    const result = pipe.transform(input)

    expect(result).toBe(expectedOutput) // Check the transformation
  })

  it('should transform email with multiple dots and at symbols', () => {
    const input = 'john.doe@company.com'
    const expectedOutput = 'john[dot]doe[at]company[dot]com'

    const result = pipe.transform(input)

    expect(result).toBe(expectedOutput) // Check the transformation
  })

  it('should return the same value if there is no "@" or "."', () => {
    const input = 'username'
    const expectedOutput = 'username'

    const result = pipe.transform(input)

    expect(result).toBe(expectedOutput) // Check if no change happens for input without "@" or "."
  })

  it('should handle an empty string input', () => {
    const input = ''
    const expectedOutput = ''

    const result = pipe.transform(input)

    expect(result).toBe(expectedOutput) // Check if empty string remains unchanged
  })

  it('should return undefined for null input', () => {
    const input: any = null

    const result = pipe.transform(input)

    expect(result).toBeNull() // Check if null input is handled gracefully
  })
})
