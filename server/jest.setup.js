/**
 * Jest setup file
 * Runs before all tests to set up the testing environment
 */

// Load environment variables from .env file for integration tests
require("dotenv").config();

// Verify API key is present
if (!process.env.key) {
  console.warn(
    "⚠️  Warning: No API key found in environment variables (process.env.key)"
  );
  console.warn("⚠️  Integration tests will fail without a valid Groq API key.");
  console.warn("⚠️  Please add your API key to the .env file.");
}

// Set test environment
process.env.NODE_ENV = "test";
