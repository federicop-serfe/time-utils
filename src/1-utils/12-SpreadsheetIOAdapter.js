class SpreadsheetIOAdapter {
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

  read(reference, minRows, minCols) {
    const ref = reference || this.defaultReference;
    let values;
    try {
      const range = this.sheet.getRange(ref);
      if (this.isCell(ref)) return range.getValue();
      values = range.getValues();
    } catch (error) {
      throw new Error(`Error reading reference "${ref}": ${error.message}`);
    }

    // Remove empty rows and columns
    const hasData = (matrix) =>
      matrix.reduce(
        (hasData, row) =>
          hasData || row.some((value) => value.length > 0 || value > 0),
        false
      );
    const isValidMinDim = (min) => typeof min === "number" && min >= 0;
    if (values.length > 0 && values[0].length > 0) {
      let i, rows;
      const finalMinRows = isValidMinDim(minRows) ? minRows - 1 : 0;
      for (i = 0; i < values.length; i++) {
        rows = values.slice(i);
        if (i > finalMinRows && !hasData(rows)) {
          values = values.slice(0, i);
        }
      }

      let j, cols;
      const finalMinCols = isValidMinDim(minCols) ? minCols - 1 : 0;
      for (j = 0; j < values[0].length; j++) {
        cols = values.map((row) => row.slice(j));
        if (j > finalMinCols && !hasData(cols)) {
          values = values.map((row) => row.slice(0, j));
        }
      }
    }

    return values;
  }

  write(data, reference) {
    const ref = reference || this.defaultReference;
    if (typeof data === "undefined" || data === null) {
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
          // Fill with the upper-left value of the matrix
          finalData = data[0][0];
        } else {
          // Fill with the first value of the array
          finalData = data[0];
        }
      } else {
        // Fill with the single value
        finalData = data;
      }
    } else {
      if (!Array.isArray(data) || !Array.isArray(data[0])) {
        // Fill the range with the single value
        finalData = [];
        let row;
        for (let i = 0; i < range.getNumRows(); i++) {
          row = [];
          for (let j = 0; j < range.getNumColumns(); j++) {
            row.push(data);
          }
          finalData.push(row);
        }
      } else {
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
    }

    try {
      this.isCell(ref) ? range.setValue(finalData) : range.setValues(finalData);
    } catch (error) {
      throw new Error(`Error writing to reference "${ref}": ${error.message}`);
    }
  }

  // Private
  isCell(reference) {
    const ref = reference || this.defaultReference;
    const cellRegex = /^[A-Z]+[0-9]+$/;
    return cellRegex.test(ref);
  }

  // Private
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
  module.exports = SpreadsheetIOAdapter;
}
