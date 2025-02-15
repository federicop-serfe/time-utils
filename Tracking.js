
class TimeTracker {
  constructor(sheetName, ticketRange, estimatedTimeRange, dayRange, startTimeRange, endTimeRange, summaryOutputRange, distributedOutputRange) {
    this.PREVIOUS_TICKET_FLAG = "prev";
    this.sheetName = sheetName;
    this.ticketRange = ticketRange;
    this.estimatedTimeRange = estimatedTimeRange;
    this.dayRange = dayRange;
    this.startTimeRange = startTimeRange;
    this.endTimeRange = endTimeRange;
    this.summaryOutputRange = summaryOutputRange; 
    this.distributedOutputRange = distributedOutputRange;


    this.trackingSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(this.sheetName);
    this.timeConverter = new TimeConverter();
    this.dayWorkingMinutes = 60 * 8;
    this.timeBalancingAlgorithm = new BestEffortBalancer();
    //this.timeBalancingAlgorithm = new LPBalancer(0.75, 0.25, new BestEffortBalancer()); 
    this.timeDistributer = new TimeDistributer(this.dayWorkingMinutes);
  }

  track() {
    
    const cleanData = (data) => data.map(d => d[0]).filter(d => d.length > 0 || d > 0);
    
    const cleanDataSpecial = (tickets, estimatedTimes) => {
      return estimatedTimes.map(e => e[0]).filter((e, eIdx) => e > 0 || tickets[eIdx]?.length > 0);
    }

    const getWeekWorkingDays = (days) => {
      const weekWorkingDays = [];
      days.map((day) => day.toLowerCase()).forEach((day) => {
        if (!weekWorkingDays.find(d => d === day)) {
          weekWorkingDays.push(day[0].toUpperCase() + day.slice(1,));
        }
      });
      return weekWorkingDays;
    }

    const getTotalWeekTime = (weekWorkingDays) => weekWorkingDays.length * this.dayWorkingMinutes;

    const getTicketTimes = (tickets, estimatedTimes, startTimes, endTimes) => {
      let ticketTimes = {};
      let lastTicket, lastEstimate;
      
      tickets.map((ticket, ticketIdx) => {
        if (ticket.toLowerCase() !== this.PREVIOUS_TICKET_FLAG) {
          lastTicket = ticket;
          lastEstimate = estimatedTimes[ticketIdx];
        }
        if (!ticketTimes[lastTicket]) {
          ticketTimes[lastTicket] = {name: lastTicket, real: 0, estimated: lastEstimate};
        }
        ticketTimes[lastTicket].real += endTimes[ticketIdx] - startTimes[ticketIdx];
      });
      return Object.values(ticketTimes);
    }

    const concatMatricesHorizontally = (A, B) => A.map(
      (zerosRow, idx) => zerosRow.concat(B[idx]));

    const getSummaryOutput = (ticketTimes, fakeTimes) => {
  
      const sum = (arr) => arr.reduce((acc, curr) => acc + curr);
      const findFake = (ticket) => fakeTimes.find(t => t.name === ticket.name).fake;
      
      const namesMat = ticketTimes.map(ticket => [ticket.name]);
      const realTimesMat = ticketTimes.map(ticket =>[ticket.real]);
      const fakeTimesMat = ticketTimes.map(ticket => [findFake(ticket)]);
      const totalTimesMat = ticketTimes.map(ticket => [ticket.real + findFake(ticket)]);

      // Append total at the end
      namesMat.push(["TOTAL"]);
      realTimesMat.push([sum(ticketTimes.map((ticket) => ticket.real))]);
      fakeTimesMat.push([sum(fakeTimes.map((ticket) => ticket.fake))]);
      totalTimesMat.push([sum(ticketTimes.map((ticket) => ticket.real + findFake(ticket)))]);

      const sheetData = 
        concatMatricesHorizontally(
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
      for (let i = 0; i < this.trackingSheet.getRange(this.summaryOutputRange).getNumRows() - namesMat.length; i++) {
        sheetData.push(["", "", "", "", "", "", ""]);  
      }
      return sheetData;
    }
    
    const getDistributedOutput = (distributedTimes) => {

      const namesDaysMat = distributedTimes.map(ticket => [ticket.name, ticket.day]);
      const timesMat = distributedTimes.map(ticket => [ticket.total]);

      const sheetData = 
        concatMatricesHorizontally(
          namesDaysMat,
          this.timeConverter.matrixToHAndMin(timesMat),
        )

      // Append empty strings to fill the remaining space
      for (let i = 0; i < this.trackingSheet.getRange(this.distributedOutputRange).getNumRows() - namesDaysMat.length; i++) {
        sheetData.push(["", "", "", ""]);  
      }

      return sheetData;
    }

    // --------------------------------
    // Retrieve data
    const tickets = cleanData(this.trackingSheet.getRange(this.ticketRange).getValues());
    const estimatedTimes = cleanDataSpecial(
      tickets,
      this.timeConverter.matrixToMin(this.trackingSheet.getRange(this.estimatedTimeRange).getValues())
    );
    const days = cleanData(this.trackingSheet.getRange(this.dayRange).getValues());
    const startTimes = cleanData(this.timeConverter.matrixToMin(this.trackingSheet.getRange(this.startTimeRange).getValues()));
    const endTimes = cleanData(this.timeConverter.matrixToMin(this.trackingSheet.getRange(this.endTimeRange).getValues()));

    // Simplify
    const weekWorkingDays = getWeekWorkingDays(days);
    const ticketTimes = getTicketTimes(tickets, estimatedTimes, startTimes, endTimes);

    // Optimize
    const totalWeekTime = getTotalWeekTime(weekWorkingDays);
    const fakeTimes = this.timeBalancingAlgorithm.balance(ticketTimes, totalWeekTime);

    console.log("ticketTimes:", ticketTimes);
    console.log("fakeTimes:", fakeTimes);
    
    // Distribute
    const distributedTimes = this.timeDistributer.distribute(ticketTimes, fakeTimes, weekWorkingDays);

    // Summary output
    const summaryOutput = getSummaryOutput(ticketTimes, fakeTimes);
    this.trackingSheet.getRange(this.summaryOutputRange).setValues(summaryOutput);
    
    // Distributed across days output
    const distributedOutput = getDistributedOutput(distributedTimes);
    this.trackingSheet.getRange(this.distributedOutputRange).setValues(distributedOutput);
  }
}

// -------------------------------------------------------------------------------------------------
// BALANCERS
// Abstract class
class TimeBalancingAlgorithm {
  // Input: ticketTimes = [{name, real, estimated}], totalWeekTime
  // Output: fakeTimes = [{name, fake}]
  // Times in minutes
  balance(ticketTimes, totalWeekTime) {
    return null;
  }
}

class LPBalancer extends TimeBalancingAlgorithm {

  constructor(maxDiscount, maxSlack, fallback) {
    super();
    this.maxDiscount = maxDiscount;
    this.maxSlack = maxSlack;
    this.fallback = fallback;
    this.engine = LinearOptimizationService.createEngine();
  }

  /*
  If 1 <= i <= #tickets, let:
    fi: fake time added to ticket i
    Ei: estimated time for ticket i (constant)
    Ri: real time worked in ticket i (constant)
    Wo: working minutes of the week (constant)
  Using the notation sum(i = start, i <= end, expr),
  the optimization problem is as follows:
    max t = 1/#tasks * sum(1, #tasks, Ei/(Ri + fi))
    subject to:
      Ri + fi <= Ei
      sum(1, #tickets, Ri + fi) >= Wo
  Rewriting the restraints in the form required by the service,
  making the non-linear target function linear and adding mechanisms 
  to try to save non-feasible cases:
    min t = sum(1, #tickets, fi)
    subject to:
             0 <= fi <= (1 + s) * (Ei - Ri) , if Ei - Ri > 0
      - Ri * d <= fi <= 0                   , if Ei - Ri <= 0
      Wo - sum(1, #tickets, Ri) <= sum(1, #tickets, fi) <= Wt
    Where:
      d: max discount; proportion of the real time that can be substracted by the fake time; 0 <= maxDiscount <= infinity
      s: max slack; proportion of extra time that can be added to find a feasible solution;  0 <= maxSlack <= infinity
      Wt: week time; approximately infinity for this problem

  Documentation:
    https://developers.google.com/apps-script/reference/optimization/linear-optimization-service
    https://developers.google.com/apps-script/reference/optimization
   */
  balance(ticketTimes, totalWeekTime) {
    const weekMinutes = 7 * 24 * 60;
    const realTimesSum = ticketTimes.map(ticket => ticket.real).reduce((acc, curr) => acc + curr);
    const hoursContraint = this.engine.addConstraint(totalWeekTime - realTimesSum, weekMinutes);
    let fakeTime;
    ticketTimes.forEach(ticket => {
      fakeTime = `fake-${ticket.name}`;

      // Create variables
      if (ticket.estimated - ticket.real > 0) {
        this.engine.addVariable(fakeTime, 0, (1 + this.maxSlack) * (ticket.estimated - ticket.real));
      } else {
        this.engine.addVariable(fakeTime, - ticket.real * this.maxDiscount, 0);
      }
      
      // Create objetive function
      this.engine.setObjectiveCoefficient(fakeTime, 1);

      // Create constraint
      hoursContraint.setCoefficient(fakeTime, 1); 
    });

    // Solve
    this.engine.setMinimization();
    const solution = this.engine.solve();
    if (solution.isValid()) {
      return ticketTimes.map(ticket => ({name: ticket.name, fake: solution.getVariableValue(`fake-${ticket.name}`)}));
    } else {
      return this.fallback.balance(ticketTimes, totalWeekTime);
    }
  }
}

/*
  Performs a simple but suboptimal distribution of times.
  In the case where times must be completed, it computes fake times from 
  "bigger" tickets (i.e. with bigger estimates) to smaller tickets, up
  to their estimate. If this isn't enough, after looping through all the tickets,
  it distributes the remainding time weighted by the estimate of the ticket (rationale:
  it isn't the same to add 1h to a ticket of 2hs than to a ticket of 4hs).
  In the cases where I've worked more than expected, time substraction takes place 
  to look good on paper.
*/
class BestEffortBalancer extends TimeBalancingAlgorithm {

  balance(ticketTimes, totalWeekTime) {

    const sum = (arr, atr) => arr.map(ai => ai[atr]).reduce((acc, curr) => acc + curr); 

    const fakeTimes = [];
    const realSum = sum(ticketTimes, "real");
    const estimatedSum = sum(ticketTimes, "estimated");
    const sortedTicketTimes = [...ticketTimes].sort((a, b) => b.estimated - a.estimated);
    const timeTofill = totalWeekTime - realSum;
    let remaindingToFill;

    // i.e. times need to be filled
    if (timeTofill > 0) {
      remaindingToFill = timeTofill;
      sortedTicketTimes.forEach(ticket => {
        remaindingToFill -= ticket.estimated - ticket.real;
        fakeTimes.push({
          name: ticket.name,
          fake: ticket.estimated - ticket.real,
        });
      });

      if (remaindingToFill > 0) {
        sortedTicketTimes.forEach(ticket => {
          fakeTimes.find(t => t.name === ticket.name).fake += Math.ceil(remaindingToFill * ticket.estimated / estimatedSum);
        });
      }
    } else {
      sortedTicketTimes.forEach(ticket => {
        fakeTimes.push({
          name: ticket.name,
          fake: Math.ceil(timeTofill * ticket.estimated / estimatedSum),
        });
      });
    }

    return fakeTimes;
  }
}


// -------------------------------------------------------------------------------------------------
// DISTRIBUTER ACROSS DAYS
class TimeDistributer {
  constructor(dayWorkingMinutes) {
    this.dayWorkingMinutes = dayWorkingMinutes;
  }

  // Input: ticketTimes = [{name, real, estimated}], fakeTimes = [{name, fake}]
  // Output: [{ticket, day, total}]
  // Times in minutes
  distribute(ticketTimes, fakeTimes, weekWorkingDays) {
    const remaining = ticketTimes.map(
      (ticket) => ({
        name: ticket.name, 
        total: ticket.real + fakeTimes.find(t => t.name === ticket.name).fake
      })
    );
    const distributed = [];
    let ticketIdx = 0, dayIdx = 0;
    let accumulatedTime = 0;
    let aux;

    while (ticketIdx < remaining.length && dayIdx < weekWorkingDays.length) {
      aux = accumulatedTime + remaining[ticketIdx].total;
      if (aux < this.dayWorkingMinutes) {
        distributed.push({
          name: remaining[ticketIdx].name, 
          total: remaining[ticketIdx].total,
          day: weekWorkingDays[dayIdx],
        });  
        accumulatedTime = aux;
        remaining[ticketIdx].total = 0;
        ticketIdx++;
      } else {
        distributed.push({
          name: remaining[ticketIdx].name,
          total: this.dayWorkingMinutes - accumulatedTime,
          day: weekWorkingDays[dayIdx],
        });
        remaining[ticketIdx].total = aux - this.dayWorkingMinutes;
        dayIdx++;
        accumulatedTime = 0;
      }
    }

    return distributed;
  }
}

// -------------------------------------------------------------------------------------------------

const TRACKING_SHEET_NAME = "Tracking";
const trackingSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TRACKING_SHEET_NAME);

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
  timeTracker = new TimeTracker(
    TRACKING_SHEET_NAME,
    ...trackingRanges,
  );
  timeTracker.track();
}

function resetTimeTracking() {
  let zeros, zerosRow, cols, rows;  
  trackingRanges.forEach(r => {
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

