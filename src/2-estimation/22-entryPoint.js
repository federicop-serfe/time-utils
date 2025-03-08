const RISK = 2;
const ESTIMATION_SHEET_NAME = "Estimation";
const GUESSES_RANGE = "C4:H6";
const ESTIMATION_RANGE = "I4:L8";
const REPORT_CELL = "I11";

const guessesInput = new SpreadsheetIOHandler(
  ESTIMATION_SHEET_NAME,
  GUESSES_RANGE
);
const estimationsOutput = new SpreadsheetIOHandler(
  ESTIMATION_SHEET_NAME,
  ESTIMATION_RANGE
);
const reportOutput = new SpreadsheetIOHandler(
  ESTIMATION_SHEET_NAME,
  REPORT_CELL
);
const estimator = new PERTEstimator(
  RISK,
  guessesInput,
  estimationsOutput,
  reportOutput
);

function computeTimeEstimation() {
  estimator.estimate();
}

function resetTimeEstimation() {
  estimator.reset();
}
