import { FormControl } from '@angular/forms'
import { preventHtmlAndJs } from './prevent-html-and-js.validator'

describe('preventHtmlAndJs validator', () => {
  const validator = preventHtmlAndJs()

  function validate(value: string) {
    const control = new FormControl(value)
    return validator(control)
  }

  it('should return null for empty string', () => {
    expect(validate('')).toBeNull()
  })

  it('should return null for null value', () => {
    const control = new FormControl(null)
    expect(validator(control)).toBeNull()
  })

  it('should return null for plain text', () => {
    expect(validate('Hello world')).toBeNull()
  })

  it('should return null for text with numbers', () => {
    expect(validate('Course 101 for beginners')).toBeNull()
  })

  it('should return { noHtml: true } for HTML tags', () => {
    expect(validate('<script>alert("xss")</script>')).toEqual({ noHtml: true })
  })

  it('should return { noHtml: true } for simple HTML tag', () => {
    expect(validate('<b>bold</b>')).toEqual({ noHtml: true })
  })

  it('should return { noHtml: true } for self-closing tag', () => {
    expect(validate('<img src="x" onerror="alert(1)"/>')).toEqual({ noHtml: true })
  })

  it('should return { noHtml: true } for javascript: URI', () => {
    expect(validate('javascript:alert(1)')).toEqual({ noHtml: true })
  })

  it('should return { noHtml: true } for function declaration syntax', () => {
    expect(validate('function(a, b)')).toEqual({ noHtml: true })
  })

  it('should return { noHtml: true } for function declaration with parens', () => {
    // The regex matches `function\s*\([^)]*\)` - requires "function" immediately before "("
    expect(validate('function(arg1, arg2)')).toEqual({ noHtml: true })
  })

  it('should return null for named function (name between function and parens)', () => {
    // "function myFunc(a)" has text between "function" and "(" so regex does NOT match
    expect(validate('function myFunc(a)')).toBeNull()
  })

  it('should return null for text containing "function" as a word (no parens)', () => {
    // "function" keyword alone without () shouldn't match since regex needs (...)
    expect(validate('This is a function call description')).toBeNull()
  })
})
