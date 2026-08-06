import 'jest-preset-angular/setup-jest'
// Mock environment if needed
jest.mock('src/environments/environment', () => ({
  environment: {
    production: false,
    sitePath: '',
  },
}))
