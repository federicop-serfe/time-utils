class SpreadsheetIOHandler {
  constructor(sheetName, defaultReference = undefined) {
    if (!sheetName) {
      throw new Error("Sheet name not provided");
    }
    this.sheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!this.sheet) {
      throw new Error(`Sheet "${sheetName}" not found`);
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

    let range;
    try {
      range = this.sheet.getRange(ref);
    } catch (error) {
      throw new Error(`Error reading range "${ref}"`);
    }

    let finalData;
    if (this.isCell(ref)) {
      if (Array.isArray(data)) {
        if (Array.isArray(data[0])) {
          finalData = data[0][0];
        } else {
          finalData = data[0];
        }
      } else {
        finalData = data;
      }
    } else {
      if (!Array.isArray(data) || !Array.isArray(data[0])) {
        throw new Error("Data must be a matrix for range references");
      }
      if (
        data.length < range.getNumRows() ||
        data[0].length < range.getNumColumns()
      ) {
        // Fill remaining space
        finalData = [];
        let row;
        for (let i = 0; i < range.getNumRows(); i++) {
          row = [];
          for (let j = data[i]?.length || 0; j < range.getNumColumns(); j++) {
            row.push("");
          }
          finalData.push([...(data[i] ? data[i] : []), ...row]);
        }
      } else if (
        data.length > range.getNumRows() ||
        data[0].length > range.getNumColumns()
      ) {
        // Truncate data
        finalData = data
          .slice(0, range.getNumRows())
          .map((row) => row.slice(0, range.getNumColumns()));
      } else {
        // Use data as is
        finalData = data;
      }
    }

    try {
      this.isCell(ref) ? range.setValue(finalData) : range.setValues(finalData);
    } catch (error) {
      throw new Error(`Error writing to reference "${ref}": ${error.message}`);
    }
  }

  fillWith(value, reference) {
    const ref = reference || this.defaultReference;

    if (Array.isArray(value)) {
      throw new Error("Must provide a single value to fill with");
    }

    const newValues = this.read(ref).map((row) => row.map(() => value));
    this.write(newValues, ref);
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
      throw new Error(`Invalid reference: "${reference}"`);
    }
    this.defaultReference = reference;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = SpreadsheetIOHandler;
}
