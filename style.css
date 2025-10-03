import json
import os

# Paths
DATA_FOLDER = "data"
INPUT_FILE = os.path.join(DATA_FOLDER, "times.json")
OUTPUT_FILE = os.path.join(DATA_FOLDER, "times_flat.json")

# Optional: map track file names to proper display names (used only if you want)
TRACK_NAMES = {
    "KS_NURBURGRING-LAYOUT_GP_A": "Nürburgring GP",
    "KS_SILVERSTONE-NATIONAL": "Silverstone National",
    "AA_IMS-INDY500": "Indianapolis 500",
    "KS_VALLELUNGA-CLUB_CIRCUIT": "Vallelunga Club Circuit"
}

def clean_name(name):
    """Replace underscores with spaces."""
    return name.replace("_", " ")

def main():
    # Read original times.json
    if not os.path.exists(INPUT_FILE):
        print(f"{INPUT_FILE} not found.")
        return

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    sessions = data.get("sessions", [])

    # Process each session
    flat_sessions = []
    for s in sessions:
        flat_sessions.append({
            "driver": s.get("driver", "Unknown"),
            "car": clean_name(s.get("car", "Unknown")),
            "track": TRACK_NAMES.get(s.get("track", ""), clean_name(s.get("track", "Unknown"))),
            "date": s.get("date", "Unknown"),
            "best_lap": s.get("best_lap", "N/A"),
            "laps": s.get("laps", [])
        })

    # Save flattened JSON
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump({"sessions": flat_sessions}, f, indent=2)

    print(f"Updated {OUTPUT_FILE} successfully!")

if __name__ == "__main__":
    main()
