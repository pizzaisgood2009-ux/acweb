document.addEventListener("DOMContentLoaded", async () => {
    const leaderboardTab = document.getElementById("leaderboard");
    const driverTabsContainer = document.getElementById("driver-tabs");
    const driversContainer = document.getElementById("drivers");

    try {
        const response = await fetch("times.json");
        if (!response.ok) throw new Error("Failed to load times.json");

        const data = await response.json();
        const leaderboard = data.leaderboard;

        // Utility: clean up names
        function cleanName(name) {
            return name.replace(/_/g, " ")
                       .replace(/\b\w/g, c => c.toUpperCase());
        }

        // Collect unique drivers
        const drivers = new Set();
        for (const track in leaderboard) {
            leaderboard[track].forEach(entry => drivers.add(entry.driver));
        }

        // Create driver tabs
        drivers.forEach(driver => {
            const btn = document.createElement("button");
            btn.className = "tab-button";
            btn.textContent = driver;
            btn.dataset.tab = `driver-${driver}`;
            driverTabsContainer.appendChild(btn);

            const content = document.createElement("div");
            content.id = `driver-${driver}`;
            content.className = "tab-content";
            content.innerHTML = `<h2>${driver}'s Best Laps</h2>`;
            driversContainer.appendChild(content);
        });

        // Leaderboard (per track)
        leaderboardTab.innerHTML = "";
        for (const track in leaderboard) {
            const trackData = leaderboard[track];
            const section = document.createElement("div");
            section.className = "track-section";

            section.innerHTML = `<h2>${cleanName(track)}</h2>`;
            const table = document.createElement("table");

            const headerRow = document.createElement("tr");
            ["Pos", "Driver", "Car", "Best Lap"].forEach(h => {
                const th = document.createElement("th");
                th.textContent = h;
                headerRow.appendChild(th);
            });
            table.appendChild(headerRow);

            trackData.forEach((entry, index) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${entry.driver}</td>
                    <td>${cleanName(entry.car)}</td>
                    <td>${entry.best_lap}</td>
                `;
                table.appendChild(row);

                // Add to driver's tab
                const driverContent = document.getElementById(`driver-${entry.driver}`);
                if (driverContent) {
                    if (!driverContent.querySelector("table")) {
                        const driverTable = document.createElement("table");
                        driverTable.innerHTML = `
                            <tr><th>Track</th><th>Car</th><th>Best Lap</th></tr>
                        `;
                        driverContent.appendChild(driverTable);
                    }
                    const driverTable = driverContent.querySelector("table");
                    const driverRow = document.createElement("tr");
                    driverRow.innerHTML = `
                        <td>${cleanName(track)}</td>
                        <td>${cleanName(entry.car)}</td>
                        <td>${entry.best_lap}</td>
                    `;
                    driverTable.appendChild(driverRow);
                }
            });

            section.appendChild(table);
            leaderboardTab.appendChild(section);
        }

        // Tab switching
        const tabs = document.querySelectorAll(".tab-button");
        const contents = document.querySelectorAll(".tab-content");

        tabs.forEach(tab => {
            tab.addEventListener("click", () => {
                tabs.forEach(t => t.classList.remove("active"));
                contents.forEach(c => c.classList.remove("active"));
                tab.classList.add("active");
                document.getElementById(tab.dataset.tab).classList.add("active");
            });
        });

        // Default = leaderboard
        document.querySelector('.tab-button[data-tab="leaderboard"]').classList.add("active");
        document.getElementById("leaderboard").classList.add("active");

    } catch (err) {
        console.error("Error loading times:", err);
        leaderboardTab.innerHTML = `<p class="error">⚠️ Error loading lap times</p>`;
    }
});
