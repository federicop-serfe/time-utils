class SimpleSpreadsheetIOHandler {
  constructor(sheetName, defaultReference = undefined) {
    if (!sheetName) {
      throw new Error("Sheet name not provided");
    }
    this.sheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!this.sheet) {
      throw new Error(`Sheet "${this.sheetName}" not found`);
    }
    this.sheetName = sheetName;

    if (defaultReference) {
      this.setReference(defaultReference);
    }
  }

  read(reference) {
    const ref = reference || this.defaultReference;
    try {
      const range = this.sheet.getRange(ref);
      return this.isCell(ref) ? range.getValue() : range.getValues();
    } catch (error) {
      throw new Error(`Error reading reference "${ref}": ${error.message}`);
    }
  }

  write(data, reference) {
    const ref = reference || this.defaultReference;
    if (!data) {
      throw new Error("Data not provided");
    }
    try {
      const range = this.sheet.getRange(ref);
      this.isCell(ref) ? range.setValue(data) : range.setValues(data);
    } catch (error) {
      throw new Error(`Error writing to reference "${ref}": ${error.message}`);
    }
  }

  isCell(reference) {
    const ref = reference || this.defaultReference;
    const cellRegex = /^[A-Z]+[0-9]+$/;
    return cellRegex.test(ref);
  }

  isRange(reference) {
    const ref = reference || this.defaultReference;
    const rangeRegex = /^[A-Z]+[0-9]+:[A-Z]+[0-9]+$/;
    return rangeRegex.test(ref);
  }

  setReference(reference) {
    if (!this.isCell(reference) && !this.isRange(reference)) {
      throw new Error(`Invalid reference: "${defaultReference}"`);
    }
    this.defaultReference = reference;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = SimpleSpreadsheetIOHandler;
}
