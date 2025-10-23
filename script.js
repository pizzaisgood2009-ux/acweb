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
let currentSeries = "f1";

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    currentSeries = tab.dataset.series;
    loadSeries(currentSeries);
  });
});

async function loadSeries(series) {
  try {
    podium.innerHTML = "";
    table.innerHTML = "";
    dropdown.innerHTML = `<option>Loading...</option>`;

    const response = await fetch(sheets[series]);
    const text = await response.text();
    const data = Papa.parse(text, { header: true }).data.map(r => normalizeKeys(r));

    const trackColumn = findTrackColumn(data);
    if (!trackColumn) {
      dropdown.innerHTML = `<option>No track column found</option>`;
      return;
    }

    const tracks = [...new Set(data.map(r => r[trackColumn]).filter(Boolean))];
    dropdown.innerHTML = `<option value="">Select Track</option>`;
    tracks.forEach(t => dropdown.innerHTML += `<option value="${t}">${t}</option>`);

    dropdown.onchange = () => showResults(series, data, trackColumn, dropdown.value);
  } catch (err) {
    console.error(err);
    dropdown.innerHTML = `<option>Error loading sheet</option>`;
  }
}

function normalizeKeys(row) {
  const normalized = {};
  for (const key in row) normalized[key.trim().toLowerCase()] = row[key];
  return normalized;
}

function findTrackColumn(data) {
  if (!data.length) return null;
  const keys = Object.keys(data[0]);
  return keys.find(k => k.includes("track"));
}

function showResults(series, data, trackColumn, track) {
  podium.innerHTML = "";
  table.innerHTML = "";
  if (!track) return;

  const rows = data.filter(r => (r[trackColumn] || "").toLowerCase() === track.toLowerCase());
  if (!rows.length) {
    table.innerHTML = `<tr><td colspan="2">No results yet for this track.</td></tr>`;
    return;
  }

  const race = rows[0];
  if (series === "fun") {
    const headers = Object.keys(race);
    table.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>` +
      data.map(r => `<tr>${headers.map(h => `<td>${r[h] || ""}</td>`).join("")}</tr>`).join("");
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
}

function stageGlow(series, race, name) {
  if (["nascar", "slm"].includes(series)) {
    if (race["stage 1 winner"] === name) return "stage1";
    if (race["stage 2 winner"] === name) return "stage2";
  }
  return "";
}

loadSeries("f1");
