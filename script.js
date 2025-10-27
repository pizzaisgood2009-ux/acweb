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
const title = document.getElementById("series-title");
const tableHead = document.querySelector("#data-table thead");
const tableBody = document.querySelector("#data-table tbody");

// podium
const first = document.getElementById("first-name");
const second = document.getElementById("second-name");
const third = document.getElementById("third-name");

buttons.forEach(button => {
  button.addEventListener("click", () => {
    buttons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    const series = button.dataset.series;
    title.textContent = button.textContent + " Leaderboard";
    loadSheet(sheets[series]);
  });
});

function loadSheet(url) {
  fetch(url)
    .then(res => res.text())
    .then(csv => {
      const rows = csv.trim().split("\n").map(r => r.split(","));
      renderTable(rows);
      renderPodium(rows);
    })
    .catch(err => {
      console.error("Error loading CSV:", err);
      tableHead.innerHTML = "<tr><th>Error loading data</th></tr>";
      tableBody.innerHTML = "";
    });
}

function renderTable(rows) {
  tableHead.innerHTML = "";
  tableBody.innerHTML = "";

  if (rows.length === 0) return;

  const headers = rows[0];
  const headerRow = document.createElement("tr");
  headers.forEach(h => {
    const th = document.createElement("th");
    th.textContent = h;
    headerRow.appendChild(th);
  });
  tableHead.appendChild(headerRow);

  rows.slice(1).forEach(row => {
    const tr = document.createElement("tr");
    row.forEach(cell => {
      const td = document.createElement("td");
      td.textContent = cell;
      tr.appendChild(td);
    });
    tableBody.appendChild(tr);
  });
}

function renderPodium(rows) {
  // reset podium
  first.textContent = "";
  second.textContent = "";
  third.textContent = "";

  if (rows.length < 4) return;

  // find columns that likely have podium data
  const headerRow = rows[0].map(h => h.toLowerCase());
  const winnerIndex = headerRow.findIndex(h => h.includes("winner"));
  const secondIndex = headerRow.findIndex(h => h.includes("2nd"));
  const thirdIndex = headerRow.findIndex(h => h.includes("3rd"));

  if (winnerIndex === -1) return;

  // use the latest track (first data row)
  const latest = rows[1];
  first.textContent = latest[winnerIndex] || "";
  second.textContent = latest[secondIndex] || "";
  third.textContent = latest[thirdIndex] || "";
}
