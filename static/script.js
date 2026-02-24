// ---------- Full Names ----------
const fullNames = {
  "FCFS": "First Come First Serve",
  "SPN": "Shortest Process Next",
  "SRTF": "Shortest Remaining Time First",
  "RR": "Round Robin",
  "Priority NP": "Priority (Non-Preemptive)",
  "Priority P": "Priority (Preemptive)"
};

let editingIndex = null;
let globalResults = {};
let bestAlgos = [];
let modalErrorShown = false;   // only after Submit clicked
let algorithmsStarted = false; // ✅ prevent double animation

// ---------- PROCESS STORAGE ----------
let processes = [];
let processCounter = 1;

// ---------- MODAL ----------
function openModal() {
  document.getElementById("processModal").classList.remove("hidden");

 if (editingIndex === null) {
  resetModalFields();
  document.querySelector("#processModal h3").innerText = "Add Process";

  const randomColor = hslToHex(generateColor());
  document.getElementById("mColor").value = randomColor;
  const preview = document.getElementById("colorPreview");
if (preview) preview.style.background = randomColor;
 }
  // reset old error styles + message (if exists)
  const err = document.getElementById("modalError");
  if (err) {
    err.classList.add("hidden");
    err.innerHTML = "";
  }

  ["mArrival","mBurst","mPriority"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("input-error");
  });

  modalErrorShown = false;
}

function closeModal() {
  document.getElementById("processModal").classList.add("hidden");

  const err = document.getElementById("modalError");
  if (err) {
    err.classList.add("hidden");
    err.innerHTML = "";
  }

  ["mArrival","mBurst","mPriority"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("input-error");
  });
  modalErrorShown = false;
  resetModalFields();
editingIndex = null;
document.querySelector("#processModal h3").innerText = "Add Process";
}

// ---------- ADD PROCESS ----------
function addProcess() {
  const arrivalEl = document.getElementById("mArrival");
  const burstEl = document.getElementById("mBurst");
  const priorityEl = document.getElementById("mPriority");
  const err = document.getElementById("modalError");

  // reset old errors
  [arrivalEl, burstEl, priorityEl].forEach(el => el.classList.remove("input-error"));
  if (err) {
    err.classList.add("hidden");
    err.innerHTML = "";
  }

  // read values as strings first (required check)
  const arrivalStr = arrivalEl.value.trim();
  const burstStr = burstEl.value.trim();
  const priorityStr = priorityEl.value.trim();

  let errors = [];

  if (arrivalStr === "") {
    errors.push("Arrival Time is required");
    arrivalEl.classList.add("input-error");
  }
  if (burstStr === "") {
    errors.push("Burst Time is required");
    burstEl.classList.add("input-error");
  }

  // stop if any empty
  if (errors.length > 0) {
    modalErrorShown = true;
    if (err) {
      err.innerHTML = "⚠️ Please fill:<br>• " + errors.join("<br>• ");
      err.classList.remove("hidden");
    } else {
      alert(errors.join("\n"));
    }
    return;
  }

  // parse numbers
  const arrival = parseInt(arrivalStr, 10);
  const burst = parseInt(burstStr, 10);
 const priority = priorityStr === "" ? 1 : parseInt(priorityStr, 10);

  // value validation
  errors = [];

  if (isNaN(arrival) || arrival < 0) {
    errors.push("Arrival Time must be 0 or greater");
    arrivalEl.classList.add("input-error");
  }
  if (isNaN(burst) || burst <= 0) {
    errors.push("Burst Time must be greater than 0");
    burstEl.classList.add("input-error");
  }
if (priorityStr !== "" && (isNaN(priority) || priority <= 0)) {
  errors.push("Priority must be 1 or greater");
  priorityEl.classList.add("input-error");
}

  if (errors.length > 0) {
    modalErrorShown = true;
    if (err) {
      err.innerHTML = "⚠️ Fix these:<br>• " + errors.join("<br>• ");
      err.classList.remove("hidden");
    } else {
      alert(errors.join("\n"));
    }
    return;
  }

  // EDIT MODE
  if (editingIndex !== null) {
    processes[editingIndex].arrival = arrival;
    processes[editingIndex].burst = burst;
    processes[editingIndex].priority = priority;
    processes[editingIndex].color = document.getElementById("mColor").value;

    editingIndex = null;
    document.querySelector("#processModal h3").innerText = "Add Process";
  } else {
    // ADD MODE
    const pid = "P" + processCounter;

    processes.push({
  pid,
  arrival,
  burst,
  priority,
  color: document.getElementById("mColor").value
});

    processCounter++;
  }

  modalErrorShown = false;
  renderProcesses();
  resetModalFields();
  closeModal();
}

// ---------- RENDER PROCESS CARDS ----------
function renderProcesses() {

  const list = document.getElementById("processList");
  const table = document.getElementById("processTable");

  list.innerHTML = "";

  table.innerHTML = `
    <tr>
      <th>PID</th>
      <th>Arrival</th>
      <th>Burst</th>
      <th>Priority</th>
       <th>Action</th>
    </tr>
  `;

  processes.forEach((p, index) => {

    // LEFT SIDE CARD
    list.innerHTML += `
  <div class="process-card"
       onclick="editProcess(${index})">
    <div class="color-box" style="background:${p.color}"></div>
    <div class="process-info">
      <div class="process-name">Process ${p.pid}</div>
      <div class="process-detail">Arrival Time : ${p.arrival}</div>
      <div class="process-detail">Burst Time : ${p.burst}</div>
      <div class="process-detail">Priority : ${p.priority}</div>
    </div>
  </div>
`;

    // RIGHT SIDE TABLE
    table.innerHTML += `
      <tr>
       <td>
  <span class="pid-badge" style="background:${p.color}">
    ${p.pid}
  </span>
</td>
        <td>${p.arrival}</td>
        <td>${p.burst}</td>
        <td>${p.priority}</td>
        <td class="action-cell">
  <button class="icon-btn"
    title="Delete ${p.pid}"
    onclick="event.stopPropagation(); deleteProcess(${index})">

    <svg viewBox="0 0 24 24" class="trash-icon">
      <path d="M3 6h18"></path>
      <path d="M8 6V4h8v2"></path>
      <path d="M19 6l-1 14H6L5 6"></path>
      <path d="M10 11v6"></path>
      <path d="M14 11v6"></path>
    </svg>

  </button>
</td>
      </tr>
    `;
  });
    updateRunButtonState();
}

// ---------- CLEAR ----------
function clearProcesses() {
  processes = [];
  processCounter = 1;

  editingIndex = null; // ✅ IMPORTANT: reset edit mode

  // (optional but recommended) reset modal fields + title
  document.getElementById("mArrival").value = "";
  document.getElementById("mBurst").value = "";
  document.getElementById("mPriority").value = "";
  document.querySelector("#processModal h3").innerText = "Add Process";

  renderProcesses();
  updateRunButtonState();
  hideResultsSection(); // ✅ NOW show Results Summary + Algorithms + Details

}

// ---------- RUN ----------
function runScheduler() {

  const quantum = parseInt(document.getElementById("quantum").value || "2");

  if (processes.length < 2) {
    alert("Add at least two processes");
    return;
  }

  fetch("/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ processes, quantum })
  })
  .then(res => res.json())
  .then((res) => {

    globalResults = res.results;
    bestAlgos = res.best;

    showResultsSection();
    algorithmsStarted = false; // ✅ reset for new run

    // reset algorithm area
    document.getElementById("algorithmsBlock").classList.add("algo-hidden");
    document.getElementById("algoButtons").innerHTML = "";
    document.getElementById("details").innerHTML = "";

    // 🔥 ONLY build summary (no scroll here)
    buildSummary();

  })
  .catch(() => alert("Backend error. Check Flask console."));
}
// ---------- SUMMARY ----------
// ✅ REPLACE your buildSummary() with this updated one
function buildSummary() {
  const summary = document.getElementById("summaryTable");

  summary.innerHTML = `
    <div class="summary-layout">
      <div class="summary-left">
        <table class="summary-table">
          <tr>
            <th>Algorithm</th>
            <th>Avg WT</th>
            <th>Avg TAT</th>
            <th>Avg RT</th>
            <th>Throughput</th>
            <th>CPU Util %</th>
          </tr>
        </table>
        <div id="viewAlgorithmsBtn" class="view-algo-link hidden">
  View Detailed Algorithms
  <span class="arrow">→</span>
</div>
      </div>

      <div class="summary-right">
        <div id="bestText" class="best-text"></div>
      </div>
    </div>
  `;
  const viewBtn = document.getElementById("viewAlgorithmsBtn");
if (viewBtn) {
  viewBtn.style.display = "none";  // force hide
}
  summary.classList.add("summary-animating"); // ✅ hide rows instantly (no sudden show)
  summary.classList.add("prebest"); 

  const table = summary.querySelector("table");

  const rankedAlgos = Object.keys(globalResults)
  .map(name => ({
    name,
    metrics: globalResults[name].metrics
  }))
  .sort((a, b) => {

    if (b.metrics.cpu_util !== a.metrics.cpu_util)
      return b.metrics.cpu_util - a.metrics.cpu_util;

    if (b.metrics.throughput !== a.metrics.throughput)
      return b.metrics.throughput - a.metrics.throughput;

    if (a.metrics.avg_tat !== b.metrics.avg_tat)
      return a.metrics.avg_tat - b.metrics.avg_tat;

    if (a.metrics.avg_wt !== b.metrics.avg_wt)
      return a.metrics.avg_wt - b.metrics.avg_wt;

    return a.metrics.avg_rt - b.metrics.avg_rt;
  });

let currentRank = 1;
let previousMetrics = null;

rankedAlgos.forEach((item, index) => {

  const algo = item.name;
  const metrics = item.metrics;

  // 🔥 tie ranking logic
  if (
    previousMetrics &&
    metrics.cpu_util === previousMetrics.cpu_util &&
    metrics.throughput === previousMetrics.throughput &&
    metrics.avg_tat === previousMetrics.avg_tat &&
    metrics.avg_wt === previousMetrics.avg_wt &&
    metrics.avg_rt === previousMetrics.avg_rt
  ) {
    // same rank
  } else {
    currentRank = index + 1;
  }

  previousMetrics = metrics;

  const avg_wt = metrics.avg_wt.toFixed(2);
  const avg_tat = metrics.avg_tat.toFixed(2);
  const avg_rt = metrics.avg_rt.toFixed(2);
  const cpu_util = (metrics.cpu_util * 100).toFixed(2);
  const throughput = metrics.throughput.toFixed(2);

  const rank = currentRank;
  const isBest = bestAlgos.includes(algo);

  let rankBadge = "";
  if (!isBest) {
    rankBadge = `<span class="rank-badge rank-hidden">Rank ${rank}</span>`;
  }

  const bestBadge = isBest ? `<span class="best-badge">Best</span>` : "";

  table.innerHTML += `
    <tr class="${isBest ? "best-row" : ""}">
      <td>
        ${algo} ${bestBadge} ${rankBadge}
      </td>
      <td>${avg_wt}</td>
      <td>${avg_tat}</td>
      <td>${avg_rt}</td>
      <td>${throughput}</td>
      <td>${cpu_util}%</td>
    </tr>
  `;
});

    const bestText = document.getElementById("bestText");

  // ✅ Build the right-side card HTML but DON'T show yet
  const reason = (bestAlgos.length === 1) ? "Best overall performance" : "Tie between algorithms";
  let bestHTML = "";

if (bestAlgos.length === 1) {

  const a = bestAlgos[0];
  const m = globalResults[a].metrics;

  const cpu = (m.cpu_util * 100).toFixed(2);
  const th  = m.throughput.toFixed(2);
  const tat = m.avg_tat.toFixed(2);
  const wt  = m.avg_wt.toFixed(2);
  const rt  = m.avg_rt.toFixed(2);

  bestHTML = `
    <div class="best-card best-enter">

      <div class="best-card-top">
        <span class="best-chip">🏆 BEST</span>
        <span class="best-sub">Optimal Overall Performance</span>
      </div>

      <div class="best-title">${fullNames[a]}</div>
      <div class="best-code">${a}</div>

      <div class="best-reason-block">

        <div class="reason-line">
          <span class="reason-rank">1</span>
          <span>Highest CPU Utilization (${cpu}%)</span>
        </div>

        <div class="reason-line">
          <span class="reason-rank">2</span>
          <span>Highest Throughput (${th})</span>
        </div>

        <div class="reason-line">
          <span class="reason-rank">3</span>
          <span>Lowest Average Turnaround Time (${tat})</span>
        </div>

        <div class="reason-line">
          <span class="reason-rank">4</span>
          <span>Lowest Average Waiting Time (${wt})</span>
        </div>

        <div class="reason-line">
          <span class="reason-rank">5</span>
          <span>Lowest Average Response Time (${rt})</span>
        </div>

      </div>

    </div>
  `;
} else {

  const a = bestAlgos[0];   // take first one (since metrics are equal)
  const m = globalResults[a].metrics;

  const cpu = (m.cpu_util * 100).toFixed(2);
  const th  = m.throughput.toFixed(2);
  const tat = m.avg_tat.toFixed(2);
  const wt  = m.avg_wt.toFixed(2);
  const rt  = m.avg_rt.toFixed(2);

  bestHTML = `
    <div class="best-card best-enter">

      <div class="best-card-top">
        <span class="best-chip">🏆 BEST</span>
        <span class="best-sub">Multiple Optimal Algorithms</span>
      </div>

      <div class="best-title multi-title-list">
  ${bestAlgos.map(a => `<span class="algo-name">${a}</span>`).join("")}
</div>

      <div class="best-reason-block">

        <div class="reason-line">
          <span class="reason-rank">1</span>
          <span>Highest CPU Utilization (${cpu}%)</span>
        </div>

        <div class="reason-line">
          <span class="reason-rank">2</span>
          <span>Highest Throughput (${th})</span>
        </div>

        <div class="reason-line">
          <span class="reason-rank">3</span>
          <span>Lowest Average Turnaround Time (${tat})</span>
        </div>

        <div class="reason-line">
          <span class="reason-rank">4</span>
          <span>Lowest Average Waiting Time (${wt})</span>
        </div>

        <div class="reason-line">
          <span class="reason-rank">5</span>
          <span>Lowest Average Response Time (${rt})</span>
        </div>

      </div>

    </div>
  `;
}

  // ✅ keep right side empty until animation ends
  bestText.innerHTML = "";

  requestAnimationFrame(async () => {

  /* =====================================
     1️⃣ INSERT BEST CARD INVISIBLY
     ===================================== */

  bestText.innerHTML = bestHTML;

  await new Promise(requestAnimationFrame);

  const card = bestText.querySelector(".best-enter");

  // Measure real height
  const measuredHeight = bestText.offsetHeight;

  // Lock height BEFORE scroll
  bestText.style.minHeight = measuredHeight + "px";

  // Hide visually but keep space
  if (card) {
    card.style.visibility = "hidden";
  }

  /* =====================================
     2️⃣ SCROLL (HEIGHT IS NOW STABLE)
     ===================================== */

  document
    .getElementById("resultsSection")
    .scrollIntoView({ behavior: "smooth", block: "start" });

  /* =====================================
     3️⃣ SUMMARY ANIMATIONS
     ===================================== */

  await animateLetters(document.getElementById("resultsHeading"), 85);

  await animateTableRows(
    summary.querySelector(".summary-table"),
    320
  );

  await animateBestRows(
    summary.querySelector(".summary-table"),
    850
  );
  await animateRankBadges(
  summary.querySelector(".summary-table"),
  300
);

  summary.classList.remove("prebest");

  /* =====================================
     4️⃣ REVEAL RIGHT CARD
     ===================================== */

  if (card) {
    card.style.visibility = "visible";
  }

  await revealRightCard();

  summary.classList.remove("summary-animating");

  /* =====================================
     5️⃣ SHOW ALGORITHMS SECTION
     ===================================== */

  

  // 🔥 Show button after everything finished
// 🔥 Show link AFTER everything fully finished
await sleep(200);

const viewBtn = document.getElementById("viewAlgorithmsBtn");

if (viewBtn) {
  viewBtn.style.display = "inline-flex";  // restore display
  viewBtn.classList.add("fade-in-link");  // optional animation
}

});
}


// ---------- BUTTONS ----------
function buildButtons() {
  const container = document.getElementById("algoButtons");
  container.innerHTML = "";

  for (let algo in globalResults) {
    const isBest = bestAlgos.includes(algo);

    container.innerHTML += `
      <button class="algo-btn ${isBest ? "algo-best" : ""}"
        onclick="showDetails('${algo}'); setActiveButton('${algo}')">
        ${algo}
      </button>
    `;
  }
}

function setActiveButton(algo) {
  document.querySelectorAll(".algo-btn")
    .forEach(b => b.classList.remove("algo-active"));

  const activeBtn = [...document.querySelectorAll(".algo-btn")]
    .find(b => b.textContent.trim() === algo);

  if (activeBtn) activeBtn.classList.add("algo-active");
}

// ---------- DETAILS ----------
function showDetails(algo) {

  const data = globalResults[algo];
const gantt = data.gantt;
const table = data.table;
const metrics = data.metrics;

const avgWT = metrics.avg_wt.toFixed(2);
const avgTAT = metrics.avg_tat.toFixed(2);
const avgRT = metrics.avg_rt.toFixed(2);
const throughput = metrics.throughput.toFixed(2);
const cpuUtil = (metrics.cpu_util * 100).toFixed(2);

// ✅ RANK of this algorithm (same sorting logic as summary)
const ranked = Object.keys(globalResults)
  .map(name => ({ name, m: globalResults[name].metrics }))
  .sort((a, b) => {
    if (b.m.cpu_util !== a.m.cpu_util) return b.m.cpu_util - a.m.cpu_util;
    if (b.m.throughput !== a.m.throughput) return b.m.throughput - a.m.throughput;
    if (a.m.avg_tat !== b.m.avg_tat) return a.m.avg_tat - b.m.avg_tat;
    if (a.m.avg_wt !== b.m.avg_wt) return a.m.avg_wt - b.m.avg_wt;
    return a.m.avg_rt - b.m.avg_rt;
  });

let currentRank = 1;
let previousMetrics = null;
let rank = 1;

ranked.forEach((item, index) => {

  if (
    previousMetrics &&
    item.m.cpu_util === previousMetrics.cpu_util &&
    item.m.throughput === previousMetrics.throughput &&
    item.m.avg_tat === previousMetrics.avg_tat &&
    item.m.avg_wt === previousMetrics.avg_wt &&
    item.m.avg_rt === previousMetrics.avg_rt
  ) {
    // same rank
  } else {
    currentRank = index + 1;
  }

  if (item.name === algo) {
    rank = currentRank;
  }

  previousMetrics = item.m;
});

  const details = document.getElementById("details");

  details.innerHTML = `
   <div class="gantt-header">
  <div class="gantt-title">
    <span class="gantt-dot"></span>
    Gantt Chart
  </div>
</div>
   <div class="gantt-wrap">
  <div class="gantt" id="ganttChart"></div>
</div>

    <div class="bottom-layout">

      <div id="tableSection" class="table-hidden">
    <table class="result-table">
        <tr>
          <th>PID</th>
          <th>Arrival</th>
          <th>Burst</th>
          <th>Response</th>
          <th>Waiting</th>
          <th>Turnaround</th>
        </tr>
        ${table.map(p => `
          <tr>
            <td>
  <span class="pid-badge" style="background:${getColor(p.pid)}">
    ${p.pid}
  </span>
</td>
            <td>${p.arrival}</td>
            <td>${p.burst}</td>
            <td>${p.rt}</td>
            <td>${p.wt}</td>
            <td>${p.tat}</td>
          </tr>
        `).join("")}
      </table>
</div>

<div id="statsSection" class="stats-section stats-hidden">

  <div class="stat-box">
  <div>Rank</div>
  <div class="rank-value">#${rank}</div>
</div>

  <div class="stat-box">
    <div>Avg WT</div>
    <div>${avgWT}</div>
  </div>

  <div class="stat-box">
    <div>Avg TAT</div>
    <div>${avgTAT}</div>
  </div>

  <div class="stat-box">
    <div>Avg RT</div>
    <div>${avgRT}</div>
  </div>

  <div class="stat-box">
    <div>Throughput</div>
    <div>${throughput}</div>
  </div>

  <div class="stat-box">
    <div>CPU Utilization</div>
    <div>${cpuUtil}%</div>
  </div>

</div>
    </div>
  `;

  const ganttDiv = document.getElementById("ganttChart");

// 🔥 Calculate total timeline
if (!gantt || gantt.length === 0) return;

const totalStart = gantt[0][1];
const totalEnd = gantt[gantt.length - 1][2];
const totalTimeline = totalEnd - totalStart;

// Total animation time for whole gantt (adjust here if needed)
const TOTAL_ANIMATION_TIME = 5000; // 4 seconds full simulation

gantt.forEach((block) => {

  const pid = block[0];
  const start = block[1];
  const end = block[2];
  const width = end - start;

  const blockDiv = document.createElement("div");
  blockDiv.className = "block";

  blockDiv.style.backgroundColor =
    pid === "Idle" ? "#4b5563" : getColor(pid);

  blockDiv.style.flex = width;

  blockDiv.innerHTML =
    `<div>${pid}</div><small>${start}-${end}</small>`;

  // Start hidden
  blockDiv.style.transformOrigin = "left";
  blockDiv.style.transform = "scaleX(0)";
  blockDiv.style.opacity = "0";

  ganttDiv.appendChild(blockDiv);

  // 🔥 Duration proportional to CPU time
  const duration =
    (width / totalTimeline) * TOTAL_ANIMATION_TIME;

  // 🔥 Delay based on actual start time
  const delay =
    ((start - totalStart) / totalTimeline) *
    TOTAL_ANIMATION_TIME;

  setTimeout(() => {

    blockDiv.style.transition =
      `transform ${duration}ms cubic-bezier(.2,.9,.2,1),
       opacity 400ms ease`;

    blockDiv.style.transform = "scaleX(1)";
    blockDiv.style.opacity = "1";

  }, delay);
});
// =============================
// SEQUENCE ANIMATION
// =============================

const tableSection = document.getElementById("tableSection");
const statsSection = document.getElementById("statsSection");

// Calculate total animation time (same as gantt)
const totalAnimationTime = TOTAL_ANIMATION_TIME;

// 1️⃣ Show Table AFTER gantt finishes
setTimeout(() => {
  tableSection.classList.remove("table-hidden");
  tableSection.classList.add("table-show");
}, totalAnimationTime + 200);

// 2️⃣ Show Stats AFTER table animation
setTimeout(() => {
  statsSection.classList.remove("stats-hidden");
  statsSection.classList.add("stats-show");
}, totalAnimationTime + 900);
}

// ---------- COLORS ----------
function generateColor() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 65%, 55%)`;
}

function hslToHex(hsl) {
  const match = hsl.match(/\d+/g);
  if (!match) return "#3b82f6";

  let h = parseInt(match[0]) / 360;
  let s = parseInt(match[1]) / 100;
  let l = parseInt(match[2]) / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = function(p, q, t){
      if(t < 0) t += 1;
      if(t > 1) t -= 1;
      if(t < 1/6) return p + (q - p) * 6 * t;
      if(t < 1/2) return q;
      if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = x => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return "#" + toHex(r) + toHex(g) + toHex(b);
}

function getColor(pid) {
  return processes.find(p => p.pid === pid)?.color || "#888";
}

function editProcess(index) {

  const p = processes[index];

  editingIndex = index;

  document.getElementById("mArrival").value = p.arrival;
  document.getElementById("mBurst").value = p.burst;
  document.getElementById("mPriority").value = p.priority;
  document.getElementById("mColor").value = p.color;

  // ✅ UPDATE COLOR PREVIEW
  const preview = document.getElementById("colorPreview");
  if (preview) preview.style.background = p.color;

  document.querySelector("#processModal h3").innerText = "Edit Process"; 
  openModal();
}

function updateRunButtonState() {
  const runBtn = document.getElementById("runBtn");
  const count = processes.length; // better than processList children

  if (count >= 2) {
    const wasDisabled = runBtn.disabled;

    runBtn.disabled = false;

    // Play enable transition only when it changes from disabled -> enabled
    if (wasDisabled) {
  // restart animation every time
  runBtn.classList.remove("run-enable-slide");
  void runBtn.offsetWidth; // force reflow (restart animation)
  runBtn.classList.add("run-enable-slide");

  setTimeout(() => {
    runBtn.classList.remove("run-enable-slide");
  }, 3000); // must match CSS time (3.5s)
}

    runBtn.classList.add("run-pulse");
  } else {
    runBtn.disabled = true;
    runBtn.classList.remove("run-pulse");
    runBtn.classList.remove("run-enable-pop");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderProcesses();
  updateRunButtonState();

  hideResultsSection(); 
  const modal = document.getElementById("processModal");
  const modalContent = document.querySelector(".modal-content");

  modal.addEventListener("click", (e) => {
    // clicked on dark background (outside box)
    if (!modalContent.contains(e.target)) {
      clearModalErrors();
    }
  });

  document.addEventListener("click", function(e) {
  const btn = e.target.closest("#viewAlgorithmsBtn");
  if (btn) {
    scrollToAlgorithms();
  }
});
  // ✅ live validation (hide error when all required fields are ok)
["mArrival", "mBurst", "mPriority"].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;

  const handler = () => {
  // ✅ if submit not clicked yet, do nothing (no error message)
  if (!modalErrorShown) {
    if (el.value.trim() !== "") el.classList.remove("input-error");
    return;
  }

  // remove red border if field now has something
  if (el.value.trim() !== "") el.classList.remove("input-error");

  const a = document.getElementById("mArrival").value.trim();
  const b = document.getElementById("mBurst").value.trim();
  const p = document.getElementById("mPriority").value.trim();

  const err = document.getElementById("modalError");
  if (!err) return;

  let missing = [];
  if (a === "") missing.push("Arrival Time is required");
  if (b === "") missing.push("Burst Time is required");

  if (missing.length === 0) {
    err.classList.add("hidden");
    err.innerHTML = "";
    return;
  }

  err.innerHTML = "⚠️ Please fill:<br>• " + missing.join("<br>• ");
  err.classList.remove("hidden");
};

  el.addEventListener("input", handler);
  el.addEventListener("blur", handler);
});
  
const preview = document.getElementById("colorPreview");
const colorInput = document.getElementById("mColor");

if (preview && colorInput){
  // sync preview always
  preview.style.background = colorInput.value;

  colorInput.addEventListener("input", () => {
    preview.style.background = colorInput.value;
  });
}

});

function clearModalErrors() {
  const err = document.getElementById("modalError");
  if (err) {
    err.classList.add("hidden");
    err.innerHTML = "";
  }

  ["mArrival", "mBurst", "mPriority"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("input-error");
  });

  modalErrorShown = false; // ✅ IMPORTANT
}

function resetModalFields() {

  document.getElementById("mArrival").value = "";
  document.getElementById("mBurst").value = "";
  document.getElementById("mPriority").value = "";

  const defaultColor = "#3b82f6";

  document.getElementById("mColor").value = defaultColor;

  // ✅ RESET PREVIEW BOX ALSO
  const preview = document.getElementById("colorPreview");
  if (preview) preview.style.background = defaultColor;
}

/* ✅ ADD these 2 helper functions anywhere (example: near the top) */

function hideResultsSection() {
  document.getElementById("resultsSection").classList.add("hidden");
  document.getElementById("summaryTable").innerHTML = "";
  document.getElementById("algoButtons").innerHTML = "";
  document.getElementById("details").innerHTML = "";
}

function showResultsSection() {
  document.getElementById("resultsSection").classList.remove("hidden");
}

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

/** Letter-by-letter animation for an element’s text */
function animateLetters(el, delay = 35){
  if (!el) return Promise.resolve();

  // ✅ Always reset text before animating
  const originalText = el.getAttribute("data-text") || el.textContent;

  // Save original once
  el.setAttribute("data-text", originalText);

  el.textContent = originalText; // restore clean text

  const text = originalText;
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

  const total = text.length * delay + 320;
  return sleep(total);
}

/** Stagger reveal for table rows (including header row) */
async function animateTableRows(tableEl, rowDelay = 120){
  if (!tableEl) return;

  const rows = Array.from(tableEl.querySelectorAll("tr"));

  // keep hidden
  rows.forEach(r => {
    r.style.opacity = 0;
    r.style.transform = "translateY(10px)";
  });

  for (const r of rows){

  r.classList.add("row-reveal");

  await sleep(rowDelay);
}
}

/** Pulse best rows one-by-one */
async function animateBestRows(tableEl, pulseDelay = 350){
  if (!tableEl) return;

  const bestRows = Array.from(tableEl.querySelectorAll("tr.best-row"));
  for (const r of bestRows){

    // ✅ show highlight for THIS row only
    r.classList.add("best-show");

    // pulse effect
    r.classList.add("best-pulse");
    await sleep(pulseDelay);
    r.classList.remove("best-pulse");
  }
}

/** Reveal right card last */
async function revealRightCard(){
  const card = document.querySelector("#bestText .best-enter");
  if (!card) return;

  // keep it hidden first
  card.classList.remove("best-show");

  // ✅ double rAF ensures browser paints opacity:0 first
  await new Promise(requestAnimationFrame);
  await new Promise(requestAnimationFrame);

  // now trigger animation
  card.classList.add("best-show");

  await sleep(1100);
}

function waitForScrollEnd(timeout = 1200) {
  return new Promise((resolve) => {
    let lastY = window.scrollY;
    let sameCount = 0;

    const start = performance.now();

    function check() {
      const y = window.scrollY;

      if (Math.abs(y - lastY) < 1) sameCount++;
      else sameCount = 0;

      lastY = y;

      // stable for few frames OR timeout
      if (sameCount >= 6 || performance.now() - start > timeout) {
        resolve();
        return;
      }
      requestAnimationFrame(check);
    }

    requestAnimationFrame(check);
  });
}

async function scrollToAlgorithms() {
  if (algorithmsStarted) return;
  algorithmsStarted = true;

  const viewBtn = document.getElementById("viewAlgorithmsBtn");
  if (viewBtn) viewBtn.style.display = "none";

  const algoBlock = document.getElementById("algorithmsBlock");
  const heading = document.getElementById("algorithmsHeading");
  const buttonsWrap = document.getElementById("algoButtons");
  const details = document.getElementById("details");

  // Reset opacity
  buttonsWrap.style.opacity = "0";
  details.style.opacity = "0";

  // 1️⃣ Make section measurable but invisible
  algoBlock.classList.remove("algo-hidden");
  algoBlock.style.visibility = "hidden";

  // 2️⃣ Build buttons
  buildButtons();

  // 3️⃣ TEMPORARILY render first algorithm to calculate FULL height
  const tempAlgo = bestAlgos[0] || Object.keys(globalResults)[0];
  showDetails(tempAlgo);

  // 4️⃣ Wait layout
  await new Promise(requestAnimationFrame);
  await new Promise(requestAnimationFrame);

  // 5️⃣ Lock details height (VERY IMPORTANT)
  const measuredHeight = details.offsetHeight;
  details.style.minHeight = measuredHeight + "px";

  // 6️⃣ Clear content (no algorithm selected initially)
  details.innerHTML = `
    <div class="empty-state">
      Select an algorithm to view details
    </div>
  `;

  // 7️⃣ Scroll
  const top = algoBlock.getBoundingClientRect().top + window.pageYOffset;
  window.scrollTo({ top: top - 20, behavior: "smooth" });

  await waitForScrollEnd();

  // 8️⃣ Make visible
  algoBlock.style.visibility = "visible";

  // 9️⃣ Animate heading
  await animateLetters(heading, 80);

  // 🔟 Fade in buttons + empty state
  buttonsWrap.style.transition = "opacity 350ms ease";
  details.style.transition = "opacity 350ms ease";

  // 1️⃣ Do NOT fade wrapper
buttonsWrap.style.opacity = "1";

// 2️⃣ Stagger animate buttons
const buttons = buttonsWrap.querySelectorAll(".algo-btn");

buttons.forEach((btn, i) => {
  setTimeout(() => {
    btn.classList.add("btn-show");
  }, i * 90);
});

// 3️⃣ After buttons finish, show details
await sleep(buttons.length * 90 + 200);

details.style.opacity = "1";
}

function deleteProcess(index) {
  processes.splice(index, 1);

  // if editing that one, reset edit mode
  if (editingIndex === index) {
    editingIndex = null;
    resetModalFields();
    document.querySelector("#processModal h3").innerText = "Add Process";
  }

  // if deleted row is before editingIndex, shift it
  if (editingIndex !== null && index < editingIndex) {
    editingIndex--;
  }

  renderProcesses();
  updateRunButtonState();
  hideResultsSection(); // because input changed
}

async function animateRankBadges(tableEl, delay = 250){
  if (!tableEl) return;

  const rows = Array.from(tableEl.querySelectorAll("tr"));

  for (const r of rows){

    const badge = r.querySelector(".rank-badge");

    if (badge){
      badge.classList.add("rank-show");
      await sleep(delay);
    }
  }
}