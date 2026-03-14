/* ============================================================
   CPU SCHEDULER — script.js  (full rewrite)
   ============================================================ */

// ── Constants ──────────────────────────────────────────────
const FULL_NAMES = {
  "FCFS":        "First Come First Serve",
  "SPN":         "Shortest Process Next",
  "SRTF":        "Shortest Remaining Time First",
  "RR":          "Round Robin",
  "Priority NP": "Priority (Non-Preemptive)",
  "Priority P":  "Priority (Preemptive)"
};

// ── State ───────────────────────────────────────────────────
let processes       = [];
let processCounter  = 1;
let editingIndex    = null;
let globalResults   = {};
let bestAlgos       = [];
let modalErrorShown = false;
let algorithmsStarted = false;
let animEnabled     = true;
let currentMode     = "all";        // "all" | "single" | "compare2"
let selectedSingleAlgo  = "FCFS";
let selectedCompareA    = "FCFS";
let selectedCompareB    = "SRTF";

// ── Init ────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Read mode from URL
  const params = new URLSearchParams(location.search);
  currentMode  = params.get("mode") || "all";
  applyMode();

  renderProcesses();
  updateRunButton();

  // Color preview sync
  const preview = document.getElementById("colorPreview");
  const colorIn = document.getElementById("mColor");
  if (preview && colorIn) {
    preview.style.background = colorIn.value;
    colorIn.addEventListener("input", () => { preview.style.background = colorIn.value; });
  }

  // Close modal on backdrop click
  const modal = document.getElementById("processModal");
  const mc    = modal.querySelector(".modal-content");
  modal.addEventListener("click", e => { if (!mc.contains(e.target)) clearModalErrors(); });

  // Live validation
  ["mArrival","mBurst","mPriority"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", () => liveValidate());
    el.addEventListener("blur",  () => liveValidate());
  });

  // View algorithms button
  document.addEventListener("click", e => {
    if (e.target.closest("#viewAlgorithmsBtn")) scrollToAlgorithms();
  });
});

function applyMode() {
  const badgeEl    = document.getElementById("modeBadge");
  const labelEl    = document.getElementById("modeLabel");
  const titleEl    = document.getElementById("pageTitle");
  const subEl      = document.getElementById("pageSubtitle");
  const singleCard = document.getElementById("singleAlgoCard");
  const c2Card     = document.getElementById("compare2Card");

  if (currentMode === "single") {
    if (badgeEl)    { badgeEl.textContent = "Single Algorithm"; badgeEl.className = "mode-badge single"; }
    if (labelEl)    labelEl.textContent = "Single Algorithm";
    if (titleEl)    titleEl.textContent = "Single Algorithm Simulator";
    if (subEl)      subEl.textContent   = "Focus on one algorithm — study its Gantt chart and metrics in depth";
    if (singleCard) singleCard.classList.remove("hidden");
    if (c2Card)     c2Card.classList.add("hidden");

  } else if (currentMode === "compare2") {
    if (badgeEl)    { badgeEl.textContent = "Head-to-Head"; badgeEl.className = "mode-badge compare"; }
    if (labelEl)    labelEl.textContent = "Head-to-Head";
    if (titleEl)    titleEl.textContent = "Head-to-Head Algorithm Compare";
    if (subEl)      subEl.textContent   = "Compare two algorithms side by side with Gantt charts and metric diffs";
    if (singleCard) singleCard.classList.add("hidden");
    if (c2Card)     c2Card.classList.remove("hidden");

  } else {
    if (badgeEl)    { badgeEl.textContent = "All Algorithms"; badgeEl.className = "mode-badge compare"; }
    if (labelEl)    labelEl.textContent = "Compare All";
    if (titleEl)    titleEl.textContent = "CPU Scheduling Simulator";
    if (subEl)      subEl.textContent   = "Run all 6 algorithms and get a ranked performance comparison";
    if (singleCard) singleCard.classList.add("hidden");
    if (c2Card)     c2Card.classList.add("hidden");
  }
}

// ── Animation toggle ─────────────────────────────────────
function toggleAnimation() {
  animEnabled = !animEnabled;
  const track = document.getElementById("animToggle");
  const label = document.getElementById("animLabel");
  if (animEnabled) {
    track.classList.add("on");
    label.textContent = "Animated";
  } else {
    track.classList.remove("on");
    label.textContent = "Static";
  }
}

// ── Algorithm selection ───────────────────────────────────
function selectSingleAlgo(algo, btn) {
  selectedSingleAlgo = algo;
  document.querySelectorAll("#algoSelector .algo-sel-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}
function selectCompareAlgo(side, algo, btn) {
  if (side === "A") selectedCompareA = algo;
  else              selectedCompareB = algo;
  const containerId = side === "A" ? "algoSelectorA" : "algoSelectorB";
  document.querySelectorAll(`#${containerId} .algo-sel-btn`).forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

// ── Process colors ────────────────────────────────────────
function generateColor() {
  const palettes = ["#3b82f6","#10b981","#f59e0b","#ef4444","#a78bfa","#ec4899","#06b6d4","#84cc16","#f97316","#8b5cf6"];
  return palettes[processes.length % palettes.length];
}
function getColor(pid) {
  return processes.find(p => p.pid === pid)?.color || "#888";
}

// ── Modal ─────────────────────────────────────────────────
function openModal() {
  const modal = document.getElementById("processModal");
  modal.classList.remove("hidden");
  if (editingIndex === null) {
    resetModalFields();
    document.getElementById("modalTitle").textContent = "Add Process";
    const col = generateColor();
    document.getElementById("mColor").value = col;
    const prev = document.getElementById("colorPreview");
    if (prev) prev.style.background = col;
  }
  clearModalErrors();
}
function closeModal() {
  document.getElementById("processModal").classList.add("hidden");
  clearModalErrors();
  resetModalFields();
  editingIndex = null;
  document.getElementById("modalTitle").textContent = "Add Process";
}
function clearModalErrors() {
  const err = document.getElementById("modalError");
  if (err) { err.classList.add("hidden"); err.innerHTML = ""; }
  ["mArrival","mBurst","mPriority"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("input-error");
  });
  modalErrorShown = false;
}
function resetModalFields() {
  ["mArrival","mBurst","mPriority"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  const def = "#3b82f6";
  document.getElementById("mColor").value = def;
  const prev = document.getElementById("colorPreview");
  if (prev) prev.style.background = def;
}
function liveValidate() {
  if (!modalErrorShown) return;
  const a = document.getElementById("mArrival").value.trim();
  const b = document.getElementById("mBurst").value.trim();
  let missing = [];
  if (!a) missing.push("Arrival Time");
  if (!b) missing.push("Burst Time");
  const err = document.getElementById("modalError");
  if (!err) return;
  if (!missing.length) { err.classList.add("hidden"); err.innerHTML = ""; }
  else {
    err.innerHTML = "⚠ Required: " + missing.join(", ");
    err.classList.remove("hidden");
  }
}

function addProcess() {
  const aEl = document.getElementById("mArrival");
  const bEl = document.getElementById("mBurst");
  const pEl = document.getElementById("mPriority");
  const err = document.getElementById("modalError");

  [aEl,bEl,pEl].forEach(el => el.classList.remove("input-error"));
  if (err) { err.classList.add("hidden"); err.innerHTML = ""; }

  const aStr = aEl.value.trim(), bStr = bEl.value.trim(), pStr = pEl.value.trim();
  let errors = [];

  if (!aStr) { errors.push("Arrival Time is required"); aEl.classList.add("input-error"); }
  if (!bStr) { errors.push("Burst Time is required");   bEl.classList.add("input-error"); }

  if (errors.length) {
    modalErrorShown = true;
    if (err) { err.innerHTML = "⚠ " + errors.join(" · "); err.classList.remove("hidden"); }
    return;
  }

  const arrival  = parseInt(aStr, 10);
  const burst    = parseInt(bStr, 10);
  const priority = pStr ? parseInt(pStr, 10) : 1;
  errors = [];

  if (isNaN(arrival) || arrival < 0)  { errors.push("Arrival Time must be ≥ 0");     aEl.classList.add("input-error"); }
  if (isNaN(burst)   || burst <= 0)   { errors.push("Burst Time must be > 0");        bEl.classList.add("input-error"); }
  if (pStr && (isNaN(priority) || priority <= 0)) { errors.push("Priority must be ≥ 1"); pEl.classList.add("input-error"); }

  if (errors.length) {
    modalErrorShown = true;
    if (err) { err.innerHTML = "⚠ " + errors.join(" · "); err.classList.remove("hidden"); }
    return;
  }

  if (editingIndex !== null) {
    processes[editingIndex] = { ...processes[editingIndex], arrival, burst, priority, color: document.getElementById("mColor").value };
    editingIndex = null;
    document.getElementById("modalTitle").textContent = "Add Process";
  } else {
    processes.push({ pid: "P" + processCounter, arrival, burst, priority, color: document.getElementById("mColor").value });
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
  const prev = document.getElementById("colorPreview");
  if (prev) prev.style.background = p.color;
  document.getElementById("modalTitle").textContent = "Edit Process";
  openModal();
}

function deleteProcess(index) {
  if (editingIndex === index) { editingIndex = null; resetModalFields(); }
  else if (editingIndex !== null && index < editingIndex) editingIndex--;
  processes.splice(index, 1);
  renderProcesses();
  updateRunButton();
  hideResults();
}

// ── Render ─────────────────────────────────────────────────
function renderProcesses() {
  const list  = document.getElementById("processList");
  const table = document.getElementById("processTable");

  if (processes.length === 0) {
    list.innerHTML = `<div class="empty-processes"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>No processes yet — click <strong>Add Process</strong></div>`;
    table.innerHTML = `<tr><th>PID</th><th>Arrival</th><th>Burst</th><th>Priority</th><th></th></tr>`;
    return;
  }

  list.innerHTML = processes.map((p, i) => `
    <div class="process-card" onclick="editProcess(${i})">
      <div class="p-color-dot" style="background:${p.color}"></div>
      <div class="p-pid">${p.pid}</div>
      <div class="p-details">
        <div class="p-detail">AT <span>${p.arrival}</span></div>
        <div class="p-detail">BT <span>${p.burst}</span></div>
        <div class="p-detail">Pri <span>${p.priority}</span></div>
      </div>
      <button class="btn-icon-only" onclick="event.stopPropagation();deleteProcess(${i})" title="Remove ${p.pid}">
        <svg viewBox="0 0 24 24" class="trash-icon">
          <path class="trash-path" d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6"/>
        </svg>
      </button>
    </div>`).join("");

  table.innerHTML = `<tr><th>PID</th><th>Arrival</th><th>Burst</th><th>Priority</th><th></th></tr>` +
    processes.map((p, i) => `
    <tr>
      <td><span class="pid-badge" style="background:${p.color}">${p.pid}</span></td>
      <td>${p.arrival}</td><td>${p.burst}</td><td>${p.priority}</td>
      <td><button class="btn-icon-only" onclick="deleteProcess(${i})" title="Remove">
        <svg viewBox="0 0 24 24"><path class="trash-path" d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6"/></svg>
      </button></td>
    </tr>`).join("");
}

function updateRunButton() {
  const btn = document.getElementById("runBtn");
  const can = processes.length >= 2;
  btn.disabled = !can;
  if (can) btn.classList.add("run-pulse");
  else     btn.classList.remove("run-pulse");
}

function clearProcesses() {
  processes = []; processCounter = 1; editingIndex = null;
  renderProcesses(); updateRunButton(); hideResults();
}

function hideResults() {
  document.getElementById("resultsSection").classList.add("hidden");
  document.getElementById("emptyState").classList.remove("hidden");
  document.getElementById("summaryTable").innerHTML = `<tr><th>Algorithm</th><th>Avg WT</th><th>Avg TAT</th><th>Avg RT</th><th>Throughput</th><th>CPU Util</th></tr>`;
  document.getElementById("algoButtons").innerHTML = "";
  document.getElementById("details").innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19V5M4 19h16" stroke-linecap="round"/><path d="M7 14l3-3 3 2 4-6" stroke-linecap="round"/></svg><p>Select an algorithm above</p></div>`;
  algorithmsStarted = false;
  const viewBtn = document.getElementById("viewAlgorithmsBtn");
  if (viewBtn) viewBtn.style.display = "none";
}

function showResults() {
  document.getElementById("resultsSection").classList.remove("hidden");
  document.getElementById("emptyState").classList.add("hidden");
}

// ── Run Scheduler ──────────────────────────────────────────
function runScheduler() {
  const quantum = parseInt(document.getElementById("quantum").value || "2");
  if (processes.length < 2) { alert("Add at least 2 processes first."); return; }

  const btn = document.getElementById("runBtn");
  btn.textContent = "Running…";
  btn.disabled = true;

  fetch("/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ processes, quantum })
  })
  .then(r => r.json())
  .then(res => {
    globalResults = res.results;
    bestAlgos     = res.best;

    btn.innerHTML = `<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M8 5l12 7-12 7V5z"/></svg> Execute Scheduler`;
    btn.disabled  = false;

    showResults();
    algorithmsStarted = false;

    if (currentMode === "single")   renderSingleResult();
    else if (currentMode === "compare2") renderCompare2Result();
    else                            renderAllResults();
  })
  .catch(() => {
    btn.innerHTML = `<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M8 5l12 7-12 7V5z"/></svg> Execute Scheduler`;
    btn.disabled = false;
    alert("Backend error. Check that Flask is running.");
  });
}

// ══════════════════════════════════════════════════════════════
//  MODE: ALL ALGORITHMS
// ══════════════════════════════════════════════════════════════
function renderAllResults() {
  document.getElementById("allResults").classList.remove("hidden");
  document.getElementById("singleResults").classList.add("hidden");
  document.getElementById("compare2Results").classList.add("hidden");

  // Rebuild summary table header
  const table = document.getElementById("summaryTable");
  table.innerHTML = `<tr><th>Algorithm</th><th>Avg WT</th><th>Avg TAT</th><th>Avg RT</th><th>Throughput</th><th>CPU Util</th></tr>`;

  document.getElementById("algorithmsBlock").classList.add("algo-hidden");
  document.getElementById("algoButtons").innerHTML = "";
  const detEl = document.getElementById("details");
  detEl.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19V5M4 19h16" stroke-linecap="round"/><path d="M7 14l3-3 3 2 4-6" stroke-linecap="round"/></svg><p>Select an algorithm above</p></div>`;
  document.getElementById("bestText").innerHTML = "";
  const viewBtn = document.getElementById("viewAlgorithmsBtn");
  if (viewBtn) viewBtn.style.display = "none";

  buildSummary();
}

function getRankedAlgos() {
  return Object.keys(globalResults)
    .map(name => ({ name, m: globalResults[name].metrics }))
    .sort((a, b) => {
      if (b.m.cpu_util    !== a.m.cpu_util)    return b.m.cpu_util    - a.m.cpu_util;
      if (b.m.throughput  !== a.m.throughput)  return b.m.throughput  - a.m.throughput;
      if (a.m.avg_tat     !== b.m.avg_tat)     return a.m.avg_tat     - b.m.avg_tat;
      if (a.m.avg_wt      !== b.m.avg_wt)      return a.m.avg_wt      - b.m.avg_wt;
      return a.m.avg_rt - b.m.avg_rt;
    });
}

function getRank(algoName) {
  const ranked = getRankedAlgos();
  let rank = 1, prevM = null;
  for (let i = 0; i < ranked.length; i++) {
    const { name, m } = ranked[i];
    if (!prevM ||
        m.cpu_util !== prevM.cpu_util || m.throughput !== prevM.throughput ||
        m.avg_tat  !== prevM.avg_tat  || m.avg_wt     !== prevM.avg_wt    || m.avg_rt !== prevM.avg_rt) {
      rank = i + 1;
    }
    if (name === algoName) return rank;
    prevM = m;
  }
  return rank;
}

function buildSummary() {
  const table   = document.getElementById("summaryTable");
  const bestBox = document.getElementById("bestText");
  const ranked  = getRankedAlgos();
  let prevM = null, currentRank = 1;

  // Keep hidden during animation
  table.querySelectorAll("tr:not(:first-child)").forEach(r => r.remove());

  ranked.forEach(({ name, m }, idx) => {
    if (!prevM ||
        m.cpu_util !== prevM.cpu_util || m.throughput !== prevM.throughput ||
        m.avg_tat  !== prevM.avg_tat  || m.avg_wt     !== prevM.avg_wt    || m.avg_rt !== prevM.avg_rt) {
      currentRank = idx + 1;
    }
    prevM = m;
    const isBest = bestAlgos.includes(name);
    const tr = document.createElement("tr");
    if (isBest) tr.className = "best-row";
    tr.innerHTML = `
      <td>${name}${isBest ? '<span class="best-badge">Best</span>' : ''}<span class="rank-badge">#${currentRank}</span></td>
      <td>${m.avg_wt.toFixed(2)}</td>
      <td>${m.avg_tat.toFixed(2)}</td>
      <td>${m.avg_rt.toFixed(2)}</td>
      <td>${m.throughput.toFixed(2)}</td>
      <td>${(m.cpu_util*100).toFixed(1)}%</td>`;
    tr.querySelectorAll("td").forEach(td => { td.style.opacity = "0"; td.style.transform = "translateY(6px)"; });
    table.appendChild(tr);
  });

  // Build best card (hidden first)
  const best = bestAlgos[0];
  const bm   = globalResults[best].metrics;
  bestBox.innerHTML = buildBestCard(bm);
  const card = bestBox.querySelector(".best-card");
  if (card) { card.style.visibility = "hidden"; }

  // Scroll and animate
  requestAnimationFrame(async () => {
    document.getElementById("summaryCard").scrollIntoView({ behavior: "smooth", block: "start" });
    await sleep(300);

    await animateLetters(document.getElementById("resultsHeading"), 60);
    await animateTableRows(table, 280);
    await animateBestRows(table, 700);
    await animateRankBadges(table, 220);

    if (card) { card.style.visibility = "visible"; await revealCard(card); }

    const viewBtn = document.getElementById("viewAlgorithmsBtn");
    if (viewBtn) {
      viewBtn.style.display = "inline-flex";
      viewBtn.classList.add("fade-in-link");
    }
  });
}

function buildBestCard(bm) {
  const names = bestAlgos;
  const isTie = names.length > 1;
  return `
    <div class="best-card">
      <div class="best-card-top">
        <span class="best-chip">🏆 BEST</span>
        <span class="best-sub">${isTie ? "Multiple Optimal Algorithms" : "Optimal Performance"}</span>
      </div>
      <div class="best-title">${isTie
        ? `<div class="multi-title-list">${names.map(n=>`<span class="algo-name">${n}</span>`).join("")}</div>`
        : FULL_NAMES[names[0]]}</div>
      ${isTie ? "" : `<div class="best-code">${names[0]}</div>`}
      <div class="best-reason-block">
        <div class="reason-line"><span class="reason-rank">1</span><span>Highest CPU Utilization (${(bm.cpu_util*100).toFixed(1)}%)</span></div>
        <div class="reason-line"><span class="reason-rank">2</span><span>Highest Throughput (${bm.throughput.toFixed(2)})</span></div>
        <div class="reason-line"><span class="reason-rank">3</span><span>Lowest Avg Turnaround (${bm.avg_tat.toFixed(2)})</span></div>
        <div class="reason-line"><span class="reason-rank">4</span><span>Lowest Avg Waiting Time (${bm.avg_wt.toFixed(2)})</span></div>
        <div class="reason-line"><span class="reason-rank">5</span><span>Lowest Avg Response Time (${bm.avg_rt.toFixed(2)})</span></div>
      </div>
    </div>`;
}

async function scrollToAlgorithms() {
  if (algorithmsStarted) return;
  algorithmsStarted = true;

  const viewBtn     = document.getElementById("viewAlgorithmsBtn");
  const algoBlock   = document.getElementById("algorithmsBlock");
  const heading     = document.getElementById("algorithmsHeading");
  const buttonsWrap = document.getElementById("algoButtons");
  const detEl       = document.getElementById("details");

  if (viewBtn) viewBtn.style.display = "none";
  buttonsWrap.style.opacity = "0";

  algoBlock.classList.remove("algo-hidden");
  algoBlock.style.visibility = "hidden";

  // Build buttons
  buttonsWrap.innerHTML = Object.keys(globalResults).map(name => {
    const isBest = bestAlgos.includes(name);
    return `<button class="algo-btn ${isBest ? "algo-best" : ""}" onclick="showDetails('${name}');setActiveBtn('${name}')">${name}</button>`;
  }).join("");

  // Temp render for height measurement
  const tempAlgo = bestAlgos[0] || Object.keys(globalResults)[0];
  renderDetailContent(detEl, tempAlgo, false);
  await new Promise(r => requestAnimationFrame(r));
  await new Promise(r => requestAnimationFrame(r));
  const h = detEl.offsetHeight;
  detEl.style.minHeight = h + "px";

  detEl.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19V5M4 19h16" stroke-linecap="round"/><path d="M7 14l3-3 3 2 4-6" stroke-linecap="round"/></svg><p>Select an algorithm above</p></div>`;

  algoBlock.scrollIntoView({ behavior: "smooth", block: "start" });
  await waitScrollEnd();

  algoBlock.style.visibility = "visible";
  await animateLetters(heading, 70);

  buttonsWrap.style.opacity = "1";
  const btns = buttonsWrap.querySelectorAll(".algo-btn");
  btns.forEach((b, i) => setTimeout(() => b.classList.add("btn-show"), i * 80));
  await sleep(btns.length * 80 + 200);

  detEl.style.opacity = "1";
}

function buildButtons() {
  const container = document.getElementById("algoButtons");
  container.innerHTML = Object.keys(globalResults).map(name => {
    const isBest = bestAlgos.includes(name);
    return `<button class="algo-btn ${isBest ? "algo-best" : ""}" onclick="showDetails('${name}');setActiveBtn('${name}')">${name}</button>`;
  }).join("");
}

function setActiveBtn(algo) {
  document.querySelectorAll(".algo-btn").forEach(b => b.classList.remove("algo-active"));
  const target = [...document.querySelectorAll(".algo-btn")].find(b => b.textContent.trim() === algo);
  if (target) target.classList.add("algo-active");
}

function showDetails(algo) {
  const detEl = document.getElementById("details");
  renderDetailContent(detEl, algo, animEnabled);
}

// ══════════════════════════════════════════════════════════════
//  MODE: SINGLE ALGORITHM
// ══════════════════════════════════════════════════════════════
function renderSingleResult() {
  document.getElementById("allResults").classList.add("hidden");
  document.getElementById("singleResults").classList.remove("hidden");
  document.getElementById("compare2Results").classList.add("hidden");

  const algo   = selectedSingleAlgo;
  const detEl  = document.getElementById("singleDetails");
  const heading = document.getElementById("singleHeading");

  heading.textContent = `${algo} — ${FULL_NAMES[algo] || algo}`;

  renderDetailContent(detEl, algo, animEnabled);

  document.getElementById("singleDetails").scrollIntoView({ behavior: "smooth", block: "start" });
}

// ══════════════════════════════════════════════════════════════
//  MODE: HEAD-TO-HEAD
// ══════════════════════════════════════════════════════════════
function renderCompare2Result() {
  document.getElementById("allResults").classList.add("hidden");
  document.getElementById("singleResults").classList.add("hidden");
  document.getElementById("compare2Results").classList.remove("hidden");

  const algoA = selectedCompareA;
  const algoB = selectedCompareB;
  const layout = document.getElementById("compareLayout");
  layout.innerHTML = "";

  const colA = document.createElement("div");
  const colB = document.createElement("div");

  colA.innerHTML = `<div class="compare-col-header" style="border-color:rgba(59,130,246,0.35)">
    <div style="width:8px;height:8px;border-radius:50%;background:#3b82f6;flex-shrink:0"></div>
    <div style="font-size:14px;font-weight:800;font-family:var(--font-mono);color:var(--blue2)">${algoA}</div>
    <div style="font-size:12px;color:var(--text3);flex:1">${FULL_NAMES[algoA] || ""}</div>
  </div>`;
  colB.innerHTML = `<div class="compare-col-header" style="border-color:rgba(167,139,250,0.35)">
    <div style="width:8px;height:8px;border-radius:50%;background:#a78bfa;flex-shrink:0"></div>
    <div style="font-size:14px;font-weight:800;font-family:var(--font-mono);color:#c4b5fd">${algoB}</div>
    <div style="font-size:12px;color:var(--text3);flex:1">${FULL_NAMES[algoB] || ""}</div>
  </div>`;

  const cardA = document.createElement("div");
  const cardB = document.createElement("div");
  cardA.className = cardB.className = "sim-card";
  colA.appendChild(cardA);
  colB.appendChild(cardB);
  layout.appendChild(colA);
  layout.appendChild(colB);

  renderDetailContent(cardA, algoA, animEnabled);
  setTimeout(() => renderDetailContent(cardB, algoB, animEnabled), 200);

  // Metric diff table
  const diffSection = document.createElement("div");
  diffSection.style.gridColumn = "1/-1";
  diffSection.innerHTML = buildDiffTable(algoA, algoB);
  layout.appendChild(diffSection);

  layout.scrollIntoView({ behavior: "smooth", block: "start" });
}

function buildDiffTable(a, b) {
  const ma = globalResults[a].metrics;
  const mb = globalResults[b].metrics;

  const rows = [
    { label: "Avg Waiting Time",     va: ma.avg_wt,   vb: mb.avg_wt,   lower: true  },
    { label: "Avg Turnaround Time",  va: ma.avg_tat,  vb: mb.avg_tat,  lower: true  },
    { label: "Avg Response Time",    va: ma.avg_rt,   vb: mb.avg_rt,   lower: true  },
    { label: "CPU Utilization",      va: ma.cpu_util, vb: mb.cpu_util, lower: false, pct: true },
    { label: "Throughput",           va: ma.throughput, vb: mb.throughput, lower: false },
  ];

  const diffHtml = rows.map(row => {
    const diff = row.va - row.vb;
    const aWins = row.lower ? (row.va < row.vb) : (row.va > row.vb);
    const bWins = row.lower ? (row.vb < row.va) : (row.vb > row.va);
    const pct = row.pct;
    const fmt = v => pct ? (v*100).toFixed(1) + "%" : v.toFixed(2);
    const diffStr = Math.abs(diff);
    return `<tr>
      <td style="color:var(--text2)">${row.label}</td>
      <td style="font-family:var(--font-mono);color:var(--text)">${fmt(row.va)}${aWins ? '<span class="diff-badge diff-better">✓</span>' : ''}</td>
      <td style="font-family:var(--font-mono);color:var(--text)">${fmt(row.vb)}${bWins ? '<span class="diff-badge diff-better">✓</span>' : ''}</td>
      <td style="font-family:var(--font-mono);font-size:12px;color:var(--text3)">${pct ? (diffStr*100).toFixed(1)+"%" : diffStr.toFixed(2)}</td>
    </tr>`;
  }).join("");

  return `<div class="sim-card" style="margin-top:0">
    <div class="sim-card-title">Metric Comparison</div>
    <table class="result-table">
      <tr><th>Metric</th><th style="color:#93c5fd">${a}</th><th style="color:#c4b5fd">${b}</th><th>Difference</th></tr>
      ${diffHtml}
    </table>
  </div>`;
}

// ══════════════════════════════════════════════════════════════
//  DETAIL RENDER  (shared by all modes)
// ══════════════════════════════════════════════════════════════
function renderDetailContent(container, algo, animate) {
  const data    = globalResults[algo];
  const gantt   = data.gantt;
  const table   = data.table;
  const metrics = data.metrics;
  const rank    = getRank(algo);

  const avgWT  = metrics.avg_wt.toFixed(2);
  const avgTAT = metrics.avg_tat.toFixed(2);
  const avgRT  = metrics.avg_rt.toFixed(2);
  const util   = (metrics.cpu_util * 100).toFixed(1);
  const thru   = metrics.throughput.toFixed(2);

  container.innerHTML = `
    <div class="gantt-header">
      <div class="gantt-title"><span class="gantt-dot"></span>Gantt Chart</div>
    </div>
    <div class="gantt-wrap"><div class="gantt" id="gantt_${algo.replace(/ /g,'_')}"></div></div>

    <div class="result-layout" style="margin-top:24px">
      <div id="tableWrap_${algo.replace(/ /g,'_')}" class="table-hidden">
        <table class="result-table">
          <tr><th>PID</th><th>Arrival</th><th>Burst</th><th>Response</th><th>Waiting</th><th>Turnaround</th></tr>
          ${table.map(p => `<tr>
            <td><span class="pid-badge" style="background:${getColor(p.pid)}">${p.pid}</span></td>
            <td>${p.arrival}</td><td>${p.burst}</td><td>${p.rt}</td><td>${p.wt}</td><td>${p.tat}</td>
          </tr>`).join("")}
        </table>
      </div>
      <div id="statsWrap_${algo.replace(/ /g,'_')}" class="stats-section">
        <div class="stat-box"><div class="stat-label-text">Rank</div><div class="stat-val rank-val">#${rank}</div></div>
        <div class="stat-box"><div class="stat-label-text">Avg Waiting Time</div><div class="stat-val">${avgWT}</div></div>
        <div class="stat-box"><div class="stat-label-text">Avg Turnaround</div><div class="stat-val">${avgTAT}</div></div>
        <div class="stat-box"><div class="stat-label-text">Avg Response Time</div><div class="stat-val">${avgRT}</div></div>
        <div class="stat-box"><div class="stat-label-text">Throughput</div><div class="stat-val">${thru}</div></div>
        <div class="stat-box"><div class="stat-label-text">CPU Utilization</div><div class="stat-val">${util}%</div></div>
      </div>
    </div>`;

  const ganttDiv  = document.getElementById(`gantt_${algo.replace(/ /g,'_')}`);
  const tableWrap = document.getElementById(`tableWrap_${algo.replace(/ /g,'_')}`);
  const statsWrap = document.getElementById(`statsWrap_${algo.replace(/ /g,'_')}`);

  if (!gantt || !gantt.length) return;

  const totalStart    = gantt[0][1];
  const totalEnd      = gantt[gantt.length-1][2];
  const totalTimeline = totalEnd - totalStart;
  const ANIM_TIME     = animate ? 4000 : 0;

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
      const dur   = (width / totalTimeline) * ANIM_TIME;
      const delay = ((start - totalStart) / totalTimeline) * ANIM_TIME;
      setTimeout(() => {
        block.style.transition = `transform ${dur}ms cubic-bezier(.2,.9,.2,1), opacity 350ms ease`;
        block.style.transform  = "scaleX(1)";
        block.style.opacity    = "1";
      }, delay);
    }
    ganttDiv.appendChild(block);
  });

  // Show table + stats after gantt
  setTimeout(() => {
    tableWrap.classList.remove("table-hidden");
    tableWrap.classList.add("table-show");
  }, ANIM_TIME + 150);

  setTimeout(() => {
    statsWrap.classList.remove("stats-section");  // remove default hidden
    statsWrap.classList.add("stats-show");
    statsWrap.style.opacity = "1";
    statsWrap.style.transform = "translateX(0)";
  }, ANIM_TIME + 700);
}

// ══════════════════════════════════════════════════════════════
//  ANIMATION HELPERS
// ══════════════════════════════════════════════════════════════
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function waitScrollEnd(timeout = 1000) {
  return new Promise(resolve => {
    let last = window.scrollY, sameCount = 0, start = performance.now();
    const check = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 1) sameCount++;
      else sameCount = 0;
      last = y;
      if (sameCount >= 5 || performance.now() - start > timeout) { resolve(); return; }
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
  return sleep(text.length * delay + 250);
}

async function animateTableRows(tableEl, rowDelay = 200) {
  if (!tableEl) return;
  const rows = Array.from(tableEl.querySelectorAll("tr:not(:first-child)"));
  for (const r of rows) {
    r.classList.add("row-reveal");
    await sleep(rowDelay);
  }
}

async function animateBestRows(tableEl, pulseDelay = 600) {
  if (!tableEl) return;
  for (const r of Array.from(tableEl.querySelectorAll("tr.best-row"))) {
    r.querySelectorAll("td").forEach(td => td.classList.add("best-show"));
    r.classList.add("best-pulse");
    await sleep(pulseDelay);
    r.classList.remove("best-pulse");
  }
}

async function animateRankBadges(tableEl, delay = 180) {
  if (!tableEl) return;
  for (const badge of Array.from(tableEl.querySelectorAll(".rank-badge"))) {
    badge.classList.add("rank-show");
    await sleep(delay);
  }
}

async function revealCard(card) {
  if (!card) return;
  await new Promise(r => requestAnimationFrame(r));
  await new Promise(r => requestAnimationFrame(r));
  card.classList.add("best-show");
  await sleep(700);
}
