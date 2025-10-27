const sheets = {
  fun: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0L2HtZ0QC3ZlIpCwOrzGVQY0cOUDGaQj2DtBNQuqvLKwQ4sLfRmAcb5LG4H9Q3D1CFkilV5QdIwge/pub?output=csv",
  f1: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSSQ9Zn5aGGooGR9EuRmmMW-08_hlcYR7uB3_au3_tD94jialyB8c_olGXYpQvhf2nMnw7Yd-10IVDu/pub?output=csv",
  slm: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTVDfTXz8FwR6oL03HzFcOwZWJf1V8srF_FHSoXZbBevqS8tV9RFFBNTaHSm4-66ViUwJ8UCkrWVCgn/pub?output=csv",
  lmp2: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3Sq5RbkXrtMKvVPZS8jZGZu_nN4_J7Eddy-7FmV4wo0QnG_YZb5clpx0TiqDT3DN1S56_VagmRp3P/pub?output=csv",
  gt3: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTcbp-Zy1fdIUZxUre2UFF7ibRCTscw1tMQ0G91rdDbTDmjKH8-MF-y1H3tJJEZxXLELIi0r_5zchBV/pub?output=csv",
  indycar: "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7Gfb8BPrv0HhxptUTq6pJmjVHSYIriySGawJa5iNwV_Wz_aj_xs1SHLIZU2RCxgQErF1eXnEBkUQv/pub?output=csv",
  nascar: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSH5c-BTz-ZfoJ3Rf58Q4eU9VBvsdq0XnsA99_qJM2Bvdqaq6Ex033d5gH57SQdcOm6haTNL3xi2Koh/pub?output=csv"
};

const buttons = document.querySelectorAll("#series-tabs button");
const dropdown = document.getElementById("track-dropdown");
const podium = document.getElementById("podium");
const first = document.getElementById("first-name");
const second = document.getElementById("second-name");
const third = document.getElementById("third-name");
const othersList = document.getElementById("others-list");

let currentData = [];

buttons.forEach(button => {
  button.addEventListener("click", () => {
    buttons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    const series = button.dataset.series;
    loadSheet(sheets[series]);
  });
});

function loadSheet(url) {
  fetch(url)
    .then(res => res.text())
    .then(csv => {
      const rows = csv.trim().split("\n").map(r => r.split(","));
      currentData = rows;
      populateDropdown(rows);
      podium.classList.remove("show");
      othersList.innerHTML = "";
    });
}

function populateDropdown(rows) {
  dropdown.innerHTML = '<option value="">-- Choose a track --</option>';
  const trackIndex = rows[0].findIndex(h => h.toLowerCase() === "track");
  const tracks = [...new Set(rows.slice(1).map(r => r[trackIndex]).filter(Boolean))];
  tracks.forEach(track => {
    const opt = document.createElement("option");
    opt.value = track;
    opt.textContent = track;
    dropdown.appendChild(opt);
  });
}

dropdown.addEventListener("change", () => {
  const val = dropdown.value;
  if (!val) return;
  updatePodium(val);
});

function updatePodium(trackName) {
  const header = currentData[0].map(h => h.toLowerCase());
  const trackIndex = header.indexOf("track");
  const trackRow = currentData.find(r => r[trackIndex] === trackName);
  if (!trackRow) return;

  const winnerIdx = header.findIndex(h => h.includes("race winner") || h.includes("winner"));
  const secondIdx = header.findIndex(h => h.includes("2nd"));
  const thirdIdx = header.findIndex(h => h.includes("3rd"));

  const p1 = trackRow[winnerIdx] || "";
  const p2 = trackRow[secondIdx] || "";
  const p3 = trackRow[thirdIdx] || "";

  first.textContent = p1;
  second.textContent = p2;
  third.textContent = p3;

  // Fade animation
  podium.classList.remove("show");
  setTimeout(() => podium.classList.add("show"), 100);

  renderOthers(trackRow, [winnerIdx, secondIdx, thirdIdx]);
}

function renderOthers(trackRow, topIndexes) {
  othersList.innerHTML = "";
  const header = currentData[0];
  for (let i = 0; i < header.length; i++) {
    if (i === 0 || topIndexes.includes(i)) continue;
    const title = header[i];
    const name = trackRow[i];
    if (!name || name.trim() === "") continue;
    const li = document.createElement("li");
    li.textContent = `${title}: ${name}`;
    othersList.appendChild(li);
  }
}
