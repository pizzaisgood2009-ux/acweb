import streamlit as st
import pandas as pd

st.set_page_config(page_title="Apex Times", layout="wide")

# Load Excel sheets
@st.cache_data
def load_data(file_path):
    sheets = pd.read_excel(file_path, sheet_name=None)
    valid_sheets = {}
    for name, df in sheets.items():
        if "track" in df.columns:
            valid_sheets[name] = df
    return valid_sheets

data = load_data("apex_times.xlsx")

st.sidebar.title("Apex Times")

selected_tracks = {}
for sheet_name, df in data.items():
    tracks = df["track"].dropna().unique().tolist()
    selected = st.sidebar.selectbox(f"{sheet_name} Track", tracks)
    selected_tracks[sheet_name] = selected

st.title("🏁 Apex Times Podium & Results")

for sheet, track in selected_tracks.items():
    df = data[sheet]
    filtered = df[df["track"] == track]

    st.subheader(f"📍 {sheet} — {track}")

    if "position" in filtered.columns:
        podium = filtered.sort_values("position").head(3)
        st.markdown("### 🏆 Podium")
        cols = st.columns(3)
        places = ["🥇", "🥈", "🥉"]
        for i, col in enumerate(cols):
            if i < len(podium):
                row = podium.iloc[i]
                name = row["driver"] if "driver" in row else "Unknown"
                time = row["time"] if "time" in row else "-"
                col.metric(label=f"{places[i]} {name}", value=f"{time}")
    else:
        st.warning("No 'position' column found to create podium.")

    st.markdown("### 📊 Full Results Table")
    st.dataframe(filtered.reset_index(drop=True))
