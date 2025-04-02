const { suite, test, setup, teardown } = require("mocha");
const { assert } = require("chai");
const { stub, restore } = require("sinon");
const SpreadsheetIOAdapter = require("../../src/1-utils/12-SpreadsheetIOAdapter");

global.SpreadsheetApp = { getActiveSpreadsheet: () => {} };

suite("SpreadsheetIOAdapter", function () {
  let spreadsheetStub, rangeStub, sheetStub;

  setup(function () {
    rangeStub = {
      setValue: stub(),
      setValues: stub(),
      getValue: stub(),
      getValues: stub(),
      getNumRows: stub(),
      getNumColumns: stub(),
    };
    sheetStub = {
      getRange: stub().returns(rangeStub),
    };
    spreadsheetStub = { getSheetByName: stub() };
    stub(SpreadsheetApp, "getActiveSpreadsheet").returns(spreadsheetStub);
  });

  suite("constructor", function () {
    teardown(function () {
      restore();
    });

    test("throws if no sheet name", function () {
      assert.throws(
        () => new SpreadsheetIOAdapter(),
        /Sheet name not provided/
      );
    });

    test("throws if sheet not found", function () {
      spreadsheetStub.getSheetByName.returns(null);
      assert.throws(
        () => new SpreadsheetIOAdapter("UnknownSheet", "A1"),
        'Sheet "UnknownSheet" not found'
      );
    });

    test("throws if invalid default reference", function () {
      spreadsheetStub.getSheetByName.returns(sheetStub);
      assert.throws(
        () => new SpreadsheetIOAdapter("Sheet1", "InvalidRef"),
        /Invalid reference/
      );
    });

    test("constructs with valid params", function () {
      spreadsheetStub.getSheetByName.returns(sheetStub);
      assert.doesNotThrow(() => new SpreadsheetIOAdapter("Sheet1", "A1"));
    });
  });

  suite("read", function () {
    let IOAdapter;

    setup(function () {
      spreadsheetStub.getSheetByName.returns(sheetStub);
      IOAdapter = new SpreadsheetIOAdapter("Sheet1");
    });

    teardown(function () {
      restore();
    });

    test("reads value when it's a cell", function () {
      rangeStub.getValue.returns("someValue");

      const result = IOAdapter.read("A1");

      assert(rangeStub.getValue.calledOnce);
      assert.strictEqual(result, "someValue");
    });

    test("reads array of values when it's a range", function () {
      rangeStub.getValues.returns([["v1", "v2"]]);

      const result = IOAdapter.read("A1:B1");

      assert(rangeStub.getValues.calledOnce);
      assert.deepEqual(result, [["v1", "v2"]]);
    });

    test("throws on read error", function () {
      sheetStub.getRange = stub().throws(new Error("Some error"));
      assert.throws(() => IOAdapter.read(), /Error reading reference/);
    });

    test("truncates empty data, accounting for minimum rows and cols", function () {
      rangeStub.getValues.returns([
        ["v1", "v2", "", "", ""],
        ["v3", "v4", "v5", "", ""],
        ["v6", "", "", "", ""],
        ["", "", "", "", ""],
        ["", "", "", "", ""],
      ]);

      const result = IOAdapter.read("A1:B4", 4, 4);

      assert.deepEqual(result, [
        ["v1", "v2", "", ""],
        ["v3", "v4", "v5", ""],
        ["v6", "", "", ""],
        ["", "", "", ""],
      ]);
    });
  });

  suite("write", function () {
    let IOAdapter;

    setup(function () {
      spreadsheetStub.getSheetByName.returns(sheetStub);
      IOAdapter = new SpreadsheetIOAdapter("Sheet1");
    });

    teardown(function () {
      restore();
    });

    test("writes single value to cell", function () {
      IOAdapter.write("newValue", "A1");

      assert(rangeStub.setValue.calledOnceWith("newValue"));
    });

    test("writes array to cell (takes first element)", function () {
      IOAdapter.write(["val1", "val2"], "A1");

      assert(rangeStub.setValue.calledOnceWith("val1"));
    });

    test("writes matrix to cell (takes first element of first row)", function () {
      IOAdapter.write(
        [
          ["val1", "val2"],
          ["val3", "val4"],
        ],
        "A1"
      );

      assert(rangeStub.setValue.calledOnceWith("val1"));
    });

    test("writes matrix to range (equal size)", function () {
      rangeStub.getNumRows.returns(1);
      rangeStub.getNumColumns.returns(2);

      IOAdapter.write([["v1", "v2"]], "A1:B1");

      assert(rangeStub.setValues.calledOnceWith([["v1", "v2"]]));
    });

    test("writes matrix to range (adds padding since matrix is smaller than range)", function () {
      rangeStub.getNumRows.returns(2);
      rangeStub.getNumColumns.returns(2);

      IOAdapter.write([["v1"]], "A1:B2");

      assert(
        rangeStub.setValues.calledOnceWith([
          ["v1", ""],
          ["", ""],
        ])
      );
    });

    test("writes matrix to range (truncates data since matrix is bigger than range)", function () {
      rangeStub.getNumRows.returns(2);
      rangeStub.getNumColumns.returns(2);

      IOAdapter.write(
        [
          ["v1", "v2", "v3"],
          ["v4", "v5", "v6"],
          ["v7", "v8", "v9"],
        ],
        "A1:B2"
      );

      assert(
        rangeStub.setValues.calledOnceWith([
          ["v1", "v2"],
          ["v4", "v5"],
        ])
      );
    });

    test("writes single value to range", function () {
      rangeStub.getNumRows.returns(2);
      rangeStub.getNumColumns.returns(2);

      IOAdapter.write("v1", "A1:B2");

      assert(
        rangeStub.setValues.calledOnceWith([
          ["v1", "v1"],
          ["v1", "v1"],
        ])
      );
    });

    test("throws if no data", function () {
      assert.throws(
        () => IOAdapter.write(undefined, "A1"),
        /Data not provided/
      );
    });

    test("throws on write error", function () {
      rangeStub.setValue.throws(new Error("Write error"));
      assert.throws(
        () => IOAdapter.write("data", "A1"),
        /Error writing to reference/
      );
    });
  });
});
