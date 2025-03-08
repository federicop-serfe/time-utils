const { suite, test, setup, teardown } = require("mocha");
const { assert } = require("chai");
const sinon = require("sinon");
const SimpleSpreadsheetIOHandler = require("../../src/1-utils/12-SimpleSpreadsheetIOHandler");

global.SpreadsheetApp = { getActiveSpreadsheet: () => {} };

suite("SimpleSpreadsheetIOHandler", function () {
  let spreadsheetStub, sheetStub;

  setup(function () {
    sheetStub = { getRange: sinon.stub() };
    spreadsheetStub = { getSheetByName: sinon.stub() };
    sinon.stub(SpreadsheetApp, "getActiveSpreadsheet").returns(spreadsheetStub);
  });

  suite("Constructor", function () {
    teardown(function () {
      sinon.restore();
    });

    test("throws if no sheet name", function () {
      assert.throws(
        () => new SimpleSpreadsheetIOHandler(),
        /Sheet name not provided/
      );
    });

    test("throws if sheet not found", function () {
      spreadsheetStub.getSheetByName.returns(null);
      assert.throws(
        () => new SimpleSpreadsheetIOHandler("UnknownSheet", "A1"),
        'Sheet "UnknownSheet" not found'
      );
    });

    test("throws if invalid default reference", function () {
      spreadsheetStub.getSheetByName.returns(sheetStub);
      assert.throws(
        () => new SimpleSpreadsheetIOHandler("Sheet1", "InvalidRef"),
        /Invalid reference/
      );
    });

    test("constructs with valid params", function () {
      spreadsheetStub.getSheetByName.returns(sheetStub);
      assert.doesNotThrow(() => new SimpleSpreadsheetIOHandler("Sheet1", "A1"));
    });
  });

  suite("read", function () {
    let handler;

    setup(function () {
      spreadsheetStub.getSheetByName.returns(sheetStub);
      handler = new SimpleSpreadsheetIOHandler("Sheet1");
    });

    teardown(function () {
      sinon.restore();
    });

    test("reads value when cell", function () {
      spreadsheetStub.getSheetByName.returns(sheetStub);
      const rangeStub = { getValue: sinon.stub().returns("someValue") };
      sheetStub.getRange.returns(rangeStub);

      const result = handler.read("A1");

      assert(rangeStub.getValue.calledOnce);
      assert.strictEqual(result, "someValue");
    });

    test("reads array of values when range", function () {
      spreadsheetStub.getSheetByName.returns(sheetStub);
      const rangeMock = { getValues: sinon.stub().returns([["v1", "v2"]]) };
      sheetStub.getRange.returns(rangeMock);

      const result = handler.read("A1:B1");

      assert(rangeMock.getValues.calledOnce);
      assert.deepEqual(result, [["v1", "v2"]]);
    });

    test("throws on read error", function () {
      spreadsheetStub.getSheetByName.returns(sheetStub);
      sheetStub.getRange.throws(new Error("Some error"));
      assert.throws(() => handler.read(), /Error reading reference/);
    });
  });

  suite("write", function () {
    let handler;

    setup(function () {
      spreadsheetStub.getSheetByName.returns(sheetStub);
      handler = new SimpleSpreadsheetIOHandler("Sheet1");
    });

    teardown(function () {
      sinon.restore();
    });

    test("writes single value to cell", function () {
      spreadsheetStub.getSheetByName.returns(sheetStub);
      const rangeMock = { setValue: sinon.stub() };
      sheetStub.getRange.returns(rangeMock);

      handler.write("newValue", "A1");

      assert(rangeMock.setValue.calledOnceWith("newValue"));
    });

    test("writes array to range", function () {
      spreadsheetStub.getSheetByName.returns(sheetStub);
      const rangeMock = { setValues: sinon.stub() };
      sheetStub.getRange.returns(rangeMock);

      handler.write([["v1", "v2"]], "A1:B2");
      assert.isTrue(rangeMock.setValues.calledOnceWith([["v1", "v2"]]));
    });

    test("throws if no data", function () {
      spreadsheetStub.getSheetByName.returns(sheetStub);
      assert.throws(() => handler.write(undefined, "A1"), /Data not provided/);
    });

    test("throws on write error", function () {
      spreadsheetStub.getSheetByName.returns(sheetStub);
      sheetStub.getRange.throws(new Error("Write error"));
      assert.throws(
        () => handler.write("data", "A1"),
        /Error writing to reference/
      );
    });
  });
});
