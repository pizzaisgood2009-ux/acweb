const sheets = {
  fun: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0L2HtZ0QC3ZlIpCwOrzGVQY0cOUDGaQj2DtBNQuqvLKwQ4sLfRmAcb5LG4H9Q3D1CFkilV5QdIwge/pub?output=csv",
  f1: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSSQ9Zn5aGGooGR9EuRmmMW-08_hlcYR7uB3_au3_tD94jialyB8c_olGXYpQvhf2nMnw7Yd-10IVDu/pub?output=csv",
  indycar: "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7Gfb8BPrv0HhxptUTq6pJmjVHSYIriySGawJa5iNwV_Wz_aj_xs1SHLIZU2RCxgQErF1eXnEBkUQv/pub?output=csv",
  imsaGT3: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTcbp-Zy1fdIUZxUre2UFF7ibRCTscw1tMQ0G91rdDbTDmjKH8-MF-y1H3tJJEZxXLELIi0r_5zchBV/pub?output=csv",
  imsaLMP2: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3Sq5RbkXrtMKvVPZS8jZGZu_nN4_J7Eddy-7FmV4wo0QnG_YZb5clpx0TiqDT3DN1S56_VagmRp3P/pub?output=csv",
  nascar: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSH5c-BTz-ZfoJ3Rf58Q4eU9VBvsdq0XnsA99_qJM2Bvdqaq6Ex033d5gH57SQdcOm6haTNL3xi2Koh/pub?output=csv",
  slm: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTVDfTXz8FwR6oL03HzFcOwZWJf1V8srF_FHSoXZbBevqS8tV9RFFBNTaHSm4-66ViUwJ8UCkrWVCgn/pub?output=csv",
};

const dropdown = document.getElementById("trackSelect");
const podium = document.getElementById("podium");
const table = document.getElementById("leaderboard");
const loader = document.getElementById("loader");
const statusText = document.getElementById("trackStatus");

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", async () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    await loadSeries(tab.dataset.series);
  });
});

async function loadSeries(series) {
  showLoader();
  clearAll();
  statusText.textContent = `Loading ${series.toUpperCase()} tracks...`;

  try {
    const url = sheets[series] + "?v=" + Date.now();
    const res = await fetch(url);
    const raw = await res.text();
    const clean = sliceFromRealHeader(raw);

    const data = Papa.parse(clean, {
      header: true,
      skipEmptyLines: true,
      transformHeader: h => h.trim().toLowerCase(),
    }).data
      .map(normalizeKeys)
      .filter(rowHasAnyValue);

    const trackCol = findColumn(data, ["track", "race", "circuit", "venue"]);
    if (!trackCol) {
      dropdown.innerHTML = `<option>No track column found</option>`;
      statusText.textContent = `⚠️ No track column found`;
      hideLoader();
      return;
    }

    const tracks = [...new Set(data.map(r => r[trackCol]).filter(Boolean))];
    if (!tracks.length) {
      dropdown.innerHTML = `<option>No tracks yet</option>`;
      statusText.textContent = `0 tracks available`;
      hideLoader();
      return;
    }

    dropdown.innerHTML = `<option value="">Select Track</option>` +
      tracks.map(t => `<option value="${t}">${t}</option>`).join("");

    statusText.textContent = `${tracks.length} tracks available`;
    dropdown.onchange = () => showResults(series, data, trackCol, dropdown.value);
  } catch (err) {
    console.error(err);
    dropdown.innerHTML = `<option>Error loading</option>`;
    statusText.textContent = `Error loading ${series}`;
  } finally {
    hideLoader();
  }
}

// --- Utilities ---

function sliceFromRealHeader(text) {
  const lines = text.replace(/\r/g, "").split("\n");
  const idx = lines.findIndex(line => {
    const cells = line.split(",").map(c => cleanKey(c));
    return cells.some(c => c.includes("track") || c.includes("race") || c.includes("circuit") || c.includes("venue"));
  });
  return idx >= 0 ? lines.slice(idx).join("\n") : text;
}

function cleanKey(s) {
  return String(s || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[_\s]+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeKeys(row) {
  const out = {};
  for (const key in row) out[cleanKey(key)] = typeof row[key] === "string" ? row[key].trim() : row[key];
  return out;
}

function rowHasAnyValue(row) {
  return Object.values(row).some(v => v && String(v).trim() !== "");
}

function findColumn(data, keywords) {
  if (!data.length) return null;
  const keys = Object.keys(data[0]);
  return keys.find(k => keywords.some(w => k.includes(w))) || null;
}

// --- Display logic ---

function showResults(series, data, trackCol, track) {
  clearResults();
  if (!track) return;
  showLoader();

  const rows = data.filter(r => (r[trackCol] || "").toLowerCase() === track.toLowerCase());
  if (!rows.length) {
    table.innerHTML = `<tr><td colspan="2">No results yet for ${track}</td></tr>`;
    hideLoader();
    return;
  }

  const race = rows[0];

  // Fun Races - full table
  if (series === "fun") {
    const headers = Object.keys(race);
    table.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>` +
      data.map(r => `<tr>${headers.map(h => `<td>${r[h] || ""}</td>`).join("")}</tr>`).join("");
    hideLoader();
    return;
  }

  const first = pickFirst(race, [["winner"], ["race winner"]]);
  const second = pickFirst(race, [["2nd place"]]);
  const third = pickFirst(race, [["3rd place"]]);

  podium.innerHTML = `
    <div class="place second">${second || ""}</div>
    <div class="place first ${stageGlow(series, race, first)}">${first || ""}</div>
    <div class="place third">${third || ""}</div>
  `;

  const rest = Object.entries(race)
    .filter(([k, v]) => k.includes("place") && !["2nd place", "3rd place"].includes(k) && v && v.trim() !== "")
    .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`)
    .join("");

  if (rest) table.innerHTML = `<tr><th>Position</th><th>Driver</th></tr>${rest}`;
  hideLoader();
}

function pickFirst(row, groups) {
  for (const group of groups) {
    const key = Object.keys(row).find(k => group.some(word => k.includes(word)));
    if (key && row[key]) return row[key];
  }
  return "";
}

function stageGlow(series, race, name) {
  if (!name) return "";
  if (["nascar", "slm"].includes(series)) {
    const s1 = race["stage 1 winner"], s2 = race["stage 2 winner"];
    if (s1 && s1.trim() === name.trim()) return "stage1";
    if (s2 && s2.trim() === name.trim()) return "stage2";
  }
  return "";
}

// --- UI Helpers ---

function clearAll() { dropdown.innerHTML = ""; clearResults(); }
function clearResults() { podium.innerHTML = ""; table.innerHTML = ""; }
function showLoader() { loader && loader.classList.remove("hidden"); }
function hideLoader() { loader && loader.classList.add("hidden"); }

loadSeries("f1");
