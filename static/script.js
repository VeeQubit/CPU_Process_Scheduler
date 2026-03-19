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
let modalErrorShown = false;   // ✅ show errors only after Submit clicked
let isAnimatingSummary = false;

// ---------- PROCESS STORAGE ----------
let processes = [];
let processCounter = 1;

// ---------- MODAL ----------
function openModal() {
  document.getElementById("processModal").classList.remove("hidden");

  if (editingIndex === null) {
    resetModalFields();
    document.querySelector("#processModal h3").innerText = "Add Process";
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
  if (priorityStr === "") {
    errors.push("Priority is required");
    priorityEl.classList.add("input-error");
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
  const priority = parseInt(priorityStr, 10);

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
  if (isNaN(priority) || priority <= 0) {
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
      color: generateColor()
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

  if (isAnimatingSummary) return;
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
  .then(res => {

    globalResults = res.results;
    bestAlgos = res.best;

    showResultsSection();

    // reset algorithm section
    document.getElementById("algorithmSection").classList.add("hidden");
    document.getElementById("details").classList.add("hidden");
    document.getElementById("algoButtons").innerHTML = "";
    document.getElementById("showAlgoBtn").classList.add("hidden");

    // 🔹 Build summary first
   // 🔹 Scroll FIRST
   // 🔹 Scroll and wait properly before animation
const heading = document.getElementById("resultsHeading");

if (heading) {

  heading.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  const waitForScroll = () => {
    const rect = heading.getBoundingClientRect();

    if (Math.abs(rect.top) < 5) {
      buildSummary();
    } else {
      requestAnimationFrame(waitForScroll);
    }
  };

  requestAnimationFrame(waitForScroll);
}

  })
  .catch(() => alert("Backend error. Check Flask console."));
}
// ---------- SUMMARY ----------
// ✅ REPLACE your buildSummary() with this updated one
function buildSummary() {

  if (isAnimatingSummary) return;
  isAnimatingSummary = true;
  const summary = document.getElementById("summaryTable");

  summary.innerHTML = `
    <div class="summary-layout">
      <div class="summary-left">
        <table class="summary-table">
          <tr>
            <th>Algorithm</th>
            <th>Avg WT</th>
            <th>Avg TAT</th>
            <th>Context Switches</th>
          </tr>
        </table>
      </div>

      <div class="summary-right">
        <div id="bestText" class="best-text"></div>
       
      </div>
    </div>
  `;
  summary.classList.add("summary-animating"); // ✅ hide rows instantly (no sudden show)
  summary.classList.add("prebest"); 

  const table = summary.querySelector("table");

  for (let algo in globalResults) {
    const data = globalResults[algo];
    const gantt = data[0];
    const processTable = data[1];

    let totalTAT = 0;
    processTable.forEach(p => totalTAT += p.tat);

    const avg_tat = (totalTAT / processTable.length).toFixed(2);
    const avg_wt = (data[2]).toFixed(2);
    const context_switches = countContextSwitches(gantt);

    const isBest = bestAlgos.includes(algo);
    const className = isBest ? "best-row" : "";

    const badge = isBest ? `<span class="best-badge">Best</span>` : "";

    table.innerHTML += `
      <tr class="${className}">
        <td>${algo} ${badge}</td>
        <td>${avg_wt}</td>
        <td>${avg_tat}</td>
        <td>${context_switches}</td>
      </tr>
    `;
  }

    const bestText = document.getElementById("bestText");

  // ✅ Build the right-side card HTML but DON'T show yet
  const reason = (bestAlgos.length === 1) ? "Best overall performance" : "Tie between algorithms";
  let bestHTML = "";

  if (bestAlgos.length === 1) {
    const a = bestAlgos[0];

    const wt = (globalResults[a][2]).toFixed(2);

    const t = globalResults[a][1];
    let totalTAT = 0;
    t.forEach(p => totalTAT += p.tat);
    const tat = (totalTAT / t.length).toFixed(2);

    bestHTML = `
      <div class="best-card best-enter">
        <div class="best-card-top">
          <span class="best-chip">🏆 BEST</span>
          <span class="best-sub">${reason}</span>
        </div>

        <div class="best-title">${fullNames[a]}</div>
        <div class="best-code">${a}</div>

        <div class="best-metrics">
          <div class="best-metric">
            <div class="best-metric-label">Avg WT</div>
            <div class="best-metric-value">${wt}</div>
          </div>
          <div class="best-metric">
            <div class="best-metric-label">Avg TAT</div>
            <div class="best-metric-value">${tat}</div>
          </div>
        </div>
      </div>
    `;
  } else {
    const rows = bestAlgos.map(a => {
      const wt = (globalResults[a][2]).toFixed(2);

      const t = globalResults[a][1];
      let totalTAT = 0;
      t.forEach(p => totalTAT += p.tat);
      const tat = (totalTAT / t.length).toFixed(2);

      return `
        <div class="best-item best-item-multi">
          <div class="best-item-left">
            <div class="best-item-name">${fullNames[a]}</div>
            <div class="best-item-code">${a}</div>
          </div>

          <div class="best-item-metrics">
            <div class="mini-metric">
              <div class="mini-label">Avg WT</div>
              <div class="mini-value">${wt}</div>
            </div>
            <div class="mini-metric">
              <div class="mini-label">Avg TAT</div>
              <div class="mini-value">${tat}</div>
            </div>
          </div>
        </div>
      `;
    }).join("");

    bestHTML = `
       <div class="best-card best-enter">
        <div class="best-card-top">
          <span class="best-chip">🏆 BEST</span>
          <span class="best-sub">${reason}</span>
        </div>

        <div class="best-title">Multiple Algorithms</div>
        <div class="best-code">${bestAlgos.join(" • ")}</div>

        <div class="best-list">
          ${rows}
        </div>
      </div>
    `;
  }

  // ✅ keep right side empty until animation ends
  bestText.innerHTML = "";

  // ✅ run animation sequence
  requestAnimationFrame(async () => {

    // 1) heading letters
    await animateLetters(document.getElementById("resultsHeading"), 85);

    // 2) table rows appear one by one
    await animateTableRows(summary.querySelector(".summary-table"), 320);

    // 3) best rows pulse one by one
    await animateBestRows(summary.querySelector(".summary-table"), 850);

    summary.classList.remove("prebest");
    // 4) show right side last
    bestText.innerHTML = bestHTML;
    await sleep(20);
    await revealRightCard();
    summary.classList.remove("summary-animating"); 

    // ✅ Show Algorithms button after summary finishes
const algoBtn = document.getElementById("showAlgoBtn");
algoBtn.classList.remove("hidden");

// smooth appear
algoBtn.style.opacity = 0;
algoBtn.style.transform = "translateY(10px)";
requestAnimationFrame(() => {
  algoBtn.style.transition = "all 0.6s ease";
  algoBtn.style.opacity = 1;
  algoBtn.style.transform = "translateY(0)";
});
    // ✅ hide details initially
    document.getElementById("details").classList.add("hidden");// ✅ ADD THIS LAST
    isAnimatingSummary = false;  // ✅ unlock animation  
  });
}


// ---------- BUTTONS ----------
function buildButtons() {
  const container = document.getElementById("algoButtons");
  container.innerHTML = "";

  for (let algo in globalResults) {
    const isBest = bestAlgos.includes(algo);

    container.innerHTML += `
      <button 
        class="algo-btn ${isBest ? "algo-best" : ""}"
        onclick="activateAlgorithm('${algo}')">
        ${algo}
      </button>
    `;
  }
}

function activateAlgorithm(algo) {
  setActiveButton(algo);
  const details = document.getElementById("details");
  details.classList.remove("hidden");
  showDetails(algo);
  details.scrollIntoView({ behavior: "smooth", block: "start" });
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
  const gantt = data[0];
  const table = data[1];

  const details = document.getElementById("details");

  let totalWT = 0;
  let totalTAT = 0;

  table.forEach(p => {
    totalWT += p.wt;
    totalTAT += p.tat;
  });

  const avgWT = (totalWT / table.length).toFixed(2);
  const avgTAT = (totalTAT / table.length).toFixed(2);

  const firstStart = gantt[0][1];
  const lastEnd = gantt[gantt.length - 1][2];
  const totalTime = lastEnd - firstStart;

  const throughput = (table.length / totalTime).toFixed(2);

  let idleTime = 0;
  gantt.forEach(block => {
    if (block[0] === "Idle")
      idleTime += (block[2] - block[1]);
  });

  const cpuUtil =
    (((totalTime - idleTime) / totalTime) * 100).toFixed(2);

  details.innerHTML = `
    <h3>Gantt Chart</h3>
    <div class="gantt" id="ganttChart"></div>

    <div class="bottom-layout">

      <table class="result-table">
        <tr>
          <th>PID</th>
          <th>Arrival</th>
          <th>Burst</th>
          <th>Waiting</th>
          <th>Turnaround</th>
        </tr>
        ${table.map(p => `
          <tr>
            <td>${p.pid}</td>
            <td>${p.arrival}</td>
            <td>${p.burst}</td>
            <td>${p.wt}</td>
            <td>${p.tat}</td>
          </tr>
        `).join("")}
      </table>

      <div class="stats-section">
        <div class="stat-box">
          <div>Avg WT</div>
          <div>${avgWT}</div>
        </div>
        <div class="stat-box">
          <div>Avg TAT</div>
          <div>${avgTAT}</div>
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

  gantt.forEach(block => {
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
    ganttDiv.appendChild(blockDiv);
  });
}

// ---------- COLORS ----------
function generateColor() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 65%, 55%)`;
}

function getColor(pid) {
  return processes.find(p => p.pid === pid)?.color || "#888";
}

// ---------- CONTEXT SWITCH ----------
function countContextSwitches(gantt) {
  let cs = 0;
  let prev = null;

  for (const block of gantt) {
    const pid = block[0];
    if (pid === "Idle") continue;

    if (prev !== null && pid !== prev) cs++;
    prev = pid;
  }
  return cs;
}

function editProcess(index) {

  const p = processes[index];

  editingIndex = index;

  document.getElementById("mArrival").value = p.arrival;
  document.getElementById("mBurst").value = p.burst;
  document.getElementById("mPriority").value = p.priority;

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

  // ✅ store original text only once
  if (!el.dataset.originalText) {
    el.dataset.originalText = el.textContent.trim();
  }

  const text = el.dataset.originalText;

  // reset to pure text first
  el.textContent = text;
  el.classList.remove("typewriter");

  // clear again to start animation
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
    r.classList.add("row-reveal"); // CSS will animate to visible
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

document.addEventListener("DOMContentLoaded", () => {

  // Initial render
  renderProcesses();
  updateRunButtonState();
  hideResultsSection();

  // ==============================
  // Modal outside click clear
  // ==============================
  const modal = document.getElementById("processModal");
  const modalContent = document.querySelector(".modal-content");

  if (modal && modalContent) {
    modal.addEventListener("click", (e) => {
      if (!modalContent.contains(e.target)) {
        clearModalErrors();
      }
    });
  }

  // ==============================
  // Live validation
  // ==============================
  ["mArrival", "mBurst", "mPriority"].forEach(id => {

    const el = document.getElementById(id);
    if (!el) return;

    const handler = () => {

      if (!modalErrorShown) {
        if (el.value.trim() !== "") {
          el.classList.remove("input-error");
        }
        return;
      }

      if (el.value.trim() !== "") {
        el.classList.remove("input-error");
      }

      const a = document.getElementById("mArrival").value.trim();
      const b = document.getElementById("mBurst").value.trim();
      const p = document.getElementById("mPriority").value.trim();

      const err = document.getElementById("modalError");
      if (!err) return;

      let missing = [];
      if (a === "") missing.push("Arrival Time is required");
      if (b === "") missing.push("Burst Time is required");
      if (p === "") missing.push("Priority is required");

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

  // ==============================
  // Algorithms Button Click Logic
  // ==============================
  const showAlgoBtn = document.getElementById("showAlgoBtn");

  if (showAlgoBtn) {
    showAlgoBtn.addEventListener("click", () => {

      const section = document.getElementById("algorithmSection");

      if (!section) return;

      // Show algorithm section
      section.classList.remove("hidden");

      // Smooth animation
      section.style.opacity = 0;
      section.style.transform = "translateY(20px)";

      requestAnimationFrame(() => {
        section.style.transition = "all 0.7s ease";
        section.style.opacity = 1;
        section.style.transform = "translateY(0)";
      });

      // Build algorithm buttons now
      buildButtons();

      // Hide main Algorithms button
      showAlgoBtn.classList.add("hidden");

      // Scroll to algorithm section
      section.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  }

});
