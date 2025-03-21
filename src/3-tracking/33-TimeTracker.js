if (typeof GeneralUtils === "undefined") {
  GeneralUtils = require("../1-utils/13-GeneralUtils");
}
if (typeof BestEffortBalancer === "undefined") {
  BestEffortBalancer = require("./31-TimeBalancer").BestEffortBalancer;
}
if (typeof BestEffortBalancer === "undefined") {
  LPBalancer = require("./31-TimeBalancer").LPBalancer;
}
if (typeof TimeDistributer === "undefined") {
  TimeDistributer = require("./32-TimeDistributer");
}

class TimeTracker {
  constructor(
    ticketsInput,
    estimatedTimesInput,
    daysInput,
    startTimesInput,
    endTimesInput,
    summaryOutput,
    distributedOutput
  ) {
    this.PREVIOUS_TICKET_FLAG = "prev";

    this.ticketsInput = ticketsInput;
    this.estimatedTimesInput = estimatedTimesInput;
    this.daysInput = daysInput;
    this.startTimesInput = startTimesInput;
    this.endTimesInput = endTimesInput;
    this.summaryOutput = summaryOutput;
    this.distributedOutput = distributedOutput;

    this.timeConverter = new TimeConverter();
    this.dayWorkingMinutes = 60 * 8;
    this.timeBalancer = new BestEffortBalancer(0.8);
    //this.timeBalancer = new LPBalancer(0.75, 0.25, new BestEffortBalancer(0.8));
    this.timeDistributer = new TimeDistributer(this.dayWorkingMinutes);
  }

  track() {
    const { tickets, estimatedTimes, days, startTimes, endTimes } =
      this.getTrackingData();

    const weekWorkingDays = this.getWeekWorkingDays(days);
    const ticketTimes = this.getTicketTimes(
      tickets,
      estimatedTimes,
      startTimes,
      endTimes
    );

    const totalWeekTime = weekWorkingDays.length * this.dayWorkingMinutes;
    const fakeTimes = this.timeBalancer.balance(ticketTimes, totalWeekTime);

    console.log("ticketTimes:", ticketTimes);
    console.log("fakeTimes:", fakeTimes);

    const distributedTimes = this.timeDistributer.distribute(
      ticketTimes,
      fakeTimes,
      weekWorkingDays
    );

    this.summaryOutput.write(this.getSummaryOutput(ticketTimes, fakeTimes));

    this.distributedOutput.write(this.getDistributedOutput(distributedTimes));
  }

  getTrackingData() {
    const cleanData = (data) =>
      data.map((d) => d[0]).filter((d) => d.length > 0 || d > 0);

    const cleanDataSpecial = (tickets, estimatedTimes) => {
      return estimatedTimes
        .map((e) => e[0])
        .filter((e, eIdx) => e > 0 || tickets[eIdx]?.length > 0);
    };

    const tickets = cleanData(this.ticketsInput.read());
    const estimatedTimes = cleanDataSpecial(
      tickets,
      this.timeConverter.matrixToMin(this.estimatedTimesInput.read())
    );
    const days = cleanData(this.daysInput.read());
    const startTimes = cleanData(
      this.timeConverter.matrixToMin(this.startTimesInput.read())
    );
    const endTimes = cleanData(
      this.timeConverter.matrixToMin(this.endTimesInput.read())
    );

    return {
      tickets,
      estimatedTimes,
      days,
      startTimes,
      endTimes,
    };
  }

  getWeekWorkingDays(days) {
    const weekWorkingDays = [];
    days
      .map((day) => day.toLowerCase())
      .forEach((day) => {
        if (!weekWorkingDays.find((d) => d === day)) {
          weekWorkingDays.push(day[0].toUpperCase() + day.slice(1));
        }
      });
    return weekWorkingDays;
  }

  getTicketTimes(tickets, estimatedTimes, startTimes, endTimes) {
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
  }

  getSummaryOutput(ticketTimes, fakeTimes) {
    const sum = (arr) => arr.reduce((acc, curr) => acc + curr);
    const findFake = (ticket) =>
      fakeTimes.find((t) => t.name === ticket.name).fake;

    const namesMat = ticketTimes.map((ticket) => [ticket.name]);
    const realTimesMat = ticketTimes.map((ticket) => [
      GeneralUtils.round(ticket.real),
    ]);
    const fakeTimesMat = ticketTimes.map((ticket) => [
      GeneralUtils.round(findFake(ticket)),
    ]);
    const totalTimesMat = realTimesMat.map((realRow, idx) => [
      realRow[0] + fakeTimesMat[idx][0],
    ]);

    // Append total at the end
    namesMat.push(["TOTAL"]);
    realTimesMat.push([sum(realTimesMat.map((realRow) => realRow[0]))]);
    fakeTimesMat.push([sum(fakeTimesMat.map((fakeRow) => fakeRow[0]))]);
    totalTimesMat.push([
      realTimesMat[realTimesMat.length - 1][0] +
        fakeTimesMat[fakeTimesMat.length - 1][0],
    ]);

    return GeneralUtils.concatMatricesHorizontally(
      GeneralUtils.concatMatricesHorizontally(
        GeneralUtils.concatMatricesHorizontally(
          namesMat,
          this.timeConverter.matrixToHAndMin(realTimesMat)
        ),
        this.timeConverter.matrixToHAndMin(fakeTimesMat)
      ),
      this.timeConverter.matrixToHAndMin(totalTimesMat)
    );
  }

  getDistributedOutput(distributedTimes) {
    const namesDaysMat = distributedTimes.map((ticket) => [
      ticket.name,
      ticket.day,
    ]);
    const timesMat = distributedTimes.map((ticket) => [
      GeneralUtils.round(ticket.total),
    ]);

    return GeneralUtils.concatMatricesHorizontally(
      namesDaysMat,
      this.timeConverter.matrixToHAndMin(timesMat)
    );
  }

  reset() {
    this.ticketsInput.fillWith("");
    this.estimatedTimesInput.fillWith("");
    this.daysInput.fillWith("");
    this.startTimesInput.fillWith("");
    this.endTimesInput.fillWith("");
    this.summaryOutput.fillWith("");
    this.distributedOutput.fillWith("");
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = TimeTracker;
}
