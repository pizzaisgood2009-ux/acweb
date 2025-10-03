@echo off
REM -------------------------
REM Step 1: Run the Python export script
REM -------------------------
python export_ac_times.py

REM -------------------------
REM Step 2: Commit and push changes to GitHub
REM -------------------------
cd /c/acweb-git

REM Add updated JSON file
git add data/times.json

REM Commit the changes
git commit -m "Update lap times"

REM Push to GitHub (you may need to enter your GitHub token first time)
git push origin main

echo ✅ Done! Your lap times are now online.
pause
