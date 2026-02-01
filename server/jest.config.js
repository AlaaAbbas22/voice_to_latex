module.exports = {
  // Test environment
  testEnvironment: "node",

  // Test file patterns
  testMatch: [
    "**/src/**/*.test.js",
    "**/src/**/*.spec.js",
    "**/__tests__/**/*.js",
  ],

  // Coverage configuration
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/**/*.test.js",
    "!src/**/*.spec.js",
    "!src/index.js", // Exclude main entry point
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,

  // Setup files (if needed for environment variables)
  setupFiles: ["<rootDir>/jest.setup.js"],
};
