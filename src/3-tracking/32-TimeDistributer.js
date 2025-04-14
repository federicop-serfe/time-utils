class TimeDistributer {
  constructor(dayWorkingMinutes) {
    this.dayWorkingMinutes = dayWorkingMinutes;
  }

  // Input: ticketTimes = [{name, real, estimated}], fakeTimes = [{name, fake}]
  // Output: [{ticket, day, total}]
  // Times in minutes
  distribute(ticketTimes, fakeTimes, weekWorkingDays) {
    const findFake = (ticket) => fakeTimes.find((t) => t.name === ticket.name);

    const areSameTicketsOnBothArrays = ticketTimes.every(
      (ticket) => !!findFake(ticket)
    );
    if (!areSameTicketsOnBothArrays) {
      throw new Error("Ticket names in ticketTimes and fakeTimes do not match");
    }

    const remaining = ticketTimes.map((ticket) => {
      const total = ticket.real + findFake(ticket).fake;
      if (total <= 0) {
        throw new Error(
          `Ticket ${ticket.name} has negative or zero total time`
        );
      }
      return {
        name: ticket.name,
        total: total,
      };
    });
    const distributed = [];
    let ticketIdx = 0,
      dayIdx = 0;
    let accumulatedTime = 0;
    let aux, total;

    while (ticketIdx < remaining.length && dayIdx < weekWorkingDays.length) {
      aux = accumulatedTime + remaining[ticketIdx].total;
      if (aux < this.dayWorkingMinutes) {
        total = remaining[ticketIdx].total;
        if (total > 0) {
          distributed.push({
            name: remaining[ticketIdx].name,
            total: total,
            day: weekWorkingDays[dayIdx],
          });
        }
        accumulatedTime = aux;
        remaining[ticketIdx].total = 0;
        ticketIdx++;
      } else {
        total = this.dayWorkingMinutes - accumulatedTime;
        if (total > 0) {
          distributed.push({
            name: remaining[ticketIdx].name,
            total: total,
            day: weekWorkingDays[dayIdx],
          });
        }
        remaining[ticketIdx].total = aux - this.dayWorkingMinutes;
        dayIdx++;
        accumulatedTime = 0;
      }
    }

    return distributed;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = TimeDistributer;
}
