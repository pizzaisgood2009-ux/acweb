import os
import json
import configparser

# --- Paths ---
DATA_FILE = "data/times.json"
EXPORT_DIR = "export"
DRIVERS_DIR = os.path.join(EXPORT_DIR, "drivers")
TRACKS_DIR = os.path.join(EXPORT_DIR, "tracks")
INI_FILE = r"C:\Users\pizza\OneDrive\Documents\Assetto Corsa\personalbest.ini"

# --- Ensure folders exist ---
os.makedirs("data", exist_ok=True)
os.makedirs(EXPORT_DIR, exist_ok=True)
os.makedirs(DRIVERS_DIR, exist_ok=True)
os.makedirs(TRACKS_DIR, exist_ok=True)

# --- Load personalbest.ini ---
cfg = configparser.ConfigParser()
cfg.read(INI_FILE)

sessions = []

# Each section in the INI corresponds to a track/car combination
for track, lap in cfg.items("BEST_LAPS"):
    sessions.append({
        "track": track,
        "car": "Unknown",       # INI may not have car names, can edit manually if needed
        "date": "N/A",
        "best_lap": lap,
        "laps": [lap],
        "driver": "Max"
    })

# --- Save to times.json ---
with open(DATA_FILE, "w") as f:
    json.dump({"sessions": sessions}, f, indent=2)
print("✅ times.json updated")

# --- Helper functions ---
def clean_name(name):
    return name.replace("_", " ")

def lap_to_seconds(lap):
    mins, secs = lap.split(":")
    return int(mins)*60 + float(secs)

# --- Generate driver pages ---
drivers = {}
for s in sessions:
    driver = s["driver"]
    drivers.setdefault(driver, []).append(s)

STYLE = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500&display=swap');
body { font-family: 'Orbitron', sans-serif; background:#000; color:#eee; margin:0; padding:0; }
header { background:#0a0a0a; padding:15px; text-align:center; border-bottom:2px solid #ff0000; }
header h1 { font-size:2em; color:#ff0000; letter-spacing:2px; }
main { padding:20px; }
table { width:100%; border-collapse:collapse; margin-top:15px; background:#111; border:1px solid #222; border-radius:8px; }
th, td { padding:10px; text-align:left; }
th { background:#111; color:#ff0000; text-transform:uppercase; border-bottom:2px solid #ff0000; }
tr:nth-child(even){background:#0d0d0d;} tr:nth-child(odd){background:#111;}
tr.fastest{color:#00ff00;font-weight:bold;}
a{color:#ff0000; text-decoration:none;}
a:hover{text-decoration:underline;}
</style>
"""

for driver, laps in drivers.items():
    laps.sort(key=lambda x: lap_to_seconds(x["best_lap"]))
    html = f"<html><head>{STYLE}<title>{driver}</title></head><body>"
    html += f"<header><h1>{driver}</h1></header>"
    html += "<main><table><tr><th>Car</th><th>Track</th><th>Date</th><th>Best Lap</th></tr>"
    for lap in laps:
        html += f"<tr><td>{clean_name(lap['car'])}</td><td>{clean_name(lap['track'])}</td><td>{lap['date']}</td><td>{lap['best_lap']}</td></tr>"
    html += "</table></main></body></html>"
    with open(os.path.join(DRIVERS_DIR, f"{driver}.html"), "w") as f:
        f.write(html)

# --- Generate track pages ---
tracks = {}
for s in sessions:
    track = s["track"]
    tracks.setdefault(track, []).append(s)

for track, laps in tracks.items():
    laps.sort(key=lambda x: lap_to_seconds(x["best_lap"]))
    html = f"<html><head>{STYLE}<title>{track}</title></head><body>"
    html += f"<header><h1>{clean_name(track)} Leaderboard</h1></header>"
    html += "<main><table><tr><th>Pos</th><th>Driver</th><th>Car</th><th>Best Lap</th></tr>"
    for i, lap in enumerate(laps, 1):
        cls = "fastest" if i == 1 else ""
        html += f"<tr class='{cls}'><td>{i}</td><td>{lap['driver']}</td><td>{clean_name(lap['car'])}</td><td>{lap['best_lap']}</td></tr>"
    html += "</table></main></body></html>"
    with open(os.path.join(TRACKS_DIR, f"{track}.html"), "w") as f:
        f.write(html)

# --- Generate main index.html ---
html = f"<html><head>{STYLE}<title>AC Racing Leaderboards</title></head><body>"
html += "<header><h1>AC Racing Leaderboards</h1></header><main>"
html += "<h2>Drivers</h2><ul>"
for driver in sorted(drivers.keys()):
    html += f"<li><a href='drivers/{driver}.html'>{driver}</a></li>"
html += "</ul>"
html += "<h2>Tracks</h2><ul>"
for track in sorted(tracks.keys()):
    html += f"<li><a href='tracks/{track}.html'>{clean_name(track)}</a></li>"
html += "</ul></main></body></html>"

with open(os.path.join(EXPORT_DIR, "index.html"), "w") as f:
    f.write(html)

print("✅ Website exported successfully! Open export/index.html to view it.")
