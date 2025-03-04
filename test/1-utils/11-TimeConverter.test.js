const { assert } = require("chai");
const { suite, test, setup } = require("mocha");
const TimeConverter = require("../../src/1-utils/11-TimeConverter");

suite("TimeConverter", function () {
  let tc;

  setup(function () {
    tc = new TimeConverter();
  });

  suite("toMin", function () {
    test("should convert hours and minutes to minutes correctly", function () {
      assert.deepEqual(tc.toMin(1, 30), 90);
    });

    test("should convert negative hours and minutes to minutes correctly", function () {
      assert.deepEqual(tc.toMin(-1, -30), -90);
    });

    test("should convert zero hours and minutes to minutes correctly", function () {
      assert.deepEqual(tc.toMin(0, 0), 0);
    });
  });

  suite("toHAndMin", function () {
    test("should convert positive minutes correctly", function () {
      assert.deepEqual(tc.toHAndMin(90), [1, 30]);
    });

    test("should convert zero minutes correctly", function () {
      assert.deepEqual(tc.toHAndMin(0), [0, 0]);
    });

    test("should convert negative minutes correctly", function () {
      assert.deepEqual(tc.toHAndMin(-90), [-1, -30]);
    });
  });

  suite("matrixToMin", function () {
    test("should convert a matrix in hours and minutes to minutes correctly", function () {
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

    test("should convert empty matrix to empty matrix", function () {
      assert.deepEqual(tc.matrixToMin([]), []);
    });

    test("should convert non-array matrix to empty matrix", function () {
      assert.deepEqual(tc.matrixToMin("string"), []);
    });

    test("should return empty matrix if matrix length is odd", function () {
      assert.deepEqual(tc.matrixToMin([1, 30, 2]), []);
    });
  });

  suite("matrixToHAndMin", function () {
    test("should convert a matrix in minutes to hours and minutes correctly", function () {
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

    test("should convert empty matrix to empty matrix", function () {
      assert.deepEqual(tc.matrixToHAndMin([]), []);
    });

    test("should convert non-array matrix to empty matrix", function () {
      assert.deepEqual(tc.matrixToHAndMin("string"), []);
    });
  });
});
