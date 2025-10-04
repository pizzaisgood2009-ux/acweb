document.addEventListener("DOMContentLoaded", async () => {
    const tableContainer = document.getElementById("leaderboard");

    try {
        const response = await fetch("times.json");
        if (!response.ok) throw new Error("Failed to load times.json");

        const data = await response.json();
        const leaderboard = data.leaderboard;

        tableContainer.innerHTML = ""; // clear old content

        // Loop through each track
        for (const track in leaderboard) {
            const trackData = leaderboard[track];

            // 🏁 Track header
            const trackSection = document.createElement("div");
            trackSection.classList.add("track-section");

            const trackHeader = document.createElement("h2");
            trackHeader.textContent = track;
            trackSection.appendChild(trackHeader);

            // 📊 Leaderboard table
            const table = document.createElement("table");
            table.classList.add("leaderboard-table");

            // Table header row
            const headerRow = document.createElement("tr");
            ["Pos", "Driver", "Car", "Best Lap"].forEach(text => {
                const th = document.createElement("th");
                th.textContent = text;
                headerRow.appendChild(th);
            });
            table.appendChild(headerRow);

            // Fill leaderboard rows
            trackData.forEach((entry, index) => {
                const row = document.createElement("tr");

                const pos = document.createElement("td");
                pos.textContent = index + 1;

                const driver = document.createElement("td");
                driver.textContent = entry.driver;

                const car = document.createElement("td");
                car.textContent = entry.car.replace(/_/g, " "); // no underscores

                const lap = document.createElement("td");
                lap.textContent = entry.best_lap;

                row.appendChild(pos);
                row.appendChild(driver);
                row.appendChild(car);
                row.appendChild(lap);
                table.appendChild(row);
            });

            trackSection.appendChild(table);
            tableContainer.appendChild(trackSection);
        }
    } catch (error) {
        console.error("Error loading times:", error);
        tableContainer.innerHTML = `<p class="error">⚠️ Error loading lap times</p>`;
    }
});
