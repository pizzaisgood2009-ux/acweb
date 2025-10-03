🏎 Assetto Corsa Lap Times Tracker

A race car-themed web app to track personal best lap times for Assetto Corsa. Each driver has their own tab, and there’s a track-specific leaderboard tab to see who’s fastest on each track.

Features

Race car dashboard style: black background, red text, glowing headers

Tabs for each driver

Track Leaderboard tab with dropdown for each track

Automatic sorting of lap times (fastest first)

Easy updates via Python script

Getting Started
Requirements (for updating times)

Python 3: https://www.python.org/downloads/

Git: https://git-scm.com/downloads

Assetto Corsa PB file (personalbest.ini)

If you only want to view the leaderboard, no Python or Git is required. Just open the site in a browser.

Step 1 — Download the project

Go to the GitHub repo

Click Code → Download ZIP

Extract it to a folder, e.g., C:\acweb-git

Step 2 — Set your driver name

Open export_ac_times.py in a text editor

Change the driver name:

DRIVER_NAME = "YourName"


Save the file

Step 3 — Set your PB file path

In export_ac_times.py, find:

PB_FILE = Path("C:/Users/pizza/OneDrive/Documents/Assetto Corsa/personalbest.ini")


Replace pizza with your Windows username (or full path to your PB file)

Save the file

Step 4 — Run the Python script
cd /c/acweb-git
python export_ac_times.py


This updates data/times.json with your lap times

Step 5 — Update the website

Double-click update_site.bat

It will:

Run the Python script

Add and commit changes to Git

Push to GitHub

After a few seconds, your times will appear on the website

Step 6 — View the site

Open the GitHub Pages URL:

https://YOUR-USERNAME.github.io/acweb/


You should see:

Tabs for each driver

Track Leaderboard tab

Step 7 — Updating your times

Just run update_site.bat after improving your laps.

Your tab and the track leaderboard will update automatically.


Notes for Friends

To add your own lap times, you must have Python and Git installed

To just view the leaderboard, no installation is needed
