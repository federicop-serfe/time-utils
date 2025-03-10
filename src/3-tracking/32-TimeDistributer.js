class TimeDistributer {
  constructor(dayWorkingMinutes) {
    this.dayWorkingMinutes = dayWorkingMinutes;
  }

  // Input: ticketTimes = [{name, real, estimated}], fakeTimes = [{name, fake}]
  // Output: [{ticket, day, total}]
  // Times in minutes
  distribute(ticketTimes, fakeTimes, weekWorkingDays) {
    const remaining = ticketTimes.map((ticket) => ({
      name: ticket.name,
      total: ticket.real + fakeTimes.find((t) => t.name === ticket.name).fake,
    }));
    const distributed = [];
    let ticketIdx = 0,
      dayIdx = 0;
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

if (typeof module !== "undefined" && module.exports) {
  module.exports = TimeDistributer;
}
