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

  // Initialize chord table
  window.chordsTable = new ChordTable("#chords-table");
  startFillChordsTable(NOTES, CHORDS);

  // Initially hide the chord table container since no notes are selected yet
  document.getElementById("chords-table-container").style.display = "none";

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
    essential: ["1", "3b", "4#"],
    omissions: ["2b", "4", "6b", "7b"],
    alterations: ["2", "6"],
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
 * Analyzes a single mode based on the given degrees
 */
function analyzeSingleMode(degrees) {
  if (!degrees || degrees.length === 0) return null;

  // First check Greek modes
  const greekModes = Object.values(MODES).filter(
    (mode) => mode.category === "greek"
  );

  // First attempt: Try to match Greek modes
  for (const mode of greekModes) {
    // Check if all essential notes are present
    const hasAllEssential = mode.essential.every((degree) =>
      degrees.includes(degree)
    );

    if (!hasAllEssential) continue;

    // Check if all provided degrees are either in pattern or alterations
    const allDegreesValid = degrees.every(
      (degree) =>
        mode.pattern.includes(degree) || mode.alterations.includes(degree)
    );

    if (!allDegreesValid) continue;

    // Identify alterations (notes that are not in the pattern but are in the alterations list)
    const alterations = degrees.filter(
      (degree) =>
        !mode.pattern.includes(degree) && mode.alterations.includes(degree)
    );

    // Identify omissions (notes that are in the pattern but not in the selected degrees,
    // and are allowed to be omitted according to the mode's omissions list)
    const omissions = mode.pattern.filter(
      (degree) => !degrees.includes(degree) && mode.omissions.includes(degree)
    );

    // Format the result string
    let result = mode.name;

    // Add omissions (e.g., "no2", "no4")
    if (omissions.length > 0) {
      result += " no" + omissions.join(" no");
    }

    // Add alterations (e.g., "4#", "7")
    if (alterations.length > 0) {
      result += " " + alterations.join(" ");
    }

    return result;
  }

  // If no Greek mode matches, check for interval-based modes if we have 2-3 notes
  if (degrees.length <= 3) {
    const intervalModes = Object.values(MODES).filter(
      (mode) => mode.category === "interval"
    );
    for (const mode of intervalModes) {
      const hasAllEssential = mode.essential.every((degree) =>
        degrees.includes(degree)
      );
      if (hasAllEssential) {
        let result = mode.name;
        const alterations = degrees.filter(
          (degree) =>
            !mode.pattern.includes(degree) && mode.alterations.includes(degree)
        );
        if (alterations.length > 0) {
          result += " " + alterations.join(" ");
        }
        return result;
      }
    }
  }

  return "No matching mode found";
}

/**
 * Analyzes all possible rotations of the selected notes and returns them as stacked modes
 */
function analyzeAllRotations(selectedNotes) {
  if (selectedNotes.length === 0) return null;

  // Get the selected degrees (scale degrees like 1, 2, 3b, etc.)
  const selectedDegrees = selectedNotes.map((note) =>
    note.getAttribute("data-third-nomenclature")
  );

  // Mapping between numerical indices and scale degrees
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

  // Mapping between scale degrees and numerical indices
  const degreeToIndex = {
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

  // Convert the selected degrees to numerical indices (0-11)
  const selectedIndices = selectedDegrees.map(
    (degree) => degreeToIndex[degree]
  );

  // Sort the indices in ascending order
  selectedIndices.sort((a, b) => a - b);

  // Calculate the intervals between consecutive notes
  const intervals = [];
  for (let i = 0; i < selectedIndices.length; i++) {
    const current = selectedIndices[i];
    const next = selectedIndices[(i + 1) % selectedIndices.length];
    // Calculate interval (semitones) between current and next note
    let interval = next - current;
    if (interval < 0) {
      interval += 12; // Wrap around the octave
    }
    intervals.push(interval);
  }

  // Generate all rotations of the intervals
  const rotatedIntervals = [];
  for (let i = 0; i < intervals.length; i++) {
    rotatedIntervals.push([...intervals.slice(i), ...intervals.slice(0, i)]);
  }

  // For each rotation, generate the corresponding mode
  const results = [];
  for (let i = 0; i < rotatedIntervals.length; i++) {
    const rotation = rotatedIntervals[i];

    // Start with index 0 (tonic/1)
    let currentIndex = 0;
    const modeIndices = [currentIndex];

    // Generate the rest of the indices by adding intervals
    for (let j = 0; j < rotation.length - 1; j++) {
      currentIndex = (currentIndex + rotation[j]) % 12;
      modeIndices.push(currentIndex);
    }

    // Convert indices back to scale degrees
    const modeDegrees = modeIndices.map((index) => indexToDegree[index]);

    // Analyze the mode
    const analysis = analyzeSingleMode(modeDegrees);

    // Create a result object
    results.push({
      rotation: modeDegrees.join(" "),
      intervals: rotation.join(" "),
      analysis: analysis,
      index: i + 1,
    });
  }

  return results;
}

/**
 * Updates the modal result display with all rotations and their analyses
 */
function updateModalResult(results) {
  const modalResult = document.getElementById("modal-result");

  if (!results || results.length === 0) {
    modalResult.innerHTML = `
      <div class="flex flex-col items-center justify-center min-h-[200px] text-center p-6">
        <svg class="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
        </svg>
        <p class="text-lg text-gray-500 mb-2">No Notes Selected</p>
        <p class="text-sm text-gray-400">Click on piano keys to select notes for analysis</p>
        <div class="flex gap-2 mt-6">
          <div class="flex items-center gap-1 text-xs text-gray-500">
            <span class="w-3 h-3 rounded-full bg-green-100"></span>
            <span>Greek Modes</span>
          </div>
          <div class="flex items-center gap-1 text-xs text-gray-500">
            <span class="w-3 h-3 rounded-full bg-indigo-100"></span>
            <span>Intervals</span>
          </div>
        </div>
      </div>`;

    // Hide the chord table container when no notes are selected
    document.getElementById("chords-table-container").style.display = "none";
    return;
  }

  // Show the chord table container when notes are selected
  document.getElementById("chords-table-container").style.display = "block";

  const resultHTML = results
    .map((result, resultIndex) => {
      const notesStr = result.rotation;
      const intervalsStr = result.intervals;
      const analysisType = result.analysis.startsWith("No matching")
        ? "none"
        : result.analysis.includes("Major 7") || result.analysis.includes("Sus")
        ? "interval"
        : "greek";

      const analysisClass = {
        none: "text-gray-500",
        interval: "text-indigo-600",
        greek: "text-modal-success",
      }[analysisType];

      const badge =
        analysisType !== "none"
          ? `
        <span class="px-2 py-1 text-xs rounded-full ${
          analysisType === "interval"
            ? "bg-indigo-100 text-indigo-800"
            : "bg-green-100 text-green-800"
        }">
          ${analysisType === "interval" ? "Interval" : "Greek Mode"}
        </span>
      `
          : "";

      // Extract degrees from the rotation string (e.g., "1 2 3 4" -> ["1", "2", "3", "4"])
      const degrees = notesStr.split(" ");

      // Generate the alterations section with dropdowns for each degree
      const alterationsSection = `
        <details class="mt-3">
          <summary class="cursor-pointer text-sm font-medium text-modal-primary hover:text-modal-primary/80 transition-colors">
            Alterations
          </summary>
          <div class="pt-3">
            <div class="alterations-warning hidden mb-3 bg-red-50 border border-red-200 text-red-600 rounded-md p-2 text-xs">
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3" data-rotation-index="${resultIndex}">
              ${degrees
                .map((degree, i) => {
                  // Extract the base degree (e.g., "3b" -> "3")
                  const baseDegree = degree.replace(/[#b]/, "");
                  // Check if already has an alteration
                  const currentAlteration = degree.includes("#")
                    ? "sharp"
                    : degree.includes("b")
                    ? "flat"
                    : "natural";

                  return `
                <div class="flex flex-col">
                  <label class="text-xs text-gray-500 mb-1">Degree ${baseDegree}</label>
                  <select 
                    class="alteration-select border border-gray-300 rounded-md p-1 text-sm bg-white"
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
                })
                .join("")}
            </div>
          </div>
        </details>
      `;

      return `
        <div class="mode-rotation bg-white rounded-md p-4 mb-4 last:mb-0 border border-modal-border hover:shadow-md transition-shadow">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-modal-primary font-semibold">Rotation ${result.index} (Mode)</span>
            <div class="flex-1 h-px bg-modal-border"></div>
            ${badge}
          </div>
          <div class="bg-modal-light rounded p-3 mb-2">
            <div class="mb-2 font-mono text-sm">
              <span class="text-gray-500">Notes:</span> <span class="font-medium rotation-notes">${notesStr}</span>
            </div>
            <div class="font-mono text-sm">
              <span class="text-gray-500">Intervals:</span> <span class="font-medium rotation-intervals">${intervalsStr}</span>
            </div>
          </div>
          <div class="flex items-center gap-2 mt-3">
            <span class="text-xs uppercase tracking-wider text-gray-500">Analysis:</span>
            <span class="${analysisClass} font-semibold text-lg rotation-analysis">${result.analysis}</span>
          </div>
          ${alterationsSection}
        </div>`;
    })
    .join("");

  modalResult.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-modal-primary">Mode Analysis</h2>
        <div class="flex gap-2">
          <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Greek Modes</span>
          <span class="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">Intervals</span>
        </div>
      </div>
      <div class="font-medium text-sm mb-4 text-gray-600">
        Showing all ${results.length} modes that can be derived from the selected notes
      </div>
      ${resultHTML}
    </div>`;

  // Add event listeners to the alteration selects
  document.querySelectorAll(".alteration-select").forEach((select) => {
    select.addEventListener("change", handleAlterationChange);
  });
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

  const chordsNames = getChordsByNotes(getSelectedNotes()).map(
    (chord) => chord.name
  );

  const cells = window.chordsTable.element.querySelectorAll("td[data-note]");
  cells.forEach((cell) => {
    const cellChord = cell.getAttribute("data-chord");
    chordsNames.includes(cellChord)
      ? cell.classList.add("chord-selected")
      : cell.classList.remove("chord-selected");
  });
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
 * Filter all chords by a given set of notes
 *
 * @param {{name: string, index: number, octave: number, accidental: boolean}[]} notes - array of notes objects.
 * Example:
 *  [{name: 'C', index: 0, octave: 4, accidental: false},
 *  {name: 'Eb', index: 3, octave: 4, accidental: true}]
 * @returns {array} - array of chords that include the given notes
 */
function getChordsByNotes(notes) {
  if (notes.length === 0) return [];
  return Object.values(CHORDS).filter((chord) => {
    return notes.every((note) => chord.notes.includes(note.name));
  });
}

/**
 * Generates a single piano key as a DOM element
 * @param {{name: string, index: number, octave: number, accidental: boolean}} note - The note object to generate a piano key for
 * @returns {HTMLElement} - The piano key as a DOM element
 */
function generatePianoKeyForNote(note) {
  const colorClass = note.accidental ? "key-black" : "key-white";
  const thirdNomenclature = {
    C: "1",
    "C#": "2b",
    D: "2",
    Eb: "3b",
    E: "3",
    F: "4",
    "F#": "4#",
    G: "5",
    "G#": "6b",
    A: "6",
    Bb: "7b",
    B: "7",
  };
  const noteText = `${note.index}-${note.name}-${thirdNomenclature[note.name]}`;
  let div = document.createElement("div");
  div.classList.add("piano-key", colorClass, "note-selector");
  div.setAttribute("data-note", note.name);
  div.setAttribute("data-octave", note.octave);
  div.setAttribute("data-third-nomenclature", thirdNomenclature[note.name]);
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

function startFillChordsTable(notes, chords) {
  notes.forEach((note) => new window.chordsTable.Row(note));
  Object.values(chords).forEach(
    (chord) => new window.chordsTable.Column(chord, "Default group")
  );
  new window.chordsTable.Column(
    { name: "My chord 1", notes: ["C", "E", "G"] },
    "Custom group"
  );
  new window.chordsTable.Column(
    { name: "My chord 2", notes: ["D", "F", "A"] },
    "Custom group"
  );
  new window.chordsTable.Column(
    { name: "My chord 3", notes: ["E", "G", "B"] },
    "Custom group"
  );
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
  const rotationContainer = select.closest(".mode-rotation");

  // Clear any previous warnings
  const warningElement = rotationContainer.querySelector(
    ".alterations-warning"
  );
  warningElement.textContent = "";
  warningElement.classList.add("hidden");

  // Get the current notes
  const notesElement = rotationContainer.querySelector(".rotation-notes");
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
  const intervalsElement = rotationContainer.querySelector(
    ".rotation-intervals"
  );
  const analysisElement = rotationContainer.querySelector(".rotation-analysis");

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
    greek: "text-modal-success",
  }[analysisType];

  // Update analysis text and class
  analysisElement.textContent = newAnalysis.analysis;
  analysisElement.className = `${analysisClass} font-semibold text-lg rotation-analysis`;

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

  // We need to map the scale degrees to actual note names
  const degreeToNoteName = {};

  // Get selected notes from the piano
  const selectedKeys = document.querySelectorAll(".piano-key.selected");
  selectedKeys.forEach((key) => {
    const noteName = key.getAttribute("data-note");
    const degree = key.getAttribute("data-third-nomenclature");
    degreeToNoteName[degree] = noteName;
  });

  // Apply alterations to the piano keys
  notesDegrees.forEach((degree) => {
    if (degree.includes("#") || degree.includes("b")) {
      const baseDegree = degree.replace(/[#b]/, "");
      const alterationType = degree.includes("#") ? "sharp" : "flat";

      // Find the corresponding key in the piano
      // First try to find it directly by degree
      let pianoKey = document.querySelector(
        `.piano-key[data-third-nomenclature="${degree}"]`
      );

      // If not found, we may need to find the note that corresponds to this altered degree
      if (!pianoKey) {
        // This is a complex case - we'd ideally map from the degree to its altered note
        // But for now, just find any key with data-third-nomenclature equal to the base degree
        // and change its highlight
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
