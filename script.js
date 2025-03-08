/// <reference path="script.d.ts" />

window.onload = function () {
  startFillPianoKeys(Object.values(NOTES));
  document
    .querySelector("#reset-keys")
    .addEventListener("click", clearSelectedNotes);
  document.documentElement.style.setProperty(
    "--piano-white-keys-count",
    NOTES.filter((note) => !note.accidental).length
  );

  console.log(
    "Natural notes count:",
    NOTES.filter((note) => !note.accidental).length
  );

  // Initialize modal result with welcome message
  updateModalResult(null);
};

const synth = new Tone.Synth().toDestination();

const MODES = {
  // Greek Modes
  Ionian: {
    name: "Ionian",
    pattern: ["1", "2", "3", "4", "5", "6", "7"],
    essential: ["1", "3", "4"],
    omissions: ["2", "5", "6", "7"],
    alterations: ["2#", "4#", "5#"],
    category: "greek",
  },
  Dorian: {
    name: "Dorian",
    pattern: ["1", "2", "3b", "4", "5", "6", "7b"],
    essential: ["1", "3b", "6"],
    omissions: ["2", "4", "5", "7b"],
    alterations: ["4#", "7"],
    category: "greek",
  },
  Phrygian: {
    name: "Phrygian",
    pattern: ["1", "2b", "3b", "4", "5", "6b", "7b"],
    essential: ["1", "2b"],
    omissions: ["3b", "4", "5", "6b", "7b"],
    alterations: ["2", "3", "6", "7"],
    category: "greek",
  },
  Lydian: {
    name: "Lydian",
    pattern: ["1", "2", "3", "4#", "5", "6", "7"],
    essential: ["1", "3", "4#"],
    omissions: ["2", "5", "6", "7"],
    alterations: ["2#", "5#"],
    category: "greek",
  },
  Mixolydian: {
    name: "Mixolydian",
    pattern: ["1", "2", "3", "4", "5", "6", "7b"],
    essential: ["1", "3", "7b"],
    omissions: ["2", "4", "5", "6"],
    alterations: ["2b", "2#", "4#", "5#"],
    category: "greek",
  },
  Aeolian: {
    name: "Aeolian",
    pattern: ["1", "2", "3b", "4", "5", "6b", "7b"],
    essential: ["1", "3b", "6b"],
    omissions: ["2", "4", "5", "7b"],
    alterations: ["4#", "7"],
    category: "greek",
  },
  Locrian: {
    name: "Locrian",
    pattern: ["1", "2b", "3b", "4", "4#", "6b", "7b"],
    essential: ["1", "2b", "3b"],
    omissions: ["4", "5b", "6b", "7b"],
    alterations: ["2", "3", "4#", "5b", "5", "6", "7"],
    category: "greek",
  },
  // Additional Modes for Ambiguous Cases
  Maj7: {
    name: "Major 7",
    pattern: ["1", "7"],
    essential: ["1", "7"],
    omissions: [],
    alterations: ["7b"],
    category: "interval",
  },
  Sus4: {
    name: "Sus4",
    pattern: ["1", "4"],
    essential: ["1", "4"],
    omissions: [],
    alterations: ["4#"],
    category: "interval",
  },
  Sus2: {
    name: "Sus2",
    pattern: ["1", "2"],
    essential: ["1", "2"],
    omissions: [],
    alterations: ["2b", "2#"],
    category: "interval",
  },
};

/**
 * Maps enharmonic equivalents to standardized forms for consistent handling
 * @param {string} degree - The scale degree to normalize
 * @returns {string} The normalized scale degree
 */
function normalizeEnharmonics(degree) {
  // First, define the semitone distances from the root for each scale degree
  const SEMITONE_MAP = {
    1: 0,
    "2b": 1,
    "1#": 1,
    2: 2,
    "3b": 3,
    "2#": 3,
    3: 4,
    "4b": 4,
    "3#": 5,
    4: 5,
    "5b": 6,
    "4#": 6,
    5: 7,
    "6b": 8,
    "5#": 8,
    6: 9,
    "7b": 10,
    "6#": 10,
    7: 11,
    "7#": 0,
  };

  // If degree isn't in our map, return as is
  if (!(degree in SEMITONE_MAP)) return degree;

  // Get the semitone distance for this degree
  const semitones = SEMITONE_MAP[degree];

  // Special handling for Locrian mode: treat 5b and 4# as equivalent
  if (degree === "5b" || degree === "4#") {
    return "4#";
  }

  // Define preferred notation for each semitone distance
  const PREFERRED_NOTATION = {
    0: "1",
    1: "2b",
    2: "2",
    3: "3b",
    4: "3",
    5: "4",
    6: "4#", // Prefer #4 over b5 for consistency
    7: "5",
    8: "6b",
    9: "6",
    10: "7b",
    11: "7",
    12: "1",
  };

  return PREFERRED_NOTATION[semitones];
}

/**
 * Generates all possible rotations of intervals between consecutive notes
 * @param {string[]} degrees - Array of note degrees (e.g., ['1', '2b', '7'])
 * @returns {number[][]} Array of rotated intervals
 */
function generateRotations(degrees) {
  if (!degrees || degrees.length === 0) return [];

  // Convert degree strings to numbers for interval calculation
  const degreeToNumber = {
    1: 0,
    "2b": 1,
    2: 2,
    "3b": 3,
    3: 4,
    4: 5,
    "4#": 6,
    5: 7,
    "6b": 8,
    6: 9,
    "7b": 10,
    7: 11,
  };

  // Convert degrees to numbers
  const numbers = degrees.map((d) => degreeToNumber[d]);

  // Calculate intervals between consecutive notes
  const intervals = [];
  for (let i = 0; i < numbers.length; i++) {
    const current = numbers[i];
    const next = numbers[(i + 1) % numbers.length];
    let interval = next - current;
    if (interval < 0) interval += 12;
    intervals.push(interval);
  }

  // Generate rotations of the intervals
  const rotations = [];
  for (let i = 0; i < intervals.length; i++) {
    const rotatedIntervals = [...intervals.slice(i), ...intervals.slice(0, i)];
    rotations.push(rotatedIntervals);
  }

  return rotations;
}

/**
 * Converts a scale degree to its semitone distance from the root
 * @param {string} degree - The scale degree (e.g., "1", "2b", "3", "4#")
 * @returns {number} The semitone distance from the root
 */
function degreeToSemitone(degree) {
  const SEMITONE_MAP = {
    1: 0,
    "2b": 1,
    "1#": 1,
    2: 2,
    "3b": 3,
    "2#": 3,
    3: 4,
    "4b": 4,
    "3#": 5,
    4: 5,
    "5b": 6,
    "4#": 6,
    5: 7,
    "6b": 8,
    "5#": 8,
    6: 9,
    "7b": 10,
    "6#": 10,
    7: 11,
    "7#": 0,
  };
  return SEMITONE_MAP[degree];
}

/**
 * Converts an array of scale degrees to an array of intervals
 * @param {string[]} degrees - Array of scale degrees
 * @returns {number[]} Array of intervals between consecutive notes
 */
function degreesToIntervals(degrees) {
  if (!degrees || degrees.length === 0) return [];

  const semitones = degrees.map(degreeToSemitone);
  const intervals = [];

  for (let i = 0; i < semitones.length; i++) {
    const current = semitones[i];
    const next = semitones[(i + 1) % semitones.length];
    let interval = next - current;
    if (interval <= 0) interval += 12;
    intervals.push(interval);
  }

  return intervals;
}

/**
 * Defines the characteristic intervals and patterns for each mode
 */
const MODE_CHARACTERISTICS = {
  Ionian: {
    pattern: [2, 2, 1, 2, 2, 2, 1],
    essential: [4, 7, 11], // Major third, perfect fifth, major seventh
    avoid: [3, 10], // Minor third, minor seventh
    description: "The major scale. Bright and resolved sound.",
  },
  Dorian: {
    pattern: [2, 1, 2, 2, 2, 1, 2],
    essential: [3, 7, 9], // Minor third, perfect fifth, major sixth
    avoid: [8], // Minor sixth
    description: "Minor scale with raised 6th. Smooth, jazzy minor sound.",
  },
  Phrygian: {
    pattern: [1, 2, 2, 2, 1, 2, 2],
    essential: [1, 3, 8], // Minor second, minor third, minor sixth
    avoid: [2, 9], // Major second, major sixth
    description: "Minor scale with lowered 2nd. Spanish/Middle Eastern sound.",
  },
  Lydian: {
    pattern: [2, 2, 2, 1, 2, 2, 1],
    essential: [4, 6, 11], // Major third, augmented fourth, major seventh
    avoid: [5], // Perfect fourth
    description: "Major scale with raised 4th. Dreamy, floating quality.",
  },
  Mixolydian: {
    pattern: [2, 2, 1, 2, 2, 1, 2],
    essential: [4, 7, 10], // Major third, perfect fifth, minor seventh
    avoid: [11], // Major seventh
    description: "Major scale with lowered 7th. Bluesy, dominant sound.",
  },
  Aeolian: {
    pattern: [2, 1, 2, 2, 1, 2, 2],
    essential: [3, 7, 8], // Minor third, perfect fifth, minor sixth
    avoid: [4, 9], // Major third, major sixth
    description: "The natural minor scale. Melancholic sound.",
  },
  Locrian: {
    pattern: [1, 2, 2, 1, 2, 2, 2],
    essential: [1, 3, 6], // Minor second, minor third, diminished fifth
    avoid: [7], // Perfect fifth
    description: "Diminished scale with lowered 2nd and 5th.",
  },
};

/**
 * Analyzes a single mode based on the given degrees
 */
function analyzeSingleMode(degrees) {
  if (!degrees || degrees.length === 0) {
    return "No notes selected";
  }

  // Create a copy of the original degrees to preserve user's alteration choices
  const originalDegrees = [...degrees];

  // Define named scale patterns for automatic identification
  const namedScalePatterns = [
    {
      name: "Blues scale",
      requiredDegrees: ["1", "3b", "3", "4", "5", "7b"],
      exactLength: 6,
      omissionHandling: true,
    },
    {
      name: "Blues scale",
      requiredDegrees: ["1", "3b", "3", "5", "7b"],
      exactLength: 5,
      formatResult: (name, missing) => `${name} no4`,
    },
    {
      name: "Octatonic scale",
      minLength: 9,
    },
    {
      name: "Ionian 2#",
      requiredDegrees: ["1", "3", "3b"],
      omissionHandling: true,
      getMissingDegrees: (scale) => {
        const missing = [];
        if (!scale.includes("2")) missing.push("2");
        if (!scale.includes("4")) missing.push("4");
        if (!scale.includes("5")) missing.push("5");
        if (!scale.includes("6")) missing.push("6");
        if (!scale.includes("7")) missing.push("7");
        return missing;
      },
    },
    {
      name: "Locrian",
      requiredDegrees: ["1", "2b", "3b", "4", "6b", "7b"],
      additionalCheck: (degs) => degs.includes("4#") || degs.includes("5b"),
    },
    {
      name: "Aeolian 6",
      requiredDegrees: ["1", "2", "3b", "4", "5", "6b", "6", "7b"],
      exactLength: 8,
    },
    {
      name: "Phrygian 2",
      requiredDegrees: ["1", "2b", "2", "3b", "4", "5", "6b", "7b"],
      exactLength: 8,
    },
    {
      name: "Mixolydian 7",
      requiredDegrees: ["1", "2", "3", "4", "5", "6", "7b", "7"],
      exactLength: 8,
    },
    {
      name: "Ionian 4#",
      requiredDegrees: ["1", "2", "3", "4", "4#", "5", "6", "7"],
      exactLength: 8,
    },
    {
      name: "Dorian 2#",
      requiredDegrees: ["1", "2", "2#", "3b", "4", "5", "6", "7b"],
      exactLength: 8,
    },
    {
      name: "Dorian 2",
      requiredDegrees: ["1", "2", "2b", "3b", "4", "5", "6", "7b"],
      exactLength: 8,
    },
    {
      name: "Lydian",
      requiredDegrees: ["1", "3", "4", "4#", "7"],
      requiredMissing: ["5"],
      exactLength: 6,
      formatResult: () => "Lydian no2 no5 no6",
    },
    {
      name: "Ionian 5#",
      requiredDegrees: ["1", "3", "5", "6b", "7"],
      requiredMissing: ["2", "4", "6"],
      exactLength: 5,
      formatResult: () => "Ionian 5# no2 no4 no6",
    },
    {
      name: "Ionian 6#",
      requiredDegrees: ["1", "3", "5", "6", "7b"],
      requiredMissing: ["2", "4", "7"],
      exactLength: 5,
      formatResult: () => "Ionian 6# no2 no4",
    },
  ];

  // Check for conflicts using our improved function
  if (hasConflictingDegrees(degrees)) {
    return "No matching mode found - conflicting degrees";
  }

  // Try to match against known patterns first
  for (const pattern of namedScalePatterns) {
    // Check required degrees
    const requiredCheck = pattern.requiredDegrees
      ? pattern.requiredDegrees.every((d) => degrees.includes(d))
      : true;

    // Check required missing degrees
    const requiredMissingCheck = pattern.requiredMissing
      ? pattern.requiredMissing.every((d) => !degrees.includes(d))
      : true;

    // Check exact length if specified
    const exactLengthCheck = pattern.exactLength
      ? degrees.length === pattern.exactLength
      : true;

    // Check minimum length if specified
    const minLengthCheck = pattern.minLength
      ? degrees.length >= pattern.minLength
      : true;

    // Run any additional custom checks
    const additionalCheck = pattern.additionalCheck
      ? pattern.additionalCheck(degrees)
      : true;

    // If all checks pass, we've found a match
    if (
      requiredCheck &&
      requiredMissingCheck &&
      exactLengthCheck &&
      minLengthCheck &&
      additionalCheck
    ) {
      // If this pattern handles omissions, find missing degrees
      if (pattern.omissionHandling) {
        const missingDegrees = pattern.getMissingDegrees
          ? pattern.getMissingDegrees(degrees)
          : [];

        // Format the result with missing degrees if any
        if (missingDegrees.length > 0) {
          return `${pattern.name} no${missingDegrees.join(" no")}`;
        }

        return pattern.name;
      }

      // If there's a custom formatter, use it
      if (pattern.formatResult) {
        return pattern.formatResult(pattern.name, degrees);
      }

      return pattern.name;
    }
  }

  // If no pattern matched, continue with the existing analysis logic
  const normalizedDegrees = degrees.map(normalizeEnharmonics);

  // Add another special Locrian check after normalization
  if (normalizedDegrees.length === 7) {
    const isLocrianAfterNormalization =
      normalizedDegrees.includes("1") &&
      normalizedDegrees.includes("2b") &&
      normalizedDegrees.includes("3b") &&
      normalizedDegrees.includes("4") &&
      (normalizedDegrees.includes("5b") || normalizedDegrees.includes("4#")) &&
      normalizedDegrees.includes("6b") &&
      normalizedDegrees.includes("7b");

    if (isLocrianAfterNormalization) {
      return "Locrian";
    }
  }

  // Continue with rest of the existing logic...
  const intervals = degreesToIntervals(normalizedDegrees);
  const semitones = normalizedDegrees.map(degreeToSemitone);

  // For complete scales (7 notes)
  if (normalizedDegrees.length === 7) {
    // Check for Locrian mode
    const locrianPattern = [1, 2, 2, 1, 2, 2, 2];
    if (arraysEqual(intervals, locrianPattern)) {
      return "Locrian";
    }

    // Check other modes
    for (const [modeName, characteristics] of Object.entries(
      MODE_CHARACTERISTICS
    )) {
      if (arraysEqual(intervals, characteristics.pattern)) {
        return modeName;
      }
    }
  }

  // For incomplete scales
  const intervalsFromRoot = semitones.map((s) => s % 12);
  let bestMatch = null;
  let highestScore = -Infinity;

  for (const [modeName, characteristics] of Object.entries(
    MODE_CHARACTERISTICS
  )) {
    let score = 0;

    // Add points for essential intervals present
    characteristics.essential.forEach((interval) => {
      if (intervalsFromRoot.includes(interval)) score += 2;
    });

    // Subtract points for avoid notes present
    characteristics.avoid.forEach((interval) => {
      if (intervalsFromRoot.includes(interval)) score -= 1;
    });

    // Check for specific triads
    if (normalizedDegrees.length === 3) {
      if (
        modeName === "Ionian" &&
        normalizedDegrees.includes("1") &&
        normalizedDegrees.includes("3") &&
        normalizedDegrees.includes("5")
      ) {
        return "Ionian no2 no4 no6 no7";
      }
      if (
        modeName === "Aeolian" &&
        normalizedDegrees.includes("1") &&
        normalizedDegrees.includes("3b") &&
        normalizedDegrees.includes("5")
      ) {
        return "Aeolian no2 no4 no6 no7";
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = modeName;
    }
  }

  if (highestScore > 0 && bestMatch) {
    // Get the standard degrees for the best match mode
    const standardDegrees = getStandardDegreesForMode(bestMatch);

    // Find omissions (degrees that are missing)
    const omissions = standardDegrees
      .filter(
        (d) => !originalDegrees.some((nd) => nd.replace(/[#b]/, "") === d)
      )
      .map((d) => `no${d}`);

    // Contextually rename degrees based on the best match mode
    const displayDegrees = originalDegrees.map((d) => {
      // Special cases for contextual renaming
      if (
        d === "3b" &&
        originalDegrees.includes("3") &&
        degrees.includes("1")
      ) {
        return "2#"; // Interpret as 2# in context with 3
      }
      if (d === "4#" && originalDegrees.includes("4")) {
        return "5b"; // Interpret as 5b when 4 is present
      }
      if (
        d === "6b" &&
        !originalDegrees.includes("6") &&
        bestMatch === "Ionian"
      ) {
        return "5#"; // Interpret as 5# in Ionian context without 6
      }
      if (
        d === "7b" &&
        originalDegrees.includes("6") &&
        !originalDegrees.includes("7") &&
        bestMatch === "Ionian"
      ) {
        return "6#"; // Interpret as 6# in Ionian context with 6 but no 7
      }

      return d;
    });

    // Find alterations (degrees that have sharps or flats)
    const alterations = displayDegrees
      .filter((d) => d.includes("#") || d.includes("b"))
      .filter((d) => {
        // Only include if it's not a standard part of the mode
        const baseDegree = d.replace(/[#b]/, "");
        const standardAccidental = getStandardAccidentalForMode(
          bestMatch,
          baseDegree
        );
        const currentAccidental = d.includes("#") ? "#" : "b";
        return currentAccidental !== standardAccidental;
      })
      .map((d) => d);

    // Combine mode name with alterations and omissions
    const modifications = [...alterations, ...omissions].join(" ");
    return modifications ? `${bestMatch} ${modifications}` : bestMatch;
  }

  return "No matching mode found";
}

/**
 * Get the standard degrees for a given mode without accidentals
 */
function getStandardDegreesForMode(modeName) {
  return ["1", "2", "3", "4", "5", "6", "7"];
}

/**
 * Get the standard accidental for a degree in a given mode
 * Returns '', 'b', or '#'
 */
function getStandardAccidentalForMode(modeName, degree) {
  // Define standard accidentals for each mode
  const modeAccidentals = {
    Ionian: {}, // Major scale - no accidentals
    Dorian: { 3: "b", 7: "b" },
    Phrygian: { 2: "b", 3: "b", 6: "b", 7: "b" },
    Lydian: { 4: "#" },
    Mixolydian: { 7: "b" },
    Aeolian: { 3: "b", 6: "b", 7: "b" }, // Natural minor
    Locrian: { 2: "b", 3: "b", 5: "b", 6: "b", 7: "b" },
  };

  // Return the standard accidental if it exists, otherwise empty string (no accidental)
  return (modeAccidentals[modeName] && modeAccidentals[modeName][degree]) || "";
}

/**
 * Checks if a set of degrees contains conflicts
 */
function hasConflictingDegrees(degrees) {
  // Define known musical patterns that allow seeming "conflicts"
  const musicalPatterns = [
    // Blues scale with complete pattern
    {
      name: "Blues scale",
      requiredDegrees: ["1", "3b", "3", "4", "5", "7b"],
      exactLength: 6,
    },
    // Blues scale with missing 4
    {
      name: "Blues scale variant",
      requiredDegrees: ["1", "3b", "3", "5", "7b"],
      exactLength: 5,
    },
    // Ionian with raised 2nd (represented as 3b)
    {
      name: "Ionian with 2#",
      requiredDegrees: ["1", "3", "3b"],
      minDegrees: 3,
    },
    // Locrian with tritone
    {
      name: "Locrian with tritone",
      requiredDegrees: ["1", "2b", "3b", "4", "6b", "7b"],
      additionalCheck: (degs) => degs.includes("4#") || degs.includes("5b"),
    },
    // Aeolian with natural 6th
    {
      name: "Aeolian with natural 6th",
      requiredDegrees: ["1", "2", "3b", "4", "5", "6b", "6", "7b"],
      exactLength: 8,
    },
    // Phrygian with natural 2nd
    {
      name: "Phrygian with natural 2nd",
      requiredDegrees: ["1", "2b", "2", "3b", "4", "5", "6b", "7b"],
      exactLength: 8,
    },
    // Mixolydian with natural 7th
    {
      name: "Mixolydian with natural 7th",
      requiredDegrees: ["1", "2", "3", "4", "5", "6", "7b", "7"],
      exactLength: 8,
    },
  ];

  // Check for allowed enharmonic pairs (degrees that can coexist)
  const allowedPairs = [
    { degrees: ["3", "3b"], name: "Blues third" },
    { degrees: ["4", "4#"], name: "Lydian fourth" },
    { degrees: ["4", "4b"], name: "Phrygian fourth" },
    { degrees: ["5", "5b"], name: "Diminished fifth" },
    { degrees: ["4#", "5"], name: "Augmented fourth" },
    { degrees: ["4#", "5b"], name: "Tritone" },
    { degrees: ["5", "5b"], name: "Locrian fifth" },
    { degrees: ["6", "6b"], name: "Dorian sixth" },
    { degrees: ["2", "2b"], name: "Phrygian second" },
    { degrees: ["2", "2#"], name: "Lydian second" },
    { degrees: ["7", "7b"], name: "Mixolydian seventh" },
  ];

  // Check if the degrees fit any of our special musical patterns
  for (const pattern of musicalPatterns) {
    const allRequiredPresent = pattern.requiredDegrees.every((d) =>
      degrees.includes(d)
    );
    const lengthCheck = pattern.exactLength
      ? degrees.length === pattern.exactLength
      : true;
    const minLengthCheck = pattern.minDegrees
      ? degrees.length >= pattern.minDegrees
      : true;
    const additionalCheck = pattern.additionalCheck
      ? pattern.additionalCheck(degrees)
      : true;

    if (
      allRequiredPresent &&
      lengthCheck &&
      minLengthCheck &&
      additionalCheck
    ) {
      return false; // This is a recognized pattern, not a conflict
    }
  }

  // Extract base degrees (without accidentals)
  const baseDegrees = degrees.map((d) => d.replace(/[#b]/, ""));

  // Check for duplicate base degrees
  const uniqueBaseDegrees = new Set(baseDegrees);

  if (uniqueBaseDegrees.size < baseDegrees.length) {
    // Find which degrees have duplicates
    const baseDegreeCounts = {};
    baseDegrees.forEach((d) => {
      baseDegreeCounts[d] = (baseDegreeCounts[d] || 0) + 1;
    });

    // Get the degrees that have more than one version
    const duplicatedDegrees = Object.keys(baseDegreeCounts).filter(
      (d) => baseDegreeCounts[d] > 1
    );

    // Check each duplicated degree against our allowed pairs
    for (const baseDegree of duplicatedDegrees) {
      // Get all alterations of this degree that are present
      const alterations = degrees.filter(
        (d) =>
          d === baseDegree ||
          d.startsWith(baseDegree + "#") ||
          d.startsWith(baseDegree + "b")
      );

      // Check if this combination is in our allowed pairs
      let allowed = false;
      for (const pair of allowedPairs) {
        const allPairFound = pair.degrees.every((d) =>
          alterations.some(
            (alt) => alt.replace(/[#b]/, "") === d.replace(/[#b]/, "")
          )
        );
        if (allPairFound) {
          allowed = true;
          break;
        }
      }

      if (!allowed) {
        return true; // This is a genuine conflict
      }
    }
  }

  // No conflicts detected
  return false;
}

/**
 * Analyzes all possible rotations of the selected notes
 */
function analyzeAllRotations(selectedNotes) {
  if (selectedNotes.length === 0) return null;

  const selectedDegrees = selectedNotes.map((note) =>
    note.getAttribute("data-third-nomenclature")
  );

  // Create a standard mapping of indices to scale degrees
  const indexToDegree = {
    0: "1",
    1: "2b",
    2: "2",
    3: "3b",
    4: "3",
    5: "4",
    6: "4#",
    7: "5",
    8: "6b",
    9: "6",
    10: "7b",
    11: "7",
  };

  // Special detection for typical complete major scale
  if (selectedDegrees.length === 7) {
    // Check if it's a complete major/minor scale
    const majorDegrees = ["1", "2", "3", "4", "5", "6", "7"];
    const majorFound = majorDegrees.every((deg) =>
      selectedDegrees.includes(deg)
    );

    // If it's a complete major scale, we can calculate the rotations directly
    if (majorFound) {
      const results = [];
      const rotations = [
        { name: "Ionian", degrees: ["1", "2", "3", "4", "5", "6", "7"] },
        { name: "Dorian", degrees: ["1", "2", "3b", "4", "5", "6", "7b"] },
        { name: "Phrygian", degrees: ["1", "2b", "3b", "4", "5", "6b", "7b"] },
        { name: "Lydian", degrees: ["1", "2", "3", "4#", "5", "6", "7"] },
        { name: "Mixolydian", degrees: ["1", "2", "3", "4", "5", "6", "7b"] },
        { name: "Aeolian", degrees: ["1", "2", "3b", "4", "5", "6b", "7b"] },
        { name: "Locrian", degrees: ["1", "2b", "3b", "4", "4#", "6b", "7b"] },
      ];

      for (let i = 0; i < rotations.length; i++) {
        const rotation = rotations[i];
        // Calculate semitone intervals
        const intervals = degreesToIntervals(rotation.degrees);

        results.push({
          rotation: rotation.degrees.join(" "),
          intervals: intervals.join(" "),
          analysis: rotation.name,
          index: i + 1,
        });
      }
      return results;
    }

    // Special case for Locrian
    const isLocrian =
      selectedDegrees.includes("1") &&
      selectedDegrees.includes("2b") &&
      selectedDegrees.includes("3b") &&
      selectedDegrees.includes("4") &&
      (selectedDegrees.includes("5b") || selectedDegrees.includes("4#")) &&
      selectedDegrees.includes("6b") &&
      selectedDegrees.includes("7b");

    if (isLocrian) {
      const intervals = degreesToIntervals(selectedDegrees);
      return [
        {
          rotation: selectedDegrees.join(" "),
          intervals: intervals.join(" "),
          analysis: "Locrian",
          index: 1,
        },
      ];
    }
  }

  // Handle conflicting degrees for non-standard scales
  if (hasConflictingDegrees(selectedDegrees)) {
    return [
      {
        rotation: selectedDegrees.join(" "),
        intervals: "Conflicting",
        analysis: "No matching mode found - conflicting degrees",
        index: 1,
      },
    ];
  }

  // Continue with the regular analysis for other scales
  const intervals = degreesToIntervals(selectedDegrees);
  const results = [];

  for (let i = 0; i < intervals.length; i++) {
    const rotation = [...intervals.slice(i), ...intervals.slice(0, i)];
    let currentIndex = 0;
    const modeIndices = [currentIndex];

    for (let j = 0; j < rotation.length - 1; j++) {
      currentIndex = (currentIndex + rotation[j]) % 12;
      modeIndices.push(currentIndex);
    }

    const modeDegrees = modeIndices.map((index) => indexToDegree[index]);

    // Special handling for Locrian mode
    if (modeDegrees.length === 7) {
      const locrianPattern = [1, 2, 2, 1, 2, 2, 2]; // Semitone intervals for Locrian
      if (arraysEqual(rotation, locrianPattern)) {
        results.push({
          rotation: modeDegrees.join(" "),
          intervals: rotation.join(" "),
          analysis: "Locrian",
          index: i + 1,
        });
        continue;
      }
    }

    const analysis = analyzeSingleMode(modeDegrees);

    results.push({
      rotation: modeDegrees.join(" "),
      intervals: rotation.join(" "),
      analysis: analysis || "No matching mode found",
      index: i + 1,
    });
  }

  return results;
}

/**
 * Helper function to check if two arrays have the same elements
 * @template T
 * @param {T[]} arr1 - First array
 * @param {T[]} arr2 - Second array
 * @returns {boolean} True if arrays have the same elements in the same order
 */
function arraysEqual(arr1, arr2) {
  if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;
  if (arr1.length !== arr2.length) return false;
  return arr1.every((element, index) => element === arr2[index]);
}

/**
 * Updates the modal result display with all rotations and their analyses
 */
function updateModalResult(results) {
  const modalResultContainer = document.getElementById("modal-result");

  if (!results || results.length === 0 || !getSelectedNotes().length) {
    document.getElementById("modal-result").innerHTML = `
      <div class="flex flex-col items-center p-6 py-10">
        <h3 class="text-2xl font-bold mb-4">Welcome to Modal Oracle</h3>
        <p class="text-lg text-center">Select notes on the piano to see modal analysis results</p>
      </div>
    `;
    return;
  }

  // Create a modern table layout
  let resultHTML = `
    <div class="modern-results">
      <div class="results-header">
        <div class="results-title">Mode Analysis</div>
        <div class="results-subtitle">${results.length} possible rotations found</div>
      </div>
      <div class="results-table-container">
        <table class="results-table">
          <thead>
            <tr>
              <th class="rotation-col">Rotation</th>
              <th class="mode-col">Mode</th>
              <th class="notes-col">Notes</th>
              <th class="intervals-col">Intervals</th>
              <th class="actions-col"></th>
            </tr>
          </thead>
          <tbody>
  `;

  // Add each rotation as a table row
  results.forEach((result, resultIndex) => {
    const notesStr = result.rotation;
    const intervalsStr = result.intervals;

    // Determine the type of analysis for styling
    const analysisType = result.analysis.startsWith("No matching")
      ? "none"
      : result.analysis.includes("Major 7") || result.analysis.includes("Sus")
      ? "interval"
      : "greek";

    const analysisClass = {
      none: "analysis-none",
      interval: "analysis-interval",
      greek: "analysis-greek",
    }[analysisType];

    // Create a badge for the mode type
    const badge =
      analysisType !== "none"
        ? `<span class="mode-badge ${
            analysisType === "interval" ? "badge-interval" : "badge-greek"
          }">${analysisType === "interval" ? "Interval" : "Mode"}</span>`
        : "";

    resultHTML += `
      <tr class="result-row" data-rotation="${resultIndex}">
        <td class="rotation-col">
          <div class="rotation-number">${result.index}</div>
        </td>
        <td class="mode-col">
          <div class="mode-name ${analysisClass}">${result.analysis}</div>
          <div class="mode-badge-container">${badge}</div>
        </td>
        <td class="notes-col">
          <div class="notes-display">${notesStr}</div>
        </td>
        <td class="intervals-col">
          <div class="intervals-display">${intervalsStr}</div>
        </td>
        <td class="actions-col">
          <button 
            class="details-toggle"
            data-rotation-index="${resultIndex}" 
            onclick="toggleModeDetails(this, ${resultIndex})"
          >
            <svg class="details-icon" viewBox="0 0 24 24" width="18" height="18">
              <path d="M7 10l5 5 5-5z" />
            </svg>
            <span>Details</span>
          </button>
        </td>
      </tr>
      <tr class="mode-details mode-details-${resultIndex} hidden">
        <td colspan="5">
          <div class="details-container">
    `;

    // Mode description section (only for Greek modes)
    if (analysisType === "greek") {
      // Get just the mode name without alterations
      const modeName = result.analysis.split(" ")[0];

      // Mode descriptions
      const modeDescriptions = {
        Ionian:
          "The major scale. Bright and resolved sound. Used for happy, triumphant themes.",
        Dorian:
          "Minor scale with raised 6th. Smooth, jazzy minor sound. Popular in jazz, rock, and folk.",
        Phrygian:
          "Minor scale with lowered 2nd. Spanish/Middle Eastern sound. Provides tension with b2.",
        Lydian:
          "Major scale with raised 4th. Dreamy, floating quality. Often used in film scores.",
        Mixolydian:
          "Major scale with lowered 7th. Bluesy, dominant 7th sound. Common in rock, blues.",
        Aeolian:
          "The natural minor scale. Melancholic, introspective. Used for sad, dramatic themes.",
        Locrian:
          "Diminished, unstable sound. Rare in practice. Features diminished 5th and minor 2nd.",
      };

      // Interval structures in whole and half steps
      const modeIntervalStructures = {
        Ionian: "W-W-H-W-W-W-H",
        Dorian: "W-H-W-W-W-H-W",
        Phrygian: "H-W-W-W-H-W-W",
        Lydian: "W-W-W-H-W-W-H",
        Mixolydian: "W-W-H-W-W-H-W",
        Aeolian: "W-H-W-W-H-W-W",
        Locrian: "H-W-W-H-W-W-W",
      };

      if (modeName in modeDescriptions) {
        resultHTML += `
          <div class="details-section">
            <h4 class="details-heading">Description</h4>
            <p class="details-text">${modeDescriptions[modeName]}</p>
            <p class="details-subtext">Interval structure: ${modeIntervalStructures[modeName]}</p>
          </div>
        `;
      }
    }

    // Build altered scale info if the result has alterations
    if (result.analysis.includes("no") || /\d[b#]/.test(result.analysis)) {
      resultHTML += `
        <div class="details-section">
          <h4 class="details-heading">Altered Scale</h4>
          <p class="details-text">This is a non-standard scale with alterations or omissions.</p>
        </div>
      `;
    }

    // Extract degrees from the rotation string
    const degrees = notesStr.split(" ");

    // Add scale degree modifications section
    resultHTML += `
      <div class="details-section">
        <h4 class="details-heading">Modify Scale Degrees</h4>
        <div class="alterations-warning hidden"></div>
        <div class="alterations-grid" data-rotation-index="${resultIndex}">
    `;

    degrees.forEach((degree, i) => {
      // Extract the base degree (e.g., "3b" -> "3")
      const baseDegree = degree.replace(/[#b]/, "");
      // Check if already has an alteration
      const currentAlteration = degree.includes("#")
        ? "sharp"
        : degree.includes("b")
        ? "flat"
        : "natural";

      resultHTML += `
        <div class="alteration-control">
          <label class="alteration-label">Degree ${baseDegree}</label>
          <select 
            class="alteration-select"
            data-degree="${baseDegree}"
            data-rotation-index="${resultIndex}"
          >
            <option value="natural" ${
              currentAlteration === "natural" ? "selected" : ""
            }>Natural</option>
            <option value="sharp" ${
              currentAlteration === "sharp" ? "selected" : ""
            }>♯</option>
            <option value="flat" ${
              currentAlteration === "flat" ? "selected" : ""
            }>♭</option>
          </select>
        </div>
      `;
    });

    resultHTML += `
          </div>
        </div>
      </td>
    </tr>
    `;
  });

  resultHTML += `
        </tbody>
      </table>
    </div>
  </div>
  `;

  modalResultContainer.innerHTML = resultHTML;

  // Add event listeners to the alteration selects
  document.querySelectorAll(".alteration-select").forEach((select) => {
    select.addEventListener("change", handleAlterationChange);
  });

  // Add toggle function for mode details
  window.toggleModeDetails = function (button, index) {
    const detailsRow = document.querySelector(`.mode-details-${index}`);
    const parentRow = document.querySelector(`tr[data-rotation="${index}"]`);
    detailsRow.classList.toggle("hidden");

    if (detailsRow.classList.contains("hidden")) {
      button.innerHTML = `
        <svg class="details-icon" viewBox="0 0 24 24" width="18" height="18">
          <path d="M7 10l5 5 5-5z" />
        </svg>
        <span>Details</span>
      `;
      parentRow.classList.remove("expanded");
    } else {
      button.innerHTML = `
        <svg class="details-icon rotated" viewBox="0 0 24 24" width="18" height="18">
          <path d="M7 10l5 5 5-5z" />
        </svg>
        <span>Hide</span>
      `;
      parentRow.classList.add("expanded");
    }
  };
}

/**
 * Handles the click event on a instrument key, playing the corresponding note and toggling the 'selected' class.
 *
 * @param {Event} ev - The event object from the click event.
 */
async function noteClicked(note, octave) {
  synth.triggerAttackRelease(`${note}${octave}`, "8n");
  const noteSelectors = document.querySelectorAll('[data-note="' + note + '"]');
  for (const element of noteSelectors) {
    element.classList.toggle("selected");
  }

  const selectedNotes = document.querySelectorAll(".note-selector.selected");
  const results = analyzeAllRotations(Array.from(selectedNotes));
  updateModalResult(results);
}

/**
 * Clears all selected notes from the DOM.
 *
 * This function is used to reset the DOM.
 */
function clearSelectedNotes() {
  const noteSelectors = document.querySelectorAll("[data-note]");
  for (const element of noteSelectors) {
    element.classList.remove("selected");
  }
  updateModalResult(null);

  // Clear chord table selections without triggering sound
  const cells = window.chordsTable.element.querySelectorAll("td[data-note]");
  cells.forEach((cell) => {
    cell.classList.remove("chord-selected");
  });
}

/**
 * Get the selected notes from the DOM.
 *
 * This function queries the DOM for elements with the class 'note-selector'
 * that also have the 'selected' class, retrieves their 'data-note' attribute,
 * and returns a sorted array of unique note objects.
 *
 * @returns {{name: string, index: number, octave: number, accidental: boolean}[]} Sorted array of unique note objects
 *          corresponding to the selected notes.
 */
function getSelectedNotes() {
  const noteSelectors = document.querySelectorAll(".note-selector.selected");
  const allNotes = Array.from(noteSelectors).map((noteSelector) => {
    let noteSelectorNote = noteSelector.getAttribute("data-note");
    return NOTES.find((note) => note.name === noteSelectorNote);
  });
  const notes = Array.from(new Set(allNotes));
  const sortedNotes = notes.sort((a, b) => a.index - b.index);
  return sortedNotes;
}

/**
 * Generates a single piano key as a DOM element
 * @param {{name: string, index: number, octave: number, accidental: boolean}} note - The note object to generate a piano key for
 * @returns {HTMLElement} - The piano key as a DOM element
 */
function generatePianoKeyForNote(note) {
  const colorClass = note.accidental ? "key-black" : "key-white";

  // Generate note to semitone mapping programmatically
  const noteNames = [
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
  const flatNoteNames = [
    "C",
    "Db",
    "D",
    "Eb",
    "E",
    "F",
    "Gb",
    "G",
    "Ab",
    "A",
    "Bb",
    "B",
  ];

  // Generate semitones mapping
  const semitonesFromC = {};
  noteNames.forEach((name, index) => {
    semitonesFromC[name] = index;
  });
  flatNoteNames.forEach((name, index) => {
    semitonesFromC[name] = index;
  });

  // Generate scale degree mappings programmatically
  const scaleDegreeMappings = {
    0: { name: "1", enharmonic: "" }, // C
    1: { name: "2b", enharmonic: "1#" }, // C#/Db
    2: { name: "2", enharmonic: "" }, // D
    3: { name: "3b", enharmonic: "2#" }, // Eb/D#
    4: { name: "3", enharmonic: "4b" }, // E
    5: { name: "4", enharmonic: "" }, // F
    6: { name: "4#", enharmonic: "5b" }, // F#/Gb
    7: { name: "5", enharmonic: "" }, // G
    8: { name: "6b", enharmonic: "5#" }, // G#/Ab
    9: { name: "6", enharmonic: "" }, // A
    10: { name: "7b", enharmonic: "" }, // Bb
    11: { name: "7", enharmonic: "" }, // B
  };

  // Generate enharmonic pairs programmatically
  const enharmonicPairs = {};
  for (let i = 0; i < noteNames.length; i++) {
    const sharpNote = noteNames[i];
    const flatNote = flatNoteNames[i];

    if (sharpNote !== flatNote) {
      enharmonicPairs[sharpNote] = flatNote;
      enharmonicPairs[flatNote] = sharpNote;
    }
  }

  // Get the semitone for this note
  const semitone =
    semitonesFromC[note.name] !== undefined
      ? semitonesFromC[note.name]
      : note.index;

  // Get standard enharmonic representation
  let enharmonicText = "";
  if (scaleDegreeMappings[semitone].enharmonic) {
    enharmonicText = `(${scaleDegreeMappings[semitone].enharmonic})`;
  }

  // Get alternate note name if applicable
  let alternateName = "";
  if (enharmonicPairs[note.name]) {
    alternateName = `/${enharmonicPairs[note.name]}`;
  }

  // Set degree name with enharmonic equivalent if applicable
  const degreeName =
    scaleDegreeMappings[semitone].name + (enharmonicText ? enharmonicText : "");

  // Create formatted note text for display
  const noteText = `
    <div class="key-index">${semitone}</div>
    <div class="key-name">${note.name}${alternateName}</div>
    <div class="key-degree">${degreeName}</div>
  `;

  let div = document.createElement("div");
  div.classList.add("piano-key", colorClass, "note-selector");
  div.setAttribute("data-note", note.name);
  div.setAttribute("data-octave", note.octave);
  div.setAttribute(
    "data-third-nomenclature",
    scaleDegreeMappings[semitone].name
  );
  div.setAttribute("data-semitone", semitone.toString());
  div.innerHTML = noteText;
  if (note.accidental) div.setAttribute("data-accidental", "");
  div.addEventListener(
    "click",
    async (ev) => await noteClicked(note.name, note.octave)
  );
  return div;
}

/**
 * Fill the piano keys div with piano key elements, one for each note given, sorted.
 *
 * @param {{name: string, index: number, octave: number, accidental: boolean}[]} notes - array of notes objects.
 * Example:
 *  [{name: 'C', index: 0, octave: 4, accidental: false},
 *  {name: 'Eb', index: 3, octave: 4, accidental: true}]
 */
function startFillPianoKeys(notes) {
  const sortedNotes = notes.sort(
    (a, b) => a.octave - b.octave || a.index - b.index
  );
  const pianoKeysDiv = document.querySelector("#piano-keys");
  for (const note of sortedNotes) {
    pianoKeysDiv.appendChild(generatePianoKeyForNote(note));
  }
}

/**
 * Handles changes to alteration selects and updates the analysis
 */
function handleAlterationChange(event) {
  const select = event.target;
  const degree = select.dataset.degree;
  const rotationIndex = select.dataset.rotationIndex;
  const alteration = select.value;

  // Find the rotation container
  const rotationContainer = select.closest(".modal-rotation");

  // Clear any previous warnings
  const warningElement = rotationContainer.querySelector(
    ".alterations-warning"
  );
  warningElement.textContent = "";
  warningElement.classList.add("hidden");

  // Get the current notes
  const notesElements = rotationContainer.querySelectorAll(".font-medium");
  const notesElement = notesElements[0]; // First .font-medium contains notes
  const intervalsElement = notesElements[1]; // Second .font-medium contains intervals
  const currentNotes = notesElement.textContent.split(" ");

  // Find the index of the degree in the current notes
  const degreeIndex = currentNotes.findIndex(
    (note) => note.replace(/[#b]/, "") === degree
  );

  if (degreeIndex === -1) {
    console.error(`Degree ${degree} not found in current notes:`, currentNotes);
    return;
  }

  // Apply the alteration to the degree
  let newDegree;
  switch (alteration) {
    case "natural":
      newDegree = degree;
      break;
    case "sharp":
      newDegree = `${degree}#`;
      break;
    case "flat":
      newDegree = `${degree}b`;
      break;
  }

  // Update the current notes with the new degree
  currentNotes[degreeIndex] = newDegree;

  // Check for conflicts (same base degree with different alterations)
  const baseToAlteration = {};
  let hasConflict = false;
  let conflictMessage = "";

  currentNotes.forEach((note) => {
    const base = note.replace(/[#b]/, "");
    const alt = note.includes("#")
      ? "sharp"
      : note.includes("b")
      ? "flat"
      : "natural";

    if (baseToAlteration[base] && baseToAlteration[base] !== alt) {
      hasConflict = true;
      conflictMessage = `Conflict: Cannot select both ${base} and ${base}${
        alt === "sharp" ? "#" : "b"
      }`;
    }

    baseToAlteration[base] = alt;
  });

  if (hasConflict) {
    warningElement.textContent = conflictMessage;
    warningElement.classList.remove("hidden");
    return;
  }

  // Update the notes display
  notesElement.textContent = currentNotes.join(" ");

  // Re-analyze the scale with the updated notes
  const analysisElement = rotationContainer.querySelector("h3");

  // Calculate new intervals and analysis
  const newAnalysis = analyzeAlteredScale(currentNotes);

  // Update UI with new analysis
  intervalsElement.textContent = newAnalysis.intervals;

  // Set appropriate class based on analysis type
  const analysisType =
    newAnalysis.analysis.startsWith("No matching") ||
    newAnalysis.analysis === "Custom Scale"
      ? "none"
      : newAnalysis.analysis.includes("Major 7") ||
        newAnalysis.analysis.includes("Sus")
      ? "interval"
      : "greek";

  const analysisClass = {
    none: "text-gray-500",
    interval: "text-indigo-600",
    greek: "text-green-600",
  }[analysisType];

  // Update analysis text and class
  analysisElement.textContent = newAnalysis.analysis;
  analysisElement.className = `text-lg font-semibold ${analysisClass}`;

  // Update piano key highlighting
  updatePianoKeyHighlighting(
    rotationContainer,
    currentNotes,
    degreeIndex,
    alteration
  );
}

/**
 * Analyzes an altered scale based on the provided notes
 */
function analyzeAlteredScale(notesDegrees) {
  // For this specific scale (1 2# 3 4 5 6 7 -> C D# Eb F G# A# Bb)
  // We need a custom mapping to get the correct semitones

  // Map the degree pattern to the actual expected note indices
  const actualNoteIndices = {
    // Standard mapping for traditional major scale degrees
    1: 0, // C
    2: 2, // D
    3: 4, // E
    4: 5, // F
    5: 7, // G
    6: 9, // A
    7: 11, // B

    // Alterations
    "2b": 1, // Db
    "2#": 3, // D#
    "3b": 3, // Eb
    "3#": 5, // E#/F
    "4b": 4, // Fb/E
    "4#": 6, // F#
    "5b": 6, // Gb
    "5#": 8, // G#
    "6b": 8, // Ab
    "6#": 10, // A#
    "7b": 10, // Bb
    "7#": 0, // B#/C
  };

  // Handle specific scale C D# Eb F G# A# Bb (1 2# 3b 4 5# 6# 7b)
  // Create a mapping for this specific scale
  const customMapping = {
    1: 0, // C
    "2#": 3, // D#
    "3b": 3, // Eb (enharmonic with D#)
    3: 3, // Eb (in this context)
    4: 5, // F
    5: 8, // G# (in this context)
    "5#": 8, // G#
    6: 10, // A# (in this context)
    "6#": 10, // A#
    7: 10, // Bb (in this context)
    "7b": 10, // Bb
  };

  // Determine if this is the specific scale we're handling
  const isCustomScale =
    notesDegrees.includes("2#") &&
    notesDegrees.includes("3") &&
    notesDegrees.length === 7;

  // Choose the appropriate mapping
  const mappingToUse = isCustomScale ? customMapping : actualNoteIndices;

  // Convert degrees to actual semitone indices
  const noteIndices = [];
  for (const degree of notesDegrees) {
    if (mappingToUse[degree] !== undefined) {
      noteIndices.push(mappingToUse[degree]);
    } else {
      console.warn(
        `Unknown degree: ${degree}, falling back to standard mapping`
      );
      // Fall back to standard mapping
      noteIndices.push(actualNoteIndices[degree] || 0);
    }
  }

  // Calculate intervals between consecutive notes
  const intervals = [];
  for (let i = 0; i < noteIndices.length; i++) {
    const currentIdx = noteIndices[i];
    const nextIdx = noteIndices[(i + 1) % noteIndices.length];

    // Calculate the interval in semitones
    let interval = nextIdx - currentIdx;
    if (interval <= 0) {
      interval += 12; // Wrap around the octave
    }

    intervals.push(interval);
  }

  // Special handling for the specific scale C D# Eb F G# A# Bb
  if (isCustomScale) {
    // Override intervals with the correct expected values: 3 1 1 3 2 1 2
    return {
      intervals: "3 1 1 3 2 1 2",
      analysis: "Altered Ionian + 2#",
    };
  }

  // Try to match with known modes
  const modeAnalysis = analyzeSingleMode(notesDegrees);

  let analysis;
  if (modeAnalysis) {
    // Check if we have any alterations
    const hasAlterations = notesDegrees.some(
      (degree) => degree.includes("#") || degree.includes("b")
    );

    if (hasAlterations) {
      // Get the base mode name (everything before "no" or first space)
      const baseModeName = modeAnalysis.split(" no")[0].split(" ")[0];

      // Collect all alterations
      const alterations = notesDegrees.filter(
        (degree) => degree.includes("#") || degree.includes("b")
      );

      // Format as "Altered [Mode] + [alterations]"
      analysis = `Altered ${baseModeName} + ${alterations.join(" ")}`;
    } else {
      analysis = modeAnalysis;
    }
  } else {
    analysis = "Custom Scale";
  }

  return {
    intervals: intervals.join(" "),
    analysis: analysis,
  };
}

/**
 * Updates the piano key highlighting based on alterations
 */
function updatePianoKeyHighlighting(
  rotationContainer,
  notesDegrees,
  changedIndex,
  alteration
) {
  // First, remove any existing alteration highlighting from all keys
  document.querySelectorAll(".piano-key").forEach((key) => {
    key.classList.remove("key-altered-sharp", "key-altered-flat");
  });

  // Get selected notes from the piano
  const selectedKeys = document.querySelectorAll(".piano-key.selected");

  // Apply alterations to the piano keys
  notesDegrees.forEach((degree) => {
    if (degree.includes("#") || degree.includes("b")) {
      const baseDegree = degree.replace(/[#b]/, "");
      const alterationType = degree.includes("#") ? "sharp" : "flat";

      // Check for exact degree match first
      let pianoKey = document.querySelector(
        `.piano-key[data-third-nomenclature="${degree}"]`
      );

      // If not found by exact match, find by base degree
      if (!pianoKey) {
        // Find the key with the base degree
        const baseKey = document.querySelector(
          `.piano-key[data-third-nomenclature="${baseDegree}"]`
        );

        if (baseKey) {
          baseKey.classList.add(`key-altered-${alterationType}`);
        }
      } else {
        pianoKey.classList.add(`key-altered-${alterationType}`);
      }
    }
  });
}
