const tabsDiv = document.getElementById("tabs");
const contentDiv = document.getElementById("content");

fetch("data/times.json")
    .then(res => res.json())
    .then(data => {
        const sessions = data.sessions;

        // Get unique drivers
        const drivers = [...new Set(sessions.map(s => s.driver))];

        // Create tabs for each driver
        drivers.forEach((driver, i) => {
            const tab = document.createElement("div");
            tab.className = "tab-button" + (i === 0 ? " active" : "");
            tab.textContent = driver;
            tab.onclick = () => showDriver(driver, tab);
            tabsDiv.appendChild(tab);
        });

        // Add Leaderboard tab
        const lbTab = document.createElement("div");
        lbTab.className = "tab-button";
        lbTab.textContent = "Track Leaderboard";
        lbTab.onclick = () => showLeaderboard(lbTab, sessions);
        tabsDiv.appendChild(lbTab);

        // Show first driver by default
        showDriver(drivers[0], tabsDiv.firstChild);
    });

// Show driver lap times
function showDriver(driver, tabElement) {
    document.querySelectorAll(".tab-button").forEach(t => t.classList.remove("active"));
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
                    <td>${s.car.replace(/_/g, ' ')}</td>
                    <td>${s.track.replace(/_/g, ' ')}</td>
                    <td>${s.date}</td>
                    <td>${s.best_lap}</td>
                </tr>`;
            });

            html += "</table>";
            contentDiv.innerHTML = html;
        });
}

// Show track leaderboard
function showLeaderboard(tabElement, sessions) {
    document.querySelectorAll(".tab-button").forEach(t => t.classList.remove("active"));
    tabElement.classList.add("active");

    let html = `<label>Select Track: </label>
                <select id="trackSelect"></select>
                <div id="leaderboardContent" style="margin-top:15px;"></div>`;
    contentDiv.innerHTML = html;

    const trackSelect = document.getElementById("trackSelect");
    const lbContent = document.getElementById("leaderboardContent");

    const tracks = [...new Set(sessions.map(s => s.track))];
    tracks.forEach(track => {
        const option = document.createElement("option");
        option.value = track;
        option.textContent = track.replace(/_/g, ' ');
        trackSelect.appendChild(option);
    });

    trackSelect.onchange = () => renderLeaderboard(trackSelect.value, lbContent, sessions);
    renderLeaderboard(tracks[0], lbContent, sessions);
}

function renderLeaderboard(track, container, sessions) {
    const trackSessions = sessions
        .filter(s => s.track === track)
        .sort((a, b) => {
            const timeToSec = t => {
                const parts = t.split(":");
                return parseInt(parts[0])*60 + parseFloat(parts[1]);
            };
            return timeToSec(a.best_lap) - timeToSec(b.best_lap);
        });

    if (!trackSessions.length) {
        container.innerHTML = "<p>No lap times for this track.</p>";
        return;
    }

    let html = `<table>
        <tr><th>Pos</th><th>Driver</th><th>Car</th><th>Best Lap</th></tr>`;

    trackSessions.forEach((s, i) => {
        html += `<tr class="${i===0?'fastest':''}">
            <td>${i+1}</td>
            <td>${s.driver}</td>
            <td>${s.car.replace(/_/g, ' ')}</td>
            <td>${s.best_lap}</td>
        </tr>`;
    });

    html += "</table>";
    container.innerHTML = html;
}
