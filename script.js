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
    const response = await fetch(url);
    const text = await response.text();
    const data = Papa.parse(text, { header: true }).data.map(normalizeKeys);

    const trackCol = findColumn(data, ["track"]);
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

    dropdown.innerHTML = `<option value="">Select Track</option>`;
    tracks.forEach(t => dropdown.innerHTML += `<option value="${t}">${t}</option>`);
    statusText.textContent = `${tracks.length} tracks available`;
    dropdown.onchange = () => showResults(series, data, trackCol, dropdown.value);
  } catch (e) {
    console.error(e);
    statusText.textContent = `Error loading ${series}`;
  } finally {
    hideLoader();
  }
}

function normalizeKeys(row) {
  const normalized = {};
  for (const key in row) {
    const cleanKey = key
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/[_\s]+/g, " ")
      .trim()
      .toLowerCase();
    normalized[cleanKey] = row[key];
  }
  return normalized;
}

function findColumn(data, keywords) {
  if (!data.length) return null;
  const keys = Object.keys(data[0]);
  return keys.find(k => keywords.some(word => k.includes(word))) || null;
}

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

  // FUN RACES - show full table
  if (series === "fun") {
    const headers = Object.keys(race);
    table.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>` +
      data.map(r => `<tr>${headers.map(h => `<td>${r[h] || ""}</td>`).join("")}</tr>`).join("");
    hideLoader();
    return;
  }

  // FIND PODIUM ENTRIES FOR EACH SERIES
  const first = race["winner"] || race["race winner"];
  const second = race["2nd place"];
  const third = race["3rd place"];
  const fourth = race["4th place"];
  const fifth = race["5th place"];

  podium.innerHTML = `
    <div class="place second">${second || ""}</div>
    <div class="place first ${stageGlow(series, race, first)}">${first || ""}</div>
    <div class="place third">${third || ""}</div>
  `;

  // NASCAR / SLM stage highlight
  const stage1 = race["stage 1 winner"];
  const stage2 = race["stage 2 winner"];
  if (["nascar", "slm"].includes(series)) {
    if (stage1 && first && stage1 === first) document.querySelector(".first").classList.add("stage1");
    if (stage2 && first && stage2 === first) document.querySelector(".first").classList.add("stage2");
  }

  // REST OF RESULTS TABLE
  const restPositions = Object.entries(race)
    .filter(([k]) => k.includes("place") && !["2nd place", "3rd place"].includes(k))
    .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`)
    .join("");

  if (restPositions) {
    table.innerHTML = `<tr><th>Position</th><th>Driver</th></tr>${restPositions}`;
  }

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

loadSeries("f1");
