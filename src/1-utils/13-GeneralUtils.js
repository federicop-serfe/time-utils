class GeneralUtils {
  static concatMatricesHorizontally(A, B) {
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

  static round(num, lower = 0, upper = 5) {
    const delta = upper - lower;
    const digits = delta.toString().length;
    const scale = 10 ** digits;

    const base = scale * Math.floor(Math.abs(num) / scale);
    const remainder = Math.abs(num) % scale;

    const multiples = Math.round((remainder - lower) / delta);
    const nearest = lower + multiples * delta;
    return Math.sign(num) * (base + nearest);
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = GeneralUtils;
}
