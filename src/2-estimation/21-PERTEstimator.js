if (typeof TimeConverter === "undefined") {
  TimeConverter = require("../1-utils/11-TimeConverter");
}
if (typeof GeneralUtils === "undefined") {
  GeneralUtils = require("../1-utils/13-GeneralUtils");
}

const ESTIMATION_REPORT_PARTS = [
  "* Analysis",
  "* Design / Implementation",
  "* Testing",
  "> EE",
  "> E",
];

// See: https://en.wikipedia.org/wiki/Three-point_estimation
class PERTEstimator {
  constructor(risk, guessesInput, estimationsOuput, reportOutput) {
    this.risk = risk;
    this.guessesInput = guessesInput;
    this.estimationsOutput = estimationsOuput;
    this.reportOutput = reportOutput;
    this.timeConverter = new TimeConverter();
  }

  estimate() {
    const guesses = this.timeConverter.matrixToMin(this.guessesInput.read());

    guesses.forEach((guess) =>
      guess.forEach((row) => {
        if (row < 0) {
          throw new Error("Negative guesses are not allowed");
        }
      })
    );

    // timeArr: [bestCase, mostLikely, worstCase]
    const subtasksEE = guesses.map(
      (timeArr) => (timeArr[0] + 4 * timeArr[1] + timeArr[2]) / 6
    );
    const subtasksSD = guesses.map((timeArr) => (timeArr[2] - timeArr[0]) / 6);

    const EE = subtasksEE.reduce((acc, curr) => acc + curr);
    const SD = Math.sqrt(
      subtasksSD.map((sd) => sd * sd).reduce((acc, curr) => acc + curr)
    );
    const finalEstimation = EE + this.risk * SD;
    const percentualRisk =
      EE > 0 ? Math.round(((finalEstimation - EE) / EE) * 100) : 0;

    const estimations = this.timeConverter.matrixToHAndMin(
      GeneralUtils.concatMatricesHorizontally(
        [...subtasksEE.map((ee) => [ee]), [EE], [finalEstimation]],
        [...subtasksSD.map((sd) => [sd]), [SD], [0]]
      )
    );

    const toString = (estimationInHAndMin, percentualRisk) =>
      `TIME ESTIMATION\n> Subtask:\n${ESTIMATION_REPORT_PARTS.map(
        (r, idx) =>
          `${r}: ${estimationInHAndMin[idx][0]}h${estimationInHAndMin[idx][1]}min`
      ).join("\n")}\n> Risk: ${percentualRisk}%`;

    this.estimationsOutput.write(estimations);
    this.reportOutput.write(toString(estimations, percentualRisk));
  }

  reset() {
    this.guessesInput.write(0);
    this.estimationsOutput.write(0);
    this.reportOutput.write("");
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = PERTEstimator;
}
