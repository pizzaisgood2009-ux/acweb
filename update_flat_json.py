import json

# Load exported times.json
with open("data/times.json", "r") as f:
    data = json.load(f)

# Flatten it (your original times.json has "sessions")
sessions = data.get("sessions", data)  # fallback in case it's already flat

# Save as times_flat.json
with open("data/times_flat.json", "w") as f:
    json.dump(sessions, f, indent=2)

print("times_flat.json updated!")
