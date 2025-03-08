window.onload = function () {
  const items = document.getElementsByClassName("item");

  if (items) {
    for (const element of items) {
      element.onclick = function (e) {
        const checkbox = element.getElementsByClassName("number-item")[0];
        if (e.target !== checkbox) {
          checkbox.checked = !checkbox.checked;
        }
        element.classList.toggle("active");
      };
    }
  }
};
//Definitions ["Ionian",A, "Dorian",B, "Phrygian",C, "Lydian",D, "Mixolydian",E, "Aeolian",F, "Locrian",G, "Mixolydian Altered",H, "Altered Dominant",I, "Major Altered",J, "Minor Altered",K, "No third"],L // 0///

// Expose typesMatrix to window object
window.typesMatrix = [
  [
    "Ionian",
    "Dorian",
    "Phrygian",
    "Lydian",
    "Mixolydian",
    "Aeolian",
    "Locrian",
    "Mixolydian Altered",
    "Altered Dominant",
    "Major Altered",
    "Minor Altered",
    "No third",
  ], // 0
  [
    "",
    "",
    "",
    "",
    "",
    "",
    "Locrian",
    "Mixolydian Altered",
    "Altered Dominant",
    "",
    "",
    "No third",
  ], // 1
  [
    "Ionian",
    "Dorian",
    "",
    "Lydian",
    "Mixolydian",
    "Aeolian",
    "",
    "Mixolydian Altered",
    "",
    "Major Altered",
    "Minor Altered",
    "No third",
  ], // 2
  [
    "",
    "Dorian",
    "Phrygian",
    "",
    "",
    "Aeolian",
    "Locrian",
    "Mixolydian Altered",
    "Altered Dominant",
    "Major Altered",
    "Minor Altered",
    "",
  ], // 3
  [
    "Ionian",
    "",
    "",
    "Lydian",
    "Mixolydian",
    "",
    "",
    "Mixolydian Altered",
    "Altered Dominant",
    "Major Altered",
    "",
    "",
  ], // 4
  [
    "Ionian",
    "Dorian",
    "Phrygian",
    "",
    "Mixolydian",
    "Aeolian",
    "Locrian",
    "Mixolydian Altered",
    "",
    "Major Altered",
    "Minor Altered",
    "No third",
  ], // 5
  [
    "",
    "",
    "",
    "Lydian",
    "",
    "",
    "Locrian",
    "Mixolydian Altered",
    "",
    "Major Altered",
    "Minor Altered",
    "No third",
  ], // 6
  [
    "Ionian",
    "Dorian",
    "Phrygian",
    "Lydian",
    "Mixolydian",
    "Aeolian",
    "",
    "Mixolydian Altered",
    "",
    "Major Altered",
    "Minor Altered",
    "No third",
  ], // 7
  [
    "",
    "",
    "Phrygian",
    "",
    "",
    "Aeolian",
    "Locrian",
    "Mixolydian Altered",
    "Altered Dominant",
    "Major Altered",
    "Minor Altered",
    "No third",
  ], // 8
  [
    "Ionian",
    "Dorian",
    "",
    "Lydian",
    "Mixolydian",
    "",
    "",
    "Mixolydian Altered",
    "",
    "Major Altered",
    "Minor Altered",
    "No third",
  ], // 9
  [
    "",
    "Dorian",
    "Phrygian",
    "",
    "Mixolydian",
    "Aeolian",
    "Locrian",
    "Mixolydian Altered",
    "Altered Dominant",
    "",
    "Minor Altered",
    "No third",
  ], // 10
  [
    "Ionian",
    "",
    "",
    "Lydian",
    "",
    "",
    "",
    "",
    "",
    "Major Altered",
    "Minor Altered",
    "No third",
  ], // 11
];

// Listen for matrix updates
document.addEventListener("matrix-updated", (e) => {
  window.typesMatrix = e.detail.matrix;
});

async function readJSON(jsonPath) {
  fetch(jsonPath)
    .then((response) => response.json())
    .then((data) => {
      return data;
    })
    .catch((error) => console.log(error));
}

function onGo() {
  const numberItems = document.getElementsByClassName("number-item");
  let selectList = [];
  let selectedList = [];

  // Collect selected indices
  for (let i = 0; i < numberItems.length; i++) {
    if (numberItems[i].checked) selectList.push(i);
  }

  // Collect corresponding rows from typesMatrix
  for (const index of selectList) {
    if (window.typesMatrix[index]) {
      selectedList.push(window.typesMatrix[index]);
    }
  }

  let resultList = [];

  for (let i = 0; i < 12; i++) {
    let flag = true;

    for (let j = 0; j < selectedList.length - 1; j++) {
      if (
        selectedList[j][i] !== selectedList[j + 1][i] ||
        selectedList[j][i] === ""
      ) {
        flag = false;
        break;
      }
    }

    if (flag && selectedList.length > 0) {
      resultList.push(window.typesMatrix[0][i]);
    }
  }

  const selectResult = document.getElementsByClassName("select-result")[0];
  selectResult.innerHTML = resultList.length
    ? resultList.join(", ")
    : "No common items found.";
}
