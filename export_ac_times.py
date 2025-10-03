import configparser
import json
from pathlib import Path
from datetime import datetime

# ===== CONFIG =====
DRIVER_NAME = "Max"  # <-- Change this for each driver

# <-- REPLACE THIS PATH with your actual username if different -->
PB_FILE = Path("C:/Users/pizza/OneDrive/Documents/Assetto Corsa/personalbest.ini")

DATA_FILE = Path(__file__).parent / "data" / "times.json"

# ===== FUNCTIONS =====
def ms_to_time(ms):
    if ms == 0:
        return "N/A"
    minutes = ms // 60000
    seconds = (ms % 60000) / 1000
    return f"{minutes}:{seconds:06.3f}"

def load_existing():
    if DATA_FILE.exists():
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"sessions": []}

def parse_pb_file():
    if not PB_FILE.exists():
        print(f"❌ PB file not found at {PB_FILE}")
        return []

    config = configparser.ConfigParser()
    config.optionxform = str  # preserve case
    config.read(PB_FILE, encoding="utf-8")

    sessions = []

    for section in config.sections():
        try:
            car, track = section.split("@")
            time_ms = int(config.get(section, "TIME", fallback="0"))
            date_ms = int(config.get(section, "DATE", fallback="0"))

            # convert timestamp to readable date
            date_str = datetime.utcfromtimestamp(date_ms / 1000).strftime("%Y-%m-%d %H:%M:%S")

            sessions.append({
                "track": track,
                "car": car,
                "date": date_str,
                "best_lap": ms_to_time(time_ms),
                "laps": [ms_to_time(time_ms)] if time_ms > 0 else [],
                "driver": DRIVER_NAME
            })
        except Exception as e:
            print("Error parsing section:", section, e)

    return sessions

def main():
    print("PB file exists?", PB_FILE.exists())
    existing = load_existing()
    sessions = existing["sessions"]

    new_sessions = parse_pb_file()

    # avoid duplicates: same driver + same track
    for res in new_sessions:
        if not any(s["track"] == res["track"] and s["driver"] == res["driver"] for s in sessions):
            sessions.append(res)

    # save to times.json
    DATA_FILE.parent.mkdir(exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump({"sessions": sessions}, f, indent=2)

    print(f"✅ PBs exported for {DRIVER_NAME}")
    input("Press Enter to close...")  # keeps the window open if double-clicked

if __name__ == "__main__":
    main()
