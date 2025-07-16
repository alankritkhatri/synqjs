// Jest setup file for queue tests
// Note: Environment variables should be set in test environment

// Global test configuration - suppress console.log during tests for cleaner output
const originalLog = console.log;
console.log = (...args) => {
  // Only show logs if they contain 'error' or 'fail'
  if (args.some(arg => typeof arg === 'string' && 
      (arg.includes('error') || arg.includes('fail') || arg.includes('Error')))) {
    originalLog(...args);
  }
}; 