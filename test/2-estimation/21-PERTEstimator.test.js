const { assert } = require("chai");
const { stub, spy } = require("sinon");
const { suite, test, setup } = require("mocha");
const PERTEstimator = require("../../src/2-estimation/21-PERTEstimator");

suite("PERTEstimator", function () {
  let risk, guessesInput, estimationsOutput, reportOutput, estimator;

  setup(function () {
    risk = 2;
    guessesInput = { read: stub(), write: spy() };
    estimationsOutput = { write: stub() };
    reportOutput = { write: spy() };
    estimator = new PERTEstimator(
      risk,
      guessesInput,
      estimationsOutput,
      reportOutput
    );
  });

  suite("estimate", function () {
    test("performs calculations correctly", function () {
      guessesInput.read.returns([
        [1, 0, 2, 15, 3, 30],
        [4, 45, 5, 0, 6, 15],
        [7, 30, 8, 45, 9, 0],
      ]);

      estimator.estimate();

      // Calculated by hand with formulas from: https://en.wikipedia.org/wiki/Three-point_estimation
      assert.deepEqual(estimationsOutput.write.getCall(0).args[0], [
        [2, 30, 0, 25],
        [5, 10, 0, 23],
        [8, 35, 0, 23],
        [16, 15, 0, 41],
      ]);
    });
  });

  suite("reset", function () {});
});
