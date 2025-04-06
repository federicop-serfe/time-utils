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
    const tickets = this.ticketsInput.read().flat();
    const estimatedTimes = this.timeConverter
      .matrixToMin(this.estimatedTimesInput.read(undefined, tickets.length, 2))
      .flat();
    const days = this.daysInput.read(undefined, tickets.length).flat();
    const startTimes = this.timeConverter
      .matrixToMin(this.startTimesInput.read(undefined, tickets.length, 2))
      .flat();
    const endTimes = this.timeConverter
      .matrixToMin(this.endTimesInput.read(undefined, tickets.length, 2))
      .flat();

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

  getWeekWorkingDays(days) {
    const weekWorkingDays = [];
    days
      .filter((day) => !!day)
      .map((day) => day.toLowerCase())
      .forEach((day) => {
        if (!weekWorkingDays.find((d) => d.toLowerCase() === day)) {
          weekWorkingDays.push(day[0].toUpperCase() + day.slice(1));
        }
      });
    return weekWorkingDays;
  }

  getTicketTimes(tickets, estimatedTimes, startTimes, endTimes) {
    let ticketTimes = {};
    let lastTicket, startTime, endTime;

    tickets.map((ticket, ticketIdx) => {
      if (
        ticket.length > 0 &&
        ticket.toLowerCase() !== this.PREVIOUS_TICKET_FLAG
      )
        lastTicket = ticket.toLowerCase();

      if (!lastTicket) throw new Error("No last ticket available");

      if (!ticketTimes[lastTicket]) {
        ticketTimes[lastTicket] = {
          name: lastTicket,
          real: 0,
          estimated: 0,
        };
      }

      if (estimatedTimes[ticketIdx] > 0)
        ticketTimes[lastTicket].estimated = estimatedTimes[ticketIdx];

      startTime = startTimes[ticketIdx];
      // If there isn't an end time for the ticket, set it to start time of
      // the next ticket, unless there's no data available
      if (endTimes[ticketIdx] > 0) {
        endTime = endTimes[ticketIdx];
      } else if (startTimes[ticketIdx + 1] > 0) {
        endTime = startTimes[ticketIdx + 1];
      } else throw new Error(`No end time available for ticket: ${lastTicket}`);
      if (startTime <= endTime)
        ticketTimes[lastTicket].real += endTime - startTime;
      else
        throw new Error(
          `Start time is greater than end time for ticket: ${ticket}`
        );
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

    namesDaysMat.push(["TOTAL", "Mon-Fri"]);
    const sum = (arr) => arr.reduce((acc, curr) => acc + curr);
    timesMat.push([sum(distributedTimes.map((ticket) => ticket.total))]);

    return GeneralUtils.concatMatricesHorizontally(
      namesDaysMat,
      this.timeConverter.matrixToHAndMin(timesMat)
    );
  }

  reset() {
    this.ticketsInput.write("");
    this.estimatedTimesInput.write("");
    this.daysInput.write("");
    this.startTimesInput.write("");
    this.endTimesInput.write("");
    this.summaryOutput.write("");
    this.distributedOutput.write("");
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = TimeTracker;
}
