const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0L2HtZ0QC3ZlIpCwOrzGVQY0cOUDGaQj2DtBNQuqvLKwQ4sLfRmAcb5LG4H9Q3D1CFkilV5QdIwge/pub?output=csv";

let allData = [];
let tracks = [];

async function fetchSheetData() {
  const response = await fetch(SHEET_URL);
  const csvText = await response.text();
  const rows = csvText.trim().split("\n").map(r => r.split(","));
  const headers = rows[0].map(h => h.trim());
  const data = rows.slice(1).map(r => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = (r[i] || "").trim() || "—";
    });
    return obj;
  });

  allData = data;
  tracks = [...new Set(data.map(d => d["Track"]).filter(t => t && t !== "—"))];
  populateTrackDropdown();
}

function populateTrackDropdown() {
  const select = document.getElementById("trackSelect");
  select.innerHTML = `<option value="">Select a Track</option>` + 
    tracks.map(track => `<option value="${track}">${track}</option>`).join("");
}

function parseLapTime(time) {
  const match = time.match(/^(\d+):(\d+\.\d+)$/);
  if (!match) return Infinity;
  return parseInt(match[1]) * 60 + parseFloat(match[2]);
}

function renderLeaderboard(track) {
  const container = document.getElementById("leaderboardContainer");
  container.innerHTML = "";

  const filtered = allData.filter(d => d["Track"] === track);

  if (filtered.length === 0) {
    container.innerHTML = `<p class="no-data">No results yet for ${track}.</p>`;
    return;
  }

  filtered.sort((a, b) => parseLapTime(a["Fastest Lap"]) - parseLapTime(b["Fastest Lap"]));

  const table = document.createElement("table");
  table.className = "leaderboard";

  table.innerHTML = `
    <thead>
      <tr>
        <th>Position</th>
        <th>Car</th>
        <th>Fastest Lap</th>
        <th>Race Winner</th>
        <th>Date</th>
      </tr>
    </thead>
    <tbody>
      ${filtered.map((d, i) => `
        <tr class="${i === 0 ? 'first' : i === 1 ? 'second' : i === 2 ? 'third' : ''} ${d['Race Winner'] !== '—' ? 'winner-row' : ''}">
          <td>${i + 1}</td>
          <td>${d["Car"]}</td>
          <td>${d["Fastest Lap"]}</td>
          <td>${d["Race Winner"]}</td>
          <td>${d["Date"]}</td>
        </tr>
      `).join("")}
    </tbody>
  `;

  container.appendChild(table);
}

document.getElementById("trackSelect").addEventListener("change", e => {
  const track = e.target.value;
  if (track) renderLeaderboard(track);
  else document.getElementById("leaderboardContainer").innerHTML = "";
});

fetchSheetData();
