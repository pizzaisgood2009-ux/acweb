import os
import json
from datetime import datetime

# Paths
EXPORT_DIR = "export"
TRACKS_DIR = os.path.join(EXPORT_DIR, "tracks")
DRIVERS_DIR = os.path.join(EXPORT_DIR, "drivers")

# Make sure folders exist
os.makedirs(TRACKS_DIR, exist_ok=True)
os.makedirs(DRIVERS_DIR, exist_ok=True)

STYLE = """
<style>
    body {
        background-color: #0d0d0d;
        color: #f2f2f2;
        font-family: Arial, sans-serif;
        margin: 20px;
    }
    h1, h2 {
        color: #ff4500; /* orange-red */
        border-bottom: 2px solid #e60000;
        padding-bottom: 5px;
    }
    a {
        color: #ff3300;
        text-decoration: none;
        margin: 0 10px;
    }
    a:hover {
        color: #ff6600;
    }
    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
        background: #1a1a1a;
        border-radius: 8px;
        overflow: hidden;
    }
    th, td {
        padding: 10px;
        text-align: left;
    }
    th {
        background: #262626;
        color: #ff6600;
    }
    tr:nth-child(even) {
        background: #141414;
    }
    tr:nth-child(odd) {
        background: #1f1f1f;
    }
    .fastest {
        font-weight: bold;
        color: #00ff66; /* highlight fastest */
    }
</style>
"""

def load_times():
    """Load lap times from JSON files."""
    times = []
    for file in os.listdir(EXPORT_DIR):
        if file.endswith(".json") and not file.startswith("update"):
            with open(os.path.join(EXPORT_DIR, file), "r") as f:
                data = json.load(f)
                times.extend(data)
    return times

def format_time(ms):
    """Convert ms to mm:ss.xxx format."""
    total_seconds = ms / 1000
    minutes = int(total_seconds // 60)
    seconds = total_seconds % 60
    return f"{minutes}:{seconds:06.3f}"

def generate_driver_pages(times):
    drivers = {}
    for entry in times:
        driver = entry["driver"]
        track = entry["track"]
        lap_time = entry["lap_time"]

        if driver not in drivers:
            drivers[driver] = []
        drivers[driver].append((track, lap_time))

    for driver, laps in drivers.items():
        laps.sort(key=lambda x: x[1])  # sort fastest → slowest
        with open(os.path.join(DRIVERS_DIR, f"{driver}.html"), "w") as f:
            f.write("<html><head>" + STYLE + f"<title>{driver}</title></head><body>")
            f.write(f"<h1>{driver}</h1>")
            f.write('<a href="../index.html">🏁 Leaderboards</a>')
            f.write("<table><tr><th>Track</th><th>Best Lap</th></tr>")
            for track, lap in laps:
                f.write(f"<tr><td>{track}</td><td>{format_time(lap)}</td></tr>")
            f.write("</table></body></html>")

def generate_track_pages(times):
    tracks = {}
    for entry in times:
        track = entry["track"]
        driver = entry["driver"]
        lap_time = entry["lap_time"]

        if track not in tracks:
            tracks[track] = []
        tracks[track].append((driver, lap_time))

    for track, laps in tracks.items():
        laps.sort(key=lambda x: x[1])  # fastest → slowest
        with open(os.path.join(TRACKS_DIR, f"{track}.html"), "w") as f:
            f.write("<html><head>" + STYLE + f"<title>{track}</title></head><body>")
            f.write(f"<h1>{track} Leaderboard</h1>")
            f.write('<a href="../index.html">🏁 Leaderboards</a>')
            f.write("<table><tr><th>Pos</th><th>Driver</th><th>Lap Time</th></tr>")
            for i, (driver, lap) in enumerate(laps, 1):
                css_class = "fastest" if i == 1 else ""
                f.write(f"<tr class='{css_class}'><td>{i}</td><td>{driver}</td><td>{format_time(lap)}</td></tr>")
            f.write("</table></body></html>")

def generate_index(times):
    drivers = sorted(set(entry["driver"] for entry in times))
    tracks = sorted(set(entry["track"] for entry in times))

    with open(os.path.join(EXPORT_DIR, "index.html"), "w") as f:
        f.write("<html><head>" + STYLE + "<title>Leaderboards</title></head><body>")
        f.write("<h1>🏁 Leaderboards</h1>")
        
        f.write("<h2>Tracks</h2><ul>")
        for track in tracks:
            f.write(f"<li><a href='tracks/{track}.html'>{track}</a></li>")
        f.write("</ul>")
        
        f.write("<h2>Drivers</h2><ul>")
        for driver in drivers:
            f.write(f"<li><a href='drivers/{driver}.html'>{driver}</a></li>")
        f.write("</ul>")
        
        f.write("</body></html>")

def main():
    times = load_times()
    if not times:
        print("No lap times found.")
        return

    generate_driver_pages(times)
    generate_track_pages(times)
    generate_index(times)
    print("✅ Export complete! Pages updated.")

if __name__ == "__main__":
    main()

