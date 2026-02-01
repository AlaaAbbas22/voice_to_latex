/**
 * @file utils.test.js
 * @description Integration tests for utils.js (Text-to-LaTeX conversion)
 * @date 2026-02-01
 *
 * Note: These are integration tests that make real API calls to Groq.
 * Make sure you have a valid API key in your .env file before running.
 */

const { llmResponse } = require("../utils");
const Groq = require("groq-sdk");
require("dotenv").config();

const groq = new Groq({ apiKey: process.env.key });

/**
 * Helper function to verify LaTeX conversion using LLM
 * @param {string} originalInput - The original text input
 * @param {string} latexOutput - The generated LaTeX output
 * @returns {Promise<boolean>} - True if conversion is correct, false otherwise
 */
async function verifyConversionWithLLM(originalInput, latexOutput) {
  const response = await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: `Given this original text: "${originalInput}"

And this LaTeX conversion: "${latexOutput}"

Is the LaTeX conversion mathematically correct and accurate? Consider:
1. Does it represent the same mathematical content?
2. Is the LaTeX syntax correct?
3. Are mathematical symbols properly used?

Answer in ONE WORD ONLY: TRUE or FALSE`,
      },
    ],
    model: "openai/gpt-oss-120b",
    temperature: 0,
  });

  const answer = response.choices[0]?.message?.content?.trim().toUpperCase();
  return answer === "TRUE";
}

describe("Utils - Text to LaTeX Conversion (Integration Tests)", () => {
  // Increase timeout for API calls (30 seconds)
  jest.setTimeout(30000);

  describe("llmResponse - Empty Input Handling", () => {
    test("should return empty string for null input", async () => {
      const result = await llmResponse(null);
      expect(result).toBe("");
    });

    test("should return empty string for undefined input", async () => {
      const result = await llmResponse(undefined);
      expect(result).toBe("");
    });

    test("should return empty string for empty string input", async () => {
      const result = await llmResponse("");
      expect(result).toBe("");
    });

    test("should return empty string for whitespace-only input", async () => {
      const result = await llmResponse("   ");
      expect(result).toBe("");
    });
  });

  describe("llmResponse - Basic LaTeX Conversion", () => {
    test("should convert 'square root of x' to LaTeX", async () => {
      const input = "square root of x";
      const result = await llmResponse(input);

      // Verify it contains sqrt
      expect(result).toContain("\\sqrt");
      expect(result).toContain("x");
      // Verify no dollar signs (as per requirements)
      expect(result).not.toMatch(/^\$/);
      expect(result).not.toMatch(/\$$/);
    });

    test("should convert 'x squared' to LaTeX", async () => {
      const input = "x squared";
      const result = await llmResponse(input);

      // Verify it contains x^2 or x^{2}
      expect(result).toMatch(/x\^[\{]?2[\}]?/);
    });

    test("should convert 'integral of x' to LaTeX", async () => {
      const input = "integral of x";
      const result = await llmResponse(input);

      // Verify it contains integral notation
      expect(result).toContain("\\int");
      expect(result).toContain("x");
    });

    test("should convert 'alpha' to LaTeX symbol", async () => {
      const input = "alpha";
      const result = await llmResponse(input);

      // Verify it converts to Greek letter
      expect(result).toContain("\\alpha");
    });

    test("should convert 'theta' to LaTeX symbol", async () => {
      const input = "theta";
      const result = await llmResponse(input);

      // Verify it converts to Greek letter
      expect(result).toContain("\\theta");
    });
  });

  describe("llmResponse - Natural Language with Text", () => {
    test("should wrap plain text in \\text{}", async () => {
      const input = "Let x equal 5";
      const result = await llmResponse(input);

      // Verify text is wrapped properly
      expect(result).toContain("\\text{");
      expect(result).toContain("x");
      expect(result).toContain("5");
    });

    test("should convert mixed text and math", async () => {
      const input =
        "The quadratic formula is negative b plus or minus square root of b squared minus 4ac all over 2a";
      const result = await llmResponse(input);

      // Verify key mathematical components
      expect(result).toContain("b");
      expect(result).toContain("\\sqrt");
      expect(result).toContain("4");
      expect(result).toContain("a");
      expect(result).toContain("c");
    });

    test("should handle fractions", async () => {
      const input = "one half";
      const result = await llmResponse(input);

      // Verify fraction notation
      expect(result).toMatch(/\\frac|1.*2|\\over/);
    });
  });

  describe("llmResponse - Caching", () => {
    test("should return same result for repeated input (cache)", async () => {
      const input = "x cubed";

      // First call - hits API
      const result1 = await llmResponse(input);
      expect(result1).toBeTruthy();

      // Second call - should use cache (will be much faster)
      const startTime = Date.now();
      const result2 = await llmResponse(input);
      const duration = Date.now() - startTime;

      // Results should be identical
      expect(result2).toBe(result1);
      // Cache hit should be very fast (< 10ms)
      expect(duration).toBeLessThan(10);
    });

    test("should trim input before checking cache", async () => {
      const input = "x to the fourth power";

      // Call with spaces
      const result1 = await llmResponse(`  ${input}  `);

      // Call without spaces - should use cache
      const startTime = Date.now();
      const result2 = await llmResponse(input);
      const duration = Date.now() - startTime;

      // Results should be identical
      expect(result2).toBe(result1);
      // Should be cached (fast)
      expect(duration).toBeLessThan(10);
    });
  });

  describe("llmResponse - Complex Expressions", () => {
    test("should handle exponents", async () => {
      const input = "e to the power of minus x";
      const result = await llmResponse(input);

      // Verify exponential notation
      expect(result).toContain("e");
      expect(result).toMatch(/\^/);
      expect(result).toContain("x");
    });

    test("should handle summation", async () => {
      const input = "sum from i equals 1 to n of i squared";
      const result = await llmResponse(input);

      // Verify summation notation
      expect(result).toContain("\\sum");
      expect(result).toContain("i");
      expect(result).toContain("n");
    });

    test("should handle limits", async () => {
      const input = "limit as x approaches infinity";
      const result = await llmResponse(input);

      // Verify limit notation
      expect(result).toContain("\\lim");
      expect(result).toContain("x");
      expect(result).toContain("\\infty");
    });
  });

  describe("llmResponse - Line Breaks", () => {
    test("should preserve line breaks with double backslash", async () => {
      const input = "First line\nSecond line";
      const result = await llmResponse(input);

      // Verify line breaks are converted
      expect(result).toContain("\\\\");
    });
  });

  describe("llmResponse - Output Format", () => {
    test("should not wrap output in dollar signs", async () => {
      const input = "x plus y";
      const result = await llmResponse(input);

      // Verify no dollar signs at start or end
      expect(result).not.toMatch(/^\$/);
      expect(result).not.toMatch(/\$$/);
      // Also check for $$ at start or end
      expect(result).not.toMatch(/^\$\$/);
      expect(result).not.toMatch(/\$\$$/);
    });

    test("should return valid LaTeX code", async () => {
      const input =
        "pythagorean theorem a squared plus b squared equals c squared";
      const result = await llmResponse(input);

      // Verify it's actual LaTeX content
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
      // Should contain some LaTeX notation
      expect(result).toMatch(/[a-z]\^|\\text|\\sqrt|\\frac|=/);
    });
  });

  describe("llmResponse - Deterministic Behavior", () => {
    test("should produce consistent output for the same input", async () => {
      const input = "derivative of x with respect to x";

      // Clear cache by using a unique input first time
      const timestamp = Date.now();
      const uniqueInput = `${input} ${timestamp}`;
      await llmResponse(uniqueInput);

      // Now test the actual input twice
      const result1 = await llmResponse(input);

      // Wait a bit and call again
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result2 = await llmResponse(input);

      // With temperature=0 and seed=42, results should be identical
      expect(result2).toBe(result1);
    });
  });

  describe("llmResponse - LLM-Verified Complex Conversions", () => {
    test("should correctly convert quadratic formula (verified by LLM)", async () => {
      const input =
        "The quadratic formula is x equals negative b plus or minus the square root of b squared minus four times a times c, all divided by two times a";
      const latexOutput = await llmResponse(input);

      // Verify the output is not empty
      expect(latexOutput).toBeTruthy();
      expect(latexOutput.length).toBeGreaterThan(0);

      // Ask another LLM to verify if the conversion is correct
      const isCorrect = await verifyConversionWithLLM(input, latexOutput);

      // Log for debugging
      console.log("\n📝 Input:", input);
      console.log("📊 LaTeX Output:", latexOutput);
      console.log("✅ LLM Verification:", isCorrect ? "TRUE" : "FALSE");

      expect(isCorrect).toBe(true);
    });

    test("should correctly convert Pythagorean theorem (verified by LLM)", async () => {
      const input =
        "The Pythagorean theorem states that a squared plus b squared equals c squared";
      const latexOutput = await llmResponse(input);

      expect(latexOutput).toBeTruthy();

      const isCorrect = await verifyConversionWithLLM(input, latexOutput);

      console.log("\n📝 Input:", input);
      console.log("📊 LaTeX Output:", latexOutput);
      console.log("✅ LLM Verification:", isCorrect ? "TRUE" : "FALSE");

      expect(isCorrect).toBe(true);
    });

    test("should correctly convert integral with limits (verified by LLM)", async () => {
      const input =
        "The integral from zero to infinity of e to the power of negative x with respect to x equals one";
      const latexOutput = await llmResponse(input);

      expect(latexOutput).toBeTruthy();

      const isCorrect = await verifyConversionWithLLM(input, latexOutput);

      console.log("\n📝 Input:", input);
      console.log("📊 LaTeX Output:", latexOutput);
      console.log("✅ LLM Verification:", isCorrect ? "TRUE" : "FALSE");

      expect(isCorrect).toBe(true);
    });

    test("should correctly convert complex expression with multiple operations (verified by LLM)", async () => {
      const input =
        "The derivative of sine of x plus cosine of x equals cosine of x minus sine of x";
      const latexOutput = await llmResponse(input);

      expect(latexOutput).toBeTruthy();

      const isCorrect = await verifyConversionWithLLM(input, latexOutput);

      console.log("\n📝 Input:", input);
      console.log("📊 LaTeX Output:", latexOutput);
      console.log("✅ LLM Verification:", isCorrect ? "TRUE" : "FALSE");

      expect(isCorrect).toBe(true);
    });

    test("should correctly convert summation notation (verified by LLM)", async () => {
      const input =
        "The sum from n equals one to infinity of one over n squared equals pi squared over six";
      const latexOutput = await llmResponse(input);

      expect(latexOutput).toBeTruthy();

      const isCorrect = await verifyConversionWithLLM(input, latexOutput);

      console.log("\n📝 Input:", input);
      console.log("📊 LaTeX Output:", latexOutput);
      console.log("✅ LLM Verification:", isCorrect ? "TRUE" : "FALSE");

      expect(isCorrect).toBe(true);
    });
  });
});
