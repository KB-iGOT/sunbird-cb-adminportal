import { LoggerService } from './logger.service'
import { ConfigurationsService } from './configurations.service'

describe('LoggerService', () => {
  let loggerService: LoggerService
  let mockConfigSvc: jest.Mocked<ConfigurationsService>

  beforeEach(() => {
    mockConfigSvc = {
      isProduction: false, // Default to non-production mode
    } as jest.Mocked<ConfigurationsService>

    loggerService = new LoggerService(mockConfigSvc)
  })

  it('should log info and warn when not in production', () => {
    const consoleInfoMock = jest.spyOn(console, 'info').mockImplementation()
    const consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation()

    // When isProduction is false
    mockConfigSvc.isProduction = false

    // Checking the log methods
    loggerService.info('info message')
    loggerService.warn('warn message')

    expect(consoleInfoMock).toHaveBeenCalledWith('info message')
    expect(consoleWarnMock).toHaveBeenCalledWith('warn message')

    consoleInfoMock.mockRestore()
    consoleWarnMock.mockRestore()
  })

  it('should not log info and warn when in production', () => {
    const consoleInfoMock = jest.spyOn(console, 'info').mockImplementation()
    const consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation()

    // When isProduction is true
    mockConfigSvc.isProduction = true

    // Checking the log methods
    loggerService.info('info message')
    loggerService.warn('warn message')

    // The methods should not be called in production mode
    expect(consoleInfoMock).not.toHaveBeenCalled()
    expect(consoleWarnMock).not.toHaveBeenCalled()

    consoleInfoMock.mockRestore()
    consoleWarnMock.mockRestore()
  })

  it('should log error correctly', () => {
    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation()

    // Calling the error log method
    loggerService.error('error message')

    // Error should always log regardless of production mode
    expect(consoleErrorMock).toHaveBeenCalledWith('error message')

    consoleErrorMock.mockRestore()
  })

  it('should throw error when console functions are removed', () => {
    const consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation()
    const consoleInfoMock = jest.spyOn(console, 'info').mockImplementation()
    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation()

    // Calling removeConsoleAccess when not in production
    mockConfigSvc.isProduction = false
    loggerService.removeConsoleAccess()

    expect(() => loggerService.info('info message')).toThrowError('Console Functions Usage Are Not Allowed.')
    expect(() => loggerService.warn('warn message')).toThrowError('Console Functions Usage Are Not Allowed.')
    expect(() => loggerService.error('error message')).toThrowError('Console Functions Usage Are Not Allowed.')

    consoleWarnMock.mockRestore()
    consoleInfoMock.mockRestore()
    consoleErrorMock.mockRestore()
  })

  it('should not throw error when console functions are removed in production', () => {
    // When in production, the removeConsoleAccess should not throw errors
    mockConfigSvc.isProduction = true

    const consoleInfoMock = jest.spyOn(console, 'info').mockImplementation()

    // Calling removeConsoleAccess in production mode should not have any effect
    loggerService.removeConsoleAccess()

    // It should still call the real console.info
    loggerService.info('info message')
    expect(consoleInfoMock).toHaveBeenCalledWith('info message')

    consoleInfoMock.mockRestore()
  })
})
