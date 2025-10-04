import os
import configparser
import json
from datetime import datetime

# ---------------------------
# CONFIGURATION
# ---------------------------
PERSONAL_BEST_PATH = r"C:\Users\pizza\OneDrive\Documents\Assetto Corsa\personalbest.ini"
OUTPUT_JSON_PATH = os.path.join("data", "times.json")

# ---------------------------
# HELPER FUNCTIONS
# ---------------------------
def clean_name(name):
    return name.replace("_", " ")

def time_to_str(ms):
    seconds = ms / 1000
    m = int(seconds // 60)
    s = seconds % 60
    return f"{m}:{s:06.3f}"

# ---------------------------
# LOAD PERSONAL BESTS
# ---------------------------
config = configparser.ConfigParser()
config.optionxform = str
config.read(PERSONAL_BEST_PATH)

sessions = []

for section in config.sections():
    track_name = section
    for key in config[section]:
        value = config[section][key]
        try:
            best_lap_ms, date_str = value.split(";")
            best_lap = time_to_str(int(best_lap_ms))
            car = key
            sessions.append({
                "track": track_name,
                "car": car,
                "date": date_str,
                "best_lap": best_lap,
                "laps": [best_lap],
                "driver": "Max"
            })
        except Exception as e:
            print(f"Skipping {key} in {section}: {e}")

# ---------------------------
# SAVE TO JSON
# ---------------------------
os.makedirs(os.path.dirname(OUTPUT_JSON_PATH), exist_ok=True)

with open(OUTPUT_JSON_PATH, "w") as f:
    json.dump({"sessions": sessions}, f, indent=2)

print(f"✅ times.json updated with {len(sessions)} sessions.")
