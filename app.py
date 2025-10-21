from flask import Flask, render_template, jsonify
import pandas as pd
import requests
from io import StringIO

app = Flask(__name__)

# Google Sheets CSV links
sheet_links = {
    "F1": "https://docs.google.com/spreadsheets/d/e/2PACX-1vSSQ9Zn5aGGooGR9EuRmmMW-08_hlcYR7uB3_au3_tD94jialyB8c_olGXYpQvhf2nMnw7Yd-10IVDu/pub?output=csv",
    "IMSA GT3": "https://docs.google.com/spreadsheets/d/e/2PACX-1vTcbp-Zy1fdIUZxUre2UFF7ibRCTscw1tMQ0G91rdDbTDmjKH8-MF-y1H3tJJEZxXLELIi0r_5zchBV/pub?output=csv",
    "IMSA LMP2": "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3Sq5RbkXrtMKvVPZS8jZGZu_nN4_J7Eddy-7FmV4wo0QnG_YZb5clpx0TiqDT3DN1S56_VagmRp3P/pub?output=csv",
    "IndyCar": "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7Gfb8BPrv0HhxptUTq6pJmjVHSYIriySGawJa5iNwV_Wz_aj_xs1SHLIZU2RCxgQErF1eXnEBkUQv/pub?output=csv",
    "NASCAR": "https://docs.google.com/spreadsheets/d/e/2PACX-1vSH5c-BTz-ZfoJ3Rf58Q4eU9VBvsdq0XnsA99_qJM2Bvdqaq6Ex033d5gH57SQdcOm6haTNL3xi2Koh/pub?output=csv",
    "For Fun": "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0L2HtZ0QC3ZlIpCwOrzGVQY0cOUDGaQj2DtBNQuqvLKwQ4sLfRmAcb5LG4H9Q3D1CFkilV5QdIwge/pub?output=csv"
}

def get_csv_data(url):
    """Fetch and read a Google Sheet CSV."""
    try:
        csv_data = requests.get(url).content.decode('utf-8')
        df = pd.read_csv(StringIO(csv_data))
        df.columns = df.columns.str.strip()  # Clean header names
        return df
    except Exception as e:
        print(f"Error loading sheet: {e}")
        return pd.DataFrame()

@app.route('/')
def index():
    return render_template('index.html', sheets=list(sheet_links.keys()))

@app.route('/tracks/<sheet>')
def get_tracks(sheet):
    df = get_csv_data(sheet_links[sheet])
    if df.empty:
        return jsonify([])
    
    if 'track' in df.columns:
        tracks = df['track'].dropna().unique().tolist()
    elif 'Track' in df.columns:
        tracks = df['Track'].dropna().unique().tolist()
    else:
        tracks = []
    return jsonify(tracks)

@app.route('/results/<sheet>/<track>')
def get_results(sheet, track):
    df = get_csv_data(sheet_links[sheet])
    if df.empty:
        return jsonify({})
    
    df = df[df['track'].astype(str).str.lower() == track.lower()]

    results = {}
    if sheet == "For Fun":
        results["table"] = df.to_dict(orient="records")
    elif sheet == "NASCAR":
        results["winner"] = df["Race Winner"].iloc[0] if "Race Winner" in df else None
        results["second"] = df["2nd Place"].iloc[0] if "2nd Place" in df else None
        results["third"] = df["3rd Place"].iloc[0] if "3rd Place" in df else None
        results["table"] = df.iloc[:, 3:].to_dict(orient="records")
        results["stage1"] = df["Stage 1 Winner"].iloc[0] if "Stage 1 Winner" in df else None
        results["stage2"] = df["Stage 2 Winner"].iloc[0] if "Stage 2 Winner" in df else None
    else:
        results["winner"] = df["Winner"].iloc[0] if "Winner" in df else None
        results["second"] = df["2nd Place"].iloc[0] if "2nd Place" in df else None
        results["third"] = df["3rd Place"].iloc[0] if "3rd Place" in df else None
        results["table"] = df.iloc[:, 3:].to_dict(orient="records")
    
    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True)
