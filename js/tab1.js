/**
 * tab1.js — Klausurnote aus Punkten
 *
 * Live calculation of exam grade from raw points.
 * Outputs: percentage, MSS points, Gymnasium grade, Realschule grade.
 */
const Tab1 = (() => {

  // DOM refs – set in init()
  let elMax, elAchieved, errMax, errAchieved;
  let elPctBar, elPctDisplay;
  let elResults;
  let elTableRows, elTableToggle, elTableBody;

  // ── Init ────────────────────────────────────────────────────────────────────

  function init() {
    elMax         = document.getElementById('t1-max-points');
    elAchieved    = document.getElementById('t1-achieved-points');
    errMax        = document.getElementById('t1-err-max');
    errAchieved   = document.getElementById('t1-err-achieved');
    elPctBar      = document.getElementById('t1-pct-bar');
    elPctDisplay  = document.getElementById('t1-pct-display');
    elResults     = document.getElementById('t1-results');
    elTableRows   = document.getElementById('t1-table-rows');
    elTableToggle = document.getElementById('t1-table-toggle');
    elTableBody   = document.getElementById('t1-table-body');

    elMax.addEventListener('input', onInput);
    elAchieved.addEventListener('input', onInput);

    buildReferenceTable();
    setupTableToggle();
  }

  // ── Input handler ────────────────────────────────────────────────────────────

  function onInput() {
    if (validate()) {
      calculate();
    } else {
      resetDisplay();
    }
  }

  // ── Validation ───────────────────────────────────────────────────────────────

  function validate() {
    const maxStr = elMax.value.trim();
    const achStr = elAchieved.value.trim();
    const maxVal = parseFloat(maxStr);
    const achVal = parseFloat(achStr);
    let ok = true;

    // Validate max
    if (maxStr === '') {
      hideErr(errMax);
    } else if (isNaN(maxVal) || maxVal <= 0) {
      showErr(errMax, 'Bitte einen positiven Wert eingeben.');
      ok = false;
    } else {
      hideErr(errMax);
    }

    // Validate achieved
    if (achStr === '') {
      hideErr(errAchieved);
    } else if (isNaN(achVal) || achVal < 0) {
      showErr(errAchieved, 'Wert muss \u2265\u20090 sein.');
      ok = false;
    } else if (maxStr !== '' && !isNaN(maxVal) && maxVal > 0 && achVal > maxVal) {
      showErr(errAchieved, 'Überschreitet die Maximalzahl.');
      ok = false;
    } else {
      hideErr(errAchieved);
    }

    // Both fields must be filled
    if (maxStr === '' || achStr === '') ok = false;

    return ok;
  }

  // ── Calculation ──────────────────────────────────────────────────────────────

  function calculate() {
    const maxVal = parseFloat(elMax.value);
    const achVal = parseFloat(elAchieved.value);
    const pct    = (achVal / maxVal) * 100;

    const mss      = GradeCalc.percentToMSS(pct);
    const gymStr   = GradeCalc.percentToGradeGym(pct);
    const realStr  = GradeCalc.percentToGradeReal(pct);
    const dec      = GradeCalc.gradeStrToDecimal(gymStr);
    const cc       = GradeCalc.mssColorClass(mss);

    updateBar(pct, cc);
    renderResults(pct, mss, gymStr, realStr, dec, cc);
    highlightTableRow(mss);
  }

  // ── Percentage Bar ───────────────────────────────────────────────────────────

  function updateBar(pct, cc) {
    const w = Math.max(0, Math.min(100, pct));
    elPctBar.style.width = `${w}%`;
    elPctBar.className   = `pct-bar-fill ${cc}`;
    elPctDisplay.textContent = formatPct(pct, 1);
  }

  // ── Results HTML ─────────────────────────────────────────────────────────────

  function renderResults(pct, mss, gymStr, realStr, dec, cc) {
    const isFail   = pct < 40;
    const isBorder = pct >= 40 && pct < 50;
    const badge    = isFail
      ? '<span class="s-badge badge-fail">Nicht bestanden</span>'
      : isBorder
        ? '<span class="s-badge badge-border">Grenzbereich (Oberstufe)</span>'
        : '<span class="s-badge badge-pass">Bestanden</span>';

    elResults.innerHTML = `
      <div class="anim-in">
        <div class="result-trio">
          <div class="result-block">
            <span class="result-lbl">MSS-Punkte</span>
            <span class="result-num ${cc}">${mss}</span>
            <span class="result-hint">Oberstufe</span>
          </div>
          <div class="result-sep"></div>
          <div class="result-block">
            <span class="result-lbl">Note (Gymnasium)</span>
            <span class="result-num ${cc}">${gymStr}</span>
            <span class="result-hint">Tendenz &middot; ${dec.toFixed(2)}</span>
          </div>
          <div class="result-sep"></div>
          <div class="result-block">
            <span class="result-lbl">Note (Real./Haupts.)</span>
            <span class="result-num ${cc}">${realStr}</span>
            <span class="result-hint">ohne Tendenz</span>
          </div>
        </div>
        <div class="result-pct-row">
          <span class="result-pct-val">${formatPct(pct, 2)}</span>
          <span class="result-pct-label">der Maximalpunktzahl</span>
          ${badge}
        </div>
      </div>
    `;
  }

  // ── Reset ─────────────────────────────────────────────────────────────────────

  function resetDisplay() {
    elPctBar.style.width  = '0%';
    elPctBar.className    = 'pct-bar-fill';
    elPctDisplay.textContent = '\u2013';

    elResults.innerHTML = `
      <div class="result-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 11l3 3L22 4"/>
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
        </svg>
        <p>Gib Punkte ein, um die Note zu berechnen.</p>
      </div>
    `;

    elTableRows.querySelectorAll('tr.row-active').forEach(r => r.classList.remove('row-active'));
  }

  // ── Reference Table ───────────────────────────────────────────────────────────

  function buildReferenceTable() {
    elTableRows.innerHTML = GradeCalc.getReferenceTable().map(d => `
      <tr data-mss="${d.mss}" class="${d.colorClass}">
        <td><span class="mss-badge ${d.colorClass}">${d.mss}</span></td>
        <td>${d.minPercent}&thinsp;%</td>
        <td>${d.maxPercent}&thinsp;%</td>
        <td><span class="grade-pill ${d.colorClass}">${d.gymGrade}</span></td>
        <td><span class="grade-pill ${d.colorClass}">${d.realGrade}</span></td>
      </tr>
    `).join('');
  }

  function highlightTableRow(mss) {
    elTableRows.querySelectorAll('tr').forEach(r => r.classList.remove('row-active'));
    const tr = elTableRows.querySelector(`tr[data-mss="${mss}"]`);
    if (tr) {
      tr.classList.add('row-active');
      // Scroll into view only if table is open
      if (elTableToggle.getAttribute('aria-expanded') === 'true') {
        tr.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }

  // ── Collapsible Table Toggle ──────────────────────────────────────────────────

  function setupTableToggle() {
    const toggle = () => {
      const expanded = elTableToggle.getAttribute('aria-expanded') === 'true';
      elTableToggle.setAttribute('aria-expanded', String(!expanded));
      elTableBody.classList.toggle('collapsed', expanded);
    };
    elTableToggle.addEventListener('click', toggle);
    elTableToggle.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  function showErr(el, msg) { el.textContent = msg; el.classList.remove('hidden'); }
  function hideErr(el)       { el.classList.add('hidden'); }
  function formatPct(val, decimals) {
    return val.toFixed(decimals).replace('.', ',') + '\u2009%';
  }

  return { init };
})();
