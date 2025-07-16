export default {
  // Test environment
  testEnvironment: 'node',
  
  // Enable ES module support
  preset: null,
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.js'
  ],
  
  // Coverage settings
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/cli.js',
    '!src/dashboard.js'
  ],
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Test timeout for long-running operations
  testTimeout: 30000,
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Transform configuration for ES modules
  transform: {},
  
  // Module file extensions
  moduleFileExtensions: ['js', 'json']
}; 