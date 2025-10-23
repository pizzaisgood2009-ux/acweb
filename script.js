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

// create the red “loading tracks…” and count element
let statusText = document.getElementById("trackStatus");
if (!statusText) {
  statusText = document.createElement("p");
  statusText.id = "trackStatus";
  statusText.style.color = "#ff1e1e";
  statusText.style.fontSize = "14px";
  statusText.style.marginTop = "-10px";
  dropdown.insertAdjacentElement("afterend", statusText);
}

// ------------------------ TAB SWITCHING ------------------------
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", async () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    await loadSeries(tab.dataset.series);
  });
});

// ------------------------ LOAD SERIES ------------------------
async function loadSeries(series) {
  showLoader();
  clearAll();
  statusText.textContent = `Loading ${series.toUpperCase()} tracks...`;

  try {
    const cacheBuster = `?v=${Date.now()}`;
    const url = sheets[series] + cacheBuster;
    const response = await fetch(url);
    const text = await response.text();
    const data = Papa.parse(text, { header: true }).data.map(r => normalizeKeys(r));

    const trackColumn = findTrackColumn(data);
    if (!trackColumn) {
      dropdown.innerHTML = `<option>No track column found</option>`;
      statusText.textContent = `⚠️ No track column detected for ${series.toUpperCase()}`;
      hideLoader();
      return;
    }

    const tracks = [...new Set(data.map(r => r[trackColumn]).filter(Boolean))];
    if (!tracks.length) {
      dropdown.innerHTML = `<option>No tracks yet</option>`;
      statusText.textContent = `0 tracks available`;
      hideLoader();
      return;
    }

    dropdown.innerHTML = `<option value="">Select Track</option>`;
    tracks.forEach(t => dropdown.innerHTML += `<option value="${t}">${t}</option>`);
    statusText.textContent = `${tracks.length} tracks available`;

    dropdown.onchange = () => showResults(series, data, trackColumn, dropdown.value);
  } catch (err) {
    console.error("Error loading:", series, err);
    dropdown.innerHTML = `<option>Error loading ${series}</option>`;
    statusText.textContent = `Error loading ${series}`;
  } finally {
    hideLoader();
  }
}

// ------------------------ HELPER FUNCTIONS ------------------------
function normalizeKeys(row) {
  const normalized = {};
  for (const key in row) {
    const cleanKey = key
      .replace(/[\u200B-\u200D\uFEFF]/g, "")   // remove hidden Unicode spaces
      .replace(/[_\s]+/g, " ")                // replace underscores and extra spaces
      .trim()
      .toLowerCase();
    normalized[cleanKey] = row[key];
  }
  return normalized;
}

function findTrackColumn(data) {
  if (!data.length) return null;
  const keys = Object.keys(data[0]);
  // detect any column resembling a track name
  return keys.find(k =>
    k.includes("track") ||
    k.includes("race") ||
    k.includes("circuit") ||
    k.includes("venue")
  ) || null;
}

function showResults(series, data, trackColumn, track) {
  clearResults();
  if (!track) return;

  showLoader();
  const rows = data.filter(r => (r[trackColumn] || "").toLowerCase() === track.toLowerCase());
  if (!rows.length) {
    table.innerHTML = `<tr><td colspan="2">No results yet for ${track}</td></tr>`;
    hideLoader();
    return;
  }

  const race = rows[0];
  if (series === "fun") {
    const headers = Object.keys(race);
    table.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>` +
      data.map(r => `<tr>${headers.map(h => `<td>${r[h] || ""}</td>`).join("")}</tr>`).join("");
    hideLoader();
    return;
  }

  const first = race["winner"] || race["race winner"];
  const second = race["2nd place"];
  const third = race["3rd place"];

  podium.innerHTML = `
    <div class="place second">${second || ""}</div>
    <div class="place first ${stageGlow(series, race, first)}">${first || ""}</div>
    <div class="place third">${third || ""}</div>
  `;

  const rest = Object.entries(race)
    .filter(([k]) => k.includes("place") && !["winner", "race winner", "2nd place", "3rd place"].includes(k))
    .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`)
    .join("");

  table.innerHTML = `<tr><th>Position</th><th>Driver</th></tr>${rest}`;
  hideLoader();
}

function stageGlow(series, race, name) {
  if (["nascar", "slm"].includes(series)) {
    if (race["stage 1 winner"] === name) return "stage1";
    if (race["stage 2 winner"] === name) return "stage2";
  }
  return "";
}

function clearAll() {
  dropdown.innerHTML = "";
  clearResults();
}

function clearResults() {
  podium.innerHTML = "";
  table.innerHTML = "";
}

function showLoader() { loader.classList.remove("hidden"); }
function hideLoader() { loader.classList.add("hidden"); }


