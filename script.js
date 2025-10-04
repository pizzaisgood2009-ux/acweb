const tabsDiv = document.getElementById("tabs");
const contentDiv = document.getElementById("content");

fetch("data/times.json")
  .then(res => res.json())
  .then(data => {
    const sessions = data.sessions;

    // Get unique drivers
    const drivers = [...new Set(sessions.map(s => s.driver))];

    // Create driver tabs
    drivers.forEach((driver, i) => {
      const tab = document.createElement("div");
      tab.className = "tab" + (i === 0 ? " active" : "");
      tab.textContent = driver;
      tab.onclick = () => showDriver(driver, tab);
      tabsDiv.appendChild(tab);
    });

    // Track leaderboard tab
    const lbTab = document.createElement("div");
    lbTab.className = "tab";
    lbTab.textContent = "Track Leaderboard";
    lbTab.onclick = () => showLeaderboard(lbTab, sessions);
    tabsDiv.appendChild(lbTab);

    // Show first driver by default
    showDriver(drivers[0], tabsDiv.firstChild);
  });

// --- Show driver laps ---
function showDriver(driver, tabElement) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  tabElement.classList.add("active");

  fetch("data/times.json")
    .then(res => res.json())
    .then(data => {
      const driverSessions = data.sessions.filter(s => s.driver === driver);
      if (!driverSessions.length) {
        contentDiv.innerHTML = "<p>No lap times for this driver.</p>";
        return;
      }

      let html = `<table>
        <tr><th>Car</th><th>Track</th><th>Date</th><th>Best Lap</th></tr>`;

      driverSessions.forEach(s => {
        html += `<tr>
          <td>${cleanName(s.car)}</td>
          <td>${cleanName(s.track)}</td>
          <td>${s.date}</td>
          <td>${s.best_lap}</td>
        </tr>`;
      });

      html += "</table>";
      contentDiv.innerHTML = html;
    });
}

// --- Show leaderboard ---
function showLeaderboard(tabElement, sessions) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  tabElement.classList.add("active");

  let html = `<label style="color:red;font-weight:bold;">Select Track: </label>`;
  html += `<select id="trackSelect" style="padding:5px;font-weight:bold;"></select>`;
  html += `<div id="leaderboardContent" style="margin-top:10px;"></div>`;
  contentDiv.innerHTML = html;

  const trackSelect = document.getElementById("trackSelect");
  const lbContent = document.getElementById("leaderboardContent");

  const tracks = [...new Set(sessions.map(s => s.track))];
  tracks.forEach(track => {
    const option = document.createElement("option");
    option.value = track;
    option.textContent = cleanName(track);
    trackSelect.appendChild(option);
  });

  trackSelect.onchange = () => renderLeaderboard(trackSelect.value, lbContent, sessions);
  renderLeaderboard(tracks[0], lbContent, sessions);
}

// --- Render leaderboard ---
function renderLeaderboard(track, container, sessions) {
  const trackSessions = sessions
    .filter(s => s.track === track)
    .sort((a,b)=>lapToSeconds(a.best_lap)-lapToSeconds(b.best_lap));

  if (!trackSessions.length) {
    container.innerHTML = "<p>No laps for this track.</p>";
    return;
  }

  // Podium top 3
  let html = `<div style="display:flex; gap:20px; justify-content:center; margin-bottom:20px;">`;
  trackSessions.slice(0,3).forEach((s,i)=>{
    const colors = ["#ff0000","#ff6600","#ffff00"];
    html += `<div style="background:#111; padding:15px; border:2px solid ${colors[i]}; text-align:center; flex:1;">
      <h2>${i+1}º</h2>
      <p>${s.driver}</p>
      <p>${cleanName(s.car)}</p>
      <p>${s.best_lap}</p>
    </div>`;
  });
  html += "</div>";

  // Full table
  html += `<table><tr><th>Pos</th><th>Driver</th><th>Car</th><th>Best Lap</th></tr>`;
  trackSessions.forEach((s,i)=>{
    const cls = i===0?"fastest":"";
    html += `<tr class="${cls}"><td>${i+1}</td><td>${s.driver}</td><td>${cleanName(s.car)}</td><td>${s.best_lap}</td></tr>`;
  });
  html += "</table>";

  container.innerHTML = html;
}

// --- Helpers ---
function lapToSeconds(lap){
  if(lap==="N/A") return Infinity;
  const parts = lap.split(":");
  return parseInt(parts[0])*60+parseFloat(parts[1]);
}

function cleanName(name){
  return name.replace(/_/g," ");
}
