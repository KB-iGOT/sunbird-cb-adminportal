import { Globals } from './globals'

describe('Globals', () => {
  let globals: Globals

  beforeEach(() => {
    globals = new Globals()
  })

  it('should create an instance', () => {
    expect(globals).toBeTruthy()
  })

  it('should have firstTimeSetupDone as false by default', () => {
    expect(globals.firstTimeSetupDone).toBe(false)
  })

  it('should allow setting firstTimeSetupDone to true', () => {
    globals.firstTimeSetupDone = true
    expect(globals.firstTimeSetupDone).toBe(true)
  })
})
