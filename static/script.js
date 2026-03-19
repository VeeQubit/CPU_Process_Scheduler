const FULL_NAMES = {
  "FCFS":        "First Come First Serve",
  "SPN":         "Shortest Process Next",
  "SRTF":        "Shortest Remaining Time First",
  "RR":          "Round Robin",
  "Priority NP": "Priority (Non-Preemptive)",
  "Priority P":  "Priority (Preemptive)"
};

const PRESET_COLORS = [
  "#3b82f6","#10b981","#f59e0b","#ef4444",
  "#a78bfa","#ec4899","#06b6d4","#84cc16",
  "#f97316","#8b5cf6"
];

// ── State ────────────────────────────────────────────────
let processes       = [];
let processCounter  = 1;
let editingIndex    = null;
let globalResults   = {};
let bestAlgos       = [];
let modalErrorShown = false;
let algorithmsStarted = false;
let animEnabled       = true;
let currentMode       = "all";
let selectedSingleAlgo = "FCFS";
let selectedCompareA   = "FCFS";
let selectedCompareB   = "SRTF";

// ── Init ─────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(location.search);
  currentMode  = params.get("mode") || "all";
  applyMode();
  renderProcesses();
  updateRunButton();
  buildColorPresets();
  syncColorSwatch(document.getElementById("mColor").value);

  // Color input events
  document.getElementById("mColor").addEventListener("input", e => {
    syncColorSwatch(e.target.value);
    clearPresetActive();
  });

  // Close modal on backdrop click
  document.getElementById("processModal").addEventListener("click", e => {
    if (e.target === document.getElementById("processModal")) closeModal();
  });

  // Live validation
  ["mArrival","mBurst","mPriority"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input",  liveValidate);
    el.addEventListener("blur",   liveValidate);
  });

  // View algo button delegation
  document.addEventListener("click", e => {
    if (e.target.closest("#viewAlgorithmsBtn")) scrollToAlgorithms();
  });

  // Step number active state
  activateStep(1);
});

// ── Mode setup ───────────────────────────────────────────
function applyMode() {
  const badge    = document.getElementById("modeBadge");
  const label    = document.getElementById("modeLabel");
  const algoCfg  = document.getElementById("algoConfigCard");
  const algoCfgTitle = document.getElementById("algoConfigTitle");
  const algoCfgContent = document.getElementById("algoConfigContent");

  if (currentMode === "single") {
    badge.textContent = "Single Algorithm"; badge.className = "mode-badge single";
    label.textContent = "Single Algorithm";
    algoCfg.classList.remove("hidden");
    algoCfgTitle.textContent = "Algorithm";
    algoCfgContent.innerHTML = buildAlgoSelector("single");

  } else if (currentMode === "compare2") {
    badge.textContent = "Head-to-Head"; badge.className = "mode-badge compare";
    label.textContent = "Head-to-Head";
    algoCfg.classList.remove("hidden");
    algoCfgTitle.textContent = "Compare Two Algorithms";
    algoCfgContent.innerHTML = buildCompare2Selectors();

  } else {
    badge.textContent = "All Algorithms"; badge.className = "mode-badge compare";
    label.textContent = "Compare All";
    algoCfg.classList.add("hidden");
  }
}

function buildAlgoSelector(id) {
  return `<div class="algo-selector">` +
    Object.keys(FULL_NAMES).map(a =>
      `<button class="algo-sel-btn${a === selectedSingleAlgo ? ' active' : ''}"
        onclick="selectSingleAlgo('${a}',this)">${a}</button>`
    ).join("") + `</div>`;
}

function buildCompare2Selectors() {
  const row = (side, selected) =>
    `<div style="margin-bottom:14px">
      <div style="font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--text3);margin-bottom:8px">Algorithm ${side}</div>
      <div class="algo-selector" id="algoSelector${side}">` +
        Object.keys(FULL_NAMES).map(a =>
          `<button class="algo-sel-btn${a === selected ? ' active' : ''}"
            onclick="selectCompareAlgo('${side}','${a}',this)">${a}</button>`
        ).join("") + `</div></div>`;
  return row("A", selectedCompareA) + row("B", selectedCompareB);
}

function selectSingleAlgo(algo, btn) {
  selectedSingleAlgo = algo;
  btn.closest(".algo-selector").querySelectorAll(".algo-sel-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}
function selectCompareAlgo(side, algo, btn) {
  if (side === "A") selectedCompareA = algo;
  else              selectedCompareB = algo;
  btn.closest(".algo-selector").querySelectorAll(".algo-sel-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

// ── Animation toggle ─────────────────────────────────────
function toggleAnimation() {
  animEnabled = !animEnabled;
  const track = document.getElementById("animToggle");
  const label = document.getElementById("animLabel");
  track.classList.toggle("on", animEnabled);
  label.textContent = animEnabled ? "Animated" : "Static";
}

// ── Quantum stepper ──────────────────────────────────────
function adjustQuantum(delta) {
  const el = document.getElementById("quantum");
  const v  = Math.max(1, (parseInt(el.value) || 2) + delta);
  el.value = v;
}
function clampQuantum() {
  const el = document.getElementById("quantum");
  if (!el.value || parseInt(el.value) < 1) el.value = 1;
}

// ── Step indicators ──────────────────────────────────────
function activateStep(n) {
  document.querySelectorAll(".step-num").forEach((el, i) => {
    if (i + 1 < n) el.classList.add("done");
    else if (i + 1 === n) el.classList.add("active");
    else { el.classList.remove("active","done"); }
  });
}

// ── Color handling ───────────────────────────────────────
function buildColorPresets() {
  const container = document.getElementById("colorPresets");
  if (!container) return;
  container.innerHTML = PRESET_COLORS.map((c, i) =>
    `<div class="color-preset${i === 0 ? ' active' : ''}"
      style="background:${c}"
      onclick="selectPresetColor('${c}',this)" title="${c}"></div>`
  ).join("");
}
function selectPresetColor(color, el) {
  document.getElementById("mColor").value = color;
  syncColorSwatch(color);
  clearPresetActive();
  el.classList.add("active");
}
function clearPresetActive() {
  document.querySelectorAll(".color-preset").forEach(el => el.classList.remove("active"));
}
function syncColorSwatch(color) {
  const swatch = document.getElementById("modalColorSwatch");
  if (swatch) swatch.style.background = color;
}
function autoPickColor() {
  const idx   = processes.length % PRESET_COLORS.length;
  const color = PRESET_COLORS[idx];
  document.getElementById("mColor").value = color;
  syncColorSwatch(color);
  // Highlight preset
  clearPresetActive();
  const presets = document.querySelectorAll(".color-preset");
  if (presets[idx]) presets[idx].classList.add("active");
}
function getColor(pid) {
  return processes.find(p => p.pid === pid)?.color || "#888";
}

// ── Modal ────────────────────────────────────────────────
function openModal() {
  const modal = document.getElementById("processModal");
  modal.classList.remove("hidden");
  if (editingIndex === null) {
    resetModalFields();
    document.getElementById("modalTitle").textContent = "Add Process";
    autoPickColor();
  }
  clearModalErrors();
  // Focus first field
  setTimeout(() => document.getElementById("mArrival").focus(), 50);
}
function closeModal() {
  document.getElementById("processModal").classList.add("hidden");
  clearModalErrors();
  resetModalFields();
  editingIndex = null;
  document.getElementById("modalTitle").textContent = "Add Process";
}
function resetModalFields() {
  ["mArrival","mBurst","mPriority"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}
function clearModalErrors() {
  const err = document.getElementById("modalError");
  if (err) { err.classList.add("hidden"); err.innerHTML = ""; }
  ["mArrival","mBurst"].forEach(id => {
    const wrap = document.getElementById(id)?.closest(".field-input-wrap");
    if (wrap) wrap.classList.remove("has-error");
  });
  modalErrorShown = false;
}
function liveValidate() {
  if (!modalErrorShown) return;
  const a = document.getElementById("mArrival").value.trim();
  const b = document.getElementById("mBurst").value.trim();
  const err = document.getElementById("modalError");
  if (!err) return;
  if (a && b) { err.classList.add("hidden"); err.innerHTML = ""; return; }
  const missing = [];
  if (!a) missing.push("Arrival Time");
  if (!b) missing.push("Burst Time");
  err.innerHTML = "⚠ Required: " + missing.join(" and ");
  err.classList.remove("hidden");
}

function addProcess() {
  const aEl = document.getElementById("mArrival");
  const bEl = document.getElementById("mBurst");
  const pEl = document.getElementById("mPriority");
  const err = document.getElementById("modalError");

  // Clear errors
  [aEl, bEl].forEach(el => el?.closest(".field-input-wrap")?.classList.remove("has-error"));
  if (err) { err.classList.add("hidden"); err.innerHTML = ""; }

  const aStr = aEl.value.trim(), bStr = bEl.value.trim(), pStr = pEl.value.trim();
  const errors = [];

  if (!aStr) { errors.push("Arrival Time is required"); aEl.closest(".field-input-wrap").classList.add("has-error"); }
  if (!bStr) { errors.push("Burst Time is required");   bEl.closest(".field-input-wrap").classList.add("has-error"); }

  if (errors.length) {
    modalErrorShown = true;
    if (err) { err.innerHTML = "⚠ " + errors.join(" · "); err.classList.remove("hidden"); }
    return;
  }

  const arrival  = parseInt(aStr, 10);
  const burst    = parseInt(bStr, 10);
  const priority = pStr ? parseInt(pStr, 10) : 1;
  const errs2 = [];

  if (isNaN(arrival) || arrival < 0) { errs2.push("Arrival Time must be ≥ 0"); aEl.closest(".field-input-wrap").classList.add("has-error"); }
  if (isNaN(burst)   || burst   < 1) { errs2.push("Burst Time must be ≥ 1");   bEl.closest(".field-input-wrap").classList.add("has-error"); }
  if (pStr && (isNaN(priority) || priority < 1)) { errs2.push("Priority must be ≥ 1"); }

  if (errs2.length) {
    modalErrorShown = true;
    if (err) { err.innerHTML = "⚠ " + errs2.join(" · "); err.classList.remove("hidden"); }
    return;
  }

  const color = document.getElementById("mColor").value;

  if (editingIndex !== null) {
    processes[editingIndex] = { ...processes[editingIndex], arrival, burst, priority, color };
    editingIndex = null;
  } else {
    processes.push({ pid: "P" + processCounter, arrival, burst, priority, color });
    processCounter++;
  }

  closeModal();
  renderProcesses();
  updateRunButton();
}

function editProcess(index) {
  const p = processes[index];
  editingIndex = index;
  document.getElementById("mArrival").value  = p.arrival;
  document.getElementById("mBurst").value    = p.burst;
  document.getElementById("mPriority").value = p.priority;
  document.getElementById("mColor").value    = p.color;
  syncColorSwatch(p.color);
  clearPresetActive();
  const presetIdx = PRESET_COLORS.indexOf(p.color);
  if (presetIdx >= 0) {
    const presets = document.querySelectorAll(".color-preset");
    if (presets[presetIdx]) presets[presetIdx].classList.add("active");
  }
  document.getElementById("modalTitle").textContent = "Edit Process";
  openModal();
}

function deleteProcess(index) {
  if (editingIndex === index) { editingIndex = null; }
  else if (editingIndex !== null && index < editingIndex) editingIndex--;
  processes.splice(index, 1);
  renderProcesses();
  updateRunButton();
  clearResults();
}

function clearProcesses() {
  processes = []; processCounter = 1; editingIndex = null;
  renderProcesses(); updateRunButton(); clearResults();
}

// ── Render processes ─────────────────────────────────────
function renderProcesses() {
  const emptyEl    = document.getElementById("emptyProcesses");
  const cardsEl    = document.getElementById("processCards");
  const tableWrap  = document.getElementById("processTableWrap");
  const tbodyEl    = document.getElementById("processTableBody");
  const clearBtn   = document.getElementById("clearBtn");

  if (processes.length === 0) {
    emptyEl.classList.remove("hidden");
    cardsEl.classList.add("hidden");
    tableWrap.classList.add("hidden");
    if (clearBtn) clearBtn.style.display = "none";
    return;
  }

  emptyEl.classList.add("hidden");
  cardsEl.classList.remove("hidden");
  if (clearBtn) clearBtn.style.display = "";

  // Cards
  cardsEl.innerHTML = processes.map((p, i) => `
    <div class="proc-card" style="--pc-color:${p.color}" onclick="editProcess(${i})">
      <div class="proc-card-top">
        <div class="proc-card-pid" style="color:${p.color}">${p.pid}</div>
        <button class="proc-card-del" onclick="event.stopPropagation();deleteProcess(${i})" title="Remove ${p.pid}">
          <svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6"/></svg>
        </button>
      </div>
      <div class="proc-card-rows">
        <div class="proc-card-row">
          <span class="proc-card-row-label">Arrival</span>
          <span class="proc-card-row-val">${p.arrival}</span>
        </div>
        <div class="proc-card-row">
          <span class="proc-card-row-label">Burst</span>
          <span class="proc-card-row-val">${p.burst}</span>
        </div>
        <div class="proc-card-row">
          <span class="proc-card-row-label">Priority</span>
          <span class="proc-card-row-val">${p.priority}</span>
        </div>
      </div>
      <div class="proc-card-edit-hint">
        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        Click to edit
      </div>
    </div>`).join("");

  // Show table only when ≥ 2
  if (processes.length >= 2) {
    tableWrap.classList.remove("hidden");
    tbodyEl.innerHTML = processes.map((p, i) => `
      <tr>
        <td><span class="pid-badge" style="background:${p.color}">${p.pid}</span></td>
        <td>${p.arrival}</td>
        <td>${p.burst}</td>
        <td>${p.priority}</td>
        <td>
          <button class="btn-icon-only" onclick="deleteProcess(${i})" title="Remove">
            <svg viewBox="0 0 24 24"><path class="trash-path" d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6"/></svg>
          </button>
        </td>
      </tr>`).join("");
  } else {
    tableWrap.classList.add("hidden");
  }
}

function updateRunButton() {
  const btn    = document.getElementById("runBtn");
  const subEl  = document.getElementById("runBtnSub");
  const can    = processes.length >= 2;
  btn.disabled = !can;
  if (can) {
    btn.classList.add("run-pulse");
    if (subEl) subEl.textContent = `${processes.length} processes ready`;
  } else {
    btn.classList.remove("run-pulse");
    if (subEl) subEl.textContent = processes.length === 0
      ? "Add at least 2 processes"
      : "Add 1 more process";
  }
}

// ── Results ──────────────────────────────────────────────
function clearResults() {
  document.getElementById("emptyResults").classList.remove("hidden");
  document.getElementById("allResults").classList.add("hidden");
  document.getElementById("singleResults").classList.add("hidden");
  document.getElementById("compare2Results").classList.add("hidden");
  document.getElementById("resultsHeaderRight").style.display = "none";
  document.getElementById("resultsHeading").textContent = "Results";
  document.getElementById("resultsMeta").textContent = "Run the scheduler to see results";
  algorithmsStarted = false;
  activateStep(1);
}

// ── Run ──────────────────────────────────────────────────
function runScheduler() {
  const quantum = Math.max(1, parseInt(document.getElementById("quantum").value) || 2);
  if (processes.length < 2) { alert("Add at least 2 processes first."); return; }

  const btn = document.getElementById("runBtn");
  btn.disabled = true;
  btn.classList.remove("run-pulse");
  document.getElementById("runBtnSub").textContent = "Running…";

  fetch("/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ processes, quantum })
  })
  .then(r => r.json())
  .then(res => {
    globalResults = res.results;
    bestAlgos     = res.best;
    btn.disabled  = false;
    updateRunButton();
    activateStep(3);

    document.getElementById("emptyResults").classList.add("hidden");
    document.getElementById("resultsHeaderRight").style.display = "";

    algorithmsStarted = false;

    if (currentMode === "single")        renderSingleResult();
    else if (currentMode === "compare2") renderCompare2Result();
    else                                  renderAllResults();

    // Scroll to results
    setTimeout(() => {
      document.getElementById("stepResults").scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  })
  .catch(() => {
    btn.disabled = false;
    updateRunButton();
    alert("Backend error — check Flask is running.");
  });
}

// ══════════════════════════════════════════════════════════
//  ALL ALGORITHMS MODE
// ══════════════════════════════════════════════════════════
function renderAllResults() {
  document.getElementById("allResults").classList.remove("hidden");
  document.getElementById("singleResults").classList.add("hidden");
  document.getElementById("compare2Results").classList.add("hidden");

  // Reset
  const tbody  = document.getElementById("summaryBody");
  const bestEl = document.getElementById("bestText");
  tbody.innerHTML = "";
  bestEl.innerHTML = "";

  const viewBtn = document.getElementById("viewAlgorithmsBtn");
  if (viewBtn) viewBtn.style.display = "none";

  document.getElementById("algorithmsBlock").classList.add("algo-hidden");
  document.getElementById("algoButtons").innerHTML = "";
  document.getElementById("details").innerHTML = `<div class="results-empty" style="padding:48px 0"><div class="results-empty-icon"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1"><path d="M4 19V5M4 19h16" stroke-linecap="round"/><path d="M7 14l3-3 3 2 4-6" stroke-linecap="round"/></svg></div><div>Select an algorithm tab above</div></div>`;

  // Update heading
  document.getElementById("resultsHeading").textContent = "Results Summary";
  document.getElementById("resultsMeta").textContent = `${processes.length} processes · ${Object.keys(globalResults).length} algorithms`;

  buildSummary();
}

function getRankedAlgos() {
  return Object.keys(globalResults)
    .map(name => ({ name, m: globalResults[name].metrics }))
    .sort((a,b) => {
      if (b.m.cpu_util   !== a.m.cpu_util)   return b.m.cpu_util   - a.m.cpu_util;
      if (b.m.throughput !== a.m.throughput) return b.m.throughput - a.m.throughput;
      if (a.m.avg_tat    !== b.m.avg_tat)    return a.m.avg_tat    - b.m.avg_tat;
      if (a.m.avg_wt     !== b.m.avg_wt)     return a.m.avg_wt     - b.m.avg_wt;
      return a.m.avg_rt - b.m.avg_rt;
    });
}

function getRank(name) {
  const ranked = getRankedAlgos();
  let rank = 1, prevM = null;
  for (let i = 0; i < ranked.length; i++) {
    const { name: n, m } = ranked[i];
    if (!prevM || anyDiff(m, prevM)) rank = i + 1;
    if (n === name) return rank;
    prevM = m;
  }
  return rank;
}

function anyDiff(a, b) {
  return a.cpu_util !== b.cpu_util || a.throughput !== b.throughput ||
         a.avg_tat  !== b.avg_tat  || a.avg_wt     !== b.avg_wt    || a.avg_rt !== b.avg_rt;
}

// ── KPI strip: who wins each individual metric ──────────────
function buildKpiStrip() {
  const ranked = getRankedAlgos();
  const allNames = Object.keys(globalResults);
  // Find per-metric winners
  const bestWt  = allNames.reduce((a,b) => globalResults[a].metrics.avg_wt  <= globalResults[b].metrics.avg_wt  ? a : b);
  const bestTat = allNames.reduce((a,b) => globalResults[a].metrics.avg_tat <= globalResults[b].metrics.avg_tat ? a : b);
  const bestRt  = allNames.reduce((a,b) => globalResults[a].metrics.avg_rt  <= globalResults[b].metrics.avg_rt  ? a : b);
  const bestThr = allNames.reduce((a,b) => globalResults[a].metrics.throughput >= globalResults[b].metrics.throughput ? a : b);
  const bestCpu = allNames.reduce((a,b) => globalResults[a].metrics.cpu_util   >= globalResults[b].metrics.cpu_util   ? a : b);

  const kpis = [
    { label: "Avg Wait Time",    winner: bestWt,  val: globalResults[bestWt].metrics.avg_wt.toFixed(2),              color: "#60a5fa", suffix: "" },
    { label: "Avg Turnaround",   winner: bestTat, val: globalResults[bestTat].metrics.avg_tat.toFixed(2),            color: "#a78bfa", suffix: "" },
    { label: "Avg Response",     winner: bestRt,  val: globalResults[bestRt].metrics.avg_rt.toFixed(2),              color: "#22d3ee", suffix: "" },
    { label: "Throughput",       winner: bestThr, val: globalResults[bestThr].metrics.throughput.toFixed(2),         color: "#34d399", suffix: "/t" },
    { label: "CPU Utilization",  winner: bestCpu, val: (globalResults[bestCpu].metrics.cpu_util*100).toFixed(1),     color: "#f59e0b", suffix: "%" },
  ];

  return `<div class="perf-kpi-strip">${kpis.map(k => `
    <div class="kpi-card" style="--kpi-color:${k.color}">
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-winner-name">${k.winner}</div>
      <div class="kpi-winner-val">${k.val}${k.suffix}</div>
    </div>`).join("")}</div>`;
}

function buildSummary() {
  const tbody  = document.getElementById("summaryBody");
  const bestEl = document.getElementById("bestText");
  const ranked = getRankedAlgos();

  const allM   = ranked.map(r => r.m);
  const maxWt  = Math.max(...allM.map(m => m.avg_wt))     || 1;
  const maxTat = Math.max(...allM.map(m => m.avg_tat))    || 1;
  const maxRt  = Math.max(...allM.map(m => m.avg_rt))     || 1;
  const maxThr = Math.max(...allM.map(m => m.throughput)) || 1;

  let prevM = null, curRank = 1;

  ranked.forEach(function({ name, m }, i) {
    if (!prevM || anyDiff(m, prevM)) curRank = i + 1;
    prevM = m;
    const isBest = bestAlgos.includes(name);

    const wtPct  = maxWt  > 0 ? ((maxWt  - m.avg_wt)  / maxWt  * 100).toFixed(0) : 100;
    const tatPct = maxTat > 0 ? ((maxTat - m.avg_tat) / maxTat * 100).toFixed(0) : 100;
    const rtPct  = maxRt  > 0 ? ((maxRt  - m.avg_rt)  / maxRt  * 100).toFixed(0) : 100;
    const thrPct = maxThr > 0 ? (m.throughput / maxThr * 100).toFixed(0) : 100;
    const cpuPct = (m.cpu_util * 100).toFixed(0);

    function bar(pct, label) {
      return '<div class="score-cell">'
        + '<span class="score-val">' + label + '</span>'
        + '<div class="score-bar-wrap"><div class="score-bar" style="width:' + pct + '%"></div></div>'
        + '</div>';
    }

    const pillClass = isBest ? "rank-pill rank-pill-best" : "rank-pill";
    const badgeHTML = isBest
      ? '<span class="best-badge">&#9733; Best</span>'
      : '<span class="rank-badge rank-hidden">Rank ' + curRank + '</span>';

    const tr = document.createElement("tr");
    if (isBest) tr.className = "best-row";
    tr.innerHTML =
      '<td class="algo-name-cell">'
        + '<span class="' + pillClass + '" title="Rank ' + curRank + '">#' + curRank + '</span>'
        + '<span class="algo-label">' + name + '</span>'
        + badgeHTML
      + '</td>'
      + '<td>' + bar(wtPct,  m.avg_wt.toFixed(2))               + '</td>'
      + '<td>' + bar(tatPct, m.avg_tat.toFixed(2))              + '</td>'
      + '<td>' + bar(rtPct,  m.avg_rt.toFixed(2))               + '</td>'
      + '<td>' + bar(thrPct, m.throughput.toFixed(2))           + '</td>'
      + '<td>' + bar(cpuPct, (m.cpu_util*100).toFixed(1) + '%') + '</td>';

    tr.querySelectorAll("td").forEach(function(td) {
      td.style.opacity   = "0";
      td.style.transform = "translateY(6px)";
    });
    tbody.appendChild(tr);
  });

  // Best card only — no KPI strip
  const bm = globalResults[bestAlgos[0]].metrics;
  bestEl.innerHTML = buildBestCardHTML(bm);
  const card = bestEl.querySelector(".best-card");
  if (card) card.style.visibility = "hidden";

  requestAnimationFrame(async function() {
    await sleep(150);
    await animateLetters(document.getElementById("resultsHeading"), 55);
    await animateTableRows(tbody, 240);
    await animateBestRows(tbody, 650);

    tbody.querySelectorAll(".rank-badge").forEach(function(el, i) {
      setTimeout(function() { el.classList.add("rank-show"); }, i * 80);
    });

    if (card) { card.style.visibility = "visible"; await revealCard(card); }

    const vBtn = document.getElementById("viewAlgorithmsBtn");
    if (vBtn) { vBtn.style.display = "inline-flex"; vBtn.classList.add("fade-in-link"); }
  });
}

function buildBestCardHTML(bm) {
  const names  = bestAlgos;
  const isTie  = names.length > 1;
  const titleHTML = isTie
    ? '<div class="multi-title-list">' +
        names.map(function(n) { return '<span class="algo-name">' + n + '</span>'; }).join("") +
      '</div>'
    : FULL_NAMES[names[0]];
  const codeHTML = isTie ? "" : '<div class="best-code">' + names[0] + '</div>';
  const subText  = isTie ? "Multiple algorithms tied" : "Optimal Algorithm";
  const cpu      = (bm.cpu_util * 100).toFixed(1);

  return '<div class="best-card" style="margin-top:20px">'
    + '<div class="best-card-inner">'
      + '<div class="best-card-accent"></div>'
      + '<div class="best-card-body">'
        + '<div class="best-card-top">'
          + '<span class="best-chip">Best Overall</span>'
          + '<span class="best-sub">' + subText + '</span>'
        + '</div>'
        + '<div class="best-title">' + titleHTML + '</div>'
        + codeHTML
        + '<div class="best-reason-block">'
          + '<div class="reason-line"><span class="reason-rank">1</span><span>CPU Utilization: <strong>' + cpu + '%</strong></span></div>'
          + '<div class="reason-line"><span class="reason-rank">2</span><span>Throughput: <strong>' + bm.throughput.toFixed(2) + '</strong> processes/unit</span></div>'
          + '<div class="reason-line"><span class="reason-rank">3</span><span>Avg Turnaround Time: <strong>' + bm.avg_tat.toFixed(2) + '</strong></span></div>'
          + '<div class="reason-line"><span class="reason-rank">4</span><span>Avg Waiting Time: <strong>' + bm.avg_wt.toFixed(2) + '</strong></span></div>'
          + '<div class="reason-line"><span class="reason-rank">5</span><span>Avg Response Time: <strong>' + bm.avg_rt.toFixed(2) + '</strong></span></div>'
        + '</div>'
      + '</div>'
      + '<div class="best-card-metrics">'
        + '<div class="bm-item"><div class="bm-label">CPU Util</div><div class="bm-val good">' + cpu + '%</div></div>'
        + '<div class="bm-item"><div class="bm-label">Throughput</div><div class="bm-val good">' + bm.throughput.toFixed(2) + '</div></div>'
        + '<div class="bm-item"><div class="bm-label">Avg TAT</div><div class="bm-val">' + bm.avg_tat.toFixed(2) + '</div></div>'
        + '<div class="bm-item"><div class="bm-label">Avg WT</div><div class="bm-val">' + bm.avg_wt.toFixed(2) + '</div></div>'
        + '<div class="bm-item"><div class="bm-label">Avg RT</div><div class="bm-val">' + bm.avg_rt.toFixed(2) + '</div></div>'
      + '</div>'
    + '</div>'
  + '</div>';
}

async function scrollToAlgorithms() {
  if (algorithmsStarted) return;
  algorithmsStarted = true;

  const viewBtn = document.getElementById("viewAlgorithmsBtn");
  const block   = document.getElementById("algorithmsBlock");
  const heading = document.getElementById("algorithmsHeading");
  const tabBar  = document.getElementById("algoButtons");
  const detEl   = document.getElementById("details");

  if (viewBtn) viewBtn.style.display = "none";
  block.classList.remove("algo-hidden");
  block.style.visibility = "hidden";
  tabBar.style.opacity = "0";

  // Build tabs — ALL algorithms, best gets special style + rank pip
  const ranked = getRankedAlgos();
  tabBar.innerHTML = ranked.map(({ name }, i) => {
    const isBest = bestAlgos.includes(name);
    const rank   = i + 1;
    const pip    = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;
    return `<button class="algo-btn ${isBest ? "algo-best" : ""}"
      onclick="showDetails('${name}');setActiveTab('${name}')">
      <span class="btn-rank-pip">${pip}</span>${name}
    </button>`;
  }).join("");

  // Measure height before showing
  renderDetailContent(detEl, bestAlgos[0] || Object.keys(globalResults)[0], false);
  await new Promise(r => requestAnimationFrame(r));
  await new Promise(r => requestAnimationFrame(r));
  detEl.style.minHeight = detEl.offsetHeight + "px";
  detEl.innerHTML = `<div class="results-empty" style="padding:48px 0">
    <div class="results-empty-icon"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1"><path d="M4 19V5M4 19h16" stroke-linecap="round"/><path d="M7 14l3-3 3 2 4-6" stroke-linecap="round"/></svg></div>
    <div>Select an algorithm tab above</div></div>`;

  block.scrollIntoView({ behavior: "smooth", block: "start" });
  await waitScrollEnd();

  block.style.visibility = "visible";
  await animateLetters(heading, 65);

  tabBar.style.opacity = "1";
  const tabs = tabBar.querySelectorAll(".algo-btn");
  tabs.forEach((b, i) => setTimeout(() => b.classList.add("btn-show"), i * 60));
  await sleep(tabs.length * 60 + 200);
}

function showDetails(algo) {
  renderDetailContent(document.getElementById("details"), algo, animEnabled);
}
function setActiveTab(algo) {
  document.querySelectorAll(".algo-btn").forEach(b => b.classList.remove("algo-active"));
  const t = [...document.querySelectorAll(".algo-btn")].find(b => b.textContent.replace(/[🥇🥈🥉#\d]/g,'').trim() === algo);
  if (t) t.classList.add("algo-active");
}

// ══════════════════════════════════════════════════════════
//  SINGLE MODE
// ══════════════════════════════════════════════════════════
function renderSingleResult() {
  document.getElementById("allResults").classList.add("hidden");
  document.getElementById("singleResults").classList.remove("hidden");
  document.getElementById("compare2Results").classList.add("hidden");

  const algo = selectedSingleAlgo;
  document.getElementById("resultsHeading").textContent = `${algo} — ${FULL_NAMES[algo]}`;
  document.getElementById("resultsMeta").textContent = `${processes.length} processes`;

  renderDetailContent(document.getElementById("singleDetails"), algo, animEnabled);
}

// ══════════════════════════════════════════════════════════
//  COMPARE2 MODE
// ══════════════════════════════════════════════════════════
function renderCompare2Result() {
  document.getElementById("allResults").classList.add("hidden");
  document.getElementById("singleResults").classList.add("hidden");
  document.getElementById("compare2Results").classList.remove("hidden");

  const algoA = selectedCompareA, algoB = selectedCompareB;
  document.getElementById("resultsHeading").textContent = `${algoA} vs ${algoB}`;
  document.getElementById("resultsMeta").textContent = "Head-to-Head Comparison";

  const layout = document.getElementById("compareLayout");
  layout.innerHTML = "";

  const mkCol = (algo, colorVar) => {
    const col  = document.createElement("div");
    const card = document.createElement("div");
    card.className = "results-detail-card";
    col.innerHTML  = `<div style="font-size:12px;font-weight:800;font-family:var(--font-mono);color:${colorVar};margin-bottom:12px;display:flex;align-items:center;gap:8px"><div style="width:8px;height:8px;border-radius:50%;background:${colorVar}"></div>${algo} <span style="color:var(--text3);font-weight:400;font-size:11px">— ${FULL_NAMES[algo]}</span></div>`;
    col.appendChild(card);
    return { col, card };
  };

  const { col: colA, card: cardA } = mkCol(algoA, "#60a5fa");
  const { col: colB, card: cardB } = mkCol(algoB, "#c4b5fd");
  layout.appendChild(colA);
  layout.appendChild(colB);

  renderDetailContent(cardA, algoA, animEnabled);
  setTimeout(() => renderDetailContent(cardB, algoB, animEnabled), 200);

  // Diff table
  const diffWrap = document.createElement("div");
  diffWrap.style.gridColumn = "1/-1";
  diffWrap.innerHTML = buildDiffTable(algoA, algoB);
  layout.appendChild(diffWrap);
}

function buildDiffTable(a, b) {
  const ma = globalResults[a].metrics, mb = globalResults[b].metrics;
  const rows = [
    { label: "Avg Waiting Time",    va: ma.avg_wt,    vb: mb.avg_wt,    lower: true  },
    { label: "Avg Turnaround Time", va: ma.avg_tat,   vb: mb.avg_tat,   lower: true  },
    { label: "Avg Response Time",   va: ma.avg_rt,    vb: mb.avg_rt,    lower: true  },
    { label: "CPU Utilization",     va: ma.cpu_util,  vb: mb.cpu_util,  lower: false, pct: true },
    { label: "Throughput",          va: ma.throughput,vb: mb.throughput,lower: false },
  ];
  const body = rows.map(r => {
    const aWins = r.lower ? r.va < r.vb : r.va > r.vb;
    const bWins = r.lower ? r.vb < r.va : r.vb > r.va;
    const fmt   = v => r.pct ? (v*100).toFixed(1)+"%" : v.toFixed(2);
    const diff  = Math.abs(r.va - r.vb);
    return `<tr>
      <td style="color:var(--text2)">${r.label}</td>
      <td style="font-family:var(--font-mono)">${fmt(r.va)}${aWins ? '<span class="diff-badge diff-better">✓</span>' : ''}</td>
      <td style="font-family:var(--font-mono)">${fmt(r.vb)}${bWins ? '<span class="diff-badge diff-better">✓</span>' : ''}</td>
      <td style="font-family:var(--font-mono);color:var(--text3);font-size:12px">${r.pct ? (diff*100).toFixed(1)+"%" : diff.toFixed(2)}</td>
    </tr>`;
  }).join("");
  return `<div class="results-detail-card" style="margin-top:0">
    <div class="results-section-label">Metric Comparison</div>
    <table class="result-table">
      <thead><tr><th>Metric</th><th style="color:#93c5fd">${a}</th><th style="color:#c4b5fd">${b}</th><th>Difference</th></tr></thead>
      <tbody>${body}</tbody>
    </table>
  </div>`;
}

// ══════════════════════════════════════════════════════════
//  DETAIL RENDERER (shared)
// ══════════════════════════════════════════════════════════
function renderDetailContent(container, algo, animate) {
  const data    = globalResults[algo];
  const gantt   = data.gantt;
  const table   = data.table;
  const metrics = data.metrics;
  const rank    = getRank(algo);
  const id      = algo.replace(/[^a-zA-Z0-9]/g, "_");

  container.innerHTML = `
    <div class="gantt-header">
      <div class="gantt-title"><span class="gantt-dot"></span>Gantt Chart — ${algo}</div>
    </div>
    <div class="gantt-wrap"><div class="gantt" id="gantt_${id}"></div></div>

    <div class="result-layout">
      <div id="tbl_${id}" class="table-hidden">
        <table class="result-table">
          <thead><tr><th>PID</th><th>Arrival</th><th>Burst</th><th>Response</th><th>Waiting</th><th>Turnaround</th></tr></thead>
          <tbody>
            ${table.map(p => `<tr>
              <td><span class="pid-badge" style="background:${getColor(p.pid)}">${p.pid}</span></td>
              <td>${p.arrival}</td><td>${p.burst}</td><td>${p.rt}</td><td>${p.wt}</td><td>${p.tat}</td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>
      <div id="stats_${id}" class="stats-section">
        <div class="stat-box"><div class="stat-label-text">Rank</div><div class="stat-val rank-val">#${rank}</div></div>
        <div class="stat-box"><div class="stat-label-text">Avg Waiting</div><div class="stat-val">${metrics.avg_wt.toFixed(2)}</div></div>
        <div class="stat-box"><div class="stat-label-text">Avg Turnaround</div><div class="stat-val">${metrics.avg_tat.toFixed(2)}</div></div>
        <div class="stat-box"><div class="stat-label-text">Avg Response</div><div class="stat-val">${metrics.avg_rt.toFixed(2)}</div></div>
        <div class="stat-box"><div class="stat-label-text">Throughput</div><div class="stat-val">${metrics.throughput.toFixed(2)}</div></div>
        <div class="stat-box"><div class="stat-label-text">CPU Utilization</div><div class="stat-val">${(metrics.cpu_util*100).toFixed(1)}%</div></div>
      </div>
    </div>`;

  if (!gantt?.length) return;

  const ganttDiv      = document.getElementById(`gantt_${id}`);
  const tblEl         = document.getElementById(`tbl_${id}`);
  const statsEl       = document.getElementById(`stats_${id}`);
  const totalStart    = gantt[0][1];
  const totalEnd      = gantt[gantt.length-1][2];
  const totalTimeline = totalEnd - totalStart;
  const ANIM = animate ? 4000 : 0;

  gantt.forEach(([pid, start, end]) => {
    const width = end - start;
    const block = document.createElement("div");
    block.className = "block";
    block.style.backgroundColor = pid === "Idle" ? "#374151" : getColor(pid);
    block.style.flex = width;
    block.innerHTML  = `<div>${pid}</div><small>${start}–${end}</small>`;
    if (animate) {
      block.style.transformOrigin = "left";
      block.style.transform       = "scaleX(0)";
      block.style.opacity         = "0";
      const dur   = (width / totalTimeline) * ANIM;
      const delay = ((start - totalStart) / totalTimeline) * ANIM;
      setTimeout(() => {
        block.style.transition = `transform ${dur}ms cubic-bezier(.2,.9,.2,1), opacity 350ms ease`;
        block.style.transform  = "scaleX(1)";
        block.style.opacity    = "1";
      }, delay);
    }
    ganttDiv.appendChild(block);
  });

  setTimeout(() => { tblEl.classList.remove("table-hidden"); tblEl.classList.add("table-show"); }, ANIM + 120);
  setTimeout(() => { statsEl.classList.add("stats-show"); statsEl.style.opacity = "1"; statsEl.style.transform = "translateX(0)"; }, ANIM + 620);
}

// ══════════════════════════════════════════════════════════
//  ANIMATION HELPERS
// ══════════════════════════════════════════════════════════
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function waitScrollEnd(timeout = 900) {
  return new Promise(resolve => {
    let last = window.scrollY, same = 0, t = performance.now();
    const check = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 1) same++;
      else same = 0;
      last = y;
      if (same >= 5 || performance.now() - t > timeout) { resolve(); return; }
      requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  });
}

function animateLetters(el, delay = 50) {
  if (!el) return Promise.resolve();
  const text = el.getAttribute("data-text") || el.textContent;
  el.setAttribute("data-text", text);
  el.textContent = "";
  el.classList.add("typewriter");
  const frag = document.createDocumentFragment();
  [...text].forEach((ch, i) => {
    const span = document.createElement("span");
    span.textContent = ch === " " ? "\u00A0" : ch;
    span.style.animationDelay = `${i * delay}ms`;
    frag.appendChild(span);
  });
  el.appendChild(frag);
  return sleep(text.length * delay + 220);
}

async function animateTableRows(tbody, rowDelay = 200) {
  for (const r of Array.from(tbody.querySelectorAll("tr"))) {
    r.classList.add("row-reveal");
    await sleep(rowDelay);
  }
}

async function animateBestRows(tbody, pulseDelay = 600) {
  for (const r of Array.from(tbody.querySelectorAll("tr.best-row"))) {
    r.querySelectorAll("td").forEach(td => td.classList.add("best-show"));
    r.classList.add("best-pulse");
    await sleep(pulseDelay);
    r.classList.remove("best-pulse");
  }
}

async function animateRankBadges(tbody, delay = 170) {
  for (const b of Array.from(tbody.querySelectorAll(".rank-badge"))) {
    b.classList.add("rank-show");
    await sleep(delay);
  }
}

async function revealCard(card) {
  if (!card) return;
  await new Promise(r => requestAnimationFrame(r));
  await new Promise(r => requestAnimationFrame(r));
  card.classList.add("best-show");
  await sleep(600);
}