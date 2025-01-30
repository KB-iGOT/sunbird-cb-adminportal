// module.exports = {
//   preset: 'ts-jest',
//   testEnvironment: 'jsdom',
//   transform: {
//     '^.+\\.tsx?$': 'ts-jest',
//   },
//   // moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
//   // transformIgnorePatterns: ['/node_modules/'],
//   // moduleNameMapper: {
//   //   '^src/(.*)$': '/home/sujithsojan/Desktop/igot-jest/sunbird-cb-adminportal/src/$1',
//   // },
//   // setupFiles: ['/home/sujithsojan/Desktop/igot-jest/sunbird-cb-adminportal/src/jest.setup.ts'],
//   coverageDirectory: './coverage',
//   coverageReporters: ["clover", "json", "lcov", "text", "text-summary"],
//   collectCoverage: true,
//   testResultsProcessor: "jest-sonar-reporter"
// }


// module.exports = {
//   preset: 'ts-jest',
//   globals: {
//     'ts-jest': {
//        tsconfig: '<rootDir>/tsconfig.spec.json',
//        stringifyContentPathRegex: '\\.(html|svg)$',
//      },
//    },
//    coverageDirectory: './coverage',
//    transform: {
//     '^.+\\.(ts|mjs|js|html)$': 'jest-preset-angular',
//   },
//   transformIgnorePatterns: [
//     'node_modules/(?!.*\\.mjs$)',
//   ],
//   coverageReporters: ["clover", "json", "lcov", "text", "text-summary"],
//   collectCoverage: true,
//   testResultsProcessor: "jest-sonar-reporter"


// }

module.exports = {
  preset: 'jest-preset-angular',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setup-jest.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!.*\\.mjs$)',
  ],
  moduleNameMapper: {
    'worker-loader!.*': '<rootDir>/test/mocks/workerMock.js',
    'pdfjs-dist/build/pdf.worker': '<rootDir>/test/mocks/workerMock.js',
    "^src/environments/environment$": "<rootDir>/src/environments/environment.ts",
  },
  coverageReporters: ["clover", "json", "lcov", "text", "text-summary"],
  collectCoverage: true,
  testResultsProcessor: "jest-sonar-reporter",
  setupFiles: ['zone.js', ]
};
