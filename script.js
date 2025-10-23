const sheets = {
  f1: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSSQ9Zn5aGGooGR9EuRmmMW-08_hlcYR7uB3_au3_tD94jialyB8c_olGXYpQvhf2nMnw7Yd-10IVDu/pub?output=csv",
  imsaGT3: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTcbp-Zy1fdIUZxUre2UFF7ibRCTscw1tMQ0G91rdDbTDmjKH8-MF-y1H3tJJEZxXLELIi0r_5zchBV/pub?output=csv",
  imsaLMP2: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3Sq5RbkXrtMKvVPZS8jZGZu_nN4_J7Eddy-7FmV4wo0QnG_YZb5clpx0TiqDT3DN1S56_VagmRp3P/pub?output=csv",
  indycar: "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7Gfb8BPrv0HhxptUTq6pJmjVHSYIriySGawJa5iNwV_Wz_aj_xs1SHLIZU2RCxgQErF1eXnEBkUQv/pub?output=csv",
  nascar: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSH5c-BTz-ZfoJ3Rf58Q4eU9VBvsdq0XnsA99_qJM2Bvdqaq6Ex033d5gH57SQdcOm6haTNL3xi2Koh/pub?output=csv",
  superLateModel: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTVDfTXz8FwR6oL03HzFcOwZWJf1V8srF_FHSoXZbBevqS8tV9RFFBNTaHSm4-66ViUwJ8UCkrWVCgn/pub?output=csv",
  fun: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0L2HtZ0QC3ZlIpCwOrzGVQY0cOUDGaQj2DtBNQuqvLKwQ4sLfRmAcb5LG4H9Q3D1CFkilV5QdIwge/pub?output=csv"
};

let currentSeries = "f1";
const dropdown = document.getElementById("trackSelect");
const podium = document.getElementById("podium");
const table = document.getElementById("leaderboard");

async function loadSeries(series) {
  currentSeries = series;
  document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
  document.querySelector(`.tab[data-series='${series}']`).classList.add("active");

  const response = await fetch(sheets[series]);
  const csvText = await response.text();
  const data = Papa.parse(csvText, { header: true }).data.filter(row => row.Track);

  const uniqueTracks = [...new Set(data.map(row => row.Track).filter(Boolean))];
  dropdown.innerHTML = `<option value="">Select Track</option>`;
  uniqueTracks.forEach(track => {
    dropdown.innerHTML += `<option value="${track}">${track}</option>`;
  });

  dropdown.onchange = () => showRace(data, dropdown.value, series);
  podium.innerHTML = "";
  table.innerHTML = "";
}

function showRace(data, track, series) {
  const raceRows = data.filter(row => row.Track === track);
  if (!raceRows.length) return;

  const race = raceRows[0];
  podium.innerHTML = "";
  table.innerHTML = "";

  if (series === "fun") {
    const headers = Object.keys(race);
    const rows = data.map(row =>
      `<tr>${headers.map(h => `<td>${row[h] || ""}</td>`).join("")}</tr>`
    );
    table.innerHTML = `
      <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
      ${rows.join("")}`;
    return;
  }

  const first = race["Winner"] || race["Race Winner"];
  const second = race["2nd Place"];
  const third = race["3rd Place"];

  podium.innerHTML = `
    <div class="place second">${second || ""}</div>
    <div class="place first ${race["Stage 1 Winner"] === first ? "stage1" : ""} ${race["Stage 2 Winner"] === first ? "stage2" : ""}">${first || ""}</div>
    <div class="place third">${third || ""}</div>
  `;

  const rest = Object.entries(race)
    .filter(([k, v]) => /place/i.test(k) && !["Winner", "2nd Place", "3rd Place"].includes(k))
    .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`)
    .join("");

  table.innerHTML = `
    <tr><th>Position</th><th>Driver</th></tr>
    ${rest}
  `;
}

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => loadSeries(tab.dataset.series));
});

loadSeries("f1");
