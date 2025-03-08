class MatrixUtils {
  static concatHorizontally(A, B) {
    if (!Array.isArray(A) || !Array.isArray(A[0])) {
      throw new Error("First argument is not a matrix");
    }
    if (!Array.isArray(B) || !Array.isArray(B[0])) {
      throw new Error("Second argument is not a matrix");
    }
    if (A.length !== B.length) {
      throw new Error("Matrices have different number of rows");
    }
    return A.map((row, idx) => row.concat(B[idx]));
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = MatrixUtils;
}
