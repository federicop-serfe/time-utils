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
    this.timeBalancer = new BestEffortBalancer(0.15);
    //this.timeBalancer = new LPBalancer(0.75, 0.25, new BestEffortBalancer(0.15));
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

      return Object.values(ticketTimes).map((ticket) => {
        ticket.real = GeneralUtils.roundBetween(ticket.real, 0, 5);
        return ticket;
      });
    };

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
    };

    const getDistributedOutput = (distributedTimes) => {
      const namesDaysMat = distributedTimes.map((ticket) => [
        ticket.name,
        ticket.day,
      ]);
      const timesMat = distributedTimes.map((ticket) => [ticket.total]);

      return GeneralUtils.concatMatricesHorizontally(
        namesDaysMat,
        this.timeConverter.matrixToHAndMin(timesMat)
      );
    };

    // --------------------------------
    // Retrieve data
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
    this.summaryOutput.write(getSummaryOutput(ticketTimes, fakeTimes));

    // Distributed across days output
    this.distributedOutput.write(getDistributedOutput(distributedTimes));
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
