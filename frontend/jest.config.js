module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['<rootDir>/tst/**/*.test.{ts,tsx}'],
  moduleNameMapper: {
    '\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\.(png|jpg|jpeg|gif|svg|ico)$': '<rootDir>/__mocks__/fileMock.js',
  },
  transform: {
    '^.+\.[jt]sx?$': 'babel-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/main.tsx',
    '!tst/**',
  ],
  coverageThreshold: {
    global: {
      statements: 25,
      branches: 30,
      functions: 20,
      lines: 25,
    },
  },
};
