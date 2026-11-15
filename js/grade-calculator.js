/*
  grade-calculator.js — the small demo on projects.html.

  The grading scale is stored as an array of objects, ordered from the
  highest grade to the lowest. To find a grade we walk down the array and
  stop at the first band whose minimum score the student has reached.
*/

const gradeScale = [
  { letter: "A", min: 70, points: 5, remark: "Excellent" },
  { letter: "B", min: 60, points: 4, remark: "Very good" },
  { letter: "C", min: 50, points: 3, remark: "Good" },
  { letter: "D", min: 45, points: 2, remark: "Fair" },
  { letter: "E", min: 40, points: 1, remark: "Pass" },
  { letter: "F", min: 0, points: 0, remark: "Fail" }
];

/* Returns the matching band from gradeScale for a score between 0 and 100. */
function getGrade(score) {
  return gradeScale.find(function (band) {
    return score >= band.min;
  });
}

const gradeForm = document.getElementById("grade-form");
const scoreInput = document.getElementById("score");
const scoreError = document.getElementById("score-error");
const gradeResult = document.getElementById("grade-result");

gradeForm.addEventListener("submit", function (event) {
  event.preventDefault();   // stay on the page; there is no server

  const rawValue = scoreInput.value.trim();
  const score = Number(rawValue);

  // Reject empty input, non-numbers and anything outside 0–100.
  if (rawValue === "" || Number.isNaN(score) || score < 0 || score > 100) {
    scoreError.textContent = "Enter a score between 0 and 100.";
    scoreInput.setAttribute("aria-invalid", "true");
    gradeResult.textContent = "";
    scoreInput.focus();
    return;
  }

  scoreError.textContent = "";
  scoreInput.removeAttribute("aria-invalid");

  const grade = getGrade(score);

  // Build the result with textContent (never innerHTML) so input is shown safely.
  gradeResult.textContent = "";
  const letter = document.createElement("span");
  letter.className = "grade-letter";
  letter.textContent = "Grade " + grade.letter;
  const details = document.createElement("span");
  details.textContent = "Score " + score + " · " + grade.points + " grade point" +
    (grade.points === 1 ? "" : "s") + " · " + grade.remark;
  gradeResult.append(letter, details);
});
