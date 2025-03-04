// See: https://en.wikipedia.org/wiki/Three-point_estimation
class PERTEstimator {
  constructor(risk, sheetName, guessesRange, estimationsRange, reportCell) {
    this.REPORT = [
      "* Analysis / Design",
      "* Implementation",
      "* Testing",
      "> EE",
      "> E",
    ];

    this.ioHandler = new SimpleSpreadsheetIOHandler(sheetName);
    this.guessesRange = guessesRange;
    this.estimationsRange = estimationsRange;
    this.reportCell = reportCell;
    this.risk = risk;
    this.timeConverter = new TimeConverter();

    this.statistic = {
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

    this.toString = (estimationInHAndMin, percentualRisk) =>
      `TIME ESTIMATION\n> Subtask:\n${this.REPORT.map(
        (r, idx) =>
          `${r}: ${estimationInHAndMin[idx][0]}h${estimationInHAndMin[idx][1]}min`
      ).join("\n")}\n> Risk: ${percentualRisk}%`;
  }

  estimate() {
    const concatMatricesHorizontally = (A, B) =>
      A.map((row, idx) => row.concat(B[idx]));

    const guesses = this.timeConverter.matrixToMin(
      this.ioHandler.read(this.guessesRange)
    );

    const eeArr = guesses.map((subtask) => this.statistic.subtask.ee(subtask));
    const sdArr = guesses.map((subtask) => this.statistic.subtask.sd(subtask));
    const ee = this.statistic.task.ee(eeArr);
    const sd = this.statistic.task.sd(sdArr);
    const e = ee + this.risk * sd;
    const percentualRisk = ee > 0 ? Math.round(((e - ee) / ee) * 100) : 0;

    const estimations = this.timeConverter.matrixToHAndMin(
      concatMatricesHorizontally(
        [...eeArr.map((ee) => [ee]), [ee], [e]],
        [...sdArr.map((sd) => [sd]), [sd], [0]]
      )
    );

    this.ioHandler.write(estimations, this.estimationsRange);
    this.ioHandler.write(
      this.toString(estimations, percentualRisk),
      this.reportCell
    );
  }

  reset() {
    const zeros = this.ioHandler
      .read(this.guessesRange)
      .map((row) => row.map(() => 0));
    this.ioHandler.write(zeros, this.guessesRange);
    this.estimate();
  }
}
