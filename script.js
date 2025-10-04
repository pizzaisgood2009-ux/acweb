async function loadLeaderboard() {
  try {
    const response = await fetch("times.json");
    const data = await response.json();

    const container = document.getElementById("leaderboard-content");
    container.innerHTML = "";

    for (const track in data) {
      const table = document.createElement("table");

      // Track name
      const caption = document.createElement("caption");
      caption.textContent = track;
      caption.style.fontSize = "1.5em";
      caption.style.margin = "10px 0";
      table.appendChild(caption);

      // Headers
      const headerRow = document.createElement("tr");
      headerRow.innerHTML = "<th>Driver</th><th>Lap Time</th>";
      table.appendChild(headerRow);

      // Sort drivers by best lap
      data[track]
        .sort((a, b) => a.time.localeCompare(b.time))
        .forEach(entry => {
          const row = document.createElement("tr");
          row.innerHTML = `<td>${entry.driver}</td><td>${entry.time}</td>`;
          table.appendChild(row);
        });

      container.appendChild(table);
    }
  } catch (error) {
    document.getElementById("leaderboard-content").textContent =
      "Error loading leaderboard.";
    console.error(error);
  }
}

document.addEventListener("DOMContentLoaded", loadLeaderboard);
