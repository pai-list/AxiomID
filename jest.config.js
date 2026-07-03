/* eslint-disable @typescript-eslint/no-require-imports */
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.polyfills.js', '<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@json-render/react$': '<rootDir>/node_modules/@json-render/react/dist/index.js',
    '^@json-render/react/(.*)$': '<rootDir>/node_modules/@json-render/react/dist/$1.js',
    '^@json-render/core$': '<rootDir>/node_modules/@json-render/core/dist/index.js',
    '^@emulators/github$': '<rootDir>/node_modules/@emulators/github/dist/index.js',
    '^@emulators/adapter-next$': '<rootDir>/node_modules/@emulators/adapter-next/dist/index.js',
    '^@emulators/core$': '<rootDir>/node_modules/@emulators/core/dist/index.js',
    '^@stellar/stellar-sdk$': '<rootDir>/src/__mocks__/@stellar/stellar-sdk.js',
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/packages/',
    '<rootDir>/src/app/api/score/ip_resolution.test.ts',
    '<rootDir>/src/app/context/dna-context.test.ts',
    '<rootDir>/src/app/api/__tests__/test-harness.ts',
    '<rootDir>/src/__tests__/app/wallet-test-helpers.ts',
    '<rootDir>/src/__tests__/api/emulate-route.test.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}

const buildConfig = createJestConfig(customJestConfig);
module.exports = async () => {
  const config = await buildConfig();
  // Transpile ESM-only packages that ship un-bundled ES modules
  const esmPackages = '@noble/hashes|@noble/ed25519|@stellar/stellar-sdk|@stellar/stellar-base|uint8array-extras';
  const transpilePattern = `/node_modules/(?!(${esmPackages})/)`;
  // Safe merge: keep any existing patterns from Next.js defaults, replace only the default node_modules rule
  config.transformIgnorePatterns = [
    ...(config.transformIgnorePatterns || []).filter(p => p !== '/node_modules/'),
    transpilePattern,
  ];
  return config;
};
