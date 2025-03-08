const { assert } = require("chai");
const { stub, spy, restore } = require("sinon");
const { suite, test, setup, teardown } = require("mocha");
const PERTEstimator = require("../../src/2-estimation/21-PERTEstimator");

suite("PERTEstimator", function () {
  let risk, guessesInput, estimationsOutput, reportOutput, estimator;

  setup(function () {
    risk = 2;
    guessesInput = {
      read: stub(),
      write: spy(),
      fillWith: spy(),
    };
    estimationsOutput = {
      write: stub(),
      fillWith: spy(),
    };
    reportOutput = {
      write: spy(),
      fillWith: spy(),
    };
    estimator = new PERTEstimator(
      risk,
      guessesInput,
      estimationsOutput,
      reportOutput
    );
  });

  teardown(function () {
    restore();
  });

  suite("estimate", function () {
    teardown(function () {
      restore();
    });

    test("performs calculations correctly", function () {
      guessesInput.read.returns([
        [1, 0, 2, 15, 3, 30],
        [4, 45, 5, 0, 6, 15],
        [7, 30, 8, 45, 9, 0],
      ]);

      estimator.estimate();

      /* Calculated by hand with formulas from: https://en.wikipedia.org/wiki/Three-point_estimation
        Format:
            [EE(Analysis), SD(analysis)]
            [EE(Design/Implementation), SD(Design/Implementation)]
            [EE(Testing), SD(Testing)]
            [EE, SD]
            [FinalEstimation]
      */
      assert.deepEqual(estimationsOutput.write.getCall(0).args[0], [
        [2, 15, 0, 25],
        [5, 10, 0, 15],
        [8, 35, 0, 15],
        [16, 0, 0, 33],
        [17, 6, 0, 0],
      ]);
    });

    test("throws error if negative guesses are provided", function () {
      guessesInput.read.returns([
        [-1, 0, -2, 15, -3, 30],
        [-4, 45, -5, 0, -6, 15],
        [7, -30, 8, -45, 9, 0],
      ]);

      assert.throws(
        () => estimator.estimate(),
        "Negative guesses are not allowed"
      );
    });
  });

  suite("reset", function () {
    teardown(function () {
      restore();
    });

    test("resets guesses, estimations and report", function () {
      estimator.reset();

      assert(estimationsOutput.fillWith.calledOnce);
      assert(reportOutput.fillWith.calledOnce);
      assert(guessesInput.fillWith.calledOnce);
    });
  });
});
