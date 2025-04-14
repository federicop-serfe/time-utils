const { setup, teardown, suite, test } = require("mocha");
const { assert } = require("chai");
const TimeDistributer = require("../../src/3-tracking/32-TimeDistributer");

suite("TimeDistributer", function () {
  let timeDistributer, dayWorkingMinutes;

  setup(function () {
    dayWorkingMinutes = 5 * 8 * 60;
    timeDistributer = new TimeDistributer(dayWorkingMinutes);
  });

  suite("distribute", function () {
    let ticketTimes, fakeTimes, weekWorkingDays;
    const sum = (arr) => arr.reduce((acc, curr) => acc + curr, 0);

    test("distributes time correctly", function () {
      ticketTimes = [
        { name: "TicketA", real: dayWorkingMinutes },
        { name: "TicketB", real: dayWorkingMinutes },
        { name: "TicketC", real: dayWorkingMinutes },
        { name: "TicketD", real: 0 },
      ];
      fakeTimes = [
        { name: "TicketA", fake: -1 },
        { name: "TicketB", fake: 0 },
        { name: "TicketC", fake: 1 },
        { name: "TicketD", fake: 1 },
      ];
      weekWorkingDays = ["Mon", "Tue", "Wed", "Thu", "Fri"];

      const distributed = timeDistributer.distribute(
        ticketTimes,
        fakeTimes,
        weekWorkingDays
      );

      assert.equal(
        sum(distributed.map((d) => d.total)),
        sum(ticketTimes.map((t) => t.real)) + sum(fakeTimes.map((f) => f.fake)),
        "Total time distributed should equal total time of tickets and fake times"
      );

      const sumPerDay = {};
      distributed.forEach((d) => {
        if (!sumPerDay[d.day]) sumPerDay[d.day] = 0;
        sumPerDay[d.day] += d.total;
      });
      const distributedDays = Object.keys(sumPerDay);
      distributedDays.forEach((day, idx) => {
        if (idx < distributedDays.length - 1) {
          assert.equal(
            sumPerDay[day],
            dayWorkingMinutes,
            `Total time for ${day} should equal dayWorkingMinutes`
          );
        } else {
          assert.equal(
            sumPerDay[day],
            sum(distributed.map((d) => d.total)) - idx * dayWorkingMinutes,
            `Total time for ${day} should equal total time distributed minus previous days`
          );
        }
      });

      debugger;
      assert.isTrue(
        distributed.every((d) => d.total > 0),
        "All distributed times should be positive"
      );
    });

    test("throws error for negative total time", function () {
      ticketTimes = [{ name: "TicketA", real: 0 }];
      fakeTimes = [{ name: "TicketA", fake: -1 }];
      weekWorkingDays = ["Mon"];

      assert.throws(
        () =>
          timeDistributer.distribute(ticketTimes, fakeTimes, weekWorkingDays),
        "Ticket TicketA has negative or zero total time"
      );
    });

    test("throws error for zero total time", function () {
      ticketTimes = [{ name: "TicketA", real: 0 }];
      fakeTimes = [{ name: "TicketA", fake: 0 }];
      weekWorkingDays = ["Mon"];

      assert.throws(
        () =>
          timeDistributer.distribute(ticketTimes, fakeTimes, weekWorkingDays),
        "Ticket TicketA has negative or zero total time"
      );
    });

    test("throws error for mismatched ticket names", function () {
      ticketTimes = [{ name: "TicketA", real: dayWorkingMinutes }];
      fakeTimes = [{ name: "TicketB", fake: 0 }];
      weekWorkingDays = ["Mon"];

      assert.throws(
        () =>
          timeDistributer.distribute(ticketTimes, fakeTimes, weekWorkingDays),
        "Ticket names in ticketTimes and fakeTimes do not match"
      );
    });
  });
});
