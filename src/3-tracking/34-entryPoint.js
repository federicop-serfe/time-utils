const TRACKING_SHEET_NAME = "Tracking";
const TRACKING_TICKET_RANGE = "B7:B57";
const TRACKING_ESTIMATED_TIME_RANGE = "C7:D57";
const TRACKING_DAY_RANGE = "E7:E57";
const TRACKING_START_TIME_RANGE = "F7:G57";
const TRACKING_END_TIME_RANGE = "H7:I57";
const TRACKING_SUMMARY_OUTPUT_RANGE = "K7:Q57";
const TRACKING_DISTRIBUTED_OUTPUT_RANGE = "S7:V57";

const ticketsInput = new SpreadsheetIOHandler(
  TRACKING_SHEET_NAME,
  TRACKING_TICKET_RANGE
);
const estimatedTimesInput = new SpreadsheetIOHandler(
  TRACKING_SHEET_NAME,
  TRACKING_ESTIMATED_TIME_RANGE
);
const daysInput = new SpreadsheetIOHandler(
  TRACKING_SHEET_NAME,
  TRACKING_DAY_RANGE
);
const startTimesInput = new SpreadsheetIOHandler(
  TRACKING_SHEET_NAME,
  TRACKING_START_TIME_RANGE
);
const endTimesInput = new SpreadsheetIOHandler(
  TRACKING_SHEET_NAME,
  TRACKING_END_TIME_RANGE
);
const summaryOutput = new SpreadsheetIOHandler(
  TRACKING_SHEET_NAME,
  TRACKING_SUMMARY_OUTPUT_RANGE
);
const distributedOutput = new SpreadsheetIOHandler(
  TRACKING_SHEET_NAME,
  TRACKING_DISTRIBUTED_OUTPUT_RANGE
);

const timeTracker = new TimeTracker(
  ticketsInput,
  estimatedTimesInput,
  daysInput,
  startTimesInput,
  endTimesInput,
  summaryOutput,
  distributedOutput
);

function computeTimeTracking() {
  timeTracker.track();
}

function resetTimeTracking() {
  timeTracker.reset();
}
