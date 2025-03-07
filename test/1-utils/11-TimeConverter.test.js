const { assert } = require("chai");
const { suite, test, setup } = require("mocha");
const TimeConverter = require("../../src/1-utils/11-TimeConverter");

suite("TimeConverter", function () {
  let tc;

  setup(function () {
    tc = new TimeConverter();
  });

  suite("toMin", function () {
    test("converts hours and minutes to minutes correctly", function () {
      assert.deepEqual(tc.toMin(1, 30), 90);
    });

    test("converts negative hours and minutes to minutes correctly", function () {
      assert.deepEqual(tc.toMin(-1, -30), -90);
    });

    test("converts zero hours and minutes to minutes correctly", function () {
      assert.deepEqual(tc.toMin(0, 0), 0);
    });
  });

  suite("toHAndMin", function () {
    test("converts positive minutes correctly", function () {
      assert.deepEqual(tc.toHAndMin(90), [1, 30]);
    });

    test("converts zero minutes correctly", function () {
      assert.deepEqual(tc.toHAndMin(0), [0, 0]);
    });

    test("converts negative minutes correctly", function () {
      assert.deepEqual(tc.toHAndMin(-90), [-1, -30]);
    });
  });

  suite("matrixToMin", function () {
    test("converts a matrix in hours and minutes to minutes correctly", function () {
      assert.deepEqual(
        tc.matrixToMin([
          [1, 30, 2, 0],
          [0, 0, 1, 30],
        ]),
        [
          [90, 120],
          [0, 90],
        ]
      );
    });

    test("converts empty matrix to empty matrix", function () {
      assert.deepEqual(tc.matrixToMin([]), []);
    });

    test("converts non-array matrix to empty matrix", function () {
      assert.deepEqual(tc.matrixToMin("string"), []);
    });

    test("returns empty matrix if matrix length is odd", function () {
      assert.deepEqual(tc.matrixToMin([1, 30, 2]), []);
    });
  });

  suite("matrixToHAndMin", function () {
    test("converts a matrix in minutes to hours and minutes correctly", function () {
      assert.deepEqual(
        tc.matrixToHAndMin([
          [90, 120],
          [0, 90],
        ]),
        [
          [1, 30, 2, 0],
          [0, 0, 1, 30],
        ]
      );
    });

    test("converts empty matrix to empty matrix", function () {
      assert.deepEqual(tc.matrixToHAndMin([]), []);
    });

    test("converts non-array matrix to empty matrix", function () {
      assert.deepEqual(tc.matrixToHAndMin("string"), []);
    });
  });
});
