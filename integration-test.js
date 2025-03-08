/**
 * Integration Test for Modal Oracle
 *
 * This script tests the ACTUAL functions from script.js to verify that
 * the real implementation works correctly, not just a simulation.
 */

console.log("=== Modal Oracle Integration Test Suite ===");

// Load the actual code modules
const fs = require("fs");
let scriptContent;

try {
  // Load data.js for NOTES and CHORDS data
  global.NOTES = [];
  global.CHORDS = {};
  const dataContent = fs.readFileSync("data.js", "utf8");

  // Execute with a safer approach
  const dataScript = new Function(
    "window",
    `
    const global = arguments[0];
    ${dataContent.replace(/document\..*?\)/g, "{}")};
    return { NOTES, CHORDS };
  `
  );

  const dataVars = dataScript(global);
  global.NOTES = dataVars.NOTES || [];
  global.CHORDS = dataVars.CHORDS || {};

  // Read the script.js file
  scriptContent = fs.readFileSync("script.js", "utf8");
} catch (err) {
  console.error("Failed to load scripts:", err);
  process.exit(1);
}

// Extract and expose key functions from script.js
const extractFunctions = () => {
  // Mock DOM APIs needed by script.js
  global.document = {
    querySelectorAll: () => [],
    querySelector: () => null,
    getElementById: () => ({ innerHTML: "" }),
    createElement: () => ({
      classList: { add: () => {}, remove: () => {}, toggle: () => {} },
      appendChild: () => {},
      setAttribute: () => {},
    }),
  };

  global.synth = { triggerAttackRelease: () => {} };
  global.window = global;

  // Extract key functions using regex
  const functionRegexes = {
    normalizeEnharmonics:
      /function\s+normalizeEnharmonics\s*\([^)]*\)\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/s,
    hasConflictingDegrees:
      /function\s+hasConflictingDegrees\s*\([^)]*\)\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/s,
    degreeToSemitone:
      /function\s+degreeToSemitone\s*\([^)]*\)\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/s,
    degreesToIntervals:
      /function\s+degreesToIntervals\s*\([^)]*\)\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/s,
    analyzeSingleMode:
      /function\s+analyzeSingleMode\s*\([^)]*\)\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/s,
    analyzeAllRotations:
      /function\s+analyzeAllRotations\s*\([^)]*\)\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/s,
    arraysEqual:
      /function\s+arraysEqual\s*\([^)]*\)\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/s,
  };

  let extractedFunctions = {};
  for (const [name, regex] of Object.entries(functionRegexes)) {
    const match = scriptContent.match(regex);
    if (match) {
      try {
        // Create function from the extracted code
        // We need to include any dependent functions it might call
        const functionStr = `
          return ${match[0]};
        `;
        extractedFunctions[name] = new Function(functionStr)();
      } catch (e) {
        console.error(`Failed to extract ${name} function:`, e);
      }
    }
  }

  return extractedFunctions;
};

// Create mock notes array for testing
const createNoteObjects = () => {
  return [
    { name: "C", index: 0, octave: 4, accidental: false },
    { name: "C#", index: 1, octave: 4, accidental: true },
    { name: "D", index: 2, octave: 4, accidental: false },
    { name: "D#", index: 3, octave: 4, accidental: true },
    { name: "E", index: 4, octave: 4, accidental: false },
    { name: "F", index: 5, octave: 4, accidental: false },
    { name: "F#", index: 6, octave: 4, accidental: true },
    { name: "G", index: 7, octave: 4, accidental: false },
    { name: "G#", index: 8, octave: 4, accidental: true },
    { name: "A", index: 9, octave: 4, accidental: false },
    { name: "A#", index: 10, octave: 4, accidental: true },
    { name: "B", index: 11, octave: 4, accidental: false },
  ];
};

// Create mock selected notes for testing
const createSelectedNotes = (noteNames) => {
  return noteNames.map((name) => ({
    getAttribute: (attr) => (attr === "data-note" ? name : null),
  }));
};

// Integration Tests
const integrationTests = {
  results: { passed: 0, failed: 0, total: 0 },
  functions: {},

  logSuccess(message) {
    console.log(`✅ ${message}`);
    this.results.passed++;
    this.results.total++;
  },

  logFailure(message, error) {
    console.error(`❌ ${message}`);
    if (error) console.error(`   Error: ${error.message || error}`);
    this.results.failed++;
    this.results.total++;
  },

  assert(condition, successMessage, failureMessage) {
    if (condition) {
      this.logSuccess(successMessage);
    } else {
      this.logFailure(failureMessage);
    }
  },

  setup() {
    try {
      // Extract actual functions from script.js
      this.functions = extractFunctions();

      // Check if we got the essential functions
      const requiredFunctions = [
        "normalizeEnharmonics",
        "analyzeSingleMode",
        "degreeToSemitone",
        "hasConflictingDegrees",
      ];

      const allFunctionsFound = requiredFunctions.every((fn) => {
        const hasFunction = typeof this.functions[fn] === "function";
        if (!hasFunction) {
          console.error(`Could not extract ${fn} function from script.js`);
        }
        return hasFunction;
      });

      if (!allFunctionsFound) {
        throw new Error(
          "Failed to extract all required functions from script.js"
        );
      }

      // Use actual NOTES if available or create a mock
      if (!global.NOTES || global.NOTES.length === 0) {
        global.NOTES = createNoteObjects();
      }

      this.logSuccess("Successfully set up integration test environment");
      return allFunctionsFound;
    } catch (error) {
      this.logFailure("Failed to set up integration test environment", error);
      return false;
    }
  },

  testEnharmonicNormalization() {
    try {
      const normalizeEnharmonics = this.functions.normalizeEnharmonics;

      // Test critical enharmonic pairs
      const tests = [
        {
          input: "5b",
          expected: "4#",
          message: "Diminished fifth normalizes to augmented fourth",
        },
        {
          input: "4#",
          expected: "4#",
          message: "Augmented fourth remains as is",
        },
        {
          input: "1#",
          expected: "2b",
          message: "Augmented unison normalizes to minor second",
        },
        {
          input: "2#",
          expected: "3b",
          message: "Augmented second normalizes to minor third",
        },
      ];

      let allPassed = true;
      tests.forEach((test) => {
        const result = normalizeEnharmonics(test.input);
        const passed = result === test.expected;
        if (!passed) {
          allPassed = false;
          this.logFailure(
            `${test.message}: expected ${test.expected}, got ${result}`
          );
        }
      });

      if (allPassed) {
        this.logSuccess(
          "Enharmonic normalization works correctly for all test cases"
        );
      }
    } catch (error) {
      this.logFailure("Enharmonic normalization test failed", error);
    }
  },

  testIntervalCalculation() {
    try {
      const degreeToSemitone = this.functions.degreeToSemitone;
      const degreesToIntervals = this.functions.degreesToIntervals;

      // Test semitone calculation
      const semitoneTests = [
        { input: "1", expected: 0, message: "Unison is 0 semitones" },
        { input: "3", expected: 4, message: "Major third is 4 semitones" },
        { input: "3b", expected: 3, message: "Minor third is 3 semitones" },
        { input: "5", expected: 7, message: "Perfect fifth is 7 semitones" },
      ];

      let allSemitonePassed = true;
      semitoneTests.forEach((test) => {
        const result = degreeToSemitone(test.input);
        const passed = result === test.expected;
        if (!passed) {
          allSemitonePassed = false;
          this.logFailure(
            `${test.message}: expected ${test.expected}, got ${result}`
          );
        }
      });

      if (allSemitonePassed) {
        this.logSuccess(
          "Semitone calculation works correctly for all test cases"
        );
      }

      // Test interval calculation for scales
      if (degreesToIntervals) {
        // Major scale should have W-W-H-W-W-W-H pattern (2-2-1-2-2-2-1)
        const majorScale = ["1", "2", "3", "4", "5", "6", "7"];
        const majorIntervals = degreesToIntervals(majorScale);
        const expectedMajorIntervals = [2, 2, 1, 2, 2, 2, 1];

        this.assert(
          JSON.stringify(majorIntervals) ===
            JSON.stringify(expectedMajorIntervals),
          "Major scale intervals are calculated correctly (W-W-H-W-W-W-H)",
          `Major scale intervals incorrect: expected ${expectedMajorIntervals}, got ${majorIntervals}`
        );

        // Minor scale should have W-H-W-W-H-W-W pattern (2-1-2-2-1-2-2)
        const minorScale = ["1", "2", "3b", "4", "5", "6b", "7b"];
        const minorIntervals = degreesToIntervals(minorScale);
        const expectedMinorIntervals = [2, 1, 2, 2, 1, 2, 2];

        this.assert(
          JSON.stringify(minorIntervals) ===
            JSON.stringify(expectedMinorIntervals),
          "Minor scale intervals are calculated correctly (W-H-W-W-H-W-W)",
          `Minor scale intervals incorrect: expected ${expectedMinorIntervals}, got ${minorIntervals}`
        );
      } else {
        this.logFailure(
          "Could not test interval calculation - function not available"
        );
      }
    } catch (error) {
      this.logFailure("Interval calculation test failed", error);
    }
  },

  testConflictDetection() {
    try {
      const hasConflictingDegrees = this.functions.hasConflictingDegrees;

      // Test conflict detection
      const conflictTests = [
        {
          input: ["1", "3", "3b", "5"],
          expected: true,
          message: "Detects conflict between 3 and 3b",
        },
        {
          input: ["1", "2", "2b", "5"],
          expected: true,
          message: "Detects conflict between 2 and 2b",
        },
        {
          input: ["1", "3", "5"],
          expected: false,
          message: "No conflict in major triad",
        },
        {
          input: ["1", "3b", "5"],
          expected: false,
          message: "No conflict in minor triad",
        },
        {
          input: ["1", "4", "4#", "5"],
          expected: false,
          message: "Handles special case with 4#",
        },
        {
          input: ["1", "4#", "5b", "7"],
          expected: false,
          message: "Handles 5b/4# as enharmonic equivalents",
        },
      ];

      let allConflictPassed = true;
      conflictTests.forEach((test) => {
        const result = hasConflictingDegrees(test.input);
        const passed = result === test.expected;
        if (!passed) {
          allConflictPassed = false;
          this.logFailure(
            `${test.message}: expected ${test.expected}, got ${result}`
          );
        }
      });

      if (allConflictPassed) {
        this.logSuccess(
          "Conflict detection works correctly for all test cases"
        );
      }
    } catch (error) {
      this.logFailure("Conflict detection test failed", error);
    }
  },

  testModeAnalysis() {
    try {
      const analyzeSingleMode = this.functions.analyzeSingleMode;

      // Test mode analysis with standard scales
      const modeTests = [
        {
          name: "Ionian (Major)",
          degrees: ["1", "2", "3", "4", "5", "6", "7"],
          expected: "Ionian",
        },
        {
          name: "Dorian",
          degrees: ["1", "2", "3b", "4", "5", "6", "7b"],
          expected: "Dorian",
        },
        {
          name: "Phrygian",
          degrees: ["1", "2b", "3b", "4", "5", "6b", "7b"],
          expected: "Phrygian",
        },
        {
          name: "Lydian",
          degrees: ["1", "2", "3", "4#", "5", "6", "7"],
          expected: "Lydian",
        },
        {
          name: "Mixolydian",
          degrees: ["1", "2", "3", "4", "5", "6", "7b"],
          expected: "Mixolydian",
        },
        {
          name: "Aeolian (Natural Minor)",
          degrees: ["1", "2", "3b", "4", "5", "6b", "7b"],
          expected: "Aeolian",
        },
        {
          name: "Locrian",
          degrees: ["1", "2b", "3b", "4", "5b", "6b", "7b"],
          expected: "Locrian",
        },
        {
          name: "Locrian with 4#",
          degrees: ["1", "2b", "3b", "4", "4#", "6b", "7b"],
          expected: "Locrian",
        },
      ];

      let allModePassed = true;
      modeTests.forEach((test) => {
        const result = analyzeSingleMode(test.degrees);
        const passed = result === test.expected;
        if (!passed) {
          allModePassed = false;
          this.logFailure(
            `${test.name} mode analysis: expected "${test.expected}", got "${result}"`
          );
        }
      });

      if (allModePassed) {
        this.logSuccess(
          "Mode analysis correctly identifies all standard modes"
        );
      }
    } catch (error) {
      this.logFailure("Mode analysis test failed", error);
    }
  },

  testRotationAnalysis() {
    try {
      const analyzeAllRotations = this.functions.analyzeAllRotations;

      if (analyzeAllRotations) {
        // Test C major (Ionian) scale
        const cMajorNotes = createSelectedNotes([
          "C",
          "D",
          "E",
          "F",
          "G",
          "A",
          "B",
        ]);
        const cMajorResults = analyzeAllRotations(cMajorNotes);

        const hasIonian = cMajorResults.some(
          (result) =>
            result.analysis === "Ionian" && result.rotation.includes("C")
        );

        this.assert(
          hasIonian,
          "C major notes correctly identified as Ionian in rotations analysis",
          "Failed to identify C major as Ionian in rotations analysis"
        );

        // Test A minor (Aeolian) scale
        const aMinorNotes = createSelectedNotes([
          "A",
          "B",
          "C",
          "D",
          "E",
          "F",
          "G",
        ]);
        const aMinorResults = analyzeAllRotations(aMinorNotes);

        const hasAeolian = aMinorResults.some(
          (result) =>
            result.analysis === "Aeolian" && result.rotation.includes("A")
        );

        this.assert(
          hasAeolian,
          "A minor notes correctly identified as Aeolian in rotations analysis",
          "Failed to identify A minor as Aeolian in rotations analysis"
        );
      } else {
        this.logFailure(
          "Could not test rotation analysis - function not available"
        );
      }
    } catch (error) {
      this.logFailure("Rotation analysis test failed", error);
    }
  },

  runAllTests() {
    console.log(
      "Starting integration tests with ACTUAL script.js functions..."
    );

    const setupSuccess = this.setup();
    if (!setupSuccess) {
      console.error("Failed to set up test environment. Aborting tests.");
      return;
    }

    // Run the tests
    this.testEnharmonicNormalization();
    this.testIntervalCalculation();
    this.testConflictDetection();
    this.testModeAnalysis();
    this.testRotationAnalysis();

    // Print summary
    console.log("\n=== Integration Test Results ===");
    console.log(`Total: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);

    if (this.results.failed === 0) {
      console.log(
        "✅ All integration tests passed! The Modal Oracle is ready for production."
      );
      console.log(
        "The actual script.js functions correctly implement music theory principles."
      );
    } else {
      console.log(
        `❌ ${this.results.failed} integration tests failed. Check your implementation before releasing.`
      );
    }
  },
};

// Run the integration tests
integrationTests.runAllTests();
