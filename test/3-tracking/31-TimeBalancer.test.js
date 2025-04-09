const { assert } = require("chai");
const { restore } = require("sinon");
const { suite, test, setup, teardown } = require("mocha");
const { BestEffortBalancer } = require("../../src/3-tracking/31-TimeBalancer");

suite("BestEffortTimeBalancer", function () {
  let maxDiscount, balancer, tickets, totalWeekTime;
  const findFake = (fakeTimes, name) =>
    fakeTimes.find((t) => t.name === name).fake;

  setup(function () {
    maxDiscount = 0.25;
    balancer = new BestEffortBalancer(maxDiscount);
  });

  teardown(function () {
    restore();
  });

  suite("balance", function () {
    test("performs optimization correctly", function () {
      tickets = [
        { name: "TicketA", real: 60, estimated: 60 },
        { name: "TicketB", real: 90, estimated: 120 },
        { name: "TicketC", real: 150, estimated: 60 },
        { name: "TicketD", real: 75, estimated: 60 },
      ];
      totalWeekTime = 8 * 60;

      const fakeTimes = balancer.balance(tickets, totalWeekTime);

      const timesSumTotalWeekTime =
        tickets.reduce(
          (acc, curr) => acc + curr.real + findFake(fakeTimes, curr.name),
          0
        ) >= totalWeekTime;
      assert.isTrue(timesSumTotalWeekTime);
      const balancingIsNonNegative = tickets.reduce(
        (verifies, curr) =>
          verifies && curr.real + findFake(fakeTimes, curr.name) >= 0,
        true
      );
      assert.isTrue(balancingIsNonNegative);
    });
  });
});
