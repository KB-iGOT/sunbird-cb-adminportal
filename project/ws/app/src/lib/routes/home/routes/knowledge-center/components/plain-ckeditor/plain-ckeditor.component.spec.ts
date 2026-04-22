import { PlainCkeditorComponent } from './plain-ckeditor.component'

describe('PlainCkeditorComponent', () => {
  let component: PlainCkeditorComponent

  beforeEach(() => {
    component = new PlainCkeditorComponent()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('content setter', () => {
    it('should set html directly when doRegex is false', () => {
      component.doRegex = false
      component.content = '<p>Hello <strong>World</strong></p>'
      expect(component.html).toBe('<p>Hello <strong>World</strong></p>')
    })

    it('should apply download regex when doRegex is true', () => {
      component.doRegex = true
      // The downloadRegex replaces https://.../content-store/... patterns
      const input = 'some text https://example.com/content-store/file.pdf" more text'
      component.content = input
      // After regex processing, the url part should remain (replace just removes backslashes)
      expect(component.html).toContain('https://example.com/content-store/file.pdf')
    })

    it('should handle empty string content', () => {
      component.doRegex = false
      component.content = ''
      expect(component.html).toBe('')
    })

    it('should process content with doRegex true for plain text', () => {
      component.doRegex = true
      component.content = 'plain text without url'
      expect(component.html).toBe('plain text without url')
    })
  })

  describe('regexUploadReplace', () => {
    it('should decode URI and combine groups', () => {
      const result = component.regexUploadReplace('full', '/apis/authContent%2Fsome%20path', '"')
      expect(result).toBe('/apis/authContent/some path"')
    })

    it('should handle empty string args', () => {
      const result = component.regexUploadReplace('', '/apis/authContent/path', '"')
      expect(result).toBe('/apis/authContent/path"')
    })

    it('should use default empty string for _str', () => {
      const result = component.regexUploadReplace(undefined as any, '/path', "'")
      expect(result).toBe("/path'")
    })
  })

  describe('regexDownloadReplace', () => {
    it('should concatenate the two groups', () => {
      const result = component.regexDownloadReplace('full', 'https://example.com/content-store/file.pdf', '"')
      expect(result).toBe('https://example.com/content-store/file.pdf"')
    })

    it('should use default empty string for _str', () => {
      const result = component.regexDownloadReplace(undefined as any, 'group1', 'group2')
      expect(result).toBe('group1group2')
    })
  })

  describe('onContentChanged', () => {
    it('should emit value with regex when doRegex is true', () => {
      component.doRegex = true
      const emittedValues: string[] = []
      component.value.subscribe((v: string) => emittedValues.push(v))

      const mockEditor = { getData: jest.fn().mockReturnValue('some /apis/authContent/file" data') }
      component.onContentChanged({ editor: mockEditor })

      expect(emittedValues.length).toBe(1)
      // upload regex replaces /apis/authContent + group1 with decodeURIComponent(group1)
      // so /apis/authContent/file" becomes /file"
      expect(emittedValues[0]).toContain('/file"')
    })

    it('should emit raw html when doRegex is false', () => {
      component.doRegex = false
      const emittedValues: string[] = []
      component.value.subscribe((v: string) => emittedValues.push(v))

      const mockEditor = { getData: jest.fn().mockReturnValue('<p>hello</p>') }
      component.onContentChanged({ editor: mockEditor })

      expect(emittedValues).toEqual(['<p>hello</p>'])
    })

    it('should update html property with editor data', () => {
      const mockEditor = { getData: jest.fn().mockReturnValue('<b>new content</b>') }
      component.onContentChanged({ editor: mockEditor })
      expect(component.html).toBe('<b>new content</b>')
    })
  })

  describe('onBlur', () => {
    it('should emit onTouched event', () => {
      const spy = jest.spyOn(component.onTouched, 'emit')
      component.onBlur()
      expect(spy).toHaveBeenCalledTimes(1)
    })
  })

  describe('ngOnInit', () => {
    it('should complete without error', () => {
      expect(() => component.ngOnInit()).not.toThrow()
    })
  })

  describe('default properties', () => {
    it('should have doRegex true by default', () => {
      expect(component.doRegex).toBe(true)
    })

    it('should have showError false by default', () => {
      expect(component.showError).toBe(false)
    })

    it('should have empty html by default', () => {
      expect(component.html).toBe('')
    })
  })
})

