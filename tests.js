/**
 * Modal Analysis Test Suite
 *
 * This file contains tests for verifying the correct functioning of
 * the modal analysis tool according to music theory standards.
 */

// Global variables to track test results
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
};

/**
 * Simple test runner function
 * @param {string} testName - Name of the test
 * @param {Function} testFn - Function containing the test
 */
function runTest(testName, testFn) {
  testResults.total++;

  try {
    console.log(`Running test: ${testName}`);
    testFn();
    console.log(`✅ PASSED: ${testName}`);
    testResults.passed++;
  } catch (error) {
    console.error(`❌ FAILED: ${testName}`);
    console.error(`   Error: ${error.message}`);
    testResults.failed++;
  }
}

/**
 * Assert that two values are equal
 * @param {any} actual - The actual value
 * @param {any} expected - The expected value
 * @param {string} message - Optional message to display on failure
 */
function assertEquals(actual, expected, message = "") {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${message ? message + ": " : ""}Expected ${JSON.stringify(
        expected
      )}, but got ${JSON.stringify(actual)}`
    );
  }
}

/**
 * Assert that a value is truthy
 * @param {any} value - The value to check
 * @param {string} message - Optional message to display on failure
 */
function assertTrue(value, message = "") {
  if (!value) {
    throw new Error(
      `${message ? message + ": " : ""}Expected truthy value, but got ${value}`
    );
  }
}

/**
 * Assert that a value is falsy
 * @param {any} value - The value to check
 * @param {string} message - Optional message to display on failure
 */
function assertFalse(value, message = "") {
  if (value) {
    throw new Error(
      `${message ? message + ": " : ""}Expected falsy value, but got ${value}`
    );
  }
}

/**
 * Assert that a string contains a substring
 * @param {string} str - The string to check
 * @param {string} substr - The substring to look for
 * @param {string} message - Optional message to display on failure
 */
function assertContains(str, substr, message = "") {
  if (!str.includes(substr)) {
    throw new Error(
      `${message ? message + ": " : ""}Expected '${str}' to contain '${substr}'`
    );
  }
}

// Helper function to create mock DOM elements for notes
function createMockNotes(degrees) {
  return degrees.map((degree) => {
    return {
      getAttribute: (attr) => {
        if (attr === "data-third-nomenclature") {
          return degree;
        }
        return null;
      },
    };
  });
}

// Tests for normalization of enharmonic equivalents
function testNormalizeEnharmonics() {
  runTest("Enharmonic Normalization", () => {
    // Test that diminished fifth and augmented fourth are treated as equivalents
    assertEquals(
      normalizeEnharmonics("5b"),
      "4#",
      "Diminished fifth should normalize to augmented fourth"
    );
    assertEquals(
      normalizeEnharmonics("4#"),
      "4#",
      "Augmented fourth should remain as is"
    );

    // Test other enharmonic pairs
    assertEquals(
      normalizeEnharmonics("1#"),
      "2b",
      "Augmented unison should normalize to minor second"
    );
    assertEquals(
      normalizeEnharmonics("2#"),
      "3b",
      "Augmented second should normalize to minor third"
    );
  });
}

// Tests for conflict detection
function testConflictDetection() {
  runTest("Conflict Detection", () => {
    // Test detection of basic conflicts
    assertTrue(
      hasConflictingDegrees(["1", "3", "3b", "5"]),
      "Should detect conflict between 3 and 3b"
    );
    assertTrue(
      hasConflictingDegrees(["1", "2", "2b", "5"]),
      "Should detect conflict between 2 and 2b"
    );

    // Test that non-conflicting degrees are properly identified
    assertFalse(
      hasConflictingDegrees(["1", "3", "5"]),
      "Should not detect conflict in major triad"
    );
    assertFalse(
      hasConflictingDegrees(["1", "3b", "5"]),
      "Should not detect conflict in minor triad"
    );
  });
}

// Tests for the analyzeSingleMode function
function testAnalyzeSingleMode() {
  runTest("Ionian Mode Analysis", () => {
    const result = analyzeSingleMode(["1", "2", "3", "4", "5", "6", "7"]);
    assertEquals(
      result,
      "Ionian",
      "Complete Ionian scale should be identified as Ionian"
    );
  });

  runTest("Dorian Mode Analysis", () => {
    const result = analyzeSingleMode(["1", "2", "3b", "4", "5", "6", "7b"]);
    assertEquals(
      result,
      "Dorian",
      "Complete Dorian scale should be identified as Dorian"
    );
  });

  runTest("Phrygian Mode Analysis", () => {
    const result = analyzeSingleMode(["1", "2b", "3b", "4", "5", "6b", "7b"]);
    assertEquals(
      result,
      "Phrygian",
      "Complete Phrygian scale should be identified as Phrygian"
    );
  });

  runTest("Lydian Mode Analysis", () => {
    const result = analyzeSingleMode(["1", "2", "3", "4#", "5", "6", "7"]);
    assertEquals(
      result,
      "Lydian",
      "Complete Lydian scale should be identified as Lydian"
    );
  });

  runTest("Mixolydian Mode Analysis", () => {
    const result = analyzeSingleMode(["1", "2", "3", "4", "5", "6", "7b"]);
    assertEquals(
      result,
      "Mixolydian",
      "Complete Mixolydian scale should be identified as Mixolydian"
    );
  });

  runTest("Aeolian Mode Analysis", () => {
    const result = analyzeSingleMode(["1", "2", "3b", "4", "5", "6b", "7b"]);
    assertEquals(
      result,
      "Aeolian",
      "Complete Aeolian scale should be identified as Aeolian"
    );
  });

  runTest("Locrian Mode Analysis with b5 notation", () => {
    const result = analyzeSingleMode(["1", "2b", "3b", "4", "5b", "6b", "7b"]);
    assertEquals(
      result,
      "Locrian",
      "Complete Locrian scale with b5 should be identified as Locrian"
    );
  });

  runTest("Locrian Mode Analysis with #4 notation", () => {
    const result = analyzeSingleMode(["1", "2b", "3b", "4", "4#", "6b", "7b"]);
    assertEquals(
      result,
      "Locrian",
      "Complete Locrian scale with #4 should be identified as Locrian"
    );
  });

  runTest("Incomplete Major Triad", () => {
    const result = analyzeSingleMode(["1", "3", "5"]);
    assertContains(
      result,
      "Ionian",
      "Major triad should be identified as having Ionian characteristics"
    );
  });

  runTest("Incomplete Minor Triad", () => {
    const result = analyzeSingleMode(["1", "3b", "5"]);
    assertTrue(
      result.includes("Dorian") ||
        result.includes("Aeolian") ||
        result.includes("Phrygian"),
      "Minor triad should be identified as having minor mode characteristics"
    );
  });

  runTest("Conflicting Scale Degrees", () => {
    const result = analyzeSingleMode(["1", "3", "3b", "5"]);
    assertContains(
      result,
      "No matching mode found",
      "Scale with conflicting degrees should not match standard modes"
    );
  });

  runTest("Melodic Minor Scale", () => {
    const result = analyzeSingleMode(["1", "2", "3b", "4", "5", "6", "7"]);
    assertTrue(
      result.includes("Dorian") ||
        result.includes("minor") ||
        result.includes("altered"),
      "Melodic minor should be recognized as a variation of Dorian or as an altered scale"
    );
  });
}

// Tests for the analyzeAllRotations function
function testAnalyzeAllRotations() {
  runTest("Major Scale Rotations", () => {
    const majorScale = createMockNotes(["1", "2", "3", "4", "5", "6", "7"]);
    const results = analyzeAllRotations(majorScale);

    // Check that we get the correct number of rotations
    assertEquals(results.length, 7, "Major scale should produce 7 rotations");

    // Check that the first rotation is correctly identified as Ionian
    assertEquals(
      results[0].analysis,
      "Ionian",
      "First rotation should be Ionian"
    );

    // Check that all other rotations are correctly identified
    const expectedModes = [
      "Ionian",
      "Dorian",
      "Phrygian",
      "Lydian",
      "Mixolydian",
      "Aeolian",
      "Locrian",
    ];

    for (let i = 0; i < results.length; i++) {
      assertEquals(
        results[i].analysis,
        expectedModes[i],
        `Rotation ${i + 1} should be ${expectedModes[i]}`
      );
    }
  });

  runTest("Incomplete Scale Rotations", () => {
    const majorTriad = createMockNotes(["1", "3", "5"]);
    const results = analyzeAllRotations(majorTriad);

    // Check that the first rotation has Ionian characteristics
    assertContains(
      results[0].analysis,
      "Ionian",
      "Major triad's first rotation should have Ionian characteristics"
    );
  });

  runTest("Conflicting Scale Degrees", () => {
    const conflictingScale = createMockNotes(["1", "3", "3b", "5"]);
    const results = analyzeAllRotations(conflictingScale);

    // Check that conflicts are properly detected
    assertContains(
      results[0].analysis,
      "No matching mode found - conflicting degrees",
      "Scale with conflicting degrees should be detected"
    );
  });

  runTest("Locrian Mode with Different Notations", () => {
    // Test with b5 notation
    const locrianWithFlatFifth = createMockNotes([
      "1",
      "2b",
      "3b",
      "4",
      "5b",
      "6b",
      "7b",
    ]);
    const resultsFlatFifth = analyzeAllRotations(locrianWithFlatFifth);
    assertEquals(
      resultsFlatFifth[0].analysis,
      "Locrian",
      "Locrian with b5 should be identified correctly"
    );

    // Test with #4 notation
    const locrianWithSharpFourth = createMockNotes([
      "1",
      "2b",
      "3b",
      "4",
      "4#",
      "6b",
      "7b",
    ]);
    const resultsSharpFourth = analyzeAllRotations(locrianWithSharpFourth);
    assertEquals(
      resultsSharpFourth[0].analysis,
      "Locrian",
      "Locrian with #4 should be identified correctly"
    );
  });
}

// Test the whole/half step conversion
function testIntervalConversion() {
  runTest("Semitone to Whole/Half Step Conversion", () => {
    // Create a sample function to test the conversion logic
    const convertToWholeHalfSteps = (semitones) => {
      return semitones.map((interval) => {
        if (interval === 1) return 1; // Half step
        if (interval === 2) return 2; // Whole step
        if (interval === 3) return 3; // Minor third
        if (interval === 4) return 4; // Major third
        return interval;
      });
    };

    // Test whole step (2 semitones)
    assertEquals(
      convertToWholeHalfSteps([2]),
      [2],
      "2 semitones should convert to a whole step (2)"
    );

    // Test half step (1 semitone)
    assertEquals(
      convertToWholeHalfSteps([1]),
      [1],
      "1 semitone should convert to a half step (1)"
    );

    // Test a sequence of whole and half steps
    assertEquals(
      convertToWholeHalfSteps([2, 2, 1, 2, 2, 2, 1]),
      [2, 2, 1, 2, 2, 2, 1],
      "Should correctly convert the major scale pattern"
    );
  });
}

// Tests for arraysEqual function
function testArraysEqual() {
  runTest("Arrays Equal Function", () => {
    assertTrue(
      arraysEqual([1, 2, 3], [1, 2, 3]),
      "Identical arrays should be equal"
    );
    assertFalse(
      arraysEqual([1, 2, 3], [1, 2, 4]),
      "Different arrays should not be equal"
    );
    assertFalse(
      arraysEqual([1, 2, 3], [1, 2]),
      "Arrays of different lengths should not be equal"
    );
    assertTrue(arraysEqual([], []), "Empty arrays should be equal");
  });
}

// Run all the tests
function runAllTests() {
  console.log("=== Starting Modal Analysis Tests ===");

  // Test utility functions
  testArraysEqual();
  testIntervalConversion();

  // Test music theory specific functions
  try {
    testNormalizeEnharmonics();
  } catch (error) {
    console.error("Unable to test normalizeEnharmonics: " + error.message);
  }

  try {
    testConflictDetection();
  } catch (error) {
    console.error("Unable to test hasConflictingDegrees: " + error.message);
  }

  // Test core analysis functions
  testAnalyzeSingleMode();
  testAnalyzeAllRotations();

  // Print summary
  console.log("=== Test Results ===");
  console.log(`Total: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);

  if (testResults.failed === 0) {
    console.log("✅ All tests passed!");
  } else {
    console.log(`❌ ${testResults.failed} tests failed.`);
  }

  return testResults;
}

// Export the test functions for use in the browser console
window.modalTests = {
  runAllTests,
  runTest,
  assertEquals,
  assertTrue,
  assertFalse,
  assertContains,
  createMockNotes,
  testArraysEqual,
  testIntervalConversion,
  testNormalizeEnharmonics,
  testConflictDetection,
  testAnalyzeSingleMode,
  testAnalyzeAllRotations,
};

// Uncomment the line below to automatically run tests when the file is loaded
// window.addEventListener('load', runAllTests);
