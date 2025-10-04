import os
import json
import datetime

# 📂 Folder where your lap files are saved
LAP_FOLDER = os.path.expanduser("~/Documents/Assetto Corsa/lap_times")  
OUTPUT_FILE = "times.json"

# ✅ Friendly track names (add more as needed)
TRACK_NAMES = {
    "KS_NURBURGRING-LAYOUT_GP_A": "Nürburgring GP",
    "KS_SILVERSTONE-NATIONAL": "Silverstone National",
    "AA_IMS-INDY500": "Indianapolis 500",
    "KS_VALLELUNGA-CLUB_CIRCUIT": "Vallelunga Club"
}

def parse_lap_file(filepath):
    """Parses a lap time file into a dict entry"""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            lines = f.read().strip().splitlines()
            if not lines:
                return None

            # Example: track,car,date,best_lap,laps,driver
            data = json.loads("".join(lines)) if lines[0].startswith("{") else None
            return data
    except Exception as e:
        print(f"❌ Error reading {filepath}: {e}")
        return None

def convert_time_to_seconds(time_str):
    """Convert lap time string (M:SS.mmm) to seconds for sorting"""
    try:
        mins, rest = time_str.split(":")
        secs = float(rest)
        return int(mins) * 60 + secs
    except:
        return float("inf")

def main():
    sessions = []

    # 🔎 Walk through the lap times folder
    for root, _, files in os.walk(LAP_FOLDER):
        for file in files:
            if file.endswith(".json"):  # assume AC exports json
                path = os.path.join(root, file)
                data = parse_lap_file(path)
                if data:
                    sessions.append(data)

    # 📊 Group by track → leaderboard
    leaderboard = {}
    for s in sessions:
        track = TRACK_NAMES.get(s["track"], s["track"])
        driver = s.get("driver", "Unknown")
        best = s.get("best_lap")

        if not track or not best:
            continue

        if track not in leaderboard:
            leaderboard[track] = []
        leaderboard[track].append({
            "driver": driver,
            "car": s.get("car", "Unknown"),
            "best_lap": best,
            "time_sec": convert_time_to_seconds(best),
            "date": s.get("date", str(datetime.datetime.now()))
        })

    # 🏆 Sort each track leaderboard by lap time
    for track in leaderboard:
        leaderboard[track].sort(key=lambda x: x["time_sec"])

    # 💾 Write final times.json
    output = {"leaderboard": leaderboard}
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)

    print(f"✅ Export complete! {OUTPUT_FILE} updated with {len(sessions)} sessions.")

if __name__ == "__main__":
    main()
