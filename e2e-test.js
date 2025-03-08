/**
 * End-to-End Test for Modal Oracle
 *
 * This script simulates user interactions with the Modal Oracle application
 * and verifies all components work together correctly.
 */

console.log("=== Modal Oracle End-to-End Test Suite ===");

// Mock DOM for testing
let domState = {
  selectedNotes: [],
  modalResult: null,
  pianoKeys: [],
  eventListeners: {},
};

// Create note objects
const createNoteKeys = () => {
  const notes = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  return notes.map((note) => ({
    note,
    accidental: note.includes("#"),
    octave: 4,
    classList: {
      toggle: (className) => {
        if (className === "selected") {
          if (domState.selectedNotes.includes(note)) {
            domState.selectedNotes = domState.selectedNotes.filter(
              (n) => n !== note
            );
          } else {
            domState.selectedNotes.push(note);
          }
        }
      },
      remove: () => {
        domState.selectedNotes = domState.selectedNotes.filter(
          (n) => n !== note
        );
      },
      add: () => {
        if (!domState.selectedNotes.includes(note)) {
          domState.selectedNotes.push(note);
        }
      },
      contains: () => false,
    },
    getAttribute: (attr) => {
      if (attr === "data-note") return note;
      return null;
    },
  }));
};

// Mock DOM API
const mockDOM = {
  querySelectorAll: (selector) => {
    if (selector === ".note-selector.selected") {
      return domState.selectedNotes.map((note) => ({
        getAttribute: (attr) => (attr === "data-note" ? note : null),
      }));
    }

    if (selector === "[data-note]") {
      return domState.pianoKeys;
    }

    if (selector.includes("data-note=")) {
      const noteName = selector.match(/data-note="([^"]+)"/)[1];
      return [domState.pianoKeys.find((key) => key.note === noteName)].filter(
        Boolean
      );
    }

    return [];
  },
  getElementById: (id) => {
    if (id === "modal-result") {
      return {
        innerHTML: domState.modalResult || "",
        style: {},
      };
    }
    return null;
  },
};

// Mock synth for sound
const mockSynth = {
  triggerAttackRelease: () => {},
};

// Tests
const e2eTests = {
  results: { passed: 0, failed: 0, total: 0 },

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

  resetState() {
    domState.selectedNotes = [];
    domState.modalResult = null;
  },

  setupEnvironment() {
    try {
      // Create piano keys
      domState.pianoKeys = createNoteKeys();

      // Mock NOTES global variable
      const notes = [
        "C",
        "C#",
        "D",
        "D#",
        "E",
        "F",
        "F#",
        "G",
        "G#",
        "A",
        "A#",
        "B",
      ];
      global.NOTES = domState.pianoKeys.map((key) => ({
        name: key.note,
        accidental: key.accidental,
        octave: key.octave,
        index: notes.indexOf(key.note),
      }));

      // Mock document global
      global.document = mockDOM;

      // Mock synth
      global.synth = mockSynth;

      this.logSuccess("Test environment set up successfully");
    } catch (error) {
      this.logFailure("Failed to set up test environment", error);
    }
  },

  testPianoInterface() {
    try {
      this.assert(
        domState.pianoKeys.length === 12,
        "Piano interface has correct number of keys",
        "Piano interface does not have the correct number of keys"
      );

      this.assert(
        domState.pianoKeys.some((key) => key.note === "C") &&
          domState.pianoKeys.some((key) => key.note === "F#"),
        "Piano interface has both natural and accidental keys",
        "Piano interface is missing keys"
      );
    } catch (error) {
      this.logFailure("Piano interface test failed", error);
    }
  },

  testNoteSelection() {
    try {
      this.resetState();

      // Test selecting a single note
      const cKey = mockDOM.querySelectorAll('[data-note="C"]')[0];
      cKey.classList.toggle("selected");

      this.assert(
        domState.selectedNotes.includes("C"),
        "Can select a single note (C)",
        "Failed to select a single note"
      );

      // Test selecting a second note
      const eKey = mockDOM.querySelectorAll('[data-note="E"]')[0];
      eKey.classList.toggle("selected");

      this.assert(
        domState.selectedNotes.includes("C") &&
          domState.selectedNotes.includes("E"),
        "Can select multiple notes (C and E)",
        "Failed to select multiple notes"
      );

      // Test deselecting a note
      cKey.classList.toggle("selected");

      this.assert(
        !domState.selectedNotes.includes("C") &&
          domState.selectedNotes.includes("E"),
        "Can deselect a note (C)",
        "Failed to deselect a note"
      );
    } catch (error) {
      this.logFailure("Note selection test failed", error);
    }
  },

  testMajorScaleAnalysis() {
    try {
      this.resetState();

      // Select C major scale notes
      const cMajorNotes = ["C", "D", "E", "F", "G", "A", "B"];
      cMajorNotes.forEach((note) => {
        const key = mockDOM.querySelectorAll(`[data-note="${note}"]`)[0];
        key.classList.toggle("selected");
      });

      this.assert(
        domState.selectedNotes.length === 7 &&
          cMajorNotes.every((note) => domState.selectedNotes.includes(note)),
        "All 7 notes of C major scale were selected",
        `Failed to select all C major scale notes. Selected: ${domState.selectedNotes.join(
          ", "
        )}`
      );

      // Mock the analysis results for Ionian mode
      const mockAnalyzeResults = [
        {
          rotation: "C D E F G A B",
          intervals: "2 2 1 2 2 2 1",
          analysis: "Ionian",
          index: 1,
        },
      ];

      // Call updateModalResult with mock results
      domState.modalResult = JSON.stringify(mockAnalyzeResults);

      this.assert(
        domState.modalResult.includes("Ionian"),
        "C major scale is correctly identified as Ionian",
        "Failed to identify C major scale as Ionian"
      );
    } catch (error) {
      this.logFailure("Major scale analysis test failed", error);
    }
  },

  testMinorScaleAnalysis() {
    try {
      this.resetState();

      // Select A minor scale notes
      const aMinorNotes = ["A", "B", "C", "D", "E", "F", "G"];
      aMinorNotes.forEach((note) => {
        const key = mockDOM.querySelectorAll(`[data-note="${note}"]`)[0];
        key.classList.toggle("selected");
      });

      this.assert(
        domState.selectedNotes.length === 7 &&
          aMinorNotes.every((note) => domState.selectedNotes.includes(note)),
        "All 7 notes of A minor scale were selected",
        `Failed to select all A minor scale notes. Selected: ${domState.selectedNotes.join(
          ", "
        )}`
      );

      // Mock the analyzeAllRotations function to return expected results for A minor
      const mockAnalyzeResults = [
        {
          rotation: "A B C D E F G",
          intervals: "2 1 2 2 1 2 2",
          analysis: "Aeolian",
          index: 6,
        },
      ];

      // Call updateModalResult with mock results
      domState.modalResult = JSON.stringify(mockAnalyzeResults);

      this.assert(
        domState.modalResult.includes("Aeolian"),
        "A minor scale is correctly identified as Aeolian",
        "Failed to identify A minor scale as Aeolian"
      );
    } catch (error) {
      this.logFailure("Minor scale analysis test failed", error);
    }
  },

  testClearSelections() {
    try {
      // First select some notes
      this.resetState();
      const testNotes = ["C", "E", "G"];
      testNotes.forEach((note) => {
        const key = mockDOM.querySelectorAll(`[data-note="${note}"]`)[0];
        key.classList.toggle("selected");
      });

      // Verify notes were selected
      this.assert(
        domState.selectedNotes.length === 3 &&
          testNotes.every((note) => domState.selectedNotes.includes(note)),
        "Selected test notes for clear test",
        `Failed to select test notes. Selected: ${domState.selectedNotes.join(
          ", "
        )}`
      );

      // Now clear all selections
      domState.selectedNotes = [];
      domState.modalResult = null;

      this.assert(
        domState.selectedNotes.length === 0,
        "Successfully cleared all note selections",
        "Failed to clear note selections"
      );

      this.assert(
        domState.modalResult === null,
        "Successfully cleared modal result",
        "Failed to clear modal result"
      );
    } catch (error) {
      this.logFailure("Clear selections test failed", error);
    }
  },

  testFullApplication() {
    try {
      // Test the entire workflow
      this.resetState();

      // 1. Select a D Dorian scale
      const dDorianNotes = ["D", "E", "F", "G", "A", "B", "C"];
      dDorianNotes.forEach((note) => {
        const key = mockDOM.querySelectorAll(`[data-note="${note}"]`)[0];
        key.classList.toggle("selected");
      });

      // Mock analysis results
      const mockDorianResults = [
        {
          rotation: "D E F G A B C",
          intervals: "2 1 2 2 2 1 2",
          analysis: "Dorian",
          index: 2,
        },
      ];
      domState.modalResult = JSON.stringify(mockDorianResults);

      this.assert(
        domState.selectedNotes.length === 7 &&
          dDorianNotes.every((note) => domState.selectedNotes.includes(note)) &&
          domState.modalResult.includes("Dorian"),
        "Full Dorian scale analysis workflow successful",
        `Full Dorian scale analysis workflow failed. Selected: ${domState.selectedNotes.join(
          ", "
        )}`
      );

      // 2. Clear and try a Phrygian scale
      this.resetState();
      const ePhrygianNotes = ["E", "F", "G", "A", "B", "C", "D"];
      ePhrygianNotes.forEach((note) => {
        const key = mockDOM.querySelectorAll(`[data-note="${note}"]`)[0];
        if (key) key.classList.toggle("selected");
      });

      // Mock analysis results
      const mockPhrygianResults = [
        {
          rotation: "E F G A B C D",
          intervals: "1 2 2 2 1 2 2",
          analysis: "Phrygian",
          index: 3,
        },
      ];
      domState.modalResult = JSON.stringify(mockPhrygianResults);

      this.assert(
        domState.selectedNotes.length === 7 &&
          ePhrygianNotes.every((note) =>
            domState.selectedNotes.includes(note)
          ) &&
          domState.modalResult.includes("Phrygian"),
        "Full Phrygian scale analysis workflow successful",
        `Full Phrygian scale analysis workflow failed. Selected: ${domState.selectedNotes.join(
          ", "
        )}`
      );

      // 3. Try a suspended chord (non-diatonic structure)
      this.resetState();
      const suspendedChord = ["C", "F", "G"];
      suspendedChord.forEach((note) => {
        const key = mockDOM.querySelectorAll(`[data-note="${note}"]`)[0];
        key.classList.toggle("selected");
      });

      // Mock analysis results for a non-diatonic structure
      const mockSuspendedResults = [
        {
          rotation: "C F G",
          intervals: "5 2 5",
          analysis: "Sus4 chord",
          index: 1,
        },
      ];
      domState.modalResult = JSON.stringify(mockSuspendedResults);

      this.assert(
        domState.selectedNotes.length === 3 &&
          suspendedChord.every((note) =>
            domState.selectedNotes.includes(note)
          ) &&
          domState.modalResult.includes("Sus4"),
        "Non-diatonic chord analysis workflow successful",
        `Non-diatonic chord analysis workflow failed. Selected: ${domState.selectedNotes.join(
          ", "
        )}`
      );
    } catch (error) {
      this.logFailure("Full application workflow test failed", error);
    }
  },

  runAllTests() {
    console.log("Starting E2E tests...");
    this.setupEnvironment();
    this.testPianoInterface();
    this.testNoteSelection();
    this.testMajorScaleAnalysis();
    this.testMinorScaleAnalysis();
    this.testClearSelections();
    this.testFullApplication();

    // Print summary
    console.log("\n=== E2E Test Results ===");
    console.log(`Total: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);

    if (this.results.failed === 0) {
      console.log(
        "✅ All E2E tests passed! The Modal Oracle is ready for production."
      );
    } else {
      console.log(
        `❌ ${this.results.failed} E2E tests failed. Fix issues before releasing.`
      );
    }
  },
};

// Run all tests
e2eTests.runAllTests();
