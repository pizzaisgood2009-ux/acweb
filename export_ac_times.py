import json
import configparser
from pathlib import Path
from datetime import datetime

# CONFIG
DRIVER_NAME = "Max"  # <-- Change this for each driver
PB_FILE = Path.home() / "Documents" / "Assetto Corsa" / "cfg" / "personalbest.ini"
DATA_FILE = Path(__file__).parent / "data" / "times.json"

def load_existing():
    if DATA_FILE.exists():
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"sessions": []}

def parse_pb_file():
    config = configparser.ConfigParser()
    config.optionxform = str  # make keys case-sensitive
    config.read(PB_FILE, encoding="utf-8")

    sessions = []

    # Each section in personalbest.ini is usually a track name
    for section in config.sections():
        try:
            track = section
            car = config.get(section, "CAR", fallback="Unknown")
            best = config.get(section, "BEST", fallback="N/A")

            sessions.append({
                "track": track,
                "car": car,
                "date": datetime.now().strftime("%Y-%m-%d"),
                "best_lap": best,
                "laps": [best] if best != "N/A" else [],
                "driver": DRIVER_NAME
            })
        except Exception as e:
            print("Error parsing section:", section, e)

    return sessions

def main():
    existing = load_existing()
    sessions = existing["sessions"]

    new_sessions = parse_pb_file()
    for res in new_sessions:
        # Avoid duplicates: same driver + same track
        if not any(s["track"] == res["track"] and s["driver"] == res["driver"] for s in sessions):
            sessions.append(res)

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump({"sessions": sessions}, f, indent=2)

    print(f"✅ PBs uploaded for {DRIVER_NAME}")

if __name__ == "__main__":
    main()
