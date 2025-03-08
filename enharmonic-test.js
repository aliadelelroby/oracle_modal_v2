// Enharmonic Understanding Test Suite for Modal Oracle
// This script tests the improved conflict detection and mode analysis,
// especially for cases involving enharmonic equivalents like 3b/2#

// Import required functions from script.js (assuming they're accessible globally)
const fs = require("fs");
const scriptContent = fs.readFileSync("script.js", "utf8");

// Extract required functions
function extractFunction(name, content) {
  const functionRegex = new RegExp(
    `function ${name}\\s*\\([^)]*\\)\\s*{[\\s\\S]*?}(?=\\s*(?:function|$))`,
    "g"
  );
  const matches = content.match(functionRegex);
  if (!matches || matches.length === 0) {
    return null;
  }
  return matches[0];
}

// Extract helper functions
const normalizeEnharmonicsFunc = extractFunction(
  "normalizeEnharmonics",
  scriptContent
);
const hasConflictingDegreesFunc = extractFunction(
  "hasConflictingDegrees",
  scriptContent
);
const analyzeSingleModeFunc = extractFunction(
  "analyzeSingleMode",
  scriptContent
);
const degreesToIntervalsFunc = extractFunction(
  "degreesToIntervals",
  scriptContent
);
const degreeToSemitoneFunc = extractFunction("degreeToSemitone", scriptContent);
const arraysEqualFunc = extractFunction("arraysEqual", scriptContent);

// Create a controlled environment for testing
const MODE_CHARACTERISTICS = {
  Ionian: {
    pattern: [2, 2, 1, 2, 2, 2, 1],
    essential: [0, 4, 7], // 1, 3, 5
    avoid: [11], // 7b
  },
  Dorian: {
    pattern: [2, 1, 2, 2, 2, 1, 2],
    essential: [0, 2, 7], // 1, 2, 5
    avoid: [11], // 7b
  },
  Phrygian: {
    pattern: [1, 2, 2, 2, 1, 2, 2],
    essential: [0, 3, 7], // 1, 3b, 5
    avoid: [4], // 3
  },
  Lydian: {
    pattern: [2, 2, 2, 1, 2, 2, 1],
    essential: [0, 4, 6], // 1, 3, 4#
    avoid: [5], // 4
  },
  Mixolydian: {
    pattern: [2, 2, 1, 2, 2, 1, 2],
    essential: [0, 4, 10], // 1, 3, 7b
    avoid: [11], // 7
  },
  Aeolian: {
    pattern: [2, 1, 2, 2, 1, 2, 2],
    essential: [0, 3, 7], // 1, 3b, 5
    avoid: [4], // 3
  },
  Locrian: {
    pattern: [1, 2, 2, 1, 2, 2, 2],
    essential: [0, 3, 6], // 1, 3b, 5b
    avoid: [7], // 5
  },
};

function getStandardDegreesForMode(modeName) {
  switch (modeName) {
    case "Ionian":
      return ["1", "2", "3", "4", "5", "6", "7"];
    case "Dorian":
      return ["1", "2", "3b", "4", "5", "6", "7b"];
    case "Phrygian":
      return ["1", "2b", "3b", "4", "5", "6b", "7b"];
    case "Lydian":
      return ["1", "2", "3", "4#", "5", "6", "7"];
    case "Mixolydian":
      return ["1", "2", "3", "4", "5", "6", "7b"];
    case "Aeolian":
      return ["1", "2", "3b", "4", "5", "6b", "7b"];
    case "Locrian":
      return ["1", "2b", "3b", "4", "5b", "6b", "7b"];
    default:
      return [];
  }
}

function getStandardAccidentalForMode(modeName, degree) {
  const standardDegrees = getStandardDegreesForMode(modeName);
  for (const d of standardDegrees) {
    if (d.startsWith(degree)) {
      return d.includes("#") ? "#" : d.includes("b") ? "b" : "";
    }
  }
  return "";
}

// Evaluate the extracted functions in our test environment
eval(normalizeEnharmonicsFunc);
eval(hasConflictingDegreesFunc);
eval(analyzeSingleModeFunc);
eval(degreesToIntervalsFunc);
eval(degreeToSemitoneFunc);
eval(arraysEqualFunc);

// Test cases
const testCases = [
  // Test Case 1: The specific case we're addressing - Ionian with 2# represented as 3b
  {
    name: "Ionian with 2# represented as 3b (missing 5)",
    degrees: ["1", "2", "3b", "3", "4", "6", "7"],
    expectedResult: "Ionian 2# no5",
    description:
      "Should identify as Ionian with raised 2nd (2#) and missing 5th",
  },

  // Test Case 2: Same as above but missing different degrees
  {
    name: "Ionian with 2# represented as 3b (missing 6)",
    degrees: ["1", "2", "3b", "3", "4", "5", "7"],
    expectedResult: "Ionian 2# no6",
    description:
      "Should identify as Ionian with raised 2nd (2#) and missing 6th",
  },

  // Test Case 3: Ionian with both 3b and 3, but 3b should be interpreted as 2#
  {
    name: "Ionian 2# (complete scale)",
    degrees: ["1", "2", "3b", "3", "4", "5", "6", "7"],
    expectedResult: "Ionian 2#",
    description: "Should identify as Ionian with raised 2nd (2#) - full scale",
  },

  // Test Case 4: Classic blues scale with both 3 and 3b
  {
    name: "Blues scale with 3 and 3b",
    degrees: ["1", "3b", "3", "4", "5", "7b"],
    expectedResult: "Blues scale",
    description:
      "Should recognize the characteristic blues scale with both 3 and 3b",
  },

  // Test Case 5: Another case with 3b (as 2#) and 3
  {
    name: "Ionian 2# lacking multiple degrees",
    degrees: ["1", "2", "3b", "3", "4"],
    expectedResult: "Ionian 2# no5 no6 no7",
    description:
      "Should identify as Ionian with raised 2nd (2#) and missing 5th, 6th, and 7th",
  },

  // Test Case 6: Similar to case 1 but with different ordering
  {
    name: "Ionian 2# with different ordering",
    degrees: ["1", "3b", "2", "4", "3", "7", "6"],
    expectedResult: "Ionian 2# no5",
    description:
      "Should identify as Ionian with raised 2nd (2#) regardless of degree order",
  },

  // Test Case 7: Incomplete scale with both 3 and 3b
  {
    name: "Incomplete scale with both 3 and 3b",
    degrees: ["1", "3b", "3", "5"],
    expectedResult: "Ionian 2# no4 no6 no7",
    description: "Should identify as Ionian 2# with missing degrees",
  },

  // Test Case 8: Similar to the tritone special case (4# and 5b together)
  {
    name: "Scale with both 4# and 5b",
    degrees: ["1", "3", "4", "4#", "5b", "7"],
    expectedResult: "Lydian no2 no5 no6",
    description: "Should handle the tritone special case correctly",
  },

  // Test Case 9: Scale with 6b that should be interpreted as 5#
  {
    name: "Scale with 5# represented as 6b",
    degrees: ["1", "3", "5", "6b", "7"],
    expectedResult: "Ionian 5# no2 no4 no6",
    description: "Should interpret 6b as 5# in the right context",
  },

  // Test Case 10: Scale with 7b that should be interpreted as 6#
  {
    name: "Scale with 6# represented as 7b",
    degrees: ["1", "3", "5", "6", "7b"],
    expectedResult: "Ionian 6# no2 no4",
    description: "Should interpret 7b as 6# in the right context",
  },

  // Test Case 11: Genuine conflicting degrees that cannot be reinterpreted
  {
    name: "Genuinely conflicting degrees",
    degrees: ["1", "2", "2b", "3", "5"],
    expectedResult: "No matching mode found - conflicting degrees",
    description:
      "Should detect truly conflicting degrees that can't be reinterpreted",
  },

  // Test Case 12: Another conflict that can't be resolved
  {
    name: "Another conflicting case",
    degrees: ["1", "4", "4b", "5", "7"],
    expectedResult: "No matching mode found - conflicting degrees",
    description: "Should detect conflict between 4 and 4b",
  },

  // Test Case 13: Ionian scale with 4# instead of just 4
  {
    name: "Ionian with 4#",
    degrees: ["1", "2", "3", "4#", "5", "6", "7"],
    expectedResult: "Lydian",
    description: "Should identify as Lydian (which is Ionian with 4#)",
  },

  // Test Case 14: Dorian with 2#
  {
    name: "Dorian with 2#",
    degrees: ["1", "2", "2#", "3b", "4", "5", "6", "7b"],
    expectedResult: "Dorian 2#",
    description: "Should identify as Dorian with raised 2nd",
  },

  // Test Case 15: Locrian with both 4# and 5b
  {
    name: "Locrian with both 4# and 5b",
    degrees: ["1", "2b", "3b", "4", "4#", "5b", "6b", "7b"],
    expectedResult: "Locrian",
    description:
      "Should identify as Locrian with the special case handling of 4#/5b",
  },

  // Test Case 16: Complete octatonic scale (8 note scale)
  {
    name: "Octatonic scale",
    degrees: ["1", "2", "3b", "3", "4#", "5", "6", "7b", "7"],
    expectedResult: "Octatonic scale",
    description: "Should identify an octatonic scale pattern",
  },

  // Test Case 17: Aeolian with both 6 and 6b
  {
    name: "Aeolian with both 6 and 6b",
    degrees: ["1", "2", "3b", "4", "5", "6b", "6", "7b"],
    expectedResult: "Aeolian 6",
    description: "Should identify as Aeolian with natural 6th",
  },

  // Test Case 18: Phrygian with both 2 and 2b
  {
    name: "Phrygian with both 2 and 2b",
    degrees: ["1", "2b", "2", "3b", "4", "5", "6b", "7b"],
    expectedResult: "Phrygian 2",
    description: "Should identify as Phrygian with natural 2nd",
  },

  // Test Case 19: Mixolydian with both 7 and 7b
  {
    name: "Mixolydian with both 7 and 7b",
    degrees: ["1", "2", "3", "4", "5", "6", "7b", "7"],
    expectedResult: "Mixolydian 7",
    description: "Should identify as Mixolydian with natural 7th",
  },

  // Test Case 20: Ionian with both 4 and 4#
  {
    name: "Ionian with both 4 and 4#",
    degrees: ["1", "2", "3", "4", "4#", "5", "6", "7"],
    expectedResult: "Ionian 4#",
    description: "Should identify as Ionian with raised 4th",
  },
];

// Run the tests
function runTests() {
  console.log("=== Enharmonic Understanding Test Suite ===");
  console.log(
    `Testing ${testCases.length} scenarios for proper enharmonic handling`
  );
  console.log("");

  let passCount = 0;
  let failCount = 0;

  testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.name}`);
    console.log(`Input: ${testCase.degrees.join(", ")}`);

    const result = analyzeSingleMode(testCase.degrees);
    console.log(`Result: ${result}`);
    console.log(`Expected: ${testCase.expectedResult}`);

    const isConflicting = hasConflictingDegrees(testCase.degrees);
    console.log(`Has conflicting degrees: ${isConflicting}`);

    if (result === testCase.expectedResult) {
      console.log("✅ PASSED");
      passCount++;
    } else {
      console.log("❌ FAILED");
      failCount++;
    }

    console.log(testCase.description);
    console.log("");
  });

  console.log("=== Test Results ===");
  console.log(`Total Tests: ${testCases.length}`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${failCount}`);

  if (failCount === 0) {
    console.log(
      "✅ All tests passed! The enharmonic handling is working as expected."
    );
  } else {
    console.log("❌ Some tests failed. Further improvements may be needed.");
  }
}

// Run the tests
runTests();
