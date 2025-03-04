class TimeTracker {
  constructor(
    sheetName,
    ticketRange,
    estimatedTimeRange,
    dayRange,
    startTimeRange,
    endTimeRange,
    summaryOutputRange,
    distributedOutputRange
  ) {
    this.PREVIOUS_TICKET_FLAG = "prev";
    this.sheetName = sheetName;
    this.ticketRange = ticketRange;
    this.estimatedTimeRange = estimatedTimeRange;
    this.dayRange = dayRange;
    this.startTimeRange = startTimeRange;
    this.endTimeRange = endTimeRange;
    this.summaryOutputRange = summaryOutputRange;
    this.distributedOutputRange = distributedOutputRange;

    this.trackingSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
      this.sheetName
    );
    this.timeConverter = new TimeConverter();
    this.dayWorkingMinutes = 60 * 8;
    this.timeBalancer = new BestEffortBalancer();
    //this.timeBalancer = new LPBalancer(0.75, 0.25, new BestEffortBalancer());
    this.timeDistributer = new TimeDistributer(this.dayWorkingMinutes);
  }

  track() {
    const cleanData = (data) =>
      data.map((d) => d[0]).filter((d) => d.length > 0 || d > 0);

    const cleanDataSpecial = (tickets, estimatedTimes) => {
      return estimatedTimes
        .map((e) => e[0])
        .filter((e, eIdx) => e > 0 || tickets[eIdx]?.length > 0);
    };

    const getWeekWorkingDays = (days) => {
      const weekWorkingDays = [];
      days
        .map((day) => day.toLowerCase())
        .forEach((day) => {
          if (!weekWorkingDays.find((d) => d === day)) {
            weekWorkingDays.push(day[0].toUpperCase() + day.slice(1));
          }
        });
      return weekWorkingDays;
    };

    const getTotalWeekTime = (weekWorkingDays) =>
      weekWorkingDays.length * this.dayWorkingMinutes;

    const getTicketTimes = (tickets, estimatedTimes, startTimes, endTimes) => {
      let ticketTimes = {};
      let lastTicket, lastEstimate;

      tickets.map((ticket, ticketIdx) => {
        if (ticket.toLowerCase() !== this.PREVIOUS_TICKET_FLAG) {
          lastTicket = ticket;
          lastEstimate = estimatedTimes[ticketIdx];
        }
        if (!ticketTimes[lastTicket]) {
          ticketTimes[lastTicket] = {
            name: lastTicket,
            real: 0,
            estimated: lastEstimate,
          };
        }
        ticketTimes[lastTicket].real +=
          endTimes[ticketIdx] - startTimes[ticketIdx];
      });
      return Object.values(ticketTimes);
    };

    const concatMatricesHorizontally = (A, B) =>
      A.map((zerosRow, idx) => zerosRow.concat(B[idx]));

    const getSummaryOutput = (ticketTimes, fakeTimes) => {
      const sum = (arr) => arr.reduce((acc, curr) => acc + curr);
      const findFake = (ticket) =>
        fakeTimes.find((t) => t.name === ticket.name).fake;

      const namesMat = ticketTimes.map((ticket) => [ticket.name]);
      const realTimesMat = ticketTimes.map((ticket) => [ticket.real]);
      const fakeTimesMat = ticketTimes.map((ticket) => [findFake(ticket)]);
      const totalTimesMat = ticketTimes.map((ticket) => [
        ticket.real + findFake(ticket),
      ]);

      // Append total at the end
      namesMat.push(["TOTAL"]);
      realTimesMat.push([sum(ticketTimes.map((ticket) => ticket.real))]);
      fakeTimesMat.push([sum(fakeTimes.map((ticket) => ticket.fake))]);
      totalTimesMat.push([
        sum(ticketTimes.map((ticket) => ticket.real + findFake(ticket))),
      ]);

      const sheetData = concatMatricesHorizontally(
        concatMatricesHorizontally(
          concatMatricesHorizontally(
            namesMat,
            this.timeConverter.matrixToHAndMin(realTimesMat)
          ),
          this.timeConverter.matrixToHAndMin(fakeTimesMat)
        ),
        this.timeConverter.matrixToHAndMin(totalTimesMat)
      );

      // Append empty strings to fill the remaining space
      for (
        let i = 0;
        i <
        this.trackingSheet.getRange(this.summaryOutputRange).getNumRows() -
          namesMat.length;
        i++
      ) {
        sheetData.push(["", "", "", "", "", "", ""]);
      }
      return sheetData;
    };

    const getDistributedOutput = (distributedTimes) => {
      const namesDaysMat = distributedTimes.map((ticket) => [
        ticket.name,
        ticket.day,
      ]);
      const timesMat = distributedTimes.map((ticket) => [ticket.total]);

      const sheetData = concatMatricesHorizontally(
        namesDaysMat,
        this.timeConverter.matrixToHAndMin(timesMat)
      );

      // Append empty strings to fill the remaining space
      for (
        let i = 0;
        i <
        this.trackingSheet.getRange(this.distributedOutputRange).getNumRows() -
          namesDaysMat.length;
        i++
      ) {
        sheetData.push(["", "", "", ""]);
      }

      return sheetData;
    };

    // --------------------------------
    // Retrieve data
    const tickets = cleanData(
      this.trackingSheet.getRange(this.ticketRange).getValues()
    );
    const estimatedTimes = cleanDataSpecial(
      tickets,
      this.timeConverter.matrixToMin(
        this.trackingSheet.getRange(this.estimatedTimeRange).getValues()
      )
    );
    const days = cleanData(
      this.trackingSheet.getRange(this.dayRange).getValues()
    );
    const startTimes = cleanData(
      this.timeConverter.matrixToMin(
        this.trackingSheet.getRange(this.startTimeRange).getValues()
      )
    );
    const endTimes = cleanData(
      this.timeConverter.matrixToMin(
        this.trackingSheet.getRange(this.endTimeRange).getValues()
      )
    );

    // Simplify
    const weekWorkingDays = getWeekWorkingDays(days);
    const ticketTimes = getTicketTimes(
      tickets,
      estimatedTimes,
      startTimes,
      endTimes
    );

    // Optimize
    const totalWeekTime = getTotalWeekTime(weekWorkingDays);
    const fakeTimes = this.timeBalancer.balance(ticketTimes, totalWeekTime);

    console.log("ticketTimes:", ticketTimes);
    console.log("fakeTimes:", fakeTimes);

    // Distribute
    const distributedTimes = this.timeDistributer.distribute(
      ticketTimes,
      fakeTimes,
      weekWorkingDays
    );

    // Summary output
    const summaryOutput = getSummaryOutput(ticketTimes, fakeTimes);
    this.trackingSheet
      .getRange(this.summaryOutputRange)
      .setValues(summaryOutput);

    // Distributed across days output
    const distributedOutput = getDistributedOutput(distributedTimes);
    this.trackingSheet
      .getRange(this.distributedOutputRange)
      .setValues(distributedOutput);
  }
}

// -------------------------------------------------------------------------------------------------

const TRACKING_SHEET_NAME = "Tracking";
const trackingSheet =
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TRACKING_SHEET_NAME);

const TRACKING_TICKET_RANGE = "B7:B57";
const TRACKING_ESTIMATED_TIME_RANGE = "C7:D57";
const TRACKING_DAY_RANGE = "E7:E57";
const TRACKING_START_TIME_RANGE = "F7:G57";
const TRACKING_END_TIME_RANGE = "H7:I57";
const TRACKING_SUMMARY_OUTPUT_RANGE = "K7:Q57";
const TRACKING_DISTRIBUTED_OUTPUT_RANGE = "S7:V57";
const trackingRanges = [
  TRACKING_TICKET_RANGE,
  TRACKING_ESTIMATED_TIME_RANGE,
  TRACKING_DAY_RANGE,
  TRACKING_START_TIME_RANGE,
  TRACKING_END_TIME_RANGE,
  TRACKING_SUMMARY_OUTPUT_RANGE,
  TRACKING_DISTRIBUTED_OUTPUT_RANGE,
];

function computeTimeTracking() {
  timeTracker = new TimeTracker(TRACKING_SHEET_NAME, ...trackingRanges);
  timeTracker.track();
}

function resetTimeTracking() {
  let zeros, zerosRow, cols, rows;
  trackingRanges.forEach((r) => {
    zeros = [];
    rows = trackingSheet.getRange(r).getNumRows();
    cols = trackingSheet.getRange(r).getNumColumns();
    for (let i = 0; i < rows; i++) {
      zerosRow = [];
      for (let j = 0; j < cols; j++) {
        zerosRow.push("");
      }
      zeros.push(zerosRow);
    }
    trackingSheet.getRange(r).setValues(zeros);
  });
}
