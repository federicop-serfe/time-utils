class SimpleSpreadsheetIOHandler {
  constructor(sheetName) {
    this.sheetName = sheetName;
    this.sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
      this.sheetName
    );
    if (!this.sheet) {
      throw new Error(`Sheet "${this.sheetName}" not found`);
    }
  }

  read(reference) {
    try {
      const range = this.sheet.getRange(reference);
      return this.isCell(reference) ? range.getValue() : range.getValues();
    } catch (error) {
      throw new Error(
        `Error reading reference "${reference}": ${error.message}`
      );
    }
  }

  write(reference, data) {
    try {
      const range = this.sheet.getRange(reference);
      this.isCell(reference) ? range.setValue(data) : range.setValues(data);
    } catch (error) {
      throw new Error(
        `Error writing to reference "${reference}": ${error.message}`
      );
    }
  }

  isCell(reference) {
    const cellRegex = /^[A-Z]+[0-9]+$/;
    return cellRegex.test(reference);
  }

  isRange(reference) {
    const rangeRegex = /^[A-Z]+[0-9]+:[A-Z]+[0-9]+$/;
    return rangeRegex.test(reference);
  }
}
