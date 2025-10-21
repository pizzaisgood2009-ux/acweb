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

# Sidebar for track selection
st.sidebar.title("Apex Times")

selected_tracks = {}
for sheet_name, df in data.items():
    tracks = df["track"].dropna().unique().tolist()
    selected = st.sidebar.selectbox(f"{sheet_name} Track", tracks)
    selected_tracks[sheet_name] = selected

# Title
st.title("🏁 Apex Times Podium & Results")

# Styling for podium cards
podium_style = """
<style>
.podium-container {
    display: flex;
    justify-content: center;
    align-items: flex-end;
    gap: 1.5rem;
    margin-top: 2rem;
    margin-bottom: 2rem;
}
.podium-card {
    flex: 1;
    text-align: center;
    border-radius: 12px;
    padding: 1rem;
    color: white;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.gold { background: linear-gradient(180deg, #FFD700, #DAA520); }
.silver { background: linear-gradient(180deg, #C0C0C0, #808080); }
.bronze { background: linear-gradient(180deg, #CD7F32, #8B4513); }
.first { height: 260px; }
.second { height: 220px; }
.third { height: 200px; }
.podium-rank {
    font-size: 1.6rem;
    font-weight: bold;
}
.podium-name {
    font-size: 1.2rem;
    margin-top: 0.5rem;
}
.podium-time {
    font-size: 1rem;
    margin-top: 0.25rem;
}
</style>
"""

st.markdown(podium_style, unsafe_allow_html=True)

# Display each selected track
for sheet, track in selected_tracks.items():
    df = data[sheet]
    filtered = df[df["track"] == track]

    st.subheader(f"📍 {sheet} — {track}")

    if "position" in filtered.columns:
        podium = filtered.sort_values("position").head(3)

        if len(podium) >= 3:
            # Assign order so 1st is center, 2nd left, 3rd right
            second = podium.iloc[1]
            first = podium.iloc[0]
            third = podium.iloc[2]

            st.markdown("""
            <div class="podium-container">
                <div class="podium-card silver second">
                    <div class="podium-rank">🥈 2nd</div>
                    <div class="podium-name">{}</div>
                    <div class="podium-time">{}</div>
                </div>
                <div class="podium-card gold first">
                    <div class="podium-rank">🥇 1st</div>
                    <div class="podium-name">{}</div>
                    <div class="podium-time">{}</div>
                </div>
                <div class="podium-card bronze third">
                    <div class="podium-rank">🥉 3rd</div>
                    <div class="podium-name">{}</div>
                    <div class="podium-time">{}</div>
                </div>
            </div>
            """.format(
                second.get("driver", "Unknown"), second.get("time", "-"),
                first.get("driver", "Unknown"), first.get("time", "-"),
                third.get("driver", "Unknown"), third.get("time", "-"),
            ), unsafe_allow_html=True)
        else:
            st.warning("Not enough racers for a full podium.")
    else:
        st.warning("No 'position' column found to create podium.")

    # Full table
    st.markdown("### 📊 Full Results Table")
    st.dataframe(filtered.reset_index(drop=True))
