/**
 * gradeCalc.js
 * German school grade calculation utilities.
 * Handles MSS points (0–15) and classic grades (1–6) with Tendenzen.
 *
 * Exposed as global: GradeCalc
 */
const GradeCalc = (() => {

  // ── Lookup Tables ───────────────────────────────────────────────────────────

  /**
   * [minPercent, mssPoints] — sorted descending by percent.
   * Standard table for Gymnasiale Oberstufe (MSS / RLP).
   */
  const PCT_TO_MSS = [
    [95, 15], [90, 14], [85, 13],
    [80, 12], [75, 11], [70, 10],
    [65,  9], [60,  8], [55,  7],
    [50,  6], [45,  5], [40,  4],
    [34,  3], [27,  2], [20,  1],
    [ 0,  0],
  ];

  /** [minPercent, gradeString] — Gymnasium with Tendenzen */
  const PCT_TO_GYM = [
    [95, '1+'], [90, '1'], [85, '1\u2212'],
    [80, '2+'], [75, '2'], [70, '2\u2212'],
    [65, '3+'], [60, '3'], [55, '3\u2212'],
    [50, '4+'], [45, '4'], [40, '4\u2212'],
    [34, '5+'], [27, '5'], [20, '5\u2212'],
    [ 0, '6'],
  ];

  /** [minPercent, gradeString] — Realschule / Hauptschule */
  const PCT_TO_REAL = [
    [87.5, '1'], [75, '2'], [62.5, '3'],
    [50,   '4'], [25, '5'], [  0,  '6'],
  ];

  /** MSS integer → grade string */
  const MSS_TO_STR = {
    15: '1+', 14: '1',  13: '1\u2212',
    12: '2+', 11: '2',  10: '2\u2212',
     9: '3+',  8: '3',   7: '3\u2212',
     6: '4+',  5: '4',   4: '4\u2212',
     3: '5+',  2: '5',   1: '5\u2212',
     0: '6',
  };

  /** Grade string → decimal value */
  const STR_TO_DEC = {
    '1+': 0.7,  '1': 1.0,  '1\u2212': 1.3,
    '2+': 1.7,  '2': 2.0,  '2\u2212': 2.3,
    '3+': 2.7,  '3': 3.0,  '3\u2212': 3.3,
    '4+': 3.7,  '4': 4.0,  '4\u2212': 4.3,
    '5+': 4.7,  '5': 5.0,  '5\u2212': 5.3,
    '6': 6.0,
  };

  // ── Private helper ──────────────────────────────────────────────────────────

  function lookup(table, pct) {
    for (const [min, val] of table) {
      if (pct >= min) return val;
    }
    return table[table.length - 1][1];
  }

  // ── Public API ──────────────────────────────────────────────────────────────
  return {

    /** percentage (0–100) → MSS points (0–15) */
    percentToMSS(pct) { return lookup(PCT_TO_MSS, pct); },

    /** percentage → Gymnasium grade string, e.g. '2+', '3−' */
    percentToGradeGym(pct) { return lookup(PCT_TO_GYM, pct); },

    /** percentage → Realschule/Hauptschule grade string */
    percentToGradeReal(pct) { return lookup(PCT_TO_REAL, pct); },

    /** MSS integer (0–15) → grade string */
    mssToGradeStr(mss) { return MSS_TO_STR[Math.round(mss)] ?? '6'; },

    /**
     * MSS (0–15) → decimal grade (1.0–6.0), linear.
     * Formula: 6 − (mss / 15) × 5
     * 15 → 1.0 · 0 → 6.0
     */
    mssToDecimal(mss) {
      return 6 - (mss / 15) * 5;
    },

    /**
     * Decimal grade (1.0–6.0) → nearest MSS integer (0–15).
     * Inverse of mssToDecimal: round((6 − grade) × 3)
     */
    decimalToMSS(grade) {
      return Math.max(0, Math.min(15, Math.round((6 - grade) * 3)));
    },

    /** Grade string → decimal value */
    gradeStrToDecimal(str) {
      return STR_TO_DEC[str] ?? 6.0;
    },

    /** Decimal grade → nearest grade string */
    decimalToGradeStr(grade) {
      let best = '6', minDiff = Infinity;
      for (const [str, val] of Object.entries(STR_TO_DEC)) {
        const d = Math.abs(grade - val);
        if (d < minDiff) { minDiff = d; best = str; }
      }
      return best;
    },

    /**
     * Color class for a given MSS value.
     * Returns: 'grade-excellent' | 'grade-good' | 'grade-sufficient' | 'grade-poor'
     */
    mssColorClass(mss) {
      if (mss >= 10) return 'grade-excellent';  // 1+ … 2−
      if (mss >= 7)  return 'grade-good';        // 3+ … 3−
      if (mss >= 4)  return 'grade-sufficient';  // 4+ … 4−  (passing)
      return 'grade-poor';                        // 5+ … 6   (failing)
    },

    /** Color class for a decimal grade. */
    decimalColorClass(grade) {
      if (grade <= 2.3) return 'grade-excellent';
      if (grade <= 3.3) return 'grade-good';
      if (grade <= 4.3) return 'grade-sufficient';
      return 'grade-poor';
    },

    /**
     * Build reference table rows for all MSS levels (15 → 0).
     * Each entry: { mss, minPercent, maxPercent, gymGrade, realGrade, colorClass }
     */
    getReferenceTable() {
      return PCT_TO_MSS.map(([minPct, mss], i) => ({
        mss,
        minPercent: minPct,
        maxPercent: i === 0
          ? 100
          : parseFloat((PCT_TO_MSS[i - 1][0] - 0.1).toFixed(1)),
        gymGrade:   MSS_TO_STR[mss],
        realGrade:  lookup(PCT_TO_REAL, minPct),
        colorClass: this.mssColorClass(mss),
      }));
    },
  };
})();
