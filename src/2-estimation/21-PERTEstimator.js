if (typeof TimeConverter === "undefined") {
  TimeConverter = require("../1-utils/11-TimeConverter");
}
if (typeof MatrixUtils === "undefined") {
  MatrixUtils = require("../1-utils/13-MatrixUtils");
}

// See: https://en.wikipedia.org/wiki/Three-point_estimation
class PERTEstimator {
  constructor(risk, guessesInput, estimationsOuput, reportOutput) {
    this.REPORT = [
      "* Analysis / Design",
      "* Implementation",
      "* Testing",
      "> EE",
      "> E",
    ];

    this.risk = risk;
    this.guessesInput = guessesInput;
    this.estimationsOutput = estimationsOuput;
    this.reportOutput = reportOutput;
    this.timeConverter = new TimeConverter();
  }

  estimate() {
    const statistic = {
      subtask: {
        // timeArr: [bestCase, mostLikely, worstCase]
        ee: (timeArr) => (timeArr[0] + 4 * timeArr[1] + timeArr[2]) / 6,
        sd: (timeArr) => (timeArr[2] - timeArr[0]) / 6,
      },
      task: {
        ee: (eeArr) => eeArr.reduce((acc, curr) => acc + curr),
        sd: (sdArr) =>
          Math.sqrt(
            sdArr.map((sd) => sd * sd).reduce((acc, curr) => acc + curr)
          ),
      },
    };

    const toString = (estimationInHAndMin, percentualRisk) =>
      `TIME ESTIMATION\n> Subtask:\n${this.REPORT.map(
        (r, idx) =>
          `${r}: ${estimationInHAndMin[idx][0]}h${estimationInHAndMin[idx][1]}min`
      ).join("\n")}\n> Risk: ${percentualRisk}%`;

    // --------------
    const guesses = this.timeConverter.matrixToMin(this.guessesInput.read());

    const eeArr = guesses.map((subtask) => statistic.subtask.ee(subtask));
    const sdArr = guesses.map((subtask) => statistic.subtask.sd(subtask));
    const ee = statistic.task.ee(eeArr);
    const sd = statistic.task.sd(sdArr);
    const e = ee + this.risk * sd;
    const percentualRisk = ee > 0 ? Math.round(((e - ee) / ee) * 100) : 0;

    const estimations = this.timeConverter.matrixToHAndMin(
      MatrixUtils.concatHorizontally(
        [...eeArr.map((ee) => [ee]), [ee], [e]],
        [...sdArr.map((sd) => [sd]), [sd], [0]]
      )
    );

    this.estimationsOutput.write(estimations);
    this.reportOutput.write(toString(estimations, percentualRisk));
  }

  reset() {
    const zeros = this.guessesInput.read().map((row) => row.map(() => 0));
    this.guessesInput.write(zeros);
    this.estimate();
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = PERTEstimator;
}
