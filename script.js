async function fetchCSV(url) {
  const res = await fetch(url);
  const text = await res.text();
  return parseCSV(text);
}

function parseCSV(csv) {
  const lines = csv.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i]]));
  });
  return rows;
}

function timeToSeconds(time) {
  const [min, sec] = time.split(":").map(Number);
  return min * 60 + sec;
}

function groupByTrack(data) {
  const tracks = {};
  data.forEach(row => {
    const track = row.Track || row.track;
    if (!tracks[track]) tracks[track] = [];
    tracks[track].push(row);
  });
  return tracks;
}

function createLeaderboard(tracks) {
  const container = document.getElementById("leaderboards");
  container.innerHTML = "";

  Object.keys(tracks).forEach(track => {
    const section = document.createElement("div");
    section.classList.add("track-section");

    const title = document.createElement("h2");
    title.classList.add("track-name");
    title.textContent = track;
    section.appendChild(title);

    const table = document.createElement("table");
    const headerRow = `
      <tr>
        <th>Position</th>
        <th>Car</th>
        <th>Fastest Lap</th>
        <th>Race Winner</th>
      </tr>`;
    table.innerHTML = headerRow;

    const sorted = tracks[track].sort((a, b) => timeToSeconds(a["Fastest Lap"]) - timeToSeconds(b["Fastest Lap"]));

    sorted.forEach((row, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${row.Car}</td>
        <td>${row["Fastest Lap"]}</td>
        <td>${row["Race Winner"]}</td>
      `;
      table.appendChild(tr);
    });

    section.appendChild(table);
    container.appendChild(section);
  });
}

(async function init() {
  const data = await fetchCSV(SHEET_URL);
  const grouped = groupByTrack(data);
  createLeaderboard(grouped);
})();
