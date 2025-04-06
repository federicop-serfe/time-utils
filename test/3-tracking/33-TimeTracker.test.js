const { setup, teardown, suite, test } = require("mocha");
const { assert } = require("chai");
const { restore, stub, spy } = require("sinon");
const TimeTracker = require("../../src/3-tracking/33-TimeTracker");

suite("TimeTracker", function () {
  let timeTracker,
    ticketsInput,
    estimatedTimesInput,
    daysInput,
    startTimesInput,
    endTimesInput,
    summaryOutput,
    distributedOutput;

  setup(function () {
    ticketsInput = {
      read: stub(),
      write: spy(),
    };
    estimatedTimesInput = {
      read: stub(),
      write: spy(),
    };
    daysInput = {
      read: stub(),
      write: spy(),
    };
    startTimesInput = {
      read: stub(),
      write: spy(),
    };
    endTimesInput = {
      read: stub(),
      write: spy(),
    };
    summaryOutput = {
      write: stub(),
    };
    distributedOutput = {
      write: stub(),
    };

    timeTracker = new TimeTracker(
      ticketsInput,
      estimatedTimesInput,
      daysInput,
      startTimesInput,
      endTimesInput,
      summaryOutput,
      distributedOutput
    );
  });

  teardown(function () {
    restore();
  });

  suite("getTicketTimes", function () {
    let tickets, estimatedTimes, startTimes, endTimes;

    /*
        - The last value provided at the estimatedTimes array 
        should be the one considered
        - Should be case insensitive
        - Should allow using the "previous" flag (even multiple times)
        - Should compute timestamp differences and add them to the total
        - Should fill endTimes in case they aren't provided
        - Should consider internal empty tickets as "previous" tickets
    */
    test("returns correct ticket times", function () {
      tickets = ["TICKET1", "", "ticket2", "ticket1", "PREV", "prev"];
      estimatedTimes = [0, 0, 60, 0, 240, 0];
      startTimes = [0, 35, 70, 125, 160, 180];
      endTimes = [30, 60, 120, 150, 0, 190];

      const result = timeTracker.getTicketTimes(
        tickets,
        estimatedTimes,
        startTimes,
        endTimes
      );

      assert.deepEqual(result, [
        { name: "ticket1", real: 110, estimated: 240 },
        { name: "ticket2", real: 50, estimated: 60 },
      ]);
    });

    test("throws if start time is greater than end time", function () {
      tickets = ["ticket1"];
      estimatedTimes = [0];
      startTimes = [100];
      endTimes = [50];

      assert.throws(() => {
        timeTracker.getTicketTimes(
          tickets,
          estimatedTimes,
          startTimes,
          endTimes
        );
      }, /Start time is greater than end time for ticket: ticket1/);
    });

    test("throws if no end time is available", function () {
      tickets = ["ticket1"];
      estimatedTimes = [0];
      startTimes = [0];
      endTimes = [0];

      assert.throws(() => {
        timeTracker.getTicketTimes(
          tickets,
          estimatedTimes,
          startTimes,
          endTimes
        );
      }, /No end time available for ticket: ticket1/);
    });

    test("throws if there's a previous flag wihout a ticket", function () {
      tickets = ["prev", "ticket1"];
      estimatedTimes = [0, 0];
      startTimes = [0, 10];
      endTimes = [5, 15];

      assert.throws(() => {
        timeTracker.getTicketTimes(
          tickets,
          estimatedTimes,
          startTimes,
          endTimes
        );
      }, /No last ticket available/);
    });

    test("returns empty array for empty tickets", function () {
      tickets = [];
      estimatedTimes = [];
      startTimes = [];
      endTimes = [];

      const result = timeTracker.getTicketTimes(
        tickets,
        estimatedTimes,
        startTimes,
        endTimes
      );

      assert.deepEqual(result, []);
    });
  });
});
