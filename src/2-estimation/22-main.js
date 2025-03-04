const RISK = 2;
const ESTIMATION_SHEET_NAME = "Estimation";
const GUESSES_RANGE = "C4:H6";
const ESTIMATION_RANGE = "I4:L8";
const REPORT_CELL = "I11";
const estimator = new PERTEstimator(
  RISK,
  ESTIMATION_SHEET_NAME,
  GUESSES_RANGE,
  ESTIMATION_RANGE,
  REPORT_CELL
);

function computeTimeEstimation() {
  estimator.estimate();
}

function resetTimeEstimation() {
  estimator.reset();
}
