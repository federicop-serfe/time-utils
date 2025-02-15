/*
Relevant links:
https://developers.google.com/apps-script/guides/sheets/functions
https://stackoverflow.com/a/72753005
*/

// -------------------------------------------------------------------------------------------------

class TimeConverter {
  
  toMin(h, min) {
    return Math.floor(h) * 60 + Math.floor(min);
  }

  toHAndMin(min) {
    if (min > 0) {
      return [Math.floor(min / 60), Math.round(min % 60)];
    } else {
      return [Math.ceil(min / 60), Math.round(min % 60)];
    }
  }

  matrixToMin(matrixInHAndMin) {
    return matrixInHAndMin.map(
      (row, i) => {
        let aux = [];
        for (let j = 0; j < row.length; j += 2) {
            aux.push(this.toMin(row[j], row[j + 1]));
        }
        return aux;
      }
    );
  }
  
  matrixToHAndMin(matrixInMin) {
    return matrixInMin.map(
      row => row.map(
        val => this.toHAndMin(val)
      ).reduce(
        (acc, curr) => [...acc, ...curr] 
      )
    );
  }
}

class PERTEstimator {
  
  constructor(risk, sheetName, inputRange, outputRange, reportCell) {

    this.REPORT = ["* Analysis / Design", "* Implementation", "* Testing", "> EE", "> E"];
    
    this.risk = risk;
    this.sheetName = sheetName;
    this.inputRange = inputRange;
    this.outputRange = outputRange;
    this.reportCell = reportCell;    
    this.estimationSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(this.sheetName);
    this.timeConverter = new TimeConverter();
    
    this.statistic = {
      subtask: {
        // timeArr: [bestCase, mostLikely, worstCase]
        ee: timeArr => (timeArr[0] + 4 * timeArr[1] + timeArr[2]) / 6,
        sd: timeArr => (timeArr[2] - timeArr[0]) / 6,
      },
      task: {
        ee: eeArr => eeArr.reduce((acc, curr) => acc + curr),
        sd: sdArr => Math.sqrt(sdArr.map(sd => sd * sd).reduce((acc, curr) => acc + curr)),
      }
    }

    this.toString = (estimationInHAndMin, percentualRisk) => 
      `TIME ESTIMATION\n> Subtask:\n${this.REPORT.map((r, idx) => 
          `${r}: ${estimationInHAndMin[idx][0]}h${estimationInHAndMin[idx][1]}min`
          ).join("\n")}\n> Risk: ${percentualRisk}%`;
  }

  estimate() {
    const concatMatricesHorizontally = (A, B) => A.map(
      (row, idx) => row.concat(B[idx]));

    console.log(this.estimationSheet.getRange(this.inputRange).getValues());
    const guesses = this.timeConverter.matrixToMin(this.estimationSheet.getRange(this.inputRange).getValues());
    console.log(guesses);

    const eeArr = guesses.map(subtask => this.statistic.subtask.ee(subtask));
    const sdArr = guesses.map(subtask => this.statistic.subtask.sd(subtask));
    const ee = this.statistic.task.ee(eeArr);
    const sd = this.statistic.task.sd(sdArr);
    const e = ee + this.risk * sd; 
    const percentualRisk = ee > 0? Math.round((e - ee) / ee * 100): 0;

    const estimations = this.timeConverter.matrixToHAndMin(
      concatMatricesHorizontally(
        [...eeArr.map(ee => [ee]), [ee], [e]], 
        [...sdArr.map(sd => [sd]), [sd], [0]]
      )
    );

    this.estimationSheet.getRange(this.outputRange).setValues(estimations);
    this.estimationSheet.getRange(this.reportCell).setValue(this.toString(estimations, percentualRisk));
  }
}


// -------------------------------------------------------------------------------------------------

const RISK = 2;
const ESTIMATION_SHEET_NAME = "Estimation";
const INPUT_RANGE = "C4:H6";
const ESTIMATION_OUTPUT_RANGE = "I4:L8";
const REPORT_CELL = "I11";
const estimator = new PERTEstimator(RISK, ESTIMATION_SHEET_NAME, INPUT_RANGE, ESTIMATION_OUTPUT_RANGE, REPORT_CELL);
const estimationSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ESTIMATION_SHEET_NAME);
  
function computeTimeEstimation() {
  estimator.estimate();
}

function resetTimeEstimation() {
  const zeros = [
    [0, 0, 0, 0, 0, 0,],
    [0, 0, 0, 0, 0, 0,],
    [0, 0, 0, 0, 0, 0,],
  ]
  estimationSheet.getRange(INPUT_RANGE).setValues(zeros);
  estimator.estimate();
}