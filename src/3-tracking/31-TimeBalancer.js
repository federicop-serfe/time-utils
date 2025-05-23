if (typeof GeneralUtils === "undefined") {
  GeneralUtils = require("../1-utils/13-GeneralUtils");
}

// Abstract class for strategy design pattern
class TimeBalancingStrategy {
  // Input: ticketTimes = [{name, real, estimated}], totalWeekTime
  // Output: fakeTimes = [{name, fake}]
  // Times in minutes
  balance(ticketTimes, totalWeekTime) {
    return null;
  }
}

class LPBalancer extends TimeBalancingStrategy {
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
    const realTimesSum = ticketTimes
      .map((ticket) => ticket.real)
      .reduce((acc, curr) => acc + curr);
    const hoursContraint = this.engine.addConstraint(
      totalWeekTime - realTimesSum,
      weekMinutes
    );
    let fakeTime;
    ticketTimes.forEach((ticket) => {
      fakeTime = `fake-${ticket.name}`;

      // Create variables
      if (ticket.estimated - ticket.real > 0) {
        this.engine.addVariable(
          fakeTime,
          0,
          (1 + this.maxSlack) * (ticket.estimated - ticket.real)
        );
      } else {
        this.engine.addVariable(fakeTime, -ticket.real * this.maxDiscount, 0);
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
      return ticketTimes.map((ticket) => ({
        name: ticket.name,
        fake: solution.getVariableValue(`fake-${ticket.name}`),
      }));
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
class BestEffortBalancer extends TimeBalancingStrategy {
  // 0 <= deviatedTicketPenalizationFactor <= 1: controls how much time substraction takes place for deviated tasks (0: none, 1: 2E - R, >1: not recommended)
  constructor(deviatedTicketPenalizationFactor) {
    super();
    this.deviatedTicketPenalizationFactor = deviatedTicketPenalizationFactor;
  }

  balance(ticketTimes, totalWeekTime) {
    const sum = (arr, atr) =>
      arr.map((ai) => ai[atr]).reduce((acc, curr) => acc + curr);

    const fakeTimes = [];
    //const fillingWeights = ticketTimes.map((ticket) => ({ name: ticket.name, weight: ticket.estimated }));
    const fillingWeights = ticketTimes.reduce((acc, ticket) => {
      acc[ticket.name] = ticket.estimated;
      return acc;
    }, {});
    const sortedTicketTimes = [...ticketTimes].sort(
      (a, b) => b.estimated - a.estimated
    );
    const timeTofill = totalWeekTime - sum(ticketTimes, "real");
    let remaindingToFill;

    // i.e. times need to be filled
    if (timeTofill > 0) {
      remaindingToFill = timeTofill;
      sortedTicketTimes.forEach((ticket) => {
        remaindingToFill -= ticket.estimated - ticket.real;
        fillingWeights[ticket.name] -=
          this.deviatedTicketPenalizationFactor *
          Math.min(ticket.estimated - ticket.real, 0);
        fakeTimes.push({
          name: ticket.name,
          fake: ticket.estimated - ticket.real,
        });
      });

      const weightSum = Object.values(fillingWeights).reduce(
        (acc, curr) => acc + curr,
        0
      );
      if (remaindingToFill > 0) {
        sortedTicketTimes.forEach((ticket) => {
          fakeTimes.find((t) => t.name === ticket.name).fake += Math.ceil(
            (remaindingToFill * fillingWeights[ticket.name]) / weightSum
          );
        });
      }
    } else {
      sortedTicketTimes.forEach((ticket) => {
        fakeTimes.push({
          name: ticket.name,
          fake: Math.ceil((timeTofill * ticket.estimated) / estimatedSum),
        });
      });
    }

    return fakeTimes;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    TimeBalancingStrategy,
    LPBalancer,
    BestEffortBalancer,
  };
}
