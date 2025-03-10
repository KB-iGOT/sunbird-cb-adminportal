import { DynamicAssetsLoaderService } from './dynamic-assets-loader.service'

describe('DynamicAssetsLoaderService', () => {
  let service: DynamicAssetsLoaderService
  let appendChildMock: jest.Mock
  let createElementMock: jest.Mock

  beforeEach(() => {
    service = new DynamicAssetsLoaderService()

    // Mock document.createElement
    createElementMock = jest.fn()
    appendChildMock = jest.fn()
    global.document.createElement = createElementMock
    global.document.body.appendChild = appendChildMock
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('loadScript', () => {
    it('should return true if the script is already loaded', async () => {
      const url = 'https://example.com/script.js'
      service.urlLoadStatus.set(url, true)

      const result = await service.loadScript(url)

      expect(result).toBe(true)
      expect(createElementMock).not.toHaveBeenCalled()
    })

    it('should create a script element and append it if not loaded before', async () => {
      const url = 'https://example.com/script.js'
      service.urlLoadStatus.set(url, false)

      const scriptElem = { src: '', appendChild: jest.fn() } as any
      createElementMock.mockReturnValue(scriptElem)
      const loadEventPromiseMock = jest.spyOn(service as any, 'loadEventPromise').mockResolvedValue(true)

      const result = await service.loadScript(url)

      expect(result).toBe(true)
      expect(createElementMock).toHaveBeenCalledWith('script')
      expect(appendChildMock).toHaveBeenCalledWith(scriptElem)
      expect(loadEventPromiseMock).toHaveBeenCalledWith(url)
    })

    it('should return false if an error occurs while creating script', async () => {
      const url = 'https://example.com/script.js'
      service.urlLoadStatus.set(url, false)
      createElementMock.mockImplementation(() => { throw new Error('Error creating script element') })

      const result = await service.loadScript(url)

      expect(result).toBe(false)
    })

    it('should return true if the script loads successfully via event', async () => {
      const url = 'https://example.com/script.js'
      service.urlLoadStatus.set(url, false)

      const scriptElem = { src: '', appendChild: jest.fn() } as any
      createElementMock.mockReturnValue(scriptElem)

      // Mock the fromEvent observable to simulate 'load' event
      // const mockLoadEvent = of('load')
      jest.spyOn(service as any, 'loadEventPromise').mockResolvedValue(true)

      const result = await service.loadScript(url)

      expect(result).toBe(true)
    })
  })

  describe('loadStyle', () => {
    it('should return true if the style is already loaded', async () => {
      const url = 'https://example.com/style.css'
      service.urlLoadStatus.set(url, true)

      const result = await service.loadStyle(url)

      expect(result).toBe(true)
      expect(createElementMock).not.toHaveBeenCalled()
    })

    it('should create a link element and append it if not loaded before', async () => {
      const url = 'https://example.com/style.css'
      service.urlLoadStatus.set(url, false)

      const linkElem = { rel: 'stylesheet', href: '', appendChild: jest.fn() } as any
      createElementMock.mockReturnValue(linkElem)

      const result = await service.loadStyle(url)

      expect(result).toBe(true)
      expect(createElementMock).toHaveBeenCalledWith('link')
      expect(appendChildMock).toHaveBeenCalledWith(linkElem)
    })

    it('should return false if an error occurs while creating style', async () => {
      const url = 'https://example.com/style.css'
      service.urlLoadStatus.set(url, false)
      createElementMock.mockImplementation(() => { throw new Error('Error creating link element') })

      const result = await service.loadStyle(url)

      expect(result).toBe(false)
    })
  })
})
