let all = [];

window.addEventListener("DOMContentLoaded", () => {
  all = JSON.parse(localStorage.getItem("potholeReports") || "[]");
  renderStats(); render(all);
});

function renderStats() {
  const totalPotholes = all.reduce((s, r) => s + (r.potholeCount || 1), 0);
  document.getElementById("statReports").textContent  = all.length;
  document.getElementById("statPotholes").textContent = totalPotholes;
  document.getElementById("statPeople").textContent   = new Set(all.map(r => r.name)).size;
}

function render(list) {
  const el    = document.getElementById("reportList");
  const empty = document.getElementById("emptyState");
  document.getElementById("countBadge").textContent = list.length;
  if (!list.length) { el.innerHTML = ""; empty.classList.remove("hidden"); return; }
  empty.classList.add("hidden");
  el.innerHTML = list.map(r => {
    const n    = all.length - all.findIndex(x => x.id === r.id);
    const sev  = r.overallSev || "Moderate";
    const gps  = r.lat && r.lng;
    const cnt  = r.potholeCount || 1;
    return `
      <div class="report-row" onclick="openModal(${r.id})">
        <div class="rnum">#${n}</div>
        <img class="rthumb" src="${r.photo}" alt="pothole"/>
        <div class="rmain">
          <div class="rname">
            ${esc(r.name)}
            <span class="sev-chip ${sev}">${sev}</span>
            <span class="ph-count-tag">🕳️ ${cnt}</span>
          </div>
          <div class="raddr">📍 ${esc(r.address || "No address")}</div>
          <div class="rtime">🕐 ${esc(r.datetime || "")}</div>
        </div>
        <span class="gps-tag ${gps ? "gps-yes" : "gps-no"}">${gps ? "🛰️" : "—"}</span>
      </div>`;
  }).join("");
}

function filter() {
  const q = document.getElementById("searchInput").value.toLowerCase();
  render(all.filter(r =>
    (r.name       || "").toLowerCase().includes(q) ||
    (r.address    || "").toLowerCase().includes(q) ||
    (r.overallSev || "").toLowerCase().includes(q)
  ));
}

function openModal(id) {
  const r = all.find(x => x.id === id);
  if (!r) return;

  document.getElementById("mPhoto").src              = r.photo;
  document.getElementById("mName").textContent       = r.name;
  document.getElementById("mSev").textContent        = r.overallSev  || "—";
  document.getElementById("mRoad").textContent       = r.roadCondition || "—";
  document.getElementById("mRec").textContent        = r.recommendation || "—";
  document.getElementById("mCount").textContent      = r.potholeCount || "—";
  document.getElementById("mArea").textContent       = r.totalArea ? `${r.totalArea} cm²` : "—";
  document.getElementById("mDepth").textContent      = r.maxDepth  ? `${r.maxDepth} cm`  : "—";
  document.getElementById("mAddr").textContent       = r.address   || "—";
  document.getElementById("mTime").textContent       = r.datetime  || "—";

  // Individual potholes
  const pEl = document.getElementById("mPotholes");
  if (r.potholes && r.potholes.length) {
    pEl.innerHTML = r.potholes.map((p, i) => `
      <div style="background:#0f0f18;border:1px solid #2a2a3a;border-radius:10px;padding:10px;margin-bottom:8px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <span style="font-size:12px;font-weight:700;color:#fff;">#${i+1} ${p.position}</span>
          <span class="sev-chip ${p.severity}">${p.severity}</span>
        </div>
        <div class="meas-grid">
          <div class="meas-cell"><div class="meas-val">${p.diameter_cm}cm</div><div class="meas-lbl">⌀ Diam</div></div>
          <div class="meas-cell"><div class="meas-val">${p.area_cm2}cm²</div><div class="meas-lbl">▣ Area</div></div>
          <div class="meas-cell"><div class="meas-val">${p.depth_cm}cm</div><div class="meas-lbl">↕ Depth</div></div>
          <div class="meas-cell"><div class="meas-val">${p.perimeter_cm}cm</div><div class="meas-lbl">◯ Perim</div></div>
        </div>
      </div>
    `).join("");
  } else {
    pEl.innerHTML = "<p style='font-size:12px;color:#555;'>No individual data</p>";
  }

  const gps = document.getElementById("mGPS");
  if (r.lat && r.lng) {
    const url = `https://maps.google.com/?q=${r.lat},${r.lng}`;
    gps.textContent = `${parseFloat(r.lat).toFixed(5)}, ${parseFloat(r.lng).toFixed(5)} ↗`;
    gps.href = url;
    document.getElementById("mMapBtn").href = url;
    document.getElementById("mMapBtn").style.display = "inline-flex";
  } else {
    gps.textContent = "Not available"; gps.href = "#";
    document.getElementById("mMapBtn").style.display = "none";
  }

  document.getElementById("mDelBtn").onclick = () => deleteReport(id);
  document.getElementById("modal").classList.remove("hidden");
}

function closeModal(e) {
  if (!e || e.target === document.getElementById("modal"))
    document.getElementById("modal").classList.add("hidden");
}

function deleteReport(id) {
  if (!confirm("Delete this report?")) return;
  all = all.filter(r => r.id !== id);
  localStorage.setItem("potholeReports", JSON.stringify(all));
  document.getElementById("modal").classList.add("hidden");
  renderStats(); render(all);
}

function clearAll() {
  if (!all.length || !confirm("Delete ALL reports? Cannot undo.")) return;
  all = [];
  localStorage.setItem("potholeReports", "[]");
  renderStats(); render([]);
}

function esc(s) {
  return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
