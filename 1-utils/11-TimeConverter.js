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
    return matrixInHAndMin.map((row, i) => {
      let aux = [];
      for (let j = 0; j < row.length; j += 2) {
        aux.push(this.toMin(row[j], row[j + 1]));
      }
      return aux;
    });
  }

  matrixToHAndMin(matrixInMin) {
    return matrixInMin.map((row) =>
      row
        .map((val) => this.toHAndMin(val))
        .reduce((acc, curr) => [...acc, ...curr])
    );
  }
}
