import streamlit as st
import pandas as pd

st.set_page_config(page_title="Apex Times", layout="wide")

# Load all sheets from Excel file
@st.cache_data
def load_data(file_path):
    sheets = pd.read_excel(file_path, sheet_name=None)
    return {name: df for name, df in sheets.items() if 'track' in df.columns}

data = load_data("apex_times.xlsx")

# Sidebar dropdown for each sheet, showing only track column
st.sidebar.title("Apex Times")

selected_tracks = {}
for sheet_name, df in data.items():
    tracks = df["track"].dropna().unique().tolist()
    selected = st.sidebar.selectbox(f"{sheet_name} Track", tracks)
    selected_tracks[sheet_name] = selected

# Display selections
st.title("Selected Tracks")
for sheet, track in selected_tracks.items():
    st.write(f"**{sheet}**: {track}")
