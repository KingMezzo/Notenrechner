/**
 * tab2.js — Gesamtnote aus gewichteten Teilnoten
 *
 * Dynamic list of grade rows, calculates a weighted average.
 */
const Tab2 = (() => {

  // DOM refs
  let elRowsContainer;
  let elAddBtn;
  let elWeightBar, elWeightDisplay, elWeightStatus, elWeightStatusTxt;
  let elResults;

  let rowIdCounter = 0;

  // State
  // Array of { id, name, type (grade|mss), value (decimal or mss), weight (percent) }
  let rowsData = [];

  // ── Init ────────────────────────────────────────────────────────────────────

  function init() {
    elRowsContainer   = document.getElementById('t2-rows');
    elAddBtn          = document.getElementById('t2-add-btn');
    elWeightBar       = document.getElementById('t2-weight-bar');
    elWeightDisplay   = document.getElementById('t2-weight-display');
    elWeightStatus    = document.getElementById('t2-weight-status');
    elWeightStatusTxt = document.getElementById('t2-weight-status-txt');
    elResults         = document.getElementById('t2-results');

    elAddBtn.addEventListener('click', () => addRow());

    // Add initial rows
    addRow('Klausur 1', 'mss', '', '30');
    addRow('Klausur 2', 'mss', '', '30');
    addRow('Mündlich', 'mss', '', '40');

    updateCalculation();
  }

  // ── Row Management ───────────────────────────────────────────────────────────

  function addRow(nameStr = '', typeStr = 'mss', valStr = '', wtStr = '') {
    const id = `row-${rowIdCounter++}`;
    rowsData.push({ id, name: nameStr, type: typeStr, value: valStr, weight: wtStr });
    
    const rowEl = document.createElement('div');
    rowEl.className = 'gr-row';
    rowEl.id = id;
    rowEl.innerHTML = `
      <div class="gr-cell">
        <input type="text" class="inp inp-name" placeholder="z. B. Klausur 1" value="${nameStr}" aria-label="Bezeichnung">
      </div>
      <div class="gr-cell">
        <select class="inp inp-type" aria-label="Notentyp">
          <option value="mss" ${typeStr === 'mss' ? 'selected' : ''}>MSS (0-15)</option>
          <option value="grade" ${typeStr === 'grade' ? 'selected' : ''}>Note (1-6)</option>
        </select>
      </div>
      <div class="gr-cell">
        <input type="number" class="inp inp-val" placeholder="Wert" step="0.1" value="${valStr}" aria-label="Note oder Punkte">
        <span class="row-err hidden"></span>
      </div>
      <div class="gr-cell">
        <div class="gr-wt-wrap">
          <input type="number" class="inp inp-wt" placeholder="Gewicht" min="0" max="100" step="1" value="${wtStr}" aria-label="Gewichtung in Prozent">
          <span class="inp-unit">%</span>
        </div>
        <span class="row-err hidden"></span>
      </div>
      <div class="gr-cell">
        <button class="del-btn" type="button" aria-label="Zeile löschen" title="Löschen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;

    // Event listeners
    const inputs = rowEl.querySelectorAll('.inp');
    inputs.forEach(inp => inp.addEventListener('input', () => {
      syncRowData(id, rowEl);
      updateCalculation();
    }));
    rowEl.querySelector('.del-btn').addEventListener('click', () => removeRow(id, rowEl));

    elRowsContainer.appendChild(rowEl);
    
    // Trigger animation
    requestAnimationFrame(() => rowEl.classList.add('gr-visible'));
    
    updateCalculation();
  }

  function removeRow(id, el) {
    el.classList.remove('gr-visible');
    el.classList.add('gr-removing');
    
    setTimeout(() => {
      el.remove();
      rowsData = rowsData.filter(r => r.id !== id);
      updateCalculation();
    }, 250);
  }

  function syncRowData(id, el) {
    const r = rowsData.find(x => x.id === id);
    if (!r) return;
    r.name   = el.querySelector('.inp-name').value;
    r.type   = el.querySelector('.inp-type').value;
    r.value  = el.querySelector('.inp-val').value;
    r.weight = el.querySelector('.inp-wt').value;
  }

  // ── Calculation ──────────────────────────────────────────────────────────────

  function updateCalculation() {
    let sumWt = 0;
    let sumWeightedGrade = 0; // Everything internally converted to decimal grades (1-6)
    let validRows = 0;

    // First validate rows and calculate totals
    rowsData.forEach(r => {
      const el = document.getElementById(r.id);
      if (!el) return;
      
      const errValEl = el.querySelectorAll('.row-err')[0];
      const errWtEl  = el.querySelectorAll('.row-err')[1];
      
      let vOk = true;
      let wOk = true;

      const vStr = r.value.trim();
      const wStr = r.weight.trim();
      
      // We skip empty rows from calculation, but they don't show errors unless partially filled
      if (vStr === '' && wStr === '') {
        hideErr(errValEl); hideErr(errWtEl);
        return;
      }

      const v = parseFloat(vStr.replace(',', '.'));
      const w = parseFloat(wStr.replace(',', '.'));

      // Validate value
      if (vStr === '') {
        showErr(errValEl, 'Pflichtfeld'); vOk = false;
      } else if (isNaN(v)) {
        showErr(errValEl, 'Ungültig'); vOk = false;
      } else if (r.type === 'mss' && (v < 0 || v > 15)) {
        showErr(errValEl, '0–15 erlaubt'); vOk = false;
      } else if (r.type === 'grade' && (v < 1 || v > 6)) {
        showErr(errValEl, '1.0–6.0 erlaubt'); vOk = false;
      } else {
        hideErr(errValEl);
      }

      // Validate weight
      if (wStr === '') {
        showErr(errWtEl, 'Pflichtfeld'); wOk = false;
      } else if (isNaN(w) || w < 0) {
        showErr(errWtEl, 'Ungültig'); wOk = false;
      } else {
        hideErr(errWtEl);
      }

      if (vOk && wOk) {
        validRows++;
        sumWt += w;
        
        let decGrade = v;
        if (r.type === 'mss') {
          decGrade = GradeCalc.mssToDecimal(v);
        }
        sumWeightedGrade += (decGrade * w);
      }
    });

    updateWeightBar(sumWt);

    if (validRows === 0 || sumWt === 0) {
      resetResults();
    } else {
      // Calculate final average based on total weight entered so far
      // Normalizing to the current weight sum (so if they entered 50%, the average is over that 50%)
      const finalDecimal = sumWeightedGrade / sumWt;
      renderResults(finalDecimal, sumWt);
    }
  }

  // ── Weight Bar ───────────────────────────────────────────────────────────────

  function updateWeightBar(sum) {
    elWeightDisplay.textContent = sum.toFixed(0) + ' %';
    
    // Visual bar
    const w = Math.min(100, Math.max(0, sum));
    elWeightBar.style.width = w + '%';

    // Status classes
    elWeightStatus.className = 'wt-status';
    if (Math.abs(sum - 100) < 0.01) {
      elWeightStatus.classList.add('status-ok');
      elWeightStatusTxt.textContent = 'Gewichtung beträgt exakt 100 %.';
      elWeightBar.className = 'wt-bar-fill grade-good';
      elWeightStatus.querySelector('.wt-status-icon').innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (sum < 100) {
      elWeightStatus.classList.add('status-warn');
      elWeightStatusTxt.textContent = `Gewichtung liegt bei ${sum.toFixed(0)} % (100 % empfohlen).`;
      elWeightBar.className = 'wt-bar-fill grade-sufficient';
      elWeightStatus.querySelector('.wt-status-icon').textContent = '⚠️';
    } else {
      elWeightStatus.classList.add('status-err');
      elWeightStatusTxt.textContent = `Gewichtung überschreitet 100 % (aktuell ${sum.toFixed(0)} %).`;
      elWeightBar.className = 'wt-bar-fill grade-poor';
      elWeightStatus.querySelector('.wt-status-icon').textContent = '⚠️';
    }
  }

  // ── Results ──────────────────────────────────────────────────────────────────

  function renderResults(decimalResult, sumWt) {
    const mss = GradeCalc.decimalToMSS(decimalResult);
    const gymStr = GradeCalc.decimalToGradeStr(decimalResult);
    const cc = GradeCalc.decimalColorClass(decimalResult);

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
            <span class="result-lbl">Note (klassisch)</span>
            <span class="result-num ${cc}">${decimalResult.toFixed(2)}</span>
            <span class="result-hint">Tendenz: ${gymStr}</span>
          </div>
        </div>
      </div>
    `;
  }

  function resetResults() {
    elResults.innerHTML = `
      <div class="result-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 3h7v7H3z"/><path d="M14 3h7v7h-7z"/>
          <path d="M14 14h7v7h-7z"/><path d="M3 14h7v7H3z"/>
        </svg>
        <p>Füge mindestens eine gültige Teilnote hinzu.</p>
      </div>
    `;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function showErr(el, msg) { el.textContent = msg; el.classList.remove('hidden'); }
  function hideErr(el)       { el.classList.add('hidden'); }

  return { init };
})();
